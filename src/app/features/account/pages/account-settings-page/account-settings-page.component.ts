import { Component, computed, effect, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthStateService, AuthState } from '../../../../core/services/auth-state';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationPreferenceService } from '../../services/notification-preference.service';
import { ButtonComponent } from '../../../../shared/atoms/button/button.component';

type TabId = 'personal' | 'security' | 'notifications';

const initialAuthState: AuthState = {
  user: null,
  isAuthenticated: false,
  isEmailVerified: false,
  isLoading: false,
  error: null
};

@Component({
  selector: 'app-account-settings-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  templateUrl: './account-settings-page.component.html',
  styleUrl: './account-settings-page.component.css'
})
export class AccountSettingsPageComponent implements OnInit {
  private authStateService = inject(AuthStateService);
  private authService = inject(AuthService);
  private notificationPreferenceService = inject(NotificationPreferenceService);

  private authState = toSignal(this.authStateService.authState$, {
    initialValue: initialAuthState
  });

  user = computed(() => this.authState()?.user ?? null);

  activeTab = signal<TabId>('personal');

  firstName = signal('');
  lastName = signal('');
  phone = signal('');
  street = signal('');
  streetNumber = signal('');
  floorApt = signal('');
  city = signal('');
  postalCode = signal('');
  birthDate = signal('');
  emailReadonly = computed(() => this.user()?.email ?? '');

  saving = signal(false);
  saveError = signal<string | null>(null);
  saveSuccess = signal(false);
  /** Errores por campo devueltos por el backend (ej. { phone: 'El teléfono no tiene un formato válido' }) */
  fieldErrors = signal<Record<string, string>>({});

  // Preferencias de notificación (tab Notificaciones)
  notifLoading = signal(false);
  notifSaving = signal(false);
  notifError = signal<string | null>(null);
  notifSuccess = signal(false);
  emailEnabled = signal(true);
  appointmentCreated = signal(true);
  appointmentConfirmed = signal(true);
  appointmentCancelled = signal(true);
  appointmentRescheduled = signal(true);
  reminderEnabled = signal(true);
  reminderHoursBefore = signal(12);

  constructor() {
    effect(() => {
      const u = this.user();
      if (u) {
        this.firstName.set(u.firstName ?? '');
        this.lastName.set(u.lastName ?? '');
        this.phone.set(u.phone ?? '');
        this.street.set(u.street ?? '');
        this.streetNumber.set(u.streetNumber ?? '');
        this.floorApt.set(u.floorApt ?? '');
        this.city.set(u.city ?? '');
        this.postalCode.set(u.postalCode ?? '');
        this.birthDate.set(u.birthDate ?? '');
      }
    });
  }

  ngOnInit(): void {
    // Cargar perfil fresco por si el estado de auth no tenía los campos opcionales
    if (this.authState().isAuthenticated) {
      this.authService.getProfile().subscribe({
        next: (profile) => {
          this.authStateService.setUser(profile);
        },
        error: () => {}
      });
    }
  }

  setTab(tab: TabId): void {
    this.activeTab.set(tab);
    if (tab === 'notifications') {
      this.loadNotificationPreferences();
    }
  }

  loadNotificationPreferences(): void {
    this.notifError.set(null);
    this.notifLoading.set(true);
    this.notificationPreferenceService.getPreferences().subscribe({
      next: (pref) => {
        this.emailEnabled.set(pref.emailEnabled ?? true);
        this.appointmentCreated.set(pref.appointmentCreated ?? true);
        this.appointmentConfirmed.set(pref.appointmentConfirmed ?? true);
        this.appointmentCancelled.set(pref.appointmentCancelled ?? true);
        this.appointmentRescheduled.set(pref.appointmentRescheduled ?? true);
        this.reminderEnabled.set(pref.reminderEnabled ?? true);
        this.reminderHoursBefore.set(pref.reminderHoursBefore ?? 12);
        this.notifLoading.set(false);
      },
      error: () => {
        this.notifError.set('No se pudieron cargar las preferencias.');
        this.notifLoading.set(false);
      }
    });
  }

  saveNotificationPreferences(): void {
    this.notifError.set(null);
    this.notifSuccess.set(false);
    this.notifSaving.set(true);
    const body = {
      emailEnabled: this.emailEnabled(),
      appointmentCreated: this.appointmentCreated(),
      appointmentConfirmed: this.appointmentConfirmed(),
      appointmentCancelled: this.appointmentCancelled(),
      appointmentRescheduled: this.appointmentRescheduled(),
      reminderEnabled: this.reminderEnabled(),
      reminderHoursBefore: Math.min(168, Math.max(1, this.reminderHoursBefore()))
    };
    this.notificationPreferenceService.updatePreferences(body).subscribe({
      next: () => {
        this.notifSaving.set(false);
        this.notifSuccess.set(true);
      },
      error: (err) => {
        this.notifSaving.set(false);
        this.notifError.set(err.error?.message || 'Error al guardar preferencias.');
      }
    });
  }

  isActive(tab: TabId): boolean {
    return this.activeTab() === tab;
  }

  /** Error del campo teléfono (validación backend). */
  phoneError = computed(() => this.fieldErrors()['phone'] ?? null);

  savePersonal(): void {
    this.saveError.set(null);
    this.saveSuccess.set(false);
    this.fieldErrors.set({});
    this.saving.set(true);

    const body = {
      firstName: this.firstName() || undefined,
      lastName: this.lastName() || undefined,
      phone: this.phone() || undefined,
      street: this.street() || undefined,
      streetNumber: this.streetNumber() || undefined,
      floorApt: this.floorApt() || undefined,
      city: this.city() || undefined,
      postalCode: this.postalCode() || undefined,
      birthDate: this.birthDate() || undefined
    };

    this.authService.updateProfile(body).subscribe({
      next: (updated) => {
        this.authStateService.setUser(updated);
        this.saving.set(false);
        this.saveSuccess.set(true);
      },
      error: (err) => {
        this.saving.set(false);
        const res = err.error;
        const errors = res?.errors as Record<string, string> | undefined;
        if (errors && typeof errors === 'object') {
          this.fieldErrors.set(errors);
        }
        this.saveError.set(res?.message || 'Error al guardar. Intenta de nuevo.');
      }
    });
  }
}
