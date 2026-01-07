import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../organisms/sidebar/sidebar';
import { DashboardHeaderComponent } from '../../organisms/dashboard-header/dashboard-header';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, SidebarComponent, DashboardHeaderComponent],
  templateUrl: './dashboard-layout.html',
  styleUrl: './dashboard-layout.css'
})
export class DashboardLayoutComponent {
  @ViewChild('sidebar') sidebarComponent!: SidebarComponent;
  @ViewChild('dashboardHeader') headerComponent!: DashboardHeaderComponent;

  ngAfterViewInit(): void {
    // Conectar el header con el sidebar
    if (this.headerComponent) {
      this.headerComponent.sidebarToggle.subscribe(() => {
        if (this.sidebarComponent) {
          this.sidebarComponent.toggleSidebar();
        }
      });
    }
  }
}
