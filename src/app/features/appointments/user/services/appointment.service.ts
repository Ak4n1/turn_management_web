import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AppointmentResponse, AppointmentHistoryResponse } from '../models/appointment-response.model';

export interface MyAppointmentsResponse {
  appointments: AppointmentResponse[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}

/**
 * Appointment Service
 * 
 * Servicio real para gestión de turnos por usuarios.
 * Reemplaza MockAppointmentService con llamadas HTTP reales al backend.
 * 
 * Endpoints:
 * - POST /api/appointments
 * - POST /api/appointments/{id}/confirm
 * - POST /api/appointments/{id}/cancel
 * - GET /api/appointments/my-appointments
 * - GET /api/appointments/{id}/history
 */
@Injectable({
  providedIn: 'root'
})
export class AppointmentService {

  private http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/api/appointments';

  /**
   * POST /api/appointments
   * Crea un nuevo turno
   */
  createAppointment(request: {
    date: string;
    startTime: string;
    notes?: string;
  }): Observable<AppointmentResponse> {
    return this.http.post<AppointmentResponse>(this.apiUrl, request).pipe(
      catchError((error) => {
        // NUEVO: Mejorar manejo de errores con contexto
        if (error.error?.message) {
          // Errores relacionados con días cerrados con turnos existentes
          if (error.error.message.includes('turno(s) existente(s)') || 
              error.error.message.includes('día está cerrado')) {
            // Lanzar error con código específico para manejo en componente
            return throwError(() => ({
              ...error,
              code: 'CLOSED_DAY_WITH_APPOINTMENTS',
              userMessage: error.error.message
            }));
          }
          
          // Otros errores
          return throwError(() => ({
            ...error,
            userMessage: error.error.message
          }));
        }
        
        return throwError(() => ({
          ...error,
          userMessage: 'Error inesperado al crear el turno. Por favor, intenta nuevamente.'
        }));
      })
    );
  }

  /**
   * POST /api/appointments/{id}/confirm
   * Confirma un turno (pasa de CREATED a CONFIRMED)
   */
  confirmAppointment(appointmentId: number): Observable<AppointmentResponse> {
    return this.http.post<AppointmentResponse>(`${this.apiUrl}/${appointmentId}/confirm`, {}).pipe(
      catchError((error) => {
        if (error.error?.message) {
          return throwError(() => ({
            ...error,
            userMessage: error.error.message
          }));
        }
        return throwError(() => ({
          ...error,
          userMessage: 'Error al confirmar el turno. Por favor, intenta nuevamente.'
        }));
      })
    );
  }

  /**
   * POST /api/appointments/{id}/cancel
   * Cancela un turno
   */
  cancelAppointment(appointmentId: number, reason?: string): Observable<AppointmentResponse> {
    const body = reason ? { reason } : {};
    return this.http.post<AppointmentResponse>(`${this.apiUrl}/${appointmentId}/cancel`, body).pipe(
      catchError((error) => {
        if (error.error?.message) {
          return throwError(() => ({
            ...error,
            userMessage: error.error.message
          }));
        }
        return throwError(() => ({
          ...error,
          userMessage: 'Error al cancelar el turno. Por favor, intenta nuevamente.'
        }));
      })
    );
  }

  /**
   * POST /api/appointments/{id}/request-reschedule
   * Solicita reprogramar un turno
   */
  requestReschedule(appointmentId: number, request: {
    newDate: string; // YYYY-MM-DD
    newStartTime: string; // HH:mm
    reason?: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${appointmentId}/request-reschedule`, request).pipe(
      catchError((error) => {
        if (error.error?.message) {
          return throwError(() => ({
            ...error,
            userMessage: error.error.message
          }));
        }
        return throwError(() => ({
          ...error,
          userMessage: 'Error al solicitar reprogramación. Por favor, intenta nuevamente.'
        }));
      })
    );
  }

  /**
   * GET /api/appointments/my-appointments
   * Obtiene los turnos del usuario actual con filtros y paginación
   */
  getMyAppointments(params?: {
    status?: string;
    page?: number;
    size?: number;
    fromDate?: string;
    toDate?: string;
    daysOfWeek?: string;
    /** Solo turnos futuros */
    upcoming?: boolean;
    /** Solo turnos pasados */
    past?: boolean;
    /** Orden por fecha: 'asc' = próximos primero, 'desc' = recientes primero */
    sortOrder?: 'asc' | 'desc';
  }): Observable<MyAppointmentsResponse> {
    let httpParams = new HttpParams();
    
    if (params) {
      if (params.status) {
        httpParams = httpParams.set('status', params.status);
      }
      if (params.page !== undefined) {
        httpParams = httpParams.set('page', params.page.toString());
      }
      if (params.size !== undefined) {
        httpParams = httpParams.set('size', params.size.toString());
      }
      if (params.fromDate) {
        httpParams = httpParams.set('fromDate', params.fromDate);
      }
      if (params.toDate) {
        httpParams = httpParams.set('toDate', params.toDate);
      }
      if (params.daysOfWeek) {
        httpParams = httpParams.set('daysOfWeek', params.daysOfWeek);
      }
      if (params.upcoming === true) {
        httpParams = httpParams.set('upcoming', 'true');
      }
      if (params.past === true) {
        httpParams = httpParams.set('past', 'true');
      }
      // Siempre enviar sortOrder para que el backend ordene (asc = más viejos primero, desc = más recientes primero)
      const order = params.sortOrder === 'desc' ? 'desc' : 'asc';
      httpParams = httpParams.set('sortOrder', order);
    }

    return this.http.get<MyAppointmentsResponse>(`${this.apiUrl}/my-appointments`, { params: httpParams }).pipe(
      catchError((error) => {
        if (error.error?.message) {
          return throwError(() => ({
            ...error,
            userMessage: error.error.message
          }));
        }
        return throwError(() => ({
          ...error,
          userMessage: 'Error al cargar tus turnos. Por favor, intenta nuevamente.'
        }));
      })
    );
  }

  /**
   * GET /api/appointments/{id}/history
   * Obtiene el historial completo de un turno
   */
  getAppointmentHistory(appointmentId: number): Observable<AppointmentHistoryResponse> {
    return this.http.get<AppointmentHistoryResponse>(`${this.apiUrl}/${appointmentId}/history`).pipe(
      catchError((error) => {
        if (error.error?.message) {
          return throwError(() => ({
            ...error,
            userMessage: error.error.message
          }));
        }
        return throwError(() => ({
          ...error,
          userMessage: 'Error al cargar el historial del turno. Por favor, intenta nuevamente.'
        }));
      })
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

    console.error('AppointmentService Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}

