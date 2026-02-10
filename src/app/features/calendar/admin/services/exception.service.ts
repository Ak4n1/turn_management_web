import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CalendarExceptionResponse, CalendarExceptionRequest } from '../models/exception-response.model';

/**
 * Exception Service
 * 
 * Servicio real para gestión de excepciones del calendario.
 * Reemplaza MockExceptionService con llamadas HTTP reales al backend.
 * 
 * Endpoints:
 * - POST /api/admin/calendar/exceptions
 * 
 * Nota: El backend no tiene endpoint GET para listar excepciones.
 * Las excepciones se pueden obtener del calendario consolidado si es necesario.
 */
@Injectable({
  providedIn: 'root'
})
export class ExceptionService {
  private http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/api/admin/calendar';

  /**
   * POST /api/admin/calendar/exceptions
   * Crea una excepción de calendario por fecha específica
   */
  createException(request: CalendarExceptionRequest): Observable<CalendarExceptionResponse> {
    return this.http.post<CalendarExceptionResponse>(
      `${this.apiUrl}/exceptions`,
      request
    ).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * GET /api/admin/calendar/exceptions
   * Obtiene todas las excepciones activas del calendario
   */
  getAllActiveExceptions(): Observable<CalendarExceptionResponse[]> {
    return this.http.get<CalendarExceptionResponse[]>(
      `${this.apiUrl}/exceptions`
    ).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * PUT /api/admin/calendar/exceptions/{id}
   * Actualiza una excepción existente
   */
  updateException(id: number, request: CalendarExceptionRequest): Observable<CalendarExceptionResponse> {
    return this.http.put<CalendarExceptionResponse>(
      `${this.apiUrl}/exceptions/${id}`,
      request
    ).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * DELETE /api/admin/calendar/exceptions/{id}
   * Elimina (desactiva) una excepción
   */
  deleteException(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/exceptions/${id}`).pipe(
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
        case 409:
          errorMessage = error.error?.message || 'Ya existe una excepción para esta fecha.';
          break;
        case 500:
          errorMessage = 'Error interno del servidor. Por favor, intenta más tarde.';
          break;
        default:
          errorMessage = error.error?.message || `Error ${error.status}: ${error.statusText}`;
      }
    }

    console.error('ExceptionService Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}

