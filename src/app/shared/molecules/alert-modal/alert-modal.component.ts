import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ModalComponent } from '../modal/modal.component';
import { ButtonComponent } from '../../atoms/button/button.component';

/**
 * Alert Modal Component
 * 
 * Modal reutilizable para mostrar mensajes de éxito o error.
 * Puede mostrar un solo botón (cerrar) o dos botones (cancelar/confirmar).
 */
@Component({
  selector: 'app-alert-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent, ButtonComponent],
  templateUrl: './alert-modal.component.html',
  styleUrl: './alert-modal.component.css'
})
export class AlertModalComponent {
  @Input() isOpen = false;
  @Input() type: 'success' | 'error' | 'warning' | 'info' = 'info';
  @Input() title = '';
  @Input() message = '';
  @Input() showConfirmButton = true;
  @Input() showIcon = true;
  @Input() confirmButtonText = 'Aceptar';
  @Input() showCancelButton = false;
  @Input() cancelButtonText = 'Cancelar';
  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  constructor(private sanitizer: DomSanitizer) { }

  onClose(): void {
    this.close.emit();
  }

  onConfirm(): void {
    this.confirm.emit();
    this.onClose();
  }

  onCancel(): void {
    this.cancel.emit();
    this.onClose();
  }

  getIconClass(): string {
    switch (this.type) {
      case 'success':
        return 'fas fa-check-circle';
      case 'error':
        return 'fas fa-exclamation-circle';
      case 'warning':
        return 'fas fa-exclamation-triangle';
      case 'info':
      default:
        return 'fas fa-info-circle';
    }
  }

  getTypeClass(): string {
    return `alert-${this.type}`;
  }

  /**
   * Formatea el mensaje para mostrar mejor las listas y secciones
   */
  getFormattedMessage(): SafeHtml {
    if (!this.message) return '';

    const lines = this.message.split('\n');
    let formattedHtml = '';
    let inList = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Línea vacía
      if (!line) {
        if (inList) {
          formattedHtml += '</div>';
          inList = false;
        }
        formattedHtml += '<br>';
        continue;
      }

      // Advertencia especial (línea con ADVERTENCIA al inicio)
      if (line.toUpperCase().startsWith('ADVERTENCIA')) {
        if (inList) {
          formattedHtml += '</div>';
          inList = false;
        }
        formattedHtml += `<div class="alert-warning-text">${this.escapeHtml(line)}</div>`;
        continue;
      }

      // Título de sección (líneas que terminan con : y no son listas)
      if (line.endsWith(':') && !line.match(/^[•\-\*]/) && !line.match(/^\d+\./)) {
        if (inList) {
          formattedHtml += '</div>';
          inList = false;
        }
        formattedHtml += `<div class="alert-section-title">${this.escapeHtml(line)}</div>`;
        continue;
      }

      // Lista (líneas que empiezan con •) - Usar divs en lugar de ul/li para evitar bullets
      if (line.match(/^[•\-\*]\s/)) {
        if (!inList) {
          formattedHtml += '<div class="alert-list">';
          inList = true;
        }
        const listItem = line.replace(/^[•\-\*]\s/, '').trim();

        if (this.type === 'success') {
          formattedHtml += `<div class="alert-list-item-success"><i class="fas fa-check-circle"></i><span>${this.escapeHtml(listItem)}</span></div>`;
        } else {
          formattedHtml += `<div class="alert-list-item">${this.escapeHtml(listItem)}</div>`;
        }
        continue;
      }

      // Estadísticas (líneas con formato "Label: número")
      if (line.match(/^[^:]+:\s*\d+$/)) {
        if (inList) {
          formattedHtml += '</div>';
          inList = false;
        }
        const [label, value] = line.split(':').map(s => s.trim());
        formattedHtml += `<div class="alert-stat"><strong>${this.escapeHtml(label)}:</strong> <span class="alert-stat-value">${this.escapeHtml(value)}</span></div>`;
        continue;
      }

      // Nota especial
      if (line.match(/^Nota:/i)) {
        if (inList) {
          formattedHtml += '</div>';
          inList = false;
        }
        const noteContent = line.replace(/^Nota:\s*/i, '').trim();
        formattedHtml += `<div class="alert-note"><strong>Nota:</strong> ${this.escapeHtml(noteContent)}</div>`;
        continue;
      }

      // Pregunta (líneas que terminan con ?)
      if (line.endsWith('?') && line.length > 10) {
        if (inList) {
          formattedHtml += '</div>';
          inList = false;
        }
        formattedHtml += `<div class="alert-question">${this.escapeHtml(line)}</div>`;
        continue;
      }

      // Texto normal (párrafo)
      if (inList) {
        formattedHtml += '</div>';
        inList = false;
      }
      formattedHtml += `<p class="alert-paragraph">${this.escapeHtml(line)}</p>`;
    }

    // Cerrar lista si está abierta
    if (inList) {
      formattedHtml += '</div>';
    }

    return this.sanitizer.sanitize(1, formattedHtml) as SafeHtml;
  }

  /**
   * Escapa HTML para prevenir XSS
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
