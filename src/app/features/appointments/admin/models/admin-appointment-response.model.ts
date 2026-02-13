/**
 * Modelos para respuestas de turnos admin
 * Basados en API_ENDPOINTS_TURNS.md
 */

export interface AdminAppointmentResponse {
  id: number;
  userId: number;
  userEmail: string;
  userFirstName: string | null;
  userLastName: string | null;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  durationMinutes: number;
  state: AppointmentState;
  expiresAt: string | null;
  confirmedAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  previousAppointmentId: number | null;
  /** ID del turno siguiente si este turno fue reprogramado (estado RESCHEDULED). */
  nextAppointmentId?: number | null;
  /** Fecha del nuevo turno cuando este fue reprogramado (YYYY-MM-DD). */
  nextAppointmentDate?: string | null;
  /** Hora de inicio del nuevo turno (HH:mm). */
  nextAppointmentStartTime?: string | null;
  /** Hora de fin del nuevo turno (HH:mm). */
  nextAppointmentEndTime?: string | null;
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

export interface AdminAppointmentsPageResponse {
  content: AdminAppointmentResponse[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

