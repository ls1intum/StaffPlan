import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { Tooltip } from 'primeng/tooltip';
import { Position } from '../position.model';

interface GanttRow {
  position: Position;
  leftPercent: number;
  widthPercent: number;
  color: string;
}

@Component({
  selector: 'app-position-gantt',
  imports: [Tooltip],
  template: `
    <div class="gantt-container">
      <div class="gantt-header">
        <div class="gantt-label-header">Position</div>
        <div class="gantt-timeline-header">
          @for (month of months(); track month.key) {
            <div class="gantt-month" [style.width.%]="month.widthPercent">
              {{ month.label }}
            </div>
          }
        </div>
      </div>

      <div class="gantt-body">
        @for (row of ganttRows(); track row.position.id) {
          <div class="gantt-row">
            <div class="gantt-label" [title]="row.position.objectDescription ?? ''">
              {{ row.position.objectDescription || row.position.objectCode || 'Unknown' }}
            </div>
            <div class="gantt-timeline">
              <div
                class="gantt-bar"
                [style.left.%]="row.leftPercent"
                [style.width.%]="row.widthPercent"
                [style.backgroundColor]="row.color"
                pTooltip
                [tooltipOptions]="{
                  tooltipLabel: getTooltip(row.position),
                  tooltipPosition: 'top'
                }"
              >
                @if (row.position.percentage !== null) {
                  <span class="bar-label">{{ row.position.percentage }}%</span>
                }
              </div>
            </div>
          </div>
        }

        @if (ganttRows().length === 0) {
          <div class="no-data">No positions to display</div>
        }
      </div>

      <div class="gantt-legend">
        <span class="legend-item">
          <span class="legend-color" style="background: #ef4444;"></span> 0%
        </span>
        <span class="legend-item">
          <span class="legend-color" style="background: #f59e0b;"></span> 50%
        </span>
        <span class="legend-item">
          <span class="legend-color" style="background: #22c55e;"></span> 100%
        </span>
      </div>
    </div>
  `,
  styles: `
    .gantt-container {
      border: 1px solid var(--p-surface-300);
      border-radius: 8px;
      overflow: hidden;
    }

    .gantt-header {
      display: flex;
      background: var(--p-surface-100);
      border-bottom: 1px solid var(--p-surface-300);
      font-weight: 600;
    }

    .gantt-label-header,
    .gantt-label {
      width: 250px;
      min-width: 250px;
      padding: 0.75rem;
      border-right: 1px solid var(--p-surface-300);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .gantt-timeline-header,
    .gantt-timeline {
      flex: 1;
      display: flex;
      position: relative;
    }

    .gantt-month {
      padding: 0.75rem 0.25rem;
      text-align: center;
      border-right: 1px solid var(--p-surface-200);
      font-size: 0.8rem;
    }

    .gantt-body {
      max-height: 500px;
      overflow-y: auto;
    }

    .gantt-row {
      display: flex;
      border-bottom: 1px solid var(--p-surface-200);

      &:hover {
        background: var(--p-surface-50);
      }
    }

    .gantt-timeline {
      height: 40px;
      align-items: center;
    }

    .gantt-bar {
      position: absolute;
      height: 24px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      min-width: 2px;
    }

    .bar-label {
      font-size: 0.7rem;
      color: white;
      font-weight: 600;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }

    .no-data {
      padding: 2rem;
      text-align: center;
      color: var(--p-text-muted-color);
    }

    .gantt-legend {
      display: flex;
      gap: 1.5rem;
      padding: 0.75rem;
      background: var(--p-surface-50);
      border-top: 1px solid var(--p-surface-300);
      justify-content: center;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
    }

    .legend-color {
      width: 16px;
      height: 16px;
      border-radius: 4px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PositionGanttComponent {
  readonly positions = input<Position[]>([]);

  private readonly dateRange = computed(() => {
    const pos = this.positions();
    if (pos.length === 0) {
      const now = new Date();
      return {
        start: new Date(now.getFullYear(), 0, 1),
        end: new Date(now.getFullYear(), 11, 31),
      };
    }

    let minDate = new Date();
    let maxDate = new Date();

    pos.forEach((p) => {
      if (p.startDate) {
        const start = new Date(p.startDate);
        if (start < minDate) minDate = start;
      }
      if (p.endDate) {
        const end = new Date(p.endDate);
        if (end > maxDate) maxDate = end;
      }
    });

    minDate = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    maxDate = new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 0);

    return { start: minDate, end: maxDate };
  });

  readonly months = computed(() => {
    const range = this.dateRange();
    const months: { key: string; label: string; widthPercent: number }[] = [];

    const totalDays = this.daysBetween(range.start, range.end);
    let current = new Date(range.start);

    while (current <= range.end) {
      const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
      const endOfPeriod = monthEnd < range.end ? monthEnd : range.end;
      const daysInMonth = this.daysBetween(current, endOfPeriod);

      months.push({
        key: `${current.getFullYear()}-${current.getMonth()}`,
        label: current.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        widthPercent: (daysInMonth / totalDays) * 100,
      });

      current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    }

    return months;
  });

  readonly ganttRows = computed((): GanttRow[] => {
    const pos = this.positions();
    const range = this.dateRange();
    const totalDays = this.daysBetween(range.start, range.end);

    return pos.map((position) => {
      const start = position.startDate ? new Date(position.startDate) : range.start;
      const end = position.endDate ? new Date(position.endDate) : range.end;

      const leftDays = Math.max(0, this.daysBetween(range.start, start));
      const widthDays = Math.max(1, this.daysBetween(start, end));

      return {
        position,
        leftPercent: (leftDays / totalDays) * 100,
        widthPercent: Math.min((widthDays / totalDays) * 100, 100 - (leftDays / totalDays) * 100),
        color: this.getColorForPercentage(position.percentage),
      };
    });
  });

  private daysBetween(start: Date, end: Date): number {
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }

  private getColorForPercentage(percentage: number | null): string {
    if (percentage === null) return '#94a3b8';
    if (percentage <= 0) return '#ef4444';
    if (percentage >= 100) return '#22c55e';
    if (percentage >= 50) {
      const ratio = (percentage - 50) / 50;
      return this.interpolateColor('#f59e0b', '#22c55e', ratio);
    }
    const ratio = percentage / 50;
    return this.interpolateColor('#ef4444', '#f59e0b', ratio);
  }

  private interpolateColor(color1: string, color2: string, ratio: number): string {
    const hex = (c: string) => parseInt(c, 16);
    const r1 = hex(color1.slice(1, 3));
    const g1 = hex(color1.slice(3, 5));
    const b1 = hex(color1.slice(5, 7));
    const r2 = hex(color2.slice(1, 3));
    const g2 = hex(color2.slice(3, 5));
    const b2 = hex(color2.slice(5, 7));

    const r = Math.round(r1 + (r2 - r1) * ratio);
    const g = Math.round(g1 + (g2 - g1) * ratio);
    const b = Math.round(b1 + (b2 - b1) * ratio);

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  getTooltip(position: Position): string {
    const lines = [
      position.objectDescription || position.objectCode || 'Unknown Position',
      `Status: ${position.status || 'N/A'}`,
      `Fill: ${position.percentage ?? 'N/A'}%`,
      `Period: ${position.startDate || 'N/A'} - ${position.endDate || 'N/A'}`,
    ];
    if (position.personnelNumber) {
      lines.push(`Personnel: ${position.personnelNumber}`);
    }
    return lines.join('\n');
  }
}
