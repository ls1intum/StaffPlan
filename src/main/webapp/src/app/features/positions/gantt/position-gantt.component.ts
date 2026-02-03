import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Tooltip } from 'primeng/tooltip';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Checkbox } from 'primeng/checkbox';
import {
  Position,
  EmployeeAssignment,
  GroupedPosition,
  TimeSlice,
} from '../position.model';

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
  bands: BandSegment[][]; // Pre-computed: bands[bandLevel][segmentIndex]
}

interface MonthHeader {
  key: string;
  label: string;
  widthPercent: number;
}

@Component({
  selector: 'app-position-gantt',
  imports: [DecimalPipe, Tooltip, FormsModule, InputText, Select, Checkbox],
  templateUrl: './position-gantt.component.html',
  styles: `
    .gantt-container {
      border: 1px solid var(--p-surface-300);
      border-radius: 8px;
      overflow: hidden;
      background: var(--p-surface-0);
    }

    /* Filter Bar */
    .filter-bar {
      display: flex;
      gap: 1rem;
      padding: 0.75rem 1rem;
      background: var(--p-surface-50);
      border-bottom: 1px solid var(--p-surface-300);
      flex-wrap: wrap;
      align-items: flex-end;
    }

    .filter-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;

      label {
        font-size: 0.75rem;
        color: var(--p-text-muted-color);
        font-weight: 500;
      }

      input {
        width: 200px;
      }
    }

    .checkbox-item {
      flex-direction: row;
      align-items: center;
      gap: 0.5rem;
      padding-bottom: 0.25rem;

      label {
        font-size: 0.875rem;
        color: var(--p-text-color);
      }
    }

    .filter-stats {
      margin-left: auto;
      font-size: 0.875rem;
      color: var(--p-text-muted-color);
      padding-bottom: 0.25rem;
    }

    .white-spot-count {
      color: #ef4444;
      font-weight: 500;
    }

    /* Header */
    .gantt-header {
      display: flex;
      background: var(--p-surface-100);
      border-bottom: 1px solid var(--p-surface-300);
      font-weight: 600;
      font-size: 0.8rem;
    }

    .gantt-label-header {
      width: 250px;
      min-width: 250px;
      padding: 0.5rem 0.75rem;
      border-right: 1px solid var(--p-surface-300);
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .header-grade {
      width: 50px;
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
    }

    .gantt-month {
      padding: 0.5rem 0.25rem;
      text-align: center;
      border-right: 1px solid var(--p-surface-200);
      font-size: 0.75rem;
    }

    /* Body */
    .gantt-body-wrapper {
      position: relative;
    }

    .gantt-body {
      max-height: 600px;
      overflow-y: auto;
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

    /* Row */
    .gantt-row {
      display: flex;
      border-bottom: 1px solid var(--p-surface-200);

      &:hover {
        background: var(--p-surface-50);
      }

      &.has-gaps {
        border-left: 3px solid #ef4444;
      }
    }

    .gantt-label {
      width: 250px;
      min-width: 250px;
      padding: 0.5rem 0.75rem;
      border-right: 1px solid var(--p-surface-300);
      display: flex;
      gap: 0.5rem;
      align-items: center;
      font-size: 0.8rem;
    }

    .grade-badge {
      padding: 0.125rem 0.375rem;
      border-radius: 4px;
      font-size: 0.7rem;
      font-weight: 600;
      min-width: 40px;
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
      min-height: 48px;
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
      gap: 2rem;
      padding: 0.75rem 1rem;
      background: var(--p-surface-50);
      border-top: 1px solid var(--p-surface-300);
      font-size: 0.8rem;
      flex-wrap: wrap;
    }

    .legend-section {
      display: flex;
      align-items: center;
      gap: 0.75rem;
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

  // Constants
  readonly bandLevels = [3, 2, 1, 0] as const;

  // Filter signals
  readonly searchTerm = signal('');
  readonly filterGrade = signal<string | null>(null);
  readonly showOnlyUnfilled = signal(false);

  // Current date signal (can be injected for testing)
  private readonly today = signal(new Date());

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
          baseGrade: p.baseGrade,
          positionValue: p.positionValue || 1,
          assignments: [],
          dateRange: { start: new Date(), end: new Date() },
        };
        groups.set(objectId, group);
      }

      // Add assignment if there's a personnel number or percentage
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

    // Calculate date ranges for each group
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

  // Computed: overall date range
  private readonly dateRange = computed(() => {
    const groups = this.groupedPositions();
    const now = this.today();

    if (groups.length === 0) {
      return {
        start: new Date(now.getFullYear(), 0, 1),
        end: new Date(now.getFullYear(), 11, 31),
      };
    }

    let minDate: Date | null = null;
    let maxDate: Date | null = null;

    for (const group of groups) {
      for (const assignment of group.assignments) {
        if (minDate === null || assignment.startDate < minDate) {
          minDate = assignment.startDate;
        }
        if (assignment.endDate.getFullYear() < 2099) {
          if (maxDate === null || assignment.endDate > maxDate) {
            maxDate = assignment.endDate;
          }
        }
      }
    }

    // Default to current year if no valid dates
    if (minDate === null) minDate = new Date(now.getFullYear(), 0, 1);
    if (maxDate === null) maxDate = new Date(now.getFullYear(), 11, 31);

    // Extend range to full months
    minDate = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    maxDate = new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 0);

    // Ensure at least 12 months shown
    const monthsDiff =
      (maxDate.getFullYear() - minDate.getFullYear()) * 12 +
      (maxDate.getMonth() - minDate.getMonth());
    if (monthsDiff < 12) {
      maxDate = new Date(minDate.getFullYear(), minDate.getMonth() + 12, 0);
    }

    return { start: minDate, end: maxDate };
  });

  // Computed: today marker position
  readonly todayMarkerPosition = computed((): number | null => {
    const range = this.dateRange();
    const now = this.today();

    if (now < range.start || now > range.end) {
      return null;
    }

    const totalDays = this.daysBetween(range.start, range.end);
    const daysFromStart = this.daysBetween(range.start, now);

    return (daysFromStart / totalDays) * 100;
  });

  // Computed: month headers
  readonly months = computed((): MonthHeader[] => {
    const range = this.dateRange();
    const result: MonthHeader[] = [];

    const totalDays = this.daysBetween(range.start, range.end);
    let current = new Date(range.start);

    while (current <= range.end) {
      const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
      const endOfPeriod = monthEnd < range.end ? monthEnd : range.end;
      const daysInMonth = this.daysBetween(current, endOfPeriod);

      result.push({
        key: `${current.getFullYear()}-${current.getMonth()}`,
        label: current.toLocaleDateString('en-US', {
          month: 'short',
          year: '2-digit',
        }),
        widthPercent: (daysInMonth / totalDays) * 100,
      });

      current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    }

    return result;
  });

  // Computed: grade options for filter
  readonly gradeOptions = computed(() => {
    const groups = this.groupedPositions();
    const grades = new Set<string>();

    for (const group of groups) {
      if (group.baseGrade) {
        grades.add(group.baseGrade);
      }
    }

    return Array.from(grades)
      .sort()
      .map((g) => ({ label: g, value: g }));
  });

  // Computed: Gantt rows with pre-computed bands
  readonly ganttRows = computed((): GanttBandRow[] => {
    const groups = this.groupedPositions();
    const range = this.dateRange();
    const totalDays = this.daysBetween(range.start, range.end);
    const now = this.today();

    return groups.map((group) => {
      const slices = this.calculateTimeSlices(group, range);

      // Pre-compute segments with percentages
      const segments = slices.map((slice) => ({
        startPercent: (this.daysBetween(range.start, slice.start) / totalDays) * 100,
        widthPercent: (this.daysBetween(slice.start, slice.end) / totalDays) * 100,
        fillPercentage: slice.totalFillPercentage,
        assignments: slice.assignments,
        isGap: slice.totalFillPercentage < 100,
      }));

      // Pre-compute all bands
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

      // Calculate current fill (at today or latest assignment)
      const currentSlice = slices.find((s) => now >= s.start && now <= s.end);
      const totalCurrentFill = currentSlice?.totalFillPercentage || 0;

      const hasGaps = segments.some((s) => s.isGap && s.widthPercent > 0.5);

      return {
        position: group,
        totalCurrentFill,
        hasGaps,
        gradeClass: this.getGradeClass(group.baseGrade),
        bands,
      };
    });
  });

  // Computed: filtered rows
  readonly filteredRows = computed((): GanttBandRow[] => {
    let rows = this.ganttRows();
    const search = this.searchTerm().toLowerCase();
    const grade = this.filterGrade();
    const unfilledOnly = this.showOnlyUnfilled();

    if (search) {
      rows = rows.filter(
        (r) =>
          r.position.objectDescription?.toLowerCase().includes(search) ||
          r.position.objectCode?.toLowerCase().includes(search) ||
          r.position.baseGrade?.toLowerCase().includes(search) ||
          r.position.assignments.some((a) =>
            a.personnelNumber.toLowerCase().includes(search)
          )
      );
    }

    if (grade) {
      rows = rows.filter((r) => r.position.baseGrade === grade);
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

  // Calculate time slices for a position
  private calculateTimeSlices(
    group: GroupedPosition,
    range: { start: Date; end: Date }
  ): TimeSlice[] {
    const assignments = group.assignments;

    if (assignments.length === 0) {
      return [
        {
          start: range.start,
          end: range.end,
          totalFillPercentage: 0,
          assignments: [],
        },
      ];
    }

    // Collect all boundary dates
    const boundaries = new Set<number>();
    boundaries.add(range.start.getTime());
    boundaries.add(range.end.getTime());

    for (const a of assignments) {
      const start = Math.max(a.startDate.getTime(), range.start.getTime());
      const end = Math.min(a.endDate.getTime(), range.end.getTime());
      boundaries.add(start);
      boundaries.add(end);
    }

    const sortedBoundaries = Array.from(boundaries).sort((a, b) => a - b);
    const slices: TimeSlice[] = [];

    for (let i = 0; i < sortedBoundaries.length - 1; i++) {
      const sliceStart = new Date(sortedBoundaries[i]);
      const sliceEnd = new Date(sortedBoundaries[i + 1]);

      // Find all assignments active during this slice
      const activeAssignments = assignments.filter(
        (a) => a.startDate <= sliceEnd && a.endDate >= sliceStart
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

  // Build tooltip string for a segment
  private buildSegmentTooltip(
    group: GroupedPosition,
    segment: { assignments: EmployeeAssignment[]; fillPercentage: number }
  ): string {
    const lines: string[] = [
      group.objectDescription || group.objectCode || 'Unknown Position',
      `Grade: ${group.baseGrade || 'N/A'}`,
      '',
    ];

    if (segment.assignments.length === 0) {
      lines.push('No assignments (White Spot)');
    } else {
      lines.push('Assignments:');
      for (const a of segment.assignments) {
        const start = a.startDate.toLocaleDateString();
        const end =
          a.endDate.getFullYear() >= 2099
            ? 'ongoing'
            : a.endDate.toLocaleDateString();
        lines.push(`  ${a.personnelNumber}: ${a.percentage}% (${start} - ${end})`);
      }

      const total = segment.assignments.reduce((s, a) => s + a.percentage, 0);
      lines.push('');
      lines.push(`Total Fill: ${total.toFixed(1)}%`);

      if (total < 100) {
        lines.push(`Gap: ${(100 - total).toFixed(1)}% unfilled`);
      }
    }

    return lines.join('\n');
  }

  // Get CSS class for grade badge
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
