import { Injectable } from '@angular/core';
import { Observable, of, delay, throwError } from 'rxjs';
import { 
  AdminAppointmentResponse, 
  AdminAppointmentsPageResponse,
  AppointmentState
} from '../models/admin-appointment-response.model';
import { AppointmentHistoryResponse, AppointmentHistoryEntry } from '../models/appointment-history-response.model';
import { RescheduleRequest, CancelRequest } from '../models/admin-appointment-requests.model';

/**
 * Mock Admin Appointment Service
 * 
 * Simula las respuestas del backend para desarrollo.
 * Los datos mockeados coinciden exactamente con las estructuras de API_ENDPOINTS_TURNS.md
 */
@Injectable({
  providedIn: 'root'
})
export class MockAdminAppointmentService {

  /**
   * GET /api/admin/appointments?date=YYYY-MM-DD
   * Obtiene los turnos de un día específico
   */
  getAppointmentsByDate(date: string): Observable<AdminAppointmentsPageResponse> {
    return this.getAppointments({ date, page: 0, size: 100 });
  }

  /**
   * GET /api/admin/appointments
   * Consulta todos los turnos con filtros para admin
   */
  getAppointments(params?: {
    state?: AppointmentState;
    userId?: number;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    date?: string;
    page?: number;
    size?: number;
  }): Observable<AdminAppointmentsPageResponse> {
    // MOCK: Generar turnos de ejemplo para diferentes fechas
    const mockAppointments: AdminAppointmentResponse[] = [
      // Enero 2026
      {
        id: 201,
        userId: 6,
        userEmail: 'encabojuan@gmail.com',
        userFirstName: 'Juan',
        userLastName: 'Encabo',
        date: '2026-01-08',
        startTime: '10:00',
        endTime: '10:30',
        durationMinutes: 30,
        state: 'CONFIRMED',
        expiresAt: null,
        confirmedAt: '2026-01-05T10:00:00',
        cancelledAt: null,
        cancellationReason: null,
        previousAppointmentId: null,
        calendarConfigVersion: 12,
        createdAt: '2026-01-05T09:00:00',
        updatedAt: '2026-01-05T10:00:00'
      },
      {
        id: 202,
        userId: 7,
        userEmail: 'maria.garcia@example.com',
        userFirstName: 'María',
        userLastName: 'García',
        date: '2026-01-08',
        startTime: '14:00',
        endTime: '14:30',
        durationMinutes: 30,
        state: 'CONFIRMED',
        expiresAt: null,
        confirmedAt: '2026-01-05T14:00:00',
        cancelledAt: null,
        cancellationReason: null,
        previousAppointmentId: null,
        calendarConfigVersion: 12,
        createdAt: '2026-01-05T13:00:00',
        updatedAt: '2026-01-05T14:00:00'
      },
      {
        id: 203,
        userId: 8,
        userEmail: 'carlos.lopez@example.com',
        userFirstName: 'Carlos',
        userLastName: 'López',
        date: '2026-01-11',
        startTime: '11:00',
        endTime: '11:30',
        durationMinutes: 30,
        state: 'CONFIRMED',
        expiresAt: null,
        confirmedAt: '2026-01-08T11:00:00',
        cancelledAt: null,
        cancellationReason: null,
        previousAppointmentId: null,
        calendarConfigVersion: 12,
        createdAt: '2026-01-08T10:30:00',
        updatedAt: '2026-01-08T11:00:00'
      },
      {
        id: 204,
        userId: 9,
        userEmail: 'ana.martinez@example.com',
        userFirstName: 'Ana',
        userLastName: 'Martínez',
        date: '2026-01-15',
        startTime: '09:00',
        endTime: '09:30',
        durationMinutes: 30,
        state: 'CONFIRMED',
        expiresAt: null,
        confirmedAt: '2026-01-10T10:00:00',
        cancelledAt: null,
        cancellationReason: null,
        previousAppointmentId: null,
        calendarConfigVersion: 12,
        createdAt: '2026-01-08T09:00:00',
        updatedAt: '2026-01-10T10:00:00'
      },
      {
        id: 205,
        userId: 10,
        userEmail: 'pedro.sanchez@example.com',
        userFirstName: 'Pedro',
        userLastName: 'Sánchez',
        date: '2026-01-19',
        startTime: '15:00',
        endTime: '15:30',
        durationMinutes: 30,
        state: 'CREATED',
        expiresAt: '2026-01-19T15:10:00',
        confirmedAt: null,
        cancelledAt: null,
        cancellationReason: null,
        previousAppointmentId: null,
        calendarConfigVersion: 12,
        createdAt: '2026-01-08T15:00:00',
        updatedAt: '2026-01-08T15:00:00'
      },
      {
        id: 206,
        userId: 11,
        userEmail: 'laura.fernandez@example.com',
        userFirstName: 'Laura',
        userLastName: 'Fernández',
        date: '2026-01-21',
        startTime: '16:00',
        endTime: '16:30',
        durationMinutes: 30,
        state: 'CONFIRMED',
        expiresAt: null,
        confirmedAt: '2026-01-10T16:00:00',
        cancelledAt: null,
        cancellationReason: null,
        previousAppointmentId: null,
        calendarConfigVersion: 12,
        createdAt: '2026-01-08T16:00:00',
        updatedAt: '2026-01-10T16:00:00'
      },
      {
        id: 207,
        userId: 12,
        userEmail: 'roberto.torres@example.com',
        userFirstName: 'Roberto',
        userLastName: 'Torres',
        date: '2026-01-26',
        startTime: '10:00',
        endTime: '10:30',
        durationMinutes: 30,
        state: 'CONFIRMED',
        expiresAt: null,
        confirmedAt: '2026-01-20T10:00:00',
        cancelledAt: null,
        cancellationReason: null,
        previousAppointmentId: null,
        calendarConfigVersion: 12,
        createdAt: '2026-01-15T10:00:00',
        updatedAt: '2026-01-20T10:00:00'
      },
      {
        id: 208,
        userId: 13,
        userEmail: 'sofia.ramirez@example.com',
        userFirstName: 'Sofía',
        userLastName: 'Ramírez',
        date: '2026-01-26',
        startTime: '14:00',
        endTime: '14:30',
        durationMinutes: 30,
        state: 'CONFIRMED',
        expiresAt: null,
        confirmedAt: '2026-01-20T14:00:00',
        cancelledAt: null,
        cancellationReason: null,
        previousAppointmentId: null,
        calendarConfigVersion: 12,
        createdAt: '2026-01-15T14:00:00',
        updatedAt: '2026-01-20T14:00:00'
      },
      {
        id: 209,
        userId: 14,
        userEmail: 'diego.morales@example.com',
        userFirstName: 'Diego',
        userLastName: 'Morales',
        date: '2026-01-29',
        startTime: '09:00',
        endTime: '09:30',
        durationMinutes: 30,
        state: 'CONFIRMED',
        expiresAt: null,
        confirmedAt: '2026-01-25T09:00:00',
        cancelledAt: null,
        cancellationReason: null,
        previousAppointmentId: null,
        calendarConfigVersion: 12,
        createdAt: '2026-01-20T09:00:00',
        updatedAt: '2026-01-25T09:00:00'
      },
      {
        id: 210,
        userId: 15,
        userEmail: 'valentina.castro@example.com',
        userFirstName: 'Valentina',
        userLastName: 'Castro',
        date: '2026-01-29',
        startTime: '10:00',
        endTime: '10:30',
        durationMinutes: 30,
        state: 'CONFIRMED',
        expiresAt: null,
        confirmedAt: '2026-01-25T10:00:00',
        cancelledAt: null,
        cancellationReason: null,
        previousAppointmentId: null,
        calendarConfigVersion: 12,
        createdAt: '2026-01-20T10:00:00',
        updatedAt: '2026-01-25T10:00:00'
      },
      {
        id: 211,
        userId: 16,
        userEmail: 'miguel.ortega@example.com',
        userFirstName: 'Miguel',
        userLastName: 'Ortega',
        date: '2026-01-29',
        startTime: '11:00',
        endTime: '11:30',
        durationMinutes: 30,
        state: 'CONFIRMED',
        expiresAt: null,
        confirmedAt: '2026-01-25T11:00:00',
        cancelledAt: null,
        cancellationReason: null,
        previousAppointmentId: null,
        calendarConfigVersion: 12,
        createdAt: '2026-01-20T11:00:00',
        updatedAt: '2026-01-25T11:00:00'
      },
      {
        id: 212,
        userId: 17,
        userEmail: 'isabella.ruiz@example.com',
        userFirstName: 'Isabella',
        userLastName: 'Ruiz',
        date: '2026-01-29',
        startTime: '14:00',
        endTime: '14:30',
        durationMinutes: 30,
        state: 'CONFIRMED',
        expiresAt: null,
        confirmedAt: '2026-01-25T14:00:00',
        cancelledAt: null,
        cancellationReason: null,
        previousAppointmentId: null,
        calendarConfigVersion: 12,
        createdAt: '2026-01-20T14:00:00',
        updatedAt: '2026-01-25T14:00:00'
      },
      {
        id: 213,
        userId: 18,
        userEmail: 'juan.perez@example.com',
        userFirstName: 'Juan',
        userLastName: 'Pérez',
        date: '2026-01-29',
        startTime: '15:00',
        endTime: '15:30',
        durationMinutes: 30,
        state: 'CONFIRMED',
        expiresAt: null,
        confirmedAt: '2026-01-25T15:00:00',
        cancelledAt: null,
        cancellationReason: null,
        previousAppointmentId: null,
        calendarConfigVersion: 12,
        createdAt: '2026-01-20T15:00:00',
        updatedAt: '2026-01-25T15:00:00'
      }
    ];

    // Aplicar filtros
    let filtered = [...mockAppointments];

    if (params?.state) {
      filtered = filtered.filter(a => a.state === params.state);
    }

    if (params?.userId) {
      filtered = filtered.filter(a => a.userId === params.userId);
    }

    if (params?.search) {
      const searchLower = params.search.toLowerCase();
      filtered = filtered.filter(a => 
        a.userEmail.toLowerCase().includes(searchLower) ||
        (a.userFirstName && a.userFirstName.toLowerCase().includes(searchLower)) ||
        (a.userLastName && a.userLastName.toLowerCase().includes(searchLower))
      );
    }

    if (params?.dateFrom) {
      filtered = filtered.filter(a => a.date >= params.dateFrom!);
    }

    if (params?.dateTo) {
      filtered = filtered.filter(a => a.date <= params.dateTo!);
    }

    if (params?.date) {
      filtered = filtered.filter(a => a.date === params.date);
    }

    // Ordenar por fecha descendente y hora ascendente
    filtered.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.startTime}`);
      const dateB = new Date(`${b.date}T${b.startTime}`);
      if (dateB.getTime() !== dateA.getTime()) {
        return dateB.getTime() - dateA.getTime(); // Descendente por fecha
      }
      return a.startTime.localeCompare(b.startTime); // Ascendente por hora
    });

    // Paginación
    const page = params?.page || 0;
    const size = params?.size || 20;
    const start = page * size;
    const end = start + size;
    const paginated = filtered.slice(start, end);
    const totalPages = Math.ceil(filtered.length / size);

    return of({
      content: paginated,
      totalElements: filtered.length,
      totalPages,
      page,
      size
    }).pipe(delay(500));
  }

  /**
   * GET /api/admin/appointments/{id}/history
   * Obtiene el historial completo de un turno
   */
  getAppointmentHistory(id: number): Observable<AppointmentHistoryResponse> {
    // MOCK: Buscar el turno en los datos mock
    const appointment = this.findAppointmentById(id);
    
    if (!appointment) {
      return throwError(() => ({
        status: 404,
        error: 'Not Found',
        message: `Turno no encontrado: ${id}`
      }));
    }

    // MOCK: Generar historial basado en el estado del turno
    const history: AppointmentHistoryEntry[] = [
      {
        id: 1,
        action: 'CREATED',
        previousState: null,
        newState: 'CREATED',
        timestamp: appointment.createdAt,
        performedByUserId: appointment.userId,
        performedByEmail: appointment.userEmail,
        reason: null,
        relatedAppointmentId: null
      }
    ];

    if (appointment.confirmedAt) {
      history.unshift({
        id: 2,
        action: 'CONFIRMED',
        previousState: 'CREATED',
        newState: 'CONFIRMED',
        timestamp: appointment.confirmedAt,
        performedByUserId: appointment.userId,
        performedByEmail: appointment.userEmail,
        reason: null,
        relatedAppointmentId: null
      });
    }

    if (appointment.cancelledAt) {
      history.unshift({
        id: 3,
        action: appointment.state === 'CANCELLED_BY_ADMIN' ? 'CANCELLED_BY_ADMIN' : 'CANCELLED',
        previousState: appointment.confirmedAt ? 'CONFIRMED' : 'CREATED',
        newState: appointment.state,
        timestamp: appointment.cancelledAt,
        performedByUserId: appointment.userId,
        performedByEmail: appointment.userEmail,
        reason: appointment.cancellationReason || null,
        relatedAppointmentId: null
      });
    }

    if (appointment.previousAppointmentId) {
      history.unshift({
        id: 4,
        action: 'RESCHEDULED',
        previousState: 'CONFIRMED',
        newState: 'RESCHEDULED',
        timestamp: appointment.createdAt,
        performedByUserId: appointment.userId,
        performedByEmail: appointment.userEmail,
        reason: 'Reprogramación por administrador',
        relatedAppointmentId: appointment.previousAppointmentId
      });
    }

    // Ordenar por timestamp descendente (más recientes primero)
    history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return of({
      appointmentId: id,
      history
    }).pipe(delay(300));
  }

  /**
   * POST /api/admin/appointments/{id}/reschedule
   * Reprograma un turno como administrador
   */
  rescheduleAppointment(id: number, request: RescheduleRequest): Observable<AdminAppointmentResponse> {
    // MOCK: Validaciones básicas
    if (!request.reason || request.reason.length < 10) {
      return throwError(() => ({
        status: 400,
        error: 'Bad Request',
        message: 'El motivo debe tener al menos 10 caracteres'
      }));
    }

    const appointment = this.findAppointmentById(id);
    
    if (!appointment) {
      return throwError(() => ({
        status: 404,
        error: 'Not Found',
        message: 'Turno no encontrado'
      }));
    }

    // MOCK: Validar que el turno no esté cancelado o completado
    if (appointment.state === 'CANCELLED' || appointment.state === 'CANCELLED_BY_ADMIN' || 
        appointment.state === 'COMPLETED' || appointment.state === 'EXPIRED') {
      return throwError(() => ({
        status: 400,
        error: 'Bad Request',
        message: `No se puede reprogramar un turno en estado ${appointment.state}`
      }));
    }

    // MOCK: Crear nuevo turno reprogramado
    const newAppointment: AdminAppointmentResponse = {
      ...appointment,
      id: appointment.id + 1000, // Nuevo ID
      date: request.newDate,
      startTime: request.newStartTime,
      endTime: this.calculateEndTime(request.newStartTime, appointment.durationMinutes),
      state: 'CONFIRMED',
      expiresAt: null,
      confirmedAt: new Date().toISOString(),
      cancelledAt: null,
      cancellationReason: null,
      previousAppointmentId: appointment.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return of(newAppointment).pipe(delay(500));
  }

  /**
   * POST /api/admin/appointments/{id}/cancel
   * Cancela un turno como administrador
   */
  cancelAppointment(id: number, request: CancelRequest): Observable<AdminAppointmentResponse> {
    // MOCK: Validaciones básicas
    if (!request.reason || request.reason.length < 10) {
      return throwError(() => ({
        status: 400,
        error: 'Bad Request',
        message: 'El motivo debe tener al menos 10 caracteres'
      }));
    }

    const appointment = this.findAppointmentById(id);
    
    if (!appointment) {
      return throwError(() => ({
        status: 404,
        error: 'Not Found',
        message: 'Turno no encontrado'
      }));
    }

    // MOCK: Validar que el turno no esté cancelado o completado
    if (appointment.state === 'CANCELLED' || appointment.state === 'CANCELLED_BY_ADMIN') {
      return throwError(() => ({
        status: 400,
        error: 'Bad Request',
        message: 'El turno ya está cancelado'
      }));
    }

    if (appointment.state === 'COMPLETED') {
      return throwError(() => ({
        status: 400,
        error: 'Bad Request',
        message: 'No se pueden cancelar turnos completados'
      }));
    }

    // MOCK: Actualizar turno a cancelado
    const cancelledAppointment: AdminAppointmentResponse = {
      ...appointment,
      state: 'CANCELLED_BY_ADMIN',
      cancelledAt: new Date().toISOString(),
      cancellationReason: request.reason,
      updatedAt: new Date().toISOString()
    };

    return of(cancelledAppointment).pipe(delay(500));
  }

  /**
   * Helper: Buscar turno por ID en los datos mock
   */
  private findAppointmentById(id: number): AdminAppointmentResponse | undefined {
    // MOCK: Datos hardcodeados (los mismos que en getAppointments)
    const mockAppointments: AdminAppointmentResponse[] = [
      {
        id: 201, userId: 6, userEmail: 'encabojuan@gmail.com', userFirstName: 'Juan', userLastName: 'Encabo',
        date: '2026-01-08', startTime: '10:00', endTime: '10:30', durationMinutes: 30,
        state: 'CONFIRMED', expiresAt: null, confirmedAt: '2026-01-05T10:00:00',
        cancelledAt: null, cancellationReason: null, previousAppointmentId: null,
        calendarConfigVersion: 12, createdAt: '2026-01-05T09:00:00', updatedAt: '2026-01-05T10:00:00'
      },
      {
        id: 202, userId: 7, userEmail: 'maria.garcia@example.com', userFirstName: 'María', userLastName: 'García',
        date: '2026-01-08', startTime: '14:00', endTime: '14:30', durationMinutes: 30,
        state: 'CONFIRMED', expiresAt: null, confirmedAt: '2026-01-05T14:00:00',
        cancelledAt: null, cancellationReason: null, previousAppointmentId: null,
        calendarConfigVersion: 12, createdAt: '2026-01-05T13:00:00', updatedAt: '2026-01-05T14:00:00'
      },
      {
        id: 203, userId: 8, userEmail: 'carlos.lopez@example.com', userFirstName: 'Carlos', userLastName: 'López',
        date: '2026-01-11', startTime: '11:00', endTime: '11:30', durationMinutes: 30,
        state: 'CONFIRMED', expiresAt: null, confirmedAt: '2026-01-08T11:00:00',
        cancelledAt: null, cancellationReason: null, previousAppointmentId: null,
        calendarConfigVersion: 12, createdAt: '2026-01-08T10:30:00', updatedAt: '2026-01-08T11:00:00'
      },
      {
        id: 204, userId: 9, userEmail: 'ana.martinez@example.com', userFirstName: 'Ana', userLastName: 'Martínez',
        date: '2026-01-15', startTime: '09:00', endTime: '09:30', durationMinutes: 30,
        state: 'CONFIRMED', expiresAt: null, confirmedAt: '2026-01-10T10:00:00',
        cancelledAt: null, cancellationReason: null, previousAppointmentId: null,
        calendarConfigVersion: 12, createdAt: '2026-01-08T09:00:00', updatedAt: '2026-01-10T10:00:00'
      },
      {
        id: 205, userId: 10, userEmail: 'pedro.sanchez@example.com', userFirstName: 'Pedro', userLastName: 'Sánchez',
        date: '2026-01-19', startTime: '15:00', endTime: '15:30', durationMinutes: 30,
        state: 'CREATED', expiresAt: '2026-01-19T15:10:00', confirmedAt: null,
        cancelledAt: null, cancellationReason: null, previousAppointmentId: null,
        calendarConfigVersion: 12, createdAt: '2026-01-08T15:00:00', updatedAt: '2026-01-08T15:00:00'
      },
      {
        id: 206, userId: 11, userEmail: 'laura.fernandez@example.com', userFirstName: 'Laura', userLastName: 'Fernández',
        date: '2026-01-21', startTime: '16:00', endTime: '16:30', durationMinutes: 30,
        state: 'CONFIRMED', expiresAt: null, confirmedAt: '2026-01-10T16:00:00',
        cancelledAt: null, cancellationReason: null, previousAppointmentId: null,
        calendarConfigVersion: 12, createdAt: '2026-01-08T16:00:00', updatedAt: '2026-01-10T16:00:00'
      },
      {
        id: 207, userId: 12, userEmail: 'roberto.torres@example.com', userFirstName: 'Roberto', userLastName: 'Torres',
        date: '2026-01-26', startTime: '10:00', endTime: '10:30', durationMinutes: 30,
        state: 'CONFIRMED', expiresAt: null, confirmedAt: '2026-01-20T10:00:00',
        cancelledAt: null, cancellationReason: null, previousAppointmentId: null,
        calendarConfigVersion: 12, createdAt: '2026-01-15T10:00:00', updatedAt: '2026-01-20T10:00:00'
      },
      {
        id: 208, userId: 13, userEmail: 'sofia.ramirez@example.com', userFirstName: 'Sofía', userLastName: 'Ramírez',
        date: '2026-01-26', startTime: '14:00', endTime: '14:30', durationMinutes: 30,
        state: 'CONFIRMED', expiresAt: null, confirmedAt: '2026-01-20T14:00:00',
        cancelledAt: null, cancellationReason: null, previousAppointmentId: null,
        calendarConfigVersion: 12, createdAt: '2026-01-15T14:00:00', updatedAt: '2026-01-20T14:00:00'
      },
      {
        id: 209, userId: 14, userEmail: 'diego.morales@example.com', userFirstName: 'Diego', userLastName: 'Morales',
        date: '2026-01-29', startTime: '09:00', endTime: '09:30', durationMinutes: 30,
        state: 'CONFIRMED', expiresAt: null, confirmedAt: '2026-01-25T09:00:00',
        cancelledAt: null, cancellationReason: null, previousAppointmentId: null,
        calendarConfigVersion: 12, createdAt: '2026-01-20T09:00:00', updatedAt: '2026-01-25T09:00:00'
      },
      {
        id: 210, userId: 15, userEmail: 'valentina.castro@example.com', userFirstName: 'Valentina', userLastName: 'Castro',
        date: '2026-01-29', startTime: '10:00', endTime: '10:30', durationMinutes: 30,
        state: 'CONFIRMED', expiresAt: null, confirmedAt: '2026-01-25T10:00:00',
        cancelledAt: null, cancellationReason: null, previousAppointmentId: null,
        calendarConfigVersion: 12, createdAt: '2026-01-20T10:00:00', updatedAt: '2026-01-25T10:00:00'
      },
      {
        id: 211, userId: 16, userEmail: 'miguel.ortega@example.com', userFirstName: 'Miguel', userLastName: 'Ortega',
        date: '2026-01-29', startTime: '11:00', endTime: '11:30', durationMinutes: 30,
        state: 'CONFIRMED', expiresAt: null, confirmedAt: '2026-01-25T11:00:00',
        cancelledAt: null, cancellationReason: null, previousAppointmentId: null,
        calendarConfigVersion: 12, createdAt: '2026-01-20T11:00:00', updatedAt: '2026-01-25T11:00:00'
      },
      {
        id: 212, userId: 17, userEmail: 'isabella.ruiz@example.com', userFirstName: 'Isabella', userLastName: 'Ruiz',
        date: '2026-01-29', startTime: '14:00', endTime: '14:30', durationMinutes: 30,
        state: 'CONFIRMED', expiresAt: null, confirmedAt: '2026-01-25T14:00:00',
        cancelledAt: null, cancellationReason: null, previousAppointmentId: null,
        calendarConfigVersion: 12, createdAt: '2026-01-20T14:00:00', updatedAt: '2026-01-25T14:00:00'
      },
      {
        id: 213, userId: 18, userEmail: 'juan.perez@example.com', userFirstName: 'Juan', userLastName: 'Pérez',
        date: '2026-01-29', startTime: '15:00', endTime: '15:30', durationMinutes: 30,
        state: 'CONFIRMED', expiresAt: null, confirmedAt: '2026-01-25T15:00:00',
        cancelledAt: null, cancellationReason: null, previousAppointmentId: null,
        calendarConfigVersion: 12, createdAt: '2026-01-20T15:00:00', updatedAt: '2026-01-25T15:00:00'
      }
    ];
    
    return mockAppointments.find(a => a.id === id);
  }

  /**
   * Helper: Calcular hora de fin basada en hora de inicio y duración
   */
  private calculateEndTime(startTime: string, durationMinutes: number): string {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    startDate.setMinutes(startDate.getMinutes() + durationMinutes);
    
    const endHours = String(startDate.getHours()).padStart(2, '0');
    const endMinutes = String(startDate.getMinutes()).padStart(2, '0');
    return `${endHours}:${endMinutes}`;
  }
}

