import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-error-text',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './error-text.component.html',
  styleUrl: './error-text.component.css'
})
export class ErrorTextComponent {
  @Input() message?: string;
  @Input() id?: string;
}

