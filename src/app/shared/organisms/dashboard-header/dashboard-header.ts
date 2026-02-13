import { Component, Output, EventEmitter, HostListener, ElementRef, inject, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs';
import { UserNotificationService } from '../../../features/notifications/services/user-notification.service';
import { NotificationSoundService } from '../../../features/notifications/services/notification-sound.service';
import { SystemNotificationResponse } from '../../../features/notifications/models/system-notification-response.model';
import { WebSocketService } from '../../../core/services/websocket.service';
import { WebSocketMessageType } from '../../../core/models/websocket-message.model';

/** Tipo que no mostramos en la campanita (solo en "Ver todas" si se desea). */
const HIDDEN_TYPE = 'APPOINTMENT_CREATED';

/** Tipos WebSocket que disparan notificación + sonido (excluido APPOINTMENT_CREATED). */
const NOTIFICATION_WS_TYPES = new Set<string>([
  WebSocketMessageType.APPOINTMENT_CONFIRMED,
  WebSocketMessageType.APPOINTMENT_CANCELLED,
  WebSocketMessageType.APPOINTMENT_RESCHEDULED,
  WebSocketMessageType.APPOINTMENT_EXPIRED,
  WebSocketMessageType.NOTIFICATION_COUNT_UPDATED,
  WebSocketMessageType.RESCHEDULE_REQUEST_CREATED,
  WebSocketMessageType.RESCHEDULE_REQUEST_APPROVED,
  WebSocketMessageType.RESCHEDULE_REQUEST_REJECTED
]);

interface NavLink {
  label: string;
  icon: string;
  route: string;
  roles?: string[];
}

@Component({
  selector: 'app-dashboard-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard-header.html',
  styleUrl: './dashboard-header.css'
})
export class DashboardHeaderComponent implements OnInit {
  @Output() sidebarToggle = new EventEmitter<void>();
  @Output() closeSidebarRequest = new EventEmitter<void>();

  private elementRef = inject(ElementRef);
  private destroyRef = inject(DestroyRef);
  private notificationService = inject(UserNotificationService);
  private notificationSound = inject(NotificationSoundService);
  private router = inject(Router);
  private ws = inject(WebSocketService);

  isNotificationsOpen = false;
  unreadCount = 0;
  /** Lista para el dropdown (sin APPOINTMENT_CREATED). */
  notifications: SystemNotificationResponse[] = [];
  loadingNotifications = false;
  
  // Link al sitio público
  navLinks: NavLink[] = [
    { label: 'Ir al Sitio', icon: 'fas fa-globe', route: '/home' }
  ];

  get todayFormatted(): string {
    return new Date().toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  ngOnInit(): void {
    this.refreshUnreadCount();
    this.notificationService.getUnreadCountChanged()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.refreshUnreadCount());
    this.ws.messages
      .pipe(
        filter(m => NOTIFICATION_WS_TYPES.has(m.type)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.notificationSound.play();
        this.refreshUnreadCount();
        if (this.isNotificationsOpen) {
          this.loadNotifications();
        }
      });
  }

  isActiveRoute(route: string): boolean {
    return this.router.url === route || this.router.url.startsWith(route + '/');
  }

  toggleSidebar(): void {
    this.sidebarToggle.emit();
  }

  toggleNotifications(): void {
    this.isNotificationsOpen = !this.isNotificationsOpen;
    if (this.isNotificationsOpen) {
      this.closeSidebarRequest.emit();
      this.loadNotifications();
    }
  }

  closeNotifications(): void {
    this.isNotificationsOpen = false;
  }

  /** Carga las últimas notificaciones para el dropdown (sin APPOINTMENT_CREATED). */
  loadNotifications(): void {
    this.loadingNotifications = true;
    this.notificationService.getNotifications({ page: 0, size: 10 }).subscribe({
      next: (res) => {
        this.notifications = (res.notifications || []).filter(n => n.type !== HIDDEN_TYPE);
        this.loadingNotifications = false;
      },
      error: () => {
        this.notifications = [];
        this.loadingNotifications = false;
      }
    });
  }

  /** Contador para el badge: no incluye APPOINTMENT_CREATED (igual que la lista del dropdown). */
  refreshUnreadCount(): void {
    this.notificationService.getUnreadCount({ excludeType: HIDDEN_TYPE }).subscribe({
      next: (count) => { this.unreadCount = count; },
      error: () => {}
    });
  }

  onNotificationClick(notification: SystemNotificationResponse): void {
    if (notification.read) {
      this.goToRelated(notification);
      return;
    }
    this.notificationService.markAsRead(notification.id).subscribe({
      next: () => {
        notification.read = true;
        this.unreadCount = Math.max(0, this.unreadCount - 1);
        this.goToRelated(notification);
      },
      error: () => this.goToRelated(notification)
    });
  }

  private goToRelated(notification: SystemNotificationResponse): void {
    this.closeNotifications();
    if (notification.relatedEntityType === 'APPOINTMENT' && notification.relatedEntityId) {
      this.router.navigate(['/dashboard/appointments/my-appointments']);
    }
  }

  goToAllNotifications(): void {
    this.closeNotifications();
    this.router.navigate(['/dashboard/notifications']);
  }

  markAllAsRead(): void {
    if (this.unreadCount === 0) return;
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.unreadCount = 0;
        this.notifications = this.notifications.map(n => ({ ...n, read: true } as SystemNotificationResponse));
        if (this.isNotificationsOpen) {
          this.loadNotifications();
        }
      },
      error: () => {}
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.isNotificationsOpen) return;
    const el = this.elementRef.nativeElement as HTMLElement;
    if (el.contains(event.target as Node)) return;
    this.closeNotifications();
  }
}
