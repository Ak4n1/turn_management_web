import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PublicNavbarComponent } from '../../../../shared/organisms/public-navbar/public-navbar';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, PublicNavbarComponent],
  templateUrl: './about.html',
  styleUrl: './about.css'
})
export class AboutComponent {
}
