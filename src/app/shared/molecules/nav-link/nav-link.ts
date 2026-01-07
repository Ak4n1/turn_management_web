import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-nav-link',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './nav-link.html',
  styleUrl: './nav-link.css'
})
export class NavLinkComponent {
  @Input() route: string = '';
  @Input() label: string = '';
  @Input() icon?: string; // Font Awesome icon class
  @Output() clicked = new EventEmitter<void>();

  onClick(): void {
    this.clicked.emit();
  }
}
