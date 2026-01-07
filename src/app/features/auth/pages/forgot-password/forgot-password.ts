import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonComponent } from '../../../../shared/atoms/button/button.component';
import { InputGroupComponent } from '../../../../shared/molecules/input-group/input-group.component';
import { PublicNavbarComponent } from '../../../../shared/organisms/public-navbar/public-navbar';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent, InputGroupComponent, PublicNavbarComponent, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css'
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);

  forgotPasswordForm: FormGroup;
  isSubmitting: boolean = false;
  success: boolean = false;
  errorMessage: string = '';
  submittedEmail: string = '';

  constructor() {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]]
    });
  }

  get email() {
    return this.forgotPasswordForm.get('email');
  }

  getEmailError(): string {
    const emailControl = this.email;
    if (!emailControl) return '';

    if (emailControl.hasError('required')) {
      return 'El email es requerido';
    }
    if (emailControl.hasError('email')) {
      return 'El email no es válido';
    }
    if (emailControl.hasError('maxlength')) {
      return 'El email no puede exceder 100 caracteres';
    }
    return '';
  }

  onSubmit(): void {
    if (this.forgotPasswordForm.invalid || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.success = false;
    this.errorMessage = '';
    const emailValue = this.forgotPasswordForm.get('email')?.value;

    this.authService.forgotPassword(emailValue).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.success = true;
        this.submittedEmail = emailValue;
      },
      error: (error) => {
        this.isSubmitting = false;
        if (error.status === 400) {
          this.errorMessage = error.error?.message || 'Error al solicitar restablecimiento de contraseña';
        } else if (error.status === 0 || error.status === undefined) {
          this.errorMessage = 'Error de conexión. Por favor, verifica tu internet e intenta nuevamente.';
        } else {
          this.errorMessage = 'Ocurrió un error inesperado. Por favor, intenta más tarde.';
        }
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  goToResendVerification(): void {
    const emailValue = this.forgotPasswordForm.get('email')?.value;
    this.router.navigate(['/verify-email-pending'], { queryParams: { email: emailValue } });
  }
}

