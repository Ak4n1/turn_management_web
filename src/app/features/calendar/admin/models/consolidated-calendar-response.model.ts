/**
 * Modelos para respuestas de calendario consolidado (Admin)
 * Basados en API_ENDPOINTS_TURNS.md
 */

export interface ConsolidatedCalendarResponse {
  days: ConsolidatedDayResponse[];
}

export interface ConsolidatedDayResponse {
  date: string; // YYYY-MM-DD
  state: 'OPEN' | 'CLOSED' | 'PARTIAL';
  ruleType: 'BASE' | 'EXCEPTION' | 'BLOCK';
  ruleDescription: string;
  timeRanges: TimeRangeResponse[];
  hasExistingAppointments: boolean;
  appointmentsCount?: number; // Cantidad de turnos existentes en estados activos (CREATED, CONFIRMED)
}

export interface TimeRangeResponse {
  start: string; // HH:mm
  end: string; // HH:mm
}

