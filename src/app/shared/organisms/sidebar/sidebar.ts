import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class SidebarComponent {
  isOpen = false;

  // Placeholder buttons - solo diseño por ahora
  menuItems = [
    { label: 'Dashboard', icon: 'fas fa-home' },
    { label: 'Turnos', icon: 'fas fa-calendar-alt' },
    { label: 'Clientes', icon: 'fas fa-users' },
    { label: 'Configuración', icon: 'fas fa-cog' },
    { label: 'Reportes', icon: 'fas fa-chart-bar' }
  ];

  toggleSidebar(): void {
    this.isOpen = !this.isOpen;
  }

  closeSidebar(): void {
    this.isOpen = false;
  }

  onMenuItemClick(item: any): void {
    // Placeholder - no hace nada por ahora
    console.log('Clicked:', item.label);
    this.closeSidebar();
  }
}
