import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../../../../shared/molecules/modal/modal.component';
import { AvailabilityService } from '../../../../calendar/user/services/availability.service';
import { AppointmentService } from '../../services/appointment.service';
import { AppointmentResponse } from '../../models/appointment-response.model';
import { SlotResponse, AvailabilityResponse } from '../../../../calendar/user/models/availability-range-response.model';
import { TextareaComponent } from '../../../../../shared/atoms/textarea/textarea';
import { DateInputComponent } from '../../../../../shared/atoms/date-input/date-input.component';
import { SpinnerComponent } from '../../../../../shared/atoms/spinner/spinner.component';
import { ErrorTextComponent } from '../../../../../shared/atoms/error-text/error-text.component';
import { ButtonComponent } from '../../../../../shared/atoms/button/button.component';

/**
 * Reschedule Appointment Modal Component
 * 
 * Modal para solicitar reprogramación de un turno.
 */
@Component({
  selector: 'app-reschedule-appointment-modal',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ModalComponent, 
    TextareaComponent,
    DateInputComponent,
    SpinnerComponent,
    ErrorTextComponent,
    ButtonComponent
  ],
  templateUrl: './reschedule-appointment-modal.component.html',
  styleUrl: './reschedule-appointment-modal.component.css'
})
export class RescheduleAppointmentModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() appointment: AppointmentResponse | null = null;
  @Input() isLoading = false;
  @Output() close = new EventEmitter<void>();
  @Output() rescheduleRequested = new EventEmitter<void>();

  private availabilityService = inject(AvailabilityService);
  private appointmentService = inject(AppointmentService);

  selectedDate: string = '';
  slots: SlotResponse[] = [];
  availability: AvailabilityResponse | null = null;
  selectedSlot: SlotResponse | null = null;
  reason: string = '';
  
  isLoadingSlots = false;
  isSubmitting = false;
  error: string | null = null;
  validationError: string | null = null;

  ngOnInit(): void {
    if (this.isOpen && this.appointment) {
      this.resetForm();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen && this.appointment) {
      this.resetForm();
    }
  }

  private resetForm(): void {
    this.selectedDate = '';
    this.selectedSlot = null;
    this.reason = '';
    this.slots = [];
    this.availability = null;
    this.error = null;
    this.validationError = null;
    this.isLoadingSlots = false;
    this.isSubmitting = false;
  }

  onDateChange(): void {
    if (!this.selectedDate) {
      this.slots = [];
      this.selectedSlot = null;
      this.availability = null;
      return;
    }

    this.loadAvailabilityAndSlots();
  }

  private loadAvailabilityAndSlots(): void {
    if (!this.selectedDate) return;

    this.isLoadingSlots = true;
    this.error = null;
    this.validationError = null;
    this.selectedSlot = null;
    this.slots = [];
    this.availability = null;

    // Validar que la fecha no sea pasada
    const selectedDateObj = this.parseDateString(this.selectedDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDateObj.setHours(0, 0, 0, 0);

    if (selectedDateObj < today) {
      this.validationError = 'No puedes seleccionar una fecha pasada';
      this.isLoadingSlots = false;
      return;
    }

    // Cargar disponibilidad y slots
    const dateObj = new Date(selectedDateObj);

    this.availabilityService.checkAvailability(dateObj).subscribe({
      next: (availability) => {
        this.availability = availability;

        if (!availability.isAvailable) {
          this.error = availability.message || availability.description || 'Este día no está disponible';
          this.isLoadingSlots = false;
          return;
        }

        // Cargar slots disponibles
        this.availabilityService.getAvailableSlots(dateObj).subscribe({
          next: (slotsResponse) => {
            this.slots = slotsResponse.slots.filter(slot => slot.available);
            this.isLoadingSlots = false;
            
            if (this.slots.length === 0) {
              this.error = 'No hay slots disponibles para esta fecha';
            }
          },
          error: (err) => {
            this.isLoadingSlots = false;
            this.error = err.userMessage || err.error?.message || 'Error al cargar los slots disponibles';
          }
        });
      },
      error: (err) => {
        this.isLoadingSlots = false;
        this.error = err.userMessage || err.error?.message || 'Error al verificar disponibilidad';
      }
    });
  }

  selectSlot(slot: SlotResponse): void {
    if (!slot.available) return;
    this.selectedSlot = slot;
    this.error = null;
  }

  isSlotSelected(slot: SlotResponse): boolean {
    return this.selectedSlot?.start === slot.start && this.selectedSlot?.end === slot.end;
  }

  formatTime(time: string): string {
    return time.substring(0, 5); // HH:mm
  }

  getFormattedCurrentDate(): string {
    if (!this.appointment) return '';
    
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

  parseDateString(dateStr: string): Date {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
    return new Date(dateStr);
  }

  getMinDate(): string {
    // Mínimo: mañana (no se puede reprogramar a hoy o pasado)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  canSubmit(): boolean {
    return !!this.selectedDate && !!this.selectedSlot && !this.isSubmitting && !this.isLoadingSlots;
  }

  onSubmit(): void {
    if (!this.appointment || !this.selectedSlot || !this.selectedDate) {
      return;
    }

    this.isSubmitting = true;
    this.error = null;

    const request = {
      newDate: this.selectedDate,
      newStartTime: this.selectedSlot.start.substring(0, 5), // HH:mm
      reason: this.reason.trim() || undefined
    };

    this.appointmentService.requestReschedule(this.appointment.id, request).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.rescheduleRequested.emit();
        this.close.emit();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.error = err.userMessage || err.error?.message || 'Error al solicitar reprogramación';
      }
    });
  }

  onClose(): void {
    this.resetForm();
    this.close.emit();
  }
}

