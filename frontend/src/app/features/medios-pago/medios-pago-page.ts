import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService, PaymentMethodOption } from '../../core/api.service';

@Component({ standalone: true, imports: [FormsModule], templateUrl: './medios-pago-page.html', styleUrl: './medios-pago-page.scss' })
export class MediosPagoPage {
  private readonly api = inject(ApiService);
  protected methods: PaymentMethodOption[] = [];
  protected name = '';
  protected editingId: string | null = null;
  protected error = '';
  protected saving = false;

  constructor() { this.loadMethods(); }

  protected get activeMethods() { return this.methods.filter((method) => !method.isArchived); }
  protected get archivedMethods() { return this.methods.filter((method) => !!method.isArchived); }

  protected loadMethods() {
    this.api.getPaymentMethods(true).subscribe({
      next: (methods) => this.methods = methods,
      error: () => this.error = 'No se pudieron cargar los medios de pago. Verifica que el backend esté iniciado.',
    });
  }

  protected edit(method: PaymentMethodOption) {
    this.editingId = method.id;
    this.name = method.name;
    this.error = '';
  }

  protected cancelEdit() {
    this.editingId = null;
    this.name = '';
    this.error = '';
  }

  protected save() {
    const name = this.name.trim();
    if (!name || name.length > 60) {
      this.error = 'Escribe un nombre de hasta 60 caracteres.';
      return;
    }
    this.saving = true;
    const request = this.editingId
      ? this.api.updatePaymentMethod(this.editingId, name)
      : this.api.createPaymentMethod(name);
    request.subscribe({
      next: () => { this.saving = false; this.cancelEdit(); this.loadMethods(); },
      error: (error) => { this.saving = false; this.error = error.error?.error ?? 'No se pudo guardar el medio de pago.'; },
    });
  }

  protected archive(method: PaymentMethodOption) {
    if (!window.confirm(`¿Archivar «${method.name}»? Los movimientos existentes se conservarán.`)) return;
    this.api.archivePaymentMethod(method.id).subscribe({
      next: () => this.loadMethods(),
      error: (error) => this.error = error.error?.error ?? 'No se pudo archivar el medio de pago.',
    });
  }

  protected restore(method: PaymentMethodOption) {
    this.api.restorePaymentMethod(method.id).subscribe({
      next: () => this.loadMethods(),
      error: (error) => this.error = error.error?.error ?? 'No se pudo restaurar el medio de pago.',
    });
  }
}
