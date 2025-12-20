import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './core/security';

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
  {
    path: 'admin/users',
    loadComponent: () =>
      import('./features/admin/admin-users.component').then((m) => m.AdminUsersComponent),
    canActivate: [adminGuard],
  },
];
