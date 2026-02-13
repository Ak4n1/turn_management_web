import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Modal de éxito al guardar la configuración (Reglas de Atención).
 * Diseño inspirado en code.html: icono grande con glow, ítems con check, botón Entendido.
 */
@Component({
  selector: 'app-config-saved-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './config-saved-modal.component.html',
  styleUrl: './config-saved-modal.component.css'
})
export class ConfigSavedModalComponent {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();

  onClose(): void {
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('config-saved-backdrop')) {
      this.onClose();
    }
  }

  onEntendido(): void {
    this.onClose();
  }
}
