import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { GradeValue } from './grade-value.model';

@Injectable({
  providedIn: 'root',
})
export class GradeValueService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/v2/grade-values`;

  getAll(activeOnly = false): Observable<GradeValue[]> {
    let params = new HttpParams();
    if (activeOnly) {
      params = params.set('activeOnly', 'true');
    }
    return this.http.get<GradeValue[]>(this.apiUrl, { params });
  }

  getById(id: string): Observable<GradeValue> {
    return this.http.get<GradeValue>(`${this.apiUrl}/${id}`);
  }

  getGradesInUse(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/in-use`);
  }

  create(gradeValue: Partial<GradeValue>): Observable<GradeValue> {
    return this.http.post<GradeValue>(this.apiUrl, gradeValue);
  }

  update(id: string, gradeValue: Partial<GradeValue>): Observable<GradeValue> {
    return this.http.put<GradeValue>(`${this.apiUrl}/${id}`, gradeValue);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
