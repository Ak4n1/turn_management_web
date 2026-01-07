import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { filter, take, timeout } from 'rxjs/operators';
import { AuthStateService } from '../services/auth-state';

/**
 * Email Verified Guard
 * 
 * Protege rutas que requieren que el email esté verificado.
 * Si el usuario no está autenticado, redirige a /login.
 * Si el usuario está autenticado pero el email no está verificado, redirige a /verify-email-pending.
 * Espera a que la inicialización del estado termine antes de verificar.
 */
export const emailVerifiedGuard: CanActivateFn = async (route, state) => {
  const authStateService = inject(AuthStateService);
  const router = inject(Router);

  // Esperar a que la inicialización termine (si está en proceso)
  if (authStateService.currentState.isLoading) {
    try {
      await firstValueFrom(
        authStateService.authState$.pipe(
          filter(state => !state.isLoading),
          take(1),
          timeout({ first: 5000 })
        )
      );
    } catch (error) {
      // Si hay timeout o error, continuar con la verificación
    }
  }

  // Verificar si el usuario está autenticado
  if (!authStateService.isAuthenticated) {
    // Si no está autenticado, redirigir a login
    router.navigate(['/login'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }

  // Verificar si el email está verificado
  if (!authStateService.isEmailVerified) {
    // Si el email no está verificado, redirigir a verificación pendiente
    const email = authStateService.user?.email || '';
    router.navigate(['/verify-email-pending'], {
      queryParams: { email: email, fromLogin: 'true' }
    });
    return false;
  }

  // Usuario autenticado y email verificado, permitir acceso
  return true;
};

