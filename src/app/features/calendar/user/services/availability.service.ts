import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AvailabilityResponse, SlotsResponse } from '../models/availability-range-response.model';

/**
 * Availability Service
 * 
 * Servicio real para consulta de disponibilidad y slots.
 * Reemplaza MockAvailabilityService con llamadas HTTP reales al backend.
 * 
 * Endpoints:
 * - GET /api/availability
 * - GET /api/availability/slots
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

