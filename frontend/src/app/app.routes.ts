import { Routes } from '@angular/router';
import { MovimientosPage } from './features/movimientos/movimientos-page';

export const routes: Routes = [
  { path: '', component: MovimientosPage, title: 'Movimientos' },
  { path: '**', redirectTo: '' },
];
