import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-calendar-legend',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './calendar-legend.component.html',
    styleUrl: './calendar-legend.component.css'
})
export class CalendarLegendComponent {
    readonly statuses = [
        { key: 'confirmed', label: 'Confirmado', color: '#3B82F6' },
        { key: 'pending', label: 'Pendiente', color: '#F59E0B' },
        { key: 'cancelled', label: 'Cancelado', color: '#EF4444' }
    ];
}
