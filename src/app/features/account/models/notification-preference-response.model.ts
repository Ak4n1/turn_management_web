export interface NotificationPreferenceResponse {
  id: number;
  userId: number;
  emailEnabled: boolean;
  appointmentCreated: boolean;
  appointmentConfirmed: boolean;
  appointmentCancelled: boolean;
  appointmentRescheduled: boolean;
  reminderEnabled: boolean;
  reminderHoursBefore: number;
  createdAt: string;
  updatedAt: string;
}
