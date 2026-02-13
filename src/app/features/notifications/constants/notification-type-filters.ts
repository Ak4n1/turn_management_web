/** Opciones de filtro por tipo para la página de notificaciones (valor enviado al API y etiqueta). */
export const NOTIFICATION_TYPE_FILTERS: { value: string; label: string }[] = [
  { value: '', label: 'Todos los tipos' },
  { value: 'APPOINTMENT_CONFIRMED', label: 'Turno confirmado' },
  { value: 'APPOINTMENT_CANCELLED', label: 'Turno cancelado' },
  { value: 'APPOINTMENT_CANCELLED_BY_ADMIN', label: 'Turno cancelado por admin' },
  { value: 'APPOINTMENT_RESCHEDULED', label: 'Turno reprogramado' },
  { value: 'RESCHEDULE_REQUEST_PENDING', label: 'Solicitud de reprogramación (pendiente)' },
  { value: 'RESCHEDULE_REQUEST_APPROVED', label: 'Solicitud aprobada' },
  { value: 'RESCHEDULE_REQUEST_REJECTED', label: 'Solicitud rechazada' },
  { value: 'RESCHEDULE_REQUEST_CANCELLED', label: 'Solicitud cancelada' },
  { value: 'APPOINTMENT_REMINDER', label: 'Recordatorio' },
  { value: 'APPOINTMENT_EXPIRED', label: 'Turno expirado' },
  { value: 'APPOINTMENT_CREATED', label: 'Turno creado' },
  { value: 'ADMIN_ANNOUNCEMENT', label: 'Anuncio' },
  { value: 'DAY_CLOSED_WITH_APPOINTMENT', label: 'Día cerrado (con turno)' }
];
