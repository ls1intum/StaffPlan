import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-access-denied',
  template: `
    <div class="access-denied">
      <div class="card">
        <i class="pi pi-lock icon"></i>
        <h2>Anmeldung erfolgreich</h2>
        <p>
          Sie haben sich erfolgreich angemeldet, aber Sie haben keine Zugriffsrechte für diese
          Anwendung.
        </p>
        <p>
          Bitte kontaktieren Sie
          <a href="mailto:krusche&#64;tum.de">Prof. Dr. Stephan Krusche</a>, wenn Sie Zugang zu
          Position Manager benötigen.
        </p>
      </div>
    </div>
  `,
  styles: `
    .access-denied {
      display: flex;
      justify-content: center;
      align-items: center;
      flex: 1;
      padding: 2rem;
    }

    .card {
      background: var(--p-surface-card);
      border: 1px solid var(--p-surface-border);
      border-radius: 8px;
      padding: 2rem 3rem;
      text-align: center;
      max-width: 500px;
    }

    .icon {
      font-size: 3rem;
      color: var(--p-orange-500);
      margin-bottom: 1rem;
    }

    h2 {
      margin: 0 0 1rem 0;
      color: var(--p-text-color);
    }

    p {
      margin: 0.5rem 0;
      color: var(--p-text-muted-color);
      line-height: 1.5;
    }

    a {
      color: var(--p-primary-color);
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccessDeniedComponent {}
