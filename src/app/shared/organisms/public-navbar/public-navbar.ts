import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { NavLinkComponent } from '../../molecules/nav-link/nav-link';
import { ButtonComponent } from '../../atoms/button/button.component';
import { AuthStateService } from '../../../core/services/auth-state';

@Component({
  selector: 'app-public-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, NavLinkComponent, ButtonComponent],
  templateUrl: './public-navbar.html',
  styleUrl: './public-navbar.css'
})
export class PublicNavbarComponent {
  private router = inject(Router);
  private authStateService = inject(AuthStateService);

  isMenuOpen = false;

  get isAuthenticated(): boolean {
    return this.authStateService.isAuthenticated;
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu(): void {
    this.isMenuOpen = false;
  }

  goToDashboard(): void {
    this.closeMenu();
    this.router.navigate(['/dashboard-home']);
  }

  goToLogin(): void {
    this.closeMenu();
    this.router.navigate(['/login']);
  }

  goToRegister(): void {
    this.closeMenu();
    this.router.navigate(['/register']);
  }
}
