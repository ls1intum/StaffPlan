import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { Card } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { InputNumber } from 'primeng/inputnumber';
import { Select } from 'primeng/select';
import { Checkbox, CheckboxChangeEvent } from 'primeng/checkbox';
import { Tag } from 'primeng/tag';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Toast } from 'primeng/toast';
import { GradeValueService } from './grade-value.service';
import { GradeValue } from './grade-value.model';

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
    ReactiveFormsModule,
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
        <div class="form-grid" [formGroup]="gradeForm">
          <div class="form-field">
            <label for="gradeCode">Besoldungsgruppe *</label>
            <input
              pInputText
              id="gradeCode"
              formControlName="gradeCode"
            />
          </div>

          <div class="form-field">
            <label for="gradeType">Typ *</label>
            <p-select
              id="gradeType"
              formControlName="gradeType"
              [options]="gradeTypes"
              optionLabel="label"
              optionValue="value"
              placeholder="Typ auswählen"
            />
          </div>

          <div class="form-field full-width">
            <label for="displayName">Bezeichnung</label>
            <input pInputText id="displayName" formControlName="displayName" />
          </div>

          <div class="form-field">
            <label for="monthlyValue">Monatswert (EUR) *</label>
            <p-inputNumber
              id="monthlyValue"
              formControlName="monthlyValue"
              mode="currency"
              currency="EUR"
              locale="de-DE"
            />
          </div>

          <div class="form-field">
            <label for="sortOrder">Sortierung</label>
            <p-inputNumber id="sortOrder" formControlName="sortOrder" />
          </div>

          <div class="form-field">
            <label for="minSalary">Min. Gehalt (EUR)</label>
            <p-inputNumber
              id="minSalary"
              formControlName="minSalary"
              mode="currency"
              currency="EUR"
              locale="de-DE"
            />
          </div>

          <div class="form-field">
            <label for="maxSalary">Max. Gehalt (EUR)</label>
            <p-inputNumber
              id="maxSalary"
              formControlName="maxSalary"
              mode="currency"
              currency="EUR"
              locale="de-DE"
            />
          </div>

          <div class="form-field full-width">
            <p-checkbox
              [modelValue]="activeValue()"
              (onChange)="onActiveChange($event)"
              [binary]="true"
              inputId="active"
            />
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
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly gradeValues = signal<GradeValue[]>([]);
  readonly loading = signal(false);
  readonly dialogVisible = signal(false);
  readonly editingId = signal<string | null>(null);

  readonly isEditing = computed(() => this.editingId() !== null);
  readonly gradeTypes = GRADE_TYPES;

  // Reactive form for grade value dialog
  readonly gradeForm = this.fb.group({
    gradeCode: '',
    gradeType: 'E',
    displayName: '',
    monthlyValue: null as number | null,
    minSalary: null as number | null,
    maxSalary: null as number | null,
    sortOrder: null as number | null,
  });

  // Track active checkbox separately as a signal (boolean checkbox with PrimeNG)
  readonly activeValue = signal(true);

  // Signal-based form values for computed validity
  private readonly formValues = signal({ gradeCode: '', gradeType: 'E', monthlyValue: null as number | null });
  readonly isFormValid = computed(() => {
    const values = this.formValues();
    return !!values.gradeCode && !!values.gradeType && values.monthlyValue !== null;
  });

  ngOnInit(): void {
    // Sync form value changes to signal
    this.gradeForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const raw = this.gradeForm.getRawValue();
        this.formValues.set({
          gradeCode: raw.gradeCode ?? '',
          gradeType: raw.gradeType ?? '',
          monthlyValue: raw.monthlyValue ?? null,
        });
      });

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
    this.gradeForm.reset({
      gradeCode: '',
      gradeType: 'E',
      displayName: '',
      monthlyValue: null,
      minSalary: null,
      maxSalary: null,
      sortOrder: null,
    });
    this.gradeForm.controls.gradeCode.enable();
    this.activeValue.set(true);
    this.editingId.set(null);
    this.dialogVisible.set(true);
  }

  openEditDialog(grade: GradeValue): void {
    this.gradeForm.patchValue({
      gradeCode: grade.gradeCode,
      gradeType: grade.gradeType ?? 'E',
      displayName: grade.displayName ?? '',
      monthlyValue: grade.monthlyValue,
      minSalary: grade.minSalary,
      maxSalary: grade.maxSalary,
      sortOrder: grade.sortOrder,
    });
    this.gradeForm.controls.gradeCode.disable();
    this.activeValue.set(grade.active);
    this.editingId.set(grade.id);
    this.dialogVisible.set(true);
  }

  closeDialog(): void {
    this.dialogVisible.set(false);
    this.editingId.set(null);
  }

  onActiveChange(event: CheckboxChangeEvent): void {
    this.activeValue.set(event.checked as boolean);
  }

  saveGradeValue(): void {
    if (!this.isFormValid()) return;

    const formValue = this.gradeForm.getRawValue();
    const data = {
      gradeCode: formValue.gradeCode,
      gradeType: formValue.gradeType,
      displayName: formValue.displayName || null,
      monthlyValue: formValue.monthlyValue,
      minSalary: formValue.minSalary,
      maxSalary: formValue.maxSalary,
      sortOrder: formValue.sortOrder,
      active: this.activeValue(),
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
}
