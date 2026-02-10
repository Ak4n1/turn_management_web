import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-header.html',
  styleUrl: './dashboard-header.css'
})
export class DashboardHeaderComponent {
  @Output() sidebarToggle = new EventEmitter<void>();

  get todayFormatted(): string {
    return new Date().toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  toggleSidebar(): void {
    this.sidebarToggle.emit();
  }
}
