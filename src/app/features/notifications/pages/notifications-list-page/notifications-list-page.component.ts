import { Component, inject, OnInit, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { from, of } from 'rxjs';
import { catchError, concatMap, map, toArray } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UserNotificationService } from '../../services/user-notification.service';
import { AdminManualNotificationService } from '../../services/admin-manual-notification.service';
import { AdminUserService } from '../../services/admin-user.service';
import { SystemNotificationResponse } from '../../models/system-notification-response.model';
import { getNotificationIcon, getRelativeTime } from '../../utils/notification-display.util';
import { NOTIFICATION_TYPE_FILTERS } from '../../constants/notification-type-filters';
import { LabelComponent } from '../../../../shared/atoms/label/label.component';
import { ButtonComponent } from '../../../../shared/atoms/button/button.component';
import { AuthState, AuthStateService } from '../../../../core/services/auth-state';
import { SendManualNotificationRequest } from '../../models/send-manual-notification-request.model';
import { SendManualNotificationResponse } from '../../models/send-manual-notification-response.model';
import { AdminUserSearchItem } from '../../models/admin-user-search-item.model';
import { WebSocketService } from '../../../../core/services/websocket.service';
import { WebSocketMessageType } from '../../../../core/models/websocket-message.model';

const HIDDEN_TYPE = 'APPOINTMENT_CREATED';

@Component({
  selector: 'app-notifications-list-page',
  standalone: true,
  imports: [CommonModule, FormsModule, LabelComponent, ButtonComponent],
  templateUrl: './notifications-list-page.component.html',
  styleUrl: './notifications-list-page.component.css'
})
export class NotificationsListPageComponent implements OnInit {
  private notificationService = inject(UserNotificationService);
  private adminManualNotificationService = inject(AdminManualNotificationService);
  private adminUserService = inject(AdminUserService);
  private authStateService = inject(AuthStateService);
  private ws = inject(WebSocketService);
  private destroyRef = inject(DestroyRef);

  private authState = toSignal(this.authStateService.authState$, {
    initialValue: { user: null, isAuthenticated: false } as AuthState
  });

  notifications = signal<SystemNotificationResponse[]>([]);
  unreadCount = signal(0);
  totalElements = signal(0);
  totalPages = signal(0);
  currentPage = signal(0);
  pageSize = 8;
  loading = signal(true);
  error = signal<string | null>(null);

  /** Filtros del panel lateral */
  readFilter = signal<'all' | 'unread' | 'read'>('all');
  typeFilter = signal<string>('');
  dateFrom = signal<string>('');
  dateTo = signal<string>('');
  searchText = signal<string>('');

  readonly typeFilterOptions = NOTIFICATION_TYPE_FILTERS;

  /** Lista filtrada (sin turno creado) para mostrar. */
  filteredNotifications = computed(() =>
    this.notifications().filter(n => n.type !== HIDDEN_TYPE)
  );

  /** Step/pestaña activa dentro de Notificaciones. */
  activeStep = signal<'list' | 'send'>('list');

  isAdmin = computed(() => {
    const roles = this.authState()?.user?.roles ?? [];
    return roles.includes('ROLE_ADMIN');
  });

  getIcon = getNotificationIcon;
  getRelativeTime = getRelativeTime;

  /** Panel admin: envío manual (US-N011). */
  manualRecipientMode = signal<'ALL_USERS' | 'SELECTED_USERS'>('ALL_USERS');
  manualType = signal('ADMIN_ANNOUNCEMENT');
  manualPriority = signal<NonNullable<SendManualNotificationRequest['priority']>>('MEDIUM');
  manualTitle = signal('');
  manualMessage = signal('');
  manualSending = signal(false);
  manualError = signal<string | null>(null);
  manualResult = signal<SendManualNotificationResponse | null>(null);

  /** Selector de usuarios (solo para envío a seleccionados). */
  userSearchQuery = signal('');
  userSearchLoading = signal(false);
  userSearchError = signal<string | null>(null);
  userSearchResults = signal<AdminUserSearchItem[]>([]);
  selectedUsers = signal<AdminUserSearchItem[]>([]);

  readonly manualTypeOptions: { value: string; label: string }[] = [
    { value: 'ADMIN_ANNOUNCEMENT', label: 'Anuncio' },
    { value: 'SYSTEM_MAINTENANCE', label: 'Mantenimiento del sistema' },
    { value: 'IMPORTANT_UPDATE', label: 'Actualización importante' },
    { value: 'PROMOTION', label: 'Promoción / Oferta' },
    { value: 'REMINDER', label: 'Recordatorio general' }
  ];

  ngOnInit(): void {
    // Asegurar step válido según rol.
    if (!this.isAdmin() && this.activeStep() === 'send') {
      this.activeStep.set('list');
    }
    // Si llega una notificación nueva por WebSocket, refrescar la lista (sin recargar pestaña).
    this.ws.messages
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((m) => {
        if (m.type !== WebSocketMessageType.NOTIFICATION_COUNT_UPDATED) return;
        if (this.activeStep() !== 'list') return;
        this.applyFilters();
      });
    this.applyFilters();
  }

  setStep(step: 'list' | 'send'): void {
    if (step === 'send' && !this.isAdmin()) return;
    this.activeStep.set(step);
    // Limpiar feedback del envío manual al cambiar de pestaña.
    this.manualError.set(null);
    this.manualResult.set(null);
    // Limpiar usuarios seleccionados al cambiar de pestaña.
    if (step === 'list') {
      this.selectedUsers.set([]);
      this.userSearchQuery.set('');
      this.userSearchResults.set([]);
    }
  }

  onRecipientModeChange(mode: 'ALL_USERS' | 'SELECTED_USERS'): void {
    this.manualRecipientMode.set(mode);
    // Limpiar usuarios seleccionados al cambiar el modo (opcional, pero útil para evitar confusión)
    // No lo limpiamos automáticamente para permitir cambiar entre modos sin perder la selección
  }

  onUserSearchChange(value: string): void {
    const q = (value ?? '').trim();
    this.userSearchQuery.set(value ?? '');
    this.userSearchError.set(null);
    this.userSearchResults.set([]);

    if (q.length < 2) {
      this.userSearchLoading.set(false);
      return;
    }

    this.userSearchLoading.set(true);
    this.adminUserService.searchUsers({ query: q, limit: 10 }).subscribe({
      next: (users) => {
        const selectedIds = new Set(this.selectedUsers().map(u => u.id));
        this.userSearchResults.set((users ?? []).filter(u => !selectedIds.has(u.id)));
        this.userSearchLoading.set(false);
      },
      error: () => {
        this.userSearchError.set('No se pudo buscar usuarios.');
        this.userSearchLoading.set(false);
      }
    });
  }

  addSelectedUser(user: AdminUserSearchItem): void {
    if (!user?.email) return;
    const exists = this.selectedUsers().some(u => u.id === user.id || u.email === user.email);
    if (exists) return;
    this.selectedUsers.update(prev => [...prev, user]);
    // Sacar de resultados para evitar duplicados
    this.userSearchResults.update(prev => prev.filter(u => u.id !== user.id));
  }

  removeSelectedUser(user: AdminUserSearchItem): void {
    this.selectedUsers.update(prev => prev.filter(u => u.id !== user.id));
  }

  getUserDisplayName(user: AdminUserSearchItem): string {
    const first = (user.firstName ?? '').trim();
    const last = (user.lastName ?? '').trim();
    const name = `${first} ${last}`.trim();
    return name || user.email;
  }

  applyFilters(): void {
    this.loadPage(0);
  }

  onTypeFilterChange(value: string): void {
    this.typeFilter.set(value);
    this.applyFilters();
  }

  onReadFilterChange(value: 'all' | 'unread' | 'read'): void {
    this.readFilter.set(value);
    this.applyFilters();
  }

  onDateFromChange(value: string): void {
    this.dateFrom.set(value);
    this.applyFilters();
  }

  onDateToChange(value: string): void {
    this.dateTo.set(value);
    this.applyFilters();
  }

  clearFilters(): void {
    this.readFilter.set('all');
    this.typeFilter.set('');
    this.dateFrom.set('');
    this.dateTo.set('');
    this.searchText.set('');
    this.applyFilters();
  }

  loadPage(page: number): void {
    this.loading.set(true);
    this.error.set(null);

    const read = this.readFilter() === 'all' ? undefined
      : this.readFilter() === 'unread' ? false : true;
    const type = this.typeFilter() || undefined;
    const dateFrom = this.dateFrom() || undefined;
    const dateTo = this.dateTo() || undefined;
    const search = this.searchText().trim() || undefined;

    this.notificationService.getNotifications({
      page,
      size: this.pageSize,
      read,
      type,
      dateFrom,
      dateTo,
      search
    }).subscribe({
      next: (res) => {
        this.notifications.set(res.notifications || []);
        this.totalElements.set(res.totalElements);
        this.totalPages.set(res.totalPages);
        this.currentPage.set(res.page);
        this.unreadCount.set(res.unreadCount);
        this.notificationService.getUnreadCount({ excludeType: HIDDEN_TYPE }).subscribe({
          next: (count) => this.unreadCount.set(count)
        });
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar las notificaciones.');
        this.loading.set(false);
      }
    });
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages()) this.loadPage(page);
  }

  markAsRead(notification: SystemNotificationResponse): void {
    if (notification.read) return;
    this.notificationService.markAsRead(notification.id).subscribe({
      next: () => {
        notification.read = true;
        this.unreadCount.update(c => Math.max(0, c - 1));
        this.notificationService.notifyUnreadCountChanged();
      }
    });
  }

  markAllAsRead(): void {
    if (this.unreadCount() === 0) return;
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.unreadCount.set(0);
        this.notifications.update(list => list.map(n => ({ ...n, read: true })));
        this.notificationService.notifyUnreadCountChanged();
      },
      error: () => {}
    });
  }

  deleteNotification(notification: SystemNotificationResponse): void {
    this.notificationService.deleteNotification(notification.id).subscribe({
      next: () => {
        this.notifications.update(list => list.filter(n => n.id !== notification.id));
        if (!notification.read) this.unreadCount.update(c => Math.max(0, c - 1));
        this.notificationService.notifyUnreadCountChanged();
      }
    });
  }

  sendManualNotification(): void {
    this.manualError.set(null);
    this.manualResult.set(null);

    const recipientMode = this.manualRecipientMode();
    const title = this.manualTitle().trim();
    const message = this.manualMessage().trim();

    if (recipientMode === 'SELECTED_USERS' && this.selectedUsers().length === 0) {
      this.manualError.set('Debes seleccionar al menos un usuario.');
      return;
    }
    if (!title) {
      this.manualError.set('El título es obligatorio.');
      return;
    }
    if (!message) {
      this.manualError.set('El mensaje es obligatorio.');
      return;
    }

    this.manualSending.set(true);

    if (recipientMode === 'ALL_USERS') {
      const excludedEmails = this.selectedUsers().map(u => u.email);
      const body: SendManualNotificationRequest = {
        recipientType: 'ALL_USERS',
        recipientEmail: null,
        type: this.manualType(),
        title,
        message,
        priority: this.manualPriority(),
        excludedEmails: excludedEmails.length > 0 ? excludedEmails : undefined
      };

      this.adminManualNotificationService.sendManualNotification(body).subscribe({
        next: (res) => {
          this.manualResult.set(res);
          this.manualSending.set(false);
        },
        error: (err) => {
          const msg = err?.error?.message || 'No se pudo enviar la notificación.';
          this.manualError.set(msg);
          this.manualSending.set(false);
        }
      });
      return;
    }

    // SELECTED_USERS: enviar una por una (backend soporta SPECIFIC_USER).
    const recipients = this.selectedUsers();
    from(recipients).pipe(
      concatMap((u) => {
        const body: SendManualNotificationRequest = {
          recipientType: 'SPECIFIC_USER',
          recipientEmail: u.email,
          type: this.manualType(),
          title,
          message,
          priority: this.manualPriority()
        };
        return this.adminManualNotificationService.sendManualNotification(body).pipe(
          map((res) => ({ ok: true as const, res })),
          catchError((err) => of({ ok: false as const, err, user: u }))
        );
      }),
      toArray()
    ).subscribe({
      next: (results) => {
        const ok = results.filter(r => r.ok) as Array<{ ok: true; res: SendManualNotificationResponse }>;
        const failed = results.filter(r => !r.ok) as Array<{ ok: false; err: any; user: AdminUserSearchItem }>;

        const aggregate: SendManualNotificationResponse = {
          success: failed.length === 0,
          totalRecipients: recipients.length,
          sentImmediately: ok.reduce((acc, r) => acc + (r.res.sentImmediately ?? 0), 0),
          pendingDelivery: ok.reduce((acc, r) => acc + (r.res.pendingDelivery ?? 0), 0),
          excludedByPreferences: ok.reduce((acc, r) => acc + (r.res.excludedByPreferences ?? 0), 0),
          notificationIds: ok.flatMap(r => r.res.notificationIds ?? []),
          message: failed.length === 0
            ? `Notificación enviada a ${recipients.length} usuario(s).`
            : `Enviado a ${ok.length}/${recipients.length}. Fallaron ${failed.length}.`
        };

        this.manualResult.set(aggregate);
        if (failed.length > 0) {
          this.manualError.set(`No se pudo enviar a: ${failed.map(f => f.user.email).join(', ')}`);
        }
        this.manualSending.set(false);
      },
      error: () => {
        this.manualError.set('No se pudo enviar la notificación.');
        this.manualSending.set(false);
      }
    });
  }
}
