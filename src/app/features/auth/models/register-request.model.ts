export interface RegisterRequest {
  email: string;
  password: string;
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

