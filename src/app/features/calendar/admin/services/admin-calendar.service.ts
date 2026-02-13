import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { 
  WeeklyConfigResponse, 
  WeeklyConfigRequest, 
  DailyHoursRequest, 
  AppointmentDurationRequest,
  FullConfigRequest 
} from '../models/weekly-config-response.model';
import { ConsolidatedCalendarResponse } from '../models/consolidated-calendar-response.model';
import { PreviewImpactRequest, PreviewImpactResponse } from '../models/preview-impact.model';

/**
 * Admin Calendar Service
 * 
 * Servicio real para gestión de configuración del calendario.
 * Reemplaza MockWeeklyConfigService con llamadas HTTP reales al backend.
 * 
 * Endpoints:
 * - GET /api/admin/calendar/active
 * - POST /api/admin/calendar/weekly-config
 * - POST /api/admin/calendar/daily-hours
 * - POST /api/admin/calendar/appointment-duration
 */
@Injectable({
  providedIn: 'root'
})
export class AdminCalendarService {
  private http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/api/admin/calendar';

  /**
   * GET /api/admin/calendar/active
   * Obtiene la configuración activa actual
   * Si no hay configuración (404), devuelve null en lugar de lanzar error
   */
  getActiveConfig(): Observable<WeeklyConfigResponse | null> {
    return this.http.get<WeeklyConfigResponse>(`${this.apiUrl}/active`).pipe(
      catchError((error: HttpErrorResponse) => {
        // Si es 404, no hay configuración activa (es normal la primera vez)
        if (error.status === 404) {
          return of(null);
        }
        // Para otros errores, usar el manejo normal
        return this.handleError(error);
      })
    );
  }

  /**
   * POST /api/admin/calendar/weekly-config
   * Crea una nueva configuración semanal base
   */
  createWeeklyConfig(request: WeeklyConfigRequest): Observable<WeeklyConfigResponse> {
    return this.http.post<WeeklyConfigResponse>(
      `${this.apiUrl}/weekly-config`,
      request
    ).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * POST /api/admin/calendar/daily-hours
   * Configura horarios diarios para la configuración activa
   */
  setDailyHours(request: DailyHoursRequest): Observable<WeeklyConfigResponse> {
    return this.http.post<WeeklyConfigResponse>(
      `${this.apiUrl}/daily-hours`,
      request
    ).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * POST /api/admin/calendar/appointment-duration
   * Configura la duración de los turnos
   */
  setAppointmentDuration(request: AppointmentDurationRequest): Observable<WeeklyConfigResponse> {
    return this.http.post<WeeklyConfigResponse>(
      `${this.apiUrl}/appointment-duration`,
      request
    ).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * POST /api/admin/calendar/full-config
   * Guarda la configuración completa (semanal + horarios + duración) en una sola operación.
   * Si alguna validación falla, no se guarda nada y la versión no cambia. La versión sube solo +1.
   */
  saveFullConfig(request: FullConfigRequest): Observable<WeeklyConfigResponse> {
    return this.http.post<WeeklyConfigResponse>(
      `${this.apiUrl}/full-config`,
      request
    ).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * GET /api/admin/calendar/consolidated
   * Obtiene el calendario consolidado para un rango de fechas
   */
  getConsolidatedCalendar(startDate: string, endDate: string): Observable<ConsolidatedCalendarResponse> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http.get<ConsolidatedCalendarResponse>(
      `${this.apiUrl}/consolidated`,
      { params }
    ).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * POST /api/admin/calendar/preview-impact
   * Previsualiza el impacto de cambios propuestos sin aplicarlos
   */
  previewImpact(request: PreviewImpactRequest): Observable<PreviewImpactResponse> {
    return this.http.post<PreviewImpactResponse>(
      `${this.apiUrl}/preview-impact`,
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
        case 404:
          errorMessage = error.error?.message || 'No se encontró la configuración solicitada.';
          break;
        case 409:
          errorMessage = error.error?.message || 'Conflicto: La configuración ya existe o hay un conflicto.';
          break;
        case 500:
          errorMessage = 'Error interno del servidor. Por favor, intenta más tarde.';
          break;
        default:
          errorMessage = error.error?.message || `Error ${error.status}: ${error.statusText}`;
      }
    }

    console.error('AdminCalendarService Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}

