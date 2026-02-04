import { Routes } from '@angular/router';
import { authGuard, adminGuard, jobManagerGuard } from './core/security';

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
    path: 'position-finder',
    loadComponent: () =>
      import('./features/position-finder/position-finder-page.component').then(
        (m) => m.PositionFinderPageComponent,
      ),
    canActivate: [jobManagerGuard],
  },
  {
    path: 'admin/users',
    loadComponent: () =>
      import('./features/admin/admin-users.component').then((m) => m.AdminUsersComponent),
    canActivate: [adminGuard],
  },
  {
    path: 'admin/grade-values',
    loadComponent: () =>
      import('./features/admin/grade-values/grade-values-admin.component').then(
        (m) => m.GradeValuesAdminComponent,
      ),
    canActivate: [adminGuard],
  },
  {
    path: 'impressum',
    loadComponent: () =>
      import('./features/legal/impressum.component').then((m) => m.ImpressumComponent),
  },
  {
    path: 'datenschutz',
    loadComponent: () =>
      import('./features/legal/privacy.component').then((m) => m.PrivacyComponent),
  },
];
