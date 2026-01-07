import { HttpInterceptorFn, HttpErrorResponse, HttpStatusCode, HttpRequest, HttpEvent, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError, Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { AuthStateService } from '../services/auth-state';

// Estado global del refresh token (compartido entre todas las instancias del interceptor)
let isRefreshing = false;
let refreshTokenSubject = new BehaviorSubject<string | null>(null);

/**
 * Interceptor de Refresh Token Automático
 * 
 * Detecta cuando el access token expiró (401) y lo renueva automáticamente
 * usando el refresh token. Previene loops infinitos y maneja múltiples requests simultáneos.
 */
export const authRefreshInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const authStateService = inject(AuthStateService);
  const router = inject(Router);

  // Excluir endpoints que no deben ser interceptados
  if (req.url.includes('/api/auth/login') || 
      req.url.includes('/api/auth/register') ||
      req.url.includes('/api/auth/refresh')) {
    return next(req);
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Manejar errores 401 (Unauthorized) - token expirado
      if (error.status === HttpStatusCode.Unauthorized) {
        return handle401Error(req, next, authService, authStateService, router);
      }
      // Manejar errores 403 (Forbidden) - email no verificado
      if (error.status === HttpStatusCode.Forbidden) {
        const errorMessage = error.error?.message || '';
        if (errorMessage.includes('verificado') || errorMessage.includes('EMAIL_NOT_VERIFIED')) {
          // Email no verificado, redirigir a verificación
          const email = authStateService.user?.email || '';
          authStateService.clearState();
          router.navigate(['/verify-email-pending'], {
            queryParams: { email: email, fromLogin: 'true' }
          });
        }
      }
      return throwError(() => error);
    })
  );
};

function handle401Error(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService,
  authStateService: AuthStateService,
  router: Router
): Observable<HttpEvent<unknown>> {
  // Si no estamos refrescando, iniciar el proceso de refresh
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    return authService.refreshToken().pipe(
      switchMap((response) => {
        // Refresh exitoso
        isRefreshing = false;
        refreshTokenSubject.next('success');
        
        // Actualizar estado de autenticación
        if (response.user) {
          authStateService.setUser(response.user);
        }

        // Reintentar el request original
        return next(req);
      }),
      catchError((refreshError: HttpErrorResponse) => {
        // Refresh falló
        isRefreshing = false;
        refreshTokenSubject.next(null);

        // Verificar si es error de email no verificado
        if (refreshError.status === HttpStatusCode.Forbidden) {
          const errorMessage = refreshError.error?.message || '';
          if (errorMessage.includes('verificado') || errorMessage.includes('EMAIL_NOT_VERIFIED')) {
            // Email no verificado, redirigir a verificación
            const email = authStateService.user?.email || '';
            authStateService.clearState();
            router.navigate(['/verify-email-pending'], {
              queryParams: { email: email, fromLogin: 'true' }
            });
            return throwError(() => refreshError);
          }
        }

        // Limpiar estado de autenticación
        authStateService.clearState();

        // Redirigir a login
        router.navigate(['/login']);

        return throwError(() => refreshError);
      })
    );
  } else {
    // Ya hay un refresh en curso, esperar a que termine
    return refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap(() => {
        // Reintentar el request original después del refresh exitoso
        return next(req);
      })
    );
  }
}
