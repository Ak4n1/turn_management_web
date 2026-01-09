/**
 * Admin Appointment Request Models
 * 
 * Modelos para las requests de endpoints de admin (reschedule, cancel)
 */

export interface RescheduleRequest {
  newDate: string; // YYYY-MM-DD
  newStartTime: string; // HH:mm
  reason: string; // mínimo 10 caracteres, máximo 500
}

export interface CancelRequest {
  reason: string; // mínimo 10 caracteres, máximo 500
}

