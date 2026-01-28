import { Component, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NavLinkComponent } from '../../molecules/nav-link/nav-link';
import { ButtonComponent } from '../../atoms/button/button.component';
import { AuthStateService } from '../../../core/services/auth-state';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-dashboard-header',
  standalone: true,
  imports: [CommonModule, NavLinkComponent, ButtonComponent],
  templateUrl: './dashboard-header.html',
  styleUrl: './dashboard-header.css'
})
export class DashboardHeaderComponent {
  private router = inject(Router);
  private authStateService = inject(AuthStateService);
  private authService = inject(AuthService);

  @Output() sidebarToggle = new EventEmitter<void>();
  
  isMenuOpen = false;

  // Sidebar menu items - se mostrarán en el menú responsive en mobile
  sidebarMenuItems = [
    { route: '/dashboard-home', label: 'Dashboard', icon: 'fas fa-home' },
    { route: '#', label: 'Turnos', icon: 'fas fa-calendar-alt' },
    { route: '#', label: 'Clientes', icon: 'fas fa-users' },
    { route: '#', label: 'Configuración', icon: 'fas fa-cog' },
    { route: '#', label: 'Reportes', icon: 'fas fa-chart-bar' }
  ];

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
    if (this.isMenuOpen) {
      // Usar requestAnimationFrame para cálculos del DOM más eficientes
      requestAnimationFrame(() => {
        const header = document.querySelector('.dashboard-header');
        const menu = document.getElementById('dashboard-menu');
        if (header && menu) {
          const headerRect = header.getBoundingClientRect();
          const headerHeight = headerRect.height + headerRect.top;
          (menu as HTMLElement).style.top = `${headerHeight}px`;
        }
      });
    } else {
      // Limpiar el estilo cuando se cierra
      const menu = document.getElementById('dashboard-menu');
      if (menu) {
        (menu as HTMLElement).style.top = '';
      }
    }
  }

  toggleSidebar(): void {
    this.sidebarToggle.emit();
  }

  closeMenu(): void {
    this.isMenuOpen = false;
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.authStateService.clearState();
        this.closeMenu();
        this.router.navigate(['/login']);
      },
      error: () => {
        // Incluso si hay error, limpiar el estado local de todas formas
        // Según US-003: "Se limpia el estado local de todas formas"
        this.authStateService.clearState();
        this.closeMenu();
        this.router.navigate(['/login']);
      }
    });
  }
}
