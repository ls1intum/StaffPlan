import { Injectable, signal, computed } from '@angular/core';
import Keycloak from 'keycloak-js';
import { environment } from '../../../environments/environment';

export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private keycloak: Keycloak | null = null;
  private readonly _isAuthenticated = signal(false);
  private readonly _user = signal<User | null>(null);
  private readonly _token = signal<string | null>(null);

  readonly isAuthenticated = this._isAuthenticated.asReadonly();
  readonly user = this._user.asReadonly();
  readonly token = this._token.asReadonly();

  readonly isAdmin = computed(() => this.hasRole('admin'));
  readonly isJobManager = computed(() => this.hasRole('job_manager'));
  readonly isProfessor = computed(() => this.hasRole('professor'));
  readonly isEmployee = computed(() => this.hasRole('employee'));

  async init(): Promise<boolean> {
    this.keycloak = new Keycloak({
      url: environment.keycloak.url,
      realm: environment.keycloak.realm,
      clientId: environment.keycloak.clientId,
    });

    try {
      const authenticated = await this.keycloak.init({
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri: window.location.origin + '/assets/silent-check-sso.html',
        pkceMethod: 'S256',
      });

      if (authenticated) {
        this.updateUserInfo();
        this.setupTokenRefresh();
      }

      this._isAuthenticated.set(authenticated);
      return authenticated;
    } catch (error) {
      console.error('Keycloak initialization failed:', error);
      this._isAuthenticated.set(false);
      return false;
    }
  }

  async login(): Promise<void> {
    if (!this.keycloak) {
      await this.init();
    }
    await this.keycloak?.login();
  }

  async logout(): Promise<void> {
    await this.keycloak?.logout({
      redirectUri: window.location.origin,
    });
    this._isAuthenticated.set(false);
    this._user.set(null);
    this._token.set(null);
  }

  async getToken(): Promise<string | undefined> {
    if (!this.keycloak) {
      return undefined;
    }

    try {
      await this.keycloak.updateToken(30);
      this._token.set(this.keycloak.token ?? null);
      return this.keycloak.token;
    } catch {
      await this.login();
      return undefined;
    }
  }

  hasRole(role: string): boolean {
    return this._user()?.roles.includes(role) ?? false;
  }

  private updateUserInfo(): void {
    if (!this.keycloak?.tokenParsed) {
      return;
    }

    const tokenParsed = this.keycloak.tokenParsed as Record<string, unknown>;
    const resourceAccess = tokenParsed['resource_access'] as Record<string, { roles: string[] }> | undefined;
    const clientRoles = resourceAccess?.[environment.keycloak.clientId]?.roles ?? [];
    const realmRoles = (tokenParsed['realm_access'] as { roles: string[] } | undefined)?.roles ?? [];

    this._user.set({
      id: tokenParsed['sub'] as string,
      username: tokenParsed['preferred_username'] as string,
      email: tokenParsed['email'] as string,
      firstName: tokenParsed['given_name'] as string,
      lastName: tokenParsed['family_name'] as string,
      roles: [...new Set([...clientRoles, ...realmRoles])],
    });

    this._token.set(this.keycloak.token ?? null);
  }

  private setupTokenRefresh(): void {
    if (this.keycloak) {
      this.keycloak.onTokenExpired = () => {
        this.keycloak?.updateToken(30).then((refreshed) => {
          if (refreshed) {
            this._token.set(this.keycloak?.token ?? null);
          }
        });
      };
    }
  }
}
