import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../../../../shared/molecules/modal/modal.component';
import { AvailabilityService } from '../../services/availability.service';
import { AppointmentService } from '../../../../appointments/user/services/appointment.service';
import { SlotResponse, AvailabilityResponse } from '../../models/availability-range-response.model';
import { AppointmentResponse } from '../../../../appointments/user/models/appointment-response.model';
import { SpinnerComponent } from '../../../../../shared/atoms/spinner/spinner.component';
import { ErrorTextComponent } from '../../../../../shared/atoms/error-text/error-text.component';

@Component({
  selector: 'app-slots-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, SpinnerComponent, ErrorTextComponent],
  templateUrl: './slots-modal.component.html',
  styleUrl: './slots-modal.component.css'
})
export class SlotsModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() selectedDate: string | null = null; // YYYY-MM-DD
  @Output() close = new EventEmitter<void>();
  @Output() appointmentCreated = new EventEmitter<void>();

  private availabilityService = inject(AvailabilityService);
  private appointmentService = inject(AppointmentService);

  slots: SlotResponse[] = [];
  availability: AvailabilityResponse | null = null;
  selectedSlot: SlotResponse | null = null;
  createdAppointment: AppointmentResponse | null = null;
  currentStep: 'select-slot' | 'confirm-appointment' = 'select-slot';
  isLoading = false;
  isLoadingSlots = false;
  isCreatingAppointment = false;
  isConfirmingAppointment = false;
  error: string | null = null;
  validationError: string | null = null;
  notes: string = '';

  ngOnInit(): void {
    if (this.isOpen && this.selectedDate) {
      this.validateAndLoadData();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen && this.selectedDate) {
      this.validateAndLoadData();
    }
  }

  private validateAndLoadData(): void {
    this.validationError = null;
    this.error = null;
    this.selectedSlot = null;
    this.notes = '';
    this.slots = [];
    this.availability = null;

    // Validar que haya una fecha seleccionada
    if (!this.selectedDate) {
      this.validationError = 'No se ha seleccionado ninguna fecha';
      return;
    }

    // Validar que la fecha no sea pasada usando parseo manual
    const selectedDateObj = this.parseDateString(this.selectedDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDateObj.setHours(0, 0, 0, 0);

    if (selectedDateObj < today) {
      this.validationError = 'No puedes reservar turnos para fechas pasadas';
      return;
    }

    // Cargar disponibilidad y slots
    this.loadAvailabilityAndSlots();
  }

  private loadAvailabilityAndSlots(): void {
    this.isLoading = true;
    this.isLoadingSlots = true;
    this.error = null;

    const dateObj = new Date(this.selectedDate!);

    // Primero verificar disponibilidad del día
    this.availabilityService.checkAvailability(dateObj).subscribe({
      next: (availability) => {
        this.availability = availability;

        // Validar que el día esté disponible
        if (!availability.isAvailable) {
          this.error = availability.message || `Este día no está disponible. ${availability.description}`;
          this.isLoading = false;
          this.isLoadingSlots = false;
          return;
        }

        // Cargar slots disponibles
        this.availabilityService.getAvailableSlots(dateObj).subscribe({
          next: (slotsResponse) => {
            this.slots = slotsResponse.slots;
            this.isLoading = false;
            this.isLoadingSlots = false;

            // Validar que haya slots disponibles
            if (slotsResponse.availableSlots === 0) {
              this.error = 'No hay slots disponibles para este día';
            }
          },
          error: (err) => {
            this.error = 'Error al cargar los slots disponibles';
            this.isLoading = false;
            this.isLoadingSlots = false;
            console.error('Error loading slots:', err);
          }
        });
      },
      error: (err) => {
        this.error = 'Error al verificar la disponibilidad del día';
        this.isLoading = false;
        this.isLoadingSlots = false;
        console.error('Error checking availability:', err);
      }
    });
  }

  selectSlot(slot: SlotResponse): void {
    if (!slot.available) return;
    this.selectedSlot = slot;
    this.error = null;
  }

  createAppointment(): void {
    if (!this.selectedSlot || !this.selectedDate) return;

    // Validaciones finales antes de crear
    if (!this.selectedSlot.available) {
      this.error = 'El slot seleccionado ya no está disponible';
      return;
    }

    // Revalidar que la fecha no sea pasada usando parseo manual
    const selectedDateObj = this.parseDateString(this.selectedDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDateObj.setHours(0, 0, 0, 0);

    if (selectedDateObj < today) {
      this.error = 'No puedes reservar turnos para fechas pasadas';
      return;
    }

    this.isCreatingAppointment = true;
    this.error = null;

    const request = {
      date: this.selectedDate,
      startTime: this.selectedSlot.start,
      notes: this.notes.trim() || undefined
    };

    this.appointmentService.createAppointment(request).subscribe({
      next: (response) => {
        this.isCreatingAppointment = false;
        this.createdAppointment = response;
        // Si el turno se creó exitosamente, mostrar paso de confirmación
        this.currentStep = 'confirm-appointment';
      },
      error: (err) => {
        this.isCreatingAppointment = false;

        if (err.userMessage) {
          this.error = err.userMessage;
        } else if (err.error?.message) {
          this.error = err.error.message;
        } else {
          this.error = 'Error al crear el turno. Por favor, intenta nuevamente.';
        }

        console.error('Error creating appointment:', err);
      }
    });
  }

  confirmAppointment(): void {
    if (!this.createdAppointment) return;

    this.isConfirmingAppointment = true;
    this.error = null;

    this.appointmentService.confirmAppointment(this.createdAppointment.id).subscribe({
      next: (response) => {
        this.isConfirmingAppointment = false;
        this.appointmentCreated.emit();
        this.onClose();
      },
      error: (err) => {
        this.isConfirmingAppointment = false;

        if (err.userMessage) {
          this.error = err.userMessage;
        } else if (err.error?.message) {
          this.error = err.error.message;
        } else {
          this.error = 'Error al confirmar el turno. Por favor, intenta nuevamente.';
        }

        console.error('Error confirming appointment:', err);
      }
    });
  }

  skipConfirmation(): void {
    // El usuario puede saltar la confirmación y confirmar después desde "Mis turnos"
    this.appointmentCreated.emit();
    this.onClose();
  }

  goBackToSlotSelection(): void {
    this.currentStep = 'select-slot';
    this.createdAppointment = null;
    this.selectedSlot = null;
    this.notes = '';
    this.error = null;
  }

  onClose(): void {
    this.close.emit();
    // Resetear estado
    this.selectedSlot = null;
    this.createdAppointment = null;
    this.notes = '';
    this.error = null;
    this.validationError = null;
    this.slots = [];
    this.availability = null;
    this.currentStep = 'select-slot';
  }

  getTimeRemaining(): string {
    if (!this.createdAppointment?.expiresAt) return '';

    const expiresAt = new Date(this.createdAppointment.expiresAt);
    const now = new Date();
    const diffMs = expiresAt.getTime() - now.getTime();

    if (diffMs <= 0) return '0 minutos';

    const diffMins = Math.floor(diffMs / 60000);
    return `${diffMins} minutos`;
  }

  private parseDateString(dateStr: string): Date {
    // Parsear fecha manualmente para evitar problemas de zona horaria
    // Formato esperado: YYYY-MM-DD
    const parts = dateStr.split('-');
    if (parts.length !== 3) {
      return new Date(dateStr); // Fallback
    }

    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Los meses en JS son 0-indexed
    const day = parseInt(parts[2], 10);

    return new Date(year, month, day);
  }

  getFormattedDate(): string {
    if (!this.selectedDate) return '';
    // Parsear fecha manualmente para evitar problemas de zona horaria
    // Formato esperado: YYYY-MM-DD
    const parts = this.selectedDate.split('-');
    if (parts.length !== 3) {
      // Fallback si el formato no es el esperado
      const date = new Date(this.selectedDate);
      return date.toLocaleDateString('es-AR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }

    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Los meses en JS son 0-indexed
    const day = parseInt(parts[2], 10);

    const date = new Date(year, month, day);
    return date.toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatTime(time: string): string {
    return time.substring(0, 5); // Asegurar formato HH:mm
  }

  isSlotSelected(slot: SlotResponse): boolean {
    return this.selectedSlot?.start === slot.start && this.selectedSlot?.end === slot.end;
  }
}

