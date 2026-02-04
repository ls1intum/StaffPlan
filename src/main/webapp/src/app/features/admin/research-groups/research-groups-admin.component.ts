import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
  computed,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { Select } from 'primeng/select';
import { Tag } from 'primeng/tag';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Toast } from 'primeng/toast';
import { FileUpload, FileUploadHandlerEvent } from 'primeng/fileupload';
import { Tooltip } from 'primeng/tooltip';
import { ResearchGroupService } from './research-group.service';
import { ResearchGroup, ResearchGroupFormData } from './research-group.model';

const DEPARTMENTS = [
  { label: 'Mathematics', value: 'Mathematics' },
  { label: 'Computer Science', value: 'Computer Science' },
  { label: 'Computer Engineering', value: 'Computer Engineering' },
  { label: 'Electrical Engineering', value: 'Electrical Engineering' },
];

const CAMPUSES = [
  { label: 'Garching', value: 'Garching' },
  { label: 'München', value: 'München' },
  { label: 'Weihenstephan', value: 'Weihenstephan' },
];

@Component({
  selector: 'app-research-groups-admin',
  imports: [
    FormsModule,
    TableModule,
    Button,
    Dialog,
    InputText,
    Textarea,
    Select,
    Tag,
    ConfirmDialog,
    Toast,
    FileUpload,
    Tooltip,
  ],
  providers: [ConfirmationService, MessageService],
  template: `
    <div class="research-groups-page">
      <div class="page-header">
        <h2>Forschungsgruppen</h2>
        <div class="actions">
          <p-fileupload
            mode="basic"
            name="file"
            accept=".csv"
            [auto]="true"
            chooseLabel="CSV Import"
            chooseIcon="pi pi-upload"
            (uploadHandler)="onCsvUpload($event)"
            [customUpload]="true"
          />
          <p-button
            label="Positionen zuordnen"
            icon="pi pi-link"
            [outlined]="true"
            (onClick)="batchAssignPositions()"
            [loading]="assigningPositions()"
          />
          <p-button
            label="Aktualisieren"
            icon="pi pi-refresh"
            [outlined]="true"
            (onClick)="loadResearchGroups()"
          />
          <p-button label="Hinzufügen" icon="pi pi-plus" (onClick)="openCreateDialog()" />
        </div>
      </div>

      @if (loading()) {
        <div class="loading">Forschungsgruppen werden geladen...</div>
      } @else {
        <div class="table-container">
          <p-table
            [value]="researchGroups()"
            [tableStyle]="{ 'min-width': '90rem' }"
            [rowHover]="true"
            [paginator]="true"
            [rows]="20"
            [rowsPerPageOptions]="[10, 20, 50, 100]"
            [scrollable]="true"
            scrollHeight="flex"
          >
            <ng-template #header>
              <tr>
                <th pSortableColumn="name">Name <p-sortIcon field="name" /></th>
                <th pSortableColumn="abbreviation">Kürzel <p-sortIcon field="abbreviation" /></th>
                <th>Professor</th>
                <th>Zuordnung</th>
                <th pSortableColumn="department">Fakultät <p-sortIcon field="department" /></th>
                <th pSortableColumn="positionCount">
                  Positionen <p-sortIcon field="positionCount" />
                </th>
                <th>Campus</th>
                <th>Status</th>
                <th>Aktionen</th>
              </tr>
            </ng-template>
            <ng-template #body let-group>
              <tr>
                <td>
                  <strong>{{ group.name }}</strong>
                </td>
                <td>
                  <span class="abbreviation">{{ group.abbreviation }}</span>
                </td>
                <td>
                  @if (group.head) {
                    <span class="professor-assigned">
                      {{ group.head.firstName }} {{ group.head.lastName }}
                      @if (!group.head.lastLoginAt) {
                        <p-tag
                          value="Nie angemeldet"
                          severity="secondary"
                          class="professor-tag"
                          pTooltip="Benutzer wurde importiert, hat sich aber noch nie angemeldet"
                        />
                      }
                    </span>
                  } @else if (group.professorFirstName || group.professorLastName) {
                    <span class="professor-expected">
                      {{ group.professorFirstName }} {{ group.professorLastName }}
                      <p-tag value="Erwartet" severity="warn" class="professor-tag" />
                    </span>
                  } @else {
                    <span class="professor-none">-</span>
                  }
                </td>
                <td>
                  @if (group.professorUniversityId) {
                    <span
                      class="mapping-status mapped"
                      pTooltip="Automatische Zuordnung via {{ group.professorUniversityId }}"
                    >
                      <i class="pi pi-check-circle"></i>
                      {{ group.professorUniversityId }}
                    </span>
                  } @else if (group.needsManualMapping) {
                    <span
                      class="mapping-status needs-mapping"
                      [pTooltip]="group.mappingNotes || 'Manuelle Zuordnung erforderlich'"
                    >
                      <i class="pi pi-exclamation-triangle"></i>
                      Manuell
                    </span>
                  } @else if (group.professorEmail) {
                    <span class="mapping-status pending" pTooltip="E-Mail: {{ group.professorEmail }}">
                      <i class="pi pi-envelope"></i>
                      E-Mail
                    </span>
                  } @else {
                    <span class="mapping-status none">-</span>
                  }
                </td>
                <td>{{ group.department }}</td>
                <td>
                  <span
                    [class]="'position-count ' + (group.positionCount > 0 ? 'has-positions' : '')"
                  >
                    {{ group.positionCount }}
                  </span>
                </td>
                <td>{{ group.campus || '-' }}</td>
                <td>
                  @if (!group.archived) {
                    <p-tag value="Aktiv" severity="success" />
                  } @else {
                    <p-tag value="Archiviert" severity="secondary" />
                  }
                </td>
                <td>
                  <div class="action-buttons">
                    <p-button
                      icon="pi pi-pencil"
                      [rounded]="true"
                      [text]="true"
                      (onClick)="openEditDialog(group)"
                    />
                    <p-button
                      icon="pi pi-trash"
                      [rounded]="true"
                      [text]="true"
                      severity="danger"
                      [disabled]="group.positionCount > 0"
                      (onClick)="confirmArchive(group)"
                    />
                  </div>
                </td>
              </tr>
            </ng-template>
            <ng-template #emptymessage>
              <tr>
                <td colspan="9" class="empty-message">
                  Keine Forschungsgruppen vorhanden. Importieren Sie Daten über CSV oder erstellen
                  Sie eine neue Gruppe.
                </td>
              </tr>
            </ng-template>
            <ng-template #paginatorright>
              <p-button
                label="Alle Daten löschen"
                icon="pi pi-trash"
                severity="danger"
                [outlined]="true"
                size="small"
                (onClick)="confirmDeleteAll()"
                [loading]="deletingAll()"
              />
            </ng-template>
          </p-table>
        </div>
      }

      <p-dialog
        [header]="isEditing() ? 'Forschungsgruppe bearbeiten' : 'Forschungsgruppe erstellen'"
        [(visible)]="dialogVisible"
        [modal]="true"
        [style]="{ width: '650px' }"
      >
        <div class="form-grid">
          <div class="form-field">
            <label for="name">Name *</label>
            <input pInputText id="name" [(ngModel)]="formData.name" />
          </div>

          <div class="form-field">
            <label for="abbreviation">Kürzel *</label>
            <input pInputText id="abbreviation" [(ngModel)]="formData.abbreviation" />
          </div>

          <div class="form-field">
            <label for="department">Fakultät</label>
            <p-select
              id="department"
              [(ngModel)]="formData.department"
              [options]="departments"
              optionLabel="label"
              optionValue="value"
              placeholder="Fakultät auswählen"
              [showClear]="true"
            />
          </div>

          <div class="form-field">
            <label for="campus">Campus</label>
            <p-select
              id="campus"
              [(ngModel)]="formData.campus"
              [options]="campuses"
              optionLabel="label"
              optionValue="value"
              placeholder="Campus auswählen"
              [showClear]="true"
            />
          </div>

          <div class="form-field">
            <label for="professorFirstName">Professor Vorname</label>
            <input pInputText id="professorFirstName" [(ngModel)]="formData.professorFirstName" />
          </div>

          <div class="form-field">
            <label for="professorLastName">Professor Nachname</label>
            <input pInputText id="professorLastName" [(ngModel)]="formData.professorLastName" />
          </div>

          <div class="form-field">
            <label for="professorEmail">Professor E-Mail</label>
            <input
              pInputText
              id="professorEmail"
              [(ngModel)]="formData.professorEmail"
              placeholder="z.B. krusche&#64;tum.de"
            />
          </div>

          <div class="form-field">
            <label for="professorUniversityId">Professor UniversityId</label>
            <input
              pInputText
              id="professorUniversityId"
              [(ngModel)]="formData.professorUniversityId"
              placeholder="z.B. ne23kow"
            />
          </div>

          <div class="form-field full-width">
            <label for="websiteUrl">Website URL</label>
            <input pInputText id="websiteUrl" [(ngModel)]="formData.websiteUrl" />
          </div>

          <div class="form-field full-width">
            <label for="description">Beschreibung</label>
            <textarea pTextarea id="description" [(ngModel)]="formData.description" rows="3">
            </textarea>
          </div>
        </div>

        <ng-template #footer>
          <p-button label="Abbrechen" [text]="true" (onClick)="closeDialog()" />
          <p-button
            [label]="isEditing() ? 'Aktualisieren' : 'Erstellen'"
            (onClick)="saveResearchGroup()"
            [disabled]="!isFormValid()"
          />
        </ng-template>
      </p-dialog>

      <p-dialog
        header="Import Ergebnis"
        [(visible)]="importResultVisible"
        [modal]="true"
        [style]="{ width: '500px' }"
      >
        @if (importResult()) {
          <div class="import-result">
            <div class="import-stats">
              <div class="stat success">
                <span class="stat-value">{{ importResult()?.created }}</span>
                <span class="stat-label">Erstellt</span>
              </div>
              <div class="stat info">
                <span class="stat-value">{{ importResult()?.updated }}</span>
                <span class="stat-label">Aktualisiert</span>
              </div>
              <div class="stat warn">
                <span class="stat-value">{{ importResult()?.skipped }}</span>
                <span class="stat-label">Übersprungen</span>
              </div>
            </div>

            @if (importResult()?.errors?.length) {
              <div class="import-errors">
                <h4>Fehler:</h4>
                <ul>
                  @for (error of importResult()?.errors; track error) {
                    <li class="error-item">{{ error }}</li>
                  }
                </ul>
              </div>
            }

            @if (importResult()?.warnings?.length) {
              <div class="import-warnings">
                <h4>Warnungen:</h4>
                <ul>
                  @for (warning of importResult()?.warnings; track warning) {
                    <li class="warning-item">{{ warning }}</li>
                  }
                </ul>
              </div>
            }
          </div>
        }

        <ng-template #footer>
          <p-button label="Schließen" (onClick)="closeImportResult()" />
        </ng-template>
      </p-dialog>

      <p-confirmDialog />
      <p-toast />
    </div>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
    }

    .research-groups-page {
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

      .actions {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }
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

    .loading {
      padding: 2rem;
      text-align: center;
      color: var(--p-text-muted-color);
    }

    .abbreviation {
      padding: 0.25rem 0.5rem;
      background-color: var(--p-surface-100);
      border-radius: 4px;
      font-family: monospace;
      font-size: 0.875rem;
    }

    .professor-assigned {
      color: var(--p-text-color);
    }

    .professor-expected {
      color: var(--p-text-muted-color);
      font-style: italic;

      .professor-tag {
        margin-left: 0.5rem;
      }
    }

    .professor-none {
      color: var(--p-text-muted-color);
    }

    .mapping-status {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.875rem;
      cursor: default;

      i {
        font-size: 0.875rem;
      }

      &.mapped {
        color: var(--p-green-600);

        i {
          color: var(--p-green-500);
        }
      }

      &.needs-mapping {
        color: var(--p-orange-600);

        i {
          color: var(--p-orange-500);
        }
      }

      &.pending {
        color: var(--p-blue-600);

        i {
          color: var(--p-blue-500);
        }
      }

      &.none {
        color: var(--p-text-muted-color);
      }
    }

    .position-count {
      &.has-positions {
        font-weight: 600;
        color: var(--p-primary-color);
      }
    }

    .action-buttons {
      display: flex;
      gap: 0.25rem;
    }

    .empty-message {
      text-align: center;
      padding: 2rem;
      color: var(--p-text-muted-color);
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;

      &.full-width {
        grid-column: 1 / -1;
      }

      label {
        font-weight: 500;
        font-size: 0.875rem;
      }

      textarea {
        width: 100%;
      }
    }

    .import-result {
      .import-stats {
        display: flex;
        gap: 1rem;
        margin-bottom: 1rem;

        .stat {
          flex: 1;
          text-align: center;
          padding: 1rem;
          border-radius: 8px;

          &.success {
            background-color: var(--p-green-50);
          }
          &.info {
            background-color: var(--p-blue-50);
          }
          &.warn {
            background-color: var(--p-yellow-50);
          }

          .stat-value {
            display: block;
            font-size: 1.5rem;
            font-weight: 600;
          }

          .stat-label {
            font-size: 0.875rem;
            color: var(--p-text-muted-color);
          }
        }
      }

      .import-errors,
      .import-warnings {
        h4 {
          margin: 0.5rem 0;
        }

        ul {
          margin: 0;
          padding-left: 1.5rem;
          max-height: 150px;
          overflow-y: auto;
        }

        .error-item {
          color: var(--p-red-500);
        }

        .warning-item {
          color: var(--p-yellow-700);
        }
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResearchGroupsAdminComponent implements OnInit {
  private readonly researchGroupService = inject(ResearchGroupService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  readonly researchGroups = signal<ResearchGroup[]>([]);
  readonly loading = signal(false);
  readonly assigningPositions = signal(false);
  readonly deletingAll = signal(false);
  readonly dialogVisible = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly importResultVisible = signal(false);
  readonly importResult = signal<{
    created: number;
    updated: number;
    skipped: number;
    errors: string[];
    warnings: string[];
  } | null>(null);

  readonly isEditing = computed(() => this.editingId() !== null);
  readonly departments = DEPARTMENTS;
  readonly campuses = CAMPUSES;

  formData: ResearchGroupFormData = this.getEmptyFormData();

  ngOnInit(): void {
    this.loadResearchGroups();
  }

  loadResearchGroups(): void {
    this.loading.set(true);
    this.researchGroupService.getAll().subscribe({
      next: (groups) => {
        this.researchGroups.set(groups);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Fehler',
          detail: 'Forschungsgruppen konnten nicht geladen werden',
        });
      },
    });
  }

  openCreateDialog(): void {
    this.formData = this.getEmptyFormData();
    this.editingId.set(null);
    this.dialogVisible.set(true);
  }

  openEditDialog(group: ResearchGroup): void {
    this.formData = {
      name: group.name,
      abbreviation: group.abbreviation,
      description: group.description ?? '',
      websiteUrl: group.websiteUrl ?? '',
      campus: group.campus ?? '',
      department: group.department ?? '',
      professorFirstName: group.professorFirstName ?? '',
      professorLastName: group.professorLastName ?? '',
      professorEmail: group.professorEmail ?? '',
      professorUniversityId: group.professorUniversityId ?? '',
      aliases: group.aliases ?? [],
    };
    this.editingId.set(group.id);
    this.dialogVisible.set(true);
  }

  closeDialog(): void {
    this.dialogVisible.set(false);
    this.editingId.set(null);
  }

  isFormValid(): boolean {
    return !!this.formData.name && !!this.formData.abbreviation;
  }

  saveResearchGroup(): void {
    if (!this.isFormValid()) return;

    const data = {
      name: this.formData.name,
      abbreviation: this.formData.abbreviation,
      description: this.formData.description || null,
      websiteUrl: this.formData.websiteUrl || null,
      campus: this.formData.campus || null,
      department: this.formData.department || null,
      professorFirstName: this.formData.professorFirstName || null,
      professorLastName: this.formData.professorLastName || null,
      professorEmail: this.formData.professorEmail || null,
      professorUniversityId: this.formData.professorUniversityId || null,
      aliases: this.formData.aliases,
    };

    const editId = this.editingId();
    if (editId) {
      this.researchGroupService.update(editId, data).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Erfolg',
            detail: 'Forschungsgruppe wurde aktualisiert',
          });
          this.closeDialog();
          this.loadResearchGroups();
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Fehler',
            detail: err.error?.message || 'Forschungsgruppe konnte nicht aktualisiert werden',
          });
        },
      });
    } else {
      this.researchGroupService.create(data).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Erfolg',
            detail: 'Forschungsgruppe wurde erstellt',
          });
          this.closeDialog();
          this.loadResearchGroups();
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Fehler',
            detail: err.error?.message || 'Forschungsgruppe konnte nicht erstellt werden',
          });
        },
      });
    }
  }

  confirmArchive(group: ResearchGroup): void {
    this.confirmationService.confirm({
      message: `Möchten Sie die Forschungsgruppe "${group.name}" wirklich archivieren?`,
      header: 'Archivieren bestätigen',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Ja',
      rejectLabel: 'Nein',
      accept: () => this.archiveGroup(group),
    });
  }

  confirmDeleteAll(): void {
    this.confirmationService.confirm({
      message:
        'Möchten Sie wirklich ALLE Forschungsgruppen löschen? Diese Aktion kann nicht rückgängig gemacht werden.',
      header: 'Alle Daten löschen',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Ja, alle löschen',
      rejectLabel: 'Abbrechen',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.deleteAllResearchGroups(),
    });
  }

  onCsvUpload(event: FileUploadHandlerEvent): void {
    const file = event.files[0];
    if (!file) return;

    this.researchGroupService.importFromCsv(file).subscribe({
      next: (result) => {
        this.importResult.set(result);
        this.importResultVisible.set(true);
        this.loadResearchGroups();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Fehler',
          detail: err.error?.message || 'CSV Import fehlgeschlagen',
        });
      },
    });
  }

  closeImportResult(): void {
    this.importResultVisible.set(false);
    this.importResult.set(null);
  }

  batchAssignPositions(): void {
    this.assigningPositions.set(true);
    this.researchGroupService.batchAssignPositions().subscribe({
      next: (result) => {
        this.assigningPositions.set(false);
        const matchedCount = Object.keys(result.matched).length;
        const unmatchedCount = result.unmatchedOrgUnits.length;

        this.messageService.add({
          severity: matchedCount > 0 ? 'success' : 'warn',
          summary: 'Zuordnung abgeschlossen',
          detail: `${matchedCount} Positionen zugeordnet, ${unmatchedCount} nicht zugeordnet`,
          life: 5000,
        });

        if (unmatchedCount > 0) {
          console.log('Unmatched organization units:', result.unmatchedOrgUnits);
        }

        this.loadResearchGroups();
      },
      error: (err) => {
        this.assigningPositions.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Fehler',
          detail: err.error?.message || 'Positionszuordnung fehlgeschlagen',
        });
      },
    });
  }

  private archiveGroup(group: ResearchGroup): void {
    this.researchGroupService.archive(group.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Erfolg',
          detail: 'Forschungsgruppe wurde archiviert',
        });
        this.loadResearchGroups();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Fehler',
          detail: err.error?.message || 'Forschungsgruppe konnte nicht archiviert werden',
        });
      },
    });
  }

  private deleteAllResearchGroups(): void {
    this.deletingAll.set(true);
    this.researchGroupService.deleteAll().subscribe({
      next: (result) => {
        this.deletingAll.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Erfolg',
          detail: `${result.deleted} Forschungsgruppen wurden gelöscht`,
        });
        this.loadResearchGroups();
      },
      error: (err) => {
        this.deletingAll.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Fehler',
          detail: err.error?.message || 'Forschungsgruppen konnten nicht gelöscht werden',
        });
      },
    });
  }

  private getEmptyFormData(): ResearchGroupFormData {
    return {
      name: '',
      abbreviation: '',
      description: '',
      websiteUrl: '',
      campus: '',
      department: '',
      professorFirstName: '',
      professorLastName: '',
      professorEmail: '',
      professorUniversityId: '',
      aliases: [],
    };
  }
}
