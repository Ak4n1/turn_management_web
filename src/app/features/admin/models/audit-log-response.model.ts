/**
 * Modelos para respuestas de auditoría
 * Basados en API_ENDPOINTS_TURNS.md
 */

export type AuditActionType = 
  | 'CANCELLATION'
  | 'CONFIRMATION'
  | 'CREATION'
  | 'RESCHEDULE'
  | 'RESCHEDULE_REQUEST'
  | 'NO_SHOW'
  | 'CONFIGURATION_CHANGE'
  | 'EXCEPTION'
  | 'BLOCK';

export interface AuditLogResponse {
  id: number;
  action: string;
  actionType: AuditActionType;
  userId: number;
  userEmail: string;
  appointmentId?: number;
  rescheduleRequestId?: number;
  configurationId?: number;
  previousState?: string;
  newState?: string;
  reason?: string;
  timestamp: string; // ISO string
  ipAddress?: string;
}

export interface AuditLogsPageResponse {
  logs: AuditLogResponse[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

