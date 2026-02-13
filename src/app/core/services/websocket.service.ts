import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { AuthStateService } from './auth-state';
import { 
  WebSocketMessage, 
  WebSocketMessageType, 
  WebSocketConnectionState 
} from '../models/websocket-message.model';

/**
 * Servicio para manejar conexiones WebSocket y actualizaciones en tiempo real.
 * 
 * Características:
 * - Conexión automática al iniciar sesión
 * - Reconexión automática en caso de pérdida de conexión
 * - Manejo de heartbeat (ping/pong)
 * - Renovación automática de token
 * - Distribución de mensajes a componentes suscritos
 */
@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private ws: WebSocket | null = null;
  private connectionState$ = new BehaviorSubject<WebSocketConnectionState>(WebSocketConnectionState.DISCONNECTED);
  private messages$ = new Subject<WebSocketMessage>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000; // 3 segundos
  private reconnectTimer: any = null;
  private isManualClose = false;
  private tokenRefreshInProgress = false;

  // URL base del API
  private readonly apiUrl = 'http://localhost:8080';

  // Observables públicos
  public readonly connectionState: Observable<WebSocketConnectionState>;
  public readonly messages: Observable<WebSocketMessage>;

  constructor(private authStateService: AuthStateService) {
    this.connectionState = this.connectionState$.asObservable();
    this.messages = this.messages$.asObservable();

    // Escuchar cambios en el estado de autenticación
    this.authStateService.authState$.subscribe(state => {
      if (state.isAuthenticated && !state.isLoading) {
        this.connect();
      } else {
        this.disconnect();
      }
    });
  }

  /**
   * Conecta al servidor WebSocket.
   * 
   * Nota: Las cookies httpOnly se envían automáticamente con WebSocket
   * si están configuradas correctamente (SameSite, Secure, etc).
   * El backend leerá el token de las cookies automáticamente.
   */
  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return; // Ya está conectado
    }

    if (this.ws?.readyState === WebSocket.CONNECTING) {
      return; // Ya está conectando
    }

    this.isManualClose = false;
    this.connectionState$.next(WebSocketConnectionState.CONNECTING);

    // Construir URL WebSocket
    // Las cookies httpOnly se envían automáticamente, no necesitamos leerlas
    // El backend leerá el token de las cookies si no está en query parameter
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    let wsHost: string;
    
    if (this.apiUrl.startsWith('http://') || this.apiUrl.startsWith('https://')) {
      wsHost = this.apiUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
    } else {
      // Usar el mismo protocolo, host y puerto de la página actual
      wsHost = window.location.host;
    }
    
    // No agregar token en query parameter, las cookies se envían automáticamente
    const wsUrl = `${wsProtocol}//${wsHost}/api/ws/appointments`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.connectionState$.next(WebSocketConnectionState.CONNECTED);
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.ws.onerror = (error) => {
        this.connectionState$.next(WebSocketConnectionState.ERROR);
      };

      this.ws.onclose = (event) => {
        if (!this.isManualClose && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        } else {
          this.connectionState$.next(WebSocketConnectionState.DISCONNECTED);
        }
      };

    } catch (error) {
      this.connectionState$.next(WebSocketConnectionState.ERROR);
      this.scheduleReconnect();
    }
  }

  /**
   * Desconecta del servidor WebSocket.
   */
  disconnect(): void {
    this.isManualClose = true;
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.connectionState$.next(WebSocketConnectionState.DISCONNECTED);
  }

  /**
   * Maneja mensajes recibidos del servidor.
   */
  private handleMessage(data: string): void {
    try {
      const message: WebSocketMessage = JSON.parse(data);

      switch (message.type) {
        case WebSocketMessageType.APPOINTMENT_CREATED:
        case WebSocketMessageType.APPOINTMENT_CONFIRMED:
        case WebSocketMessageType.APPOINTMENT_CANCELLED:
        case WebSocketMessageType.APPOINTMENT_RESCHEDULED:
        case WebSocketMessageType.APPOINTMENT_EXPIRED:
        case WebSocketMessageType.AVAILABILITY_UPDATED:
        case WebSocketMessageType.NOTIFICATION_COUNT_UPDATED:
        case WebSocketMessageType.RESCHEDULE_REQUEST_CREATED:
        case WebSocketMessageType.RESCHEDULE_REQUEST_APPROVED:
        case WebSocketMessageType.RESCHEDULE_REQUEST_REJECTED:
          this.handleAppointmentUpdate(message);
          break;

        case WebSocketMessageType.ONLINE_USERS_COUNT:
          this.messages$.next(message);
          break;

        case WebSocketMessageType.PING:
          this.handlePing(message);
          break;

        case WebSocketMessageType.TOKEN_REFRESH_REQUIRED:
          this.handleTokenRefreshRequired();
          break;

        case WebSocketMessageType.IDLE_TIMEOUT:
          break;

        case WebSocketMessageType.SERVER_SHUTDOWN:
          this.handleServerShutdown(message.reconnectInSeconds || 30);
          break;

        default:
      }
    } catch (error) {
      // Error al parsear mensaje, ignorar
    }
  }

  /**
   * Maneja una actualización de turno recibida.
   */
  private handleAppointmentUpdate(message: WebSocketMessage): void {
    // Enviar ACK al servidor
    this.sendAck(message.appointmentId);

    // Emitir mensaje a los suscriptores
    this.messages$.next(message);
  }

  /**
   * Maneja ping del servidor (heartbeat).
   */
  private handlePing(message: WebSocketMessage): void {
    // Responder con PONG
    this.sendMessage({
      type: WebSocketMessageType.PONG,
      timestamp: message.timestamp
    });
  }

  /**
   * Maneja requerimiento de refresh de token.
   */
  private handleTokenRefreshRequired(): void {
    if (this.tokenRefreshInProgress) {
      return; // Ya está refrescando
    }

    this.tokenRefreshInProgress = true;

    // Usar authStateService para refrescar el token
    this.authStateService.refreshUserState().then(() => {
      this.disconnect();
      setTimeout(() => {
        this.tokenRefreshInProgress = false;
        this.connect();
      }, 1000);
    }).catch(() => {
      this.tokenRefreshInProgress = false;
      this.disconnect();
    });
  }

  /**
   * Maneja shutdown del servidor.
   */
  private handleServerShutdown(reconnectInSeconds: number): void {
    this.disconnect();
    
    setTimeout(() => {
      this.isManualClose = false;
      this.connect();
    }, reconnectInSeconds * 1000);
  }

  /**
   * Programa reconexión después de un delay.
   */
  private scheduleReconnect(): void {
    if (this.isManualClose) {
      return;
    }

    this.reconnectAttempts++;
    this.connectionState$.next(WebSocketConnectionState.RECONNECTING);

    const delay = this.reconnectDelay * this.reconnectAttempts; // Backoff exponencial

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Envía un mensaje al servidor.
   */
  private sendMessage(message: WebSocketMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
      } catch (error) {
        // Error al enviar, ignorar
      }
    }
  }

  /**
   * Envía ACK de mensaje recibido.
   */
  private sendAck(appointmentId?: number): void {
    this.sendMessage({
      type: WebSocketMessageType.ACK,
      appointmentId: appointmentId
    });
  }

  /**
   * Obtiene el estado actual de la conexión.
   */
  getCurrentState(): WebSocketConnectionState {
    return this.connectionState$.value;
  }
}

