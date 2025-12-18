import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { FileUpload } from 'primeng/fileupload';
import { Message } from 'primeng/message';
import { PositionService } from '../position.service';

interface UploadEvent {
  files: File[];
}

@Component({
  selector: 'app-position-upload',
  imports: [FileUpload, Message],
  template: `
    <div class="upload-container">
      <h3>Import Positions from CSV</h3>
      <p-fileupload
        mode="basic"
        name="file"
        accept=".csv"
        [maxFileSize]="10000000"
        chooseLabel="Choose CSV File"
        [auto]="true"
        (onSelect)="onFileSelect($event)"
      />

      @if (uploading()) {
        <p-message severity="info" text="Uploading..." />
      }

      @if (successMessage(); as msg) {
        <p-message severity="success" [text]="msg" />
      }

      @if (errorMessage(); as msg) {
        <p-message severity="error" [text]="msg" />
      }
    </div>
  `,
  styles: `
    .upload-container {
      padding: 1rem;
      border: 1px solid var(--p-surface-300);
      border-radius: 8px;
      margin-bottom: 1rem;

      h3 {
        margin-top: 0;
        margin-bottom: 1rem;
      }

      p-message {
        display: block;
        margin-top: 1rem;
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
        this.successMessage.set(`Successfully imported ${result.count} positions`);
        this.uploaded.emit();
      },
      error: (err) => {
        this.uploading.set(false);
        this.errorMessage.set(err.error?.error || 'Failed to upload file');
      },
    });
  }
}
