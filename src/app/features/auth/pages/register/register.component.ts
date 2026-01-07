import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RegisterFormComponent } from '../../../../shared/organisms/register-form/register-form.component';
import { PublicNavbarComponent } from '../../../../shared/organisms/public-navbar/public-navbar';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RegisterFormComponent, PublicNavbarComponent],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {}

