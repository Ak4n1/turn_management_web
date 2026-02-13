/** Request para actualizar perfil (Mi Cuenta). Todos los campos opcionales. */
export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  street?: string;
  streetNumber?: string;
  floorApt?: string;
  city?: string;
  postalCode?: string;
  birthDate?: string; // ISO "yyyy-MM-dd"
}
