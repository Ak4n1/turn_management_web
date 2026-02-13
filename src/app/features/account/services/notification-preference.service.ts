import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { NotificationPreferenceResponse } from '../models/notification-preference-response.model';
import { UpdateNotificationPreferenceRequest } from '../models/update-notification-preference-request.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationPreferenceService {
  private http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/api/user/notification-preferences';

  private getHttpOptions() {
    return {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    };
  }

  getPreferences(): Observable<NotificationPreferenceResponse> {
    return this.http.get<NotificationPreferenceResponse>(this.apiUrl, this.getHttpOptions());
  }

  updatePreferences(body: UpdateNotificationPreferenceRequest): Observable<NotificationPreferenceResponse> {
    return this.http.put<NotificationPreferenceResponse>(this.apiUrl, body, this.getHttpOptions());
  }
}
