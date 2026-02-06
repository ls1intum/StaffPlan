import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <div class="not-found-page">
      <h1>404</h1>
      <h2>Seite nicht gefunden</h2>
      <p>Die angeforderte Seite existiert nicht oder wurde verschoben.</p>
      <a routerLink="/" class="home-link">Zur Startseite</a>
    </div>
  `,
  styles: `
    .not-found-page {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 60vh;
      text-align: center;
      padding: 2rem;

      h1 {
        font-size: 4rem;
        margin: 0;
        color: var(--p-primary-color, #3b82f6);
      }

      h2 {
        margin: 0.5rem 0 1rem;
        color: var(--p-text-color, #1e293b);
      }

      p {
        color: var(--p-text-muted-color, #64748b);
        margin-bottom: 1.5rem;
      }

      .home-link {
        color: var(--p-primary-color, #3b82f6);
        text-decoration: none;
        font-weight: 500;

        &:hover {
          text-decoration: underline;
        }
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundComponent {}
