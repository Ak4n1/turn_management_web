import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { 
  AppointmentResponse, 
  MyAppointmentsResponse,
  AppointmentHistoryResponse,
  AppointmentState
} from '../models/appointment-response.model';

/**
 * Mock Appointment Service
 * 
 * Simula las respuestas del backend para desarrollo.
 * Los datos mockeados coinciden exactamente con las estructuras de API_ENDPOINTS_TURNS.md
 */
@Injectable({
  providedIn: 'root'
})
export class MockAppointmentService {

  /**
   * GET /api/appointments/my-appointments
   * Consulta turnos del usuario con filtros y paginación
   */
  getMyAppointments(params?: {
    status?: AppointmentState;
    fromDate?: string;
    toDate?: string;
    upcoming?: boolean;
    past?: boolean;
    page?: number;
    size?: number;
  }): Observable<MyAppointmentsResponse> {
    // MOCK: Generar turnos de ejemplo
    const mockAppointments: AppointmentResponse[] = [
      {
        id: 123,
        userId: 6,
        date: '2026-02-20',
        startTime: '10:00',
        endTime: '10:30',
        durationMinutes: 30,
        state: 'CONFIRMED',
        expiresAt: null,
        confirmedAt: '2026-01-08T00:56:59.1472182',
        cancelledAt: null,
        cancellationReason: null,
        previousAppointmentId: null,
        calendarConfigVersion: 12,
        createdAt: '2026-01-08T00:56:58.9438',
        updatedAt: '2026-01-08T00:56:59.1472182'
      },
      {
        id: 124,
        userId: 6,
        date: '2026-02-25',
        startTime: '14:00',
        endTime: '14:30',
        durationMinutes: 30,
        state: 'CREATED',
        expiresAt: '2026-02-25T14:10:00',
        confirmedAt: null,
        cancelledAt: null,
        cancellationReason: null,
        previousAppointmentId: null,
        calendarConfigVersion: 12,
        createdAt: '2026-01-08T10:00:00',
        updatedAt: '2026-01-08T10:00:00'
      },
      {
        id: 125,
        userId: 6,
        date: '2026-02-28',
        startTime: '11:00',
        endTime: '11:30',
        durationMinutes: 30,
        state: 'CREATED',
        expiresAt: '2026-02-28T11:10:00',
        confirmedAt: null,
        cancelledAt: null,
        cancellationReason: null,
        previousAppointmentId: null,
        calendarConfigVersion: 12,
        createdAt: '2026-01-08T11:00:00',
        updatedAt: '2026-01-08T11:00:00'
      },
      {
        id: 126,
        userId: 6,
        date: '2026-01-15',
        startTime: '09:00',
        endTime: '09:30',
        durationMinutes: 30,
        state: 'COMPLETED',
        expiresAt: null,
        confirmedAt: '2026-01-10T10:00:00',
        cancelledAt: null,
        cancellationReason: null,
        previousAppointmentId: null,
        calendarConfigVersion: 12,
        createdAt: '2026-01-08T09:00:00',
        updatedAt: '2026-01-15T09:30:00'
      },
      {
        id: 127,
        userId: 6,
        date: '2026-01-20',
        startTime: '15:00',
        endTime: '15:30',
        durationMinutes: 30,
        state: 'CANCELLED',
        expiresAt: null,
        confirmedAt: '2026-01-10T10:00:00',
        cancelledAt: '2026-01-18T10:00:00',
        cancellationReason: 'Cambio de planes',
        previousAppointmentId: null,
        calendarConfigVersion: 12,
        createdAt: '2026-01-08T15:00:00',
        updatedAt: '2026-01-18T10:00:00'
      }
    ];

    // Aplicar filtros
    let filtered = [...mockAppointments];

    if (params?.status) {
      filtered = filtered.filter(a => a.state === params.status);
    }

    if (params?.fromDate) {
      filtered = filtered.filter(a => a.date >= params.fromDate!);
    }

    if (params?.toDate) {
      filtered = filtered.filter(a => a.date <= params.toDate!);
    }

    if (params?.upcoming) {
      const now = new Date();
      filtered = filtered.filter(a => {
        const appointmentDate = new Date(`${a.date}T${a.startTime}`);
        return appointmentDate >= now;
      });
    }

    if (params?.past) {
      const now = new Date();
      filtered = filtered.filter(a => {
        const appointmentDate = new Date(`${a.date}T${a.startTime}`);
        return appointmentDate < now;
      });
    }

    // Ordenar por fecha y hora ascendente
    filtered.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.startTime}`);
      const dateB = new Date(`${b.date}T${b.startTime}`);
      return dateA.getTime() - dateB.getTime();
    });

    // Paginación
    const page = params?.page || 0;
    const size = params?.size || 20;
    const start = page * size;
    const end = start + size;
    const paginated = filtered.slice(start, end);
    const totalPages = Math.ceil(filtered.length / size);

    return of({
      appointments: paginated,
      total: filtered.length,
      page,
      size,
      totalPages
    }).pipe(delay(500));
  }

  /**
   * GET /api/appointments/{id}/history
   * Consulta historial de un turno
   */
  getAppointmentHistory(id: number): Observable<AppointmentHistoryResponse> {
    // MOCK: Historial de ejemplo
    const history = [
      {
        id: 3,
        action: 'CONFIRMED',
        previousState: 'CREATED',
        newState: 'CONFIRMED',
        timestamp: '2026-01-08T00:39:04.960872',
        performedByUserId: 6,
        performedByEmail: 'encabojuan@gmail.com',
        reason: 'Turno confirmado por el usuario',
        relatedAppointmentId: null
      },
      {
        id: 1,
        action: 'CREATED',
        previousState: null,
        newState: 'CREATED',
        timestamp: '2026-01-08T00:31:36.801401',
        performedByUserId: 6,
        performedByEmail: 'encabojuan@gmail.com',
        reason: 'Turno creado',
        relatedAppointmentId: null
      }
    ];

    return of({
      appointmentId: id,
      history
    }).pipe(delay(300));
  }
}

