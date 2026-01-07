import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebSocketService } from '../../../../../../core/services/websocket.service';
import { WebSocketMessage, WebSocketConnectionState } from '../../../../../../core/models/websocket-message.model';
import { Subscription } from 'rxjs';
import { ButtonComponent } from '../../../../../../shared/atoms/button/button.component';

@Component({
  selector: 'app-websocket-test',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './websocket-test.html',
  styleUrl: './websocket-test.css'
})
export class WebSocketTestComponent implements OnInit, OnDestroy {
  private webSocketService = inject(WebSocketService);
  
  messages: WebSocketMessage[] = [];
  connectionState: WebSocketConnectionState = WebSocketConnectionState.DISCONNECTED;
  private messagesSubscription?: Subscription;
  private connectionStateSubscription?: Subscription;

  ngOnInit(): void {
    // Suscribirse a mensajes WebSocket
    this.messagesSubscription = this.webSocketService.messages.subscribe(message => {
      this.messages.unshift(message); // Agregar al inicio de la lista
      // Mantener solo los últimos 50 mensajes
      if (this.messages.length > 50) {
        this.messages = this.messages.slice(0, 50);
      }
    });

    // Suscribirse al estado de conexión
    this.connectionStateSubscription = this.webSocketService.connectionState.subscribe(state => {
      this.connectionState = state;
    });
  }

  ngOnDestroy(): void {
    this.messagesSubscription?.unsubscribe();
    this.connectionStateSubscription?.unsubscribe();
  }

  clearMessages(): void {
    this.messages = [];
  }

  getConnectionStateClass(): string {
    switch (this.connectionState) {
      case WebSocketConnectionState.CONNECTED:
        return 'state-connected';
      case WebSocketConnectionState.CONNECTING:
      case WebSocketConnectionState.RECONNECTING:
        return 'state-connecting';
      case WebSocketConnectionState.ERROR:
        return 'state-error';
      default:
        return 'state-disconnected';
    }
  }

  getConnectionStateText(): string {
    switch (this.connectionState) {
      case WebSocketConnectionState.CONNECTED:
        return 'Conectado';
      case WebSocketConnectionState.CONNECTING:
        return 'Conectando...';
      case WebSocketConnectionState.RECONNECTING:
        return 'Reconectando...';
      case WebSocketConnectionState.ERROR:
        return 'Error';
      default:
        return 'Desconectado';
    }
  }

  formatTimestamp(timestamp?: number): string {
    if (!timestamp) {
      return 'Ahora';
    }
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-AR');
  }

  trackByMessage(index: number, message: WebSocketMessage): any {
    return message.timestamp || index;
  }
}

