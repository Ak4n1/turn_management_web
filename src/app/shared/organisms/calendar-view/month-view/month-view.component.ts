import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarDay, CalendarEvent } from '../calendar-view.model';

@Component({
    selector: 'app-month-view',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './month-view.component.html',
    styleUrl: './month-view.component.css'
})
export class MonthViewComponent {
    @Input() days: CalendarDay[] = [];

    @Output() dayClick = new EventEmitter<CalendarDay>();
    @Output() eventClick = new EventEmitter<CalendarEvent>();

    readonly weekDays = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];

    onDayClick(day: CalendarDay): void {
        this.dayClick.emit(day);
    }

    onEventClick(event: CalendarEvent, e: MouseEvent): void {
        e.stopPropagation();
        this.eventClick.emit(event);
    }

    getStatusClass(status: string): string {
        return `event-dot-${status}`;
    }

    getVisibleEvents(day: CalendarDay): CalendarEvent[] {
        return day.events.slice(0, 3);
    }

    getRemainingCount(day: CalendarDay): number {
        return Math.max(0, day.events.length - 3);
    }
}
