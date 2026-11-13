import { CurrencyPipe, DatePipe, registerLocaleData } from '@angular/common';
import localeEsCo from '@angular/common/locales/es-CO';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService, Category, Transaction } from '../../core/api.service';
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
  private readonly router = inject(Router);
  private readonly changeDetector = inject(ChangeDetectorRef);
  protected categories: Category[] = [];
  protected transactions: Transaction[] = [];
  protected from = '';
  protected to = '';
  protected categoryFilter = '';
  protected error = '';

  constructor() {
    this.api.getCategories().subscribe({
      next: (categories) => this.categories = categories,
      error: () => this.error = 'No se pudieron cargar las categorías. Verifica que el backend esté iniciado.',
    });
    this.loadTransactions();
  }

  protected get incomeTotal() {
    return this.transactions.filter((item) => item.kind === 'income').reduce((sum, item) => sum + item.amount, 0);
  }

  protected get expenseTotal() {
    return this.transactions.filter((item) => item.kind === 'expense').reduce((sum, item) => sum + item.amount, 0);
  }

  protected loadTransactions() {
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

  protected editTransaction(transaction: Transaction) {
    this.router.navigate(['/agregar'], { queryParams: { editar: transaction.id } });
  }

  protected deleteTransaction(transaction: Transaction) {
    if (!window.confirm(`¿Eliminar el movimiento de ${formatCop(transaction.amount)}?`)) return;
    this.api.deleteTransaction(transaction.id).subscribe({
      next: () => this.loadTransactions(),
      error: () => this.error = 'No se pudo eliminar el movimiento.',
    });
  }
}
