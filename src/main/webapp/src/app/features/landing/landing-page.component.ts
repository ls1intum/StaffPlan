import { ChangeDetectionStrategy, Component, inject, effect } from '@angular/core';
import { Router } from '@angular/router';
import { SecurityStore } from '../../core/security';

@Component({
  selector: 'app-landing-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="landing-container">
      @if (securityStore.isLoading()) {
        <p>Loading...</p>
      } @else {
        <h2>Welcome to StaffPlan</h2>
        <p>Manage your staff positions efficiently.</p>
        <p>Please use the Login button in the header to access the application.</p>
      }
    </div>
  `,
  styles: `
    .landing-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 60vh;
      text-align: center;
      padding: 2rem;
    }

    h2 {
      font-size: 2rem;
      margin-bottom: 1rem;
    }

    p {
      margin-bottom: 1rem;
      color: var(--text-color-secondary);
    }
  `,
})
export class LandingPageComponent {
  protected readonly securityStore = inject(SecurityStore);
  private readonly router = inject(Router);

  constructor() {
    // Redirect authenticated users to positions once loading completes
    effect(() => {
      if (!this.securityStore.isLoading() && this.securityStore.user()) {
        this.router.navigate(['/positions']);
      }
    });
  }
}
