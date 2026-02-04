import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
  computed,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { Card } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { InputNumber } from 'primeng/inputnumber';
import { Select } from 'primeng/select';
import { Checkbox } from 'primeng/checkbox';
import { Tag } from 'primeng/tag';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Toast } from 'primeng/toast';
import { GradeValueService } from './grade-value.service';
import { GradeValue, GradeValueFormData } from './grade-value.model';

const GRADE_TYPES = [
  { label: 'Entgelt (E)', value: 'E' },
  { label: 'Beamte (A)', value: 'A' },
  { label: 'W-Besoldung (W)', value: 'W' },
  { label: 'C-Besoldung (C)', value: 'C' },
  { label: 'Sonstige', value: 'SPECIAL' },
];

@Component({
  selector: 'app-grade-values-admin',
  imports: [
    FormsModule,
    CurrencyPipe,
    Card,
    TableModule,
    Button,
    Dialog,
    InputText,
    InputNumber,
    Select,
    Checkbox,
    Tag,
    ConfirmDialog,
    Toast,
  ],
  providers: [ConfirmationService, MessageService],
  template: `
    <div class="grade-values-page">
      <p-card>
        <ng-template #header>
          <div class="card-header">
            <h2>Stellenwertigkeiten</h2>
            <div class="actions">
              <p-button
                label="Aktualisieren"
                icon="pi pi-refresh"
                [outlined]="true"
                (onClick)="loadGradeValues()"
              />
              <p-button label="Hinzufügen" icon="pi pi-plus" (onClick)="openCreateDialog()" />
            </div>
          </div>
        </ng-template>

        @if (loading()) {
          <div class="loading">Stellenwertigkeiten werden geladen...</div>
        } @else {
          <p-table
            [value]="gradeValues()"
            [tableStyle]="{ 'min-width': '70rem' }"
            [rowHover]="true"
          >
            <ng-template #header>
              <tr>
                <th>Besoldungsgruppe</th>
                <th>Typ</th>
                <th>Bezeichnung</th>
                <th>Monatswert</th>
                <th>Gehaltsbereich</th>
                <th>Sortierung</th>
                <th>Status</th>
                <th>Aktionen</th>
              </tr>
            </ng-template>
            <ng-template #body let-grade>
              <tr>
                <td>
                  <strong>{{ grade.gradeCode }}</strong>
                  @if (grade.inUse) {
                    <p-tag value="In Verwendung" severity="info" class="in-use-tag" />
                  }
                </td>
                <td>
                  <span [class]="'grade-type grade-type-' + grade.gradeType">
                    {{ grade.gradeType }}
                  </span>
                </td>
                <td>{{ grade.displayName }}</td>
                <td>{{ grade.monthlyValue | currency: 'EUR' : 'symbol' : '1.0-0' }}</td>
                <td>
                  @if (grade.minSalary && grade.maxSalary) {
                    {{ grade.minSalary | currency: 'EUR' : 'symbol' : '1.0-0' }} -
                    {{ grade.maxSalary | currency: 'EUR' : 'symbol' : '1.0-0' }}
                  }
                </td>
                <td>{{ grade.sortOrder }}</td>
                <td>
                  @if (grade.active) {
                    <p-tag value="Aktiv" severity="success" />
                  } @else {
                    <p-tag value="Inaktiv" severity="secondary" />
                  }
                </td>
                <td>
                  <div class="action-buttons">
                    <p-button
                      icon="pi pi-pencil"
                      [rounded]="true"
                      [text]="true"
                      (onClick)="openEditDialog(grade)"
                    />
                    <p-button
                      icon="pi pi-trash"
                      [rounded]="true"
                      [text]="true"
                      severity="danger"
                      [disabled]="grade.inUse"
                      (onClick)="confirmDelete(grade)"
                    />
                  </div>
                </td>
              </tr>
            </ng-template>
          </p-table>
        }
      </p-card>

      <p-dialog
        [header]="isEditing() ? 'Stellenwertigkeit bearbeiten' : 'Stellenwertigkeit erstellen'"
        [(visible)]="dialogVisible"
        [modal]="true"
        [style]="{ width: '500px' }"
      >
        <div class="form-grid">
          <div class="form-field">
            <label for="gradeCode">Besoldungsgruppe *</label>
            <input
              pInputText
              id="gradeCode"
              [(ngModel)]="formData.gradeCode"
              [disabled]="isEditing()"
            />
          </div>

          <div class="form-field">
            <label for="gradeType">Typ *</label>
            <p-select
              id="gradeType"
              [(ngModel)]="formData.gradeType"
              [options]="gradeTypes"
              optionLabel="label"
              optionValue="value"
              placeholder="Typ auswählen"
            />
          </div>

          <div class="form-field full-width">
            <label for="displayName">Bezeichnung</label>
            <input pInputText id="displayName" [(ngModel)]="formData.displayName" />
          </div>

          <div class="form-field">
            <label for="monthlyValue">Monatswert (EUR) *</label>
            <p-inputNumber
              id="monthlyValue"
              [(ngModel)]="formData.monthlyValue"
              mode="currency"
              currency="EUR"
              locale="de-DE"
            />
          </div>

          <div class="form-field">
            <label for="sortOrder">Sortierung</label>
            <p-inputNumber id="sortOrder" [(ngModel)]="formData.sortOrder" />
          </div>

          <div class="form-field">
            <label for="minSalary">Min. Gehalt (EUR)</label>
            <p-inputNumber
              id="minSalary"
              [(ngModel)]="formData.minSalary"
              mode="currency"
              currency="EUR"
              locale="de-DE"
            />
          </div>

          <div class="form-field">
            <label for="maxSalary">Max. Gehalt (EUR)</label>
            <p-inputNumber
              id="maxSalary"
              [(ngModel)]="formData.maxSalary"
              mode="currency"
              currency="EUR"
              locale="de-DE"
            />
          </div>

          <div class="form-field full-width">
            <p-checkbox [(ngModel)]="formData.active" [binary]="true" inputId="active" />
            <label for="active" class="checkbox-label">Aktiv</label>
          </div>
        </div>

        <ng-template #footer>
          <p-button label="Abbrechen" [text]="true" (onClick)="closeDialog()" />
          <p-button
            [label]="isEditing() ? 'Aktualisieren' : 'Erstellen'"
            (onClick)="saveGradeValue()"
            [disabled]="!isFormValid()"
          />
        </ng-template>
      </p-dialog>

      <p-confirmDialog />
      <p-toast />
    </div>
  `,
  styles: `
    .grade-values-page {
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

      .actions {
        display: flex;
        gap: 0.5rem;
      }
    }

    .loading {
      padding: 2rem;
      text-align: center;
      color: var(--p-text-muted-color);
    }

    .grade-type {
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-weight: 500;
      font-size: 0.875rem;
    }

    .grade-type-E {
      background-color: #fef3c7;
      color: #92400e;
    }

    .grade-type-A {
      background-color: #d1fae5;
      color: #065f46;
    }

    .grade-type-W {
      background-color: #dbeafe;
      color: #1e40af;
    }

    .grade-type-C {
      background-color: #fce7f3;
      color: #9d174d;
    }

    .grade-type-SPECIAL {
      background-color: #e5e7eb;
      color: #374151;
    }

    .in-use-tag {
      margin-left: 0.5rem;
    }

    .action-buttons {
      display: flex;
      gap: 0.25rem;
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

      .checkbox-label {
        margin-left: 0.5rem;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GradeValuesAdminComponent implements OnInit {
  private readonly gradeValueService = inject(GradeValueService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  readonly gradeValues = signal<GradeValue[]>([]);
  readonly loading = signal(false);
  readonly dialogVisible = signal(false);
  readonly editingId = signal<string | null>(null);

  readonly isEditing = computed(() => this.editingId() !== null);
  readonly gradeTypes = GRADE_TYPES;

  formData: GradeValueFormData = this.getEmptyFormData();

  ngOnInit(): void {
    this.loadGradeValues();
  }

  loadGradeValues(): void {
    this.loading.set(true);
    this.gradeValueService.getAll().subscribe({
      next: (gradeValues) => {
        this.gradeValues.set(gradeValues);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Fehler',
          detail: 'Stellenwertigkeiten konnten nicht geladen werden',
        });
      },
    });
  }

  openCreateDialog(): void {
    this.formData = this.getEmptyFormData();
    this.editingId.set(null);
    this.dialogVisible.set(true);
  }

  openEditDialog(grade: GradeValue): void {
    this.formData = {
      gradeCode: grade.gradeCode,
      gradeType: grade.gradeType ?? 'E',
      displayName: grade.displayName ?? '',
      monthlyValue: grade.monthlyValue,
      minSalary: grade.minSalary,
      maxSalary: grade.maxSalary,
      sortOrder: grade.sortOrder,
      active: grade.active,
    };
    this.editingId.set(grade.id);
    this.dialogVisible.set(true);
  }

  closeDialog(): void {
    this.dialogVisible.set(false);
    this.editingId.set(null);
  }

  isFormValid(): boolean {
    return (
      !!this.formData.gradeCode && !!this.formData.gradeType && this.formData.monthlyValue !== null
    );
  }

  saveGradeValue(): void {
    if (!this.isFormValid()) return;

    const data = {
      gradeCode: this.formData.gradeCode,
      gradeType: this.formData.gradeType,
      displayName: this.formData.displayName || null,
      monthlyValue: this.formData.monthlyValue,
      minSalary: this.formData.minSalary,
      maxSalary: this.formData.maxSalary,
      sortOrder: this.formData.sortOrder,
      active: this.formData.active,
    };

    const editId = this.editingId();
    if (editId) {
      this.gradeValueService.update(editId, data).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Erfolg',
            detail: 'Stellenwertigkeit wurde aktualisiert',
          });
          this.closeDialog();
          this.loadGradeValues();
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Fehler',
            detail: err.error?.message || 'Stellenwertigkeit konnte nicht aktualisiert werden',
          });
        },
      });
    } else {
      this.gradeValueService.create(data).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Erfolg',
            detail: 'Stellenwertigkeit wurde erstellt',
          });
          this.closeDialog();
          this.loadGradeValues();
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Fehler',
            detail: err.error?.message || 'Stellenwertigkeit konnte nicht erstellt werden',
          });
        },
      });
    }
  }

  confirmDelete(grade: GradeValue): void {
    this.confirmationService.confirm({
      message: `Möchten Sie die Besoldungsgruppe "${grade.gradeCode}" wirklich löschen?`,
      header: 'Löschen bestätigen',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Ja',
      rejectLabel: 'Nein',
      accept: () => this.deleteGradeValue(grade),
    });
  }

  private deleteGradeValue(grade: GradeValue): void {
    this.gradeValueService.delete(grade.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Erfolg',
          detail: 'Stellenwertigkeit wurde gelöscht',
        });
        this.loadGradeValues();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Fehler',
          detail: err.error?.message || 'Stellenwertigkeit konnte nicht gelöscht werden',
        });
      },
    });
  }

  private getEmptyFormData(): GradeValueFormData {
    return {
      gradeCode: '',
      gradeType: 'E',
      displayName: '',
      monthlyValue: null,
      minSalary: null,
      maxSalary: null,
      sortOrder: null,
      active: true,
    };
  }
}
