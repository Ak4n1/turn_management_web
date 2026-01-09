import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExceptionService } from '../../services/exception.service';
import { CalendarExceptionResponse, CalendarExceptionRequest } from '../../models/exception-response.model';
import { SpinnerComponent } from '../../../../../shared/atoms/spinner/spinner.component';
import { ErrorTextComponent } from '../../../../../shared/atoms/error-text/error-text.component';
import { ButtonComponent } from '../../../../../shared/atoms/button/button.component';
import { DateInputComponent } from '../../../../../shared/atoms/date-input/date-input.component';
import { LabelComponent } from '../../../../../shared/atoms/label/label.component';
import { TextareaComponent } from '../../../../../shared/atoms/textarea/textarea';

/**
 * Exceptions Page Component (Admin)
 * 
 * Página para gestionar excepciones del calendario.
 * 
 * ✅ Usa ExceptionService (servicio real con datos del backend)
 */
@Component({
  selector: 'app-exceptions-page',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    SpinnerComponent, 
    ErrorTextComponent,
    ButtonComponent,
    DateInputComponent,
    LabelComponent,
    TextareaComponent
  ],
  templateUrl: './exceptions-page.component.html',
  styleUrl: './exceptions-page.component.css'
})
export class ExceptionsPageComponent implements OnInit {
  private exceptionService = inject(ExceptionService);

  exceptions: CalendarExceptionResponse[] = [];
  isLoading = false;
  error: string | null = null;
  successMessage: string | null = null;
  showForm = false;
  showInfo = false;

  // Formulario
  formDate: string = '';
  formIsOpen: boolean = true;
  formTimeRanges: Array<{ start: string; end: string }> = [{ start: '09:00', end: '12:00' }];
  formReason: string = '';

  ngOnInit(): void {
    this.loadExceptions();
  }

  /**
   * Carga las excepciones desde el almacenamiento local
   * Nota: El backend no tiene endpoint GET para listar excepciones.
   * Las excepciones se mantienen en la lista local después de crearlas.
   */
  private loadExceptions(): void {
    // No hay endpoint GET, las excepciones se mantienen en la lista local
    // después de crearlas. Si necesitamos cargar desde el backend,
    // podríamos usar el calendario consolidado.
    this.isLoading = false;
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (!this.showForm) {
      this.resetForm();
    }
  }

  toggleInfo(): void {
    this.showInfo = !this.showInfo;
  }

  resetForm(): void {
    this.formDate = '';
    this.formIsOpen = true;
    this.formTimeRanges = [{ start: '09:00', end: '12:00' }];
    this.formReason = '';
  }

  addTimeRange(): void {
    this.formTimeRanges.push({ start: '09:00', end: '12:00' });
  }

  removeTimeRange(index: number): void {
    this.formTimeRanges.splice(index, 1);
  }

  submitForm(): void {
    if (!this.formDate || !this.formReason || this.formReason.length < 10) {
      this.error = 'Por favor completa todos los campos. El motivo debe tener al menos 10 caracteres.';
      return;
    }

    if (this.formIsOpen && this.formTimeRanges.length === 0) {
      this.error = 'Si el día está abierto, debe tener al menos un rango horario.';
      return;
    }

    this.isLoading = true;
    this.error = null;
    this.successMessage = null;

    const request: CalendarExceptionRequest = {
      date: this.formDate,
      isOpen: this.formIsOpen,
      timeRanges: this.formIsOpen ? this.formTimeRanges : [],
      reason: this.formReason
    };

    this.exceptionService.createException(request).subscribe({
      next: (exception) => {
        this.exceptions.push(exception);
        this.successMessage = 'Excepción creada exitosamente';
        this.isLoading = false;
        this.showForm = false;
        this.resetForm();
        setTimeout(() => this.successMessage = null, 3000);
      },
      error: (err) => {
        this.error = err.message || 'Error al crear la excepción';
        this.isLoading = false;
        console.error('Error creating exception:', err);
      }
    });
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-AR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
  }

  formatTimeRanges(ranges: Array<{ start: string; end: string }>): string {
    if (ranges.length === 0) return 'Cerrado';
    return ranges.map(r => `${r.start} - ${r.end}`).join(', ');
  }

  getTodayDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
