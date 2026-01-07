import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonComponent } from '../../../../shared/atoms/button/button.component';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-verify-email-pending',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './verify-email-pending.component.html',
  styleUrl: './verify-email-pending.component.css'
})
export class VerifyEmailPendingComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  email: string = '';
  isResending: boolean = false;
  resendSuccess: boolean = false;
  resendError: string = '';
  showSuccessMessage: boolean = false;
  fromLogin: boolean = false;

  ngOnInit(): void {
    // Obtener email de query params
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || '';
      // Si hay email en query params, verificar si viene del registro o del login
      if (this.email) {
        // Si viene del login, no mostrar el mensaje de éxito de registro
        this.fromLogin = params['fromLogin'] === 'true';
        this.showSuccessMessage = !this.fromLogin; // Solo mostrar si viene del registro
      }
    });
  }

  resendVerificationEmail(): void {
    if (!this.email || this.isResending) {
      return;
    }

    this.isResending = true;
    this.resendSuccess = false;
    this.resendError = '';

    this.authService.resendVerificationEmail(this.email).subscribe({
      next: () => {
        this.isResending = false;
        this.resendSuccess = true;
      },
      error: (error) => {
        this.isResending = false;
        if (error.status === 400) {
          this.resendError = error.error?.message || 'Error al reenviar el email de verificación';
        } else if (error.status === 0 || error.status === undefined) {
          this.resendError = 'Error de conexión. Por favor, verifica tu internet e intenta nuevamente.';
        } else {
          this.resendError = 'Ocurrió un error inesperado. Por favor, intenta más tarde.';
        }
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
