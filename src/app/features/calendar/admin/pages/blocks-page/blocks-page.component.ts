import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BlockService } from '../../services/block.service';
import { ManualBlockResponse, ManualBlockRequest } from '../../models/block-response.model';
import { SpinnerComponent } from '../../../../../shared/atoms/spinner/spinner.component';
import { ErrorTextComponent } from '../../../../../shared/atoms/error-text/error-text.component';
import { ButtonComponent } from '../../../../../shared/atoms/button/button.component';
import { DateInputComponent } from '../../../../../shared/atoms/date-input/date-input.component';
import { LabelComponent } from '../../../../../shared/atoms/label/label.component';
import { TextareaComponent } from '../../../../../shared/atoms/textarea/textarea';

/**
 * Blocks Page Component (Admin)
 * 
 * Página para gestionar bloqueos del calendario.
 * 
 * ✅ Usa BlockService (servicio real con datos del backend)
 */
@Component({
  selector: 'app-blocks-page',
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
  templateUrl: './blocks-page.component.html',
  styleUrl: './blocks-page.component.css'
})
export class BlocksPageComponent implements OnInit {
  private blockService = inject(BlockService);

  blocks: ManualBlockResponse[] = [];
  isLoading = false;
  error: string | null = null;
  successMessage: string | null = null;
  showForm = false;
  showInfo = false;

  // Formulario
  formDate: string = '';
  formIsFullDay: boolean = true;
  formTimeRange: { start: string; end: string } = { start: '14:00', end: '16:00' };
  formReason: string = '';
  formAffectsExisting: boolean = false;

  ngOnInit(): void {
    this.loadBlocks();
  }

  /**
   * Carga los bloqueos desde el almacenamiento local
   * Nota: El backend no tiene endpoint GET para listar bloqueos.
   * Los bloqueos se mantienen en la lista local después de crearlos.
   */
  private loadBlocks(): void {
    // No hay endpoint GET, los bloqueos se mantienen en la lista local
    // después de crearlos. Si necesitamos cargar desde el backend,
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
    this.formIsFullDay = true;
    this.formTimeRange = { start: '14:00', end: '16:00' };
    this.formReason = '';
    this.formAffectsExisting = false;
  }

  submitForm(): void {
    if (!this.formDate || !this.formReason || this.formReason.length < 10) {
      this.error = 'Por favor completa todos los campos. El motivo debe tener al menos 10 caracteres.';
      return;
    }

    if (!this.formIsFullDay && (!this.formTimeRange.start || !this.formTimeRange.end)) {
      this.error = 'Si el bloqueo es parcial, debe tener un rango horario.';
      return;
    }

    this.isLoading = true;
    this.error = null;
    this.successMessage = null;

    const request: ManualBlockRequest = {
      date: this.formDate,
      isFullDay: this.formIsFullDay,
      timeRange: this.formIsFullDay ? null : this.formTimeRange,
      reason: this.formReason,
      affectsExistingAppointments: this.formAffectsExisting
    };

    this.blockService.createBlock(request).subscribe({
      next: (block) => {
        this.blocks.push(block);
        this.successMessage = 'Bloqueo creado exitosamente';
        this.isLoading = false;
        this.showForm = false;
        this.resetForm();
        setTimeout(() => this.successMessage = null, 3000);
      },
      error: (err) => {
        this.error = err.message || 'Error al crear el bloqueo';
        this.isLoading = false;
        console.error('Error creating block:', err);
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

  formatTimeRange(block: ManualBlockResponse): string {
    if (block.isFullDay) return 'Día completo';
    if (block.timeRange) {
      return `${block.timeRange.start} - ${block.timeRange.end}`;
    }
    return 'N/A';
  }

  getTodayDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
