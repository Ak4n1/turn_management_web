/** Una notificación del sistema (campanita / lista). */
export interface SystemNotificationResponse {
  id: number;
  type: string; // NotificationType del backend (ej. APPOINTMENT_CONFIRMED)
  recipientId: number;
  title: string;
  message: string;
  relatedEntityType?: string;
  relatedEntityId?: number;
  read: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt?: string;
}
