import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AvailabilityResponse, SlotsResponse, AvailabilityRangeResponse } from '../models/availability-range-response.model';

/**
 * Availability Service
 * 
 * Servicio real para consulta de disponibilidad y slots.
 * Reemplaza MockAvailabilityService con llamadas HTTP reales al backend.
 * 
 * Endpoints:
 * - GET /api/availability
 * - GET /api/availability/slots
 * - GET /api/availability/range
 */
@Injectable({
  providedIn: 'root'
})
export class AvailabilityService {

  private http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/api/availability';

  /**
   * GET /api/availability?date=YYYY-MM-DD
   * Evalúa disponibilidad de una fecha específica
   */
  checkAvailability(date: Date): Observable<AvailabilityResponse> {
    const params = new HttpParams()
      .set('date', date.toISOString().split('T')[0]);
    
    return this.http.get<AvailabilityResponse>(this.apiUrl, { params });
  }

  /**
   * GET /api/availability/slots?date=YYYY-MM-DD
   * Obtiene slots disponibles para una fecha
   */
  getAvailableSlots(date: Date): Observable<SlotsResponse> {
    const params = new HttpParams()
      .set('date', date.toISOString().split('T')[0]);
    
    return this.http.get<SlotsResponse>(`${this.apiUrl}/slots`, { params });
  }

  /**
   * GET /api/availability/range?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
   * Obtiene disponibilidad por rango de fechas (para calendario mensual)
   */
  getAvailabilityRange(startDate?: string, endDate?: string): Observable<AvailabilityRangeResponse> {
    let params = new HttpParams();
    
    if (startDate) {
      params = params.set('startDate', startDate);
    }
    
    if (endDate) {
      params = params.set('endDate', endDate);
    }
    
    return this.http.get<AvailabilityRangeResponse>(`${this.apiUrl}/range`, { params });
  }

  /**
   * NUEVO: Verifica si un día está cerrado pero tiene turnos existentes.
   */
  isClosedWithExistingAppointments(response: AvailabilityResponse): boolean {
    return Boolean(response.hasExistingAppointments && 
                   response.existingAppointmentsCount && 
                   response.existingAppointmentsCount > 0);
  }

  /**
   * NUEVO: Obtiene el mensaje de disponibilidad con contexto.
   */
  getAvailabilityMessage(response: AvailabilityResponse): string {
    if (response.message) {
      return response.message;
    }
    
    if (response.isAvailable) {
      return `Este día está disponible. ${response.description}`;
    }
    
    return `Este día no está disponible. ${response.description}`;
  }
}

