import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Interceptor de Cookies (withCredentials)
 * 
 * Asegura que todas las peticiones HTTP incluyan las cookies automáticamente.
 * Las cookies HTTP-only (accessToken y refreshToken) se envían automáticamente
 * por el navegador cuando withCredentials: true está presente.
 */
export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  // Agregar withCredentials: true a todas las peticiones
  const clonedRequest = req.clone({
    withCredentials: true
  });

  return next(clonedRequest);
};
