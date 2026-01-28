import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AppointmentService, MyAppointmentsResponse } from '../../services/appointment.service';
import { AppointmentResponse, AppointmentState } from '../../models/appointment-response.model';
import { SpinnerComponent } from '../../../../../shared/atoms/spinner/spinner.component';
import { ErrorTextComponent } from '../../../../../shared/atoms/error-text/error-text.component';
import { ButtonComponent } from '../../../../../shared/atoms/button/button.component';
import { DateInputComponent } from '../../../../../shared/atoms/date-input/date-input.component';
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
  imports: [CommonModule, RouterModule, FormsModule, SpinnerComponent, ErrorTextComponent, ButtonComponent, DateInputComponent, LabelComponent, CancelAppointmentModalComponent, RescheduleAppointmentModalComponent, AppointmentDetailsModalComponent],
  templateUrl: './my-appointments-page.component.html',
  styleUrl: './my-appointments-page.component.css'
})
export class MyAppointmentsPageComponent implements OnInit {
  private appointmentService = inject(AppointmentService);
  private router = inject(Router);

  appointments: AppointmentResponse[] = [];
  filteredAppointments: AppointmentResponse[] = [];
  // Cache para valores formateados (evita recalcular en cada change detection)
  private formattedDatesCache = new Map<string, string>();
  private formattedTimesCache = new Map<string, string>();
  activeFilter: 'ALL' | 'CONFIRMED' | 'PENDING' | 'CANCELLED' = 'ALL';
  dateFrom: string = '';
  dateTo: string = '';
  selectedDaysOfWeek: Set<number> = new Set(); // 1=Lunes, 2=Martes, ..., 7=Domingo
  isLoading = false;
  error: string | null = null;

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
      page: 0,
      size: 20
    };

    if (this.activeFilter === 'CONFIRMED') {
      params.status = 'CONFIRMED';
    } else if (this.activeFilter === 'PENDING') {
      // PENDING incluye CREATED
      params.status = 'CREATED';
    } else if (this.activeFilter === 'CANCELLED') {
      params.status = 'CANCELLED';
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

    this.appointmentService.getMyAppointments(params).subscribe({
      next: (response: MyAppointmentsResponse) => {
        this.appointments = response.appointments;
        // Pre-calcular valores formateados para evitar ejecuciones múltiples en el template
        this.precomputeFormattedValues(response.appointments);
        this.filteredAppointments = response.appointments;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar los turnos';
        this.isLoading = false;
        console.error('Error loading appointments:', err);
      }
    });
  }

  setFilter(filter: 'ALL' | 'CONFIRMED' | 'PENDING' | 'CANCELLED'): void {
    this.activeFilter = filter;
    this.loadAppointments();
  }

  onDateFilterChange(): void {
    this.loadAppointments();
  }

  clearFilters(): void {
    this.activeFilter = 'ALL';
    this.dateFrom = '';
    this.dateTo = '';
    this.selectedDaysOfWeek.clear();
    this.loadAppointments();
  }

  toggleDayOfWeek(dayOfWeek: number): void {
    if (this.selectedDaysOfWeek.has(dayOfWeek)) {
      this.selectedDaysOfWeek.delete(dayOfWeek);
    } else {
      this.selectedDaysOfWeek.add(dayOfWeek);
    }
    this.loadAppointments();
  }

  clearDaysOfWeek(): void {
    this.selectedDaysOfWeek.clear();
    this.loadAppointments();
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
      case 'COMPLETED':
        return 'badge-info';
      case 'EXPIRED':
      case 'NO_SHOW':
        return 'badge-error';
      default:
        return 'badge-secondary';
    }
  }

  getStateLabel(state: AppointmentState): string {
    switch (state) {
      case 'CONFIRMED':
        return 'Confirmado';
      case 'CREATED':
        return 'Pendiente';
      case 'CANCELLED':
        return 'Cancelado';
      case 'CANCELLED_BY_ADMIN':
        return 'Cancelado por admin';
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
        // Actualizar el turno en la lista
        const index = this.appointments.findIndex(a => a.id === id);
        if (index !== -1) {
          this.appointments[index] = response;
          // Actualizar cache de valores formateados para el turno actualizado
          this.updateFormattedValueForAppointment(response);
          this.filteredAppointments = [...this.appointments];
        }
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
        // Actualizar el turno en la lista
        const index = this.appointments.findIndex(a => a.id === appointmentId);
        if (index !== -1) {
          this.appointments[index] = response;
          // Actualizar cache de valores formateados para el turno actualizado
          this.updateFormattedValueForAppointment(response);
          this.filteredAppointments = [...this.appointments];
        }
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

