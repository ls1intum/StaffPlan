import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UserDTO {
  id: string;
  universityId: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  lastLoginAt: string | null;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/v2/users`;

  getCurrentUser(): Observable<UserDTO> {
    return this.http.get<UserDTO>(`${this.apiUrl}/me`);
  }

  getAllUsers(): Observable<UserDTO[]> {
    return this.http.get<UserDTO[]>(this.apiUrl);
  }

  updateUserRoles(userId: string, roles: string[]): Observable<UserDTO> {
    return this.http.put<UserDTO>(`${this.apiUrl}/${userId}/roles`, roles);
  }
}
