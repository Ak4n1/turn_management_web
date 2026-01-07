import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-label',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './label.component.html',
  styleUrl: './label.component.css'
})
export class LabelComponent {
  @Input() for?: string;
  @Input() required: boolean = false;
  @Input() ariaLabel?: string;
  @Input() icon?: string; 
}

