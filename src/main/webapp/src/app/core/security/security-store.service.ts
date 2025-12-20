import { inject, Injectable, PLATFORM_ID, signal, computed } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { KeycloakService } from './keycloak.service';
import { environment } from '../../../environments/environment';

export interface User {
  id: string;
  universityId: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

@Injectable({ providedIn: 'root' })
export class SecurityStore {
  private readonly keycloakService = inject(KeycloakService);
  private readonly http = inject(HttpClient);

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
      await this.fetchUserFromBackend();
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

  private async fetchUserFromBackend(): Promise<void> {
    try {
      const user = await firstValueFrom(
        this.http.get<User>(`${environment.apiUrl}/v2/users/me`)
      );
      this.user.set(user);
    } catch (error) {
      console.error('Failed to fetch user from backend:', error);
      this.user.set(undefined);
    }
  }
}
