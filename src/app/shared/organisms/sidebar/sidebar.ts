import { Component, OnInit, inject, computed, Signal, ViewChild, ElementRef, HostListener } from '@angular/core';
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

interface SidebarSection {
  title: string;
  items: SidebarMenuItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class SidebarComponent implements OnInit {
  @ViewChild('sidebarContent') sidebarContentRef!: ElementRef<HTMLElement>;

  private authStateService = inject(AuthStateService);
  private authService = inject(AuthService);
  private router = inject(Router);

  isOpen = false;
  menuItems: SidebarMenuItem[] = [];
  menuSections: SidebarSection[] = [];
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

  /** Email del usuario (se muestra en la card de la sidebar en lugar del rol). */
  userEmail = computed(() => this.authState()?.user?.email ?? '');

  /** Porcentaje de perfil (incluye lo que ya se completa al registrarse). */
  profilePercent = computed(() => {
    const user = this.authState()?.user;
    if (!user) return 0;
    const s = (v: string | undefined) => (v ?? '').trim();
    let filled = 0;
    // Datos que ya suelen venir completos al registrarse
    if (s(user.firstName).length > 0) filled++;
    if (s(user.lastName).length > 0) filled++;
    // Datos de "Mi Cuenta" → Información personal
    if (s(user.phone).length > 0) filled++;
    if (s(user.street).length > 0) filled++;
    if (s(user.streetNumber).length > 0) filled++;
    if (s(user.floorApt).length > 0) filled++;
    if (s(user.city).length > 0) filled++;
    if (s(user.postalCode).length > 0) filled++;
    if (s(user.birthDate ?? '').length > 0) filled++;
    return Math.round((filled / 9) * 100);
  });

  /** Mostrar badge de perfil solo cuando no está completo (100%). */
  showProfileBadge = computed(() => {
    const user = this.authState()?.user;
    if (!user) return false;
    if (user.profileComplete === true) return false;
    return this.profilePercent() < 100;
  });

  // Secciones de menú para usuarios normales (ROLE_USER)
  private userMenuSections: SidebarSection[] = [
    {
      title: 'Gestión',
      items: [
        { 
          label: 'Centro de Actividad', 
          icon: 'fas fa-tachometer-alt', 
          route: '/dashboard/user',
          roles: ['ROLE_USER']
        },
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
      ]
    },
    {
      title: 'Sistema',
      items: [
        { 
          label: 'Notificaciones', 
          icon: 'fas fa-bell', 
          route: '/dashboard/notifications',
          roles: ['ROLE_USER']
        },
        { 
          label: 'Centro de Ayuda', 
          icon: 'fas fa-life-ring', 
          route: '/dashboard/help',
          roles: ['ROLE_USER']
        }
      ]
    }
  ];

  // Secciones de menú para administradores (ROLE_ADMIN)
  private adminMenuSections: SidebarSection[] = [
    {
      title: 'Gestión',
      items: [
        { 
          label: 'Dashboard', 
          icon: 'fas fa-shield-alt', 
          route: '/dashboard/admin/dashboard',
          roles: ['ROLE_ADMIN']
        },
        { 
          label: 'Calendario General', 
          icon: 'fas fa-calendar-alt', 
          route: '/dashboard/admin/calendar/consolidated',
          roles: ['ROLE_ADMIN']
        },
        { 
          label: 'Gestión de Turnos', 
          icon: 'fas fa-calendar-check', 
          route: '/dashboard/admin/appointments',
          roles: ['ROLE_ADMIN']
        },
        { 
          label: 'Gestión de Usuarios', 
          icon: 'fas fa-users-cog', 
          route: '/dashboard/admin/users',
          roles: ['ROLE_ADMIN']
        },
      ]
    },
    {
      title: 'Configuración',
      items: [
    
        { 
          label: 'Reglas de Atención', 
          icon: 'fas fa-cog', 
          route: '/dashboard/admin/calendar/weekly-config',
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
        }
      ]
    },
    {
      title: 'Sistema',
      items: [
        { 
          label: 'Notificaciones', 
          icon: 'fas fa-bell', 
          route: '/dashboard/notifications',
          roles: ['ROLE_ADMIN']
        },
        { 
          label: 'Centro de Ayuda', 
          icon: 'fas fa-life-ring', 
          route: '/dashboard/help',
          roles: ['ROLE_ADMIN']
        },
        { 
          label: 'Auditoría', 
          icon: 'fas fa-clipboard-list', 
          route: '/dashboard/admin/audit',
          roles: ['ROLE_ADMIN']
        }
      ]
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
        this.menuSections = [];
      }
    });
  }

  private updateMenuItems(): void {
    const isAdmin = this.userRoles.includes('ROLE_ADMIN');
    const isUser = this.userRoles.includes('ROLE_USER');

    if (isAdmin) {
      // Admin ve sus secciones
      this.menuSections = this.adminMenuSections;
      // Mantener menuItems para compatibilidad (aplanar las secciones)
      this.menuItems = this.adminMenuSections.flatMap(section => section.items);
    } else if (isUser) {
      // Usuario normal ve sus secciones
      this.menuSections = this.userMenuSections;
      // Mantener menuItems para compatibilidad (aplanar las secciones)
      this.menuItems = this.userMenuSections.flatMap(section => section.items);
    } else {
      // Sin roles, no mostrar items
      this.menuItems = [];
      this.menuSections = [];
    }
  }

  toggleSidebar(): void {
    this.isOpen = !this.isOpen;
  }

  closeSidebar(): void {
    this.isOpen = false;
  }

  /** Cierra la sidebar al hacer clic fuera (solo en viewport móvil, donde la sidebar es drawer) */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.isOpen) return;
    const target = event.target as Node;
    const content = this.sidebarContentRef?.nativeElement;
    if (content?.contains(target)) return;
    if ((target as Element).closest?.('.sidebar-toggle-mobile')) return;
    this.closeSidebar();
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
