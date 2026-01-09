import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { ManualBlockResponse, ManualBlockRequest } from '../models/block-response.model';

/**
 * Mock Block Service
 * 
 * Simula las respuestas del backend para desarrollo.
 * Los datos mockeados coinciden exactamente con las estructuras de API_ENDPOINTS_TURNS.md
 */
@Injectable({
  providedIn: 'root'
})
export class MockBlockService {

  private mockBlocks: ManualBlockResponse[] = [
    {
      id: 1,
      blockDate: '2026-02-18',
      isFullDay: true,
      timeRange: null,
      reason: 'Mantenimiento programado del sistema',
      active: true,
      affectsExistingAppointments: false,
      createdByUserId: 1,
      createdAt: '2026-01-08T10:00:00',
      updatedAt: '2026-01-08T10:00:00',
      affectedAppointments: []
    },
    {
      id: 2,
      blockDate: '2026-02-20',
      isFullDay: false,
      timeRange: {
        start: '14:00',
        end: '16:00'
      },
      reason: 'Reunión interna importante',
      active: true,
      affectsExistingAppointments: false,
      createdByUserId: 1,
      createdAt: '2026-01-08T10:15:00',
      updatedAt: '2026-01-08T10:15:00',
      affectedAppointments: []
    }
  ];

  /**
   * POST /api/admin/calendar/blocks
   * Crea un bloqueo
   */
  createBlock(request: ManualBlockRequest): Observable<ManualBlockResponse> {
    const newBlock: ManualBlockResponse = {
      id: this.mockBlocks.length + 1,
      blockDate: request.date,
      isFullDay: request.isFullDay,
      timeRange: request.isFullDay ? null : request.timeRange,
      reason: request.reason,
      active: true,
      affectsExistingAppointments: request.affectsExistingAppointments,
      createdByUserId: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      affectedAppointments: []
    };
    
    this.mockBlocks.push(newBlock);
    return of(newBlock).pipe(delay(500));
  }

  /**
   * GET lista de bloqueos (mock)
   * Nota: El backend no tiene endpoint GET, pero necesitamos listar para la UI
   */
  getBlocks(): Observable<ManualBlockResponse[]> {
    return of([...this.mockBlocks]).pipe(delay(300));
  }
}

