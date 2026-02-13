import { SystemNotificationResponse } from './system-notification-response.model';

export interface SystemNotificationsResponse {
  notifications: SystemNotificationResponse[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
  unreadCount: number;
}
