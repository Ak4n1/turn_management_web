/**
 * Modelos para respuestas de bloqueos
 * Basados en API_ENDPOINTS_TURNS.md
 */

export interface ManualBlockResponse {
  id: number;
  blockDate: string; // YYYY-MM-DD
  isFullDay: boolean;
  timeRange: TimeRangeResponse | null;
  reason: string;
  active: boolean;
  affectsExistingAppointments: boolean;
  createdByUserId: number;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  affectedAppointments: any[]; // Por ahora vacío
}

export interface ManualBlockRequest {
  date: string; // YYYY-MM-DD
  isFullDay: boolean;
  timeRange: TimeRangeResponse | null;
  reason: string;
  affectsExistingAppointments: boolean;
}

export interface TimeRangeResponse {
  start: string; // HH:mm
  end: string; // HH:mm
}

