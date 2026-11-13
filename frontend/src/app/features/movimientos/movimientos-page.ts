import { CurrencyPipe, DatePipe, registerLocaleData } from '@angular/common';
import localeEsCo from '@angular/common/locales/es-CO';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService, Category, Transaction, TransactionInput, TransactionKind } from '../../core/api.service';
import { formatCop } from '../../shared/utils/currency';

registerLocaleData(localeEsCo);

@Component({
  standalone: true,
  imports: [FormsModule, CurrencyPipe, DatePipe],
  selector: 'app-movimientos-page',
  templateUrl: './movimientos-page.html',
})
export class MovimientosPage {
  private readonly api = inject(ApiService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  protected categories: Category[] = [];
  protected transactions: Transaction[] = [];
  protected kind: TransactionKind = 'expense';
  protected form: TransactionInput = this.emptyForm();
  protected editingId: string | null = null;
  protected from = '';
  protected to = '';
  protected categoryFilter = '';
  protected error = '';
  protected successMessage = '';
  protected saving = false;

  constructor() {
    this.form.date = this.today();
    this.loadCategories();
    this.loadTransactions();
  }

  protected get visibleCategories() {
    return this.categories.filter((category) => category.kind === this.kind);
  }

  protected get incomeTotal() {
    return this.transactions.filter((item) => item.kind === 'income').reduce((sum, item) => sum + item.amount, 0);
  }

  protected get expenseTotal() {
    return this.transactions.filter((item) => item.kind === 'expense').reduce((sum, item) => sum + item.amount, 0);
  }

  protected setKind(kind: TransactionKind) {
    this.kind = kind;
    this.form.kind = kind;
    this.form.categoryId = this.visibleCategories[0]?.id ?? '';
  }

  protected loadCategories() {
    this.api.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.form.categoryId = this.visibleCategories[0]?.id ?? '';
      },
      error: () => this.error = 'No se pudieron cargar las categorías. Verifica que el backend esté iniciado.',
    });
  }

  protected loadTransactions() {
    if (this.successMessage) return;
    this.api.getTransactions({
      from: this.from || undefined,
      to: this.to || undefined,
      categoryId: this.categoryFilter || undefined,
    }).subscribe({
      next: (transactions) => {
        this.transactions = transactions;
        this.error = '';
        this.changeDetector.markForCheck();
      },
      error: () => {
        this.error = 'No se pudieron cargar los movimientos. Verifica que el backend esté iniciado.';
        this.changeDetector.markForCheck();
      },
    });
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
        this.cancelEdit();
        this.successMessage = wasEditing
          ? 'Movimiento actualizado. Confirma para refrescar el historial.'
          : 'Movimiento guardado. Confirma para refrescar el historial.';
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
    this.successMessage = '';
    this.loadTransactions();
  }
  protected editTransaction(transaction: Transaction) {
    this.editingId = transaction.id;
    this.kind = transaction.kind;
    this.form = {
      kind: transaction.kind,
      amount: transaction.amount,
      date: transaction.date,
      categoryId: transaction.categoryId,
      description: transaction.description ?? '',
      paymentMethod: transaction.paymentMethod ?? '',
    };
  }

  protected deleteTransaction(transaction: Transaction) {
    if (!window.confirm(`¿Eliminar el movimiento de ${this.formatMoney(transaction.amount)}?`)) return;
    this.api.deleteTransaction(transaction.id).subscribe({
      next: () => this.loadTransactions(),
      error: () => this.error = 'No se pudo eliminar el movimiento.',
    });
  }

  protected cancelEdit() {
    this.editingId = null;
    this.kind = 'expense';
    this.form = this.emptyForm();
    this.form.date = this.today();
    this.form.categoryId = this.visibleCategories[0]?.id ?? '';
  }

  protected formatMoney(amount: number) {
    return formatCop(amount);
  }

  private emptyForm(): TransactionInput {
    return { kind: this.kind, amount: 0, date: '', categoryId: '', description: '', paymentMethod: '' };
  }

  private today() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }
}
