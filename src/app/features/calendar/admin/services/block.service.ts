import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ManualBlockResponse, ManualBlockRequest } from '../models/block-response.model';

/**
 * Block Service
 * 
 * Servicio real para gestión de bloqueos operativos del calendario.
 * Reemplaza MockBlockService con llamadas HTTP reales al backend.
 * 
 * Endpoints:
 * - POST /api/admin/calendar/blocks
 * 
 * Nota: El backend no tiene endpoint GET para listar bloqueos.
 * Los bloqueos se pueden obtener del calendario consolidado si es necesario.
 */
@Injectable({
  providedIn: 'root'
})
export class BlockService {
  private http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/api/admin/calendar';

  /**
   * POST /api/admin/calendar/blocks
   * Crea un bloqueo operativo del calendario
   */
  createBlock(request: ManualBlockRequest): Observable<ManualBlockResponse> {
    return this.http.post<ManualBlockResponse>(
      `${this.apiUrl}/blocks`,
      request
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
        case 409:
          errorMessage = error.error?.message || 'Existen turnos en el rango bloqueado. Debe resolverlos primero o establecer "affectsExistingAppointments" en true.';
          break;
        case 500:
          errorMessage = 'Error interno del servidor. Por favor, intenta más tarde.';
          break;
        default:
          errorMessage = error.error?.message || `Error ${error.status}: ${error.statusText}`;
      }
    }

    console.error('BlockService Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}

