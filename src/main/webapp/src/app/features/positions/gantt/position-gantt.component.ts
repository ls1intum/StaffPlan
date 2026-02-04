import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { Tooltip } from 'primeng/tooltip';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Checkbox } from 'primeng/checkbox';
import { Button } from 'primeng/button';
import { Slider } from 'primeng/slider';
import { DatePicker } from 'primeng/datepicker';
import { Position, EmployeeAssignment, GroupedPosition, TimeSlice } from '../position.model';

interface BandSegment {
  startPercent: number;
  widthPercent: number;
  fillLevel: number;
  isFilled: boolean;
  assignments: EmployeeAssignment[];
  tooltip: string;
}

interface GanttBandRow {
  position: GroupedPosition;
  totalCurrentFill: number;
  hasGaps: boolean;
  gradeClass: string;
  bands: BandSegment[][];
}

interface MonthHeader {
  key: string;
  label: string;
  widthPercent: number;
  isFirstOfYear: boolean;
  year: number;
}

interface YearHeader {
  year: number;
  widthPercent: number;
  startPercent: number;
}

type ZoomLevel = 3 | 6 | 12 | 24 | 36 | 60;

@Component({
  selector: 'app-position-gantt',
  imports: [
    DecimalPipe,
    Tooltip,
    FormsModule,
    ScrollingModule,
    InputText,
    Select,
    Checkbox,
    Button,
    Slider,
    DatePicker,
  ],
  templateUrl: './position-gantt.component.html',
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
    }

    .gantt-container {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      border: 1px solid var(--p-surface-300);
      border-radius: 8px;
      overflow: hidden;
      background: var(--p-surface-0);
    }

    /* Filter Bar */
    .filter-bar {
      display: flex;
      gap: 0.5rem;
      padding: 0.25rem 0.5rem;
      background: var(--p-surface-50);
      border-bottom: 1px solid var(--p-surface-300);
      flex-wrap: wrap;
      align-items: flex-end;
      font-size: 0.7rem;
    }

    .filter-item {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;

      label {
        font-size: 0.6rem;
        color: var(--p-text-muted-color);
        font-weight: 500;
      }

      input {
        width: 240px;
        font-size: 0.65rem;
        padding: 0.15rem 0.3rem;
        height: 1.5rem;
      }
    }

    :host ::ng-deep .filter-bar {
      .p-select {
        font-size: 0.65rem;
        height: 1.5rem;
        min-height: 1.5rem;

        .p-select-label {
          font-size: 0.65rem;
          padding: 0.15rem 0.3rem;
        }

        .p-select-dropdown {
          width: 1.2rem;
        }
      }

      .filter-select {
        width: 5.5rem;
      }

      .filter-select-wide {
        width: 10.5rem;
      }

      .p-checkbox {
        width: 0.9rem;
        height: 0.9rem;
      }
    }

    .checkbox-item {
      flex-direction: row;
      align-items: center;
      gap: 0.25rem;
      margin-bottom: 0;
      padding-bottom: 0;
      height: 1.5rem;

      label {
        font-size: 0.6rem;
        color: var(--p-text-color);
        line-height: 1;
        white-space: nowrap;
      }
    }

    :host ::ng-deep .checkbox-item .p-checkbox {
      width: 0.85rem;
      height: 0.85rem;

      .p-checkbox-box {
        width: 0.85rem;
        height: 0.85rem;
      }
    }

    .filter-date-item {
      flex-direction: row;
      align-items: center;
      gap: 0.25rem;
      height: 1.5rem;

      label {
        font-size: 0.6rem;
        color: var(--p-text-muted-color);
        white-space: nowrap;
      }
    }

    :host ::ng-deep .filter-date-item .p-datepicker {
      font-size: 0.65rem;
      height: 1.5rem;

      input {
        font-size: 0.65rem;
        padding: 0.15rem 0.3rem;
        width: 5.5rem;
        height: 1.5rem;
      }
    }

    .filter-stats {
      margin-left: auto;
      font-size: 0.7rem;
      color: var(--p-text-muted-color);
      padding-bottom: 0.125rem;
    }

    .white-spot-count {
      color: #ef4444;
      font-weight: 500;
    }

    /* Zoom Controls */
    .zoom-controls {
      display: flex;
      gap: 0.35rem;
      padding: 0.15rem 0.5rem;
      background: var(--p-surface-50);
      border-bottom: 1px solid var(--p-surface-300);
      align-items: center;
    }

    .zoom-label {
      font-size: 0.65rem;
      color: var(--p-text-muted-color);
      font-weight: 500;
      margin-right: 0.25rem;
    }

    .zoom-btn {
      font-size: 0.65rem !important;
      padding: 0.15rem 0.4rem !important;
    }

    .zoom-btn.active {
      background: var(--p-primary-color) !important;
      color: white !important;
    }

    .timeline-slider-container {
      flex: 1;
      position: relative;
      margin-left: 0.75rem;
      padding: 0 2.5rem;
      min-width: 200px;
    }

    .slider-date-label {
      position: absolute;
      top: -0.75rem;
      font-size: 0.5rem;
      background: var(--p-primary-color);
      color: white;
      padding: 0.05rem 0.2rem;
      border-radius: 2px;
      white-space: nowrap;
      transform: translateX(-50%);
      z-index: 1;
    }

    :host ::ng-deep .timeline-slider-container {
      .p-slider {
        height: 3px;
        background: var(--p-surface-300);

        .p-slider-range {
          background: var(--p-primary-color);
        }

        .p-slider-handle {
          width: 10px;
          height: 10px;
          margin-top: -3.5px;
          background: white;
          border: 2px solid var(--p-primary-color);
        }
      }
    }

    /* Header */
    .gantt-header-wrapper {
      display: flex;
      flex-direction: column;
      background: var(--p-surface-100);
      border-bottom: 1px solid var(--p-surface-300);
    }

    .gantt-year-row {
      display: flex;
      border-bottom: 1px solid var(--p-surface-200);
    }

    .gantt-year-spacer {
      width: 320px;
      min-width: 320px;
      border-right: 1px solid var(--p-surface-300);
    }

    .gantt-year-headers {
      flex: 1;
      display: flex;
      position: relative;
      box-sizing: border-box;
    }

    .gantt-year {
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.75rem;
      color: var(--p-primary-color);
      background: rgba(59, 130, 246, 0.05);
      box-sizing: border-box;
    }

    .gantt-header {
      display: flex;
      font-weight: 600;
      font-size: 0.8rem;
    }

    .gantt-label-header {
      width: 320px;
      min-width: 320px;
      padding: 0.5rem 0.75rem;
      border-right: 1px solid var(--p-surface-300);
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .header-sap {
      width: 70px;
      font-size: 0.7rem;
    }

    .header-qual {
      width: 35px;
      font-size: 0.7rem;
    }

    .header-desc {
      flex: 1;
    }

    .header-fill {
      width: 50px;
      text-align: right;
    }

    .gantt-timeline-header {
      flex: 1;
      display: flex;
      box-sizing: border-box;
    }

    .gantt-month {
      padding: 0.25rem 0.125rem;
      text-align: center;
      border-right: 1px solid var(--p-surface-200);
      font-size: 0.6rem;
      box-sizing: border-box;

      &.year-start {
        border-left: 2px solid var(--p-primary-color);
      }
    }

    /* Body */
    .gantt-body-wrapper {
      position: relative;
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
    }

    .gantt-viewport {
      flex: 1;
      min-height: 0;
    }

    /* Today Marker */
    .today-marker {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 2px;
      background: #ef4444;
      z-index: 10;
      pointer-events: none;

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: -1px;
        width: 4px;
        height: 100%;
        background: repeating-linear-gradient(
          to bottom,
          #ef4444 0px,
          #ef4444 4px,
          transparent 4px,
          transparent 8px
        );
      }
    }

    .today-label {
      position: absolute;
      top: -18px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 0.65rem;
      color: #ef4444;
      font-weight: 600;
      white-space: nowrap;
    }

    /* Filter Date Marker (blue) */
    .filter-date-marker {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 2px;
      background: #3b82f6;
      z-index: 9;
      pointer-events: none;

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: -1px;
        width: 4px;
        height: 100%;
        background: repeating-linear-gradient(
          to bottom,
          #3b82f6 0px,
          #3b82f6 4px,
          transparent 4px,
          transparent 8px
        );
      }
    }

    .filter-date-label {
      position: absolute;
      top: -18px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 0.65rem;
      color: #3b82f6;
      font-weight: 600;
      white-space: nowrap;
    }

    /* Row */
    .gantt-row {
      display: flex;
      border-bottom: 1px solid var(--p-surface-200);
      height: 52px;

      &:hover {
        background: var(--p-surface-50);
      }

      &.has-gaps {
        border-left: 3px solid #ef4444;
      }
    }

    .gantt-label {
      width: 320px;
      min-width: 320px;
      padding: 0.5rem 0.75rem;
      border-right: 1px solid var(--p-surface-300);
      display: flex;
      gap: 0.5rem;
      align-items: center;
      font-size: 0.8rem;
    }

    .sap-nr {
      width: 70px;
      font-size: 0.7rem;
      color: var(--p-text-muted-color);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .qual-badge {
      padding: 0.125rem 0.375rem;
      border-radius: 4px;
      font-size: 0.65rem;
      font-weight: 600;
      min-width: 35px;
      text-align: center;

      &.grade-w {
        background: #dbeafe;
        color: #1e40af;
      }

      &.grade-a {
        background: #dcfce7;
        color: #166534;
      }

      &.grade-e {
        background: #fef3c7;
        color: #92400e;
      }

      &.grade-other {
        background: var(--p-surface-200);
        color: var(--p-text-color);
      }
    }

    .position-desc {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .fill-percent {
      width: 45px;
      text-align: right;
      font-weight: 600;

      &.under-filled {
        color: #ef4444;
      }

      &.over-filled {
        color: #22c55e;
      }
    }

    /* Timeline */
    .gantt-timeline {
      flex: 1;
      position: relative;
      height: 100%;
    }

    .band-container {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .band-row {
      flex: 1;
      position: relative;
      border-bottom: 1px solid var(--p-surface-100);

      &:last-child {
        border-bottom: none;
      }

      &[data-band='3'] {
        background: rgba(59, 130, 246, 0.05);
      }

      &[data-band='2'] {
        background: rgba(59, 130, 246, 0.03);
      }

      &[data-band='1'] {
        background: rgba(59, 130, 246, 0.02);
      }

      &[data-band='0'] {
        background: transparent;
      }
    }

    .band-segment {
      position: absolute;
      top: 1px;
      bottom: 1px;
      border-radius: 2px;
      transition: opacity 0.15s;

      &.filled {
        background: #3b82f6;

        &:hover {
          opacity: 0.85;
        }
      }

      &.gap {
        background: white;
        border: 1px dashed #cbd5e1;
        background-image: repeating-linear-gradient(
          45deg,
          transparent,
          transparent 3px,
          rgba(0, 0, 0, 0.03) 3px,
          rgba(0, 0, 0, 0.03) 6px
        );
      }
    }

    .segment-label {
      position: absolute;
      left: 4px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 0.6rem;
      color: white;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: calc(100% - 8px);
    }

    /* No Data */
    .no-data {
      padding: 3rem;
      text-align: center;
      color: var(--p-text-muted-color);
    }

    /* Legend */
    .gantt-legend {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0.75rem;
      background: var(--p-surface-50);
      border-top: 1px solid var(--p-surface-300);
      font-size: 0.7rem;
    }

    .legend-left {
      display: flex;
      gap: 1.5rem;
      flex-wrap: wrap;
    }

    .legend-right {
      display: flex;
      align-items: center;
    }

    .legend-section {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .legend-title {
      font-weight: 600;
      color: var(--p-text-muted-color);
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }

    .legend-color {
      width: 16px;
      height: 12px;
      border-radius: 2px;

      &.filled {
        background: #3b82f6;
      }

      &.gap {
        background: white;
        border: 1px dashed #cbd5e1;
      }
    }

    .today-line {
      width: 16px;
      height: 2px;
      background: #ef4444;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PositionGanttComponent {
  readonly positions = input<Position[]>([]);
  readonly canManage = input<boolean>(false);
  readonly clearData = output<void>();

  // Constants
  readonly bandLevels = [3, 2, 1, 0] as const;
  readonly zoomOptions: { label: string; value: ZoomLevel }[] = [
    { label: '3M', value: 3 },
    { label: '6M', value: 6 },
    { label: '1J', value: 12 },
    { label: '2J', value: 24 },
    { label: '3J', value: 36 },
    { label: '5J', value: 60 },
  ];
  readonly rowHeight = 52;

  // Filter signals
  readonly searchTerm = signal('');
  readonly filterRelevanceType = signal<string | null>(null);
  readonly filterDepartment = signal<string | null>(null);
  readonly filterQualification = signal<string | null>(null);
  readonly showOnlyUnfilled = signal(true);
  readonly filterDate = signal<Date>(new Date());

  // Zoom signal (months to display)
  readonly zoomLevel = signal<ZoomLevel>(12);

  // Current date signal
  private readonly today = signal(new Date());

  // Timeline range slider signals (as day offsets from dataRangeMin)
  readonly timelineRange = signal<[number, number]>([0, 100]);

  // Computed: overall data range - fixed to 3 years past and 3 years future
  readonly dataRange = computed(() => {
    const now = this.today();

    // Fixed range: 3 years before to 3 years after today
    const minDate = new Date(now.getFullYear() - 3, 0, 1);
    const maxDate = new Date(now.getFullYear() + 3, 11, 31);

    return { min: minDate, max: maxDate };
  });

  // Computed: total days in data range (for slider)
  readonly totalDataDays = computed(() => {
    const range = this.dataRange();
    return this.daysBetween(range.min, range.max);
  });

  // Computed: formatted dates for slider labels
  readonly sliderStartDate = computed(() => {
    const range = this.dataRange();
    const days = this.timelineRange()[0];
    const date = new Date(range.min.getTime() + days * 24 * 60 * 60 * 1000);
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' });
  });

  readonly sliderEndDate = computed(() => {
    const range = this.dataRange();
    const days = this.timelineRange()[1];
    const date = new Date(range.min.getTime() + days * 24 * 60 * 60 * 1000);
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' });
  });

  constructor() {
    // Initialize slider to show 1 year centered on today when data loads
    effect(
      () => {
        const range = this.dataRange();
        const totalDays = this.totalDataDays();
        const now = this.today();

        // Calculate today's position as days from min
        const todayOffset = Math.max(0, this.daysBetween(range.min, now) - 1);

        // Default: 6 months before and after today
        const halfYear = 182;
        const start = Math.max(0, todayOffset - halfYear);
        const end = Math.min(totalDays, todayOffset + halfYear);

        this.timelineRange.set([start, end]);
      },
      { allowSignalWrites: true },
    );
  }

  // Computed: grouped positions
  private readonly groupedPositions = computed((): GroupedPosition[] => {
    const pos = this.positions();
    const groups = new Map<string, GroupedPosition>();

    for (const p of pos) {
      const objectId = p.objectId || p.id;
      if (!objectId) continue;

      let group = groups.get(objectId);
      if (!group) {
        group = {
          objectId,
          objectCode: p.objectCode,
          objectDescription: p.objectDescription,
          tariffGroup: p.tariffGroup,
          positionValue: p.positionValue || 1,
          positionRelevanceType: p.positionRelevanceType,
          organizationUnit: p.organizationUnit,
          assignments: [],
          dateRange: { start: new Date(), end: new Date() },
        };
        groups.set(objectId, group);
      }

      if (p.personnelNumber || p.percentage) {
        const startDate = p.startDate ? new Date(p.startDate) : new Date();
        const endDate = p.endDate ? new Date(p.endDate) : new Date(2099, 11, 31);

        group.assignments.push({
          personnelNumber: p.personnelNumber || 'Unknown',
          percentage: p.percentage || 0,
          startDate,
          endDate,
          originalPosition: p,
        });
      }
    }

    for (const group of groups.values()) {
      if (group.assignments.length > 0) {
        const starts = group.assignments.map((a) => a.startDate.getTime());
        const ends = group.assignments.map((a) => a.endDate.getTime());
        group.dateRange.start = new Date(Math.min(...starts));
        group.dateRange.end = new Date(Math.max(...ends));
      }
    }

    return Array.from(groups.values());
  });

  // Computed: visible date range based on slider
  readonly visibleDateRange = computed(() => {
    const dataRange = this.dataRange();
    const [startDays, endDays] = this.timelineRange();

    const start = new Date(dataRange.min.getTime() + startDays * 24 * 60 * 60 * 1000);
    const end = new Date(dataRange.min.getTime() + endDays * 24 * 60 * 60 * 1000);

    // Round to first of month for start, last of month for end
    const startRounded = new Date(start.getFullYear(), start.getMonth(), 1);
    const endRounded = new Date(end.getFullYear(), end.getMonth() + 1, 0);

    return { start: startRounded, end: endRounded };
  });

  // Computed: formatted date range string
  readonly dateRangeDisplay = computed(() => {
    const range = this.visibleDateRange();
    const startStr = range.start.toLocaleDateString('de-DE', { month: 'short', year: 'numeric' });
    const endStr = range.end.toLocaleDateString('de-DE', { month: 'short', year: 'numeric' });
    return `${startStr} - ${endStr}`;
  });

  // Computed: today marker position
  readonly todayMarkerPosition = computed((): number | null => {
    const range = this.visibleDateRange();
    const now = this.today();

    if (now < range.start || now > range.end) {
      return null;
    }

    const totalDays = this.daysBetween(range.start, range.end);
    const daysFromStart = this.daysBetween(range.start, now);

    return (daysFromStart / totalDays) * 100;
  });

  // Computed: filter date marker position (only shown when different from today)
  readonly filterDateMarkerPosition = computed((): number | null => {
    if (!this.showOnlyUnfilled()) {
      return null;
    }

    const range = this.visibleDateRange();
    const filterDate = this.filterDate();
    const today = this.today();

    // Only show if filter date is different from today (by more than 1 day)
    const daysDiff = Math.abs(filterDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    if (daysDiff < 1) {
      return null;
    }

    if (filterDate < range.start || filterDate > range.end) {
      return null;
    }

    const totalDays = this.daysBetween(range.start, range.end);
    const daysFromStart = this.daysBetween(range.start, filterDate);

    return (daysFromStart / totalDays) * 100;
  });

  // Computed: formatted filter date for label
  readonly filterDateLabel = computed((): string => {
    return this.filterDate().toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  });

  // Computed: year headers (calculated from months to ensure alignment)
  readonly yearHeaders = computed((): YearHeader[] => {
    const monthHeaders = this.months();
    const years: YearHeader[] = [];
    const yearMap = new Map<number, { startPercent: number; widthPercent: number }>();

    let cumulativePercent = 0;
    for (const month of monthHeaders) {
      if (!yearMap.has(month.year)) {
        yearMap.set(month.year, { startPercent: cumulativePercent, widthPercent: 0 });
      }
      yearMap.get(month.year)!.widthPercent += month.widthPercent;
      cumulativePercent += month.widthPercent;
    }

    for (const [year, data] of yearMap) {
      years.push({
        year,
        startPercent: data.startPercent,
        widthPercent: data.widthPercent,
      });
    }

    return years;
  });

  // Computed: month headers
  readonly months = computed((): MonthHeader[] => {
    const range = this.visibleDateRange();
    const result: MonthHeader[] = [];
    const totalDays = this.daysBetween(range.start, range.end);
    let current = new Date(range.start);
    let lastYear = -1;

    while (current <= range.end) {
      const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
      const endOfPeriod = monthEnd < range.end ? monthEnd : range.end;
      const daysInMonth = this.daysBetween(current, endOfPeriod);
      const isFirstOfYear = current.getMonth() === 0 && lastYear !== current.getFullYear();

      result.push({
        key: `${current.getFullYear()}-${current.getMonth()}`,
        label: current.toLocaleDateString('de-DE', { month: 'short' }),
        widthPercent: (daysInMonth / totalDays) * 100,
        isFirstOfYear,
        year: current.getFullYear(),
      });

      lastYear = current.getFullYear();
      current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    }

    return result;
  });

  // Computed: relevance type options
  readonly relevanceTypeOptions = computed(() => {
    const groups = this.groupedPositions();
    const types = new Set<string>();

    for (const group of groups) {
      if (group.positionRelevanceType) {
        types.add(group.positionRelevanceType);
      }
    }

    return Array.from(types)
      .sort()
      .map((t) => ({ label: t, value: t }));
  });

  // Computed: department options
  readonly departmentOptions = computed(() => {
    const groups = this.groupedPositions();
    const departments = new Set<string>();

    for (const group of groups) {
      if (group.organizationUnit) {
        departments.add(group.organizationUnit);
      }
    }

    return Array.from(departments)
      .sort()
      .map((d) => ({ label: d, value: d }));
  });

  // Computed: qualification options
  readonly qualificationOptions = computed(() => {
    const groups = this.groupedPositions();
    const qualifications = new Set<string>();

    for (const group of groups) {
      if (group.tariffGroup) {
        qualifications.add(group.tariffGroup);
      }
    }

    return Array.from(qualifications)
      .sort()
      .map((q) => ({ label: q, value: q }));
  });

  // Computed: Gantt rows with pre-computed bands
  readonly ganttRows = computed((): GanttBandRow[] => {
    const groups = this.groupedPositions();
    const range = this.visibleDateRange();
    const totalDays = this.daysBetween(range.start, range.end);
    const referenceDate = this.filterDate();

    return groups.map((group) => {
      const slices = this.calculateTimeSlices(group, range);

      const segments = slices.map((slice) => ({
        startPercent: (this.daysBetween(range.start, slice.start) / totalDays) * 100,
        widthPercent: (this.daysBetween(slice.start, slice.end) / totalDays) * 100,
        fillPercentage: slice.totalFillPercentage,
        assignments: slice.assignments,
        isGap: slice.totalFillPercentage < 100,
      }));

      const bands: BandSegment[][] = this.bandLevels.map((bandLevel) => {
        const bandMin = bandLevel * 25;
        return segments.map((segment) => ({
          startPercent: segment.startPercent,
          widthPercent: segment.widthPercent,
          fillLevel: bandLevel,
          isFilled: segment.fillPercentage > bandMin,
          assignments: segment.assignments,
          tooltip: this.buildSegmentTooltip(group, segment),
        }));
      });

      // Use filterDate for determining current fill (for the "unfilled" filter)
      const currentSlice = slices.find((s) => referenceDate >= s.start && referenceDate <= s.end);
      const totalCurrentFill = currentSlice?.totalFillPercentage || 0;
      const hasGaps = segments.some((s) => s.isGap && s.widthPercent > 0.5);

      return {
        position: group,
        totalCurrentFill,
        hasGaps,
        gradeClass: this.getGradeClass(group.tariffGroup),
        bands,
      };
    });
  });

  // Computed: filtered rows
  readonly filteredRows = computed((): GanttBandRow[] => {
    let rows = this.ganttRows();
    const search = this.searchTerm().toLowerCase();
    const relevanceType = this.filterRelevanceType();
    const department = this.filterDepartment();
    const qualification = this.filterQualification();
    const unfilledOnly = this.showOnlyUnfilled();

    if (search) {
      rows = rows.filter(
        (r) =>
          r.position.objectDescription?.toLowerCase().includes(search) ||
          r.position.objectCode?.toLowerCase().includes(search) ||
          r.position.tariffGroup?.toLowerCase().includes(search) ||
          r.position.organizationUnit?.toLowerCase().includes(search) ||
          r.position.assignments.some((a) => a.personnelNumber.toLowerCase().includes(search)),
      );
    }

    if (relevanceType) {
      rows = rows.filter((r) => r.position.positionRelevanceType === relevanceType);
    }

    if (department) {
      rows = rows.filter((r) => r.position.organizationUnit === department);
    }

    if (qualification) {
      rows = rows.filter((r) => r.position.tariffGroup === qualification);
    }

    if (unfilledOnly) {
      rows = rows.filter((r) => r.hasGaps || r.totalCurrentFill < 100);
    }

    return rows;
  });

  // Computed: total white spots count
  readonly totalWhiteSpots = computed(() => {
    return this.ganttRows().filter((r) => r.hasGaps || r.totalCurrentFill < 100).length;
  });

  // Set zoom level
  setZoom(level: ZoomLevel): void {
    this.zoomLevel.set(level);

    // Update slider to show the specified number of months centered on today
    const dataRange = this.dataRange();
    const totalDays = this.totalDataDays();
    const now = this.today();

    const todayOffset = Math.max(0, this.daysBetween(dataRange.min, now) - 1);
    const daysToShow = level * 30; // Approximate days per month
    const halfDays = Math.floor(daysToShow / 2);

    const start = Math.max(0, todayOffset - halfDays);
    const end = Math.min(totalDays, todayOffset + halfDays);

    this.timelineRange.set([start, end]);
  }

  // Handle slider change
  onTimelineRangeChange(value: number | number[]): void {
    if (Array.isArray(value) && value.length === 2) {
      this.timelineRange.set([value[0], value[1]]);
    }
  }

  // Handle clear data
  onClearData(): void {
    this.clearData.emit();
  }

  // TrackBy function for virtual scrolling
  trackByObjectId(_index: number, row: GanttBandRow): string {
    return row.position.objectId;
  }

  // Calculate time slices for a position
  // Only shows slices within the position's actual date range (not the full visible timeline)
  private calculateTimeSlices(
    group: GroupedPosition,
    range: { start: Date; end: Date },
  ): TimeSlice[] {
    const assignments = group.assignments;

    if (assignments.length === 0) {
      // No assignments means nothing to show
      return [];
    }

    // Calculate the effective range: intersection of visible range and position's date range
    const positionStart = group.dateRange.start;
    const positionEnd = group.dateRange.end;

    const effectiveStart = new Date(Math.max(range.start.getTime(), positionStart.getTime()));
    const effectiveEnd = new Date(Math.min(range.end.getTime(), positionEnd.getTime()));

    // If position is completely outside visible range, return empty
    if (effectiveStart > effectiveEnd) {
      return [];
    }

    const boundaries = new Set<number>();
    boundaries.add(effectiveStart.getTime());
    boundaries.add(effectiveEnd.getTime());

    for (const a of assignments) {
      const start = Math.max(a.startDate.getTime(), effectiveStart.getTime());
      const end = Math.min(a.endDate.getTime(), effectiveEnd.getTime());
      if (start <= effectiveEnd.getTime() && end >= effectiveStart.getTime()) {
        boundaries.add(start);
        boundaries.add(end);
      }
    }

    const sortedBoundaries = Array.from(boundaries).sort((a, b) => a - b);
    const slices: TimeSlice[] = [];

    for (let i = 0; i < sortedBoundaries.length - 1; i++) {
      const sliceStart = new Date(sortedBoundaries[i]);
      const sliceEnd = new Date(sortedBoundaries[i + 1]);

      const activeAssignments = assignments.filter(
        (a) => a.startDate <= sliceEnd && a.endDate >= sliceStart,
      );

      const totalFill = activeAssignments.reduce((sum, a) => sum + a.percentage, 0);

      slices.push({
        start: sliceStart,
        end: sliceEnd,
        totalFillPercentage: Math.min(totalFill, 100),
        assignments: activeAssignments,
      });
    }

    return slices;
  }

  private buildSegmentTooltip(
    group: GroupedPosition,
    segment: { assignments: EmployeeAssignment[]; fillPercentage: number },
  ): string {
    const lines: string[] = [
      group.objectDescription || group.objectCode || 'Unbekannte Stelle',
      `Besoldungsgruppe: ${group.tariffGroup || 'N/A'}`,
      '',
    ];

    if (segment.assignments.length === 0) {
      lines.push('Keine Zuweisungen (Lücke)');
    } else {
      lines.push('Zuweisungen:');
      for (const a of segment.assignments) {
        const start = a.startDate.toLocaleDateString('de-DE');
        const end =
          a.endDate.getFullYear() >= 2099 ? 'unbefristet' : a.endDate.toLocaleDateString('de-DE');
        lines.push(`  ${a.personnelNumber}: ${a.percentage}% (${start} - ${end})`);
      }

      const total = segment.assignments.reduce((s, a) => s + a.percentage, 0);
      lines.push('');
      lines.push(`Gesamt: ${total.toFixed(1)}%`);

      if (total < 100) {
        lines.push(`Lücke: ${(100 - total).toFixed(1)}% unbesetzt`);
      }
    }

    return lines.join('\n');
  }

  private getGradeClass(grade: string | null): string {
    if (!grade) return 'grade-other';
    const first = grade.charAt(0).toUpperCase();
    if (first === 'W') return 'grade-w';
    if (first === 'A') return 'grade-a';
    if (first === 'E') return 'grade-e';
    return 'grade-other';
  }

  private daysBetween(start: Date, end: Date): number {
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }
}
