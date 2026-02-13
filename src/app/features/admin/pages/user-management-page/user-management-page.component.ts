import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AdminUserManagementService } from '../../services/admin-user-management.service';
import { AdminUserResponse } from '../../models/admin-user.model';
import { WebSocketService } from '../../../../core/services/websocket.service';
import { WebSocketMessageType } from '../../../../core/models/websocket-message.model';
import { SpinnerComponent } from '../../../../shared/atoms/spinner/spinner.component';
import { ModalComponent } from '../../../../shared/molecules/modal/modal.component';
import { ErrorTextComponent } from '../../../../shared/atoms/error-text/error-text.component';
import { ButtonComponent } from '../../../../shared/atoms/button/button.component';
import { LabelComponent } from '../../../../shared/atoms/label/label.component';

@Component({
  selector: 'app-user-management-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    SpinnerComponent,
    ErrorTextComponent,
    ButtonComponent,
    LabelComponent,
    ModalComponent
  ],
  templateUrl: './user-management-page.component.html',
  styleUrl: './user-management-page.component.css'
})
export class UserManagementPageComponent implements OnInit, OnDestroy {
  private userService = inject(AdminUserManagementService);
  private router = inject(Router);
  private ws = inject(WebSocketService);
  private destroy$ = new Subject<void>();

  users: AdminUserResponse[] = [];
  onlineUsersCount = 0;
  onlineUserEmails = new Set<string>();
  isLoading = false;
  error: string | null = null;

  searchTerm = '';
  createdFrom = '';
  createdTo = '';
  emailVerifiedFilter: boolean | '' = '';
  profileCompleteFilter: boolean | '' = '';
  roleFilter = '';
  enabledFilter: boolean | '' = '';

  currentPage = 0;
  pageSize = 20;
  totalElements = 0;
  totalPages = 0;

  selectedUser: AdminUserResponse | null = null;
  isDetailModalOpen = false;
  actionLoading: string | null = null; // 'resend' | 'reset' | 'role' | 'enabled'

  confirmModalOpen = false;
  pendingAction: {
    type: 'resend-verify' | 'reset-password' | 'role' | 'enabled';
    user: AdminUserResponse;
    role?: string;
    enabled?: boolean;
  } | null = null;

  readonly roleOptions = [
    { value: '', label: 'Todos' },
    { value: 'ROLE_USER', label: 'Usuario' },
    { value: 'ROLE_ADMIN', label: 'Administrador' }
  ];

  ngOnInit(): void {
    this.loadUsers();
    this.userService.getOnlineUsersCount().subscribe({
      next: (res) => {
        this.onlineUsersCount = res.count;
        this.onlineUserEmails = new Set(res.emails ?? []);
      },
      error: () => { /* ignorar */ }
    });
    this.ws.messages.pipe(takeUntil(this.destroy$)).subscribe((msg) => {
      if (msg.type === WebSocketMessageType.ONLINE_USERS_COUNT && msg.data) {
        if (msg.data['onlineUsersCount'] != null) this.onlineUsersCount = Number(msg.data['onlineUsersCount']);
        if (Array.isArray(msg.data['onlineUserEmails'])) this.onlineUserEmails = new Set(msg.data['onlineUserEmails']);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.error = null;
    const params: any = {
      page: this.currentPage,
      size: this.pageSize
    };
    if (this.searchTerm.trim()) params.search = this.searchTerm.trim();
    if (this.createdFrom) params.createdFrom = this.createdFrom;
    if (this.createdTo) params.createdTo = this.createdTo;
    if (this.emailVerifiedFilter !== '') params.emailVerified = this.emailVerifiedFilter;
    if (this.profileCompleteFilter !== '') params.profileComplete = this.profileCompleteFilter;
    if (this.roleFilter) params.role = this.roleFilter;
    if (this.enabledFilter !== '') params.enabled = this.enabledFilter;

    this.userService.getUsers(params).subscribe({
      next: (res) => {
        this.users = res.content;
        this.totalElements = res.totalElements;
        this.totalPages = res.totalPages;
        this.currentPage = res.page;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Error al cargar usuarios';
        this.isLoading = false;
      }
    });
  }

  onSearch(): void {
    this.currentPage = 0;
    this.loadUsers();
  }

  onFilterChange(): void {
    this.currentPage = 0;
    this.loadUsers();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.createdFrom = '';
    this.createdTo = '';
    this.emailVerifiedFilter = '';
    this.profileCompleteFilter = '';
    this.roleFilter = '';
    this.enabledFilter = '';
    this.currentPage = 0;
    this.loadUsers();
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadUsers();
    }
  }

  getInitials(user: AdminUserResponse): string {
    const f = (user.firstName || '').trim();
    const l = (user.lastName || '').trim();
    if (f && l) return (f[0] + l[0]).toUpperCase();
    if (f) return f.slice(0, 2).toUpperCase();
    if (user.email) return user.email.slice(0, 2).toUpperCase();
    return '?';
  }

  /** Calcula edad desde birthDate (YYYY-MM-DD). */
  getAge(birthDate: string | null): number | null {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age >= 0 ? age : null;
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  openDetail(user: AdminUserResponse): void {
    this.selectedUser = user;
    this.isDetailModalOpen = true;
  }

  closeDetail(): void {
    this.isDetailModalOpen = false;
    this.selectedUser = null;
    this.actionLoading = null;
  }

  openConfirmModal(
    type: 'resend-verify' | 'reset-password' | 'role' | 'enabled',
    user: AdminUserResponse,
    role?: string,
    enabled?: boolean
  ): void {
    this.pendingAction = { type, user, role, enabled };
    this.confirmModalOpen = true;
  }

  closeConfirmModal(): void {
    if (!this.actionLoading) {
      this.confirmModalOpen = false;
      this.pendingAction = null;
    }
  }

  getConfirmTitle(): string {
    if (!this.pendingAction) return '';
    switch (this.pendingAction.type) {
      case 'resend-verify': return 'Reenviar verificación';
      case 'reset-password': return 'Reenviar contraseña';
      case 'role': return this.pendingAction.role === 'ROLE_ADMIN' ? 'Hacer administrador' : 'Quitar administrador';
      case 'enabled': return this.pendingAction.enabled ? 'Habilitar usuario' : 'Deshabilitar usuario';
      default: return 'Confirmar acción';
    }
  }

  /** Header rojo para acciones destructivas, azul para el resto */
  getConfirmHeaderClass(): string {
    return this.isConfirmActionDanger() ? 'modal-header-error' : 'modal-header-success';
  }

  /** Deshabilitar usuario es una acción de riesgo */
  isConfirmActionDanger(): boolean {
    return this.pendingAction?.type === 'enabled' && this.pendingAction.enabled === false;
  }

  getConfirmMessage(): string {
    if (!this.pendingAction) return '';
    const name = `${this.pendingAction.user.firstName} ${this.pendingAction.user.lastName}`.trim() || this.pendingAction.user.email;
    switch (this.pendingAction.type) {
      case 'resend-verify': return `¿Enviar nuevamente el email de verificación a ${name}?`;
      case 'reset-password': return `¿Enviar email para restablecer contraseña a ${name}?`;
      case 'role':
        return this.pendingAction.role === 'ROLE_ADMIN'
          ? `¿Asignar rol de administrador a ${name}?`
          : `¿Quitar el rol de administrador a ${name}?`;
      case 'enabled':
        return this.pendingAction.enabled
          ? `¿Habilitar la cuenta de ${name}?`
          : `¿Deshabilitar la cuenta de ${name}?`;
      default: return '¿Continuar?';
    }
  }

  executePendingAction(): void {
    if (!this.pendingAction || this.actionLoading) return;
    const { type, user, role, enabled } = this.pendingAction;
    switch (type) {
      case 'resend-verify': this.onResendVerification(user); break;
      case 'reset-password': this.onSendResetPassword(user); break;
      case 'role': if (role) this.onSetRole(user, role); break;
      case 'enabled': if (enabled !== undefined) this.onSetEnabled(user, enabled); break;
    }
  }

  onResendVerification(user: AdminUserResponse): void {
    this.actionLoading = 'resend';
    this.userService.resendVerification(user.id).subscribe({
      next: () => {
        this.actionLoading = null;
        this.closeConfirmModal();
        if (this.selectedUser?.id === user.id) {
          this.selectedUser = { ...this.selectedUser, emailVerified: this.selectedUser.emailVerified };
        }
        const idx = this.users.findIndex(u => u.id === user.id);
        if (idx >= 0) this.users[idx] = { ...this.users[idx] };
      },
      error: () => {
        this.actionLoading = null;
        this.closeConfirmModal();
      }
    });
  }

  onSendResetPassword(user: AdminUserResponse): void {
    this.actionLoading = 'reset';
    this.userService.sendResetPassword(user.id).subscribe({
      next: () => {
        this.actionLoading = null;
        this.closeConfirmModal();
      },
      error: () => {
        this.actionLoading = null;
        this.closeConfirmModal();
      }
    });
  }

  onSetRole(user: AdminUserResponse, role: string): void {
    this.actionLoading = 'role';
    this.userService.setRole(user.id, role).subscribe({
      next: (updated) => {
        this.actionLoading = null;
        this.closeConfirmModal();
        if (this.selectedUser?.id === user.id) {
          this.selectedUser = updated;
        }
        const idx = this.users.findIndex(u => u.id === user.id);
        if (idx >= 0) this.users[idx] = updated;
        this.loadUsers();
      },
      error: () => {
        this.actionLoading = null;
        this.closeConfirmModal();
      }
    });
  }

  onSetEnabled(user: AdminUserResponse, enabled: boolean): void {
    this.actionLoading = 'enabled';
    this.userService.setEnabled(user.id, enabled).subscribe({
      next: (updated) => {
        this.actionLoading = null;
        this.closeConfirmModal();
        if (this.selectedUser?.id === user.id) {
          this.selectedUser = updated;
        }
        const idx = this.users.findIndex(u => u.id === user.id);
        if (idx >= 0) this.users[idx] = updated;
        this.loadUsers();
      },
      error: () => {
        this.actionLoading = null;
        this.closeConfirmModal();
      }
    });
  }

  goToUserAppointments(userId: number): void {
    this.closeDetail();
    this.router.navigate(['/dashboard/admin/appointments'], {
      queryParams: { userId }
    });
  }

  isUserOnline(email: string): boolean {
    return this.onlineUserEmails.has(email);
  }

  getRoleLabel(roles: string[]): string {
    if (roles?.includes('ROLE_ADMIN')) return 'Administrador';
    if (roles?.includes('ROLE_USER')) return 'Usuario';
    return roles?.[0] || '-';
  }
}
