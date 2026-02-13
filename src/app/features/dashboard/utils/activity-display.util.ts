export function formatActivityDate(d: string): string {
  const date = new Date(d + 'T12:00:00');
  return date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
}

export function formatActivityTime(t: string): string {
  return (t || '').substring(0, 5);
}

export function formatNotificationDate(createdAt: string): string {
  const d = new Date(createdAt);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return 'Hace un momento';
  if (diff < 3600000) return `Hace ${Math.floor(diff / 60000)} min`;
  if (diff < 86400000) return `Hace ${Math.floor(diff / 3600000)} h`;
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}

const stateLabels: Record<string, string> = {
  CREATED: 'Pendiente', CONFIRMED: 'Confirmado', CANCELLED: 'Cancelado',
  CANCELLED_BY_ADMIN: 'Cancelado', EXPIRED: 'Expirado', NO_SHOW: 'No asistió',
  COMPLETED: 'Completado', RESCHEDULED: 'Reprogramado'
};

const stateClasses: Record<string, string> = {
  CREATED: 'state-pending', CONFIRMED: 'state-confirmed', CANCELLED: 'state-cancelled',
  CANCELLED_BY_ADMIN: 'state-cancelled', EXPIRED: 'state-expired', NO_SHOW: 'state-noshow',
  COMPLETED: 'state-completed', RESCHEDULED: 'state-rescheduled'
};

export function getStateLabel(state: string): string {
  return stateLabels[state] || state;
}

export function getStateClass(state: string): string {
  return stateClasses[state] || '';
}

/** Icono por tipo de notificación para el feed de actividad */
export function getActivityIcon(type: string): string {
  const map: Record<string, string> = {
    APPOINTMENT_CONFIRMED: 'fas fa-check-circle',
    APPOINTMENT_RESCHEDULED: 'fas fa-exchange-alt',
    APPOINTMENT_CANCELLED: 'fas fa-times-circle',
    APPOINTMENT_CANCELLED_BY_ADMIN: 'fas fa-times-circle',
    APPOINTMENT_EXPIRED: 'fas fa-clock',
    APPOINTMENT_CREATED: 'fas fa-calendar-plus',
    RESCHEDULE_REQUEST_APPROVED: 'fas fa-check-circle',
    RESCHEDULE_REQUEST_REJECTED: 'fas fa-times-circle',
    APPOINTMENT_REMINDER: 'fas fa-bell'
  };
  return map[type] || 'fas fa-bell';
}

export function getActivityIconClass(type: string): string {
  if (type?.includes('CONFIRMED') || type?.includes('APPROVED') || type?.includes('CREATED')) return 'icon-green';
  if (type?.includes('CANCELLED') || type?.includes('REJECTED') || type?.includes('EXPIRED')) return 'icon-red';
  if (type?.includes('RESCHEDUL') || type?.includes('EXCHANGE')) return 'icon-orange';
  return 'icon-slate';
}
