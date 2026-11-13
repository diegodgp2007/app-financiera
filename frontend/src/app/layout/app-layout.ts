import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="app-frame">
      <header class="app-header">
        <a class="app-brand" routerLink="/" aria-label="Cuenta Clara, inicio">
          <span class="app-brand-mark">$</span>
          <span>cuenta<span class="app-brand-light">clara</span></span>
        </a>
        <span class="app-header-note"><span class="app-status-dot"></span> Tus finanzas, en orden</span>
      </header>
      <nav class="app-nav" aria-label="Navegación principal">
        <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }"><span aria-hidden="true">↔</span> Movimientos</a>
        <a routerLink="/agregar" routerLinkActive="active"><span aria-hidden="true">＋</span> Agregar</a>
        <a routerLink="/categorias" routerLinkActive="active"><span aria-hidden="true">◇</span> Categorías</a>
        <a routerLink="/medios-pago" routerLinkActive="active"><span aria-hidden="true">▣</span> Medios de pago</a>
        <a routerLink="/presupuestos" routerLinkActive="active"><span aria-hidden="true">▤</span> Presupuestos</a>
        <a routerLink="/informes" routerLinkActive="active"><span aria-hidden="true">▥</span> Informes</a>
      </nav>
      <router-outlet />
    </div>
  `,
})
export class AppLayout {}
