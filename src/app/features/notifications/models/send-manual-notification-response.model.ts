/**
 * Response de `POST /api/admin/notifications/send`.
 *
 * Backend: `SendManualNotificationResponse` (US-N011).
 */
export interface SendManualNotificationResponse {
  success: boolean;
  totalRecipients: number;
  sentImmediately: number;
  pendingDelivery: number;
  excludedByPreferences: number;
  notificationIds: number[];
  message: string;
}

