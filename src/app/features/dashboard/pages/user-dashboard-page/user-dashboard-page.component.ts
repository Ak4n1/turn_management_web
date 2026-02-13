import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BaseChartDirective } from 'ng2-charts';
import type { ChartData, ChartConfiguration } from 'chart.js';

import { AppointmentService } from '../../../appointments/user/services/appointment.service';
import { UserNotificationService } from '../../../notifications/services/user-notification.service';
import { AvailabilityService } from '../../../calendar/user/services/availability.service';
import { WebSocketService } from '../../../../core/services/websocket.service';
import { WebSocketMessageType, WebSocketMessage } from '../../../../core/models/websocket-message.model';

import type { AppointmentResponse } from '../../../appointments/user/models/appointment-response.model';
import type { SystemNotificationResponse } from '../../../notifications/models/system-notification-response.model';
import type { DayAvailabilityResponse } from '../../../calendar/user/models/availability-range-response.model';

import { formatActivityDate, formatActivityTime, formatNotificationDate, getStateLabel, getStateClass, getActivityIcon, getActivityIconClass } from '../../utils/activity-display.util';
import { CancelAppointmentModalComponent } from '../../../appointments/user/components/cancel-appointment-modal/cancel-appointment-modal.component';
import { RescheduleAppointmentModalComponent } from '../../../appointments/user/components/reschedule-appointment-modal/reschedule-appointment-modal.component';
import { AppointmentDetailsModalComponent } from '../../../appointments/user/components/appointment-details-modal/appointment-details-modal.component';

@Component({
  selector: 'app-user-dashboard-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    BaseChartDirective,
    CancelAppointmentModalComponent,
    RescheduleAppointmentModalComponent,
    AppointmentDetailsModalComponent
  ],
  templateUrl: './user-dashboard-page.component.html',
  styleUrl: './user-dashboard-page.component.css'
})
export class UserDashboardPageComponent implements OnInit, OnDestroy {
  private appointmentService = inject(AppointmentService);
  private notificationService = inject(UserNotificationService);
  private availabilityService = inject(AvailabilityService);
  private ws = inject(WebSocketService);
  private router = inject(Router);
  private countdownInterval: ReturnType<typeof setInterval> | null = null;

  loading = signal(true);
  error = signal<string | null>(null);
  confirmedAppointments = signal<AppointmentResponse[]>([]);
  heroIndex = signal(0);
  nextAppointment = computed(() => {
    const list = this.confirmedAppointments();
    const i = this.heroIndex();
    return list[i] ?? null;
  });
  recentActivity = signal<SystemNotificationResponse[]>([]);
  alerts = signal<SystemNotificationResponse[]>([]);
  upcomingSlots = signal<DayAvailabilityResponse[]>([]);
  activeCount = signal(0);
  pendingCount = signal(0);
  cancelledThisMonth = signal(0);
  noShowCount = signal(0);
  attendanceRate = signal(100);
  countdown = signal<string | null>(null);
  weekSummary = signal<{ total: number; confirmed: number; pending: number; cancelled: number }>({ total: 0, confirmed: 0, pending: 0, cancelled: 0 });
  heatmapData = signal<{ date: string; state: string }[]>([]);
  urgentAlerts = signal<{ title: string; message: string; type: 'confirm' | 'expire' }[]>([]);
  barChartData = signal<ChartData<'bar'>>({ labels: [], datasets: [] });

  barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: { y: { beginAtZero: true } },
    plugins: { legend: { position: 'bottom' } }
  };

  formatDate = formatActivityDate;
  formatTime = formatActivityTime;
  formatNotificationDate = formatNotificationDate;
  getStateLabel = getStateLabel;
  getStateClass = getStateClass;
  getActivityIcon = getActivityIcon;
  getActivityIconClass = getActivityIconClass;

  confirmAppointment = (id: number): void => {
    this.appointmentService.confirmAppointment(id).subscribe({
      next: () => this.loadData(),
      error: (err) => this.error.set(err?.userMessage || 'Error')
    });
  };

  isDetailsModalOpen = false;
  isCancelModalOpen = false;
  appointmentToCancel: AppointmentResponse | null = null;
  isCancelling = false;
  isRescheduleModalOpen = false;
  appointmentToReschedule: AppointmentResponse | null = null;
  isRequestingReschedule = false;

  openDetailsModal = (apt: AppointmentResponse): void => {
    this.selectedAppointmentForModal = apt;
    this.isDetailsModalOpen = true;
  };

  closeDetailsModal = (): void => {
    this.isDetailsModalOpen = false;
    this.selectedAppointmentForModal = null;
  };

  openCancelModal = (apt: AppointmentResponse): void => {
    this.appointmentToCancel = apt;
    this.isCancelModalOpen = true;
  };

  closeCancelModal = (): void => {
    this.isCancelModalOpen = false;
    this.appointmentToCancel = null;
    this.isCancelling = false;
  };

  onCancelConfirm = (reason: string | undefined): void => {
    if (!this.appointmentToCancel) return;
    this.isCancelling = true;
    this.appointmentService.cancelAppointment(this.appointmentToCancel.id, reason).subscribe({
      next: () => {
        this.loadData();
        this.closeCancelModal();
      },
      error: (err) => {
        this.error.set(err?.userMessage || 'Error al cancelar');
        this.isCancelling = false;
      }
    });
  };

  openRescheduleModal = (apt: AppointmentResponse): void => {
    this.appointmentToReschedule = apt;
    this.isRescheduleModalOpen = true;
  };

  closeRescheduleModal = (): void => {
    this.isRescheduleModalOpen = false;
    this.appointmentToReschedule = null;
    this.isRequestingReschedule = false;
  };

  onRescheduleRequested = (): void => {
    this.loadData();
    this.closeRescheduleModal();
  };

  selectedAppointmentForModal: AppointmentResponse | null = null;

  prevHero = (): void => {
    const list = this.confirmedAppointments();
    const i = this.heroIndex();
    this.heroIndex.set(i > 0 ? i - 1 : list.length - 1);
  };

  nextHero = (): void => {
    const list = this.confirmedAppointments();
    const i = this.heroIndex();
    this.heroIndex.set(i < list.length - 1 ? i + 1 : 0);
  };

  getRescheduleAgo = (updatedAt: string | null | undefined): string | null => {
    if (!updatedAt) return null;
    const d = new Date(updatedAt);
    const diff = Date.now() - d.getTime();
    if (diff < 3600000) return `hace ${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return `hace ${Math.floor(diff / 3600000)}h`;
    return `hace ${Math.floor(diff / 86400000)} días`;
  };

  getHeatmapColor = (state: string): string => {
    if (state === 'COMPLETED') return '#10B981';
    if (state === 'CANCELLED' || state === 'CANCELLED_BY_ADMIN' || state === 'EXPIRED') return '#EF4444';
    if (state === 'CONFIRMED' || state === 'CREATED') return '#3B82F6';
    return '#94A3B8';
  };

  loadData = (): void => {
    this.loading.set(true);
    this.error.set(null);
    const today = new Date();
    const start = today.toISOString().split('T')[0];
    const end = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const pastStart = new Date(today);
    pastStart.setMonth(pastStart.getMonth() - 6);
    const pastStartStr = pastStart.toISOString().split('T')[0];

    forkJoin({
      upcoming: this.appointmentService.getMyAppointments({ upcoming: true, size: 100, sortOrder: 'asc' }).pipe(
        catchError(() => of({ appointments: [], total: 0, page: 0, size: 0, totalPages: 0 }))
      ),
      active: this.appointmentService.getMyAppointments({ status: 'CONFIRMED', upcoming: true, size: 1 }).pipe(
        catchError(() => of({ total: 0 }))
      ),
      pending: this.appointmentService.getMyAppointments({ status: 'CREATED', upcoming: true, size: 1 }).pipe(
        catchError(() => of({ total: 0 }))
      ),
      recent: this.notificationService.getNotifications({ page: 0, size: 8 }).pipe(
        catchError(() => of({ notifications: [], totalElements: 0, totalPages: 0, number: 0, size: 0, unreadCount: 0 }))
      ),
      unread: this.notificationService.getNotifications({ read: false, size: 4 }).pipe(
        catchError(() => of({ notifications: [], totalElements: 0, totalPages: 0, number: 0, size: 0, unreadCount: 0 }))
      ),
      availability: this.availabilityService.getAvailabilityRange(start, end).pipe(
        catchError(() => of({ startDate: '', endDate: '', days: [] }))
      ),
      past: this.appointmentService.getMyAppointments({ past: true, fromDate: pastStartStr, toDate: start, size: 100, sortOrder: 'desc' }).pipe(
        catchError(() => of({ appointments: [], total: 0 }))
      )
    }).subscribe({
      next: (data) => {
        const upcoming = data.upcoming.appointments ?? [];
        const confirmed = upcoming.filter((a: AppointmentResponse) => a.state === 'CONFIRMED');
        const soonest = upcoming[0] ?? null;
        const past = data.past.appointments ?? [];
        this.confirmedAppointments.set(confirmed);
        this.heroIndex.set(0);
        this.activeCount.set(data.active.total);
        this.pendingCount.set(data.pending.total);
        this.recentActivity.set(data.recent.notifications ?? []);
        this.alerts.set(data.unread.notifications ?? []);

        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
        const startOfWeek = new Date(today);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        const weekStartStr = startOfWeek.toISOString().split('T')[0];
        const weekEndStr = endOfWeek.toISOString().split('T')[0];

        const cancelled = past.filter(a => (a.state === 'CANCELLED' || a.state === 'CANCELLED_BY_ADMIN') && a.date >= startOfMonth && a.date <= endOfMonth);
        const noShow = past.filter(a => a.state === 'NO_SHOW');
        const completed = past.filter(a => a.state === 'COMPLETED');
        const totalAtt = completed.length + noShow.length;
        this.cancelledThisMonth.set(cancelled.length);
        this.noShowCount.set(noShow.length);
        this.attendanceRate.set(totalAtt === 0 ? 100 : Math.round((completed.length / totalAtt) * 100));

        const weekAppts = [...past, ...upcoming].filter(a => a.date >= weekStartStr && a.date <= weekEndStr);
        this.weekSummary.set({
          total: weekAppts.length,
          confirmed: weekAppts.filter(a => a.state === 'CONFIRMED').length,
          pending: weekAppts.filter(a => a.state === 'CREATED').length,
          cancelled: weekAppts.filter(a => a.state === 'CANCELLED' || a.state === 'CANCELLED_BY_ADMIN').length
        });

        const heatmap = [...past, ...upcoming].map(a => ({ date: a.date, state: a.state }));
        this.heatmapData.set(heatmap);

        const urgent: { title: string; message: string; type: 'confirm' | 'expire' }[] = [];
        if (soonest?.state === 'CREATED' && soonest.expiresAt) {
          const exp = new Date(soonest.expiresAt);
          if (exp.getTime() - Date.now() < 4 * 3600000) {
            urgent.push({ title: 'Confirmá tu turno', message: `Vence a las ${exp.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`, type: 'confirm' });
          }
        }
        if (soonest && (soonest.state === 'CONFIRMED' || soonest.state === 'CREATED')) {
          const start = new Date(soonest.date + 'T' + soonest.startTime);
          const diff = start.getTime() - Date.now();
          if (diff > 0 && diff < 3 * 3600000) {
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            urgent.push({ title: 'Tu turno comienza pronto', message: h > 0 ? `En ${h}h ${m}min` : `En ${m} minutos`, type: 'expire' });
          }
        }
        this.urgentAlerts.set(urgent);

        const days = (data.availability.days ?? []).filter((d: DayAvailabilityResponse) => d.availableSlots > 0);
        this.upcomingSlots.set(days.slice(0, 6));
        this.buildCharts(upcoming, past);
        this.startCountdown();
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.userMessage || 'Error al cargar');
        this.loading.set(false);
      }
    });
  };

  private buildCharts(upcoming: AppointmentResponse[], past: AppointmentResponse[]): void {
    const all = [...upcoming, ...past];
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const byMonthConfirmed = new Map<string, number>();
    const byMonthCancelled = new Map<string, number>();
    for (const a of all) {
      const m = a.date.substring(0, 7);
      if (a.state === 'CONFIRMED') {
        byMonthConfirmed.set(m, (byMonthConfirmed.get(m) || 0) + 1);
      } else if (a.state === 'CANCELLED' || a.state === 'CANCELLED_BY_ADMIN') {
        byMonthCancelled.set(m, (byMonthCancelled.get(m) || 0) + 1);
      }
    }
    const today = new Date();
    const labels: string[] = [];
    const dataConfirmed: number[] = [];
    const dataCancelled: number[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = d.toISOString().substring(0, 7);
      const [, m] = key.split('-');
      labels.push(months[parseInt(m, 10) - 1] + ' ' + key.substring(0, 4));
      dataConfirmed.push(byMonthConfirmed.get(key) ?? 0);
      dataCancelled.push(byMonthCancelled.get(key) ?? 0);
    }
    this.barChartData.set({
      labels,
      datasets: [
        {
          label: 'Confirmados',
          data: dataConfirmed,
          backgroundColor: '#10B981',
          borderColor: '#059669',
          borderWidth: 1,
          maxBarThickness: 28,
          barPercentage: 0.8,
          categoryPercentage: 0.9
        },
        {
          label: 'Cancelados',
          data: dataCancelled,
          backgroundColor: '#EF4444',
          borderColor: '#DC2626',
          borderWidth: 1,
          maxBarThickness: 28,
          barPercentage: 0.8,
          categoryPercentage: 0.9
        }
      ]
    });
  }

  private startCountdown(): void {
    if (this.countdownInterval) clearInterval(this.countdownInterval);
    const tick = () => {
      const apt = this.nextAppointment();
      if (!apt || (apt.state !== 'CREATED' && apt.state !== 'CONFIRMED')) {
        this.countdown.set(null);
        return;
      }
      const dt = new Date(apt.date + 'T' + apt.startTime);
      const diff = dt.getTime() - Date.now();
      if (diff <= 0) {
        this.countdown.set('¡Ahora!');
        this.loadData();
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      this.countdown.set(h < 24 ? `${h}h ${m}m` : `${Math.floor(h / 24)}d ${h % 24}h`);
    };
    tick();
    this.countdownInterval = setInterval(tick, 1000);
  }

  ngOnInit(): void {
    this.loadData();
    this.ws.messages.subscribe((msg: WebSocketMessage) => {
      if ([WebSocketMessageType.APPOINTMENT_CREATED, WebSocketMessageType.APPOINTMENT_CONFIRMED, WebSocketMessageType.APPOINTMENT_CANCELLED,
           WebSocketMessageType.APPOINTMENT_RESCHEDULED, WebSocketMessageType.NOTIFICATION_COUNT_UPDATED].includes(msg.type)) {
        this.loadData();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) clearInterval(this.countdownInterval);
  }
}
