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
import { RootRedirectComponent } from './core/components/root-redirect/root-redirect';

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
  {
    path: 'dashboard-home',
    component: DashboardHomeComponent,
    canActivate: [emailVerifiedGuard] // Solo accesible si está autenticado Y email verificado
  },
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
