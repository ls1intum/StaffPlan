import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { FileUpload } from 'primeng/fileupload';
import { PositionService } from '../position.service';

interface UploadEvent {
  files: File[];
}

@Component({
  selector: 'app-position-upload',
  imports: [FileUpload],
  template: `
    <div class="upload-inline">
      <p-fileupload
        mode="basic"
        name="file"
        accept=".csv"
        [maxFileSize]="10000000"
        chooseLabel="CSV Import"
        chooseIcon="pi pi-upload"
        [auto]="false"
        [customUpload]="true"
        styleClass="compact-upload"
        (onSelect)="onFileSelect($event)"
      />
      @if (uploading()) {
        <span class="upload-status uploading">Lädt...</span>
      }
      @if (successMessage(); as msg) {
        <span class="upload-status success">{{ msg }}</span>
      }
      @if (errorMessage(); as msg) {
        <span class="upload-status error">{{ msg }}</span>
      }
    </div>
  `,
  styles: `
    .upload-inline {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .upload-status {
      font-size: 0.65rem;
      padding: 0.15rem 0.4rem;
      border-radius: 3px;
    }

    .upload-status.uploading {
      background: #dbeafe;
      color: #1e40af;
    }

    .upload-status.success {
      background: #dcfce7;
      color: #166534;
    }

    .upload-status.error {
      background: #fee2e2;
      color: #991b1b;
    }

    :host ::ng-deep .compact-upload {
      .p-button {
        font-size: 0.65rem !important;
        padding: 0.25rem 0.5rem !important;
        height: 1.5rem;
      }

      .p-button-icon {
        font-size: 0.7rem !important;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PositionUploadComponent {
  private readonly positionService = inject(PositionService);

  readonly uploaded = output<void>();

  readonly uploading = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  onFileSelect(event: UploadEvent): void {
    const file = event.files[0];
    if (!file) {
      return;
    }

    this.uploading.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    this.positionService.uploadCsv(file).subscribe({
      next: (result) => {
        this.uploading.set(false);
        this.successMessage.set(`${result.count} Stellen erfolgreich importiert`);
        this.uploaded.emit();
      },
      error: (err) => {
        this.uploading.set(false);
        this.errorMessage.set(err.error?.error || 'Datei konnte nicht hochgeladen werden');
      },
    });
  }
}
