export interface UserResponse {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  street?: string;
  streetNumber?: string;
  floorApt?: string;
  city?: string;
  postalCode?: string;
  birthDate?: string; // ISO date "yyyy-MM-dd"
  /** Flag del backend: perfil completo para pedir turnos. Si no viene, se calcula en front. */
  profileComplete?: boolean;
  enabled: boolean;
  emailVerified: boolean;
  roles: string[];
  createdAt: string;
}

