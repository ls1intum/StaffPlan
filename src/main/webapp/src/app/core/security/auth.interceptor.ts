import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap } from 'rxjs';
import { KeycloakService } from './keycloak.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const keycloakService = inject(KeycloakService);

  // update access token to prevent 401s
  return from(keycloakService.updateToken()).pipe(
    switchMap(() => {
      // add bearer token to request
      const bearer = keycloakService.bearer;

      if (!bearer) {
        return next(req);
      }

      return next(
        req.clone({
          headers: req.headers.set('Authorization', `Bearer ${bearer}`),
        }),
      );
    }),
  );
};
