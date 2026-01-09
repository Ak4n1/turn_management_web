/**
 * Appointment History Response Model
 * 
 * Modelo para la respuesta de GET /api/admin/appointments/{id}/history
 */

export interface AppointmentHistoryEntry {
  id: number;
  action: string;
  previousState: string | null;
  newState: string;
  timestamp: string; // ISO date string
  performedByUserId: number;
  performedByEmail: string;
  reason: string | null;
  relatedAppointmentId: number | null;
}

export interface AppointmentHistoryResponse {
  appointmentId: number;
  history: AppointmentHistoryEntry[];
}

