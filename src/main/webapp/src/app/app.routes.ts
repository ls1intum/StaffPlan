import { Routes } from '@angular/router';
import { authGuard } from './core/security';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/landing/landing-page.component').then((m) => m.LandingPageComponent),
  },
  {
    path: 'positions',
    loadComponent: () =>
      import('./features/positions/positions-page.component').then((m) => m.PositionsPageComponent),
    canActivate: [authGuard],
  },
];
