import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ApiHealth {
  status: string;
  message: string;
}

export type TransactionKind = 'income' | 'expense';
export type PaymentMethod = string;

export interface Category {
  id: string;
  name: string;
  kind: TransactionKind;
  isArchived?: boolean | number;
}

export interface CategoryInput {
  name: string;
  kind: TransactionKind;
}

export interface PaymentMethodOption {
  id: PaymentMethod;
  name: string;
  isArchived?: boolean | number;
}

export interface Transaction {
  id: string;
  kind: TransactionKind;
  amount: number;
  date: string;
  categoryId: string;
  categoryName: string;
  description: string | null;
  paymentMethod: PaymentMethod | null;
}

export interface TransactionInput {
  kind: TransactionKind;
  amount: number;
  date: string;
  categoryId: string;
  description: string;
  paymentMethod: PaymentMethod | '';
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:3000/api';

  getCategories(includeArchived = false) {
    return this.http.get<Category[]>(`${this.baseUrl}/categories`, {
      params: includeArchived ? { includeArchived: 'true' } : {},
    });
  }

  createCategory(category: CategoryInput) {
    return this.http.post<Category>(`${this.baseUrl}/categories`, category);
  }

  updateCategory(id: string, category: Pick<CategoryInput, 'name'>) {
    return this.http.put<Category>(`${this.baseUrl}/categories/${id}`, category);
  }

  archiveCategory(id: string) {
    return this.http.delete<void>(`${this.baseUrl}/categories/${id}`);
  }

  restoreCategory(id: string) {
    return this.http.patch<void>(`${this.baseUrl}/categories/${id}/restore`, {});
  }

  getPaymentMethods(includeArchived = false) {
    return this.http.get<PaymentMethodOption[]>(`${this.baseUrl}/payment-methods`, {
      params: includeArchived ? { includeArchived: 'true' } : {},
    });
  }

  createPaymentMethod(name: string) {
    return this.http.post<PaymentMethodOption>(`${this.baseUrl}/payment-methods`, { name });
  }

  updatePaymentMethod(id: string, name: string) {
    return this.http.put<PaymentMethodOption>(`${this.baseUrl}/payment-methods/${id}`, { name });
  }

  archivePaymentMethod(id: string) {
    return this.http.delete<void>(`${this.baseUrl}/payment-methods/${id}`);
  }

  restorePaymentMethod(id: string) {
    return this.http.patch<void>(`${this.baseUrl}/payment-methods/${id}/restore`, {});
  }

  getTransactions(filters: { from?: string; to?: string; categoryId?: string; kind?: string } = {}) {
    const params: Record<string, string> = {};
    for (const [key, value] of Object.entries(filters)) {
      if (value) params[key] = value;
    }
    return this.http.get<Transaction[]>(`${this.baseUrl}/transactions`, { params });
  }

  createTransaction(transaction: TransactionInput) {
    return this.http.post<{ id: string }>(`${this.baseUrl}/transactions`, transaction);
  }

  updateTransaction(id: string, transaction: TransactionInput) {
    return this.http.put<{ id: string }>(`${this.baseUrl}/transactions/${id}`, transaction);
  }

  deleteTransaction(id: string) {
    return this.http.delete<void>(`${this.baseUrl}/transactions/${id}`);
  }

  getHealth(): Observable<ApiHealth> {
    return this.http.get<ApiHealth>(`${this.baseUrl}/health`);
  }
}
