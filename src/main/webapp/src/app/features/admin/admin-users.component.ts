import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Card } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { Checkbox } from 'primeng/checkbox';
import { Button } from 'primeng/button';
import { UserService, UserDTO, SecurityStore } from '../../core/security';

const AVAILABLE_ROLES = ['admin', 'job_manager', 'professor', 'employee'] as const;

@Component({
  selector: 'app-admin-users',
  imports: [FormsModule, Card, TableModule, Checkbox, Button],
  template: `
    <div class="admin-users-page">
      <p-card>
        <ng-template #header>
          <div class="card-header">
            <h2>User Management</h2>
            <p-button
              label="Refresh"
              icon="pi pi-refresh"
              [outlined]="true"
              (onClick)="loadUsers()"
            />
          </div>
        </ng-template>

        @if (loading()) {
          <div class="loading">Loading users...</div>
        } @else {
          <p-table [value]="users()" [tableStyle]="{ 'min-width': '60rem' }">
            <ng-template #header>
              <tr>
                <th>Name</th>
                <th>University ID</th>
                <th>Email</th>
                <th>Roles</th>
                <th>Actions</th>
              </tr>
            </ng-template>
            <ng-template #body let-user>
              <tr>
                <td>{{ user.firstName }} {{ user.lastName }}</td>
                <td>{{ user.universityId }}</td>
                <td>{{ user.email }}</td>
                <td>
                  <div class="roles-container">
                    @for (role of availableRoles; track role) {
                      <div class="role-checkbox">
                        <p-checkbox
                          [binary]="true"
                          [ngModel]="hasRole(user, role)"
                          (ngModelChange)="toggleRole(user, role, $event)"
                          [inputId]="user.id + '-' + role"
                        />
                        <label [for]="user.id + '-' + role">{{ formatRole(role) }}</label>
                      </div>
                    }
                  </div>
                </td>
                <td>
                  <p-button
                    label="Save"
                    icon="pi pi-check"
                    size="small"
                    [disabled]="!hasChanges(user)"
                    (onClick)="saveUser(user)"
                  />
                </td>
              </tr>
            </ng-template>
          </p-table>
        }
      </p-card>
    </div>
  `,
  styles: `
    .admin-users-page {
      padding: 1rem;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;

      h2 {
        margin: 0;
      }
    }

    .loading {
      padding: 2rem;
      text-align: center;
      color: var(--p-text-muted-color);
    }

    .roles-container {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .role-checkbox {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminUsersComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly securityStore = inject(SecurityStore);

  readonly users = signal<UserDTO[]>([]);
  readonly loading = signal(false);
  readonly availableRoles = AVAILABLE_ROLES;

  private pendingChanges = new Map<string, Set<string>>();

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.pendingChanges.clear();
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.users.set(users);
        // Initialize pending changes with current roles
        users.forEach((user) => {
          this.pendingChanges.set(user.id, new Set(user.roles));
        });
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  hasRole(user: UserDTO, role: string): boolean {
    return this.pendingChanges.get(user.id)?.has(role) ?? false;
  }

  toggleRole(user: UserDTO, role: string, checked: boolean): void {
    const roles = this.pendingChanges.get(user.id) ?? new Set<string>();
    if (checked) {
      roles.add(role);
    } else {
      roles.delete(role);
    }
    this.pendingChanges.set(user.id, roles);
  }

  hasChanges(user: UserDTO): boolean {
    const pending = this.pendingChanges.get(user.id);
    if (!pending) return false;

    const original = new Set(user.roles);
    if (pending.size !== original.size) return true;

    for (const role of pending) {
      if (!original.has(role)) return true;
    }
    return false;
  }

  saveUser(user: UserDTO): void {
    const roles = Array.from(this.pendingChanges.get(user.id) ?? []);
    this.userService.updateUserRoles(user.id, roles).subscribe({
      next: (updatedUser) => {
        // Update the user in the list
        this.users.update((users) =>
          users.map((u) => (u.id === updatedUser.id ? updatedUser : u))
        );
        // Update pending changes to match saved state
        this.pendingChanges.set(updatedUser.id, new Set(updatedUser.roles));

        // If the current user's roles were updated, refresh the page to update permissions
        if (updatedUser.id === this.securityStore.user()?.id) {
          window.location.reload();
        }
      },
      error: (err) => {
        console.error('Failed to update user roles:', err);
      },
    });
  }

  formatRole(role: string): string {
    return role
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
