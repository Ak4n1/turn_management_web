import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonComponent } from '../../../../shared/atoms/button/button.component';
import { AuthService } from '../../../../core/services/auth.service';
import { AuthStateService } from '../../../../core/services/auth-state';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './verify-email.html',
  styleUrl: './verify-email.css'
})
export class VerifyEmailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  authStateService = inject(AuthStateService); // Public para usar en template

  state: 'verifying' | 'success' | 'error' | 'already-verified' = 'verifying';
  errorMessage: string = '';
  isRetrying: boolean = false;
  token: string = '';

  ngOnInit(): void {
    // Extraer token de query parameter
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || '';
      if (this.token) {
        this.verifyEmail();
      } else {
        this.state = 'error';
        this.errorMessage = 'Token no proporcionado. Por favor, usa el enlace del email.';
      }
    });
  }

  verifyEmail(): void {
    if (!this.token || this.isRetrying) {
      return;
    }

    this.state = 'verifying';
    this.errorMessage = '';
    this.isRetrying = false;

    this.authService.verifyEmail(this.token).subscribe({
      next: (response) => {
        this.state = 'success';
        
        // Si el usuario está logueado, actualizar el estado de autenticación y redirigir
        if (this.authStateService.isAuthenticated) {
          // Refrescar el estado para obtener el emailVerified actualizado
          this.authStateService.refreshUserState().then(() => {
            // Redirigir al dashboard después de un breve delay
            setTimeout(() => {
              this.router.navigate(['/dashboard/home']);
            }, 2000);
          });
        }
        // Si no está logueado, solo mostrar éxito (el usuario puede hacer login después)
      },
      error: (error) => {
        this.state = 'error';
        this.isRetrying = false;

        if (error.status === 400) {
          this.errorMessage = error.error?.message || 'Token inválido o expirado';
        } else if (error.status === 0 || error.status === undefined) {
          this.errorMessage = 'Error de conexión. Por favor, verifica tu internet e intenta nuevamente.';
        } else {
          this.errorMessage = 'Ocurrió un error inesperado. Por favor, intenta más tarde.';
        }
      }
    });
  }

  retry(): void {
    this.isRetrying = true;
    this.verifyEmail();
  }

  goToResendVerification(): void {
    // Redirigir a verify-email-pending para reenviar email
    this.router.navigate(['/verify-email-pending']);
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}

