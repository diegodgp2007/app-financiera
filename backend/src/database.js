import 'dotenv/config';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const databasePath = resolve(process.env.DATABASE_PATH ?? './data/finanzas.sqlite');
mkdirSync(dirname(databasePath), { recursive: true });

export const database = new DatabaseSync(databasePath);

database.exec(`
  PRAGMA foreign_keys = ON;
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'COP',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    name TEXT NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('income', 'expense')),
    color TEXT,
    is_archived INTEGER NOT NULL DEFAULT 0 CHECK (is_archived IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    UNIQUE (account_id, name, kind)
  );

  CREATE TABLE IF NOT EXISTS payment_methods (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    name TEXT NOT NULL,
    is_archived INTEGER NOT NULL DEFAULT 0 CHECK (is_archived IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    UNIQUE (account_id, name)
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    category_id TEXT NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('income', 'expense')),
    amount_cop INTEGER NOT NULL CHECK (amount_cop > 0),
    occurred_on TEXT NOT NULL,
    description TEXT,
    payment_method TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
  );

  CREATE INDEX IF NOT EXISTS transactions_account_date
    ON transactions(account_id, occurred_on DESC);
  CREATE INDEX IF NOT EXISTS transactions_account_category_date
    ON transactions(account_id, category_id, occurred_on DESC);

  CREATE TABLE IF NOT EXISTS budgets (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    category_id TEXT NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    amount_cop INTEGER NOT NULL CHECK (amount_cop > 0),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    UNIQUE (account_id, category_id, year, month)
  );
`);

function migrateTransactionPaymentMethods() {
  const schema = database.prepare(
    "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'transactions'"
  ).get()?.sql ?? '';
  if (!/CHECK\s*\(\s*payment_method\s+IN/i.test(schema)) return;

  database.exec('PRAGMA foreign_keys = OFF; BEGIN IMMEDIATE;');
  try {
    database.exec(`
      CREATE TABLE transactions_migrated (
        id TEXT PRIMARY KEY,
        account_id TEXT NOT NULL,
        category_id TEXT NOT NULL,
        kind TEXT NOT NULL CHECK (kind IN ('income', 'expense')),
        amount_cop INTEGER NOT NULL CHECK (amount_cop > 0),
        occurred_on TEXT NOT NULL,
        description TEXT,
        payment_method TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
      );
      INSERT INTO transactions_migrated
        (id, account_id, category_id, kind, amount_cop, occurred_on, description, payment_method, created_at, updated_at)
      SELECT id, account_id, category_id, kind, amount_cop, occurred_on, description, payment_method, created_at, updated_at
      FROM transactions;
      DROP TABLE transactions;
      ALTER TABLE transactions_migrated RENAME TO transactions;
      CREATE INDEX transactions_account_date ON transactions(account_id, occurred_on DESC);
      CREATE INDEX transactions_account_category_date ON transactions(account_id, category_id, occurred_on DESC);
    `);
    database.exec('COMMIT;');
  } catch (error) {
    database.exec('ROLLBACK;');
    throw error;
  } finally {
    database.exec('PRAGMA foreign_keys = ON;');
  }
}

migrateTransactionPaymentMethods();

const seedAccount = database.prepare(
  'INSERT OR IGNORE INTO accounts (id, name) VALUES (?, ?)'
);
seedAccount.run('personal-default', 'Personal');

const seedPaymentMethod = database.prepare(
  'INSERT OR IGNORE INTO payment_methods (id, account_id, name) VALUES (?, ?, ?)'
);
for (const [id, name] of [
  ['cash', 'Efectivo'],
  ['card', 'Tarjeta'],
  ['transfer', 'Transferencia'],
  ['other', 'Otro'],
]) {
  seedPaymentMethod.run(id, 'personal-default', name);
}

const seedCategory = database.prepare(
  'INSERT OR IGNORE INTO categories (id, account_id, name, kind) VALUES (?, ?, ?, ?)'
);
for (const [id, name, kind] of [
  ['expense-food', 'Alimentación', 'expense'],
  ['expense-transport', 'Transporte', 'expense'],
  ['expense-housing', 'Vivienda', 'expense'],
  ['expense-health', 'Salud', 'expense'],
  ['expense-services', 'Servicios', 'expense'],
  ['expense-other', 'Otros', 'expense'],
  ['income-salary', 'Salario', 'income'],
  ['income-business', 'Negocio', 'income'],
  ['income-investments', 'Inversiones', 'income'],
  ['income-other', 'Otros', 'income'],
]) {
  seedCategory.run(id, 'personal-default', name, kind);
}

export function closeDatabase() {
  database.close();
}
