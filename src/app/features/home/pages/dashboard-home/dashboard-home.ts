import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebSocketTestComponent } from './components/websocket-test/websocket-test';

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule, WebSocketTestComponent],
  templateUrl: './dashboard-home.html',
  styleUrl: './dashboard-home.css'
})
export class DashboardHomeComponent {
  // Placeholder para el sistema de turnos (futuro)
}
