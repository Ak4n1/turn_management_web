/** Icono y clase de color por tipo de notificación (para el diseño tipo code.html). */
export function getNotificationIcon(type: string): { icon: string; colorClass: string } {
  switch (type) {
    case 'APPOINTMENT_CONFIRMED':
      return { icon: 'fas fa-check-circle', colorClass: 'notif-icon-green' };
    case 'APPOINTMENT_RESCHEDULED':
      return { icon: 'fas fa-exchange-alt', colorClass: 'notif-icon-orange' };
    case 'APPOINTMENT_CANCELLED':
    case 'APPOINTMENT_CANCELLED_BY_ADMIN':
    case 'APPOINTMENT_CANCELLED_BY_USER':
      return { icon: 'fas fa-times-circle', colorClass: 'notif-icon-red' };
    case 'APPOINTMENT_EXPIRED':
      return { icon: 'fas fa-clock', colorClass: 'notif-icon-slate' };
    case 'RESCHEDULE_REQUEST_CREATED':
    case 'RESCHEDULE_REQUEST_APPROVED':
    case 'RESCHEDULE_REQUEST_REJECTED':
    case 'RESCHEDULE_REQUEST_PENDING':
      return { icon: 'fas fa-exchange-alt', colorClass: 'notif-icon-orange' };
    case 'APPOINTMENT_REMINDER':
      return { icon: 'fas fa-bell', colorClass: 'notif-icon-primary' };
    default:
      return { icon: 'fas fa-bell', colorClass: 'notif-icon-slate' };
  }
}

/** Fecha relativa en español: "Hace X horas", "Ayer", "10 Feb", etc. */
export function getRelativeTime(createdAt: string): string {
  const date = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Ahora mismo';
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} días`;
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}
