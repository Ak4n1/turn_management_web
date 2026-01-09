import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { firstValueFrom, timeout } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { AuthStateService } from '../services/auth-state';

/**
 * Role Guard
 * 
 * Protege rutas que requieren un rol específico.
 * Se puede usar con data: { roles: ['ROLE_ADMIN', 'ROLE_USER'] }
 * 
 * Ejemplo de uso:
 * {
 *   path: 'admin/panel',
 *   component: AdminPanelComponent,
 *   canActivate: [roleGuard],
 *   data: { roles: ['ROLE_ADMIN'] }
 * }
 */
export const roleGuard: CanActivateFn = async (route: ActivatedRouteSnapshot, state) => {
  const authStateService = inject(AuthStateService);
  const router = inject(Router);

  // Obtener roles requeridos de la configuración de la ruta
  const requiredRoles = route.data['roles'] as string[];
  
  if (!requiredRoles || requiredRoles.length === 0) {
    // Si no se especifican roles, permitir acceso a cualquier usuario autenticado
    if (!authStateService.isAuthenticated) {
      router.navigate(['/login'], {
        queryParams: { returnUrl: state.url }
      });
      return false;
    }
    return true;
  }

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

  // Verificar si el usuario tiene alguno de los roles requeridos
  const user = authStateService.user;
  if (!user || !user.roles) {
    router.navigate(['/dashboard/home']);
    return false;
  }

  const hasRequiredRole = requiredRoles.some(role => user.roles.includes(role));
  
  if (!hasRequiredRole) {
    // Usuario autenticado pero sin los permisos necesarios
    router.navigate(['/dashboard/home']);
    return false;
  }

  return true;
};

