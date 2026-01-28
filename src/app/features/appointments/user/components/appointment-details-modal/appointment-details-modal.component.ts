import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../../../../../shared/molecules/modal/modal.component';
import { SpinnerComponent } from '../../../../../shared/atoms/spinner/spinner.component';
import { ErrorTextComponent } from '../../../../../shared/atoms/error-text/error-text.component';
import { AppointmentResponse, AppointmentHistoryResponse, AppointmentHistoryEvent } from '../../models/appointment-response.model';
import { AppointmentService } from '../../services/appointment.service';

@Component({
  selector: 'app-appointment-details-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent, SpinnerComponent, ErrorTextComponent],
  templateUrl: './appointment-details-modal.component.html',
  styleUrl: './appointment-details-modal.component.css'
})
export class AppointmentDetailsModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() appointment: AppointmentResponse | null = null;
  @Output() close = new EventEmitter<void>();

  private appointmentService = inject(AppointmentService);

  history: AppointmentHistoryEvent[] = [];
  isLoadingHistory = false;
  historyError: string | null = null;

  ngOnInit(): void {
    if (this.isOpen && this.appointment) {
      this.loadHistory();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen && this.appointment) {
      this.loadHistory();
    }
  }

  loadHistory(): void {
    if (!this.appointment) return;

    this.isLoadingHistory = true;
    this.historyError = null;

    this.appointmentService.getAppointmentHistory(this.appointment.id).subscribe({
      next: (response: AppointmentHistoryResponse) => {
        this.history = response.history || [];
        this.isLoadingHistory = false;
      },
      error: (err) => {
        this.historyError = err.userMessage || 'Error al cargar el historial';
        this.isLoadingHistory = false;
        console.error('Error loading appointment history:', err);
      }
    });
  }

  onClose(): void {
    this.history = [];
    this.historyError = null;
    this.close.emit();
  }

  formatDate(date: string): string {
    const parts = date.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const dateObj = new Date(year, month, day);
      return dateObj.toLocaleDateString('es-AR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
    return date;
  }

  formatDateTime(dateTime: string): string {
    const d = new Date(dateTime);
    return d.toLocaleString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStateLabel(state: string): string {
    const labels: { [key: string]: string } = {
      'CREATED': 'Pendiente',
      'CONFIRMED': 'Confirmado',
      'CANCELLED': 'Cancelado',
      'CANCELLED_BY_ADMIN': 'Cancelado por admin',
      'COMPLETED': 'Completado',
      'EXPIRED': 'Expirado',
      'NO_SHOW': 'No asistió',
      'RESCHEDULED': 'Reprogramado'
    };
    return labels[state] || state;
  }

  getStateBadgeClass(state: string): string {
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

  getActionLabel(action: string): string {
    const labels: { [key: string]: string } = {
      'CREATED': 'Turno creado',
      'CONFIRMED': 'Turno confirmado',
      'CANCELLED': 'Turno cancelado',
      'CANCELLED_BY_ADMIN': 'Turno cancelado por administrador',
      'COMPLETED': 'Turno completado',
      'EXPIRED': 'Turno expirado',
      'NO_SHOW': 'Cliente no asistió',
      'RESCHEDULED': 'Turno reprogramado'
    };
    return labels[action] || action;
  }

  getActionIcon(action: string): string {
    switch (action) {
      case 'CREATED':
        return 'fa-calendar-plus';
      case 'CONFIRMED':
        return 'fa-check-circle';
      case 'CANCELLED':
      case 'CANCELLED_BY_ADMIN':
        return 'fa-times-circle';
      case 'COMPLETED':
        return 'fa-check-double';
      case 'EXPIRED':
        return 'fa-clock';
      case 'NO_SHOW':
        return 'fa-user-slash';
      case 'RESCHEDULED':
        return 'fa-exchange-alt';
      default:
        return 'fa-info-circle';
    }
  }

  getHistoryEntryClass(entry: AppointmentHistoryEvent): string {
    if (entry.newState === 'CREATED') return 'history-entry-pending';
    if (entry.newState === 'CONFIRMED') return 'history-entry-confirmed';
    if (entry.newState === 'CANCELLED' || entry.newState === 'CANCELLED_BY_ADMIN') return 'history-entry-cancelled';
    if (entry.newState === 'COMPLETED') return 'history-entry-completed';
    if (entry.newState === 'EXPIRED') return 'history-entry-expired';
    if (entry.newState === 'RESCHEDULED') return 'history-entry-rescheduled';
    return 'history-entry-default';
  }
}

