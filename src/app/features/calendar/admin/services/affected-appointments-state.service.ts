import { Injectable } from '@angular/core';
import { PreviewImpactResponse } from '../models/preview-impact.model';
import { AdminAppointmentResponse } from '../../../appointments/admin/models/admin-appointment-response.model';
import { WeeklyConfigRequest, DailyHoursRequest, AppointmentDurationRequest } from '../models/weekly-config-response.model';

/**
 * Servicio temporal para pasar datos entre weekly-config-page y affected-appointments-page
 */
@Injectable({
  providedIn: 'root'
})
export class AffectedAppointmentsStateService {
  private impact: PreviewImpactResponse | null = null;
  private appointmentsWithUsers: Map<number, AdminAppointmentResponse> = new Map();
  private weeklyConfig: WeeklyConfigRequest | null = null;
  private dailyHours: Record<string, Array<{ start: string; end: string }>> | null = null;
  private appointmentDuration: number | null = null;
  private durationNotes: string = '';

  /**
   * Almacena los datos de turnos afectados y la configuración pendiente para la siguiente página
   */
  setData(
    impact: PreviewImpactResponse, 
    appointmentsWithUsers: Map<number, AdminAppointmentResponse>,
    weeklyConfig: WeeklyConfigRequest,
    dailyHours: Record<string, Array<{ start: string; end: string }>>,
    appointmentDuration: number,
    durationNotes: string = ''
  ): void {
    this.impact = impact;
    this.appointmentsWithUsers = new Map(appointmentsWithUsers);
    this.weeklyConfig = { ...weeklyConfig };
    this.dailyHours = { ...dailyHours };
    this.appointmentDuration = appointmentDuration;
    this.durationNotes = durationNotes;
  }

  /**
   * Obtiene los datos almacenados SIN limpiarlos (se limpiarán manualmente después de guardar)
   */
  getData(): { 
    impact: PreviewImpactResponse; 
    appointmentsWithUsers: Map<number, AdminAppointmentResponse>;
    weeklyConfig: WeeklyConfigRequest;
    dailyHours: Record<string, Array<{ start: string; end: string }>>;
    appointmentDuration: number;
    durationNotes: string;
  } | null {
    if (!this.impact || !this.weeklyConfig || !this.dailyHours || this.appointmentDuration === null) {
      return null;
    }

    // Retornar copia de los datos pero NO limpiar todavía
    // Se limpiarán después de guardar exitosamente
    return {
      impact: this.impact,
      appointmentsWithUsers: new Map(this.appointmentsWithUsers),
      weeklyConfig: { ...this.weeklyConfig },
      dailyHours: { ...this.dailyHours },
      appointmentDuration: this.appointmentDuration,
      durationNotes: this.durationNotes
    };
  }

  /**
   * Limpia los datos almacenados
   */
  clear(): void {
    this.impact = null;
    this.appointmentsWithUsers.clear();
    this.weeklyConfig = null;
    this.dailyHours = null;
    this.appointmentDuration = null;
    this.durationNotes = '';
  }

  /**
   * Verifica si hay datos disponibles
   */
  hasData(): boolean {
    return this.impact !== null && this.weeklyConfig !== null && this.dailyHours !== null && this.appointmentDuration !== null;
  }
}

