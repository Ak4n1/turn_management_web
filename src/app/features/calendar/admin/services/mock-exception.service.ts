import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { CalendarExceptionResponse, CalendarExceptionRequest } from '../models/exception-response.model';

/**
 * Mock Exception Service
 * 
 * Simula las respuestas del backend para desarrollo.
 * Los datos mockeados coinciden exactamente con las estructuras de API_ENDPOINTS_TURNS.md
 */
@Injectable({
  providedIn: 'root'
})
export class MockExceptionService {

  private mockExceptions: CalendarExceptionResponse[] = [
    {
      id: 1,
      exceptionDate: '2026-02-14',
      isOpen: true,
      timeRanges: [
        { start: '10:00', end: '14:00' }
      ],
      reason: 'Día de San Valentín - horario reducido',
      active: true,
      createdByUserId: 1,
      createdAt: '2026-01-08T10:00:00',
      updatedAt: '2026-01-08T10:00:00',
      affectedAppointmentsCount: 0
    },
    {
      id: 2,
      exceptionDate: '2026-05-01',
      isOpen: false,
      timeRanges: [],
      reason: 'Día del Trabajador - cerrado',
      active: true,
      createdByUserId: 1,
      createdAt: '2026-01-08T10:30:00',
      updatedAt: '2026-01-08T10:30:00',
      affectedAppointmentsCount: 0
    }
  ];

  /**
   * POST /api/admin/calendar/exceptions
   * Crea una excepción
   */
  createException(request: CalendarExceptionRequest): Observable<CalendarExceptionResponse> {
    const newException: CalendarExceptionResponse = {
      id: this.mockExceptions.length + 1,
      exceptionDate: request.date,
      isOpen: request.isOpen,
      timeRanges: request.isOpen ? request.timeRanges : [],
      reason: request.reason,
      active: true,
      createdByUserId: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      affectedAppointmentsCount: 0
    };
    
    this.mockExceptions.push(newException);
    return of(newException).pipe(delay(500));
  }

  /**
   * GET lista de excepciones (mock)
   * Nota: El backend no tiene endpoint GET, pero necesitamos listar para la UI
   */
  getExceptions(): Observable<CalendarExceptionResponse[]> {
    return of([...this.mockExceptions]).pipe(delay(300));
  }
}

