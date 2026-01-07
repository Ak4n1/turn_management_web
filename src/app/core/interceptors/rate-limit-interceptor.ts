import { HttpInterceptorFn, HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

/**
 * Interceptor de Rate Limit (429)
 * 
 * Detecta cuando se excede el rate limit y maneja el error de forma amigable.
 * El manejo específico del mensaje se hace en los componentes que reciben el error.
 */
export const rateLimitInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === HttpStatusCode.TooManyRequests) {
        // El error 429 se propaga para que los componentes puedan manejarlo
        // con mensajes específicos y tiempo de espera
        // Los headers Retry-After están disponibles en error.headers
        return throwError(() => error);
      }
      return throwError(() => error);
    })
  );
};
