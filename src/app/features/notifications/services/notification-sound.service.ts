import { Injectable } from '@angular/core';

const NOTIFICATION_SOUND_PATH = '/assets/sounds/notification.mp3';

/**
 * Reproduce el sonido de notificación.
 * Pensado para usarse al recibir una notificación nueva por WebSocket.
 * Los navegadores pueden bloquear audio sin interacción previa del usuario.
 */
@Injectable({
  providedIn: 'root'
})
export class NotificationSoundService {

  play(): void {
    try {
      const audio = new Audio(NOTIFICATION_SOUND_PATH);
      audio.volume = 0.6;
      void audio.play().catch(() => {
        // Autoplay puede estar bloqueado; se ignora silenciosamente
      });
    } catch {
      // Ignorar si no se puede crear/reproducir
    }
  }
}
