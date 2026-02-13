import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { AdminUserManagementService } from '../../../admin/services/admin-user-management.service';
import { AdminAppointmentService } from '../../../appointments/admin/services/admin-appointment.service';
import { WebSocketService } from '../../../../core/services/websocket.service';
import { WebSocketMessageType, WebSocketMessage } from '../../../../core/models/websocket-message.model';

@Component({
  selector: 'app-admin-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-dashboard-page.component.html',
  styleUrl: './admin-dashboard-page.component.css'
})
export class AdminDashboardPageComponent implements OnInit {
  private userService = inject(AdminUserManagementService);
  private appointmentService = inject(AdminAppointmentService);
  private ws = inject(WebSocketService);

  loading = signal(true);
  error = signal<string | null>(null);

  onlineCount = signal(0);
  pendingReschedules = signal(0);
  totalAppointmentsToday = signal(0);

  quickLinks = [
    { label: 'Calendario General', route: '/dashboard/admin/calendar/consolidated', icon: 'fas fa-calendar-alt' },
    { label: 'Gestión de Turnos', route: '/dashboard/admin/appointments', icon: 'fas fa-calendar-check' },
    { label: 'Gestión de Usuarios', route: '/dashboard/admin/users', icon: 'fas fa-users-cog' },
    { label: 'Reglas de Atención', route: '/dashboard/admin/calendar/weekly-config', icon: 'fas fa-cog' },
    { label: 'Excepciones', route: '/dashboard/admin/calendar/exceptions', icon: 'fas fa-exclamation-triangle' },
    { label: 'Bloqueos', route: '/dashboard/admin/calendar/blocks', icon: 'fas fa-lock' },
    { label: 'Auditoría', route: '/dashboard/admin/audit', icon: 'fas fa-clipboard-list' }
  ];

  ngOnInit(): void {
    this.loadData();
    this.ws.messages.subscribe((msg: WebSocketMessage) => {
      if (msg.type === WebSocketMessageType.ONLINE_USERS_COUNT || msg.type === WebSocketMessageType.RESCHEDULE_REQUEST_CREATED) {
        this.loadData();
      }
    });
  }

  loadData(): void {
    this.loading.set(true);
    this.error.set(null);

    const today = new Date().toISOString().split('T')[0];

    forkJoin({
      online: this.userService.getOnlineUsersCount().pipe(catchError(() => of({ count: 0, emails: [] }))),
      reschedules: this.appointmentService.getRescheduleRequests({ status: 'PENDING_ADMIN_APPROVAL', size: 1 }).pipe(
        catchError(() => of({ total: 0, requests: [], page: 0, size: 0, totalPages: 0 }))
      ),
      todayAppointments: this.appointmentService.getAppointments({ date: today, size: 1 }).pipe(
        catchError(() => of({ totalElements: 0 }))
      )
    }).subscribe({
      next: (data) => {
        this.onlineCount.set(data.online.count);
        this.pendingReschedules.set(data.reschedules.total ?? 0);
        this.totalAppointmentsToday.set(data.todayAppointments.totalElements ?? 0);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.userMessage || 'Error al cargar el dashboard');
        this.loading.set(false);
      }
    });
  }
}
