import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { 
  AdminAppointmentResponse, 
  AdminAppointmentsPageResponse,
  AppointmentState
} from '../models/admin-appointment-response.model';
import { AppointmentHistoryResponse } from '../models/appointment-history-response.model';
import { RescheduleRequest, CancelRequest } from '../models/admin-appointment-requests.model';

/**
 * Admin Appointment Service
 * 
 * Servicio real para gestión de turnos por administradores.
 * Reemplaza MockAdminAppointmentService con llamadas HTTP reales al backend.
 * 
 * Endpoints:
 * - GET /api/admin/appointments
 * - GET /api/admin/appointments/{id}/history
 * - POST /api/admin/appointments/{id}/reschedule
 * - POST /api/admin/appointments/{id}/cancel
 */
@Injectable({
  providedIn: 'root'
})
export class AdminAppointmentService {
  private http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/api/admin/appointments';

  /**
   * GET /api/admin/appointments
   * Consulta todos los turnos con filtros para admin
   */
  getAppointments(params?: {
    state?: AppointmentState;
    userId?: number;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    date?: string;
    daysOfWeek?: number[];
    page?: number;
    size?: number;
  }): Observable<AdminAppointmentsPageResponse> {
    let httpParams = new HttpParams();

    if (params) {
      if (params.state) httpParams = httpParams.set('state', params.state);
      if (params.userId) httpParams = httpParams.set('userId', params.userId.toString());
      if (params.search) httpParams = httpParams.set('search', params.search);
      if (params.dateFrom) httpParams = httpParams.set('dateFrom', params.dateFrom);
      if (params.dateTo) httpParams = httpParams.set('dateTo', params.dateTo);
      if (params.date) httpParams = httpParams.set('date', params.date);
      if (params.daysOfWeek && params.daysOfWeek.length > 0) {
        const daysOfWeekStr = params.daysOfWeek.join(',');
        httpParams = httpParams.set('daysOfWeek', daysOfWeekStr);
        console.log('DEBUG Angular Service - daysOfWeek array:', params.daysOfWeek);
        console.log('DEBUG Angular Service - daysOfWeek string enviado:', daysOfWeekStr);
      }
      if (params.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
      if (params.size !== undefined) httpParams = httpParams.set('size', params.size.toString());
    }

    console.log('DEBUG Angular Service - URL completa:', this.apiUrl);
    console.log('DEBUG Angular Service - Parámetros HTTP:', httpParams.toString());

    return this.http.get<AdminAppointmentsPageResponse>(this.apiUrl, { params: httpParams }).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * GET /api/admin/appointments?date=YYYY-MM-DD
   * Obtiene los turnos de un día específico
   */
  getAppointmentsByDate(date: string): Observable<AdminAppointmentsPageResponse> {
    return this.getAppointments({ date, page: 0, size: 100 });
  }

  /**
   * GET /api/admin/appointments/{id}/history
   * Consulta el historial completo de un turno
   */
  getAppointmentHistory(appointmentId: number): Observable<AppointmentHistoryResponse> {
    return this.http.get<AppointmentHistoryResponse>(
      `${this.apiUrl}/${appointmentId}/history`
    ).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * POST /api/admin/appointments/{id}/reschedule
   * Reprograma un turno directamente como administrador
   */
  rescheduleAppointment(appointmentId: number, request: RescheduleRequest): Observable<AdminAppointmentResponse> {
    return this.http.post<AdminAppointmentResponse>(
      `${this.apiUrl}/${appointmentId}/reschedule`,
      request
    ).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * POST /api/admin/appointments/{id}/cancel
   * Cancela un turno directamente como administrador
   */
  cancelAppointment(appointmentId: number, request: CancelRequest): Observable<AdminAppointmentResponse> {
    return this.http.post<AdminAppointmentResponse>(
      `${this.apiUrl}/${appointmentId}/cancel`,
      request
    ).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * NUEVO: GET /api/admin/appointments/affected-by-closed-day?date=YYYY-MM-DD
   * Obtiene turnos activos que están en un día cerrado según la configuración actual.
   */
  getAppointmentsAffectedByClosedDay(
    date: Date, 
    page: number = 0, 
    size: number = 20
  ): Observable<AdminAppointmentsPageResponse> {
    const params = new HttpParams()
      .set('date', date.toISOString().split('T')[0])
      .set('page', page.toString())
      .set('size', size.toString());
    
    return this.http.get<AdminAppointmentsPageResponse>(
      `${this.apiUrl}/affected-by-closed-day`, 
      { params }
    ).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Manejo centralizado de errores HTTP
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Error desconocido';

    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      switch (error.status) {
        case 400:
          errorMessage = error.error?.message || 'Solicitud inválida. Verifica los datos ingresados.';
          break;
        case 401:
          errorMessage = 'No estás autenticado. Por favor, inicia sesión.';
          break;
        case 403:
          errorMessage = 'No tienes permisos para realizar esta acción.';
          break;
        case 404:
          errorMessage = error.error?.message || 'Turno no encontrado.';
          break;
        case 409:
          errorMessage = error.error?.message || 'Conflicto: El slot ya no está disponible o hay un conflicto.';
          break;
        case 500:
          errorMessage = 'Error interno del servidor. Por favor, intenta más tarde.';
          break;
        default:
          errorMessage = error.error?.message || `Error ${error.status}: ${error.statusText}`;
      }
    }

    console.error('AdminAppointmentService Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}

