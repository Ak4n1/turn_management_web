import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { SystemNotificationsResponse } from '../models/system-notifications-response.model';
import { SystemNotificationResponse } from '../models/system-notification-response.model';

@Injectable({
  providedIn: 'root'
})
export class UserNotificationService {
  private http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/api/notifications';

  /** Emite cuando el contador de no leídas puede haber cambiado (p. ej. al marcar como leída en la sección Notificaciones). */
  private unreadCountChanged$ = new Subject<void>();

  /** Suscribirse para refrescar la campanita del header cuando se marca/elimina en la página de notificaciones. */
  getUnreadCountChanged(): Observable<void> {
    return this.unreadCountChanged$.asObservable();
  }

  /** Llamar después de marcar como leída, marcar todas o eliminar una notificación, para sincronizar la campanita. */
  notifyUnreadCountChanged(): void {
    this.unreadCountChanged$.next();
  }

  private getHttpOptions() {
    return {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    };
  }

  /**
   * Lista paginada con filtros opcionales.
   * type: ej. APPOINTMENT_CONFIRMED. dateFrom/dateTo: ISO date (YYYY-MM-DD).
   */
  getNotifications(params: {
    page?: number;
    size?: number;
    type?: string;
    read?: boolean;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
  } = {}): Observable<SystemNotificationsResponse> {
    let httpParams = new HttpParams();
    if (params.page != null) httpParams = httpParams.set('page', params.page);
    if (params.size != null) httpParams = httpParams.set('size', params.size);
    if (params.type) httpParams = httpParams.set('type', params.type);
    if (params.read != null) httpParams = httpParams.set('read', params.read);
    if (params.dateFrom) httpParams = httpParams.set('dateFrom', params.dateFrom);
    if (params.dateTo) httpParams = httpParams.set('dateTo', params.dateTo);
    if (params.search) httpParams = httpParams.set('search', params.search);

    return this.http.get<SystemNotificationsResponse>(this.apiUrl, {
      ...this.getHttpOptions(),
      params: httpParams
    });
  }

  /**
   * Contador de no leídas. Con excludeType='APPOINTMENT_CREATED' el badge de la campanita
   * no cuenta "turno creado" (coincide con la lista que oculta ese tipo).
   */
  getUnreadCount(params?: { excludeType?: string }): Observable<number> {
    let httpParams = new HttpParams();
    if (params?.excludeType) {
      httpParams = httpParams.set('excludeType', params.excludeType);
    }
    return this.http.get<number>(`${this.apiUrl}/unread-count`, {
      ...this.getHttpOptions(),
      params: httpParams
    });
  }

  markAsRead(id: number): Observable<SystemNotificationResponse> {
    return this.http.post<SystemNotificationResponse>(
      `${this.apiUrl}/${id}/read`,
      {},
      this.getHttpOptions()
    );
  }

  /** Marca todas las notificaciones del usuario como leídas. */
  markAllAsRead(): Observable<{ markedCount: number; message: string }> {
    return this.http.post<{ markedCount: number; message: string }>(
      `${this.apiUrl}/read-all`,
      {},
      this.getHttpOptions()
    );
  }

  /** Elimina una notificación. */
  deleteNotification(id: number): Observable<{ message: string; id: number }> {
    return this.http.delete<{ message: string; id: number }>(
      `${this.apiUrl}/${id}`,
      this.getHttpOptions()
    );
  }
}
