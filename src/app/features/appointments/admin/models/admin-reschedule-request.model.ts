/** Estado de una solicitud de reprogramación (usuario → admin). */
export type RescheduleRequestState =
  | 'PENDING_ADMIN_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'CANCELLED';

/** Una solicitud de reprogramación para el admin (con datos del usuario). */
export interface AdminRescheduleRequestResponse {
  id: number;
  appointmentId: number;
  userId: number;
  userEmail: string;
  userFirstName: string;
  userLastName: string;
  currentDate: string;
  currentStartTime: string;
  requestedDate: string;
  requestedStartTime: string;
  reason: string | null;
  state: RescheduleRequestState;
  rejectionReason?: string | null;
  expirationReason?: string | null;
  processedByAdminId?: number | null;
  createdAt: string;
  updatedAt?: string | null;
  processedAt?: string | null;
}

/** Respuesta paginada de solicitudes de reprogramación (admin). */
export interface AdminRescheduleRequestsResponse {
  requests: AdminRescheduleRequestResponse[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}
