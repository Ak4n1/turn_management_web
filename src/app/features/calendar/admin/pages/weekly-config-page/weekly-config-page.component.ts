import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { AdminCalendarService } from '../../services/admin-calendar.service';
import { AdminAppointmentService } from '../../../../appointments/admin/services/admin-appointment.service';
import { WeeklyConfigResponse, WeeklyConfigRequest, DailyHoursRequest, AppointmentDurationRequest } from '../../models/weekly-config-response.model';
import { PreviewImpactResponse, AffectedAppointmentInfo } from '../../models/preview-impact.model';
import { AdminAppointmentResponse } from '../../../../appointments/admin/models/admin-appointment-response.model';
import { SpinnerComponent } from '../../../../../shared/atoms/spinner/spinner.component';
import { ErrorTextComponent } from '../../../../../shared/atoms/error-text/error-text.component';
import { ButtonComponent } from '../../../../../shared/atoms/button/button.component';
import { InputComponent } from '../../../../../shared/atoms/input/input.component';
import { AlertModalComponent } from '../../../../../shared/molecules/alert-modal/alert-modal.component';

/**
 * Weekly Config Page Component (Admin)
 * 
 * Página para configurar el calendario semanal base, horarios diarios y duración de turnos.
 * 
 * ✅ Usa AdminCalendarService (servicio real con datos del backend)
 */
@Component({
  selector: 'app-weekly-config-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SpinnerComponent,
    ErrorTextComponent,
    ButtonComponent,
    InputComponent,
    AlertModalComponent
  ],
  templateUrl: './weekly-config-page.component.html',
  styleUrl: './weekly-config-page.component.css'
})
export class WeeklyConfigPageComponent implements OnInit {
  private weeklyConfigService = inject(AdminCalendarService);
  private appointmentService = inject(AdminAppointmentService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  activeConfig: WeeklyConfigResponse | null = null;
  isLoading = false;
  error: string | null = null;
  successMessage: string | null = null;

  // Estado para "Guardar Todo"
  isSavingAll = false;

  // Estado del modal de alerta
  isAlertModalOpen = false;
  alertType: 'success' | 'error' | 'warning' | 'info' = 'info';
  alertTitle = '';
  alertMessage = '';
  showCancelButton = false;
  showAlertIcon = true;
  pendingSaveAction: (() => void) | null = null; // Acción a ejecutar si el usuario confirma

  // Estado de turnos afectados
  affectedImpact: PreviewImpactResponse | null = null;
  appointmentsWithUsers: Map<number, AdminAppointmentResponse> = new Map();

  // Valores para cancelación automática
  autoCancelAffectedAppointments: boolean = true;
  cancellationReason: string = 'Día cerrado según nueva configuración';

  // Sistema de steps: 'config' | 'affected-appointments'
  currentStep: 'config' | 'affected-appointments' = 'config';

  // Paginación para turnos afectados
  affectedAppointmentsCurrentPage = 0;
  affectedAppointmentsItemsPerPage = 5;
  affectedAppointmentsTotalPages = 0;
  affectedAppointmentsPaginated: AffectedAppointmentInfo[] = []; // Fix: Explicitly initializing as empty array
  // Formulario semanal
  weeklyConfig: WeeklyConfigRequest = {
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: false,
    sunday: false,
    notes: ''
  };

  // Formulario horarios diarios
  dailyHours: Record<string, Array<{ start: string; end: string }>> = {
    monday: [{ start: '09:00', end: '12:00' }, { start: '14:00', end: '18:00' }],
    tuesday: [{ start: '09:00', end: '12:00' }, { start: '14:00', end: '18:00' }],
    wednesday: [{ start: '09:00', end: '12:00' }, { start: '14:00', end: '18:00' }],
    thursday: [{ start: '09:00', end: '12:00' }, { start: '14:00', end: '18:00' }],
    friday: [{ start: '09:00', end: '12:00' }, { start: '14:00', end: '18:00' }],
    saturday: [],
    sunday: []
  };

  // Formulario duración
  appointmentDuration: number = 30;
  durationNotes: string = '';



  ngOnInit(): void {
    // Cargar configuración activa siempre
    this.loadActiveConfig();
  }

  public loadActiveConfig(): void {
    this.isLoading = true;
    this.error = null;

    this.weeklyConfigService.getActiveConfig().subscribe({
      next: (config) => {
        if (config) {
          // Hay configuración activa, cargar datos en formularios
          this.activeConfig = config;
          this.weeklyConfig = { ...config.weeklyConfig, notes: config.notes || '' };
          if (config.appointmentDurationMinutes) {
            this.appointmentDuration = config.appointmentDurationMinutes;
          }
          // Cargar horarios diarios si existen
          if (config.dailyHours && config.dailyHours.length > 0) {
            this.loadDailyHoursFromResponse(config.dailyHours);
          }
        } else {
          // No hay configuración activa (es normal la primera vez)
          this.activeConfig = null;
          this.error = null; // No mostrar error, permitir crear nueva configuración
        }
        this.isLoading = false;
      },
      error: (err) => {
        // Solo mostrar error si no es un 404 (que ya se maneja en el servicio)
        this.error = err.message || 'Error al cargar la configuración';
        this.isLoading = false;
        console.error('Error loading config:', err);
      }
    });
  }


  /**
   * Carga los horarios diarios desde la respuesta del backend
   */
  private loadDailyHoursFromResponse(dailyHours: any[]): void {
    const dayMap: Record<number, string> = {
      1: 'monday',
      2: 'tuesday',
      3: 'wednesday',
      4: 'thursday',
      5: 'friday',
      6: 'saturday',
      7: 'sunday'
    };

    dailyHours.forEach(dayHours => {
      const dayName = dayMap[dayHours.dayOfWeek];
      if (dayName && dayHours.timeRanges) {
        this.dailyHours[dayName] = dayHours.timeRanges;
      }
    });
  }


  saveWeeklyConfig(): void {
    this.isLoading = true;
    this.error = null;
    this.successMessage = null;

    this.weeklyConfigService.createWeeklyConfig(this.weeklyConfig).subscribe({
      next: (config) => {
        this.activeConfig = config;
        this.successMessage = 'Configuración semanal guardada exitosamente';
        this.isLoading = false;
        setTimeout(() => this.successMessage = null, 3000);
      },
      error: (err) => {
        this.error = err.message || 'Error al guardar la configuración semanal';
        this.isLoading = false;
        console.error('Error saving weekly config:', err);
      }
    });
  }

  saveDailyHours(): void {
    this.isLoading = true;
    this.error = null;
    this.successMessage = null;

    // Filtrar solo los días que están abiertos según weeklyConfig
    const filteredDailyHours: Record<string, Array<{ start: string; end: string }>> = {};
    const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

    for (const day of dayNames) {
      const dayKey = day as keyof WeeklyConfigRequest;
      const isOpen = this.weeklyConfig[dayKey] as boolean;

      if (isOpen && this.dailyHours[day] && this.dailyHours[day].length > 0) {
        filteredDailyHours[day] = this.dailyHours[day];
      }
    }

    const request: DailyHoursRequest = {
      dailyHours: filteredDailyHours,
      notes: ''
    };

    this.weeklyConfigService.setDailyHours(request).subscribe({
      next: (config) => {
        this.activeConfig = config;
        this.successMessage = 'Horarios diarios guardados exitosamente';
        this.isLoading = false;
        setTimeout(() => this.successMessage = null, 3000);
      },
      error: (err) => {
        this.error = err.message || 'Error al guardar los horarios diarios';
        this.isLoading = false;
        console.error('Error saving daily hours:', err);
      }
    });
  }

  saveAppointmentDuration(): void {
    this.isLoading = true;
    this.error = null;
    this.successMessage = null;

    const request: AppointmentDurationRequest = {
      durationMinutes: this.appointmentDuration,
      notes: this.durationNotes
    };

    this.weeklyConfigService.setAppointmentDuration(request).subscribe({
      next: (config) => {
        this.activeConfig = config;
        this.successMessage = 'Duración de turnos guardada exitosamente';
        this.isLoading = false;
        setTimeout(() => this.successMessage = null, 3000);
      },
      error: (err) => {
        this.error = err.message || 'Error al guardar la duración de turnos';
        this.isLoading = false;
        console.error('Error saving duration:', err);
      }
    });
  }

  addTimeRange(day: string): void {
    if (!this.dailyHours[day]) {
      this.dailyHours[day] = [];
    }
    this.dailyHours[day].push({ start: '09:00', end: '12:00' });
  }

  removeTimeRange(day: string, index: number): void {
    if (this.dailyHours[day]) {
      this.dailyHours[day].splice(index, 1);
    }
    // Limpiar error si estaba relacionado con este rango
    if (this.error && this.error.includes(`${this.getDayName(day)}`)) {
      this.error = null;
    }
  }

  /**
   * Valida un rango horario y retorna mensaje de error si es inválido
   */
  private validateTimeRange(start: string, end: string): string | null {
    if (!start || !end) {
      return null; // Validación básica, no validar si está vacío
    }

    const [startHours, startMinutes] = start.split(':').map(Number);
    const [endHours, endMinutes] = end.split(':').map(Number);

    // Validar que sean números válidos
    if (isNaN(startHours) || isNaN(startMinutes) || isNaN(endHours) || isNaN(endMinutes)) {
      return null; // Dejar que el backend valide el formato
    }

    const startTime = startHours * 60 + startMinutes;
    const endTime = endHours * 60 + endMinutes;

    if (startTime >= endTime) {
      return `El horario de inicio (${start}) debe ser anterior al horario de fin (${end}).`;
    }

    return null;
  }

  /**
   * Valida todos los rangos horarios y muestra error si hay alguno inválido
   */
  validateAllTimeRanges(): boolean {
    const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    for (const day of dayNames) {
      const hours = this.dailyHours[day];
      if (hours && hours.length > 0) {
        for (let i = 0; i < hours.length; i++) {
          const range = hours[i];
          const error = this.validateTimeRange(range.start, range.end);
          if (error) {
            this.error = `${this.getDayName(day)} - Rango ${i + 1}: ${error}`;
            return false;
          }
        }
      }
    }

    return true;
  }

  getDayName(day: string): string {
    const days: Record<string, string> = {
      'monday': 'Lunes',
      'tuesday': 'Martes',
      'wednesday': 'Miércoles',
      'thursday': 'Jueves',
      'friday': 'Viernes',
      'saturday': 'Sábado',
      'sunday': 'Domingo'
    };
    return days[day] || day;
  }

  isDayOpen(day: string): boolean {
    const dayKey = day as keyof WeeklyConfigRequest;
    return this.weeklyConfig[dayKey] as boolean;
  }

  getDayValue(day: string): boolean {
    const dayKey = day as keyof WeeklyConfigRequest;
    return this.weeklyConfig[dayKey] as boolean;
  }

  setDayValue(day: string, value: boolean): void {
    const dayKey = day as keyof WeeklyConfigRequest;
    (this.weeklyConfig as any)[dayKey] = value;
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Valida que todos los días abiertos tengan al menos un rango horario configurado
   */
  private validateBeforeSaveAll(): { isValid: boolean; errorMessage: string } {
    const daysWithoutHours: string[] = [];
    const dayNames: Record<string, string> = {
      'monday': 'Lunes',
      'tuesday': 'Martes',
      'wednesday': 'Miércoles',
      'thursday': 'Jueves',
      'friday': 'Viernes',
      'saturday': 'Sábado',
      'sunday': 'Domingo'
    };

    // Verificar cada día
    for (const day of ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']) {
      const dayKey = day as keyof WeeklyConfigRequest;
      const isOpen = this.weeklyConfig[dayKey] as boolean;

      if (isOpen) {
        // Si el día está abierto, debe tener al menos un rango horario
        const hours = this.dailyHours[day];
        if (!hours || hours.length === 0) {
          daysWithoutHours.push(dayNames[day]);
        }
      }
    }

    if (daysWithoutHours.length > 0) {
      return {
        isValid: false,
        errorMessage: `Los siguientes días están marcados como abiertos pero no tienen horarios configurados:\n\n${daysWithoutHours.join(', ')}\n\nPor favor, configura al menos un rango horario para cada día abierto antes de guardar.`
      };
    }

    // Validar que la duración esté configurada
    if (!this.appointmentDuration || this.appointmentDuration < 15) {
      return {
        isValid: false,
        errorMessage: 'La duración de turnos debe ser de al menos 15 minutos.'
      };
    }

    return { isValid: true, errorMessage: '' };
  }

  /**
   * Guarda todas las configuraciones en orden: semanal, horarios, duración
   * Primero valida con preview-impact para detectar turnos afectados
   */
  saveAll(): void {
    // Validar antes de guardar
    const validation = this.validateBeforeSaveAll();
    if (!validation.isValid) {
      this.showAlertModal('error', 'Error de Validación', validation.errorMessage, false);
      return;
    }

    // Validar rangos horarios
    if (!this.validateAllTimeRanges()) {
      return; // El error ya se estableció en validateAllTimeRanges
    }

    // Previsualizar impacto antes de guardar
    this.previewImpactBeforeSave();
  }

  /**
   * Previsualiza el impacto de los cambios propuestos
   */
  private previewImpactBeforeSave(): void {
    this.isSavingAll = true;
    this.error = null;
    this.successMessage = null;

    // Calcular rango de fechas (próximos 90 días)
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 90);

    const startDateStr = this.formatDateForApi(today);
    const endDateStr = this.formatDateForApi(endDate);

    // Crear request de preview para WEEKLY_CONFIG
    const previewRequest = {
      changeType: 'WEEKLY_CONFIG' as const,
      startDate: startDateStr,
      endDate: endDateStr,
      weeklyConfig: this.weeklyConfig
    };

    this.weeklyConfigService.previewImpact(previewRequest).subscribe({
      next: (impact) => {
        this.isSavingAll = false;

        console.log('[DEBUG] previewImpactBeforeSave: Respuesta del backend', {
          existingAppointmentsAffected: impact.existingAppointmentsAffected,
          appointmentsCount: impact.appointments?.length || 0,
          affectedDays: impact.affectedDays
        });

        // Si hay turnos afectados, mostrar step especial
        if (impact.existingAppointmentsAffected > 0) {
          this.affectedImpact = impact;
          console.log('[DEBUG] previewImpactBeforeSave: Hay turnos afectados, cargando información de usuarios');
          // Obtener información completa de cada turno para mostrar el nombre del usuario
          this.loadAppointmentsWithUserInfo(impact.appointments);
        } else {
          console.log('[DEBUG] previewImpactBeforeSave: No hay turnos afectados, guardando directamente');
          // No hay turnos afectados, guardar directamente
          this.executeSaveAll();
        }
      },
      error: (err) => {
        this.isSavingAll = false;
        // Si falla el preview, permitir guardar de todas formas (puede ser que el endpoint no esté disponible)
        console.warn('Error al previsualizar impacto, continuando con guardado:', err);
        this.executeSaveAll();
      }
    });
  }

  /**
   * Ejecuta el guardado de todas las configuraciones
   * Se usa cuando NO hay turnos afectados, cuando falla el preview de impacto, o cuando se confirma desde el step de turnos afectados
   */
  private executeSaveAll(): void {
    this.isSavingAll = true;
    this.error = null;
    this.successMessage = null;

    // Preparar configuración semanal (incluyendo valores de cancelación si vienen del step de turnos afectados)
    // Extraer IDs de turnos afectados si existen
    const appointmentIdsToCancel = this.affectedImpact?.appointments
      ?.filter(apt => apt.id)
      .map(apt => apt.id!) || [];

    const weeklyConfigRequest: WeeklyConfigRequest = {
      ...this.weeklyConfig,
      autoCancelAffectedAppointments: this.autoCancelAffectedAppointments,
      cancellationReason: this.autoCancelAffectedAppointments ? this.cancellationReason : undefined,
      appointmentIdsToCancel: appointmentIdsToCancel.length > 0 ? appointmentIdsToCancel : undefined
    };

    // Preparar horarios diarios (solo días abiertos)
    const filteredDailyHours: Record<string, Array<{ start: string; end: string }>> = {};
    const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

    for (const day of dayNames) {
      const dayKey = day as keyof WeeklyConfigRequest;
      const isOpen = this.weeklyConfig[dayKey] as boolean;

      if (isOpen && this.dailyHours[day] && this.dailyHours[day].length > 0) {
        filteredDailyHours[day] = this.dailyHours[day];
      }
    }

    const dailyHoursRequest: DailyHoursRequest = {
      dailyHours: filteredDailyHours,
      notes: ''
    };

    const durationRequest: AppointmentDurationRequest = {
      durationMinutes: this.appointmentDuration,
      notes: this.durationNotes
    };

    // Paso 1: Guardar configuración semanal (debe hacerse primero)
    // Paso 2: Guardar horarios diarios (debe hacerse antes de la duración según validación del backend)
    // Paso 3: Guardar duración de turnos
    this.weeklyConfigService.createWeeklyConfig(weeklyConfigRequest).pipe(
      switchMap((config) => {
        this.activeConfig = config;
        // Primero guardar horarios diarios
        return this.weeklyConfigService.setDailyHours(dailyHoursRequest).pipe(
          switchMap((config2) => {
            this.activeConfig = config2;
            // Luego guardar duración
            return this.weeklyConfigService.setAppointmentDuration(durationRequest);
          })
        );
      })
    ).subscribe({
      next: (config3) => {
        this.activeConfig = config3;
        this.isSavingAll = false;

        // Si veníamos del step de turnos afectados, volver al step de configuración
        if (this.currentStep === 'affected-appointments') {
          this.currentStep = 'config';
          this.affectedImpact = null;
          this.appointmentsWithUsers.clear();
        }

        this.showAlertModal(
          'success',
          'Configuración Guardada',
          'Todas las configuraciones se han guardado exitosamente:\n\n• Calendario semanal\n• Horarios diarios\n• Duración de turnos',
          false,
          false // showIcon = false (User request: remove top checkmark)
        );
      },
      error: (err) => {
        this.isSavingAll = false;
        this.showAlertModal(
          'error',
          'Error al Guardar Configuración',
          `Error al guardar la configuración:\n\n${err.message || 'Error desconocido'}`
        );
        console.error('Error saving config:', err);
      }
    });
  }

  /**
   * Carga información completa de turnos afectados incluyendo nombres de usuarios
   */
  private loadAppointmentsWithUserInfo(affectedAppointments: AffectedAppointmentInfo[]): void {
    // Verificar que tenemos el impacto y los turnos afectados
    if (!this.affectedImpact) {
      console.warn('loadAppointmentsWithUserInfo: affectedImpact es null, no se puede cargar información de usuarios');
      // Si no hay impacto, guardar directamente
      this.executeSaveAll();
      return;
    }

    if (!affectedAppointments || affectedAppointments.length === 0) {
      // Si no hay turnos afectados en la lista, pero sí hay impacto, mostrar step de todas formas
      this.showAffectedAppointmentsStep();
      return;
    }

    // Agrupar turnos por fecha para hacer menos llamadas
    const appointmentsByDate = new Map<string, AffectedAppointmentInfo[]>();
    affectedAppointments.forEach(apt => {
      if (!appointmentsByDate.has(apt.date)) {
        appointmentsByDate.set(apt.date, []);
      }
      appointmentsByDate.get(apt.date)!.push(apt);
    });

    // Obtener turnos por cada fecha única
    const requests = Array.from(appointmentsByDate.keys()).map(date =>
      this.appointmentService.getAppointmentsByDate(date).pipe(
        catchError(err => {
          console.warn(`Error obteniendo turnos para fecha ${date}:`, err);
          return of({ content: [], totalElements: 0, totalPages: 0, page: 0, size: 0 });
        })
      )
    );

    if (requests.length === 0) {
      this.showAffectedAppointmentsStep();
      return;
    }

    // Ejecutar todas las peticiones en paralelo
    forkJoin(requests).subscribe({
      next: (responses) => {
        // Crear un mapa de ID -> AdminAppointmentResponse
        this.appointmentsWithUsers.clear();
        responses.forEach(response => {
          response.content.forEach(apt => {
            if (apt.id) {
              this.appointmentsWithUsers.set(apt.id, apt);
            }
          });
        });

        // Mostrar step con la información completa
        this.showAffectedAppointmentsStep();
      },
      error: (err) => {
        console.error('Error obteniendo información de turnos:', err);
        // Si falla, mostrar step sin nombres de usuarios
        this.appointmentsWithUsers.clear();
        this.showAffectedAppointmentsStep();
      }
    });
  }

  /**
   * Muestra el step de turnos afectados
   */
  private showAffectedAppointmentsStep(): void {
    if (this.affectedImpact) {
      console.log('[DEBUG] showAffectedAppointmentsStep: Mostrando step de turnos afectados', {
        affectedImpact: this.affectedImpact,
        appointmentsCount: this.appointmentsWithUsers.size
      });

      // Actualizar paginación
      this.updateAffectedAppointmentsPagination();

      // Cambiar al step de turnos afectados
      this.currentStep = 'affected-appointments';
    } else {
      console.warn('[DEBUG] showAffectedAppointmentsStep: affectedImpact es null, no se puede mostrar step');
    }
  }

  /**
   * Vuelve al step de configuración
   */
  cancelAffectedAppointmentsStep(): void {
    this.currentStep = 'config';
    this.affectedImpact = null;
    this.appointmentsWithUsers.clear();
  }

  /**
   * Confirma y guarda desde el step de turnos afectados
   */
  confirmAffectedAppointmentsStep(): void {
    // Guardar con las preferencias de cancelación
    this.executeSaveAll();
  }

  /**
   * Actualiza la paginación de turnos afectados
   */
  private updateAffectedAppointmentsPagination(): void {
    if (!this.affectedImpact || !this.affectedImpact.appointments) {
      this.affectedAppointmentsPaginated = [];
      this.affectedAppointmentsTotalPages = 0;
      return;
    }

    this.affectedAppointmentsTotalPages = Math.ceil(this.affectedImpact.appointments.length / this.affectedAppointmentsItemsPerPage);
    const startIndex = this.affectedAppointmentsCurrentPage * this.affectedAppointmentsItemsPerPage;
    const endIndex = startIndex + this.affectedAppointmentsItemsPerPage;
    this.affectedAppointmentsPaginated = this.affectedImpact.appointments.slice(startIndex, endIndex);
  }

  /**
   * Métodos de paginación para turnos afectados
   */
  affectedAppointmentsPreviousPage(): void {
    if (this.affectedAppointmentsCurrentPage > 0) {
      this.affectedAppointmentsCurrentPage--;
      this.updateAffectedAppointmentsPagination();
    }
  }

  affectedAppointmentsNextPage(): void {
    if (this.affectedAppointmentsCurrentPage < this.affectedAppointmentsTotalPages - 1) {
      this.affectedAppointmentsCurrentPage++;
      this.updateAffectedAppointmentsPagination();
    }
  }

  affectedAppointmentsGoToPage(page: number): void {
    if (page >= 0 && page < this.affectedAppointmentsTotalPages) {
      this.affectedAppointmentsCurrentPage = page;
      this.updateAffectedAppointmentsPagination();
    }
  }

  getAffectedAppointmentsPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(0, this.affectedAppointmentsCurrentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(this.affectedAppointmentsTotalPages - 1, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(0, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  getAffectedAppointmentUserFullName(appointment: AffectedAppointmentInfo): string {
    if (!appointment.id) {
      return 'Usuario desconocido';
    }

    const fullAppointment = this.appointmentsWithUsers.get(appointment.id);
    if (!fullAppointment) {
      return 'Cargando...';
    }

    const { userFirstName, userLastName, userEmail } = fullAppointment;
    if (userFirstName && userLastName) {
      return `${userFirstName} ${userLastName}`;
    } else if (userFirstName) {
      return userFirstName;
    } else if (userLastName) {
      return userLastName;
    } else {
      return userEmail || 'Usuario desconocido';
    }
  }

  getAffectedAppointmentUserInitials(appointment: AffectedAppointmentInfo): string {
    const fullName = this.getAffectedAppointmentUserFullName(appointment);
    if (!fullName) {
      return '?';
    }

    // Si todavía está cargando, mostrar placeholder estable
    if (fullName === 'Cargando...') {
      return '…';
    }

    const parts = fullName.trim().split(/\s+/);
    const first = parts[0]?.charAt(0) ?? '';
    const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
    const initials = (first + last).toUpperCase();
    return initials || '?';
  }

  formatAffectedAppointmentDate(appointment: AffectedAppointmentInfo): string {
    const date = new Date(appointment.date + 'T' + appointment.time);
    return date.toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatAffectedAppointmentTime(appointment: AffectedAppointmentInfo): string {
    const date = new Date(appointment.date + 'T' + appointment.time);
    return date.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }


  /**
   * Formatea una fecha para la API (YYYY-MM-DD)
   */
  private formatDateForApi(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Muestra el modal de alerta con el mensaje correspondiente
   */

  /**
   * Muestra el modal de alerta con el mensaje correspondiente
   */
  private showAlertModal(
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    message: string,
    showCancel: boolean = false,
    showIcon: boolean = true,
    onConfirm?: () => void
  ): void {
    this.alertType = type;
    this.alertTitle = title;
    this.alertMessage = message;
    this.showCancelButton = showCancel;
    this.showAlertIcon = showIcon;
    this.pendingSaveAction = onConfirm || null;
    this.isAlertModalOpen = true;
  }

  /**
   * Cierra el modal de alerta
   */
  closeAlertModal(): void {
    this.isAlertModalOpen = false;
    this.alertTitle = '';
    this.alertMessage = '';
    this.showCancelButton = false;
    this.pendingSaveAction = null;
  }

  /**
   * Maneja la confirmación del modal (cuando hay turnos afectados)
   */
  onAlertConfirm(): void {
    if (this.pendingSaveAction) {
      this.pendingSaveAction();
    }
    this.closeAlertModal();
  }
}

