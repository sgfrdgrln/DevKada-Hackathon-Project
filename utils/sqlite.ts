import * as SQLite from 'expo-sqlite';

export type Expense = {
  id: string;
  user_id: string;
  amount: number;
  category?: string | null;
  note?: string | null;
  created_at: string; // ISO
  updated_at: string; // ISO
  is_synced: 0 | 1;
};

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;
let initPromise: Promise<void> | null = null;

async function initDatabase(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(
    `CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      amount REAL,
      category TEXT,
      note TEXT,
      created_at TEXT,
      updated_at TEXT,
      is_synced INTEGER DEFAULT 0
    );`
  );
}

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  try {
    if (!dbPromise) {
      dbPromise = SQLite.openDatabaseAsync('expenses.db');
    }
    const db = await dbPromise;
    if (!initPromise) {
      initPromise = initDatabase(db);
    }
    await initPromise;
    return db;
  } catch (error) {
    dbPromise = null;
    initPromise = null;
    throw error;
  }
}

function runSql<T = any>(sql: string, params: any[] = []): Promise<T> {
  return getDb().then((db) => db.runAsync(sql, params) as Promise<T>);
}

export async function createExpense(expense: Omit<Expense, 'is_synced'>) {
  const now = new Date().toISOString();
  const params = [
    expense.id,
    expense.user_id,
    expense.amount,
    expense.category ?? null,
    expense.note ?? null,
    expense.created_at ?? now,
    expense.updated_at ?? now,
    0,
  ];

  await runSql(
    'INSERT OR REPLACE INTO expenses (id, user_id, amount, category, note, created_at, updated_at, is_synced) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    params
  );
}

export async function getUnsyncedExpenses(): Promise<Expense[]> {
  const db = await getDb();
  return db.getAllAsync<Expense>(
    'SELECT * FROM expenses WHERE is_synced = 0'
  );
}

export async function markAsSynced(id: string) {
  await runSql('UPDATE expenses SET is_synced = 1 WHERE id = ?', [id]);
}

export async function upsertExpenses(remote: Partial<Expense>[]) {
  // For each remote expense, insert or update depending on updated_at
  const db = await getDb();
  for (const r of remote) {
    if (!r.id) continue;
    const existing = await db.getFirstAsync<{ updated_at: string }>(
      'SELECT updated_at FROM expenses WHERE id = ?',
      [r.id]
    );

    const remoteUpdated = r.updated_at ?? new Date().toISOString();

    if (!existing) {
      await runSql(
        'INSERT INTO expenses (id, user_id, amount, category, note, created_at, updated_at, is_synced) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          r.id,
          r.user_id ?? null,
          r.amount ?? 0,
          r.category ?? null,
          r.note ?? null,
          r.created_at ?? remoteUpdated,
          remoteUpdated,
          1,
        ]
      );
      continue;
    }

    // compare updated_at
    if (new Date(remoteUpdated) > new Date(existing.updated_at)) {
      await runSql(
        'UPDATE expenses SET user_id = ?, amount = ?, category = ?, note = ?, created_at = ?, updated_at = ?, is_synced = ? WHERE id = ?',
        [
          r.user_id ?? null,
          r.amount ?? 0,
          r.category ?? null,
          r.note ?? null,
          r.created_at ?? remoteUpdated,
          remoteUpdated,
          1,
          r.id,
        ]
      );
    }
  }
}

export async function getAllExpenses(): Promise<Expense[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Expense>(
    'SELECT * FROM expenses ORDER BY created_at DESC'
  );
  return rows;
}

export async function getExpenseById(id: string): Promise<Expense | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<Expense>('SELECT * FROM expenses WHERE id = ?', [id]);
  return row ?? null;
}

export async function updateExpenseLocal(id: string, changes: Partial<Expense>) {
  const now = new Date().toISOString();
  const existing = await getExpenseById(id);
  if (!existing) throw new Error('Expense not found');

  const updated = {
    ...existing,
    ...changes,
    updated_at: changes.updated_at ?? now,
    is_synced: 0,
  } as Expense;

  await runSql(
    'UPDATE expenses SET user_id = ?, amount = ?, category = ?, note = ?, created_at = ?, updated_at = ?, is_synced = ? WHERE id = ?',
    [
      updated.user_id ?? null,
      updated.amount ?? 0,
      updated.category ?? null,
      updated.note ?? null,
      updated.created_at,
      updated.updated_at,
      updated.is_synced,
      id,
    ]
  );
}

export async function deleteExpenseLocal(id: string) {
  await runSql('DELETE FROM expenses WHERE id = ?', [id]);
}

export async function clearExpenses() {
  await runSql('DELETE FROM expenses');
}