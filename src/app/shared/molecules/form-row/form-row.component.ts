import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-form-row',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './form-row.component.html',
  styleUrl: './form-row.component.css'
})
export class FormRowComponent {
  @Input() gap: string = 'var(--spacing-md)';
}

