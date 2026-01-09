import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminAppointmentService } from '../../services/admin-appointment.service';
import { AdminAppointmentResponse, AppointmentState } from '../../models/admin-appointment-response.model';
import { SpinnerComponent } from '../../../../../shared/atoms/spinner/spinner.component';
import { ErrorTextComponent } from '../../../../../shared/atoms/error-text/error-text.component';
import { ButtonComponent } from '../../../../../shared/atoms/button/button.component';
import { InputComponent } from '../../../../../shared/atoms/input/input.component';
import { DateInputComponent } from '../../../../../shared/atoms/date-input/date-input.component';
import { LabelComponent } from '../../../../../shared/atoms/label/label.component';
import { AppointmentDetailsModalComponent } from '../../components/appointment-details-modal/appointment-details-modal';
import { RescheduleModalComponent } from '../../components/reschedule-modal/reschedule-modal';
import { CancelModalComponent } from '../../components/cancel-modal/cancel-modal';

/**
 * Admin Appointments Page Component
 * 
 * Página de gestión de turnos para administradores.
 * Muestra todos los turnos con filtros avanzados.
 * 
 * ✅ Usa AdminAppointmentService (servicio real con datos del backend)
 */
@Component({
  selector: 'app-admin-appointments-page',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    FormsModule, 
    SpinnerComponent, 
    ErrorTextComponent,
    ButtonComponent,
    InputComponent,
    DateInputComponent,
    LabelComponent,
    AppointmentDetailsModalComponent,
    RescheduleModalComponent,
    CancelModalComponent
  ],
  templateUrl: './admin-appointments-page.component.html',
  styleUrl: './admin-appointments-page.component.css'
})
export class AdminAppointmentsPageComponent implements OnInit {
  private appointmentService = inject(AdminAppointmentService);

  appointments: AdminAppointmentResponse[] = [];
  isLoading = false;
  error: string | null = null;
  
  // Filtros
  activeFilter: 'ALL' | AppointmentState = 'ALL';
  searchTerm: string = '';
  dateFrom: string = '';
  dateTo: string = '';
  selectedDaysOfWeek: Set<number> = new Set(); // 1=Lunes, 2=Martes, ..., 7=Domingo
  
  // Paginación
  currentPage = 0;
  pageSize = 20;
  totalElements = 0;
  totalPages = 0;

  // Modales
  selectedAppointment: AdminAppointmentResponse | null = null;
  isDetailsModalOpen = false;
  isRescheduleModalOpen = false;
  isCancelModalOpen = false;

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

    if (this.activeFilter !== 'ALL') {
      params.state = this.activeFilter;
    }

    if (this.searchTerm.trim()) {
      params.search = this.searchTerm.trim();
    }

    if (this.dateFrom) {
      params.dateFrom = this.dateFrom;
    }

    if (this.dateTo) {
      params.dateTo = this.dateTo;
    }

    // Agregar filtro de días de la semana si hay alguno seleccionado
    if (this.selectedDaysOfWeek.size > 0) {
      params.daysOfWeek = Array.from(this.selectedDaysOfWeek);
      console.log('DEBUG Angular - selectedDaysOfWeek:', Array.from(this.selectedDaysOfWeek));
      console.log('DEBUG Angular - params.daysOfWeek:', params.daysOfWeek);
    }

    console.log('DEBUG Angular - Parámetros completos enviados:', params);

    this.appointmentService.getAppointments(params).subscribe({
      next: (response) => {
        console.log('DEBUG Angular - Respuesta recibida:', response);
        console.log('DEBUG Angular - Turnos encontrados:', response.content.length);
        console.log('DEBUG Angular - Fechas de turnos:', response.content.map(a => ({ date: a.date, dayName: new Date(a.date).toLocaleDateString('es-AR', { weekday: 'long' }) })));
        this.appointments = response.content;
        this.totalElements = response.totalElements;
        this.totalPages = response.totalPages;
        this.currentPage = response.page;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err.message || 'Error al cargar los turnos';
        this.isLoading = false;
        console.error('Error loading appointments:', err);
      }
    });
  }

  setFilter(filter: 'ALL' | AppointmentState): void {
    this.activeFilter = filter;
    this.currentPage = 0;
    this.loadAppointments();
  }

  onSearch(): void {
    this.currentPage = 0;
    this.loadAppointments();
  }

  onDateFilterChange(): void {
    this.currentPage = 0;
    this.loadAppointments();
  }

  clearFilters(): void {
    this.activeFilter = 'ALL';
    this.searchTerm = '';
    this.dateFrom = '';
    this.dateTo = '';
    this.selectedDaysOfWeek.clear();
    this.currentPage = 0;
    this.loadAppointments();
  }

  toggleDayOfWeek(dayOfWeek: number): void {
    console.log('DEBUG Angular - toggleDayOfWeek llamado con:', dayOfWeek, 'Nombre:', this.getDayName(dayOfWeek));
    if (this.selectedDaysOfWeek.has(dayOfWeek)) {
      this.selectedDaysOfWeek.delete(dayOfWeek);
      console.log('DEBUG Angular - Día removido. selectedDaysOfWeek ahora:', Array.from(this.selectedDaysOfWeek));
    } else {
      this.selectedDaysOfWeek.add(dayOfWeek);
      console.log('DEBUG Angular - Día agregado. selectedDaysOfWeek ahora:', Array.from(this.selectedDaysOfWeek));
    }
    this.currentPage = 0;
    this.loadAppointments();
  }

  clearDaysOfWeek(): void {
    this.selectedDaysOfWeek.clear();
    this.currentPage = 0;
    this.loadAppointments();
  }

  isDayOfWeekSelected(dayOfWeek: number): boolean {
    return this.selectedDaysOfWeek.has(dayOfWeek);
  }

  getDayName(dayOfWeek: number): string {
    const days = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    return days[dayOfWeek] || '';
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadAppointments();
    }
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

  formatDate(date: string): string {
    const d = new Date(date);
    return d.toLocaleDateString('es-AR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  getUserName(appointment: AdminAppointmentResponse): string {
    if (appointment.userFirstName && appointment.userLastName) {
      return `${appointment.userFirstName} ${appointment.userLastName}`;
    }
    return appointment.userEmail;
  }

  viewDetails(id: number): void {
    const appointment = this.appointments.find(a => a.id === id);
    if (appointment) {
      this.selectedAppointment = appointment;
      this.isDetailsModalOpen = true;
    }
  }

  rescheduleAppointment(id: number): void {
    const appointment = this.appointments.find(a => a.id === id);
    if (appointment) {
      this.selectedAppointment = appointment;
      this.isRescheduleModalOpen = true;
    }
  }

  cancelAppointment(id: number): void {
    const appointment = this.appointments.find(a => a.id === id);
    if (appointment) {
      this.selectedAppointment = appointment;
      this.isCancelModalOpen = true;
    }
  }

  onDetailsModalClose(): void {
    this.isDetailsModalOpen = false;
    this.selectedAppointment = null;
  }

  onRescheduleModalClose(): void {
    this.isRescheduleModalOpen = false;
    this.selectedAppointment = null;
  }

  onRescheduled(appointment: AdminAppointmentResponse): void {
    // Actualizar el turno en la lista
    const index = this.appointments.findIndex(a => a.id === appointment.previousAppointmentId);
    if (index !== -1) {
      // El turno original ahora está RESCHEDULED, pero no lo actualizamos aquí
      // porque el backend devuelve el nuevo turno
      // Recargar la lista para ver los cambios
      this.loadAppointments();
    }
    this.onRescheduleModalClose();
  }

  onCancelModalClose(): void {
    this.isCancelModalOpen = false;
    this.selectedAppointment = null;
  }

  onCancelled(appointment: AdminAppointmentResponse): void {
    // Actualizar el turno en la lista
    const index = this.appointments.findIndex(a => a.id === appointment.id);
    if (index !== -1) {
      this.appointments[index] = appointment;
    }
    // Recargar la lista para asegurar consistencia
    this.loadAppointments();
    this.onCancelModalClose();
  }
}

