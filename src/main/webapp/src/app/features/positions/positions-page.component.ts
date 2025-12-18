import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { AuthService } from '../../core/auth';
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
              <p-button
                label="Refresh"
                icon="pi pi-refresh"
                [outlined]="true"
                (onClick)="loadPositions()"
              />
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
  private readonly authService = inject(AuthService);

  readonly positions = signal<Position[]>([]);
  readonly loading = signal(false);
  readonly canManage = this.authService.isJobManager;

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
}
