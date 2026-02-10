import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarDay, CalendarEvent, TimeSlot, OccupiedSlot } from '../calendar-view.model';

@Component({
    selector: 'app-week-view',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './week-view.component.html',
    styleUrl: './week-view.component.css'
})
export class WeekViewComponent {
    @Input() days: CalendarDay[] = [];
    @Input() timeSlots: TimeSlot[] = [];
    @Input() events: CalendarEvent[] = [];

    @Output() dayClick = new EventEmitter<CalendarDay>();
    @Output() eventClick = new EventEmitter<CalendarEvent>();
    @Output() slotClick = new EventEmitter<{ date: Date; time: string }>();

    onDayClick(day: CalendarDay): void {
        this.dayClick.emit(day);
    }

    onEventClick(event: CalendarEvent, e: MouseEvent): void {
        e.stopPropagation();
        this.eventClick.emit(event);
    }

    onSlotClick(day: CalendarDay, slot: TimeSlot): void {
        if (day.state === 'closed') return;
        this.slotClick.emit({ date: day.date, time: slot.label });
    }

    isSlotOpen(day: CalendarDay, hour: number): boolean {
        const state = day.state as string;
        if (state === 'closed') return false;
        if (state === 'open') return true;
        if (!day.ranges || day.ranges.length === 0) return state === 'open';

        // Verificar si la hora cae dentro de algún rango
        return day.ranges.some(range => {
            const startHour = parseInt(range.start.split(':')[0], 10);
            const endHour = parseInt(range.end.split(':')[0], 10);
            return hour >= startHour && hour < endHour;
        });
    }

    getEventsForDayAndHour(day: CalendarDay, hour: number): CalendarEvent[] {
        return day.events.filter(event => {
            const eventHour = parseInt(event.startTime.split(':')[0], 10);
            return eventHour === hour;
        });
    }

    getEventStyle(event: CalendarEvent): { [key: string]: string } {
        return this.getSlotStyle(event.startTime, event.endTime);
    }

    getOccupiedSlotStyle(occ: OccupiedSlot): { [key: string]: string } {
        return this.getSlotStyle(occ.start, occ.end);
    }

    private getSlotStyle(startTime: string, endTime: string): { [key: string]: string } {
        const startParts = startTime.split(':');
        const endParts = endTime.split(':');

        const startHour = parseInt(startParts[0], 10);
        const startMinutes = parseInt(startParts[1], 10) || 0;
        const endHour = parseInt(endParts[0], 10);
        const endMinutes = parseInt(endParts[1], 10) || 0;

        const gridStartMinutes = (this.timeSlots[0]?.hour || 8) * 60;
        const gridTotalMinutes = this.timeSlots.length * 60;

        const eventStartTotal = startHour * 60 + startMinutes;
        const eventEndTotal = endHour * 60 + endMinutes;

        const offsetFromStart = eventStartTotal - gridStartMinutes;
        const duration = eventEndTotal - eventStartTotal;

        const topPercent = (offsetFromStart / gridTotalMinutes) * 100;
        const heightPercent = (duration / gridTotalMinutes) * 100;

        return {
            'top': `${topPercent}%`,
            'height': `${Math.max(heightPercent, 2)}%`,
            'min-height': '24px'
        };
    }

    getStatusClass(status: string): string {
        return `event-${status}`;
    }

    formatEventTime(event: CalendarEvent): string {
        return `${event.startTime} - ${event.endTime}`;
    }
}
