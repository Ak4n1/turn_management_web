import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { DashboardLayoutComponent } from './dashboard-layout';

/**
 * Dashboard Layout Wrapper Component
 * 
 * Wrapper que usa el layout del dashboard y proyecta el contenido de las rutas hijas.
 * Se usa como componente padre en las rutas del dashboard.
 */
@Component({
  selector: 'app-dashboard-layout-wrapper',
  standalone: true,
  imports: [CommonModule, DashboardLayoutComponent, RouterOutlet],
  template: `
    <app-dashboard-layout>
      <router-outlet></router-outlet>
    </app-dashboard-layout>
  `
})
export class DashboardLayoutWrapperComponent {}

