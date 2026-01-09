import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { WeeklyConfigResponse, WeeklyConfigRequest, DailyHoursRequest, AppointmentDurationRequest } from '../models/weekly-config-response.model';

/**
 * Mock Weekly Config Service
 * 
 * Simula las respuestas del backend para desarrollo.
 * Los datos mockeados coinciden exactamente con las estructuras de API_ENDPOINTS_TURNS.md
 */
@Injectable({
  providedIn: 'root'
})
export class MockWeeklyConfigService {

  private mockActiveConfig: WeeklyConfigResponse = {
    id: 1,
    version: 1,
    active: true,
    weeklyConfig: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: false,
      sunday: false
    },
    dailyHours: [
      {
        dayOfWeek: 1, // Lunes
        timeRanges: [
          { start: '09:00', end: '12:00' },
          { start: '14:00', end: '18:00' }
        ]
      },
      {
        dayOfWeek: 2, // Martes
        timeRanges: [
          { start: '09:00', end: '12:00' },
          { start: '14:00', end: '18:00' }
        ]
      },
      {
        dayOfWeek: 3, // Miércoles
        timeRanges: [
          { start: '09:00', end: '12:00' },
          { start: '14:00', end: '18:00' }
        ]
      },
      {
        dayOfWeek: 4, // Jueves
        timeRanges: [
          { start: '09:00', end: '12:00' },
          { start: '14:00', end: '18:00' }
        ]
      },
      {
        dayOfWeek: 5, // Viernes
        timeRanges: [
          { start: '09:00', end: '12:00' },
          { start: '14:00', end: '18:00' }
        ]
      }
    ],
    appointmentDurationMinutes: 30,
    createdByUserId: 1,
    notes: 'Configuración inicial - Lunes a Viernes abierto',
    createdAt: '2024-04-20T10:30:00',
    updatedAt: '2024-04-20T10:30:00'
  };

  /**
   * GET /api/admin/calendar/active
   * Obtiene la configuración activa
   */
  getActiveConfig(): Observable<WeeklyConfigResponse> {
    return of(this.mockActiveConfig).pipe(delay(300));
  }

  /**
   * POST /api/admin/calendar/weekly-config
   * Crea nueva configuración semanal
   */
  createWeeklyConfig(request: WeeklyConfigRequest): Observable<WeeklyConfigResponse> {
    // MOCK: Actualizar configuración
    this.mockActiveConfig = {
      ...this.mockActiveConfig,
      version: this.mockActiveConfig.version + 1,
      weeklyConfig: request,
      notes: request.notes,
      updatedAt: new Date().toISOString()
    };
    return of(this.mockActiveConfig).pipe(delay(500));
  }

  /**
   * POST /api/admin/calendar/daily-hours
   * Configura horarios diarios
   */
  setDailyHours(request: DailyHoursRequest): Observable<WeeklyConfigResponse> {
    // MOCK: Convertir request a formato de respuesta
    const dailyHours = Object.entries(request.dailyHours).map(([day, ranges]) => ({
      dayOfWeek: this.dayNameToNumber(day),
      timeRanges: ranges
    }));

    this.mockActiveConfig = {
      ...this.mockActiveConfig,
      version: this.mockActiveConfig.version + 1,
      dailyHours,
      notes: request.notes || this.mockActiveConfig.notes,
      updatedAt: new Date().toISOString()
    };
    return of(this.mockActiveConfig).pipe(delay(500));
  }

  /**
   * POST /api/admin/calendar/appointment-duration
   * Configura duración de turnos
   */
  setAppointmentDuration(request: AppointmentDurationRequest): Observable<WeeklyConfigResponse> {
    this.mockActiveConfig = {
      ...this.mockActiveConfig,
      version: this.mockActiveConfig.version + 1,
      appointmentDurationMinutes: request.durationMinutes,
      notes: request.notes || this.mockActiveConfig.notes,
      updatedAt: new Date().toISOString()
    };
    return of(this.mockActiveConfig).pipe(delay(500));
  }

  private dayNameToNumber(dayName: string): number {
    const days: Record<string, number> = {
      'monday': 1,
      'tuesday': 2,
      'wednesday': 3,
      'thursday': 4,
      'friday': 5,
      'saturday': 6,
      'sunday': 7
    };
    return days[dayName.toLowerCase()] || 1;
  }
}

