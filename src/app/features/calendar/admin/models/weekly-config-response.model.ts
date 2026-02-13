/**
 * Modelos para respuestas de configuración semanal
 * Basados en API_ENDPOINTS_TURNS.md
 */

export interface WeeklyConfigResponse {
  id: number;
  version: number;
  active: boolean;
  weeklyConfig: WeeklyConfig;
  dailyHours?: DailyHoursResponse[];
  appointmentDurationMinutes?: number;
  createdByUserId: number;
  notes?: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface WeeklyConfig {
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
}

export interface DailyHoursResponse {
  dayOfWeek: number; // 1=Lunes, 7=Domingo
  timeRanges: TimeRangeResponse[];
}

export interface TimeRangeResponse {
  start: string; // HH:mm
  end: string; // HH:mm
}

export interface WeeklyConfigRequest {
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
  notes?: string;
  autoCancelAffectedAppointments?: boolean;
  cancellationReason?: string;
  appointmentIdsToCancel?: number[];
}

export interface DailyHoursRequest {
  dailyHours: Record<string, TimeRangeResponse[]>; // key: monday, tuesday, etc.
  notes?: string;
}

export interface AppointmentDurationRequest {
  durationMinutes: number;
  notes?: string;
}

/** Request para guardar toda la configuración en una sola llamada (atómico, versión +1). */
export interface FullConfigRequest {
  weeklyConfig: WeeklyConfigRequest;
  dailyHours: DailyHoursRequest;
  durationMinutes: number;
  notes?: string;
}

