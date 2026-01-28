import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { forkJoin, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AvailabilityService } from '../../services/availability.service';
import { AppointmentService, MyAppointmentsResponse } from '../../../../appointments/user/services/appointment.service';
import { DayAvailabilityResponse, AvailabilityRangeResponse } from '../../models/availability-range-response.model';
import { AppointmentResponse } from '../../../../appointments/user/models/appointment-response.model';
import { SlotsModalComponent } from '../../components/slots-modal/slots-modal.component';

/**
 * Calendar Page Component (User)
 * 
 * Página principal del calendario de disponibilidad para usuarios.
 * Muestra calendario mensual con días disponibles.
 * 
 * US-F008: Integrado con GET /api/availability/range del backend real
 * US-F009: Modal de slots para crear turnos
 */
@Component({
  selector: 'app-calendar-page',
  standalone: true,
  imports: [CommonModule, RouterModule, SlotsModalComponent],
  templateUrl: './calendar-page.component.html',
  styleUrl: './calendar-page.component.css'
})
export class CalendarPageComponent implements OnInit, OnDestroy {
  private availabilityService = inject(AvailabilityService);
  private appointmentService = inject(AppointmentService);
  private router = inject(Router);

  currentMonth: Date = new Date();
  days: CalendarDay[] = [];
  userAppointments: AppointmentResponse[] = [];
  isLoading = false;
  error: string | null = null;

  // Modal state
  isSlotsModalOpen = false;
  selectedDateForModal: string | null = null;

  private routerSubscription?: Subscription;

  ngOnInit(): void {
    this.loadCalendarData();
    
    // Recargar datos cuando se navega a esta ruta (útil cuando se vuelve desde otras páginas)
    this.routerSubscription = this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd)
      )
      .subscribe((event: NavigationEnd) => {
        // Solo recargar si la URL actual es la del calendario
        if (event.url.includes('/calendar') || event.url === '/') {
          this.loadCalendarData();
        }
      });
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  private loadCalendarData(): void {
    // Cargar disponibilidad y turnos en paralelo
    this.isLoading = true;
    this.error = null;

    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const startDate = this.formatDate(firstDay);
    const endDate = this.formatDate(lastDay);

    // Cargar disponibilidad y turnos en paralelo
    const availability$ = this.availabilityService.getAvailabilityRange(startDate, endDate);
    const appointments$ = this.appointmentService.getMyAppointments({
      fromDate: startDate,
      toDate: endDate,
      page: 0,
      size: 100
    });

    // Combinar ambos observables usando forkJoin para esperar ambos
    forkJoin({
      availability: availability$,
      appointments: appointments$
    }).subscribe({
      next: ({ availability: availabilityResponse, appointments: appointmentsResponse }) => {
        this.userAppointments = appointmentsResponse.appointments;
        this.buildCalendarDays(availabilityResponse);
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        
        if (err.status === 400) {
          this.error = 'Fecha inválida. Por favor, intenta de nuevo.';
        } else if (err.status === 500) {
          this.error = 'Error del servidor al cargar el calendario. Por favor, intenta más tarde.';
        } else if (err.status === 0 || !err.status) {
          this.error = 'No se pudo conectar con el servidor. Verifica tu conexión a internet.';
        } else {
          this.error = 'Error al cargar el calendario. Por favor, intenta de nuevo.';
        }
        
        console.error('Error loading calendar data:', err);
      }
    });
  }

  private buildCalendarDays(availabilityResponse: AvailabilityRangeResponse): void {
    // Crear un mapa de días del backend por fecha
    const backendDaysMap = new Map<string, DayAvailabilityResponse>();
    availabilityResponse.days.forEach(day => {
      backendDaysMap.set(day.date, day);
    });

    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Generar todos los días del mes
    const allDays: CalendarDay[] = [];
    const firstDayOfWeek = firstDay.getDay(); // 0 = Domingo, 1 = Lunes, etc.
    
    // Agregar días vacíos al inicio para alinear el calendario
    // El calendario empieza en lunes (columna 0), así que:
    // - Si el mes empieza en lunes (1), no agregar días vacíos
    // - Si el mes empieza en martes (2), agregar 1 día vacío
    // - Si el mes empieza en miércoles (3), agregar 2 días vacíos
    // - Si el mes empieza en jueves (4), agregar 3 días vacíos
    // - Si el mes empieza en viernes (5), agregar 4 días vacíos
    // - Si el mes empieza en sábado (6), agregar 5 días vacíos
    // - Si el mes empieza en domingo (0), agregar 6 días vacíos
    const emptyDaysCount = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    for (let i = 0; i < emptyDaysCount; i++) {
      allDays.push({
        date: `empty-${i}`,
        day: 0,
        status: 'UNAVAILABLE',
        availableSlots: 0,
        totalSlots: 0,
        isEmpty: true
      });
    }

    // Generar todos los días del mes
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const currentDate = new Date(year, month, day);
      const dateStr = this.formatDate(currentDate);
      const backendDay = backendDaysMap.get(dateStr);

      // Buscar turnos del usuario para este día (solo activos, excluir cancelados/completados)
      const dayAppointments = this.userAppointments.filter(apt => 
        apt.date === dateStr && this.isActiveAppointment(apt)
      );

      if (backendDay) {
        // Usar datos del backend
        allDays.push({
          date: backendDay.date,
          day: day,
          status: this.mapStatus(backendDay.status),
          availableSlots: backendDay.availableSlots,
          totalSlots: backendDay.totalSlots,
          appointments: dayAppointments,
          appointmentsCount: dayAppointments.length,
          isEmpty: false
        });
      } else {
        // Día sin datos del backend - asumir cerrado
        allDays.push({
          date: dateStr,
          day: day,
          status: 'UNAVAILABLE',
          availableSlots: 0,
          totalSlots: 0,
          appointments: dayAppointments,
          appointmentsCount: dayAppointments.length,
          isEmpty: false
        });
      }
    }

    this.days = allDays;
  }

  private mapStatus(status: 'FULL' | 'PARTIAL' | 'CLOSED'): 'AVAILABLE' | 'UNAVAILABLE' | 'PARTIAL' | 'BLOCKED' {
    switch (status) {
      case 'FULL':
        return 'AVAILABLE';
      case 'PARTIAL':
        return 'PARTIAL';
      case 'CLOSED':
        return 'UNAVAILABLE';
      default:
        return 'UNAVAILABLE';
    }
  }

  private getDayNumber(dateStr: string): number {
    // Parsear fecha manualmente para evitar problemas de zona horaria
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return parseInt(parts[2], 10);
    }
    // Fallback
    const date = this.parseDateString(dateStr);
    return date.getDate();
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  navigateMonth(direction: 'prev' | 'next'): void {
    if (direction === 'prev') {
      this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, 1);
    } else {
      this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 1);
    }
    this.loadCalendarData();
  }

  // Método público para reintentar desde el template
  retry(): void {
    this.loadCalendarData();
  }

  getMonthYear(): string {
    return this.currentMonth.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
  }


  onSlotsModalClose(): void {
    this.isSlotsModalOpen = false;
    this.selectedDateForModal = null;
  }


  onAppointmentCreated(): void {
    // Recargar calendario completo (disponibilidad + turnos)
    this.loadCalendarData();
    this.onSlotsModalClose();
  }

  onDayClick(day: CalendarDay): void {
    if (day.isEmpty) return;
    
    // Si el día tiene turnos del usuario, permitir click para ver detalles
    // Por ahora solo loguear, pero podríamos abrir un modal o navegar
    if (day.appointments && day.appointments.length > 0) {
      console.log('Turnos del día:', day.appointments);
      // TODO: Abrir modal con detalles de turnos o navegar a mis turnos
      // Por ahora el usuario puede ver sus turnos visualmente en el calendario
      return;
    }
    
    // Si no tiene turnos y está disponible, abrir modal para crear uno
    if (day.status === 'AVAILABLE' || day.status === 'PARTIAL') {
      // Validar que el día no sea pasado usando parseo manual
      const selectedDate = this.parseDateString(day.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      selectedDate.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        this.error = 'No puedes reservar turnos para fechas pasadas';
        return;
      }

      // Abrir modal de slots
      this.selectedDateForModal = day.date;
      this.isSlotsModalOpen = true;
    }
  }

  isToday(day: CalendarDay): boolean {
    if (day.isEmpty) return false;
    
    // Comparar fechas directamente como strings YYYY-MM-DD
    const today = new Date();
    const todayStr = this.formatDate(today);
    return todayStr === day.date;
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

  getStateClass(status: string): string {
    switch (status) {
      case 'AVAILABLE':
        return 'state-open';
      case 'PARTIAL':
        return 'state-partial';
      case 'UNAVAILABLE':
        return 'state-closed';
      case 'BLOCKED':
        return 'state-closed';
      default:
        return '';
    }
  }

  /**
   * Determina si un turno está activo y debe mostrarse en el calendario
   * Excluye turnos cancelados, completados, expirados y no asistidos
   */
  private isActiveAppointment(appointment: AppointmentResponse): boolean {
    const inactiveStates: AppointmentResponse['state'][] = [
      'CANCELLED',
      'CANCELLED_BY_ADMIN',
      'EXPIRED',
      'NO_SHOW',
      'COMPLETED'
    ];
    return !inactiveStates.includes(appointment.state);
  }
}

interface CalendarDay {
  date: string;
  day: number;
  status: 'AVAILABLE' | 'UNAVAILABLE' | 'PARTIAL' | 'BLOCKED';
  availableSlots: number;
  totalSlots: number;
  appointments?: AppointmentResponse[];
  appointmentsCount?: number;
  isEmpty?: boolean; // Para días vacíos al inicio del mes
}

