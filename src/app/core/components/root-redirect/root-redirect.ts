import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { filter, take, timeout } from 'rxjs/operators';
import { AuthStateService } from '../../services/auth-state';

/**
 * Componente de Redirección Raíz
 * 
 * Redirige a /dashboard-home si el usuario está autenticado, o a /login si no lo está.
 * Se usa en la ruta raíz (/) para manejar la redirección inicial.
 */
@Component({
  selector: 'app-root-redirect',
  imports: [],
  template: '' // Componente vacío, solo redirige
})
export class RootRedirectComponent implements OnInit {
  private authStateService = inject(AuthStateService);
  private router = inject(Router);

  async ngOnInit(): Promise<void> {
    // Esperar a que la inicialización termine (si está en proceso)
    if (this.authStateService.currentState.isLoading) {
      try {
        await firstValueFrom(
          this.authStateService.authState$.pipe(
            filter(state => !state.isLoading),
            take(1),
            timeout({ first: 5000 })
          )
        );
      } catch (error) {
        // Si hay timeout o error, continuar con la redirección
      }
    }

    // Redirigir según el estado de autenticación y verificación de email
    if (this.authStateService.isAuthenticated) {
      if (this.authStateService.isEmailVerified) {
        // Usuario autenticado y email verificado, ir a dashboard
        this.router.navigate(['/dashboard-home']);
      } else {
        // Usuario autenticado pero email no verificado, ir a verificación
        const email = this.authStateService.user?.email || '';
        this.router.navigate(['/verify-email-pending'], {
          queryParams: { email: email, fromLogin: 'true' }
        });
      }
    } else {
      // Usuario no autenticado, ir a home público
      this.router.navigate(['/home']);
    }
  }
}
