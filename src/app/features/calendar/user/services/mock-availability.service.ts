import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { 
  AvailabilityRangeResponse, 
  DayAvailabilityResponse,
  AvailabilityResponse,
  SlotsResponse,
  SlotResponse
} from '../models/availability-range-response.model';

/**
 * Mock Availability Service
 * 
 * Simula las respuestas del backend para desarrollo.
 * Los datos mockeados coinciden exactamente con las estructuras de API_ENDPOINTS_TURNS.md
 */
@Injectable({
  providedIn: 'root'
})
export class MockAvailabilityService {

  /**
   * GET /api/availability/range
   * Obtiene disponibilidad por rango de fechas
   */
  getAvailabilityRange(startDate?: string, endDate?: string): Observable<AvailabilityRangeResponse> {
    // MOCK: Generar días del rango
    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : this.addDays(start, 30);
    
    const days: DayAvailabilityResponse[] = [];
    const current = new Date(start);
    
    while (current <= end) {
      const dateStr = this.formatDate(current);
      const dayOfWeek = current.getDay();
      
      // MOCK: Lunes a viernes disponibles, sábados y domingos cerrados
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        days.push({
          date: dateStr,
          status: 'CLOSED',
          availableSlots: 0,
          totalSlots: 0
        });
      } else {
        // MOCK: Algunos días parciales
        const isPartial = Math.random() > 0.8;
        const totalSlots = 14;
        const availableSlots = isPartial ? Math.floor(totalSlots * 0.6) : totalSlots;
        
        days.push({
          date: dateStr,
          status: isPartial ? 'PARTIAL' : 'FULL',
          availableSlots,
          totalSlots
        });
      }
      
      current.setDate(current.getDate() + 1);
    }

    return of({
      startDate: this.formatDate(start),
      endDate: this.formatDate(end),
      days
    }).pipe(delay(500)); // Simular latencia de red
  }

  /**
   * GET /api/availability?date=YYYY-MM-DD
   * Evalúa disponibilidad de una fecha específica
   */
  getAvailability(date: string): Observable<AvailabilityResponse> {
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay();
    
    // MOCK: Lunes a viernes disponibles
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      const response: AvailabilityResponse = {
        date,
        isAvailable: false,
        ruleApplied: 'BASE' as const,
        timeRanges: [],
        description: `${this.getDayName(dayOfWeek)} - Configuración base (día cerrado)`
      };
      return of(response).pipe(delay(300));
    }

    // MOCK: Días laborables con horarios
    const response: AvailabilityResponse = {
      date,
      isAvailable: true,
      ruleApplied: 'BASE' as const,
      timeRanges: [
        { start: '09:00', end: '12:00' },
        { start: '14:00', end: '18:00' }
      ],
      description: `${this.getDayName(dayOfWeek)} - Configuración base`
    };
    return of(response).pipe(delay(300));
  }

  /**
   * GET /api/availability/slots?date=YYYY-MM-DD
   * Obtiene slots disponibles para una fecha
   */
  getSlots(date: string): Observable<SlotsResponse> {
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay();
    
    // MOCK: Sábados y domingos sin slots
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return of({
        date,
        slots: [],
        totalSlots: 0,
        availableSlots: 0
      }).pipe(delay(300));
    }

    // MOCK: Generar slots de 30 minutos
    const slots: SlotResponse[] = [];
    const morningSlots = this.generateSlots('09:00', '12:00', 30);
    const afternoonSlots = this.generateSlots('14:00', '18:00', 30);
    
    // MOCK: Algunos slots ocupados
    [...morningSlots, ...afternoonSlots].forEach((slot, index) => {
      slots.push({
        ...slot,
        available: index % 5 !== 0 // MOCK: 1 de cada 5 slots ocupado
      });
    });

    const availableSlots = slots.filter(s => s.available).length;

    return of({
      date,
      slots,
      totalSlots: slots.length,
      availableSlots
    }).pipe(delay(300));
  }

  private generateSlots(start: string, end: string, durationMinutes: number): SlotResponse[] {
    const slots: SlotResponse[] = [];
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    
    let current = new Date();
    current.setHours(startHour, startMin, 0, 0);
    
    const endTime = new Date();
    endTime.setHours(endHour, endMin, 0, 0);
    
    while (current < endTime) {
      const slotStart = this.formatTime(current);
      current.setMinutes(current.getMinutes() + durationMinutes);
      const slotEnd = this.formatTime(current);
      
      if (current <= endTime) {
        slots.push({
          start: slotStart,
          end: slotEnd,
          available: true
        });
      }
    }
    
    return slots;
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatTime(date: Date): string {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  private getDayName(dayOfWeek: number): string {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[dayOfWeek];
  }
}

