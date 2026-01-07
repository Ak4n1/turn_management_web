import { Injectable, inject, Injector } from '@angular/core';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { UserResponse } from '../../features/auth/models/user-response.model';

export interface AuthState {
  user: UserResponse | null;
  isAuthenticated: boolean;
  isEmailVerified: boolean;
  isLoading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class AuthStateService {
  private injector = inject(Injector);
  private initialized = false;

  private initialState: AuthState = {
    user: null,
    isAuthenticated: false,
    isEmailVerified: false,
    isLoading: false,
    error: null
  };

  private authStateSubject = new BehaviorSubject<AuthState>(this.initialState);
  public authState$: Observable<AuthState> = this.authStateSubject.asObservable();

  constructor() {
    // Inicializar estado inmediatamente (sin setTimeout)
    // El import dinámico evita la dependencia circular
    this.initializeAuthState();
  }

  /**
   * Inicializa el estado de autenticación desde las cookies (si existen)
   * Se llama al crear el servicio para restaurar la sesión después de un refresh
   */
  private async initializeAuthState(): Promise<void> {
    // Evitar múltiples inicializaciones
    if (this.initialized) {
      return;
    }

    this.initialized = true;
    this.setLoading(true);

    try {
      // Inyectar AuthService de forma lazy para evitar dependencia circular
      const { AuthService } = await import('./auth.service');
      const authService = this.injector.get(AuthService);
      
      // Intentar hacer refresh token para verificar si hay sesión válida
      // Si hay cookies válidas, el refresh devolverá el usuario
      // Nota: Las cookies HTTP-only no se pueden leer con document.cookie
      // pero se envían automáticamente con withCredentials: true
      const response = await firstValueFrom(authService.refreshToken());
      
      if (response.user) {
        // Hay sesión válida, restaurar estado
        this.setUser(response.user);
      }
    } catch (error: any) {
      // No hay sesión válida, las cookies expiraron, o email no verificado
      // Solo limpiamos el estado aquí, no redirigimos (el guard lo hará si es necesario)
      this.clearState();
    } finally {
      this.setLoading(false);
    }
  }

  get currentState(): AuthState {
    return this.authStateSubject.value;
  }

  get user(): UserResponse | null {
    return this.currentState.user;
  }

  get isAuthenticated(): boolean {
    return this.currentState.isAuthenticated;
  }

  get isEmailVerified(): boolean {
    return this.currentState.isEmailVerified;
  }

  setUser(user: UserResponse | null): void {
    this.updateState({
      user,
      isAuthenticated: !!user,
      isEmailVerified: user?.emailVerified ?? false,
      error: null
    });
  }

  setLoading(loading: boolean): void {
    this.updateState({ isLoading: loading });
  }

  setError(error: string | null): void {
    this.updateState({ error });
  }

  clearState(): void {
    this.authStateSubject.next(this.initialState);
  }

  /**
   * Refresca el estado del usuario llamando al endpoint de refresh token
   * Útil después de cambios en el servidor (ej: verificación de email)
   */
  async refreshUserState(): Promise<void> {
    if (!this.isAuthenticated) {
      return;
    }

    try {
      const { AuthService } = await import('./auth.service');
      const authService = this.injector.get(AuthService);
      const response = await firstValueFrom(authService.refreshToken());
      
      if (response.user) {
        this.setUser(response.user);
      }
    } catch (error) {
      // Si falla el refresh, limpiar estado
      this.clearState();
    }
  }

  private updateState(partial: Partial<AuthState>): void {
    this.authStateSubject.next({
      ...this.currentState,
      ...partial
    });
  }
}
