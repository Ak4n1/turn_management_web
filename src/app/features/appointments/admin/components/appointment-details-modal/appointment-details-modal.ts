import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../../../../../shared/molecules/modal/modal.component';
import { AdminAppointmentResponse } from '../../models/admin-appointment-response.model';

@Component({
  selector: 'app-appointment-details-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  templateUrl: './appointment-details-modal.html',
  styleUrl: './appointment-details-modal.css'
})
export class AppointmentDetailsModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() appointment: AdminAppointmentResponse | null = null;
  @Output() close = new EventEmitter<void>();

  ngOnInit(): void {
    // Historial removido - no se carga
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Historial removido - no se carga
  }

  onClose(): void {
    this.close.emit();
  }

  getUserName(): string {
    if (!this.appointment) return '';
    if (this.appointment.userFirstName && this.appointment.userLastName) {
      return `${this.appointment.userFirstName} ${this.appointment.userLastName}`;
    }
    return this.appointment.userEmail;
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
}
