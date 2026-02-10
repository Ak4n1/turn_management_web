import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ExceptionService } from '../../services/exception.service';
import { AdminCalendarService } from '../../services/admin-calendar.service';
import { AdminAppointmentService } from '../../../../appointments/admin/services/admin-appointment.service';
import { CalendarExceptionResponse, CalendarExceptionRequest } from '../../models/exception-response.model';
import { PreviewImpactResponse, AffectedAppointmentInfo } from '../../models/preview-impact.model';
import { AdminAppointmentResponse } from '../../../../appointments/admin/models/admin-appointment-response.model';
import { SpinnerComponent } from '../../../../../shared/atoms/spinner/spinner.component';
import { ErrorTextComponent } from '../../../../../shared/atoms/error-text/error-text.component';
import { ButtonComponent } from '../../../../../shared/atoms/button/button.component';
import { DateInputComponent } from '../../../../../shared/atoms/date-input/date-input.component';
import { LabelComponent } from '../../../../../shared/atoms/label/label.component';
import { TextareaComponent } from '../../../../../shared/atoms/textarea/textarea';
import { AlertModalComponent } from '../../../../../shared/molecules/alert-modal/alert-modal.component';

/**
 * Exceptions Page Component (Admin)
 * 
 * Página para gestionar excepciones del calendario.
 * 
 * ✅ Usa ExceptionService (servicio real con datos del backend)
 */
@Component({
  selector: 'app-exceptions-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SpinnerComponent,
    ErrorTextComponent,
    ButtonComponent,
    DateInputComponent,
    LabelComponent,
    TextareaComponent,
    AlertModalComponent
  ],
  templateUrl: './exceptions-page.component.html',
  styleUrl: './exceptions-page.component.css'
})
export class ExceptionsPageComponent implements OnInit {
  private exceptionService = inject(ExceptionService);
  private adminCalendarService = inject(AdminCalendarService);
  private appointmentService = inject(AdminAppointmentService);

  exceptions: CalendarExceptionResponse[] = [];
  isLoading = false;
  error: string | null = null;
  successMessage: string | null = null;
  showForm = false;
  showInfo = false;
  /** ID de la excepción en edición (null = crear nueva) */
  editingExceptionId: number | null = null;
  /** Excepción pendiente de confirmar eliminación */
  exceptionToDelete: CalendarExceptionResponse | null = null;
  /** Filtros para la lista (modal) */
  showFilterModal = false;
  filterDateFrom = '';
  filterDateTo = '';
  filterIsOpen: boolean | null = null;

  // Estado para preview y step de turnos afectados
  affectedImpact: PreviewImpactResponse | null = null;
  appointmentsWithUsers: Map<number, AdminAppointmentResponse> = new Map();

  // Sistema de steps: 'form' | 'affected-appointments'
  currentStep: 'form' | 'affected-appointments' = 'form';

  // Valores para cancelación automática (siempre true para excepciones)
  autoCancelAffectedAppointments: boolean = true;
  cancellationReason: string = 'Día cerrado según excepción de calendario';

  // Request pendiente que se enviará después de la confirmación del step
  pendingExceptionRequest: CalendarExceptionRequest | null = null;

  // Paginación para turnos afectados
  affectedAppointmentsCurrentPage = 0;
  affectedAppointmentsItemsPerPage = 5;
  affectedAppointmentsTotalPages = 0;
  affectedAppointmentsPaginated: AffectedAppointmentInfo[] = [];

  // Formulario
  formDate: string = '';
  formIsOpen: boolean = true;
  formTimeRanges: Array<{ start: string; end: string }> = [{ start: '09:00', end: '12:00' }];
  formReason: string = '';

  ngOnInit(): void {
    this.loadExceptions();
  }

  /**
   * Carga las excepciones desde el backend
   */
  private loadExceptions(): void {
    this.isLoading = true;
    this.error = null;

    this.exceptionService.getAllActiveExceptions().subscribe({
      next: (exceptions) => {
        this.exceptions = exceptions;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err.message || 'Error al cargar las excepciones';
        this.isLoading = false;
        console.error('Error loading exceptions:', err);
      }
    });
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (!this.showForm) {
      this.resetForm();
      this.editingExceptionId = null;
      this.currentStep = 'form';
      this.affectedImpact = null;
      this.appointmentsWithUsers.clear();
      this.pendingExceptionRequest = null;
    }
  }

  /** Lista filtrada para mostrar en la tabla */
  getFilteredExceptions(): CalendarExceptionResponse[] {
    let list = this.exceptions;
    if (this.filterDateFrom) {
      list = list.filter(e => e.exceptionDate >= this.filterDateFrom);
    }
    if (this.filterDateTo) {
      list = list.filter(e => e.exceptionDate <= this.filterDateTo);
    }
    if (this.filterIsOpen !== null) {
      list = list.filter(e => e.isOpen === this.filterIsOpen);
    }
    return list;
  }

  openFilterModal(): void {
    this.showFilterModal = true;
  }

  closeFilterModal(): void {
    this.showFilterModal = false;
  }

  applyFilters(): void {
    this.closeFilterModal();
  }

  clearFilters(): void {
    this.filterDateFrom = '';
    this.filterDateTo = '';
    this.filterIsOpen = null;
    this.closeFilterModal();
  }

  editException(exception: CalendarExceptionResponse): void {
    this.formDate = exception.exceptionDate;
    this.formIsOpen = exception.isOpen;
    this.formTimeRanges = exception.timeRanges?.length
      ? exception.timeRanges.map(r => ({ start: r.start, end: r.end }))
      : [{ start: '09:00', end: '12:00' }];
    this.formReason = exception.reason || '';
    this.editingExceptionId = exception.id;
    this.error = null;
    this.showForm = true;
  }

  openDeleteConfirm(exception: CalendarExceptionResponse): void {
    this.exceptionToDelete = exception;
  }

  closeDeleteConfirm(): void {
    this.exceptionToDelete = null;
  }

  confirmDelete(): void {
    if (!this.exceptionToDelete) return;
    const id = this.exceptionToDelete.id;
    this.closeDeleteConfirm();
    this.isLoading = true;
    this.error = null;
    this.exceptionService.deleteException(id).subscribe({
      next: () => {
        this.loadExceptions();
        this.successMessage = 'Excepción eliminada correctamente';
        this.isLoading = false;
        setTimeout(() => this.successMessage = null, 3000);
      },
      error: (err) => {
        this.error = err.message || 'Error al eliminar la excepción';
        this.isLoading = false;
      }
    });
  }

  toggleInfo(): void {
    this.showInfo = !this.showInfo;
  }

  resetForm(): void {
    this.formDate = '';
    this.formIsOpen = true;
    this.formTimeRanges = [{ start: '09:00', end: '12:00' }];
    this.formReason = '';
  }

  addTimeRange(): void {
    this.formTimeRanges.push({ start: '09:00', end: '12:00' });
  }

  removeTimeRange(index: number): void {
    this.formTimeRanges.splice(index, 1);
    // Limpiar error si estaba relacionado con este rango
    if (this.error && this.error.includes(`rango horario ${index + 1}`)) {
      this.error = null;
    }
  }

  /**
   * Valida un rango horario y retorna mensaje de error si es inválido
   */
  validateTimeRange(start: string, end: string): string | null {
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
    if (!this.formIsOpen || this.formTimeRanges.length === 0) {
      return true;
    }

    for (let i = 0; i < this.formTimeRanges.length; i++) {
      const range = this.formTimeRanges[i];
      const error = this.validateTimeRange(range.start, range.end);
      if (error) {
        this.error = `Rango horario ${i + 1}: ${error}`;
        return false;
      }
    }

    return true;
  }

  submitForm(): void {
    if (!this.formDate || !this.formReason || this.formReason.length < 10) {
      this.error = 'Por favor completa todos los campos. El motivo debe tener al menos 10 caracteres.';
      return;
    }

    if (this.formIsOpen && this.formTimeRanges.length === 0) {
      this.error = 'Si el día está abierto, debe tener al menos un rango horario.';
      return;
    }

    // Validar rangos horarios: inicio debe ser anterior al fin
    if (this.formIsOpen && this.formTimeRanges.length > 0) {
      for (let i = 0; i < this.formTimeRanges.length; i++) {
        const range = this.formTimeRanges[i];
        if (range.start && range.end) {
          const [startHours, startMinutes] = range.start.split(':').map(Number);
          const [endHours, endMinutes] = range.end.split(':').map(Number);
          const startTime = startHours * 60 + startMinutes;
          const endTime = endHours * 60 + endMinutes;

          if (startTime >= endTime) {
            this.error = `El rango horario ${i + 1} no es válido: el horario de inicio (${range.start}) debe ser anterior al horario de fin (${range.end}).`;
            return;
          }
        }
      }
    }

    this.isLoading = true;
    this.error = null;
    this.successMessage = null;

    const request: CalendarExceptionRequest = {
      date: this.formDate,
      isOpen: this.formIsOpen,
      timeRanges: this.formIsOpen ? this.formTimeRanges : [],
      reason: this.formReason
    };

    // Edición: actualizar directamente sin preview
    if (this.editingExceptionId != null) {
      this.exceptionService.updateException(this.editingExceptionId, request).subscribe({
        next: () => {
          this.loadExceptions();
          this.successMessage = 'Excepción actualizada correctamente';
          this.isLoading = false;
          this.showForm = false;
          this.editingExceptionId = null;
          this.resetForm();
          setTimeout(() => this.successMessage = null, 3000);
        },
        error: (err) => {
          this.error = err.message || 'Error al actualizar la excepción';
          this.isLoading = false;
        }
      });
      return;
    }

    // Crear: guardar request pendiente y previsualizar impacto
    this.pendingExceptionRequest = request;
    this.previewExceptionImpact(request);
  }

  /**
   * Previsualiza el impacto de la excepción propuesta
   */
  private previewExceptionImpact(request: CalendarExceptionRequest): void {
    // Calcular rango de fechas (próximos 90 días)
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 90);

    const startDateStr = this.formatDateForApi(today);
    const endDateStr = this.formatDateForApi(endDate);

    const previewRequest = {
      changeType: 'EXCEPTION' as const,
      startDate: startDateStr,
      endDate: endDateStr,
      exception: request
    };

    this.adminCalendarService.previewImpact(previewRequest).subscribe({
      next: (impact) => {
        console.log('[DEBUG] previewExceptionImpact: Respuesta completa del backend', {
          impact: impact,
          existingAppointmentsAffected: impact.existingAppointmentsAffected,
          appointmentsCount: impact.appointments?.length || 0,
          affectedDays: impact.affectedDays,
          appointments: impact.appointments
        });

        this.affectedImpact = impact;

        // Si hay turnos afectados, mostrar step
        // Verificar tanto existingAppointmentsAffected como la lista de appointments
        const hasAffectedAppointments = (impact.existingAppointmentsAffected > 0) ||
          (impact.appointments && impact.appointments.length > 0);

        if (hasAffectedAppointments && impact.appointments && impact.appointments.length > 0) {
          console.log('[DEBUG] previewExceptionImpact: Hay turnos afectados, cargando información de usuarios', {
            existingAppointmentsAffected: impact.existingAppointmentsAffected,
            appointmentsCount: impact.appointments.length,
            appointments: impact.appointments
          });
          this.loadAppointmentsWithUserInfo(impact.appointments);
        } else {
          console.log('[DEBUG] previewExceptionImpact: No hay turnos afectados, creando excepción directamente', {
            existingAppointmentsAffected: impact.existingAppointmentsAffected,
            appointmentsLength: impact.appointments?.length || 0,
            hasAppointments: !!impact.appointments
          });
          // No hay turnos afectados, crear excepción directamente
          this.isLoading = false;
          this.createException(this.pendingExceptionRequest!);
        }
      },
      error: (err) => {
        this.isLoading = false;
        // Si falla el preview, permitir crear de todas formas (puede ser que el endpoint no esté disponible)
        console.warn('Error al previsualizar impacto, continuando con creación:', err);
        this.createException(this.pendingExceptionRequest!);
      }
    });
  }

  /**
   * Carga información completa de turnos afectados incluyendo nombres de usuarios
   */
  private loadAppointmentsWithUserInfo(affectedAppointments: AffectedAppointmentInfo[]): void {
    if (!affectedAppointments || affectedAppointments.length === 0) {
      // Si no hay turnos afectados en la lista, mostrar step de todas formas
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

        // Actualizar mensaje por defecto según el tipo de excepción
        if (this.pendingExceptionRequest) {
          this.cancellationReason = this.pendingExceptionRequest.isOpen
            ? 'Los horarios del día han sido modificados según una excepción de calendario. Por favor, revisa si tu turno sigue siendo válido o fue cancelado.'
            : 'Día cerrado según excepción de calendario';
        }

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
      // Actualizar paginación
      this.updateAffectedAppointmentsPagination();

      // Cambiar al step de turnos afectados
      this.currentStep = 'affected-appointments';
      this.isLoading = false;
    } else {
      console.warn('[DEBUG] showAffectedAppointmentsStep: affectedImpact es null, no se puede mostrar step');
      this.isLoading = false;
    }
  }

  /**
   * Vuelve al step del formulario
   */
  cancelAffectedAppointmentsStep(): void {
    this.currentStep = 'form';
    this.affectedImpact = null;
    this.appointmentsWithUsers.clear();
    this.pendingExceptionRequest = null;
  }

  /**
   * Confirma y crea la excepción desde el step de turnos afectados
   */
  confirmAffectedAppointmentsStep(): void {
    // Crear excepción con las preferencias de cancelación
    if (this.pendingExceptionRequest) {
      this.isLoading = true;
      this.createException(this.pendingExceptionRequest);
    }
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
   * Crea la excepción con cancelación automática de turnos afectados
   */
  private createException(request: CalendarExceptionRequest): void {
    // Los turnos afectados siempre se cancelan automáticamente en excepciones
    const finalRequest: CalendarExceptionRequest = {
      ...request,
      autoCancelAffectedAppointments: true, // Siempre true para excepciones
      cancellationReason: this.cancellationReason?.trim() ||
        (request.isOpen
          ? 'Cambio de horarios según excepción de calendario'
          : 'Día cerrado según excepción de calendario')
    };

    this.exceptionService.createException(finalRequest).subscribe({
      next: (exception) => {
        // Recargar todas las excepciones desde el backend
        this.loadExceptions();
        this.successMessage = 'Excepción creada exitosamente';
        this.isLoading = false;
        this.showForm = false;
        this.resetForm();
        this.pendingExceptionRequest = null;
        this.affectedImpact = null;
        this.appointmentsWithUsers.clear();
        // Volver al step del formulario si estábamos en el step de turnos afectados
        this.currentStep = 'form';
        setTimeout(() => this.successMessage = null, 3000);
      },
      error: (err) => {
        this.error = err.message || 'Error al crear la excepción';
        this.isLoading = false;
        console.error('Error creating exception:', err);
      }
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

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /** Parsea YYYY-MM-DD como fecha local (evita desfase de un día por UTC). */
  private parseLocalDate(dateStr: string): Date {
    const clean = (dateStr || '').split('T')[0];
    const [y, m, d] = clean.split('-').map(Number);
    if (isNaN(y) || isNaN(m) || isNaN(d)) return new Date(dateStr);
    return new Date(y, m - 1, d, 12, 0, 0);
  }

  /** Formato para lista: "30 de enero, 2026" */
  formatDateList(dateStr: string): string {
    const date = this.parseLocalDate(dateStr);
    return date.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  /** Día de la semana para la lista: "Sábado" */
  formatWeekday(dateStr: string): string {
    const date = this.parseLocalDate(dateStr);
    return date.toLocaleDateString('es-AR', { weekday: 'long' });
  }

  formatTimeRanges(ranges: Array<{ start: string; end: string }>): string {
    if (ranges.length === 0) return 'Cerrado';
    return ranges.map(r => `${r.start} - ${r.end}`).join(', ');
  }

  getTodayDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
