import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { InputGroupComponent } from '../../molecules/input-group/input-group.component';
import { PasswordInputComponent } from '../../molecules/password-input/password-input.component';
import { ButtonComponent } from '../../atoms/button/button.component';
import { AuthService } from '../../../core/services/auth.service';
import { AuthStateService } from '../../../core/services/auth-state';

@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    InputGroupComponent,
    PasswordInputComponent,
    ButtonComponent
  ],
  templateUrl: './login-form.html',
  styleUrl: './login-form.css'
})
export class LoginFormComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private authStateService = inject(AuthStateService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loginForm: FormGroup;
  isSubmitting: boolean = false;
  serverError: string = '';

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }

  getEmailError(): string {
    const control = this.email;
    if (!control || !control.touched) return '';
    
    if (control.hasError('required')) return 'El email es obligatorio';
    if (control.hasError('email')) return 'Debe ser un email válido';
    return '';
  }

  getPasswordError(): string {
    const control = this.password;
    if (!control || !control.touched) return '';
    
    if (control.hasError('required')) return 'La contraseña es obligatoria';
    return '';
  }

  isFormValid(): boolean {
    return this.loginForm.valid && !this.isSubmitting;
  }

  onSubmit(): void {
    if (this.isSubmitting || !this.loginForm.valid) {
      return;
    }

    this.isSubmitting = true;
    this.serverError = '';
    this.loginForm.markAllAsTouched();
    
    // Deshabilitar todos los controles del formulario
    this.loginForm.disable();

    const formValue = this.loginForm.value;
    const loginRequest = {
      email: formValue.email,
      password: formValue.password
    };

    this.authService.login(loginRequest).subscribe({
      next: (response) => {
        // Actualizar estado de autenticación
        if (response.user) {
          this.authStateService.setUser(response.user);
        }

        // Redirigir a dashboard-home o a la URL de retorno si existe
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard-home';
        this.router.navigate([returnUrl]);
      },
      error: (error) => {
        this.isSubmitting = false;
        // Rehabilitar todos los controles del formulario
        this.loginForm.enable();
        
        // Limpiar campo de contraseña por seguridad
        this.password?.setValue('');
        
        // Manejo de errores según la US-002
        if (error.status === 403) {
          // Email no verificado - redirigir a página de verificación
          const email = this.email?.value || '';
          this.router.navigate(['/verify-email-pending'], {
            queryParams: { email: email, fromLogin: 'true' }
          });
          return; // Salir temprano, no mostrar error
        } else if (error.status === 401) {
          // Verificar si es cuenta bloqueada o deshabilitada
          const errorMessage = error.error?.message || '';
          
          if (errorMessage.toLowerCase().includes('bloqueada') || 
              errorMessage.toLowerCase().includes('bloqueado')) {
            this.serverError = 'La cuenta está bloqueada debido a demasiados intentos fallidos de inicio de sesión. Por favor, intente nuevamente más tarde.';
          } else if (errorMessage.toLowerCase().includes('deshabilitada') || 
                     errorMessage.toLowerCase().includes('deshabilitado')) {
            this.serverError = 'La cuenta está deshabilitada';
          } else {
            // Mensaje genérico por seguridad (no revela si email existe)
            this.serverError = 'Email o contraseña inválidos';
          }
        } else if (error.status === 423) {
          // Cuenta bloqueada (código alternativo)
          this.serverError = 'La cuenta está bloqueada. Por favor, intente nuevamente más tarde.';
        } else if (error.status === 429) {
          // Rate limit excedido
          const retryAfter = error.headers?.get('Retry-After');
          if (retryAfter) {
            this.serverError = `Demasiadas solicitudes. Por favor, espera ${retryAfter} segundos antes de intentar nuevamente.`;
          } else {
            this.serverError = 'Demasiadas solicitudes. Por favor, espera unos momentos antes de intentar nuevamente.';
          }
        } else if (error.status === 500) {
          this.serverError = 'Ocurrió un error inesperado. Por favor, intenta más tarde.';
        } else if (error.status === 0 || error.status === undefined) {
          // Error de red
          this.serverError = 'Error de conexión. Por favor, verifica tu internet e intenta nuevamente.';
        } else {
          this.serverError = 'Ocurrió un error inesperado. Por favor, intenta nuevamente.';
        }
      }
    });
  }
}
