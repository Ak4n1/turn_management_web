import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { firstValueFrom, timeout } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { AuthStateService } from '../services/auth-state';

/**
 * Auth Guard
 * 
 * Protege rutas que requieren autenticación.
 * Si el usuario no está autenticado, redirige a /login.
 * Espera a que la inicialización del estado termine antes de verificar.
 */
export const authGuard: CanActivateFn = async (route, state) => {
  const authStateService = inject(AuthStateService);
  const router = inject(Router);

  // Esperar a que la inicialización termine (si está en proceso)
  // Si isLoading es true, esperamos a que termine
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

  // Verificar si el usuario está autenticado
  if (authStateService.isAuthenticated) {
    return true;
  }

  // Si no está autenticado, redirigir a login
  // Guardar la URL destino para redirigir después del login
  router.navigate(['/login'], {
    queryParams: { returnUrl: state.url }
  });
  
  return false;
};
