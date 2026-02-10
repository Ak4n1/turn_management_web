import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminCalendarService } from '../../services/admin-calendar.service';
import { AdminAppointmentService } from '../../../../appointments/admin/services/admin-appointment.service';
import { AdminAppointmentResponse } from '../../../../appointments/admin/models/admin-appointment-response.model';
import { ConsolidatedDayResponse, ConsolidatedCalendarResponse } from '../../models/consolidated-calendar-response.model';
import { forkJoin } from 'rxjs';
import { SpinnerComponent } from '../../../../../shared/atoms/spinner/spinner.component';
import { ErrorTextComponent } from '../../../../../shared/atoms/error-text/error-text.component';
import { DayDetailModalComponent, DayDetailData } from '../../components/day-detail-modal/day-detail-modal.component';
import { CalendarViewComponent } from '../../../../../shared/organisms/calendar-view/calendar-view.component';
import {
  CalendarViewMode,
  CalendarEvent,
  CalendarDay as SharedCalendarDay
} from '../../../../../shared/organisms/calendar-view/calendar-view.model';

/**
 * Consolidated Calendar Page Component (Admin)
 * 
 * Página del calendario consolidado para administradores.
 * Usa el nuevo CalendarView con vistas día/semana/mes.
 */
@Component({
  selector: 'app-consolidated-calendar-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SpinnerComponent,
    ErrorTextComponent,
    DayDetailModalComponent,
    CalendarViewComponent
  ],
  templateUrl: './consolidated-calendar-page.component.html',
  styleUrl: './consolidated-calendar-page.component.css'
})
export class ConsolidatedCalendarPageComponent implements OnInit {
  private adminCalendarService = inject(AdminCalendarService);
  private adminAppointmentService = inject(AdminAppointmentService);

  currentDate: Date = new Date();
  viewMode: CalendarViewMode = 'week';
  calendarEvents: CalendarEvent[] = [];
  dayStates: Map<string, 'open' | 'closed' | 'partial'> = new Map();
  dayRanges: Map<string, { start: string; end: string }[]> = new Map(); // NUEVO
  isLoading = false;
  error: string | null = null;

  // Utility to parse YYYY-MM-DD as local date (Fixes 1-day off bug)
  private parseLocalDate(dateStr: string): Date {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day, 12, 0, 0); // Noon to avoid DST shifts
  }

  // Modal state
  isModalOpen = false;
  selectedDayData: DayDetailData | null = null;

  // Raw data from backend
  private backendDays: Map<string, ConsolidatedDayResponse> = new Map();

  ngOnInit(): void {
    this.loadCalendarData();
  }

  private loadCalendarData(): void {
    this.isLoading = true;
    this.error = null;

    const { startDate, endDate } = this.getDateRange();

    const consolidated$ = this.adminCalendarService.getConsolidatedCalendar(startDate, endDate);
    const appointments$ = this.adminAppointmentService.getAppointments({
      dateFrom: startDate,
      dateTo: endDate,
      state: 'CONFIRMED', // Solo turnos que ocupan el slot (excluir RESCHEDULED, etc.)
      size: 100 // Máximo permitido por el backend
    });

    forkJoin({
      consolidated: consolidated$,
      appointments: appointments$
    }).subscribe({
      next: ({ consolidated, appointments }: { consolidated: ConsolidatedCalendarResponse, appointments: any }) => {
        this.backendDays.clear();
        this.dayStates.clear();
        this.dayRanges.clear();
        this.calendarEvents = [];

        // 1. Procesar estados y rangos (Usar parseLocalDate para consistencia)
        consolidated.days.forEach((day: ConsolidatedDayResponse) => {
          this.backendDays.set(day.date, day);
          this.dayStates.set(day.date, this.mapState(day.state));
          this.dayRanges.set(day.date, day.timeRanges);
        });

        // 2. Procesar turnos reales para el grid
        this.calendarEvents = appointments.content.map((apt: AdminAppointmentResponse) => ({
          id: apt.id.toString(),
          title: `${apt.userFirstName || ''} ${apt.userLastName || apt.userEmail}`.trim(),
          description: apt.cancellationReason || '',
          date: apt.date.includes('T') ? apt.date.split('T')[0] : apt.date, // Asegurar formato YYYY-MM-DD
          startTime: apt.startTime,
          endTime: apt.endTime,
          status: this.mapAppointmentStatus(apt.state)
        }));

        this.isLoading = false;
      },
      error: (err) => {
        this.error = err.message || 'Error al cargar los datos del calendario';
        this.isLoading = false;
        console.error('Error loading calendar data:', err);
      }
    });
  }

  private mapAppointmentStatus(state: string): 'confirmed' | 'pending' | 'cancelled' {
    switch (state) {
      case 'CONFIRMED':
        return 'confirmed';
      case 'CANCELLED':
      case 'CANCELLED_BY_ADMIN':
        return 'cancelled';
      default:
        return 'pending';
    }
  }

  private getDateRange(): { startDate: string; endDate: string } {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    // Get range based on view mode
    let startDate: Date;
    let endDate: Date;

    switch (this.viewMode) {
      case 'day':
        startDate = new Date(this.currentDate);
        endDate = new Date(this.currentDate);
        break;
      case 'week':
        startDate = this.getStartOfWeek(this.currentDate);
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6);
        break;
      case 'month':
      default:
        startDate = new Date(year, month, 1);
        endDate = new Date(year, month + 1, 0);
        break;
    }

    return {
      startDate: this.formatDate(startDate),
      endDate: this.formatDate(endDate)
    };
  }

  private getStartOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  private mapState(state: string): 'open' | 'closed' | 'partial' {
    switch (state) {
      case 'OPEN':
        return 'open';
      case 'PARTIAL':
        return 'partial';
      case 'CLOSED':
      default:
        return 'closed';
    }
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Event handlers for CalendarView
  onViewModeChange(mode: CalendarViewMode): void {
    this.viewMode = mode;
    this.loadCalendarData();
  }

  onDateChange(date: Date): void {
    const localDate = new Date(date);
    localDate.setHours(12, 0, 0, 0);
    this.currentDate = localDate;
    this.loadCalendarData();
  }

  onDayClick(date: Date): void {
    const localDate = new Date(date);
    localDate.setHours(12, 0, 0, 0);
    const dateStr = this.formatDate(localDate);
    const backendDay = this.backendDays.get(dateStr);

    if (backendDay) {
      this.selectedDayData = {
        date: backendDay.date,
        state: backendDay.state,
        ruleType: backendDay.ruleType,
        ruleDescription: backendDay.ruleDescription,
        timeRanges: backendDay.timeRanges,
        hasExistingAppointments: backendDay.hasExistingAppointments || false,
        appointmentsCount: backendDay.appointmentsCount || 0
      };
      this.isModalOpen = true;
    }
  }

  onEventClick(event: CalendarEvent): void {
    // Navigate to appointment details or open modal
    console.log('Event clicked:', event);
  }

  onSlotClick(data: { date: Date; time: string }): void {
    // Could open a modal to create new appointment
    console.log('Slot clicked:', data);
  }

  onNewAppointment(): void {
    // Navigate to new appointment form
    console.log('New appointment clicked');
  }

  onModalClose(): void {
    this.isModalOpen = false;
    this.selectedDayData = null;
  }
}
