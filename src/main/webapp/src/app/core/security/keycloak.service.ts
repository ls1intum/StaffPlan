import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import Keycloak from 'keycloak-js';

@Injectable({ providedIn: 'root' })
export class KeycloakService {
  _keycloak: Keycloak | undefined;

  get keycloak() {
    if (!this._keycloak) {
      this._keycloak = new Keycloak({
        url: environment.keycloak.url,
        realm: environment.keycloak.realm,
        clientId: environment.keycloak.clientId,
      });
    }
    return this._keycloak;
  }

  async init() {
    return await this.keycloak.init({
      onLoad: 'check-sso',
      silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
      silentCheckSsoFallback: true,
      checkLoginIframe: true,
      pkceMethod: 'S256',
    });
  }

  get bearer() {
    return this.keycloak.token;
  }

  async updateToken() {
    if (!this.keycloak.isTokenExpired(60)) {
      return false;
    }
    try {
      return await this.keycloak.updateToken(60);
    } catch (error) {
      console.error('Failed to refresh token:', error);
      await this.keycloak.login();
      return false;
    }
  }

  login(returnUrl?: string) {
    return this.keycloak.login({
      redirectUri: window.location.origin + (returnUrl || ''),
      action: 'webauthn-register-passwordless:skip_if_exists',
    });
  }

  logout() {
    return this.keycloak.logout({ redirectUri: window.location.origin });
  }
}
