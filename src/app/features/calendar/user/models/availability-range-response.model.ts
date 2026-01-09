/**
 * Modelos para respuestas de disponibilidad
 * Basados en API_ENDPOINTS_TURNS.md
 */

export interface AvailabilityRangeResponse {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  days: DayAvailabilityResponse[];
}

export interface DayAvailabilityResponse {
  date: string; // YYYY-MM-DD
  status: 'FULL' | 'PARTIAL' | 'CLOSED';
  availableSlots: number;
  totalSlots: number;
}

export interface AvailabilityResponse {
  date: string; // YYYY-MM-DD
  isAvailable: boolean;
  ruleApplied: 'BASE' | 'EXCEPTION' | 'BLOCK';
  timeRanges: TimeRangeResponse[];
  description: string;
  
  // NUEVO: Información de turnos existentes
  hasExistingAppointments?: boolean;
  existingAppointmentsCount?: number;
  message?: string;
}

export interface TimeRangeResponse {
  start: string; // HH:mm
  end: string; // HH:mm
}

export interface SlotsResponse {
  date: string; // YYYY-MM-DD
  slots: SlotResponse[];
  totalSlots: number;
  availableSlots: number;
  
  // NUEVO: Información de turnos existentes
  hasExistingAppointments?: boolean;
  existingAppointmentsCount?: number;
  message?: string;
}

export interface SlotResponse {
  start: string; // HH:mm
  end: string; // HH:mm
  available: boolean;
}

