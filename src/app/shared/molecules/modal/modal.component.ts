import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.css'
})
export class ModalComponent {
  @Input() isOpen = false;
  @Input() title = '';
  @Input() headerClass = '';
  @Input() noBorder = false;
  /** 'large' = max-width 42rem (guía, documentación) */
  @Input() size: 'default' | 'large' = 'default';
  @Output() close = new EventEmitter<void>();

  onClose(): void {
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.onClose();
    }
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (this.isOpen) {
      this.onClose();
    }
  }
}

