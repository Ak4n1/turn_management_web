import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AppointmentResponse } from '../models/appointment-response.model';

/**
 * Appointment Service
 * 
 * Servicio real para gestión de turnos por usuarios.
 * Reemplaza MockAppointmentService con llamadas HTTP reales al backend.
 * 
 * Endpoints:
 * - POST /api/appointments
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

