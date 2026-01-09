import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { ConsolidatedCalendarResponse, ConsolidatedDayResponse } from '../models/consolidated-calendar-response.model';

/**
 * Mock Admin Calendar Service
 * 
 * Simula las respuestas del backend para desarrollo.
 * Los datos mockeados coinciden exactamente con las estructuras de API_ENDPOINTS_TURNS.md
 */
@Injectable({
  providedIn: 'root'
})
export class MockAdminCalendarService {

  /**
   * GET /api/admin/calendar/consolidated
   * Obtiene calendario consolidado para admin
   */
  getConsolidatedCalendar(startDate: string, endDate: string): Observable<ConsolidatedCalendarResponse> {
    const days: ConsolidatedDayResponse[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const current = new Date(start);

    while (current <= end) {
      const dateStr = this.formatDate(current);
      const dayOfWeek = current.getDay();
      const dayNumber = current.getDate();
      
      // MOCK: Generar días con diferentes reglas para mostrar todos los casos
      let day: ConsolidatedDayResponse;

      // MOCK: Domingo cerrado (BASE)
      if (dayOfWeek === 0) {
        day = {
          date: dateStr,
          state: 'CLOSED',
          ruleType: 'BASE',
          ruleDescription: 'Domingo - Configuración base (día cerrado)',
          timeRanges: [],
          hasExistingAppointments: false
        };
      }
      // MOCK: Sábado cerrado (BASE)
      else if (dayOfWeek === 6) {
        day = {
          date: dateStr,
          state: 'CLOSED',
          ruleType: 'BASE',
          ruleDescription: 'Sábado - Configuración base (día cerrado)',
          timeRanges: [],
          hasExistingAppointments: false
        };
      }
      // MOCK: Miércoles cerrado (BASE) - para mostrar más días cerrados
      else if (dayOfWeek === 3) {
        day = {
          date: dateStr,
          state: 'CLOSED',
          ruleType: 'BASE',
          ruleDescription: 'Miércoles - Configuración base (día cerrado)',
          timeRanges: [],
          hasExistingAppointments: false
        };
      }
      // MOCK: Días específicos con excepciones abiertas
      else if (dateStr === '2026-02-14' || dayNumber === 14) {
        day = {
          date: dateStr,
          state: 'OPEN',
          ruleType: 'EXCEPTION',
          ruleDescription: 'Día de San Valentín - horario reducido - Excepción',
          timeRanges: [
            { start: '10:00', end: '14:00' }
          ],
          hasExistingAppointments: true,
          appointmentsCount: 2
        };
      }
      // MOCK: Días específicos con excepciones cerradas
      else if (dayNumber === 15 || dayNumber === 25) {
        day = {
          date: dateStr,
          state: 'CLOSED',
          ruleType: 'EXCEPTION',
          ruleDescription: 'Feriado - Excepción (día cerrado)',
          timeRanges: [],
          hasExistingAppointments: false
        };
      }
      // MOCK: Días con bloqueos completos
      else if (dateStr === '2026-02-18' || dayNumber === 18 || dayNumber === 28) {
        day = {
          date: dateStr,
          state: 'CLOSED',
          ruleType: 'BLOCK',
          ruleDescription: 'Mantenimiento programado - Bloqueo operativo (día completo)',
          timeRanges: [],
          hasExistingAppointments: false
        };
      }
      // MOCK: Días con bloqueos parciales (evitar fechas con turnos)
      else if ((dayNumber === 20 || dayNumber === 22) && dateStr !== '2026-01-21') {
        day = {
          date: dateStr,
          state: 'PARTIAL',
          ruleType: 'BLOCK',
          ruleDescription: 'Reunión interna - Bloqueo operativo (parcial)',
          timeRanges: [
            { start: '09:00', end: '10:00' },
            { start: '16:00', end: '18:00' }
          ],
          hasExistingAppointments: false,
          appointmentsCount: 0
        };
      }
      // MOCK: Días con excepciones parciales
      else if (dayNumber === 12 || dayNumber === 16) {
        day = {
          date: dateStr,
          state: 'PARTIAL',
          ruleType: 'EXCEPTION',
          ruleDescription: 'Horario especial - Excepción (parcial)',
          timeRanges: [
            { start: '10:00', end: '13:00' }
          ],
          hasExistingAppointments: false
        };
      }
      // MOCK: Algunos lunes cerrados
      else if (dayOfWeek === 1 && (dayNumber % 7 === 0 || dayNumber === 7)) {
        day = {
          date: dateStr,
          state: 'CLOSED',
          ruleType: 'BASE',
          ruleDescription: 'Lunes - Configuración base (día cerrado)',
          timeRanges: [],
          hasExistingAppointments: false
        };
      }
      // MOCK: Días específicos con turnos (coinciden con los turnos mock del servicio de appointments)
      else if (dateStr === '2026-01-08') {
        day = {
          date: dateStr,
          state: 'OPEN',
          ruleType: 'BASE',
          ruleDescription: `${this.getDayName(dayOfWeek)} - Configuración base`,
          timeRanges: [
            { start: '09:00', end: '12:00' },
            { start: '14:00', end: '18:00' }
          ],
          hasExistingAppointments: true,
          appointmentsCount: 2
        };
      }
      else if (dateStr === '2026-01-11') {
        day = {
          date: dateStr,
          state: 'OPEN',
          ruleType: 'BASE',
          ruleDescription: `${this.getDayName(dayOfWeek)} - Configuración base`,
          timeRanges: [
            { start: '09:00', end: '12:00' },
            { start: '14:00', end: '18:00' }
          ],
          hasExistingAppointments: true,
          appointmentsCount: 1
        };
      }
      else if (dateStr === '2026-01-15') {
        day = {
          date: dateStr,
          state: 'OPEN',
          ruleType: 'BASE',
          ruleDescription: `${this.getDayName(dayOfWeek)} - Configuración base`,
          timeRanges: [
            { start: '09:00', end: '12:00' },
            { start: '14:00', end: '18:00' }
          ],
          hasExistingAppointments: true,
          appointmentsCount: 1
        };
      }
      else if (dateStr === '2026-01-19') {
        day = {
          date: dateStr,
          state: 'OPEN',
          ruleType: 'BASE',
          ruleDescription: `${this.getDayName(dayOfWeek)} - Configuración base`,
          timeRanges: [
            { start: '09:00', end: '12:00' },
            { start: '14:00', end: '18:00' }
          ],
          hasExistingAppointments: true,
          appointmentsCount: 1
        };
      }
      else if (dateStr === '2026-01-21') {
        day = {
          date: dateStr,
          state: 'OPEN',
          ruleType: 'BASE',
          ruleDescription: `${this.getDayName(dayOfWeek)} - Configuración base`,
          timeRanges: [
            { start: '09:00', end: '12:00' },
            { start: '14:00', end: '18:00' }
          ],
          hasExistingAppointments: true,
          appointmentsCount: 1
        };
      }
      else if (dateStr === '2026-01-26') {
        day = {
          date: dateStr,
          state: 'OPEN',
          ruleType: 'BASE',
          ruleDescription: `${this.getDayName(dayOfWeek)} - Configuración base`,
          timeRanges: [
            { start: '09:00', end: '12:00' },
            { start: '14:00', end: '18:00' }
          ],
          hasExistingAppointments: true,
          appointmentsCount: 2
        };
      }
      else if (dateStr === '2026-01-29') {
        day = {
          date: dateStr,
          state: 'OPEN',
          ruleType: 'BASE',
          ruleDescription: `${this.getDayName(dayOfWeek)} - Configuración base`,
          timeRanges: [
            { start: '09:00', end: '12:00' },
            { start: '14:00', end: '18:00' }
          ],
          hasExistingAppointments: true,
          appointmentsCount: 5
        };
      }
      // MOCK: Días laborables normales (BASE) - sin turnos
      else if (dayOfWeek === 1 || dayOfWeek === 2 || dayOfWeek === 4 || dayOfWeek === 5) {
        day = {
          date: dateStr,
          state: 'OPEN',
          ruleType: 'BASE',
          ruleDescription: `${this.getDayName(dayOfWeek)} - Configuración base`,
          timeRanges: [
            { start: '09:00', end: '12:00' },
            { start: '14:00', end: '18:00' }
          ],
          hasExistingAppointments: false,
          appointmentsCount: 0
        };
      }
      // MOCK: Por defecto cerrado
      else {
        day = {
          date: dateStr,
          state: 'CLOSED',
          ruleType: 'BASE',
          ruleDescription: `${this.getDayName(dayOfWeek)} - Configuración base (día cerrado)`,
          timeRanges: [],
          hasExistingAppointments: false
        };
      }

      days.push(day);
      current.setDate(current.getDate() + 1);
    }

    return of({ days }).pipe(delay(500));
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private getDayName(dayOfWeek: number): string {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[dayOfWeek];
  }
}

