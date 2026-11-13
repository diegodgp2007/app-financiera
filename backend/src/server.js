import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { randomUUID } from 'node:crypto';
import { closeDatabase, database } from './database.js';

const app = express();
const port = Number(process.env.PORT ?? 3000);
const accountId = 'personal-default';

app.use(cors({ origin: 'http://localhost:4200' }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'API financiera funcionando' });
});

function normalizedName(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function isUniqueConstraint(error) {
  return error?.code === 'ERR_SQLITE_CONSTRAINT_UNIQUE' || /UNIQUE constraint failed/.test(error?.message ?? '');
}

function nameError(name) {
  return !name || name.length > 60 ? 'El nombre debe tener entre 1 y 60 caracteres.' : null;
}

app.get('/api/categories', (req, res) => {
  const includeArchived = req.query.includeArchived === 'true';
  const categories = database.prepare(`
    SELECT id, name, kind, is_archived AS isArchived FROM categories
    WHERE account_id = ? ${includeArchived ? '' : 'AND is_archived = 0'}
    ORDER BY kind, name
  `).all(accountId);
  res.json(categories);
});

app.post('/api/categories', (req, res) => {
  const name = normalizedName(req.body?.name);
  const { kind } = req.body ?? {};
  if (nameError(name)) return res.status(400).json({ error: nameError(name) });
  if (!['income', 'expense'].includes(kind)) return res.status(400).json({ error: 'Selecciona ingreso o gasto para la categoría.' });
  const id = randomUUID();
  try {
    database.prepare('INSERT INTO categories (id, account_id, name, kind) VALUES (?, ?, ?, ?)')
      .run(id, accountId, name, kind);
    return res.status(201).json({ id, name, kind, isArchived: 0 });
  } catch (error) {
    if (isUniqueConstraint(error)) return res.status(409).json({ error: 'Ya existe una categoría con ese nombre y tipo.' });
    throw error;
  }
});

app.put('/api/categories/:id', (req, res) => {
  const name = normalizedName(req.body?.name);
  if (nameError(name)) return res.status(400).json({ error: nameError(name) });
  try {
    const result = database.prepare(`
      UPDATE categories SET name = ? WHERE id = ? AND account_id = ? AND is_archived = 0
    `).run(name, req.params.id, accountId);
    if (!result.changes) return res.status(404).json({ error: 'No se encontró la categoría.' });
    return res.json({ id: req.params.id, name });
  } catch (error) {
    if (isUniqueConstraint(error)) return res.status(409).json({ error: 'Ya existe una categoría con ese nombre y tipo.' });
    throw error;
  }
});

app.delete('/api/categories/:id', (req, res) => {
  const result = database.prepare(`
    UPDATE categories SET is_archived = 1 WHERE id = ? AND account_id = ? AND is_archived = 0
  `).run(req.params.id, accountId);
  if (!result.changes) return res.status(404).json({ error: 'No se encontró la categoría.' });
  return res.status(204).end();
});

app.patch('/api/categories/:id/restore', (req, res) => {
  try {
    const result = database.prepare(`
      UPDATE categories SET is_archived = 0 WHERE id = ? AND account_id = ? AND is_archived = 1
    `).run(req.params.id, accountId);
    if (!result.changes) return res.status(404).json({ error: 'No se encontró la categoría archivada.' });
    return res.status(204).end();
  } catch (error) {
    if (isUniqueConstraint(error)) return res.status(409).json({ error: 'Ya existe una categoría activa con ese nombre y tipo.' });
    throw error;
  }
});

app.get('/api/payment-methods', (req, res) => {
  const includeArchived = req.query.includeArchived === 'true';
  const methods = database.prepare(`
    SELECT id, name, is_archived AS isArchived FROM payment_methods
    WHERE account_id = ? ${includeArchived ? '' : 'AND is_archived = 0'}
    ORDER BY name
  `).all(accountId);
  res.json(methods);
});

app.post('/api/payment-methods', (req, res) => {
  const name = normalizedName(req.body?.name);
  if (nameError(name)) return res.status(400).json({ error: nameError(name) });
  const id = randomUUID();
  try {
    database.prepare('INSERT INTO payment_methods (id, account_id, name) VALUES (?, ?, ?)')
      .run(id, accountId, name);
    return res.status(201).json({ id, name, isArchived: 0 });
  } catch (error) {
    if (isUniqueConstraint(error)) return res.status(409).json({ error: 'Ya existe un medio de pago con ese nombre.' });
    throw error;
  }
});

app.put('/api/payment-methods/:id', (req, res) => {
  const name = normalizedName(req.body?.name);
  if (nameError(name)) return res.status(400).json({ error: nameError(name) });
  try {
    const result = database.prepare(`
      UPDATE payment_methods SET name = ? WHERE id = ? AND account_id = ? AND is_archived = 0
    `).run(name, req.params.id, accountId);
    if (!result.changes) return res.status(404).json({ error: 'No se encontró el medio de pago.' });
    return res.json({ id: req.params.id, name });
  } catch (error) {
    if (isUniqueConstraint(error)) return res.status(409).json({ error: 'Ya existe un medio de pago con ese nombre.' });
    throw error;
  }
});

app.delete('/api/payment-methods/:id', (req, res) => {
  const result = database.prepare(`
    UPDATE payment_methods SET is_archived = 1 WHERE id = ? AND account_id = ? AND is_archived = 0
  `).run(req.params.id, accountId);
  if (!result.changes) return res.status(404).json({ error: 'No se encontró el medio de pago.' });
  return res.status(204).end();
});

app.patch('/api/payment-methods/:id/restore', (req, res) => {
  try {
    const result = database.prepare(`
      UPDATE payment_methods SET is_archived = 0 WHERE id = ? AND account_id = ? AND is_archived = 1
    `).run(req.params.id, accountId);
    if (!result.changes) return res.status(404).json({ error: 'No se encontró el medio de pago archivado.' });
    return res.status(204).end();
  } catch (error) {
    if (isUniqueConstraint(error)) return res.status(409).json({ error: 'Ya existe un medio de pago activo con ese nombre.' });
    throw error;
  }
});

app.get('/api/transactions', (req, res) => {
  const { from, to, categoryId, kind } = req.query;
  const filters = ['t.account_id = ?'];
  const params = [accountId];
  if (from) { filters.push('t.occurred_on >= ?'); params.push(from); }
  if (to) { filters.push('t.occurred_on <= ?'); params.push(to); }
  if (categoryId) { filters.push('t.category_id = ?'); params.push(categoryId); }
  if (kind === 'income' || kind === 'expense') { filters.push('t.kind = ?'); params.push(kind); }

  const transactions = database.prepare(`
    SELECT t.id, t.kind, t.amount_cop AS amount, t.occurred_on AS date,
      t.category_id AS categoryId, c.name AS categoryName,
      t.description, t.payment_method AS paymentMethod
    FROM transactions t JOIN categories c ON c.id = t.category_id
    WHERE ${filters.join(' AND ')}
    ORDER BY t.occurred_on DESC, t.created_at DESC
  `).all(...params);
  res.json(transactions);
});

function validateTransaction(body, { allowedArchivedPaymentMethod = null } = {}) {
  const { kind, amount, date, categoryId, description, paymentMethod } = body ?? {};
  if (!['income', 'expense'].includes(kind)) return 'Selecciona ingreso o gasto.';
  if (!Number.isSafeInteger(amount) || amount <= 0) return 'El valor debe ser un entero positivo en COP.';
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) return 'La fecha no es válida.';
  if (typeof categoryId !== 'string') return 'Selecciona una categoría.';
  if (description != null && typeof description !== 'string') return 'La descripción no es válida.';
  if (paymentMethod != null && paymentMethod !== '') {
    const method = database.prepare(
      'SELECT id FROM payment_methods WHERE id = ? AND account_id = ? AND is_archived = 0'
    ).get(paymentMethod, accountId);
    if (!method && paymentMethod !== allowedArchivedPaymentMethod) return 'El medio de pago no es válido.';
  }
  const category = database.prepare(
    'SELECT id FROM categories WHERE id = ? AND account_id = ? AND kind = ? AND is_archived = 0'
  ).get(categoryId, accountId, kind);
  if (!category) return 'La categoría no corresponde al tipo de movimiento.';
  return null;
}

app.post('/api/transactions', (req, res) => {
  const validationError = validateTransaction(req.body);
  if (validationError) return res.status(400).json({ error: validationError });
  const id = randomUUID();
  const { kind, amount, date, categoryId, description, paymentMethod } = req.body;
  database.prepare(`
    INSERT INTO transactions (id, account_id, category_id, kind, amount_cop, occurred_on, description, payment_method)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, accountId, categoryId, kind, amount, date, description?.trim() || null, paymentMethod || null);
  return res.status(201).json({ id });
});

app.put('/api/transactions/:id', (req, res) => {
  const current = database.prepare(
    'SELECT payment_method AS paymentMethod FROM transactions WHERE id = ? AND account_id = ?'
  ).get(req.params.id, accountId);
  const validationError = validateTransaction(req.body, {
    allowedArchivedPaymentMethod: current?.paymentMethod ?? null,
  });
  if (validationError) return res.status(400).json({ error: validationError });
  const { kind, amount, date, categoryId, description, paymentMethod } = req.body;
  const result = database.prepare(`
    UPDATE transactions SET category_id = ?, kind = ?, amount_cop = ?, occurred_on = ?,
      description = ?, payment_method = ?, updated_at = datetime('now')
    WHERE id = ? AND account_id = ?
  `).run(categoryId, kind, amount, date, description?.trim() || null, paymentMethod || null, req.params.id, accountId);
  if (!result.changes) return res.status(404).json({ error: 'No se encontró el movimiento.' });
  return res.json({ id: req.params.id });
});

app.delete('/api/transactions/:id', (req, res) => {
  const result = database.prepare(
    'DELETE FROM transactions WHERE id = ? AND account_id = ?'
  ).run(req.params.id, accountId);
  if (!result.changes) return res.status(404).json({ error: 'No se encontró el movimiento.' });
  return res.status(204).end();
});

app.listen(port, () => {
  console.log(`API disponible en http://localhost:${port}`);
  console.log('Base SQLite lista.');
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    closeDatabase();
    process.exit(0);
  });
}
