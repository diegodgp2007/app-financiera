import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService, Category, PaymentMethodOption, TransactionInput, TransactionKind } from '../../core/api.service';
import { formatCop } from '../../shared/utils/currency';

@Component({
  standalone: true,
  imports: [FormsModule],
  templateUrl: './agregar-page.html',
  styleUrl: './agregar-page.scss',
})
export class AgregarPage {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly changeDetector = inject(ChangeDetectorRef);
  protected categories: Category[] = [];
  protected paymentMethods: PaymentMethodOption[] = [];
  protected kind: TransactionKind = 'expense';
  protected form: TransactionInput = this.emptyForm();
  protected editingId: string | null = null;
  protected error = '';
  protected successMessage = '';
  protected saving = false;

  constructor() {
    this.form.date = this.today();
    this.api.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.form.categoryId = this.visibleCategories[0]?.id ?? '';
      },
      error: () => this.error = 'No se pudieron cargar las categorías. Verifica que el backend esté iniciado.',
    });
    this.api.getPaymentMethods(true).subscribe({
      next: (methods) => this.paymentMethods = methods,
      error: () => this.error = 'No se pudieron cargar los medios de pago.',
    });
    this.route.queryParamMap.subscribe((params) => {
      const id = params.get('editar');
      this.editingId = id;
      if (id) this.loadTransaction(id);
      else this.resetForm();
    });
  }

  protected get visibleCategories() {
    return this.categories.filter((category) => category.kind === this.kind);
  }

  protected setKind(kind: TransactionKind) {
    this.kind = kind;
    this.form.kind = kind;
    this.form.categoryId = this.visibleCategories[0]?.id ?? '';
  }

  protected saveTransaction() {
    if (!this.form.categoryId || !this.form.amount || this.form.amount <= 0) return;
    this.successMessage = '';
    this.saving = true;
    const wasEditing = this.editingId !== null;
    const request = this.editingId
      ? this.api.updateTransaction(this.editingId, this.form)
      : this.api.createTransaction(this.form);
    request.subscribe({
      next: () => {
        this.saving = false;
        this.successMessage = wasEditing
          ? 'Movimiento actualizado. Confirma para volver al historial.'
          : 'Movimiento guardado. Confirma para volver al historial.';
        this.changeDetector.markForCheck();
      },
      error: (error) => {
        this.saving = false;
        this.error = error.error?.error ?? 'No se pudo guardar el movimiento.';
        this.changeDetector.markForCheck();
      },
    });
  }

  protected confirmSaved() {
    this.router.navigate(['/movimientos']);
  }

  protected cancelEdit() {
    this.router.navigate(['/movimientos']);
  }

  protected formatMoney(amount: number) {
    return formatCop(amount);
  }

  private loadTransaction(id: string) {
    this.api.getTransactions().subscribe({
      next: (transactions) => {
        const transaction = transactions.find((item) => item.id === id);
        if (!transaction) {
          this.error = 'No se encontró el movimiento que quieres editar.';
          return;
        }
        this.kind = transaction.kind;
        this.form = {
          kind: transaction.kind,
          amount: transaction.amount,
          date: transaction.date,
          categoryId: transaction.categoryId,
          description: transaction.description ?? '',
          paymentMethod: transaction.paymentMethod ?? '',
        };
        this.changeDetector.markForCheck();
      },
      error: () => this.error = 'No se pudo cargar el movimiento para editar.',
    });
  }

  private resetForm() {
    this.kind = 'expense';
    this.form = this.emptyForm();
    this.form.date = this.today();
    this.form.categoryId = this.visibleCategories[0]?.id ?? '';
    this.error = '';
  }

  private emptyForm(): TransactionInput {
    return { kind: this.kind, amount: 0, date: '', categoryId: '', description: '', paymentMethod: '' };
  }

  private today() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }
}
