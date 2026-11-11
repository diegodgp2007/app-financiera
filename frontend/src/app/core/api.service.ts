import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ApiHealth {
  status: string;
  message: string;
}

export type TransactionKind = 'income' | 'expense';
export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'other';

export interface Category {
  id: string;
  name: string;
  kind: TransactionKind;
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

  getCategories() {
    return this.http.get<Category[]>(`${this.baseUrl}/categories`);
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
