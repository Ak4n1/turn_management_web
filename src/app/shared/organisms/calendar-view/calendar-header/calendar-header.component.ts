import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarViewMode } from '../calendar-view.model';

@Component({
    selector: 'app-calendar-header',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './calendar-header.component.html',
    styleUrl: './calendar-header.component.css'
})
export class CalendarHeaderComponent {
    @Input() dateLabel: string = '';
    @Input() viewMode: CalendarViewMode = 'week';

    @Output() navigate = new EventEmitter<'prev' | 'next' | 'today'>();
    @Output() viewModeChange = new EventEmitter<CalendarViewMode>();

    onPrev(): void {
        this.navigate.emit('prev');
    }

    onNext(): void {
        this.navigate.emit('next');
    }

    onToday(): void {
        this.navigate.emit('today');
    }

    onViewModeChange(mode: CalendarViewMode): void {
        this.viewModeChange.emit(mode);
    }
}
