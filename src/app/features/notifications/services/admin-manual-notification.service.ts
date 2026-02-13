import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SendManualNotificationRequest } from '../models/send-manual-notification-request.model';
import { SendManualNotificationResponse } from '../models/send-manual-notification-response.model';

@Injectable({
  providedIn: 'root'
})
export class AdminManualNotificationService {
  private http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/api/admin/notifications';

  private getHttpOptions() {
    return {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    };
  }

  /** Enviar notificación manual (solo admin). */
  sendManualNotification(body: SendManualNotificationRequest): Observable<SendManualNotificationResponse> {
    return this.http.post<SendManualNotificationResponse>(
      `${this.apiUrl}/send`,
      body,
      this.getHttpOptions()
    );
  }
}

