/**
 * Calendar View Models
 * Interfaces y tipos para el componente de calendario
 */

export type CalendarViewMode = 'day' | 'week' | 'month';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string;           // YYYY-MM-DD
  startTime: string;      // HH:mm
  endTime: string;        // HH:mm
  status: 'confirmed' | 'pending' | 'cancelled';
  color?: string;
}

export interface OccupiedSlot {
  start: string;  // HH:mm
  end: string;    // HH:mm
}

export interface CalendarDay {
  date: Date;
  dateString: string;     // YYYY-MM-DD
  dayNumber: number;
  dayName: string;        // LUN, MAR, etc.
  events: CalendarEvent[];
  isToday: boolean;
  isCurrentMonth: boolean;
  state?: 'open' | 'closed' | 'partial';
  rawState?: string;      // "OPEN", "CLOSED", "PARTIAL"
  ranges?: { start: string; end: string }[];
  /** Slots ocupados por otros (para mostrar "Ocupado" en amarillo en calendario usuario) */
  occupiedSlots?: OccupiedSlot[];
}

export interface CalendarWeek {
  weekNumber: number;
  days: CalendarDay[];
  startDate: Date;
  endDate: Date;
}

export interface TimeSlot {
  hour: number;
  label: string;          // "08:00"
}

export interface CalendarStats {
  todayTotal: number;
  pending: number;
  confirmed: number;
  cancelled: number;
  occupancyPercent: number;
}
