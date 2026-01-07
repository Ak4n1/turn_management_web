import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PublicNavbarComponent } from '../../../../shared/organisms/public-navbar/public-navbar';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, PublicNavbarComponent],
  templateUrl: './services.html',
  styleUrl: './services.css'
})
export class ServicesComponent {
}
