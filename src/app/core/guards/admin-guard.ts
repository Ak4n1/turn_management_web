import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { firstValueFrom, timeout } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { AuthStateService } from '../services/auth-state';

/**
 * Admin Guard
 * 
 * Protege rutas que requieren rol ADMIN.
 * Si el usuario no está autenticado, redirige a /login.
 * Si el usuario no tiene rol ADMIN, redirige a /dashboard-home.
 * Espera a que la inicialización del estado termine antes de verificar.
 */
export const adminGuard: CanActivateFn = async (route, state) => {
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
    router.navigate(['/login'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }

  // Verificar si el usuario tiene rol ADMIN
  const user = authStateService.user;
  if (!user || !user.roles || !user.roles.includes('ROLE_ADMIN')) {
    // Usuario autenticado pero sin permisos de admin
    router.navigate(['/dashboard/home']);
    return false;
  }

  return true;
};

