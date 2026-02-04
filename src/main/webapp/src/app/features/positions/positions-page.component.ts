import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Button } from 'primeng/button';
import { SecurityStore } from '../../core/security';
import { PositionService } from './position.service';
import { PositionUploadComponent } from './upload/position-upload.component';
import { PositionGanttComponent } from './gantt/position-gantt.component';
import { Position } from './position.model';

@Component({
  selector: 'app-positions-page',
  imports: [Button, PositionUploadComponent, PositionGanttComponent],
  template: `
    <div class="positions-page">
      @if (loading()) {
        <div class="loading">Positionen werden geladen...</div>
      } @else {
        <app-position-gantt
          [positions]="positions()"
          [canManage]="canManage()"
          (clearData)="clearPositions()"
        >
          <div class="header-actions" header-slot>
            @if (canManage()) {
              <app-position-upload (uploaded)="loadPositions()" />
            }
            <p-button
              label="Aktualisieren"
              icon="pi pi-refresh"
              [outlined]="true"
              size="small"
              styleClass="compact-btn"
              (onClick)="loadPositions()"
            />
          </div>
        </app-position-gantt>
      }
    </div>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
    }

    .positions-page {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      padding: 0;
    }

    .header-actions {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .loading {
      padding: 2rem;
      text-align: center;
      color: var(--p-text-muted-color);
    }

    :host ::ng-deep .compact-btn {
      font-size: 0.65rem !important;
      padding: 0.25rem 0.5rem !important;
      height: 1.5rem;

      .p-button-icon {
        font-size: 0.7rem !important;
      }
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
    if (!confirm('Möchten Sie wirklich alle Daten löschen?')) {
      return;
    }
    this.positionService.deletePositions().subscribe({
      next: () => {
        this.positions.set([]);
      },
      error: (err) => {
        console.error('Failed to delete positions:', err);
        alert('Fehler beim Löschen der Daten. Bitte versuchen Sie es erneut.');
      },
    });
  }
}
