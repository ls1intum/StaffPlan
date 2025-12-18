import { Routes } from '@angular/router';
import { authGuard } from './core/auth';

export const routes: Routes = [
  {
    path: 'positions',
    loadComponent: () =>
      import('./features/positions/positions-page.component').then(
        (m) => m.PositionsPageComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: '',
    redirectTo: 'positions',
    pathMatch: 'full',
  },
];
