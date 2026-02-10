import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarHeaderComponent } from './calendar-header/calendar-header.component';
import { WeekViewComponent } from './week-view/week-view.component';
import { MonthViewComponent } from './month-view/month-view.component';
import { DayViewComponent } from './day-view/day-view.component';
import { CalendarLegendComponent } from './calendar-legend/calendar-legend.component';
import { CalendarStatsComponent } from './calendar-stats/calendar-stats.component';
import {
    CalendarViewMode,
    CalendarEvent,
    CalendarDay,
    CalendarStats,
    TimeSlot
} from './calendar-view.model';

@Component({
    selector: 'app-calendar-view',
    standalone: true,
    imports: [
        CommonModule,
        CalendarHeaderComponent,
        WeekViewComponent,
        MonthViewComponent,
        DayViewComponent,
        CalendarLegendComponent,
        CalendarStatsComponent
    ],
    templateUrl: './calendar-view.component.html',
    styleUrl: './calendar-view.component.css'
})
export class CalendarViewComponent implements OnInit, OnChanges {
    @Input() viewMode: CalendarViewMode = 'week';
    @Input() currentDate: Date = new Date();
    @Input() events: CalendarEvent[] = [];
    @Input() dayStates: Map<string, 'open' | 'closed' | 'partial'> = new Map();
    @Input() dayRanges: Map<string, { start: string; end: string }[]> = new Map();
    @Input() occupiedSlotsByDay: Map<string, { start: string; end: string }[]> = new Map();
    @Input() showNewAppointmentButton = true;
    @Input() showStats = true;
    @Input() showLegend = true;

    @Output() viewModeChange = new EventEmitter<CalendarViewMode>();
    @Output() dateChange = new EventEmitter<Date>();
    @Output() eventClick = new EventEmitter<CalendarEvent>();
    @Output() dayClick = new EventEmitter<Date>();
    @Output() slotClick = new EventEmitter<{ date: Date; time: string }>();
    @Output() newAppointmentClick = new EventEmitter<void>();

    days: CalendarDay[] = [];
    timeSlots: TimeSlot[] = [];
    stats: CalendarStats = {
        todayTotal: 0,
        pending: 0,
        confirmed: 0,
        cancelled: 0,
        occupancyPercent: 0
    };

    private readonly dayNames = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
    private readonly dayNamesFull = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    ngOnInit(): void {
        this.generateTimeSlots();
        this.buildCalendarData();
        this.calculateStats();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['currentDate'] || changes['events'] || changes['viewMode'] || changes['occupiedSlotsByDay']) {
            this.buildCalendarData();
            this.calculateStats();
        }
    }

    private generateTimeSlots(): void {
        this.timeSlots = [];
        // Rango fijo para evitar saltos en la columna de horarios: 8 AM a 10 PM
        for (let hour = 8; hour <= 22; hour++) {
            this.timeSlots.push({
                hour,
                label: `${hour.toString().padStart(2, '0')}:00`
            });
        }
    }

    private buildCalendarData(): void {
        switch (this.viewMode) {
            case 'week':
                this.buildWeekData();
                break;
            case 'month':
                this.buildMonthData();
                break;
            case 'day':
                this.buildDayData();
                break;
        }
    }

    private buildWeekData(): void {
        const startOfWeek = this.getStartOfWeek(this.currentDate);
        this.days = [];

        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            date.setHours(12, 0, 0, 0); // Normalizar a mediodía local
            this.days.push(this.createCalendarDay(date));
        }
    }

    private buildMonthData(): void {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        this.days = [];

        // Días vacíos al inicio
        const startDayOfWeek = firstDay.getDay();
        const emptyDays = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

        for (let i = 0; i < emptyDays; i++) {
            const prevDate = new Date(year, month, -emptyDays + i + 1);
            const day = this.createCalendarDay(prevDate);
            day.isCurrentMonth = false;
            this.days.push(day);
        }

        // Días del mes
        for (let d = 1; d <= lastDay.getDate(); d++) {
            const date = new Date(year, month, d);
            this.days.push(this.createCalendarDay(date));
        }

        // Días al final para completar la grilla
        const remainingDays = 42 - this.days.length;
        for (let i = 1; i <= remainingDays; i++) {
            const nextDate = new Date(year, month + 1, i);
            const day = this.createCalendarDay(nextDate);
            day.isCurrentMonth = false;
            this.days.push(day);
        }
    }

    private buildDayData(): void {
        this.days = [this.createCalendarDay(this.currentDate)];
    }

    private createCalendarDay(date: Date): CalendarDay {
        const dateString = this.formatDate(date);
        const today = new Date();

        return {
            date,
            dateString,
            dayNumber: date.getDate(),
            dayName: this.dayNames[date.getDay()],
            events: this.getEventsForDate(dateString),
            isToday: this.isSameDay(date, today),
            isCurrentMonth: date.getMonth() === this.currentDate.getMonth(),
            state: this.dayStates.get(dateString),
            ranges: this.dayRanges.get(dateString),
            occupiedSlots: this.occupiedSlotsByDay.get(dateString) || []
        };
    }

    private getEventsForDate(dateString: string): CalendarEvent[] {
        return this.events.filter(event => event.date === dateString && event.status !== 'cancelled');
    }

    private getStartOfWeek(date: Date): Date {
        const d = new Date(date);
        d.setHours(12, 0, 0, 0); // Normalizar a mediodía local
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Lunes como inicio
        d.setDate(diff);
        return d;
    }

    private formatDate(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    private isSameDay(date1: Date, date2: Date): boolean {
        return date1.getFullYear() === date2.getFullYear() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getDate() === date2.getDate();
    }

    private calculateStats(): void {
        const todayStr = this.formatDate(new Date());
        const todayEvents = this.events.filter(e => e.date === todayStr);

        this.stats = {
            todayTotal: todayEvents.length,
            pending: todayEvents.filter(e => e.status === 'pending').length,
            confirmed: todayEvents.filter(e => e.status === 'confirmed').length,
            cancelled: todayEvents.filter(e => e.status === 'cancelled').length,
            occupancyPercent: this.calculateOccupancy()
        };
    }

    private calculateOccupancy(): number {
        // Calcular ocupación basada en slots disponibles vs ocupados
        const totalSlots = this.timeSlots.length * 7; // Simplificado
        const usedSlots = this.events.filter(e => e.status !== 'cancelled').length;
        return Math.round((usedSlots / totalSlots) * 100);
    }

    // Event handlers
    onViewModeChange(mode: CalendarViewMode): void {
        this.viewMode = mode;
        this.viewModeChange.emit(mode);
        this.buildCalendarData();
    }

    onNavigate(direction: 'prev' | 'next' | 'today'): void {
        if (direction === 'today') {
            this.currentDate = new Date();
        } else {
            const newDate = new Date(this.currentDate);

            switch (this.viewMode) {
                case 'day':
                    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
                    break;
                case 'week':
                    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
                    break;
                case 'month':
                    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
                    break;
            }

            this.currentDate = newDate;
        }

        this.dateChange.emit(this.currentDate);
        this.buildCalendarData();
    }

    onDayClick(day: CalendarDay): void {
        if (day.state === 'closed') return;
        this.dayClick.emit(day.date);
    }

    onEventClick(event: CalendarEvent): void {
        this.eventClick.emit(event);
    }

    onSlotClick(date: Date, time: string): void {
        this.slotClick.emit({ date, time });
    }

    onNewAppointment(): void {
        this.newAppointmentClick.emit();
    }

    getDateRangeLabel(): string {
        const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric' };
        const yearOptions: Intl.DateTimeFormatOptions = { year: 'numeric' };

        switch (this.viewMode) {
            case 'week':
                const start = this.getStartOfWeek(this.currentDate);
                const end = new Date(start);
                end.setDate(end.getDate() + 6);
                const startStr = start.toLocaleDateString('es-AR', options);
                const endStr = end.toLocaleDateString('es-AR', options);
                const year = end.toLocaleDateString('es-AR', yearOptions);
                return `${startStr} – ${endStr}, ${year}`;

            case 'month':
                return this.currentDate.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });

            case 'day':
                return this.currentDate.toLocaleDateString('es-AR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                });

            default:
                return '';
        }
    }
}
