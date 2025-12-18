import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Position, ImportResult } from './position.model';

@Injectable({
  providedIn: 'root',
})
export class PositionService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/v2/positions`;

  getPositions(researchGroupId?: string): Observable<Position[]> {
    let params = new HttpParams();
    if (researchGroupId) {
      params = params.set('researchGroupId', researchGroupId);
    }
    return this.http.get<Position[]>(this.apiUrl, { params });
  }

  uploadCsv(file: File, researchGroupId?: string): Observable<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    if (researchGroupId) {
      formData.append('researchGroupId', researchGroupId);
    }
    return this.http.post<ImportResult>(`${this.apiUrl}/import`, formData);
  }

  deletePositions(researchGroupId?: string): Observable<void> {
    let params = new HttpParams();
    if (researchGroupId) {
      params = params.set('researchGroupId', researchGroupId);
    }
    return this.http.delete<void>(this.apiUrl, { params });
  }
}
