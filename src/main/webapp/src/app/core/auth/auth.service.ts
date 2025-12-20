import { Injectable, signal, computed } from '@angular/core';
import type Keycloak from 'keycloak-js';
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
  private initPromise: Promise<boolean> | null = null;
  private readonly _isAuthenticated = signal(false);
  private readonly _user = signal<User | null>(null);
  private readonly _token = signal<string | null>(null);
  private readonly _initialized = signal(false);
  private readonly _callbackFailed = signal(false);

  readonly isAuthenticated = this._isAuthenticated.asReadonly();
  readonly user = this._user.asReadonly();
  readonly token = this._token.asReadonly();
  readonly initialized = this._initialized.asReadonly();
  readonly callbackFailed = this._callbackFailed.asReadonly();

  readonly isAdmin = computed(() => this.hasRole('admin'));
  readonly isJobManager = computed(() => this.hasRole('job_manager'));
  readonly isProfessor = computed(() => this.hasRole('professor'));
  readonly isEmployee = computed(() => this.hasRole('employee'));

  /**
   * Check if URL contains OAuth callback parameters (supports both standard and implicit flow)
   */
  private hasOAuthCallback(): boolean {
    const hash = window.location.hash;
    const search = window.location.search;
    return (
      hash.includes('code=') ||
      hash.includes('access_token=') ||
      hash.includes('error=') ||
      search.includes('code=') ||
      search.includes('error=')
    );
  }

  /**
   * Initialize Keycloak - only processes OAuth callback if present
   */
  async init(): Promise<boolean> {
    // Return existing promise if already initializing
    if (this.initPromise) {
      return this.initPromise;
    }

    // Skip initialization if no OAuth callback and already checked
    if (this._initialized() && !this.hasOAuthCallback()) {
      return this._isAuthenticated();
    }

    this.initPromise = this.doInit();
    return this.initPromise;
  }

  /**
   * Detect OAuth flow based on callback parameters.
   * Standard flow: code in query string
   * Implicit flow: access_token in hash
   * Hybrid/misconfigured: code in hash (try implicit)
   */
  private detectFlow(): 'standard' | 'implicit' {
    const hash = window.location.hash;
    const search = window.location.search;

    // Standard flow: code in query string
    if (search.includes('code=')) {
      return 'standard';
    }
    // Implicit flow or hybrid: tokens or code in hash
    if (hash.includes('access_token=') || hash.includes('code=')) {
      return 'implicit';
    }
    // Default to standard (with PKCE) for new logins
    return 'standard';
  }

  private async doInit(): Promise<boolean> {
    const hadCallback = this.hasOAuthCallback();
    const flow = this.detectFlow();

    const KeycloakClass = (await import('keycloak-js')).default;
    this.keycloak = new KeycloakClass({
      url: environment.keycloak.url,
      realm: environment.keycloak.realm,
      clientId: environment.keycloak.clientId,
    });

    try {
      const initOptions: { flow: 'standard' | 'implicit'; pkceMethod?: 'S256' } = { flow };
      if (flow === 'standard') {
        initOptions.pkceMethod = 'S256';
      }

      const authenticated = await this.keycloak.init(initOptions);

      // Always clean URL after processing callback to prevent loops
      if (hadCallback) {
        window.history.replaceState({}, '', window.location.pathname);
      }

      if (authenticated) {
        this.updateUserInfo();
        this.setupTokenRefresh();
      }

      this._isAuthenticated.set(authenticated);
      this._initialized.set(true);
      this._callbackFailed.set(hadCallback && !authenticated);
      return authenticated;
    } catch (error) {
      console.error('Keycloak initialization failed:', error);
      // Clean URL even on error to prevent loops
      if (hadCallback) {
        window.history.replaceState({}, '', window.location.pathname);
      }
      this._isAuthenticated.set(false);
      this._initialized.set(true);
      this._callbackFailed.set(hadCallback);
      return false;
    }
  }

  async login(redirectUri?: string): Promise<void> {
    if (!this.keycloak) {
      await this.init();
    }
    await this.keycloak?.login({
      redirectUri: redirectUri ?? window.location.origin + '/positions',
    });
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
    const resourceAccess = tokenParsed['resource_access'] as
      | Record<string, { roles: string[] }>
      | undefined;
    const clientRoles = resourceAccess?.[environment.keycloak.clientId]?.roles ?? [];
    const realmRoles =
      (tokenParsed['realm_access'] as { roles: string[] } | undefined)?.roles ?? [];

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
