import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { InputGroupComponent } from '../../molecules/input-group/input-group.component';
import { PasswordInputComponent } from '../../molecules/password-input/password-input.component';
import { FormRowComponent } from '../../molecules/form-row/form-row.component';
import { ButtonComponent } from '../../atoms/button/button.component';
import { AuthService } from '../../../core/services/auth.service';
import { RegisterRequest } from '../../../features/auth/models/register-request.model';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-register-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    InputGroupComponent,
    PasswordInputComponent,
    FormRowComponent,
    ButtonComponent
  ],
  templateUrl: './register-form.component.html',
  styleUrl: './register-form.component.css'
})
export class RegisterFormComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  registerForm: FormGroup;
  isSubmitting: boolean = false;
  serverError: string = '';

  constructor() {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        this.passwordStrengthValidator
      ]],
      confirmPassword: ['', [Validators.required]],
      firstName: ['', [Validators.required, Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.maxLength(50)]]
    }, {
      validators: [this.passwordMatchValidator]
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
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    
    if (!password || !confirmPassword) {
      return null;
    }

    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  get email() { return this.registerForm.get('email'); }
  get password() { return this.registerForm.get('password'); }
  get confirmPassword() { return this.registerForm.get('confirmPassword'); }
  get firstName() { return this.registerForm.get('firstName'); }
  get lastName() { return this.registerForm.get('lastName'); }

  getEmailError(): string {
    const control = this.email;
    if (!control) return '';
    
    // Mostrar errores en tiempo real (dirty) o cuando el campo ha sido tocado
    if (!control.dirty && !control.touched) return '';
    
    if (control.hasError('required')) return 'El email es obligatorio';
    if (control.hasError('email')) return 'Debe ser un email válido';
    if (control.hasError('maxlength')) return 'El email no puede tener más de 100 caracteres';
    return '';
  }

  getPasswordError(): string {
    const control = this.password;
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
    if (this.registerForm.hasError('passwordMismatch') && (control.dirty || control.touched)) {
      return 'Las contraseñas no coinciden';
    }
    return '';
  }

  getFirstNameError(): string {
    const control = this.firstName;
    if (!control) return '';
    
    // Mostrar errores en tiempo real (dirty) o cuando el campo ha sido tocado
    if (!control.dirty && !control.touched) return '';
    
    if (control.hasError('required')) return 'El nombre es obligatorio';
    if (control.hasError('maxlength')) return 'El nombre no puede tener más de 50 caracteres';
    return '';
  }

  getLastNameError(): string {
    const control = this.lastName;
    if (!control) return '';
    
    // Mostrar errores en tiempo real (dirty) o cuando el campo ha sido tocado
    if (!control.dirty && !control.touched) return '';
    
    if (control.hasError('required')) return 'El apellido es obligatorio';
    if (control.hasError('maxlength')) return 'El apellido no puede tener más de 50 caracteres';
    return '';
  }

  isFormValid(): boolean {
    return this.registerForm.valid && !this.isSubmitting;
  }

  onSubmit(): void {
    if (this.isSubmitting || !this.registerForm.valid) {
      return;
    }

    this.isSubmitting = true;
    this.serverError = '';
    this.registerForm.markAllAsTouched();
    
    // Deshabilitar todos los controles del formulario
    this.registerForm.disable();

    const formValue = this.registerForm.value;
    const registerRequest: RegisterRequest = {
      email: formValue.email,
      password: formValue.password,
      firstName: formValue.firstName,
      lastName: formValue.lastName
    };

    this.authService.register(registerRequest).subscribe({
      next: (response) => {
        // Redirigir a página de verificación pendiente
        this.router.navigate(['/verify-email-pending'], {
          queryParams: { email: response.user.email }
        });
      },
      error: (error) => {
        this.isSubmitting = false;
        // Rehabilitar todos los controles del formulario
        this.registerForm.enable();
        
        if (error.status === 400) {
          // Error de validación del servidor
          if (error.error?.message?.includes('email') || error.error?.message?.includes('Email')) {
            this.serverError = 'El email ya está registrado';
            this.email?.setErrors({ serverError: true });
          } else {
            this.serverError = error.error?.message || 'Error de validación. Por favor, verifica los datos.';
          }
        } else if (error.status === 409) {
          this.serverError = 'Error de integridad de datos. Por favor, intenta nuevamente.';
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

