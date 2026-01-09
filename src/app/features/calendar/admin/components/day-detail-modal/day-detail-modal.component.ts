import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../../../../../shared/molecules/modal/modal.component';
import { AdminAppointmentService } from '../../../../appointments/admin/services/admin-appointment.service';
import { AdminAppointmentResponse } from '../../../../appointments/admin/models/admin-appointment-response.model';
import { SpinnerComponent } from '../../../../../shared/atoms/spinner/spinner.component';
import { ErrorTextComponent } from '../../../../../shared/atoms/error-text/error-text.component';

export interface DayDetailData {
  date: string;
  state: 'OPEN' | 'CLOSED' | 'PARTIAL';
  ruleType: 'BASE' | 'EXCEPTION' | 'BLOCK';
  ruleDescription: string;
  timeRanges: Array<{ start: string; end: string }>;
  hasExistingAppointments?: boolean;
  appointmentsCount?: number;
}

@Component({
  selector: 'app-day-detail-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent, SpinnerComponent, ErrorTextComponent],
  templateUrl: './day-detail-modal.component.html',
  styleUrl: './day-detail-modal.component.css'
})
export class DayDetailModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() dayData: DayDetailData | null = null;
  @Output() close = new EventEmitter<void>();

  private appointmentService = inject(AdminAppointmentService);

  appointments: AdminAppointmentResponse[] = [];
  isLoading = false;
  error: string | null = null;

  ngOnInit(): void {
    if (this.isOpen && this.dayData) {
      this.loadAppointments();
    }
  }

  ngOnChanges(): void {
    if (this.isOpen && this.dayData) {
      this.loadAppointments();
    }
  }

  private loadAppointments(): void {
    if (!this.dayData) return;

    this.isLoading = true;
    this.error = null;

    this.appointmentService.getAppointmentsByDate(this.dayData.date).subscribe({
      next: (response) => {
        // Ordenar por hora ascendente
        this.appointments = response.content.sort((a, b) => 
          a.startTime.localeCompare(b.startTime)
        );
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar los turnos del día';
        this.isLoading = false;
        console.error('Error loading appointments:', err);
      }
    });
  }

  onClose(): void {
    this.close.emit();
  }

  getFormattedDate(): string {
    if (!this.dayData) return '';
    const date = new Date(this.dayData.date);
    return date.toLocaleDateString('es-AR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  getStateBadgeClass(): string {
    if (!this.dayData) return '';
    switch (this.dayData.state) {
      case 'OPEN':
        return 'badge-open';
      case 'PARTIAL':
        return 'badge-partial';
      case 'CLOSED':
        return 'badge-closed';
      default:
        return '';
    }
  }

  getStateLabel(): string {
    if (!this.dayData) return '';
    switch (this.dayData.state) {
      case 'OPEN':
        return 'Abierto';
      case 'PARTIAL':
        return 'Parcial';
      case 'CLOSED':
        return 'Cerrado';
      default:
        return '';
    }
  }

  getAppointmentStateBadgeClass(state: string): string {
    switch (state) {
      case 'CONFIRMED':
        return 'badge-confirmed';
      case 'CREATED':
        return 'badge-created';
      case 'CANCELLED':
        return 'badge-cancelled';
      case 'COMPLETED':
        return 'badge-completed';
      case 'NO_SHOW':
        return 'badge-no-show';
      default:
        return 'badge-default';
    }
  }

  getAppointmentStateLabel(state: string): string {
    switch (state) {
      case 'CONFIRMED':
        return 'Confirmado';
      case 'CREATED':
        return 'Creado';
      case 'CANCELLED':
        return 'Cancelado';
      case 'COMPLETED':
        return 'Completado';
      case 'NO_SHOW':
        return 'No asistió';
      case 'RESCHEDULED':
        return 'Reprogramado';
      default:
        return state;
    }
  }

  getUserFullName(appointment: AdminAppointmentResponse): string {
    const firstName = appointment.userFirstName || '';
    const lastName = appointment.userLastName || '';
    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim();
    }
    return appointment.userEmail;
  }
}

