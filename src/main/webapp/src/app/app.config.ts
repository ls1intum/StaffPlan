import {
  APP_INITIALIZER,
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';

import { routes } from './app.routes';
import { AuthService, authInterceptor } from './core/auth';

/**
 * Only initialize Keycloak if returning from OAuth callback.
 * This allows the landing page to load instantly without contacting Keycloak.
 */
function initializeKeycloakIfCallback(authService: AuthService) {
  return () => {
    const hash = window.location.hash;
    const search = window.location.search;
    const hasCallback =
      hash.includes('code=') ||
      hash.includes('access_token=') ||
      hash.includes('error=') ||
      search.includes('code=') ||
      search.includes('error=');

    if (hasCallback) {
      return authService.init();
    }
    return Promise.resolve(true);
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    providePrimeNG({
      theme: {
        preset: Aura,
      },
    }),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeKeycloakIfCallback,
      deps: [AuthService],
      multi: true,
    },
  ],
};
