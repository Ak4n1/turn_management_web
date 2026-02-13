/**
 * Modelos para gestión de usuarios (admin)
 */

export interface AdminUserResponse {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  street: string | null;
  streetNumber: string | null;
  floorApt: string | null;
  city: string | null;
  postalCode: string | null;
  birthDate: string | null;
  profileComplete: boolean;
  enabled: boolean;
  emailVerified: boolean;
  roles: string[];
  createdAt: string; // ISO
}

export interface AdminUsersPageResponse {
  content: AdminUserResponse[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}
