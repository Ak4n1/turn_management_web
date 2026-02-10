import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BlockService } from '../../services/block.service';
import { AdminAppointmentService } from '../../../../appointments/admin/services/admin-appointment.service';
import { ManualBlockResponse, ManualBlockRequest } from '../../models/block-response.model';
import { PreviewImpactResponse, AffectedAppointmentInfo } from '../../models/preview-impact.model';
import { AdminAppointmentResponse } from '../../../../appointments/admin/models/admin-appointment-response.model';
import { SpinnerComponent } from '../../../../../shared/atoms/spinner/spinner.component';
import { ErrorTextComponent } from '../../../../../shared/atoms/error-text/error-text.component';
import { ButtonComponent } from '../../../../../shared/atoms/button/button.component';
import { DateInputComponent } from '../../../../../shared/atoms/date-input/date-input.component';
import { LabelComponent } from '../../../../../shared/atoms/label/label.component';
import { TextareaComponent } from '../../../../../shared/atoms/textarea/textarea';
import { AlertModalComponent } from '../../../../../shared/molecules/alert-modal/alert-modal.component';

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
    TextareaComponent,
    AlertModalComponent
  ],
  templateUrl: './blocks-page.component.html',
  styleUrl: './blocks-page.component.css'
})
export class BlocksPageComponent implements OnInit {
  private blockService = inject(BlockService);
  private appointmentService = inject(AdminAppointmentService);

  blocks: ManualBlockResponse[] = [];
  isLoading = false;
  error: string | null = null;
  successMessage: string | null = null;
  showForm = false;
  showInfo = false;
  editingBlockId: number | null = null;
  blockToDelete: ManualBlockResponse | null = null;
  showFilterModal = false;
  filterDateFrom = '';
  filterDateTo = '';
  filterIsFullDay: boolean | null = null;

  // Formulario
  formDate: string = '';
  formIsFullDay: boolean = true;
  formTimeRange: { start: string; end: string } = { start: '14:00', end: '16:00' };
  formReason: string = '';
  formAffectsExisting: boolean = false;

  // Paso "Turnos afectados" (igual que en reglas de atención)
  currentStep: 'form' | 'affected-appointments' = 'form';
  affectedImpact: PreviewImpactResponse | null = null;
  pendingBlockRequest: ManualBlockRequest | null = null;
  appointmentsWithUsers: Map<number, AdminAppointmentResponse> = new Map();
  autoCancelAffectedAppointments = false;
  cancellationReason = 'Bloqueo operativo programado';
  affectedAppointmentsCurrentPage = 0;
  affectedAppointmentsItemsPerPage = 5;
  affectedAppointmentsTotalPages = 0;
  affectedAppointmentsPaginated: AffectedAppointmentInfo[] = [];

  ngOnInit(): void {
    this.loadBlocks();
  }

  /**
   * Carga los bloqueos desde el backend.
   */
  loadBlocks(): void {
    this.isLoading = true;
    this.error = null;
    this.blockService.getBlocks().subscribe({
      next: (blocks) => {
        this.blocks = blocks;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err.message || 'Error al cargar los bloqueos';
        this.isLoading = false;
        console.error('Error loading blocks:', err);
      }
    });
  }

  getFilteredBlocks(): ManualBlockResponse[] {
    let list = this.blocks;
    if (this.filterDateFrom) {
      list = list.filter(b => b.blockDate >= this.filterDateFrom);
    }
    if (this.filterDateTo) {
      list = list.filter(b => b.blockDate <= this.filterDateTo);
    }
    if (this.filterIsFullDay !== null) {
      list = list.filter(b => b.isFullDay === this.filterIsFullDay);
    }
    return list;
  }

  openFilterModal(): void {
    this.showFilterModal = true;
  }

  closeFilterModal(): void {
    this.showFilterModal = false;
  }

  applyFilters(): void {
    this.closeFilterModal();
  }

  clearFilters(): void {
    this.filterDateFrom = '';
    this.filterDateTo = '';
    this.filterIsFullDay = null;
    this.closeFilterModal();
  }

  editBlock(block: ManualBlockResponse): void {
    this.formDate = block.blockDate;
    this.formIsFullDay = block.isFullDay;
    this.formTimeRange = block.timeRange
      ? { start: block.timeRange.start, end: block.timeRange.end }
      : { start: '14:00', end: '16:00' };
    this.formReason = block.reason ?? '';
    this.formAffectsExisting = block.affectsExistingAppointments ?? false;
    this.editingBlockId = block.id;
    this.error = null;
    this.showForm = true;
  }

  openDeleteConfirm(block: ManualBlockResponse): void {
    this.blockToDelete = block;
  }

  closeDeleteConfirm(): void {
    this.blockToDelete = null;
  }

  confirmDelete(): void {
    if (!this.blockToDelete) return;
    const id = this.blockToDelete.id;
    this.closeDeleteConfirm();
    this.isLoading = true;
    this.error = null;
    this.blockService.deleteBlock(id).subscribe({
      next: () => {
        this.loadBlocks();
        this.successMessage = 'Bloqueo eliminado correctamente';
        this.isLoading = false;
        setTimeout(() => this.successMessage = null, 3000);
      },
      error: (err) => {
        this.error = err.message || 'Error al eliminar el bloqueo';
        this.isLoading = false;
      }
    });
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (!this.showForm) {
      this.resetForm();
      this.editingBlockId = null;
      this.backToBlockForm();
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

    const id = this.editingBlockId;
    const isUpdate = id != null;

    if (isUpdate) {
      this.executeUpdateBlock(id);
      return;
    }

    // Crear: primero preview de impacto; si hay turnos afectados, mostrar paso
    this.isLoading = true;
    this.error = null;
    const previewRequest = {
      changeType: 'BLOCK' as const,
      block: {
        date: this.formDate,
        isFullDay: this.formIsFullDay,
        timeRange: this.formIsFullDay ? null : this.formTimeRange,
        reason: this.formReason,
        affectsExistingAppointments: true
      },
      startDate: this.formDate,
      endDate: this.formDate
    };

    this.blockService.previewBlockImpact(previewRequest).subscribe({
      next: (impact) => {
        this.isLoading = false;
        const hasAffected = impact.appointments?.length > 0;
        if (hasAffected) {
          this.affectedImpact = impact;
          this.pendingBlockRequest = {
            date: this.formDate,
            isFullDay: this.formIsFullDay,
            timeRange: this.formIsFullDay ? null : this.formTimeRange,
            reason: this.formReason,
            affectsExistingAppointments: true
          };
          this.autoCancelAffectedAppointments = false;
          this.cancellationReason = 'Bloqueo operativo programado';
          this.loadAppointmentsWithUserInfo(impact.appointments ?? []);
        } else {
          this.executeCreateBlock({
            date: this.formDate,
            isFullDay: this.formIsFullDay,
            timeRange: this.formIsFullDay ? null : this.formTimeRange,
            reason: this.formReason,
            affectsExistingAppointments: this.formAffectsExisting
          });
        }
      },
      error: (err) => {
        this.error = err.message || 'Error al calcular el impacto del bloqueo';
        this.isLoading = false;
      }
    });
  }

  /** Vuelve del paso turnos afectados al formulario */
  backToBlockForm(): void {
    this.currentStep = 'form';
    this.affectedImpact = null;
    this.pendingBlockRequest = null;
    this.appointmentsWithUsers.clear();
  }

  /** Carga información de usuarios para los turnos afectados (igual que reglas de atención) */
  private loadAppointmentsWithUserInfo(affectedAppointments: AffectedAppointmentInfo[]): void {
    if (!this.affectedImpact) return;
    if (!affectedAppointments || affectedAppointments.length === 0) {
      this.showAffectedAppointmentsStep();
      return;
    }
    const appointmentsByDate = new Map<string, AffectedAppointmentInfo[]>();
    affectedAppointments.forEach(apt => {
      if (!appointmentsByDate.has(apt.date)) appointmentsByDate.set(apt.date, []);
      appointmentsByDate.get(apt.date)!.push(apt);
    });
    const requests = Array.from(appointmentsByDate.keys()).map(date =>
      this.appointmentService.getAppointmentsByDate(date).pipe(
        catchError(() => of({ content: [], totalElements: 0, totalPages: 0, page: 0, size: 0 }))
      )
    );
    if (requests.length === 0) {
      this.showAffectedAppointmentsStep();
      return;
    }
    forkJoin(requests).subscribe({
      next: (responses) => {
        this.appointmentsWithUsers.clear();
        responses.forEach(response => {
          response.content.forEach(apt => {
            if (apt.id) this.appointmentsWithUsers.set(apt.id, apt);
          });
        });
        this.showAffectedAppointmentsStep();
      },
      error: () => {
        this.appointmentsWithUsers.clear();
        this.showAffectedAppointmentsStep();
      }
    });
  }

  private showAffectedAppointmentsStep(): void {
    if (this.affectedImpact) {
      this.updateAffectedAppointmentsPagination();
      this.currentStep = 'affected-appointments';
    }
  }

  private updateAffectedAppointmentsPagination(): void {
    if (!this.affectedImpact?.appointments) {
      this.affectedAppointmentsPaginated = [];
      this.affectedAppointmentsTotalPages = 0;
      return;
    }
    this.affectedAppointmentsTotalPages = Math.ceil(this.affectedImpact.appointments.length / this.affectedAppointmentsItemsPerPage);
    const start = this.affectedAppointmentsCurrentPage * this.affectedAppointmentsItemsPerPage;
    this.affectedAppointmentsPaginated = this.affectedImpact.appointments.slice(start, start + this.affectedAppointmentsItemsPerPage);
  }

  affectedAppointmentsPreviousPage(): void {
    if (this.affectedAppointmentsCurrentPage > 0) {
      this.affectedAppointmentsCurrentPage--;
      this.updateAffectedAppointmentsPagination();
    }
  }

  affectedAppointmentsNextPage(): void {
    if (this.affectedAppointmentsCurrentPage < this.affectedAppointmentsTotalPages - 1) {
      this.affectedAppointmentsCurrentPage++;
      this.updateAffectedAppointmentsPagination();
    }
  }

  affectedAppointmentsGoToPage(page: number): void {
    if (page >= 0 && page < this.affectedAppointmentsTotalPages) {
      this.affectedAppointmentsCurrentPage = page;
      this.updateAffectedAppointmentsPagination();
    }
  }

  getAffectedAppointmentsPageNumbers(): number[] {
    const maxVisiblePages = 5;
    let startPage = Math.max(0, this.affectedAppointmentsCurrentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(this.affectedAppointmentsTotalPages - 1, startPage + maxVisiblePages - 1);
    if (endPage - startPage < maxVisiblePages - 1) startPage = Math.max(0, endPage - maxVisiblePages + 1);
    const pages: number[] = [];
    for (let i = startPage; i <= endPage; i++) pages.push(i);
    return pages;
  }

  getAffectedAppointmentUserFullName(appointment: AffectedAppointmentInfo): string {
    if (!appointment.id) return 'Usuario desconocido';
    const full = this.appointmentsWithUsers.get(appointment.id);
    if (!full) return 'Cargando...';
    const { userFirstName, userLastName, userEmail } = full;
    if (userFirstName && userLastName) return `${userFirstName} ${userLastName}`;
    if (userFirstName) return userFirstName;
    if (userLastName) return userLastName;
    return userEmail || 'Usuario desconocido';
  }

  getAffectedAppointmentUserInitials(appointment: AffectedAppointmentInfo): string {
    const fullName = this.getAffectedAppointmentUserFullName(appointment);
    if (!fullName) return '?';
    if (fullName === 'Cargando...') return '…';
    const parts = fullName.trim().split(/\s+/);
    const first = parts[0]?.charAt(0) ?? '';
    const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
    return (first + last).toUpperCase() || '?';
  }

  formatAffectedAppointmentDate(appointment: AffectedAppointmentInfo): string {
    const date = new Date(appointment.date + 'T' + appointment.time);
    return date.toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }

  formatAffectedAppointmentTime(appointment: AffectedAppointmentInfo): string {
    const date = new Date(appointment.date + 'T' + appointment.time);
    return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  }

  /** Confirma y crea el bloqueo enviando opción de cancelar o solo notificar */
  confirmCreateBlockWithAffected(): void {
    if (!this.pendingBlockRequest || !this.affectedImpact?.appointments?.length) {
      this.executeCreateBlock(this.pendingBlockRequest!);
      return;
    }
    const ids = this.affectedImpact.appointments
      .map((a: AffectedAppointmentInfo) => a.id)
      .filter((id): id is number => id != null);
    const request: ManualBlockRequest = {
      ...this.pendingBlockRequest,
      affectsExistingAppointments: true,
      appointmentIdsToCancel: ids,
      autoCancelAffectedAppointments: this.autoCancelAffectedAppointments,
      cancellationReason: this.autoCancelAffectedAppointments ? this.cancellationReason : undefined
    };
    this.isLoading = true;
    this.error = null;
    this.successMessage = null;
    this.blockService.createBlock(request).subscribe({
      next: () => {
        this.successMessage = 'Bloqueo creado exitosamente';
        this.isLoading = false;
        this.showForm = false;
        this.resetForm();
        this.backToBlockForm();
        this.loadBlocks();
        setTimeout(() => this.successMessage = null, 3000);
      },
      error: (err) => {
        this.error = err.message || 'Error al crear el bloqueo';
        this.isLoading = false;
        console.error('Error creating block:', err);
      }
    });
  }

  private executeCreateBlock(request: ManualBlockRequest): void {
    this.isLoading = true;
    this.error = null;
    this.successMessage = null;
    this.blockService.createBlock(request).subscribe({
      next: () => {
        this.successMessage = 'Bloqueo creado exitosamente';
        this.isLoading = false;
        this.showForm = false;
        this.resetForm();
        this.loadBlocks();
        setTimeout(() => this.successMessage = null, 3000);
      },
      error: (err) => {
        this.error = err.message || 'Error al crear el bloqueo';
        this.isLoading = false;
        console.error('Error creating block:', err);
      }
    });
  }

  private executeUpdateBlock(id: number): void {
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
    this.blockService.updateBlock(id, request).subscribe({
      next: () => {
        this.successMessage = 'Bloqueo actualizado correctamente';
        this.isLoading = false;
        this.showForm = false;
        this.resetForm();
        this.editingBlockId = null;
        this.loadBlocks();
        setTimeout(() => this.successMessage = null, 3000);
      },
      error: (err) => {
        this.error = err.message || 'Error al actualizar el bloqueo';
        this.isLoading = false;
        console.error('Error updating block:', err);
      }
    });
  }

  /** Parsea YYYY-MM-DD como fecha local (evita desfase de un día por UTC). */
  private parseLocalDate(dateStr: string): Date {
    const clean = (dateStr || '').split('T')[0];
    const [y, m, d] = clean.split('-').map(Number);
    if (isNaN(y) || isNaN(m) || isNaN(d)) return new Date(dateStr);
    return new Date(y, m - 1, d, 12, 0, 0);
  }

  formatDate(dateStr: string): string {
    const date = this.parseLocalDate(dateStr);
    return date.toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatDateList(dateStr: string): string {
    const date = this.parseLocalDate(dateStr);
    return date.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  formatWeekday(dateStr: string): string {
    const date = this.parseLocalDate(dateStr);
    return date.toLocaleDateString('es-AR', { weekday: 'long' });
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
