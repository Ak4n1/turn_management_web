import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PublicNavbarComponent } from '../../../../shared/organisms/public-navbar/public-navbar';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, PublicNavbarComponent],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class HomeComponent {
}
