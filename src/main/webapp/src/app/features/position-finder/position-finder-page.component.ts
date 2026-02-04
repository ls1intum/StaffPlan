import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { Card } from 'primeng/card';
import { Button } from 'primeng/button';
import { Select } from 'primeng/select';
import { MultiSelect } from 'primeng/multiselect';
import { InputNumber } from 'primeng/inputnumber';
import { DatePicker } from 'primeng/datepicker';
import { TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';
import { ProgressBar } from 'primeng/progressbar';
import { Tooltip } from 'primeng/tooltip';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { PositionFinderService } from './position-finder.service';
import { GradeValueService } from '../admin/grade-values/grade-value.service';
import { PositionFinderResponse, PositionMatch, MatchQuality } from './position-finder.model';
import { GradeValue } from '../admin/grade-values/grade-value.model';

@Component({
  selector: 'app-position-finder-page',
  imports: [
    FormsModule,
    CurrencyPipe,
    DatePipe,
    DecimalPipe,
    Card,
    Button,
    Select,
    MultiSelect,
    InputNumber,
    DatePicker,
    TableModule,
    Tag,
    ProgressBar,
    Tooltip,
    Toast,
  ],
  providers: [MessageService],
  template: `
    <div class="position-finder-page">
      <p-card>
        <ng-template #header>
          <div class="card-header">
            <h2>Stellensuche</h2>
            <p class="subtitle">Finden Sie optimale freie Stellen für neue Mitarbeiter</p>
          </div>
        </ng-template>

        <div class="search-form">
          <div class="form-row">
            <div class="form-field">
              <label for="grade">Besoldungsgruppe *</label>
              <p-select
                id="grade"
                [(ngModel)]="selectedGrade"
                [options]="gradeOptions()"
                optionLabel="label"
                optionValue="value"
                placeholder="Gruppe auswählen"
                [filter]="true"
                [style]="{ width: '100%' }"
              />
            </div>

            <div class="form-field">
              <label for="percentage">Besetzungsgrad *</label>
              <p-inputNumber
                id="percentage"
                [(ngModel)]="fillPercentage"
                [min]="1"
                [max]="100"
                suffix="%"
                [style]="{ width: '100%' }"
              />
            </div>

            <div class="form-field">
              <label for="startDate">Startdatum *</label>
              <p-datepicker
                id="startDate"
                [(ngModel)]="startDate"
                dateFormat="dd.mm.yy"
                [style]="{ width: '100%' }"
              />
            </div>

            <div class="form-field">
              <label for="endDate">Enddatum *</label>
              <p-datepicker
                id="endDate"
                [(ngModel)]="endDate"
                dateFormat="dd.mm.yy"
                [style]="{ width: '100%' }"
              />
            </div>
          </div>

          <div class="form-row form-row-single">
            <div class="form-field">
              <label for="relevanceTypes">Relevanzart</label>
              <p-multiselect
                id="relevanceTypes"
                [(ngModel)]="selectedRelevanceTypes"
                [options]="relevanceTypeOptions()"
                optionLabel="label"
                optionValue="value"
                placeholder="Alle Relevanzarten"
                [showClear]="true"
                [filter]="true"
                filterPlaceholder="Suchen..."
                [style]="{ width: '100%' }"
              />
            </div>
          </div>

          <div class="form-actions">
            <p-button
              label="Stellen suchen"
              icon="pi pi-search"
              (onClick)="search()"
              [disabled]="!isFormValid()"
              [loading]="searching()"
            />
          </div>
        </div>
      </p-card>

      @if (searchResult()) {
        <p-card class="results-card">
          <ng-template #header>
            <div class="results-header">
              <h3>Suchergebnisse</h3>
              <div class="results-summary">
                <span class="summary-item">
                  <strong>Zeitraum:</strong>
                  {{ lastSearchStartDate() | date: 'dd.MM.yyyy' }} -
                  {{ lastSearchEndDate() | date: 'dd.MM.yyyy' }}
                </span>
                <span class="summary-item">
                  <strong>Besoldungsgruppe:</strong> {{ searchResult()!.employeeGrade }} bei
                  {{ searchResult()!.fillPercentage }}%
                </span>
                <span class="summary-item">
                  <strong>Mitarbeiterkosten:</strong>
                  {{
                    searchResult()!.employeeMonthlyCost | currency: 'EUR' : 'symbol' : '1.0-0'
                  }}/Monat
                </span>
                @if (lastSearchRelevanceTypes().length > 0) {
                  <span class="summary-item">
                    <strong>Relevanzart:</strong> {{ lastSearchRelevanceTypes().join(', ') }}
                  </span>
                }
                <span class="summary-item">
                  <strong>Treffer:</strong> {{ searchResult()!.totalMatchesFound }} Stellen gefunden
                </span>
              </div>
            </div>
          </ng-template>

          @if (searchResult()!.matches.length > 0) {
            <p-table
              [value]="searchResult()!.matches"
              [tableStyle]="{ 'min-width': '90rem' }"
              [rowHover]="true"
            >
              <ng-template #header>
                <tr>
                  <th>Qualität</th>
                  <th>Stelle</th>
                  <th>Besoldung</th>
                  <th>Relevanzart</th>
                  <th>Verfügbar</th>
                  <th>Budgeteffizienz</th>
                  <th>Monatl. Verlust</th>
                  <th>Zeitraum</th>
                  <th>Info</th>
                </tr>
              </ng-template>
              <ng-template #body let-match>
                <tr>
                  <td>
                    <p-tag
                      [value]="getQualityLabel(match.matchQuality)"
                      [severity]="getQualitySeverity(match.matchQuality)"
                    />
                    <div class="score">{{ match.overallScore | number: '1.1-1' }} Pkt.</div>
                  </td>
                  <td>
                    <div class="position-info">
                      <strong>{{ match.objectId }}</strong>
                      @if (match.objectCode) {
                        <span class="object-code">{{ match.objectCode }}</span>
                      }
                      @if (match.objectDescription) {
                        <div class="description">{{ match.objectDescription }}</div>
                      }
                    </div>
                  </td>
                  <td>
                    <span class="grade-badge">{{ match.positionGrade }}</span>
                    @if (match.positionPercentage) {
                      <span class="position-pct">{{ match.positionPercentage }}%</span>
                    }
                  </td>
                  <td>
                    @if (match.positionRelevanceType) {
                      <span class="relevance-type">{{ match.positionRelevanceType }}</span>
                    } @else {
                      <span class="no-relevance">-</span>
                    }
                  </td>
                  <td>
                    <strong>{{ match.availablePercentage | number: '1.1-1' }}%</strong>
                    @if (match.currentAssignmentCount > 0) {
                      <div class="assignments">{{ match.currentAssignmentCount }} vorhanden</div>
                    }
                  </td>
                  <td>
                    <div class="efficiency-bar">
                      <p-progressBar
                        [value]="100 - match.wastePercentage"
                        [showValue]="false"
                        [style]="{ height: '20px' }"
                      />
                      <span class="efficiency-label"
                        >{{ 100 - match.wastePercentage | number: '1.0-0' }}%</span
                      >
                    </div>
                  </td>
                  <td>
                    <span [class]="getWasteClass(match.wastePercentage)">
                      {{ match.wasteAmount | currency: 'EUR' : 'symbol' : '1.0-0' }}
                    </span>
                    <span class="waste-pct">({{ match.wastePercentage | number: '1.0-0' }}%)</span>
                  </td>
                  <td>
                    @if (match.positionStartDate && match.positionEndDate) {
                      <div class="date-range">
                        {{ match.positionStartDate | date: 'dd.MM.yy' }} -
                        {{ match.positionEndDate | date: 'dd.MM.yy' }}
                      </div>
                    } @else {
                      <span class="no-dates">Unbefristet</span>
                    }
                  </td>
                  <td>
                    @if (match.warnings.length > 0) {
                      <span
                        class="warnings-icon pi pi-exclamation-triangle"
                        [pTooltip]="getWarningsText(match)"
                        tooltipPosition="left"
                      ></span>
                    } @else {
                      <span class="check-icon pi pi-check-circle"></span>
                    }
                  </td>
                </tr>
              </ng-template>
            </p-table>
          } @else if (searchResult()!.splitSuggestions.length > 0) {
            <div class="split-suggestions">
              <div class="split-header">
                <i class="pi pi-info-circle"></i>
                <div>
                  <h4>Keine einzelne Stelle verfügbar</h4>
                  <p>
                    Es wurde keine einzelne Stelle gefunden, die
                    {{ searchResult()!.fillPercentage }}% aufnehmen kann. Folgende Aufteilungen auf
                    mehrere Stellen sind möglich:
                  </p>
                </div>
              </div>

              @for (suggestion of searchResult()!.splitSuggestions; track $index) {
                <div class="split-card">
                  <div class="split-card-header">
                    <p-tag
                      [value]="suggestion.splitCount + ' Stellen'"
                      [severity]="suggestion.splitCount === 2 ? 'success' : 'warn'"
                    />
                    <span class="split-total">
                      Gesamt: {{ suggestion.totalAvailablePercentage | number: '1.0-0' }}%
                      @if (suggestion.totalAvailablePercentage > searchResult()!.fillPercentage) {
                        <span class="split-excess">
                          (+{{
                            suggestion.totalAvailablePercentage - searchResult()!.fillPercentage
                              | number: '1.0-0'
                          }}% Überschuss)
                        </span>
                      } @else {
                        <span class="split-perfect">✓ Perfekte Übereinstimmung</span>
                      }
                    </span>
                    <span class="split-waste">
                      Budgetverlust:
                      {{ suggestion.totalWasteAmount | currency: 'EUR' : 'symbol' : '1.0-0' }}
                    </span>
                  </div>
                  <div class="split-positions">
                    @for (pos of suggestion.positions; track pos.objectId) {
                      <div class="split-position">
                        <span class="split-pos-id">{{ pos.objectId }}</span>
                        <span class="split-pos-grade">{{ pos.positionGrade }}</span>
                        @if (pos.positionRelevanceType) {
                          <span class="split-pos-relevance">{{ pos.positionRelevanceType }}</span>
                        }
                        <span class="split-pos-available"
                          >{{ pos.availablePercentage | number: '1.0-0' }}% verfügbar</span
                        >
                        @if (pos.objectDescription) {
                          <span class="split-pos-desc">{{ pos.objectDescription }}</span>
                        }
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          } @else {
            <div class="no-results">
              <i class="pi pi-inbox"></i>
              <p>Keine passenden Stellen für die angegebenen Kriterien gefunden.</p>
              <p class="hint">
                Versuchen Sie, die Besoldungsgruppe, den Besetzungsgrad oder den Zeitraum
                anzupassen.
              </p>
            </div>
          }
        </p-card>
      }

      <p-toast />
    </div>
  `,
  styles: `
    .position-finder-page {
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .card-header {
      padding: 1rem;

      h2 {
        margin: 0 0 0.25rem;
      }

      .subtitle {
        margin: 0;
        color: var(--p-text-muted-color);
      }
    }

    .search-form {
      padding: 0 1rem 1rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 1rem;

      &.form-row-single {
        grid-template-columns: 1fr;
        max-width: 300px;
      }
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;

      label {
        font-weight: 500;
        font-size: 0.875rem;
      }
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
    }

    .results-card {
      margin-top: 1rem;
    }

    .results-header {
      padding: 1rem;

      h3 {
        margin: 0 0 0.5rem;
      }

      .results-summary {
        display: flex;
        flex-wrap: wrap;
        gap: 1.5rem;

        .summary-item {
          font-size: 0.875rem;
          color: var(--p-text-muted-color);
        }
      }
    }

    .score {
      font-size: 0.75rem;
      color: var(--p-text-muted-color);
      margin-top: 0.25rem;
    }

    .position-info {
      .object-code {
        color: var(--p-text-muted-color);
        font-size: 0.875rem;
        margin-left: 0.5rem;
      }

      .description {
        font-size: 0.875rem;
        color: var(--p-text-muted-color);
        margin-top: 0.25rem;
        max-width: 250px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    .grade-badge {
      background: var(--p-primary-100);
      color: var(--p-primary-700);
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-weight: 500;
    }

    .position-pct {
      color: var(--p-text-muted-color);
      font-size: 0.875rem;
      margin-left: 0.5rem;
    }

    .relevance-type {
      font-size: 0.875rem;
    }

    .no-relevance {
      color: var(--p-text-muted-color);
    }

    .assignments {
      font-size: 0.75rem;
      color: var(--p-text-muted-color);
    }

    .efficiency-bar {
      position: relative;
      width: 100px;

      .efficiency-label {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 0.75rem;
        font-weight: 600;
      }
    }

    .waste-low {
      color: var(--p-green-500);
    }

    .waste-medium {
      color: var(--p-yellow-600);
    }

    .waste-high {
      color: var(--p-red-500);
    }

    .waste-pct {
      font-size: 0.75rem;
      color: var(--p-text-muted-color);
      margin-left: 0.25rem;
    }

    .date-range {
      font-size: 0.875rem;
    }

    .no-dates {
      color: var(--p-text-muted-color);
      font-style: italic;
    }

    .warnings-icon {
      color: var(--p-yellow-500);
      font-size: 1.25rem;
      cursor: help;
    }

    .check-icon {
      color: var(--p-green-500);
      font-size: 1.25rem;
    }

    .no-results {
      text-align: center;
      padding: 3rem;
      color: var(--p-text-muted-color);

      i {
        font-size: 3rem;
        margin-bottom: 1rem;
      }

      p {
        margin: 0.5rem 0;
      }

      .hint {
        font-size: 0.875rem;
      }
    }

    .split-suggestions {
      padding: 1rem;
    }

    .split-header {
      display: flex;
      gap: 1rem;
      align-items: flex-start;
      padding: 1rem;
      background: var(--p-blue-50);
      border-radius: 8px;
      margin-bottom: 1rem;

      i {
        font-size: 1.5rem;
        color: var(--p-blue-500);
        margin-top: 0.25rem;
      }

      h4 {
        margin: 0 0 0.5rem;
        color: var(--p-blue-700);
      }

      p {
        margin: 0;
        color: var(--p-text-muted-color);
        font-size: 0.875rem;
      }
    }

    .split-card {
      border: 1px solid var(--p-surface-300);
      border-radius: 8px;
      margin-bottom: 0.75rem;
      overflow: hidden;
    }

    .split-card-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem 1rem;
      background: var(--p-surface-50);
      border-bottom: 1px solid var(--p-surface-200);

      .split-total {
        font-weight: 500;
        color: var(--p-text-color);
      }

      .split-excess {
        color: var(--p-orange-600);
        font-weight: normal;
        font-size: 0.8rem;
        margin-left: 0.25rem;
      }

      .split-perfect {
        color: var(--p-green-600);
        font-weight: 500;
        font-size: 0.8rem;
        margin-left: 0.25rem;
      }

      .split-waste {
        color: var(--p-text-muted-color);
        font-size: 0.875rem;
        margin-left: auto;
      }
    }

    .split-positions {
      padding: 0.75rem 1rem;
    }

    .split-position {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.5rem 0;
      border-bottom: 1px solid var(--p-surface-100);

      &:last-child {
        border-bottom: none;
      }

      .split-pos-id {
        font-weight: 600;
        min-width: 80px;
      }

      .split-pos-grade {
        background: var(--p-primary-100);
        color: var(--p-primary-700);
        padding: 0.15rem 0.5rem;
        border-radius: 4px;
        font-size: 0.875rem;
        font-weight: 500;
      }

      .split-pos-relevance {
        color: var(--p-text-muted-color);
        font-size: 0.875rem;
      }

      .split-pos-available {
        color: var(--p-green-600);
        font-weight: 500;
      }

      .split-pos-desc {
        color: var(--p-text-muted-color);
        font-size: 0.875rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 300px;
      }
    }

    @media (max-width: 768px) {
      .form-row {
        grid-template-columns: 1fr;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PositionFinderPageComponent {
  private readonly positionFinderService = inject(PositionFinderService);
  private readonly gradeValueService = inject(GradeValueService);
  private readonly messageService = inject(MessageService);

  readonly grades = signal<GradeValue[]>([]);
  readonly relevanceTypes = signal<string[]>([]);
  readonly searching = signal(false);
  readonly searchResult = signal<PositionFinderResponse | null>(null);
  readonly lastSearchStartDate = signal<Date | null>(null);
  readonly lastSearchEndDate = signal<Date | null>(null);
  readonly lastSearchRelevanceTypes = signal<string[]>([]);

  selectedGrade = '';
  fillPercentage = 50;
  startDate: Date | null = null;
  endDate: Date | null = null;
  selectedRelevanceTypes: string[] = [];

  readonly gradeOptions = computed(() =>
    this.grades()
      .filter((g) => g.active)
      .map((g) => ({
        label: `${g.gradeCode} - ${g.displayName ?? g.gradeCode}`,
        value: g.gradeCode,
      })),
  );

  readonly relevanceTypeOptions = computed(() =>
    this.relevanceTypes().map((t) => ({ label: t, value: t })),
  );

  constructor() {
    this.loadGrades();
    this.loadRelevanceTypes();
  }

  private loadGrades(): void {
    this.gradeValueService.getAll(true).subscribe({
      next: (grades) => this.grades.set(grades),
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Fehler',
          detail: 'Besoldungsgruppen konnten nicht geladen werden',
        });
      },
    });
  }

  private loadRelevanceTypes(): void {
    this.positionFinderService.getRelevanceTypes().subscribe({
      next: (types) => this.relevanceTypes.set(types),
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Fehler',
          detail: 'Relevanzarten konnten nicht geladen werden',
        });
      },
    });
  }

  isFormValid(): boolean {
    return (
      !!this.selectedGrade &&
      this.fillPercentage >= 1 &&
      this.fillPercentage <= 100 &&
      this.startDate !== null &&
      this.endDate !== null &&
      this.startDate <= this.endDate
    );
  }

  search(): void {
    if (!this.isFormValid() || !this.startDate || !this.endDate) return;

    this.searching.set(true);
    this.searchResult.set(null);

    // Store search parameters for display in results
    this.lastSearchStartDate.set(this.startDate);
    this.lastSearchEndDate.set(this.endDate);
    this.lastSearchRelevanceTypes.set([...this.selectedRelevanceTypes]);

    const request = {
      startDate: this.formatDate(this.startDate),
      endDate: this.formatDate(this.endDate),
      employeeGrade: this.selectedGrade,
      fillPercentage: this.fillPercentage,
      relevanceTypes: this.selectedRelevanceTypes.length > 0 ? this.selectedRelevanceTypes : null,
    };

    this.positionFinderService.search(request).subscribe({
      next: (result) => {
        this.searchResult.set(result);
        this.searching.set(false);
      },
      error: (err) => {
        this.searching.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Suche fehlgeschlagen',
          detail: err.error?.message || 'Stellen konnten nicht gesucht werden',
        });
      },
    });
  }

  getQualityLabel(quality: MatchQuality): string {
    switch (quality) {
      case 'EXCELLENT':
        return 'Sehr gut';
      case 'GOOD':
        return 'Gut';
      case 'FAIR':
        return 'Mittel';
      case 'POOR':
        return 'Schwach';
      default:
        return quality;
    }
  }

  getQualitySeverity(
    quality: MatchQuality,
  ): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    switch (quality) {
      case 'EXCELLENT':
        return 'success';
      case 'GOOD':
        return 'info';
      case 'FAIR':
        return 'warn';
      case 'POOR':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  getWasteClass(wastePercentage: number): string {
    if (wastePercentage <= 20) return 'waste-low';
    if (wastePercentage <= 40) return 'waste-medium';
    return 'waste-high';
  }

  getWarningsText(match: PositionMatch): string {
    // Translate warnings to German
    return match.warnings
      .map((w) => {
        if (w.includes('High budget waste')) return 'Hoher Budgetverlust';
        if (w.includes('multiple assignments')) return 'Mehrere Zuweisungen vorhanden';
        if (w.includes('Partial time overlap')) return 'Nur teilweise zeitliche Überlappung';
        return w;
      })
      .join('\n');
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
