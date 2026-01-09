import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../../../../shared/molecules/modal/modal.component';
import { ButtonComponent } from '../../../../../shared/atoms/button/button.component';
import { TextareaComponent } from '../../../../../shared/atoms/textarea/textarea';
import { PreviewImpactResponse, AffectedAppointmentInfo } from '../../models/preview-impact.model';
import { AdminAppointmentResponse } from '../../../../appointments/admin/models/admin-appointment-response.model';

/**
 * Modal para mostrar turnos afectados por cambios en la configuración
 */
@Component({
  selector: 'app-affected-appointments-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, ButtonComponent, TextareaComponent],
  templateUrl: './affected-appointments-modal.component.html',
  styleUrl: './affected-appointments-modal.component.css'
})
export class AffectedAppointmentsModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() impact: PreviewImpactResponse | null = null;
  @Input() appointmentsWithUsers: Map<number, AdminAppointmentResponse> = new Map();
  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<{ autoCancelAffectedAppointments: boolean; cancellationReason: string }>();
  @Output() cancel = new EventEmitter<void>();

  currentPage = 0;
  itemsPerPage = 5;
  totalPages = 0;
  paginatedAppointments: AffectedAppointmentInfo[] = [];

  // Switch para cancelación automática (siempre checkeado por defecto)
  autoCancelAffectedAppointments: boolean = true;
  
  // Razón de cancelación personalizable
  cancellationReason: string = 'Día cerrado según nueva configuración';

  ngOnInit(): void {
    if (this.isOpen && this.impact) {
      this.updatePagination();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['isOpen'] || changes['impact']) && this.isOpen && this.impact) {
      this.currentPage = 0;
      this.updatePagination();
      // Resetear valores cuando se abre el modal
      this.autoCancelAffectedAppointments = true;
      this.cancellationReason = 'Día cerrado según nueva configuración';
    }
  }

  private updatePagination(): void {
    if (!this.impact || !this.impact.appointments) {
      this.paginatedAppointments = [];
      this.totalPages = 0;
      return;
    }

    this.totalPages = Math.ceil(this.impact.appointments.length / this.itemsPerPage);
    const startIndex = this.currentPage * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedAppointments = this.impact.appointments.slice(startIndex, endIndex);
  }

  onClose(): void {
    this.close.emit();
  }

  onConfirm(): void {
    this.confirm.emit({
      autoCancelAffectedAppointments: this.autoCancelAffectedAppointments,
      cancellationReason: this.cancellationReason?.trim() || 'Día cerrado según nueva configuración'
    });
    this.onClose();
  }

  onCancel(): void {
    this.cancel.emit();
    this.onClose();
  }

  previousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  getUserFullName(appointment: AffectedAppointmentInfo): string {
    if (!appointment.id) {
      return 'Usuario desconocido';
    }

    const fullAppointment = this.appointmentsWithUsers.get(appointment.id);
    if (!fullAppointment) {
      return 'Cargando...';
    }

    const { userFirstName, userLastName, userEmail } = fullAppointment;
    if (userFirstName && userLastName) {
      return `${userFirstName} ${userLastName}`;
    } else if (userFirstName) {
      return userFirstName;
    } else if (userLastName) {
      return userLastName;
    } else {
      return userEmail || 'Usuario desconocido';
    }
  }

  formatAppointmentDate(appointment: AffectedAppointmentInfo): string {
    const date = new Date(appointment.date + 'T' + appointment.time);
    return date.toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatAppointmentTime(appointment: AffectedAppointmentInfo): string {
    const date = new Date(appointment.date + 'T' + appointment.time);
    return date.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(0, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(this.totalPages - 1, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(0, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }
}

