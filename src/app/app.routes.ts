import { Routes } from '@angular/router';
import { RegisterComponent } from './features/auth/pages/register/register.component';
import { LoginComponent } from './features/auth/pages/login/login';
import { VerifyEmailPendingComponent } from './features/auth/pages/verify-email-pending/verify-email-pending.component';
import { VerifyEmailComponent } from './features/auth/pages/verify-email/verify-email';
import { ForgotPasswordComponent } from './features/auth/pages/forgot-password/forgot-password';
import { ResetPasswordComponent } from './features/auth/pages/reset-password/reset-password';
import { DashboardHomeComponent } from './features/home/pages/dashboard-home/dashboard-home';
import { HomeComponent } from './features/public/pages/home/home';
import { ServicesComponent } from './features/public/pages/services/services';
import { AboutComponent } from './features/public/pages/about/about';
import { authGuard } from './core/guards/auth-guard';
import { guestGuard } from './core/guards/guest-guard';
import { emailVerifiedGuard } from './core/guards/email-verified-guard';
import { adminGuard } from './core/guards/admin-guard';
import { RootRedirectComponent } from './core/components/root-redirect/root-redirect';
import { DashboardLayoutWrapperComponent } from './shared/templates/dashboard-layout/dashboard-layout-wrapper.component';

// User routes
import { CalendarPageComponent } from './features/calendar/user/pages/calendar-page/calendar-page.component';
import { MyAppointmentsPageComponent } from './features/appointments/user/pages/my-appointments-page/my-appointments-page.component';

// Admin routes
import { ConsolidatedCalendarPageComponent } from './features/calendar/admin/pages/consolidated-calendar-page/consolidated-calendar-page.component';
import { AdminAppointmentsPageComponent } from './features/appointments/admin/pages/admin-appointments-page/admin-appointments-page.component';
import { WeeklyConfigPageComponent } from './features/calendar/admin/pages/weekly-config-page/weekly-config-page.component';
import { ExceptionsPageComponent } from './features/calendar/admin/pages/exceptions-page/exceptions-page.component';
import { BlocksPageComponent } from './features/calendar/admin/pages/blocks-page/blocks-page.component';
import { AuditPageComponent } from './features/admin/pages/audit-page/audit-page.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [guestGuard] // Solo accesible si NO está autenticado
  },
  {
    path: 'register',
    component: RegisterComponent,
    canActivate: [guestGuard] // Solo accesible si NO está autenticado
  },
  {
    path: 'verify-email-pending',
    component: VerifyEmailPendingComponent
  },
  {
    path: 'verify-email',
    component: VerifyEmailComponent
  },
  {
    path: 'forgot-password',
    component: ForgotPasswordComponent,
    canActivate: [guestGuard] // Solo accesible si NO está autenticado
  },
  {
    path: 'reset-password/:token',
    component: ResetPasswordComponent
  },
  // Dashboard routes - todas usan el layout con sidebar y navbar
  {
    path: 'dashboard',
    component: DashboardLayoutWrapperComponent,
    canActivate: [emailVerifiedGuard],
    children: [
      {
        path: 'home',
        component: DashboardHomeComponent
      },
      // User routes
      {
        path: 'calendar',
        component: CalendarPageComponent
      },
      {
        path: 'appointments/my-appointments',
        component: MyAppointmentsPageComponent
      },
      // Admin routes
      {
        path: 'admin/calendar/consolidated',
        component: ConsolidatedCalendarPageComponent,
        canActivate: [adminGuard]
      },
      {
        path: 'admin/appointments',
        component: AdminAppointmentsPageComponent,
        canActivate: [adminGuard]
      },
      {
        path: 'admin/calendar/weekly-config',
        component: WeeklyConfigPageComponent,
        canActivate: [adminGuard]
      },
      {
        path: 'admin/calendar/exceptions',
        component: ExceptionsPageComponent,
        canActivate: [adminGuard]
      },
      {
        path: 'admin/calendar/blocks',
        component: BlocksPageComponent,
        canActivate: [adminGuard]
      },
      {
        path: 'admin/audit',
        component: AuditPageComponent,
        canActivate: [adminGuard]
      }
    ]
  },
  // Mantener ruta legacy para compatibilidad
  {
    path: 'dashboard-home',
    redirectTo: 'dashboard/home',
    pathMatch: 'full'
  },
  // Public routes
  {
    path: 'home',
    component: HomeComponent // Página pública
  },
  {
    path: 'services',
    component: ServicesComponent // Página pública
  },
  {
    path: 'about',
    component: AboutComponent // Página pública
  },
  {
    path: '',
    component: RootRedirectComponent // Componente que redirige según autenticación
  }
];
