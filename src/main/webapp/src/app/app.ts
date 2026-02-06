import { HttpBackend, HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { SecurityStore } from './core/security';
import { environment } from '../environments/environment';
import { AccessDeniedComponent } from './features/access-denied/access-denied.component';

interface ActuatorInfoResponse {
  build?: {
    version?: string;
  };
  git?: {
    commit?: {
      id?: string;
      'id.abbrev'?: string;
    };
    'commit.id.abbrev'?: string;
  };
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AccessDeniedComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly securityStore = inject(SecurityStore);
  protected readonly releasePageUrl = 'https://github.com/ls1intum/StaffPlan/releases';
  protected readonly buildVersion = signal<string | undefined>(undefined);
  protected readonly shortCommitHash = signal<string | undefined>(undefined);
  protected readonly releaseLabel = computed(() => {
    const version = this.buildVersion();
    const shortCommitHash = this.shortCommitHash();

    if (version && shortCommitHash) {
      return `Version ${version} (${shortCommitHash})`;
    }
    if (version) {
      return `Version ${version}`;
    }
    return undefined;
  });

  private readonly publicHttp = new HttpClient(inject(HttpBackend));

  constructor() {
    void this.fetchBuildMetadata();
  }

  private async fetchBuildMetadata(): Promise<void> {
    try {
      const info = await firstValueFrom(
        this.publicHttp.get<ActuatorInfoResponse>(`${environment.apiUrl}/actuator/info`),
      );
      const version = info.build?.version?.trim();
      const commitId =
        info.git?.commit?.['id.abbrev'] ?? info.git?.commit?.id ?? info.git?.['commit.id.abbrev'];

      if (version) {
        this.buildVersion.set(version);
      }
      if (commitId) {
        this.shortCommitHash.set(commitId.substring(0, 7));
      }
    } catch {
      // Info endpoint can be unavailable during local frontend-only development.
    }
  }
}
