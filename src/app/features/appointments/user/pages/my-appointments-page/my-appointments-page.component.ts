import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AppointmentService, MyAppointmentsResponse } from '../../services/appointment.service';
import { AppointmentResponse, AppointmentState } from '../../models/appointment-response.model';
import { SpinnerComponent } from '../../../../../shared/atoms/spinner/spinner.component';
import { ErrorTextComponent } from '../../../../../shared/atoms/error-text/error-text.component';
import { ButtonComponent } from '../../../../../shared/atoms/button/button.component';
import { LabelComponent } from '../../../../../shared/atoms/label/label.component';
import { CancelAppointmentModalComponent } from '../../components/cancel-appointment-modal/cancel-appointment-modal.component';
import { RescheduleAppointmentModalComponent } from '../../components/reschedule-appointment-modal/reschedule-appointment-modal.component';
import { AppointmentDetailsModalComponent } from '../../components/appointment-details-modal/appointment-details-modal.component';

/**
 * My Appointments Page Component (User)
 * 
 * Página de lista de turnos del usuario con filtros.
 * 
 * US-F015: Integrado con GET /api/appointments/my-appointments del backend real
 */
@Component({
  selector: 'app-my-appointments-page',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SpinnerComponent, ErrorTextComponent, ButtonComponent, LabelComponent, CancelAppointmentModalComponent, RescheduleAppointmentModalComponent, AppointmentDetailsModalComponent],
  templateUrl: './my-appointments-page.component.html',
  styleUrl: './my-appointments-page.component.css'
})
export class MyAppointmentsPageComponent implements OnInit {
  private appointmentService = inject(AppointmentService);
  private router = inject(Router);

  appointments: AppointmentResponse[] = [];
  // Cache para valores formateados (evita recalcular en cada change detection)
  private formattedDatesCache = new Map<string, string>();
  private formattedTimesCache = new Map<string, string>();
  activeFilter: 'ALL' | 'CONFIRMED' | 'PENDING' | 'CANCELLED' | 'RESCHEDULED' = 'ALL';
  sortOrder: 'asc' | 'desc' = 'asc';
  dateFrom: string = '';
  dateTo: string = '';
  /** Fecha única para "Ver un día"; al elegir o Hoy se usa como dateFrom y dateTo. */
  singleDate: string = '';
  selectedDaysOfWeek: Set<number> = new Set(); // 1=Lunes, 2=Martes, ..., 7=Domingo
  isLoading = false;
  error: string | null = null;

  // Paginación
  currentPage = 0;
  pageSize = 20;
  totalElements = 0;
  totalPages = 0;

  // Opciones de estado (Cancelados = usuario + admin unificados; Reprogramado = turno anterior)
  readonly stateOptions: ('CONFIRMED' | 'PENDING' | 'CANCELLED' | 'RESCHEDULED')[] =
    ['CONFIRMED', 'PENDING', 'CANCELLED', 'RESCHEDULED'];

  // Modal de cancelación
  isCancelModalOpen = false;
  appointmentToCancel: AppointmentResponse | null = null;
  isCancelling = false;

  // Modal de reprogramación
  isRescheduleModalOpen = false;
  appointmentToReschedule: AppointmentResponse | null = null;
  isRequestingReschedule = false;

  isDetailsModalOpen = false;
  selectedAppointment: AppointmentResponse | null = null;

  ngOnInit(): void {
    this.loadAppointments();
  }

  private loadAppointments(): void {
    this.isLoading = true;
    this.error = null;

    const params: any = {
      page: this.currentPage,
      size: this.pageSize
    };

    if (this.activeFilter === 'CONFIRMED') {
      params.status = 'CONFIRMED';
    } else if (this.activeFilter === 'PENDING') {
      params.status = 'CREATED';
    } else if (this.activeFilter === 'CANCELLED') {
      params.status = 'CANCELLED';
    } else if (this.activeFilter === 'RESCHEDULED') {
      params.status = 'RESCHEDULED';
    }

    if (this.dateFrom) {
      params.fromDate = this.dateFrom;
    }

    if (this.dateTo) {
      params.toDate = this.dateTo;
    }

    // Agregar filtro de días de la semana si hay alguno seleccionado
    if (this.selectedDaysOfWeek.size > 0) {
      params.daysOfWeek = Array.from(this.selectedDaysOfWeek).join(',');
    }

    params.sortOrder = this.sortOrder;

    this.appointmentService.getMyAppointments(params).subscribe({
      next: (response: MyAppointmentsResponse) => {
        this.appointments = response.appointments;
        // Pre-calcular valores formateados para evitar ejecuciones múltiples en el template
        this.precomputeFormattedValues(response.appointments);
        this.totalElements = response.total;
        this.totalPages = response.totalPages;
        this.currentPage = response.page;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar los turnos';
        this.isLoading = false;
        console.error('Error loading appointments:', err);
      }
    });
  }

  setFilter(filter: 'ALL' | 'CONFIRMED' | 'PENDING' | 'CANCELLED' | 'RESCHEDULED'): void {
    this.activeFilter = filter;
    this.currentPage = 0;
    this.loadAppointments();
  }

  onDateFilterChange(): void {
    this.currentPage = 0;
    this.loadAppointments();
  }

  /** Buscar por un día concreto; actualiza rango y recarga. */
  onSingleDateChange(value: string): void {
    this.singleDate = value || '';
    if (this.singleDate) {
      this.dateFrom = this.singleDate;
      this.dateTo = this.singleDate;
      this.currentPage = 0;
      this.loadAppointments();
    }
  }

  /** Filtra por el día actual y recarga. */
  setTodayAndLoad(): void {
    this.singleDate = this.getTodayIso();
    this.dateFrom = this.singleDate;
    this.dateTo = this.singleDate;
    this.currentPage = 0;
    this.loadAppointments();
  }

  private getTodayIso(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  setSortOrder(order: 'asc' | 'desc'): void {
    this.sortOrder = order;
    this.currentPage = 0;
    this.loadAppointments();
  }

  clearFilters(): void {
    this.activeFilter = 'ALL';
    this.sortOrder = 'asc';
    this.dateFrom = '';
    this.dateTo = '';
    this.singleDate = '';
    this.selectedDaysOfWeek.clear();
    this.currentPage = 0;
    this.loadAppointments();
  }

  toggleDayOfWeek(dayOfWeek: number): void {
    if (this.selectedDaysOfWeek.has(dayOfWeek)) {
      this.selectedDaysOfWeek.delete(dayOfWeek);
    } else {
      this.selectedDaysOfWeek.add(dayOfWeek);
    }
    this.currentPage = 0;
    this.loadAppointments();
  }

  clearDaysOfWeek(): void {
    this.selectedDaysOfWeek.clear();
    this.currentPage = 0;
    this.loadAppointments();
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadAppointments();
    }
  }

  isDayOfWeekSelected(dayOfWeek: number): boolean {
    return this.selectedDaysOfWeek.has(dayOfWeek);
  }

  getDayName(dayOfWeek: number): string {
    const days = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    return days[dayOfWeek] || '';
  }

  getStateBadgeClass(state: AppointmentState): string {
    switch (state) {
      case 'CONFIRMED':
        return 'badge-success';
      case 'CREATED':
        return 'badge-warning';
      case 'CANCELLED':
      case 'CANCELLED_BY_ADMIN':
        return 'badge-secondary';
      case 'RESCHEDULED':
        return 'badge-info';
      case 'COMPLETED':
        return 'badge-info';
      case 'EXPIRED':
      case 'NO_SHOW':
        return 'badge-error';
      default:
        return 'badge-secondary';
    }
  }

  getStateLabel(state: AppointmentState | 'PENDING'): string {
    switch (state) {
      case 'CONFIRMED':
        return 'Confirmado';
      case 'CREATED':
      case 'PENDING':
        return 'Pendiente';
      case 'CANCELLED':
      case 'CANCELLED_BY_ADMIN':
        return 'Cancelado';
      case 'COMPLETED':
        return 'Completado';
      case 'EXPIRED':
        return 'Expirado';
      case 'NO_SHOW':
        return 'No asistió';
      case 'RESCHEDULED':
        return 'Reprogramado';
      default:
        return state;
    }
  }

  getStateDotClass(state: 'CONFIRMED' | 'PENDING' | 'CANCELLED' | 'RESCHEDULED'): string {
    switch (state) {
      case 'CONFIRMED':
        return 'confirmed';
      case 'PENDING':
        return 'pending';
      case 'CANCELLED':
        return 'cancelled';
      case 'RESCHEDULED':
        return 'rescheduled';
      default:
        return '';
    }
  }

  /** True si la fecha (y hora) del turno ya pasó respecto a hoy. */
  isPastDate(appointment: AppointmentResponse): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const parts = appointment.date.split('-');
    if (parts.length !== 3) return false;
    const appDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    appDate.setHours(0, 0, 0, 0);
    if (appDate.getTime() < today.getTime()) return true;
    if (appDate.getTime() > today.getTime()) return false;
    // Mismo día: comparar hora
    const [h = 0, m = 0] = (appointment.startTime || '00:00').split(':').map(Number);
    const appDateTime = new Date(appDate);
    appDateTime.setHours(h, m, 0, 0);
    return appDateTime.getTime() <= Date.now();
  }

  private precomputeFormattedValues(appointments: AppointmentResponse[]): void {
    // Limpiar cache anterior
    this.formattedDatesCache.clear();
    this.formattedTimesCache.clear();
    
    // Pre-calcular todas las fechas y horas formateadas una sola vez
    appointments.forEach(appointment => {
      if (!this.formattedDatesCache.has(appointment.date)) {
        this.formattedDatesCache.set(appointment.date, this.computeFormattedDate(appointment.date));
      }
      if (appointment.expiresAt && !this.formattedTimesCache.has(appointment.expiresAt)) {
        this.formattedTimesCache.set(appointment.expiresAt, this.computeFormattedTime(appointment.expiresAt));
      }
    });
  }

  formatDate(date: string): string {
    // Usar cache para evitar recalcular
    if (this.formattedDatesCache.has(date)) {
      return this.formattedDatesCache.get(date)!;
    }
    // Si no está en cache, calcular y guardar
    const formatted = this.computeFormattedDate(date);
    this.formattedDatesCache.set(date, formatted);
    return formatted;
  }

  private computeFormattedDate(date: string): string {
    // Parsear fecha manualmente para evitar problemas de zona horaria
    // Formato esperado: YYYY-MM-DD
    const parts = date.split('-');
    if (parts.length !== 3) {
      // Fallback si el formato no es el esperado
      const d = new Date(date);
      return d.toLocaleDateString('es-AR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
    
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Los meses en JS son 0-indexed
    const day = parseInt(parts[2], 10);
    
    const d = new Date(year, month, day);
    return d.toLocaleDateString('es-AR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  formatExpiresAt(expiresAt: string): string {
    // Usar cache para evitar recalcular
    if (this.formattedTimesCache.has(expiresAt)) {
      return this.formattedTimesCache.get(expiresAt)!;
    }
    // Si no está en cache, calcular y guardar
    const formatted = this.computeFormattedTime(expiresAt);
    this.formattedTimesCache.set(expiresAt, formatted);
    return formatted;
  }

  private computeFormattedTime(expiresAt: string): string {
    const d = new Date(expiresAt);
    return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  }

  private updateFormattedValueForAppointment(appointment: AppointmentResponse): void {
    // Actualizar cache de fecha si no existe
    if (!this.formattedDatesCache.has(appointment.date)) {
      this.formattedDatesCache.set(appointment.date, this.computeFormattedDate(appointment.date));
    }
    // Actualizar cache de hora de expiración si existe
    if (appointment.expiresAt && !this.formattedTimesCache.has(appointment.expiresAt)) {
      this.formattedTimesCache.set(appointment.expiresAt, this.computeFormattedTime(appointment.expiresAt));
    }
  }

  confirmAppointment(id: number): void {
    const appointment = this.appointments.find(a => a.id === id);
    if (!appointment || appointment.state !== 'CREATED') {
      return;
    }

    this.appointmentService.confirmAppointment(id).subscribe({
      next: (response) => {
        // Recargar la página actual para reflejar los cambios
        this.loadAppointments();
      },
      error: (err) => {
        this.error = err.userMessage || err.error?.message || 'Error al confirmar el turno';
        console.error('Error confirming appointment:', err);
      }
    });
  }

  cancelAppointment(id: number): void {
    const appointment = this.appointments.find(a => a.id === id);
    if (!appointment) {
      return;
    }

    this.appointmentToCancel = appointment;
    this.isCancelModalOpen = true;
  }

  onCancelModalClose(): void {
    this.isCancelModalOpen = false;
    this.appointmentToCancel = null;
    this.isCancelling = false;
  }

  onCancelModalConfirm(reason: string | undefined): void {
    if (!this.appointmentToCancel) {
      return;
    }

    this.isCancelling = true;
    const appointmentId = this.appointmentToCancel.id;

    this.appointmentService.cancelAppointment(appointmentId, reason).subscribe({
      next: (response) => {
        // Recargar la página actual para reflejar los cambios
        this.loadAppointments();
        this.onCancelModalClose();
      },
      error: (err) => {
        this.error = err.userMessage || err.error?.message || 'Error al cancelar el turno';
        this.isCancelling = false;
        console.error('Error cancelling appointment:', err);
      }
    });
  }

  requestReschedule(id: number): void {
    const appointment = this.appointments.find(a => a.id === id);
    if (!appointment) {
      return;
    }

    this.appointmentToReschedule = appointment;
    this.isRescheduleModalOpen = true;
  }

  onRescheduleModalClose(): void {
    this.isRescheduleModalOpen = false;
    this.appointmentToReschedule = null;
    this.isRequestingReschedule = false;
  }

  onRescheduleRequested(): void {
    // Recargar lista de turnos
    this.loadAppointments();
    this.onRescheduleModalClose();
  }

  viewDetails(id: number): void {
    const appointment = this.appointments.find(a => a.id === id);
    if (appointment) {
      this.selectedAppointment = appointment;
      this.isDetailsModalOpen = true;
    }
  }

  onDetailsModalClose(): void {
    this.isDetailsModalOpen = false;
    this.selectedAppointment = null;
  }
}

