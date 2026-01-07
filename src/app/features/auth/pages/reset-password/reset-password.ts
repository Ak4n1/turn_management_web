import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ButtonComponent } from '../../../../shared/atoms/button/button.component';
import { PasswordInputComponent } from '../../../../shared/molecules/password-input/password-input.component';
import { PublicNavbarComponent } from '../../../../shared/organisms/public-navbar/public-navbar';
import { AuthService } from '../../../../core/services/auth.service';

type ResetPasswordState = 'loading' | 'form' | 'success' | 'error';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent, PasswordInputComponent, PublicNavbarComponent, RouterLink],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css'
})
export class ResetPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  resetPasswordForm: FormGroup;
  isSubmitting: boolean = false;
  state: ResetPasswordState = 'loading';
  errorMessage: string = '';
  token: string = '';

  constructor() {
    this.resetPasswordForm = this.fb.group({
      newPassword: ['', [
        Validators.required,
        Validators.minLength(8),
        this.passwordStrengthValidator
      ]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: [this.passwordMatchValidator]
    });
  }

  ngOnInit(): void {
    // Extraer token de la URL (path parameter)
    this.route.params.subscribe(params => {
      this.token = params['token'];
      if (this.token) {
        // Token encontrado, mostrar formulario
        this.state = 'form';
      } else {
        // Token no encontrado, mostrar error
        this.state = 'error';
        this.errorMessage = 'Token de restablecimiento no encontrado en la URL.';
      }
    });
  }

  /**
   * Validador personalizado para la fortaleza de la contraseña
   * Debe contener: al menos una mayúscula, un número y un carácter especial
   */
  passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null; // Dejar que Validators.required maneje el caso vacío
    }

    const value = control.value as string;
    const errors: ValidationErrors = {};

    // Verificar mayúscula
    if (!/[A-Z]/.test(value)) {
      errors['passwordNoUppercase'] = true;
    }

    // Verificar número
    if (!/\d/.test(value)) {
      errors['passwordNoNumber'] = true;
    }

    // Verificar carácter especial
    if (!/[@$!%*?&]/.test(value)) {
      errors['passwordNoSpecial'] = true;
    }

    return Object.keys(errors).length > 0 ? errors : null;
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const newPassword = control.get('newPassword');
    const confirmPassword = control.get('confirmPassword');
    
    if (!newPassword || !confirmPassword) {
      return null;
    }

    return newPassword.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  get newPassword() {
    return this.resetPasswordForm.get('newPassword');
  }

  get confirmPassword() {
    return this.resetPasswordForm.get('confirmPassword');
  }

  getNewPasswordError(): string {
    const control = this.newPassword;
    if (!control) return '';
    
    // Mostrar errores en tiempo real (dirty) o cuando el campo ha sido tocado
    if (!control.dirty && !control.touched) return '';
    
    if (control.hasError('required')) return 'La contraseña es obligatoria';
    if (control.hasError('minlength')) {
      return 'La contraseña debe tener al menos 8 caracteres';
    }
    
    // Errores de fortaleza de contraseña
    const errors: string[] = [];
    if (control.hasError('passwordNoUppercase')) {
      errors.push('una mayúscula');
    }
    if (control.hasError('passwordNoNumber')) {
      errors.push('un número');
    }
    if (control.hasError('passwordNoSpecial')) {
      errors.push('un carácter especial (@$!%*?&)');
    }
    
    if (errors.length > 0) {
      return `La contraseña debe contener al menos: ${errors.join(', ')}`;
    }
    
    return '';
  }

  getConfirmPasswordError(): string {
    const control = this.confirmPassword;
    if (!control) return '';
    
    // Mostrar errores en tiempo real (dirty) o cuando el campo ha sido tocado
    if (!control.dirty && !control.touched) return '';
    
    if (control.hasError('required')) return 'Debes confirmar la contraseña';
    if (this.resetPasswordForm.hasError('passwordMismatch') && (control.dirty || control.touched)) {
      return 'Las contraseñas no coinciden';
    }
    return '';
  }

  isFormValid(): boolean {
    return this.resetPasswordForm.valid && !this.isSubmitting;
  }

  onSubmit(): void {
    if (this.resetPasswordForm.invalid || this.isSubmitting || !this.token) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.resetPasswordForm.markAllAsTouched();
    
    // Deshabilitar todos los controles del formulario
    this.resetPasswordForm.disable();

    const newPasswordValue = this.resetPasswordForm.get('newPassword')?.value;

    this.authService.resetPassword(this.token, newPasswordValue).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.state = 'success';
        // Rehabilitar formulario (aunque no se usará)
        this.resetPasswordForm.enable();
      },
      error: (error) => {
        this.isSubmitting = false;
        this.state = 'error';
        // Rehabilitar todos los controles del formulario
        this.resetPasswordForm.enable();
        
        if (error.status === 400) {
          // Token inválido/expirado o error de validación
          const errorMessage = error.error?.message || 'Error al restablecer la contraseña';
          if (errorMessage.includes('token') || errorMessage.includes('Token') || 
              errorMessage.includes('expirado') || errorMessage.includes('inválido')) {
            this.errorMessage = 'El enlace de restablecimiento ha expirado o ya ha sido utilizado.';
          } else {
            this.errorMessage = errorMessage;
          }
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

  goToForgotPassword(): void {
    this.router.navigate(['/forgot-password']);
  }
}

