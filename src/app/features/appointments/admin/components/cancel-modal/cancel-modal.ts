import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../../../../shared/molecules/modal/modal.component';
import { ErrorTextComponent } from '../../../../../shared/atoms/error-text/error-text.component';
import { ButtonComponent } from '../../../../../shared/atoms/button/button.component';
import { LabelComponent } from '../../../../../shared/atoms/label/label.component';
import { TextareaComponent } from '../../../../../shared/atoms/textarea/textarea';
import { AdminAppointmentResponse } from '../../models/admin-appointment-response.model';
import { CancelRequest } from '../../models/admin-appointment-requests.model';
import { AdminAppointmentService } from '../../services/admin-appointment.service';

@Component({
  selector: 'app-cancel-modal',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ModalComponent, 
    ErrorTextComponent, 
    ButtonComponent,
    LabelComponent,
    TextareaComponent
  ],
  templateUrl: './cancel-modal.html',
  styleUrl: './cancel-modal.css'
})
export class CancelModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() appointment: AdminAppointmentResponse | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<AdminAppointmentResponse>();

  private appointmentService = inject(AdminAppointmentService);

  reason: string = '';
  isCancelling = false;
  error: string | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']?.currentValue) {
      this.reason = '';
      this.error = null;
    }
  }

  onClose(): void {
    this.close.emit();
    this.resetForm();
  }

  onSubmit(): void {
    if (!this.appointment) return;

    // Validaciones
    if (!this.reason || this.reason.trim().length < 10) {
      this.error = 'El motivo debe tener al menos 10 caracteres';
      return;
    }

    this.isCancelling = true;
    this.error = null;

    const request: CancelRequest = {
      reason: this.reason.trim()
    };

    this.appointmentService.cancelAppointment(this.appointment.id, request).subscribe({
      next: (cancelledAppointment) => {
        this.cancelled.emit(cancelledAppointment);
        this.onClose();
      },
      error: (err) => {
        this.error = err.message || 'Error al cancelar el turno';
        this.isCancelling = false;
        console.error('Error cancelling appointment:', err);
      }
    });
  }

  private resetForm(): void {
    this.reason = '';
    this.error = null;
    this.isCancelling = false;
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

  isFormValid(): boolean {
    return this.reason.trim().length >= 10;
  }
}
