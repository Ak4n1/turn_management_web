import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockAuditService } from '../../services/mock-audit.service';
import { AuditLogsPageResponse, AuditLogResponse, AuditActionType } from '../../models/audit-log-response.model';
import { SpinnerComponent } from '../../../../shared/atoms/spinner/spinner.component';
import { ErrorTextComponent } from '../../../../shared/atoms/error-text/error-text.component';

/**
 * Audit Page Component (Admin)
 * 
 * Página para consultar auditoría y logs del sistema.
 * 
 * MOCK: Usa MockAuditService
 */
@Component({
  selector: 'app-audit-page',
  standalone: true,
  imports: [CommonModule, FormsModule, SpinnerComponent, ErrorTextComponent],
  templateUrl: './audit-page.component.html',
  styleUrl: './audit-page.component.css'
})
export class AuditPageComponent implements OnInit {
  private auditService = inject(MockAuditService);

  logs: AuditLogResponse[] = [];
  isLoading = false;
  error: string | null = null;
  
  // Paginación
  page = 0;
  size = 20;
  totalElements = 0;
  totalPages = 0;

  // Filtros
  actionType: AuditActionType | '' = '';
  userId: number | null = null;
  startDate: string = '';
  endDate: string = '';

  actionTypes: { value: AuditActionType; label: string }[] = [
    { value: 'CANCELLATION', label: 'Cancelaciones' },
    { value: 'CONFIRMATION', label: 'Confirmaciones' },
    { value: 'CREATION', label: 'Creaciones' },
    { value: 'RESCHEDULE', label: 'Reprogramaciones' },
    { value: 'RESCHEDULE_REQUEST', label: 'Solicitudes de Reprogramación' },
    { value: 'NO_SHOW', label: 'No Show' },
    { value: 'CONFIGURATION_CHANGE', label: 'Cambios de Configuración' },
    { value: 'EXCEPTION', label: 'Excepciones' },
    { value: 'BLOCK', label: 'Bloqueos' }
  ];

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.isLoading = true;
    this.error = null;

    const params: any = {
      page: this.page,
      size: this.size
    };

    if (this.actionType) {
      params.actionType = this.actionType;
    }
    if (this.userId) {
      params.userId = this.userId;
    }
    if (this.startDate) {
      params.startDate = this.startDate;
    }
    if (this.endDate) {
      params.endDate = this.endDate;
    }

    this.auditService.getAuditLogs(params).subscribe({
      next: (response: AuditLogsPageResponse) => {
        this.logs = response.logs;
        this.totalElements = response.totalElements;
        this.totalPages = response.totalPages;
        this.page = response.page;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar los logs de auditoría';
        this.isLoading = false;
        console.error('Error loading audit logs:', err);
      }
    });
  }

  applyFilters(): void {
    this.page = 0; // Reset a primera página
    this.loadLogs();
  }

  clearFilters(): void {
    this.actionType = '';
    this.userId = null;
    this.startDate = '';
    this.endDate = '';
    this.page = 0;
    this.loadLogs();
  }

  goToPage(newPage: number): void {
    if (newPage >= 0 && newPage < this.totalPages) {
      this.page = newPage;
      this.loadLogs();
    }
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-AR', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getActionTypeLabel(actionType: AuditActionType): string {
    const found = this.actionTypes.find(t => t.value === actionType);
    return found ? found.label : actionType;
  }

  getActionTypeColor(actionType: AuditActionType): string {
    const colors: Record<AuditActionType, string> = {
      'CANCELLATION': 'error',
      'CONFIRMATION': 'success',
      'CREATION': 'info',
      'RESCHEDULE': 'warning',
      'RESCHEDULE_REQUEST': 'warning',
      'NO_SHOW': 'error',
      'CONFIGURATION_CHANGE': 'info',
      'EXCEPTION': 'warning',
      'BLOCK': 'error'
    };
    return colors[actionType] || 'secondary';
  }
}
