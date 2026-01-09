import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AffectedAppointmentsStateService } from '../../services/affected-appointments-state.service';
import { AdminCalendarService } from '../../services/admin-calendar.service';
import { PreviewImpactResponse, AffectedAppointmentInfo } from '../../models/preview-impact.model';
import { AdminAppointmentResponse } from '../../../../appointments/admin/models/admin-appointment-response.model';
import { WeeklyConfigRequest, DailyHoursRequest, AppointmentDurationRequest } from '../../models/weekly-config-response.model';
import { ButtonComponent } from '../../../../../shared/atoms/button/button.component';
import { TextareaComponent } from '../../../../../shared/atoms/textarea/textarea';

/**
 * Affected Appointments Page Component (Admin)
 * 
 * Página dedicada para mostrar y gestionar turnos afectados por cambios en la configuración.
 * Similar a los formularios de bloqueos/excepciones, es una página completa, no un modal.
 */
@Component({
  selector: 'app-affected-appointments-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonComponent,
    TextareaComponent
  ],
  templateUrl: './affected-appointments-page.component.html',
  styleUrl: './affected-appointments-page.component.css'
})
export class AffectedAppointmentsPageComponent implements OnInit {
  private stateService = inject(AffectedAppointmentsStateService);
  private calendarService = inject(AdminCalendarService);
  private router = inject(Router);
  private location = inject(Location);

  impact: PreviewImpactResponse | null = null;
  appointmentsWithUsers: Map<number, AdminAppointmentResponse> = new Map();
  
  // Configuración pendiente de guardar (viene del servicio de estado)
  private weeklyConfig: WeeklyConfigRequest | null = null;
  private dailyHours: Record<string, Array<{ start: string; end: string }>> | null = null;
  private appointmentDuration: number | null = null;
  private durationNotes: string = '';

  currentPage = 0;
  itemsPerPage = 5;
  totalPages = 0;
  paginatedAppointments: AffectedAppointmentInfo[] = [];

  // Switch para cancelación automática (siempre checkeado por defecto)
  autoCancelAffectedAppointments: boolean = true;
  
  // Razón de cancelación personalizable
  cancellationReason: string = 'Día cerrado según nueva configuración';
  
  // Estado de guardado
  isSaving = false;
  saveError: string | null = null;

  ngOnInit(): void {
    // Obtener datos del servicio de estado (NO limpiar todavía, se limpiará después de guardar)
    const data = this.stateService.getData();
    
    if (!data) {
      // Si no hay datos, redirigir a reglas de atención
      this.router.navigate(['/dashboard/admin/calendar/weekly-config']);
      return;
    }

    this.impact = data.impact;
    this.appointmentsWithUsers = data.appointmentsWithUsers;
    this.weeklyConfig = data.weeklyConfig;
    this.dailyHours = data.dailyHours;
    this.appointmentDuration = data.appointmentDuration;
    this.durationNotes = data.durationNotes;
    this.updatePagination();
  }

  onCancel(): void {
    // Limpiar datos y volver a reglas de atención
    this.stateService.clear();
    this.location.back();
  }

  onConfirm(): void {
    if (!this.weeklyConfig || !this.dailyHours || this.appointmentDuration === null) {
      this.saveError = 'Error: No se encontró la configuración pendiente de guardar';
      return;
    }

    this.isSaving = true;
    this.saveError = null;

    // Preparar la configuración semanal con los valores de cancelación
    const weeklyConfigRequest: WeeklyConfigRequest = {
      ...this.weeklyConfig,
      autoCancelAffectedAppointments: this.autoCancelAffectedAppointments,
      cancellationReason: this.autoCancelAffectedAppointments ? this.cancellationReason?.trim() : undefined
    };

    // Preparar horarios diarios (solo días abiertos)
    const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
    const filteredDailyHours: Record<string, Array<{ start: string; end: string }>> = {};
    
    for (const day of dayNames) {
      const dayKey = day as keyof WeeklyConfigRequest;
      const isOpen = this.weeklyConfig![dayKey] as boolean;
      
      if (isOpen && this.dailyHours![day] && this.dailyHours![day].length > 0) {
        filteredDailyHours[day] = this.dailyHours![day];
      }
    }

    const dailyHoursRequest: DailyHoursRequest = {
      dailyHours: filteredDailyHours,
      notes: ''
    };

    const durationRequest: AppointmentDurationRequest = {
      durationMinutes: this.appointmentDuration!,
      notes: this.durationNotes
    };

    // Verificar que haya al menos un día abierto con horarios
    const hasOpenDaysWithHours = Object.keys(filteredDailyHours).length > 0;

    // Paso 1: Guardar configuración semanal (debe hacerse primero)
    // Paso 2: Guardar horarios diarios (solo si hay días abiertos con horarios)
    // Paso 3: Guardar duración de turnos (solo si hay horarios configurados)
    this.calendarService.createWeeklyConfig(weeklyConfigRequest).pipe(
      switchMap((config) => {
        // Si hay días abiertos con horarios, guardar horarios primero y luego duración
        if (hasOpenDaysWithHours) {
          return this.calendarService.setDailyHours(dailyHoursRequest).pipe(
            switchMap((config2) => {
              // Luego guardar duración
              return this.calendarService.setAppointmentDuration(durationRequest);
            })
          );
        } else {
          // Si no hay días abiertos con horarios, solo guardar la configuración semanal
          // El backend mantendrá los horarios y duración existentes
          // No intentar guardar duración porque fallará si no hay horarios previos
          return of(config); // Retornar la configuración semanal ya guardada
        }
      })
    ).subscribe({
      next: () => {
        // Todo guardado exitosamente
        this.isSaving = false;
        
        // Limpiar el servicio de estado
        this.stateService.clear();
        
        // Navegar de vuelta a reglas de atención
        // La configuración ya está guardada en el backend, así que al cargar mostrará Jueves desmarcado
        this.router.navigate(['/dashboard/admin/calendar/weekly-config']);
      },
      error: (err) => {
        this.isSaving = false;
        this.saveError = `Error al guardar la configuración: ${err.message || 'Error desconocido'}`;
        console.error('Error saving config:', err);
      }
    });
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

