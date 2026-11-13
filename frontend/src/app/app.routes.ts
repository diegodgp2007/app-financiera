import { Routes } from '@angular/router';
import { MovimientosPage } from './features/movimientos/movimientos-page';
import { PresupuestosPage } from './features/presupuestos/presupuestos-page';
import { InformesPage } from './features/informes/informes-page';
import { AgregarPage } from './features/agregar/agregar-page';
import { CategoriasPage } from './features/categorias/categorias-page';
import { MediosPagoPage } from './features/medios-pago/medios-pago-page';

export const routes: Routes = [
  { path: '', component: MovimientosPage, title: 'Movimientos' },
  { path: 'agregar', component: AgregarPage, title: 'Agregar movimiento' },
  { path: 'categorias', component: CategoriasPage, title: 'Categorías' },
  { path: 'medios-pago', component: MediosPagoPage, title: 'Medios de pago' },
  { path: 'presupuestos', component: PresupuestosPage, title: 'Presupuestos' },
  { path: 'informes', component: InformesPage, title: 'Informes' },
  { path: '**', redirectTo: '' },
];
