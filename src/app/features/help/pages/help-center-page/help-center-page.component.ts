import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

type HelpTab = 'guide' | 'faq' | 'contact';

interface FaqItem {
  question: string;
  answer: string;
}

@Component({
  selector: 'app-help-center-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './help-center-page.component.html',
  styleUrl: './help-center-page.component.css'
})
export class HelpCenterPageComponent {
  activeTab = signal<HelpTab>('guide');

  readonly faqItems: FaqItem[] = [
    {
      question: '¿Cuánto tiempo tengo para confirmar un turno pendiente?',
      answer: 'Por lo general tienes 10 minutos desde que reservas. El tiempo exacto se muestra en cada turno pendiente con el texto "Confirma antes de [hora]". Si no confirmas antes de esa hora, el turno expira y queda liberado para otros.'
    },
    {
      question: '¿Qué pasa si no confirmo mi turno a tiempo?',
      answer: 'El turno pasará a estado Expirado y quedará liberado. Deberás reservar un nuevo turno desde el Calendario.'
    },
    {
      question: '¿Puedo reprogramar un turno ya confirmado?',
      answer: 'Sí. En Mis Turnos, haz clic en el ícono de reprogramar (reloj con flecha) en un turno Confirmado o Pendiente. Se abrirá una ventana para elegir la nueva fecha y horario, y deberás indicar un motivo. Un administrador revisará tu solicitud y te notificará si fue aprobada o rechazada.'
    },
    {
      question: '¿Qué estados puede tener mi turno?',
      answer: 'Pendiente (recién reservado, sin confirmar), Confirmado (ya confirmaste tu asistencia), Reprogramado (turno anterior que fue movido; el nuevo aparece como Confirmado), Cancelado (lo cancelaste tú o el administrador), Expirado (no confirmaste a tiempo).'
    },
    {
      question: '¿Dónde veo la disponibilidad de horarios?',
      answer: 'En el Calendario. Los días en verde o amarillo indican que hay horarios disponibles. Al hacer clic en un día, se abre una ventana con la lista de horarios libres para elegir.'
    },
    {
      question: '¿Necesito completar mi perfil para reservar?',
      answer: 'Recomendamos completar tu perfil en Configuración (nombre, teléfono, dirección) para una mejor experiencia. Algunas validaciones pueden solicitar datos completos antes de confirmar una reserva.'
    },
    {
      question: '¿Cómo cancelo un turno?',
      answer: 'En Mis Turnos, haz clic en el ícono rojo de cancelar en un turno Confirmado o Pendiente. Se abrirá una ventana donde puedes indicar opcionalmente un motivo y confirmar la cancelación. Una vez cancelado, el turno no puede revertirse.'
    }
  ];

  setTab(tab: HelpTab): void {
    this.activeTab.set(tab);
  }

  isActive(tab: HelpTab): boolean {
    return this.activeTab() === tab;
  }

  /** Acordeón FAQ: índice abierto (-1 = ninguno) */
  openFaqIndex = signal<number>(-1);

  toggleFaq(index: number): void {
    this.openFaqIndex.update(i => i === index ? -1 : index);
  }

  isFaqOpen(index: number): boolean {
    return this.openFaqIndex() === index;
  }
}
