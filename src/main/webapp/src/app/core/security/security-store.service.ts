import { inject, Injectable, PLATFORM_ID, signal, computed } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { KeycloakService } from './keycloak.service';
import { environment } from '../../../environments/environment';

export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

@Injectable({ providedIn: 'root' })
export class SecurityStore {
  private readonly keycloakService = inject(KeycloakService);

  isLoading = signal(false);
  user = signal<User | undefined>(undefined);

  readonly isAdmin = computed(() => this.hasRole('admin'));
  readonly isJobManager = computed(() => this.hasRole('job_manager'));
  readonly isProfessor = computed(() => this.hasRole('professor'));
  readonly isEmployee = computed(() => this.hasRole('employee'));

  constructor() {
    this.onInit();
  }

  async onInit() {
    const isServer = isPlatformServer(inject(PLATFORM_ID));
    if (isServer) {
      this.user.set(undefined);
      return;
    }
    this.isLoading.set(true);

    const isLoggedIn = await this.keycloakService.init();

    if (isLoggedIn) {
      this.updateUserFromToken();
    }
    this.isLoading.set(false);
  }

  async signIn(returnUrl?: string) {
    await this.keycloakService.login(returnUrl);
  }

  async signOut() {
    await this.keycloakService.logout();
    this.user.set(undefined);
  }

  hasRole(role: string): boolean {
    return this.user()?.roles.includes(role) ?? false;
  }

  get token() {
    return this.keycloakService.bearer;
  }

  private updateUserFromToken(): void {
    const keycloak = this.keycloakService.keycloak;
    if (!keycloak?.tokenParsed) {
      return;
    }

    const tokenParsed = keycloak.tokenParsed as Record<string, unknown>;
    const resourceAccess = tokenParsed['resource_access'] as
      | Record<string, { roles: string[] }>
      | undefined;
    const clientRoles = resourceAccess?.[environment.keycloak.clientId]?.roles ?? [];
    const realmRoles =
      (tokenParsed['realm_access'] as { roles: string[] } | undefined)?.roles ?? [];

    this.user.set({
      id: tokenParsed['sub'] as string,
      username: tokenParsed['preferred_username'] as string,
      email: tokenParsed['email'] as string,
      firstName: tokenParsed['given_name'] as string,
      lastName: tokenParsed['family_name'] as string,
      roles: [...new Set([...clientRoles, ...realmRoles])],
    });
  }
}
