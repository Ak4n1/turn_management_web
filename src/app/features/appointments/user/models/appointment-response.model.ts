/**
 * Modelos para respuestas de turnos
 * Basados en API_ENDPOINTS_TURNS.md
 */

export interface AppointmentResponse {
  id: number;
  userId: number;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  durationMinutes: number;
  state: AppointmentState;
  expiresAt: string | null; // ISO string, solo para CREATED
  confirmedAt: string | null; // ISO string, solo si está confirmado
  cancelledAt: string | null; // ISO string, solo si está cancelado
  cancellationReason: string | null;
  previousAppointmentId: number | null; // Si fue reprogramado
  calendarConfigVersion: number;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export type AppointmentState = 
  | 'CREATED' 
  | 'CONFIRMED' 
  | 'CANCELLED' 
  | 'EXPIRED' 
  | 'NO_SHOW' 
  | 'COMPLETED' 
  | 'RESCHEDULED'
  | 'CANCELLED_BY_ADMIN';

export interface MyAppointmentsResponse {
  appointments: AppointmentResponse[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}

export interface AppointmentHistoryResponse {
  appointmentId: number;
  history: AppointmentHistoryEvent[];
}

export interface AppointmentHistoryEvent {
  id: number;
  action: string;
  previousState: string | null;
  newState: string;
  timestamp: string; // ISO string
  performedByUserId: number;
  performedByEmail: string;
  reason: string | null;
  relatedAppointmentId: number | null;
}

