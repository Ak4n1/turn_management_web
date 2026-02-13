import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { forkJoin, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { WebSocketService } from '../../../../../core/services/websocket.service';
import { WebSocketMessageType } from '../../../../../core/models/websocket-message.model';
import { AvailabilityService } from '../../services/availability.service';
import { AppointmentService } from '../../../../appointments/user/services/appointment.service';
import { DayAvailabilityResponse, AvailabilityRangeResponse } from '../../models/availability-range-response.model';
import { AppointmentResponse } from '../../../../appointments/user/models/appointment-response.model';
import { SlotsModalComponent } from '../../components/slots-modal/slots-modal.component';
import { CalendarViewComponent } from '../../../../../shared/organisms/calendar-view/calendar-view.component';
import {
  CalendarViewMode,
  CalendarEvent
} from '../../../../../shared/organisms/calendar-view/calendar-view.model';

/**
 * Calendar Page Component (User)
 * 
 * Calendario de disponibilidad para usuarios.
 * Usa el nuevo CalendarView con vistas día/semana/mes.
 */
@Component({
  selector: 'app-calendar-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SlotsModalComponent,
    CalendarViewComponent
  ],
  templateUrl: './calendar-page.component.html',
  styleUrl: './calendar-page.component.css'
})
export class CalendarPageComponent implements OnInit, OnDestroy {
  private availabilityService = inject(AvailabilityService);
  private appointmentService = inject(AppointmentService);
  private router = inject(Router);
  private webSocketService = inject(WebSocketService);

  currentDate: Date = new Date();
  viewMode: CalendarViewMode = 'week';
  calendarEvents: CalendarEvent[] = [];
  dayStates: Map<string, 'open' | 'closed' | 'partial'> = new Map();
  dayRanges: Map<string, { start: string; end: string }[]> = new Map();
  occupiedSlotsByDay: Map<string, { start: string; end: string }[]> = new Map();
  isLoading = false;
  error: string | null = null;

  // Modal state
  isSlotsModalOpen = false;
  selectedDateForModal: string | null = null;

  // Raw data
  private userAppointments: AppointmentResponse[] = [];
  private availabilityData: Map<string, DayAvailabilityResponse> = new Map();
  private routerSubscription?: Subscription;
  private webSocketSubscription?: Subscription;

  ngOnInit(): void {
    this.loadCalendarData();

    this.routerSubscription = this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd)
      )
      .subscribe((event: NavigationEnd) => {
        if (event.url.includes('/calendar') || event.url === '/') {
          this.loadCalendarData();
        }
      });

    this.webSocketSubscription = this.webSocketService.messages.subscribe(message => {
      if (message.type === WebSocketMessageType.AVAILABILITY_UPDATED) {
        this.loadCalendarData();
      }
    });
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
    this.webSocketSubscription?.unsubscribe();
  }

  loadCalendarData(): void {
    this.isLoading = true;
    this.error = null;

    const { startDate, endDate } = this.getDateRange();

    const availability$ = this.availabilityService.getAvailabilityRange(startDate, endDate);
    const appointments$ = this.appointmentService.getMyAppointments({
      fromDate: startDate,
      toDate: endDate,
      page: 0,
      size: 100
    });

    forkJoin({
      availability: availability$,
      appointments: appointments$
    }).subscribe({
      next: ({ availability: availabilityResponse, appointments: appointmentsResponse }) => {
        this.userAppointments = appointmentsResponse.appointments;
        this.processData(availabilityResponse);
        if (this.viewMode === 'week' || this.viewMode === 'day') {
          this.loadOccupiedSlots();
        } else {
          this.occupiedSlotsByDay = new Map();
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.handleError(err);
      }
    });
  }

  private loadOccupiedSlots(): void {
    const { startDate, endDate } = this.getDateRange();
    const start = new Date(startDate + 'T12:00:00');
    const end = new Date(endDate + 'T12:00:00');
    const days: string[] = [];
    for (let d = new Date(start.getTime()); d.getTime() <= end.getTime(); d.setDate(d.getDate() + 1)) {
      days.push(this.formatDate(d));
    }
    if (days.length === 0) {
      this.occupiedSlotsByDay = new Map();
      return;
    }
    const slotsRequests = days.map(dateStr =>
      this.availabilityService.getAvailableSlots(new Date(dateStr + 'T12:00:00'))
    );
    forkJoin(slotsRequests).subscribe({
      next: (responses) => {
        const nextMap = new Map<string, { start: string; end: string }[]>();
        responses.forEach((res, i) => {
          const dateStr = days[i];
          const occupied = res.slots
            .filter(s => !s.available && !this.isSlotUsedByCurrentUser(dateStr, s.start))
            .map(s => ({ start: s.start, end: s.end }));
          nextMap.set(dateStr, occupied);
        });
        this.occupiedSlotsByDay = nextMap;
      },
      error: () => {
        this.occupiedSlotsByDay = new Map();
      }
    });
  }

  private processData(availabilityResponse: AvailabilityRangeResponse): void {
    this.calendarEvents = [];
    this.dayStates.clear();
    this.availabilityData.clear();

    // Process availability
    availabilityResponse.days.forEach(day => {
      this.availabilityData.set(day.date, day);

      const state = this.mapStatus(day.status);
      this.dayStates.set(day.date, state);
    });

    // Process user appointments as events
    this.userAppointments.forEach(apt => {
      if (this.isActiveAppointment(apt)) {
        this.calendarEvents.push({
          id: apt.id.toString(),
          title: 'Mi Turno',
          description: apt.cancellationReason || '',
          date: apt.date,
          startTime: apt.startTime,
          endTime: apt.endTime,
          status: this.mapAppointmentStatus(apt.state)
        });
      }
    });
  }

  private getDateRange(): { startDate: string; endDate: string } {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

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

  private mapStatus(status: 'FULL' | 'PARTIAL' | 'CLOSED'): 'open' | 'closed' | 'partial' {
    switch (status) {
      case 'FULL':
        return 'open';
      case 'PARTIAL':
        return 'partial';
      case 'CLOSED':
      default:
        return 'closed';
    }
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

  private isSlotUsedByCurrentUser(dateStr: string, startTime: string): boolean {
    return this.calendarEvents.some(
      e => e.date === dateStr && e.startTime === startTime
    );
  }

  /** Solo mostramos en el calendario turnos que siguen ocupando un slot. RESCHEDULED no ocupa: el turno ya fue movido. */
  private isActiveAppointment(appointment: AppointmentResponse): boolean {
    const inactiveStates: AppointmentResponse['state'][] = [
      'CANCELLED',
      'CANCELLED_BY_ADMIN',
      'EXPIRED',
      'NO_SHOW',
      'COMPLETED',
      'RESCHEDULED'  // igual que en admin: el slot viejo no se muestra ni se bloquea
    ];
    return !inactiveStates.includes(appointment.state);
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private handleError(err: any): void {
    if (err.status === 400) {
      this.error = 'Fecha inválida. Por favor, intenta de nuevo.';
    } else if (err.status === 500) {
      this.error = 'Error del servidor. Por favor, intenta más tarde.';
    } else if (err.status === 0 || !err.status) {
      this.error = 'No se pudo conectar con el servidor.';
    } else {
      this.error = 'Error al cargar el calendario.';
    }
    console.error('Error loading calendar data:', err);
  }

  // Event handlers
  onViewModeChange(mode: CalendarViewMode): void {
    this.viewMode = mode;
    this.loadCalendarData();
  }

  onDateChange(date: Date): void {
    this.currentDate = date;
    this.loadCalendarData();
  }

  onDayClick(date: Date): void {
    const dateStr = this.formatDate(date);
    const dayData = this.availabilityData.get(dateStr);

    // Check if day has user appointments
    const hasAppointments = this.calendarEvents.some(e => e.date === dateStr);

    if (hasAppointments) {
      // Show appointment details
      console.log('User appointments for this day:',
        this.calendarEvents.filter(e => e.date === dateStr));
      return;
    }

    // Check if day is available for booking
    if (dayData && (dayData.status === 'FULL' || dayData.status === 'PARTIAL')) {
      const selectedDate = this.parseDateString(dateStr);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      selectedDate.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        this.error = 'No puedes reservar turnos para fechas pasadas';
        return;
      }

      this.selectedDateForModal = dateStr;
      this.isSlotsModalOpen = true;
    }
  }

  onEventClick(event: CalendarEvent): void {
    console.log('Event clicked:', event);
  }

  onSlotClick(data: { date: Date; time: string }): void {
    const dateStr = this.formatDate(data.date);
    this.selectedDateForModal = dateStr;
    this.isSlotsModalOpen = true;
  }

  onNewAppointment(): void {
    // Could open a modal to select date first
    console.log('New appointment clicked');
  }

  onSlotsModalClose(): void {
    this.isSlotsModalOpen = false;
    this.selectedDateForModal = null;
  }

  onAppointmentCreated(): void {
    this.loadCalendarData();
    this.onSlotsModalClose();
  }

  private parseDateString(dateStr: string): Date {
    const parts = dateStr.split('-');
    if (parts.length !== 3) {
      return new Date(dateStr);
    }

    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);

    return new Date(year, month, day);
  }
}
