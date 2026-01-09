/**
 * Models for Preview Impact endpoint
 * POST /api/admin/calendar/preview-impact
 */

export interface PreviewImpactRequest {
  changeType: 'WEEKLY_CONFIG' | 'DAILY_HOURS' | 'APPOINTMENT_DURATION' | 'EXCEPTION' | 'BLOCK';
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  weeklyConfig?: {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
    notes?: string;
  };
  dailyHours?: Record<string, Array<{ start: string; end: string }>>;
  appointmentDurationMinutes?: number;
  exception?: any; // Para futuras implementaciones
  block?: any; // Para futuras implementaciones
}

export interface AffectedAppointmentInfo {
  id: number | null;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
}

export interface PreviewImpactResponse {
  affectedDays: number;
  slotsLost: number;
  existingAppointmentsAffected: number;
  appointments: AffectedAppointmentInfo[];
  changeDescription: string;
}

