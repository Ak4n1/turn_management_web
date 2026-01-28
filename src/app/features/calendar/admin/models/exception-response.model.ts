/**
 * Modelos para respuestas de excepciones
 * Basados en API_ENDPOINTS_TURNS.md
 */

export interface CalendarExceptionResponse {
  id: number;
  exceptionDate: string; // YYYY-MM-DD
  isOpen: boolean;
  timeRanges: TimeRangeResponse[];
  reason: string;
  active: boolean;
  createdByUserId: number;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  affectedAppointmentsCount: number;
}

export interface CalendarExceptionRequest {
  date: string; // YYYY-MM-DD
  isOpen: boolean;
  timeRanges: TimeRangeResponse[];
  reason: string;
  // Campos opcionales para cancelación automática
  autoCancelAffectedAppointments?: boolean;
  cancellationReason?: string;
  appointmentIdsToCancel?: number[];
}

export interface TimeRangeResponse {
  start: string; // HH:mm
  end: string; // HH:mm
}

