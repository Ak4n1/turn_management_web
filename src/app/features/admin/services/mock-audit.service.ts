import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { AuditLogsPageResponse, AuditLogResponse, AuditActionType } from '../models/audit-log-response.model';

/**
 * Mock Audit Service
 * 
 * Simula las respuestas del backend para desarrollo.
 * Los datos mockeados coinciden exactamente con las estructuras de API_ENDPOINTS_TURNS.md
 */
@Injectable({
  providedIn: 'root'
})
export class MockAuditService {

  /**
   * GET /api/admin/audit
   * Consulta logs de auditoría con filtros
   */
  getAuditLogs(params?: {
    actionType?: AuditActionType;
    userId?: number;
    startDate?: string;
    endDate?: string;
    page?: number;
    size?: number;
  }): Observable<AuditLogsPageResponse> {
    // MOCK: Generar logs de ejemplo
    const mockLogs: AuditLogResponse[] = [
      {
        id: 1,
        action: 'CANCELLED',
        actionType: 'CANCELLATION',
        userId: 5,
        userEmail: 'usuario@ejemplo.com',
        appointmentId: 10,
        previousState: 'CONFIRMED',
        newState: 'CANCELLED',
        reason: 'Cambio de planes',
        timestamp: '2026-01-08T10:30:00.000000',
        ipAddress: '192.168.1.100'
      },
      {
        id: 12,
        action: 'CONFIGURATION_CREATED',
        actionType: 'CONFIGURATION_CHANGE',
        userId: 6,
        userEmail: 'encabojuan@gmail.com',
        configurationId: 12,
        reason: 'Configuración de duración de turnos: 30 minutos',
        timestamp: '2026-01-08T00:30:47.125910',
        newState: 'VERSION_12'
      },
      {
        id: 3,
        action: 'RESCHEDULE_REQUEST_PENDING_ADMIN_APPROVAL',
        actionType: 'RESCHEDULE_REQUEST',
        userId: 5,
        userEmail: 'usuario@ejemplo.com',
        appointmentId: 8,
        rescheduleRequestId: 3,
        reason: 'Cambio de horario necesario',
        timestamp: '2026-01-08T09:00:00.000000',
        newState: 'PENDING_ADMIN_APPROVAL'
      },
      {
        id: 4,
        action: 'EXCEPTION_CREATED',
        actionType: 'EXCEPTION',
        userId: 6,
        userEmail: 'encabojuan@gmail.com',
        reason: 'Día de San Valentín - horario reducido',
        timestamp: '2026-01-08T08:00:00.000000',
        newState: 'ACTIVE'
      },
      {
        id: 5,
        action: 'BLOCK_CREATED',
        actionType: 'BLOCK',
        userId: 6,
        userEmail: 'encabojuan@gmail.com',
        reason: 'Mantenimiento programado del sistema',
        timestamp: '2026-01-08T07:00:00.000000',
        newState: 'ACTIVE'
      }
    ];

    // Aplicar filtros
    let filtered = [...mockLogs];

    if (params?.actionType) {
      filtered = filtered.filter(log => log.actionType === params.actionType);
    }

    if (params?.userId) {
      filtered = filtered.filter(log => log.userId === params.userId);
    }

    if (params?.startDate) {
      filtered = filtered.filter(log => log.timestamp >= params.startDate!);
    }

    if (params?.endDate) {
      filtered = filtered.filter(log => log.timestamp <= params.endDate!);
    }

    // Ordenar por timestamp descendente
    filtered.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Paginación
    const page = params?.page || 0;
    const size = params?.size || 20;
    const start = page * size;
    const end = start + size;
    const paginated = filtered.slice(start, end);
    const totalPages = Math.ceil(filtered.length / size);

    return of({
      logs: paginated,
      totalElements: filtered.length,
      totalPages,
      page,
      size
    }).pipe(delay(500));
  }
}

