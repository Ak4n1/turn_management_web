import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../../../../shared/molecules/modal/modal.component';
import { ErrorTextComponent } from '../../../../../shared/atoms/error-text/error-text.component';
import { ButtonComponent } from '../../../../../shared/atoms/button/button.component';
import { InputComponent } from '../../../../../shared/atoms/input/input.component';
import { DateInputComponent } from '../../../../../shared/atoms/date-input/date-input.component';
import { LabelComponent } from '../../../../../shared/atoms/label/label.component';
import { TextareaComponent } from '../../../../../shared/atoms/textarea/textarea';
import { AdminAppointmentResponse } from '../../models/admin-appointment-response.model';
import { RescheduleRequest } from '../../models/admin-appointment-requests.model';
import { AdminAppointmentService } from '../../services/admin-appointment.service';

@Component({
  selector: 'app-reschedule-modal',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ModalComponent, 
    ErrorTextComponent, 
    ButtonComponent,
    InputComponent,
    DateInputComponent,
    LabelComponent,
    TextareaComponent
  ],
  templateUrl: './reschedule-modal.html',
  styleUrl: './reschedule-modal.css'
})
export class RescheduleModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() appointment: AdminAppointmentResponse | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() rescheduled = new EventEmitter<AdminAppointmentResponse>();

  private appointmentService = inject(AdminAppointmentService);

  newDate: string = '';
  newStartTime: string = '';
  reason: string = '';
  isRescheduling = false;
  error: string | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']?.currentValue && this.appointment) {
      // Inicializar con valores del turno actual
      this.newDate = this.appointment.date;
      this.newStartTime = this.appointment.startTime;
      this.reason = '';
      this.error = null;
    }
  }

  getTodayDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  isFormValid(): boolean {
    return !!this.newDate && !!this.newStartTime && this.reason.trim().length >= 10;
  }

  onClose(): void {
    this.close.emit();
    this.resetForm();
  }

  onSubmit(): void {
    if (!this.appointment) return;

    // Validaciones
    if (!this.newDate || !this.newStartTime) {
      this.error = 'La fecha y hora son obligatorias';
      return;
    }

    if (!this.reason || this.reason.trim().length < 10) {
      this.error = 'El motivo debe tener al menos 10 caracteres';
      return;
    }

    this.isRescheduling = true;
    this.error = null;

    const request: RescheduleRequest = {
      newDate: this.newDate,
      newStartTime: this.newStartTime,
      reason: this.reason.trim()
    };

    this.appointmentService.rescheduleAppointment(this.appointment.id, request).subscribe({
      next: (rescheduledAppointment) => {
        this.rescheduled.emit(rescheduledAppointment);
        this.onClose();
      },
      error: (err) => {
        this.error = err.message || 'Error al reprogramar el turno';
        this.isRescheduling = false;
        console.error('Error rescheduling appointment:', err);
      }
    });
  }

  private resetForm(): void {
    this.newDate = '';
    this.newStartTime = '';
    this.reason = '';
    this.error = null;
    this.isRescheduling = false;
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
}
