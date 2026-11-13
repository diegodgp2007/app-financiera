import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService, Category, CategoryInput, TransactionKind } from '../../core/api.service';

@Component({ standalone: true, imports: [FormsModule], templateUrl: './categorias-page.html', styleUrl: './categorias-page.scss' })
export class CategoriasPage {
  private readonly api = inject(ApiService);
  protected categories: Category[] = [];
  protected form: CategoryInput = { name: '', kind: 'expense' };
  protected editingId: string | null = null;
  protected error = '';
  protected saving = false;

  constructor() { this.loadCategories(); }

  protected get activeCategories() { return this.categories.filter((category) => !category.isArchived); }
  protected get archivedCategories() { return this.categories.filter((category) => !!category.isArchived); }

  protected byKind(kind: TransactionKind, archived = false) {
    return this.categories.filter((category) => category.kind === kind && !!category.isArchived === archived);
  }

  protected loadCategories() {
    this.api.getCategories(true).subscribe({
      next: (categories) => this.categories = categories,
      error: () => this.error = 'No se pudieron cargar las categorías. Verifica que el backend esté iniciado.',
    });
  }

  protected edit(category: Category) {
    this.editingId = category.id;
    this.form = { name: category.name, kind: category.kind };
    this.error = '';
  }

  protected cancelEdit() {
    this.editingId = null;
    this.form = { name: '', kind: 'expense' };
    this.error = '';
  }

  protected save() {
    const name = this.form.name.trim();
    if (!name || name.length > 60) {
      this.error = 'Escribe un nombre de hasta 60 caracteres.';
      return;
    }
    this.saving = true;
    const request = this.editingId
      ? this.api.updateCategory(this.editingId, { name })
      : this.api.createCategory({ name, kind: this.form.kind });
    request.subscribe({
      next: () => { this.saving = false; this.cancelEdit(); this.loadCategories(); },
      error: (error) => { this.saving = false; this.error = error.error?.error ?? 'No se pudo guardar la categoría.'; },
    });
  }

  protected archive(category: Category) {
    if (!window.confirm(`¿Archivar la categoría «${category.name}»? Los movimientos existentes se conservarán.`)) return;
    this.api.archiveCategory(category.id).subscribe({
      next: () => this.loadCategories(),
      error: (error) => this.error = error.error?.error ?? 'No se pudo archivar la categoría.',
    });
  }

  protected restore(category: Category) {
    this.api.restoreCategory(category.id).subscribe({
      next: () => this.loadCategories(),
      error: (error) => this.error = error.error?.error ?? 'No se pudo restaurar la categoría.',
    });
  }
}
