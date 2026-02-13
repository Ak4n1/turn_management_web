export type ManualNotificationRecipientType = 'ALL_USERS' | 'SPECIFIC_USER';

export type ManualNotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH';

/**
 * Request para `POST /api/admin/notifications/send`.
 *
 * Backend: `SendManualNotificationRequest` (US-N011).
 */
export interface SendManualNotificationRequest {
  recipientType: ManualNotificationRecipientType;
  recipientEmail?: string | null;
  type: string;
  title: string;
  message: string;
  priority?: ManualNotificationPriority;
  excludedEmails?: string[];
}

