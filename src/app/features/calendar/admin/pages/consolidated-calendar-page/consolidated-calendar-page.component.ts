import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminCalendarService } from '../../services/admin-calendar.service';
import { ConsolidatedDayResponse } from '../../models/consolidated-calendar-response.model';
import { SpinnerComponent } from '../../../../../shared/atoms/spinner/spinner.component';
import { ErrorTextComponent } from '../../../../../shared/atoms/error-text/error-text.component';
import { DayDetailModalComponent, DayDetailData } from '../../components/day-detail-modal/day-detail-modal.component';

/**
 * Consolidated Calendar Page Component (Admin)
 * 
 * Página del calendario consolidado para administradores.
 * Muestra qué regla aplica a cada día (BASE, EXCEPTION, BLOCK).
 * 
 * ✅ Usa AdminCalendarService (servicio real con datos del backend)
 */
@Component({
  selector: 'app-consolidated-calendar-page',
  standalone: true,
  imports: [CommonModule, RouterModule, SpinnerComponent, ErrorTextComponent, DayDetailModalComponent],
  templateUrl: './consolidated-calendar-page.component.html',
  styleUrl: './consolidated-calendar-page.component.css'
})
export class ConsolidatedCalendarPageComponent implements OnInit {
  private adminCalendarService = inject(AdminCalendarService);

  currentMonth: Date = new Date();
  days: CalendarDay[] = [];
  isLoading = false;
  error: string | null = null;

  // Modal state
  isModalOpen = false;
  selectedDayData: DayDetailData | null = null;

  ngOnInit(): void {
    this.loadCalendarDays();
  }

  private loadCalendarDays(): void {
    this.isLoading = true;
    this.error = null;

    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const startDate = this.formatDate(firstDay);
    const endDate = this.formatDate(lastDay);

    this.adminCalendarService.getConsolidatedCalendar(startDate, endDate).subscribe({
      next: (response) => {
        // Crear un mapa de días del backend por fecha
        const backendDaysMap = new Map<string, ConsolidatedDayResponse>();
        response.days.forEach(day => {
          backendDaysMap.set(day.date, day);
        });

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
            state: 'CLOSED',
            ruleType: 'BASE',
            ruleDescription: '',
            timeRanges: [],
            hasAppointments: false,
            appointmentsCount: 0,
            isEmpty: true
          });
        }

        // Generar todos los días del mes
        for (let day = 1; day <= lastDay.getDate(); day++) {
          const currentDate = new Date(year, month, day);
          const dateStr = this.formatDate(currentDate);
          const backendDay = backendDaysMap.get(dateStr);

          if (backendDay) {
            // DEBUG: Log para días con turnos
            if (backendDay.hasExistingAppointments && backendDay.appointmentsCount && backendDay.appointmentsCount > 0) {
              console.log(`[DEBUG] Día ${day} (${dateStr}): state=${backendDay.state}, hasAppointments=${backendDay.hasExistingAppointments}, appointmentsCount=${backendDay.appointmentsCount}, timeRanges=${backendDay.timeRanges?.length || 0}`);
            }
            
            // Usar datos del backend
            allDays.push({
              date: backendDay.date,
              day: day,
              state: backendDay.state,
              ruleType: backendDay.ruleType,
              ruleDescription: backendDay.ruleDescription,
              timeRanges: backendDay.timeRanges,
              hasAppointments: backendDay.hasExistingAppointments || false,
              appointmentsCount: backendDay.appointmentsCount || 0,
              isEmpty: false
            });
          } else {
            // Día sin datos del backend - esto no debería pasar, pero por seguridad
            // Si no hay datos, asumimos que está cerrado
            // Log de depuración (solo aparece si hay un problema real)
            console.warn(`[ConsolidatedCalendar] ⚠️ No se encontraron datos del backend para la fecha: ${dateStr}. Usando estado CLOSED por defecto.`);
            allDays.push({
              date: dateStr,
              day: day,
              state: 'CLOSED',
              ruleType: 'BASE',
              ruleDescription: 'Sin datos del backend',
              timeRanges: [],
              hasAppointments: false,
              appointmentsCount: 0,
              isEmpty: false
            });
          }
        }

        this.days = allDays;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err.message || 'Error al cargar el calendario consolidado';
        this.isLoading = false;
        console.error('Error loading consolidated calendar:', err);
      }
    });
  }

  private getDayNumber(dateStr: string): number {
    const date = new Date(dateStr);
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
    this.loadCalendarDays();
  }

  getMonthYear(): string {
    return this.currentMonth.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
  }

  getRuleTypeIcon(ruleType: string): string {
    switch (ruleType) {
      case 'BLOCK':
        return 'fas fa-lock';
      case 'EXCEPTION':
        return 'fas fa-exclamation-triangle';
      case 'BASE':
        return 'fas fa-calendar';
      default:
        return 'fas fa-calendar';
    }
  }

  getStateClass(state: string, hasAppointments: boolean = false): string {
    // Si está cerrado pero tiene turnos existentes, usar clase especial
    if (state === 'CLOSED' && hasAppointments) {
      return 'state-closed-with-appointments';
    }
    
    switch (state) {
      case 'OPEN':
        return 'state-open';
      case 'CLOSED':
        return 'state-closed';
      case 'PARTIAL':
        return 'state-partial';
      default:
        return '';
    }
  }

  onDayClick(day: CalendarDay): void {
    this.selectedDayData = {
      date: day.date,
      state: day.state,
      ruleType: day.ruleType,
      ruleDescription: day.ruleDescription,
      timeRanges: day.timeRanges,
      hasExistingAppointments: day.hasAppointments,
      appointmentsCount: day.appointmentsCount || 0
    };
    this.isModalOpen = true;
  }

  onModalClose(): void {
    this.isModalOpen = false;
    this.selectedDayData = null;
  }

  formatTimeRanges(timeRanges: Array<{ start: string; end: string }>): string {
    if (timeRanges.length === 0) return 'Sin horarios';
    return timeRanges.map(r => `${r.start}-${r.end}`).join(', ');
  }

  isToday(day: CalendarDay): boolean {
    if (day.isEmpty) return false;
    
    const todayStr = this.formatDate(new Date());
    return todayStr === day.date;
  }
}

interface CalendarDay {
  date: string;
  day: number;
  state: 'OPEN' | 'CLOSED' | 'PARTIAL';
  ruleType: 'BASE' | 'EXCEPTION' | 'BLOCK';
  ruleDescription: string;
  timeRanges: Array<{ start: string; end: string }>;
  hasAppointments: boolean;
  appointmentsCount: number;
  isEmpty?: boolean; // Para días vacíos al inicio del mes
}

