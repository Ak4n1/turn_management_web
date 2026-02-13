import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

import { routes } from './app.routes';
import { credentialsInterceptor } from './core/interceptors/credentials-interceptor';
import { authRefreshInterceptor } from './core/interceptors/auth-refresh-interceptor';
import { rateLimitInterceptor } from './core/interceptors/rate-limit-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideCharts(withDefaultRegisterables()),
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([
        credentialsInterceptor,      // Primero: Agregar withCredentials a todas las peticiones
        authRefreshInterceptor,      // Segundo: Manejar refresh token automático
        rateLimitInterceptor         // Tercero: Manejar rate limit
      ])
    )
  ]
};
