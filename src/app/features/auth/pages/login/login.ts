import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginFormComponent } from '../../../../shared/organisms/login-form/login-form';
import { PublicNavbarComponent } from '../../../../shared/organisms/public-navbar/public-navbar';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, LoginFormComponent, PublicNavbarComponent],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {}
