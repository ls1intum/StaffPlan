import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { SecurityStore } from '../../core/security';
import { PositionService } from './position.service';
import { PositionUploadComponent } from './upload/position-upload.component';
import { PositionGanttComponent } from './gantt/position-gantt.component';
import { Position } from './position.model';

@Component({
  selector: 'app-positions-page',
  imports: [Button, Card, PositionUploadComponent, PositionGanttComponent],
  template: `
    <div class="positions-page">
      <p-card>
        <ng-template #header>
          <div class="card-header">
            <h2>Position Overview</h2>
            @if (canManage()) {
              <div class="header-actions">
                <p-button
                  label="Refresh"
                  icon="pi pi-refresh"
                  [outlined]="true"
                  (onClick)="loadPositions()"
                />
                <p-button
                  label="Clear All"
                  icon="pi pi-trash"
                  severity="danger"
                  [outlined]="true"
                  (onClick)="clearPositions()"
                />
              </div>
            }
          </div>
        </ng-template>

        @if (canManage()) {
          <app-position-upload (uploaded)="loadPositions()" />
        }

        @if (loading()) {
          <div class="loading">Loading positions...</div>
        } @else {
          <app-position-gantt [positions]="positions()" />
        }
      </p-card>
    </div>
  `,
  styles: `
    .positions-page {
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

    .header-actions {
      display: flex;
      gap: 0.5rem;
    }

    .loading {
      padding: 2rem;
      text-align: center;
      color: var(--p-text-muted-color);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PositionsPageComponent implements OnInit {
  private readonly positionService = inject(PositionService);
  private readonly securityStore = inject(SecurityStore);

  readonly positions = signal<Position[]>([]);
  readonly loading = signal(false);
  readonly canManage = computed(
    () => this.securityStore.isJobManager() || this.securityStore.isAdmin(),
  );

  ngOnInit(): void {
    this.loadPositions();
  }

  loadPositions(): void {
    this.loading.set(true);
    this.positionService.getPositions().subscribe({
      next: (positions) => {
        this.positions.set(positions);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  clearPositions(): void {
    if (!confirm('Are you sure you want to delete all positions?')) {
      return;
    }
    this.positionService.deletePositions().subscribe({
      next: () => {
        this.positions.set([]);
      },
    });
  }
}
