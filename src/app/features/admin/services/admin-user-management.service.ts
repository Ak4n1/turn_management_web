import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AdminUserResponse, AdminUsersPageResponse } from '../models/admin-user.model';

@Injectable({
  providedIn: 'root'
})
export class AdminUserManagementService {
  private http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/api/admin/users';

  getUsers(params?: {
    search?: string;
    createdFrom?: string;
    createdTo?: string;
    emailVerified?: boolean;
    profileComplete?: boolean;
    role?: string;
    enabled?: boolean;
    page?: number;
    size?: number;
  }): Observable<AdminUsersPageResponse> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.search) httpParams = httpParams.set('search', params.search);
      if (params.createdFrom) httpParams = httpParams.set('createdFrom', params.createdFrom);
      if (params.createdTo) httpParams = httpParams.set('createdTo', params.createdTo);
      if (params.emailVerified !== undefined) httpParams = httpParams.set('emailVerified', String(params.emailVerified));
      if (params.profileComplete !== undefined) httpParams = httpParams.set('profileComplete', String(params.profileComplete));
      if (params.role) httpParams = httpParams.set('role', params.role);
      if (params.enabled !== undefined) httpParams = httpParams.set('enabled', String(params.enabled));
      if (params.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
      if (params.size !== undefined) httpParams = httpParams.set('size', params.size.toString());
    }
    return this.http.get<AdminUsersPageResponse>(this.apiUrl, { params: httpParams });
  }

  getUserById(id: number): Observable<AdminUserResponse> {
    return this.http.get<AdminUserResponse>(`${this.apiUrl}/${id}`);
  }

  resendVerification(id: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/${id}/resend-verify`, {});
  }

  sendResetPassword(id: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/${id}/send-reset-password`, {});
  }

  setRole(id: number, role: string): Observable<AdminUserResponse> {
    return this.http.patch<AdminUserResponse>(`${this.apiUrl}/${id}/role`, { role });
  }

  setEnabled(id: number, enabled: boolean): Observable<AdminUserResponse> {
    return this.http.patch<AdminUserResponse>(`${this.apiUrl}/${id}/enabled`, { enabled });
  }

  /** Usuarios conectados vía WebSocket en tiempo real. */
  getOnlineUsersCount(): Observable<{ count: number; emails: string[] }> {
    return this.http.get<{ count: number; emails: string[] }>(`${this.apiUrl}/online-count`);
  }
}
