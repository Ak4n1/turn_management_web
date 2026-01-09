import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { filter, take, timeout } from 'rxjs/operators';
import { AuthStateService } from '../services/auth-state';

/**
 * Guest Guard
 * 
 * Protege rutas que solo deben ser accesibles para usuarios NO autenticados.
 * Si el usuario está autenticado, redirige a /dashboard/home.
 */
export const guestGuard: CanActivateFn = async (route, state) => {
  const authStateService = inject(AuthStateService);
  const router = inject(Router);

  // Esperar a que la inicialización termine (si está en proceso)
  if (authStateService.currentState.isLoading) {
    try {
      await firstValueFrom(
        authStateService.authState$.pipe(
          filter(state => !state.isLoading), // Esperar a que termine la carga
          take(1),
          timeout({ first: 5000 }) // Timeout de 5 segundos máximo
        )
      );
    } catch (error) {
      // Si hay timeout o error, continuar con la verificación
    }
  }

  // Si el usuario está autenticado, redirigir a dashboard/home
  if (authStateService.isAuthenticated) {
    router.navigate(['/dashboard/home']);
    return false;
  }

  // Si no está autenticado, permitir acceso
  return true;
};

