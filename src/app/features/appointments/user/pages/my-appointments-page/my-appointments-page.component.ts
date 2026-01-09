import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MockAppointmentService } from '../../services/mock-appointment.service';
import { AppointmentResponse, AppointmentState } from '../../models/appointment-response.model';
import { SpinnerComponent } from '../../../../../shared/atoms/spinner/spinner.component';
import { ErrorTextComponent } from '../../../../../shared/atoms/error-text/error-text.component';

/**
 * My Appointments Page Component (User)
 * 
 * Página de lista de turnos del usuario con filtros.
 * 
 * MOCK: Usa MockAppointmentService que simula GET /api/appointments/my-appointments
 */
@Component({
  selector: 'app-my-appointments-page',
  standalone: true,
  imports: [CommonModule, RouterModule, SpinnerComponent, ErrorTextComponent],
  templateUrl: './my-appointments-page.component.html',
  styleUrl: './my-appointments-page.component.css'
})
export class MyAppointmentsPageComponent implements OnInit {
  private appointmentService = inject(MockAppointmentService);

  appointments: AppointmentResponse[] = [];
  filteredAppointments: AppointmentResponse[] = [];
  activeFilter: 'ALL' | 'CONFIRMED' | 'PENDING' | 'CANCELLED' = 'ALL';
  isLoading = false;
  error: string | null = null;

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

    this.appointmentService.getMyAppointments(params).subscribe({
      next: (response) => {
        this.appointments = response.appointments;
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

  formatExpiresAt(expiresAt: string): string {
    const d = new Date(expiresAt);
    return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  }

  confirmAppointment(id: number): void {
    console.log('Confirmar turno:', id);
    // TODO: Implementar cuando tengamos el servicio real
  }

  cancelAppointment(id: number): void {
    console.log('Cancelar turno:', id);
    // TODO: Implementar cuando tengamos el servicio real
  }

  requestReschedule(id: number): void {
    console.log('Solicitar reprogramación:', id);
    // TODO: Implementar cuando tengamos el servicio real
  }
}

