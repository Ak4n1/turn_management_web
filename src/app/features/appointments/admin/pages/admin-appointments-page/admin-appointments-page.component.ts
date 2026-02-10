import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminAppointmentService } from '../../services/admin-appointment.service';
import { AdminAppointmentResponse, AppointmentState } from '../../models/admin-appointment-response.model';
import { SpinnerComponent } from '../../../../../shared/atoms/spinner/spinner.component';
import { ErrorTextComponent } from '../../../../../shared/atoms/error-text/error-text.component';
import { ButtonComponent } from '../../../../../shared/atoms/button/button.component';
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

  // Opciones de estado para el filtro (solo los que usamos en gestión)
  readonly stateOptions: AppointmentState[] = [
    'CONFIRMED',   // Confirmado
    'CREATED',     // Pendiente (sin confirmar)
    'COMPLETED',   // Completado
    'CANCELLED',   // Cancelado
    'CANCELLED_BY_ADMIN', // Cancelado por admin
    'RESCHEDULED'  // Reprogramado
  ];

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

  /** Clase CSS para el punto de estado en el filtro (solo clases definidas en CSS) */
  getStateDotClass(state: AppointmentState): string {
    switch (state) {
      case 'CONFIRMED': return 'confirmed';
      case 'CREATED': return 'created';
      case 'CANCELLED':
      case 'CANCELLED_BY_ADMIN': return 'cancelled';
      case 'COMPLETED': return 'completed';
      case 'RESCHEDULED': return 'rescheduled';
      default: return 'cancelled';
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
      case 'RESCHEDULED':
        return 'badge-info';
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

  getUserName(appointment: AdminAppointmentResponse): string {
    if (appointment.userFirstName && appointment.userLastName) {
      return `${appointment.userFirstName} ${appointment.userLastName}`;
    }
    return appointment.userEmail;
  }

  getUserInitials(appointment: AdminAppointmentResponse): string {
    const first = (appointment.userFirstName || '').trim();
    const last = (appointment.userLastName || '').trim();
    if (first && last) {
      return (first.charAt(0) + last.charAt(0)).toUpperCase();
    }
    if (first && first.length >= 2) {
      return first.slice(0, 2).toUpperCase();
    }
    if (first) {
      return first.charAt(0).toUpperCase();
    }
    if (last && last.length >= 2) {
      return last.slice(0, 2).toUpperCase();
    }
    if (last) {
      return last.charAt(0).toUpperCase();
    }
    const email = (appointment.userEmail || '').trim();
    const part = email.split('@')[0] || '';
    if (part.length >= 2) {
      return part.slice(0, 2).toUpperCase();
    }
    return part ? part.charAt(0).toUpperCase() : '?';
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

  exportToPdf(appointment: AdminAppointmentResponse): void {
    if (appointment.state !== 'CONFIRMED') {
      alert('Solo se pueden exportar los detalles de turnos CONFIRMADOS. Este turno está en estado: ' + this.getStateLabel(appointment.state));
      return;
    }

    try {
      // @ts-ignore - Usando jsPDF cargado via CDN
      const { jsPDF } = (window as any).jspdf;
      const doc = new jsPDF();

      // Header
      doc.setFillColor(37, 99, 235); // Primary Blue
      doc.rect(0, 0, 210, 40, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.text('Comprobante de Turno', 105, 20, { align: 'center' });
      doc.setFontSize(10);
      doc.text('Sistema TurnFlow - Gestión Administrativa', 105, 30, { align: 'center' });

      // Body
      doc.setTextColor(15, 23, 42); // Title Text
      doc.setFontSize(16);
      doc.text('Detalles del Cliente', 20, 55);

      doc.setDrawColor(226, 232, 240);
      doc.line(20, 58, 190, 58);

      doc.setFontSize(12);
      doc.text(`Nombre: ${this.getUserName(appointment)}`, 20, 70);
      doc.text(`Email: ${appointment.userEmail}`, 20, 80);

      doc.setFontSize(16);
      doc.text('Detalles de la Cita', 20, 100);
      doc.line(20, 103, 190, 103);

      doc.setFontSize(12);
      doc.text(`Servicio: Consulta de Control`, 20, 115);
      doc.text(`Fecha: ${this.formatDate(appointment.date)}`, 20, 125);
      doc.text(`Horario: ${appointment.startTime} - ${appointment.endTime}`, 20, 135);
      doc.text(`Estado: CONFIRMADO`, 20, 145);

      // Footer
      doc.setDrawColor(37, 99, 235);
      doc.setLineWidth(1);
      doc.line(20, 270, 190, 270);

      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text('Este documento es un comprobante oficial generado por TurnFlow.', 105, 280, { align: 'center' });
      doc.text(`Generado el: ${new Date().toLocaleString()}`, 105, 285, { align: 'center' });

      doc.save(`Turno_${appointment.id}_${appointment.userLastName || 'Comprobante'}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error al generar el PDF. Asegúrese de que jsPDF se haya cargado correctamente.');
    }
  }
}

