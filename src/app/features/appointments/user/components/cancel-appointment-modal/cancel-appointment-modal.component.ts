import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../../../../shared/molecules/modal/modal.component';
import { ButtonComponent } from '../../../../../shared/atoms/button/button.component';
import { TextareaComponent } from '../../../../../shared/atoms/textarea/textarea';
import { AppointmentResponse } from '../../models/appointment-response.model';

/**
 * Cancel Appointment Modal Component
 * 
 * Modal para cancelar un turno con motivo opcional.
 */
@Component({
  selector: 'app-cancel-appointment-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, ButtonComponent, TextareaComponent],
  templateUrl: './cancel-appointment-modal.component.html',
  styleUrl: './cancel-appointment-modal.component.css'
})
export class CancelAppointmentModalComponent {
  @Input() isOpen = false;
  @Input() appointment: AppointmentResponse | null = null;
  @Input() isLoading = false;
  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<string | undefined>();

  cancellationReason = '';

  getFormattedDate(): string {
    if (!this.appointment) return '';
    
    // Parsear fecha manualmente para evitar problemas de zona horaria
    const parts = this.appointment.date.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(year, month, day);
      
      return date.toLocaleDateString('es-AR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    return this.appointment.date;
  }

  onClose(): void {
    this.cancellationReason = '';
    this.close.emit();
  }

  onConfirm(): void {
    const reason = this.cancellationReason.trim() || undefined;
    this.confirm.emit(reason);
  }

}

