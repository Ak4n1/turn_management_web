export interface UpdateNotificationPreferenceRequest {
  emailEnabled: boolean;
  appointmentCreated: boolean;
  appointmentConfirmed: boolean;
  appointmentCancelled: boolean;
  appointmentRescheduled: boolean;
  reminderEnabled: boolean;
  reminderHoursBefore: number; // 1–168 (horas, máx 7 días)
}
