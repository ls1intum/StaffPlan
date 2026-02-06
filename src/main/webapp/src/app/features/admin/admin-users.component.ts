import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { Checkbox, CheckboxChangeEvent } from 'primeng/checkbox';
import { Button } from 'primeng/button';
import { Tag } from 'primeng/tag';
import { Tooltip } from 'primeng/tooltip';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { Dialog } from 'primeng/dialog';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Toast } from 'primeng/toast';
import { UserService, UserDTO, SecurityStore, CreateUserDTO } from '../../core/security';

const AVAILABLE_ROLES = ['admin', 'job_manager', 'professor', 'employee'] as const;

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrator',
  job_manager: 'Stellenverwalter',
  professor: 'Professor',
  employee: 'Mitarbeiter',
};

const ROLE_OPTIONS = [
  { label: 'Alle Rollen', value: null },
  { label: 'Administrator', value: 'admin' },
  { label: 'Stellenverwalter', value: 'job_manager' },
  { label: 'Professor', value: 'professor' },
  { label: 'Mitarbeiter', value: 'employee' },
];

@Component({
  selector: 'app-admin-users',
  imports: [
    ReactiveFormsModule,
    DatePipe,
    TableModule,
    Checkbox,
    Button,
    Tag,
    Tooltip,
    InputText,
    Select,
    IconField,
    InputIcon,
    Dialog,
    ConfirmDialog,
    Toast,
  ],
  providers: [ConfirmationService, MessageService],
  template: `
    <div class="admin-users-page">
      <div class="page-header">
        <div class="header-left">
          <h2>Benutzerverwaltung</h2>
          <p-iconfield class="search-field">
            <p-inputicon styleClass="pi pi-search" />
            <input
              pInputText
              type="text"
              placeholder="Suchen..."
              [formControl]="searchControl"
            />
          </p-iconfield>
          <p-select
            [options]="roleOptions"
            [formControl]="roleFilterControl"
            optionLabel="label"
            optionValue="value"
            placeholder="Rolle filtern"
            styleClass="role-filter"
          />
        </div>
        <div class="header-actions">
          <p-button
            label="Aktualisieren"
            icon="pi pi-refresh"
            [outlined]="true"
            (onClick)="loadUsers()"
          />
          <p-button label="Hinzufügen" icon="pi pi-plus" (onClick)="openCreateDialog()" />
        </div>
      </div>

      <div class="table-container">
        <p-table
          [value]="users()"
          [lazy]="true"
          [paginator]="true"
          [rows]="pageSize()"
          [totalRecords]="totalRecords()"
          [rowsPerPageOptions]="[10, 20, 50, 100]"
          [loading]="loading()"
          [scrollable]="true"
          scrollHeight="flex"
          (onLazyLoad)="onLazyLoad($event)"
        >
          <ng-template #header>
            <tr>
              <th>Name</th>
              <th>Kennung</th>
              <th>E-Mail</th>
              <th>Letzter Login</th>
              <th>Rollen</th>
              <th>Aktionen</th>
            </tr>
          </ng-template>
          <ng-template #body let-user>
            <tr>
              <td>{{ user.firstName }} {{ user.lastName }}</td>
              <td>{{ user.universityId }}</td>
              <td>{{ user.email }}</td>
              <td>
                @if (user.lastLoginAt) {
                  <span
                    class="login-date"
                    [pTooltip]="(user.lastLoginAt | date: 'dd.MM.yyyy HH:mm:ss') ?? ''"
                  >
                    {{ user.lastLoginAt | date: 'dd.MM.yyyy' }}
                  </span>
                } @else {
                  <p-tag
                    value="Nie angemeldet"
                    severity="secondary"
                    pTooltip="Benutzer wurde importiert, hat sich aber noch nie angemeldet"
                  />
                }
              </td>
              <td>
                <div class="roles-container">
                  @for (role of availableRoles; track role) {
                    <div class="role-checkbox">
                      <p-checkbox
                        [binary]="true"
                        [modelValue]="hasRole(user, role)"
                        (onChange)="toggleRole(user, role, $event)"
                        [inputId]="user.id + '-' + role"
                      />
                      <label [for]="user.id + '-' + role">{{ formatRole(role) }}</label>
                    </div>
                  }
                </div>
              </td>
              <td>
                <div class="action-buttons">
                  <p-button
                    label="Speichern"
                    icon="pi pi-check"
                    size="small"
                    [disabled]="!hasChanges(user)"
                    (onClick)="saveUser(user)"
                  />
                  <p-button
                    icon="pi pi-trash"
                    severity="danger"
                    size="small"
                    [rounded]="true"
                    [text]="true"
                    pTooltip="Benutzer löschen"
                    (onClick)="confirmDelete(user)"
                  />
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template #emptymessage>
            <tr>
              <td colspan="6" class="empty-message">Keine Benutzer gefunden.</td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </div>

    <p-dialog
      header="Benutzer erstellen"
      [(visible)]="dialogVisible"
      [modal]="true"
      [style]="{ width: '500px' }"
    >
      <div class="form-grid" [formGroup]="createForm">
        <div class="form-field">
          <label for="create-universityId">Kennung *</label>
          <input
            pInputText
            id="create-universityId"
            formControlName="universityId"
            placeholder="z.B. ab12cde"
          />
        </div>
        <div class="form-field">
          <label for="create-firstName">Vorname *</label>
          <input
            pInputText
            id="create-firstName"
            formControlName="firstName"
            placeholder="Vorname"
          />
        </div>
        <div class="form-field">
          <label for="create-lastName">Nachname *</label>
          <input
            pInputText
            id="create-lastName"
            formControlName="lastName"
            placeholder="Nachname"
          />
        </div>
        <div class="form-field">
          <label for="create-email">E-Mail</label>
          <input
            pInputText
            id="create-email"
            type="email"
            formControlName="email"
            placeholder="E-Mail-Adresse"
          />
        </div>
        <div class="form-field">
          <span class="field-label">Rollen</span>
          <div class="roles-container">
            @for (role of availableRoles; track role) {
              <div class="role-checkbox">
                <p-checkbox
                  [binary]="true"
                  [modelValue]="formRoles().has(role)"
                  (onChange)="toggleFormRole(role, $event)"
                  [inputId]="'create-role-' + role"
                />
                <label [for]="'create-role-' + role">{{ formatRole(role) }}</label>
              </div>
            }
          </div>
        </div>
      </div>
      <ng-template #footer>
        <p-button label="Abbrechen" [text]="true" (onClick)="closeDialog()" />
        <p-button
          label="Erstellen"
          icon="pi pi-check"
          [disabled]="!isFormValid()"
          (onClick)="createUser()"
        />
      </ng-template>
    </p-dialog>

    <p-confirmDialog />
    <p-toast />
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
    }

    .admin-users-page {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      padding: 1rem;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 1rem;

      h2 {
        margin: 0;
      }

      .header-left {
        display: flex;
        align-items: center;
        gap: 1rem;
        flex-wrap: wrap;
      }

      .search-field {
        input {
          width: 250px;
        }
      }
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .role-filter {
      width: 180px;
    }

    .table-container {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      border: 1px solid var(--p-surface-200);
      border-radius: 8px;
      overflow: hidden;
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

    .action-buttons {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .login-date {
      color: var(--p-text-color);
      cursor: default;
    }

    .empty-message {
      text-align: center;
      padding: 2rem;
      color: var(--p-text-muted-color);
    }

    .form-grid {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;

      label,
      .field-label {
        font-weight: 600;
        font-size: 0.875rem;
      }

      input {
        width: 100%;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class AdminUsersComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly securityStore = inject(SecurityStore);
  private readonly destroyRef = inject(DestroyRef);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly users = signal<UserDTO[]>([]);
  readonly loading = signal(false);
  readonly totalRecords = signal(0);
  readonly pageSize = signal(20);
  readonly currentPage = signal(0);
  readonly searchTerm = signal('');
  readonly filterRole = signal<string | null>(null);

  // Reactive form controls for filters
  readonly searchControl = this.fb.control('');
  readonly roleFilterControl = this.fb.control<string | null>(null);

  // Reactive form for create dialog
  readonly createForm = this.fb.group({
    universityId: '',
    firstName: '',
    lastName: '',
    email: '',
  });

  // Track roles separately as a signal (Set is not compatible with FormControl)
  readonly formRoles = signal(new Set<string>());

  // Signal-based form validity tracking
  private readonly createFormValues = signal({ universityId: '', firstName: '', lastName: '', email: '' });
  readonly isFormValid = computed(() => {
    const values = this.createFormValues();
    return (
      values.universityId.trim().length > 0 &&
      values.firstName.trim().length > 0 &&
      values.lastName.trim().length > 0
    );
  });

  readonly dialogVisible = signal(false);

  readonly availableRoles = AVAILABLE_ROLES;
  readonly roleOptions = ROLE_OPTIONS;

  private readonly pendingChanges = signal(new Map<string, Set<string>>());

  ngOnInit(): void {
    // Set up debounced search from reactive form control
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((term) => {
        this.searchTerm.set(term);
        this.currentPage.set(0);
        this.loadUsers();
      });

    // Set up role filter from reactive form control
    this.roleFilterControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((role) => {
        this.filterRole.set(role);
        this.currentPage.set(0);
        this.loadUsers();
      });

    // Sync create form value changes to the signal for computed validity
    this.createForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((values) => {
        this.createFormValues.set({
          universityId: values.universityId ?? '',
          firstName: values.firstName ?? '',
          lastName: values.lastName ?? '',
          email: values.email ?? '',
        });
      });

    this.loadUsers();
  }

  onLazyLoad(event: TableLazyLoadEvent): void {
    const page = event.first !== undefined ? Math.floor(event.first / (event.rows ?? 20)) : 0;
    const size = event.rows ?? 20;

    this.currentPage.set(page);
    this.pageSize.set(size);
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.userService
      .getAllUsers({
        page: this.currentPage(),
        size: this.pageSize(),
        search: this.searchTerm() || undefined,
        role: this.filterRole() || undefined,
      })
      .subscribe({
        next: (response) => {
          this.users.set(response.content);
          this.totalRecords.set(response.totalElements);
          // Initialize pending changes with current roles (replace entirely for current page)
          this.pendingChanges.set(
            new Map(response.content.map((user) => [user.id, new Set(user.roles)])),
          );
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        },
      });
  }

  hasRole(user: UserDTO, role: string): boolean {
    return this.pendingChanges().get(user.id)?.has(role) ?? false;
  }

  toggleRole(user: UserDTO, role: string, event: CheckboxChangeEvent): void {
    const checked = event.checked as boolean;
    this.pendingChanges.update((map) => {
      const updated = new Map(map);
      const roles = new Set(updated.get(user.id) ?? []);
      if (checked) {
        roles.add(role);
      } else {
        roles.delete(role);
      }
      updated.set(user.id, roles);
      return updated;
    });
  }

  hasChanges(user: UserDTO): boolean {
    const pending = this.pendingChanges().get(user.id);
    if (!pending) return false;

    const original = new Set(user.roles);
    if (pending.size !== original.size) return true;

    for (const role of pending) {
      if (!original.has(role)) return true;
    }
    return false;
  }

  saveUser(user: UserDTO): void {
    const roles = Array.from(this.pendingChanges().get(user.id) ?? []);
    this.userService.updateUserRoles(user.id, roles).subscribe({
      next: (updatedUser) => {
        // Update the user in the list
        this.users.update((users) => users.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
        // Update pending changes to match saved state
        this.pendingChanges.update((map) => {
          const updated = new Map(map);
          updated.set(updatedUser.id, new Set(updatedUser.roles));
          return updated;
        });
        this.messageService.add({
          severity: 'success',
          summary: 'Erfolg',
          detail: 'Benutzerrollen wurden aktualisiert',
        });

        // If the current user's roles were updated, re-fetch user data to update permissions
        if (updatedUser.id === this.securityStore.user()?.id) {
          this.securityStore.fetchUser();
        }
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Fehler',
          detail: 'Benutzerrollen konnten nicht aktualisiert werden',
        });
      },
    });
  }

  openCreateDialog(): void {
    this.createForm.reset();
    this.formRoles.set(new Set<string>());
    this.dialogVisible.set(true);
  }

  closeDialog(): void {
    this.dialogVisible.set(false);
  }

  toggleFormRole(role: string, event: CheckboxChangeEvent): void {
    const checked = event.checked as boolean;
    this.formRoles.update((roles) => {
      const updated = new Set(roles);
      if (checked) {
        updated.add(role);
      } else {
        updated.delete(role);
      }
      return updated;
    });
  }

  createUser(): void {
    const formValue = this.createForm.getRawValue();
    const dto: CreateUserDTO = {
      universityId: formValue.universityId.trim(),
      email: formValue.email.trim(),
      firstName: formValue.firstName.trim(),
      lastName: formValue.lastName.trim(),
      roles: Array.from(this.formRoles()),
    };
    this.userService.createUser(dto).subscribe({
      next: () => {
        this.dialogVisible.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Erfolg',
          detail: `Benutzer "${dto.universityId}" wurde erstellt`,
        });
        this.loadUsers();
      },
      error: (err: { status: number }) => {
        const detail =
          err.status === 400
            ? 'Ein Benutzer mit dieser Kennung existiert bereits oder die Eingaben sind ungültig'
            : 'Benutzer konnte nicht erstellt werden';
        this.messageService.add({
          severity: 'error',
          summary: 'Fehler',
          detail,
        });
      },
    });
  }

  confirmDelete(user: UserDTO): void {
    this.confirmationService.confirm({
      message: `Möchten Sie den Benutzer "${user.firstName} ${user.lastName}" (${user.universityId}) wirklich löschen?`,
      header: 'Löschen bestätigen',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Ja',
      rejectLabel: 'Nein',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.deleteUser(user),
    });
  }

  deleteUser(user: UserDTO): void {
    this.userService.deleteUser(user.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Erfolg',
          detail: `Benutzer "${user.firstName} ${user.lastName}" wurde gelöscht`,
        });
        this.loadUsers();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Fehler',
          detail: 'Benutzer konnte nicht gelöscht werden',
        });
      },
    });
  }

  formatRole(role: string): string {
    return ROLE_LABELS[role] ?? role;
  }
}
