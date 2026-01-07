/**
 * Modelos para mensajes WebSocket
 */

export enum WebSocketMessageType {
  // Mensajes del servidor al cliente
  APPOINTMENT_CREATED = 'APPOINTMENT_CREATED',
  APPOINTMENT_CONFIRMED = 'APPOINTMENT_CONFIRMED',
  APPOINTMENT_CANCELLED = 'APPOINTMENT_CANCELLED',
  APPOINTMENT_RESCHEDULED = 'APPOINTMENT_RESCHEDULED',
  APPOINTMENT_EXPIRED = 'APPOINTMENT_EXPIRED',
  AVAILABILITY_UPDATED = 'AVAILABILITY_UPDATED',
  RESCHEDULE_REQUEST_CREATED = 'RESCHEDULE_REQUEST_CREATED',
  RESCHEDULE_REQUEST_APPROVED = 'RESCHEDULE_REQUEST_APPROVED',
  RESCHEDULE_REQUEST_REJECTED = 'RESCHEDULE_REQUEST_REJECTED',
  PING = 'PING',
  TOKEN_REFRESH_REQUIRED = 'TOKEN_REFRESH_REQUIRED',
  IDLE_TIMEOUT = 'IDLE_TIMEOUT',
  SERVER_SHUTDOWN = 'SERVER_SHUTDOWN',
  
  // Mensajes del cliente al servidor
  PONG = 'PONG',
  ACK = 'ACK'
}

export enum WebSocketConnectionState {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  RECONNECTING = 'RECONNECTING',
  ERROR = 'ERROR'
}

export interface WebSocketMessage {
  type: WebSocketMessageType;
  appointmentId?: number;
  rescheduleRequestId?: number;
  title?: string;
  message?: string;
  data?: Record<string, any>;
  timestamp?: number;
  reconnectInSeconds?: number;
}

