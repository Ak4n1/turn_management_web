import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarDay, CalendarEvent, TimeSlot, OccupiedSlot } from '../calendar-view.model';

@Component({
    selector: 'app-day-view',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './day-view.component.html',
    styleUrl: './day-view.component.css'
})
export class DayViewComponent {
    @Input() day: CalendarDay | null = null;
    @Input() timeSlots: TimeSlot[] = [];

    @Output() eventClick = new EventEmitter<CalendarEvent>();
    @Output() slotClick = new EventEmitter<{ date: Date; time: string }>();

    onEventClick(event: CalendarEvent, e: MouseEvent): void {
        e.stopPropagation();
        this.eventClick.emit(event);
    }

    onSlotClick(slot: TimeSlot): void {
        if (this.day) {
            this.slotClick.emit({ date: this.day.date, time: slot.label });
        }
    }

    isSlotOpen(hour: number): boolean {
        if (!this.day) return false;
        const state = this.day.state as string;
        if (state === 'closed') return false;
        if (state === 'open') return true;
        if (!this.day.ranges || this.day.ranges.length === 0) return state === 'open';

        return this.day.ranges.some(range => {
            const startHour = parseInt(range.start.split(':')[0], 10);
            const endHour = parseInt(range.end.split(':')[0], 10);
            return hour >= startHour && hour < endHour;
        });
    }

    getEventsForHour(hour: number): CalendarEvent[] {
        if (!this.day) return [];
        return this.day.events.filter(event => {
            const eventHour = parseInt(event.startTime.split(':')[0], 10);
            return eventHour === hour;
        });
    }

    getStatusClass(status: string): string {
        return `event-${status}`;
    }

    formatEventTime(event: CalendarEvent): string {
        return `${event.startTime} - ${event.endTime}`;
    }

    getDayTitle(): string {
        if (!this.day) return '';
        const options: Intl.DateTimeFormatOptions = {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        };
        return this.day.date.toLocaleDateString('es-AR', options);
    }

    getEventStyle(event: CalendarEvent): { [key: string]: string } {
        return this.getSlotStyle(event.startTime, event.endTime);
    }

    getOccupiedSlotStyle(occ: OccupiedSlot): { [key: string]: string } {
        const style = this.getSlotStyle(occ.start, occ.end);
        style['position'] = 'absolute';
        style['z-index'] = '10';
        return style;
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
            'height': `${Math.max(heightPercent, 2)}%`
        };
    }
}
