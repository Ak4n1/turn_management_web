import { Component, OnInit, inject, computed, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthStateService, AuthState } from '../../../core/services/auth-state';
import { AuthService } from '../../../core/services/auth.service';
import { UserResponse } from '../../../features/auth/models/user-response.model';

interface SidebarMenuItem {
  label: string;
  icon: string;
  route: string;
  roles?: string[]; // Roles que pueden ver este item (undefined = todos)
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class SidebarComponent implements OnInit {
  private authStateService = inject(AuthStateService);
  private authService = inject(AuthService);
  private router = inject(Router);

  isOpen = false;
  menuItems: SidebarMenuItem[] = [];
  userRoles: string[] = [];

  private authState = toSignal(this.authStateService.authState$, {
    initialValue: { user: null, isAuthenticated: false } as AuthState
  });

  displayName = computed(() => {
    const user = this.authState()?.user;
    if (!user) return '';
    const first = user.firstName?.trim() || '';
    const last = user.lastName?.trim() || '';
    if (first || last) return `${first} ${last}`.trim();
    return user.email || '';
  });

  initials = computed(() => {
    const user = this.authState()?.user;
    if (!user) return '?';
    const first = (user.firstName || '').trim();
    const last = (user.lastName || '').trim();
    if (first && last) return (first[0] + last[0]).toUpperCase();
    if (first) return first.slice(0, 2).toUpperCase();
    if (user.email) return user.email.slice(0, 2).toUpperCase();
    return '?';
  });

  roleLabel = computed(() => {
    const user = this.authState()?.user;
    if (!user?.roles?.length) return '';
    if (user.roles.includes('ROLE_ADMIN')) return 'Administrador';
    if (user.roles.includes('ROLE_USER')) return 'Usuario';
    return user.roles[0] || '';
  });

  // Items de menú para usuarios normales (ROLE_USER)
  private userMenuItems: SidebarMenuItem[] = [
    { 
      label: 'Calendario', 
      icon: 'fas fa-calendar-alt', 
      route: '/dashboard/calendar',
      roles: ['ROLE_USER']
    },
    { 
      label: 'Mis Turnos', 
      icon: 'fas fa-calendar-check', 
      route: '/dashboard/appointments/my-appointments',
      roles: ['ROLE_USER']
    }
  ];

  // Items de menú para administradores (ROLE_ADMIN)
  private adminMenuItems: SidebarMenuItem[] = [
    { 
      label: 'Dashboard', 
      icon: 'fas fa-home', 
      route: '/dashboard/home',
      roles: ['ROLE_ADMIN']
    },
    { 
      label: 'Calendario General', 
      icon: 'fas fa-calendar-alt', 
      route: '/dashboard/admin/calendar/consolidated',
      roles: ['ROLE_ADMIN']
    },
    { 
      label: 'Reglas de Atención', 
      icon: 'fas fa-cog', 
      route: '/dashboard/admin/calendar/weekly-config',
      roles: ['ROLE_ADMIN']
    },
    { 
      label: 'Gestión de Turnos', 
      icon: 'fas fa-calendar-check', 
      route: '/dashboard/admin/appointments',
      roles: ['ROLE_ADMIN']
    },
    { 
      label: 'Excepciones', 
      icon: 'fas fa-exclamation-triangle', 
      route: '/dashboard/admin/calendar/exceptions',
      roles: ['ROLE_ADMIN']
    },
    { 
      label: 'Bloqueos', 
      icon: 'fas fa-lock', 
      route: '/dashboard/admin/calendar/blocks',
      roles: ['ROLE_ADMIN']
    },
    { 
      label: 'Auditoría', 
      icon: 'fas fa-clipboard-list', 
      route: '/dashboard/admin/audit',
      roles: ['ROLE_ADMIN']
    }
  ];

  ngOnInit(): void {
    // Suscribirse a cambios en el estado de autenticación
    this.authStateService.authState$.subscribe(state => {
      if (state.user) {
        this.userRoles = state.user.roles || [];
        this.updateMenuItems();
      } else {
        this.userRoles = [];
        this.menuItems = [];
      }
    });
  }

  private updateMenuItems(): void {
    const isAdmin = this.userRoles.includes('ROLE_ADMIN');
    const isUser = this.userRoles.includes('ROLE_USER');

    if (isAdmin) {
      // Admin ve sus items
      this.menuItems = this.adminMenuItems;
    } else if (isUser) {
      // Usuario normal ve sus items
      this.menuItems = this.userMenuItems;
    } else {
      // Sin roles, no mostrar items
      this.menuItems = [];
    }
  }

  toggleSidebar(): void {
    this.isOpen = !this.isOpen;
  }

  closeSidebar(): void {
    this.isOpen = false;
  }

  onMenuItemClick(item: SidebarMenuItem): void {
    if (item.route) {
      this.router.navigate([item.route]);
    }
    this.closeSidebar();
  }

  isActiveRoute(route: string): boolean {
    return this.router.url === route || this.router.url.startsWith(route + '/');
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.authStateService.clearState();
        this.closeSidebar();
        this.router.navigate(['/login']);
      },
      error: () => {
        this.authStateService.clearState();
        this.closeSidebar();
        this.router.navigate(['/login']);
      }
    });
  }
}
