import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarStats } from '../calendar-view.model';

@Component({
    selector: 'app-calendar-stats',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './calendar-stats.component.html',
    styleUrl: './calendar-stats.component.css'
})
export class CalendarStatsComponent {
    @Input() stats: CalendarStats = {
        todayTotal: 0,
        pending: 0,
        confirmed: 0,
        cancelled: 0,
        occupancyPercent: 0
    };
}
