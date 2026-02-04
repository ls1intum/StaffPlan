import { inject, Injectable, Injector } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { SecurityStore } from './security-store.service';
import { filter, map, Observable, switchMap, take } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class JobManagerGuard implements CanActivate {
  private readonly injector = inject(Injector);
  private readonly securityStore = inject(SecurityStore);
  private readonly router = inject(Router);

  canActivate(): Observable<boolean | UrlTree> {
    return toObservable(this.securityStore.isLoading, { injector: this.injector }).pipe(
      filter((loading) => !loading),
      take(1),
      switchMap(() =>
        toObservable(this.securityStore.user, { injector: this.injector }).pipe(take(1)),
      ),
      map((user) => {
        if (user === undefined) {
          this.securityStore.signIn(this.router.url);
          return false;
        }
        if (this.securityStore.isJobManager() || this.securityStore.isAdmin()) {
          return true;
        }
        // Redirect non-job-managers to home
        return this.router.createUrlTree(['/']);
      }),
    );
  }
}

export const jobManagerGuard = () => inject(JobManagerGuard).canActivate();
