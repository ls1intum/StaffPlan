import { inject, Injectable, Injector } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { SecurityStore } from './security-store.service';
import { filter, map, Observable, switchMap, take } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  private readonly injector = inject(Injector);
  private readonly securityStore = inject(SecurityStore);
  private readonly router = inject(Router);

  canActivate(): Observable<boolean | UrlTree> {
    // Wait for loading to complete, then check user
    return toObservable(this.securityStore.isLoading, { injector: this.injector }).pipe(
      filter((loading) => !loading), // Wait until loading is false
      take(1),
      switchMap(() =>
        toObservable(this.securityStore.user, { injector: this.injector }).pipe(take(1)),
      ),
      map((user) => {
        if (user !== undefined) {
          return true;
        }
        this.securityStore.signIn(this.router.url);
        return false;
      }),
    );
  }
}

export const authGuard = () => inject(AuthGuard).canActivate();
