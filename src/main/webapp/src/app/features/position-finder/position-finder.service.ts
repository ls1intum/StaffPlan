import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PositionFinderRequest, PositionFinderResponse } from './position-finder.model';

@Injectable({
  providedIn: 'root',
})
export class PositionFinderService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/v2/position-finder`;

  search(request: PositionFinderRequest): Observable<PositionFinderResponse> {
    return this.http.post<PositionFinderResponse>(`${this.apiUrl}/search`, request);
  }
}
