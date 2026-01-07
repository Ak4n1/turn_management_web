import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type SpinnerSize = 'small' | 'medium' | 'large';

@Component({
  selector: 'app-spinner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './spinner.component.html',
  styleUrl: './spinner.component.css'
})
export class SpinnerComponent {
  @Input() size: SpinnerSize = 'medium';
  @Input() ariaLabel: string = 'Cargando...';

  get spinnerClasses(): string {
    return `spinner spinner-${this.size}`;
  }
}

