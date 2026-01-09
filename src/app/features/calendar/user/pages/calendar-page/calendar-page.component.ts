import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MockAvailabilityService } from '../../services/mock-availability.service';
import { DayAvailabilityResponse } from '../../models/availability-range-response.model';

/**
 * Calendar Page Component (User)
 * 
 * Página principal del calendario de disponibilidad para usuarios.
 * Muestra calendario mensual con días disponibles.
 * 
 * MOCK: Usa MockAvailabilityService que simula GET /api/availability/range
 */
@Component({
  selector: 'app-calendar-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './calendar-page.component.html',
  styleUrl: './calendar-page.component.css'
})
export class CalendarPageComponent implements OnInit {
  private availabilityService = inject(MockAvailabilityService);

  currentMonth: Date = new Date();
  days: CalendarDay[] = [];
  isLoading = false;
  error: string | null = null;

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

    this.availabilityService.getAvailabilityRange(startDate, endDate).subscribe({
      next: (response) => {
        // Mapear respuesta del backend a días del calendario
        this.days = response.days.map(day => ({
          date: day.date,
          day: this.getDayNumber(day.date),
          status: this.mapStatus(day.status),
          availableSlots: day.availableSlots,
          totalSlots: day.totalSlots
        }));
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar el calendario';
        this.isLoading = false;
        console.error('Error loading calendar:', err);
      }
    });
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

  onDayClick(day: CalendarDay): void {
    if (day.status === 'AVAILABLE' || day.status === 'PARTIAL') {
      // Navegar a detalle del día
      // this.router.navigate(['/calendar/day', day.date]);
      console.log('Navegar a día:', day.date);
    }
  }
}

interface CalendarDay {
  date: string;
  day: number;
  status: 'AVAILABLE' | 'UNAVAILABLE' | 'PARTIAL' | 'BLOCKED';
  availableSlots: number;
  totalSlots: number;
}

