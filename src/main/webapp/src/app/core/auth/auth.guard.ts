import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  await authService.login();
  return false;
};

export const roleGuard =
  (requiredRoles: string[]): CanActivateFn =>
  () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) {
      return router.createUrlTree(['/']);
    }

    const hasRequiredRole = requiredRoles.some((role) => authService.hasRole(role));
    if (!hasRequiredRole) {
      return router.createUrlTree(['/unauthorized']);
    }

    return true;
  };
