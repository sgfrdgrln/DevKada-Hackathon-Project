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
    );
    CREATE TABLE IF NOT EXISTS monthly_income (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      amount REAL,
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
    "SELECT * FROM expenses WHERE is_synced = 0 AND (user_id IS NULL OR user_id = 'local')"
  );
}

export async function getUnsyncedExpensesForUser(userId: string): Promise<Expense[]> {
  const db = await getDb();
  return db.getAllAsync<Expense>(
    'SELECT * FROM expenses WHERE is_synced = 0 AND user_id = ?',
    [userId]
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
    "SELECT * FROM expenses WHERE user_id IS NULL OR user_id = 'local' ORDER BY created_at DESC"
  );
  return rows;
}

export async function getAllExpensesForUser(userId: string): Promise<Expense[]> {
  const db = await getDb();
  return db.getAllAsync<Expense>(
    'SELECT * FROM expenses WHERE user_id = ? ORDER BY created_at DESC',
    [userId]
  );
}

export async function getExpenseById(id: string): Promise<Expense | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<Expense>(
    "SELECT * FROM expenses WHERE id = ? AND (user_id IS NULL OR user_id = 'local')",
    [id]
  );
  return row ?? null;
}

export async function getExpenseByIdForUser(id: string, userId: string): Promise<Expense | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<Expense>(
    'SELECT * FROM expenses WHERE id = ? AND user_id = ?',
    [id, userId]
  );
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

export async function reassignLocalUserId(oldUserId: string, newUserId: string) {
  // Reassign expenses created with a temporary local user id to the authenticated user
  await runSql(
    'UPDATE expenses SET user_id = ?, is_synced = 0 WHERE user_id = ?',
    [newUserId, oldUserId]
  );
}

export async function setMonthlyIncomeLocal(id: string, userId: string, amount: number | null) {
  const now = new Date().toISOString();
  const db = await getDb();

  if (amount === null) {
    await runSql('DELETE FROM monthly_income WHERE id = ?', [id]);
    return;
  }

  const existing = await db.getFirstAsync<{ id: string }>(
    'SELECT id FROM monthly_income WHERE id = ?',
    [id]
  );

  if (existing) {
    await runSql(
      'UPDATE monthly_income SET amount = ?, updated_at = ?, is_synced = 0 WHERE id = ?',
      [amount, now, id]
    );
  } else {
    await runSql(
      'INSERT INTO monthly_income (id, user_id, amount, created_at, updated_at, is_synced) VALUES (?, ?, ?, ?, ?, 0)',
      [id, userId, amount, now, now]
    );
  }
}

export async function getMonthlyIncomeForUser(userId: string): Promise<{ id: string; amount: number; is_synced: 0 | 1 } | null> {
  const db = await getDb();
  return db.getFirstAsync(
    'SELECT id, amount, is_synced FROM monthly_income WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1',
    [userId]
  );
}

export async function getUnsyncedMonthlyIncome(userId: string): Promise<{ id: string; user_id: string; amount: number; created_at: string; updated_at: string }[]> {
  const db = await getDb();
  return db.getAllAsync(
    'SELECT id, user_id, amount, created_at, updated_at FROM monthly_income WHERE user_id = ? AND is_synced = 0',
    [userId]
  );
}

export async function markMonthlyIncomeAsSynced(id: string) {
  await runSql('UPDATE monthly_income SET is_synced = 1 WHERE id = ?', [id]);
}

export async function upsertMonthlyIncome(remote: { id: string; user_id: string; amount: number; created_at: string; updated_at: string }) {
  const db = await getDb();
  const existing = await db.getFirstAsync<{ updated_at: string }>(
    'SELECT updated_at FROM monthly_income WHERE id = ?',
    [remote.id]
  );

  if (!existing) {
    await runSql(
      'INSERT INTO monthly_income (id, user_id, amount, created_at, updated_at, is_synced) VALUES (?, ?, ?, ?, ?, 1)',
      [remote.id, remote.user_id, remote.amount, remote.created_at, remote.updated_at]
    );
    return;
  }

  if (new Date(remote.updated_at) > new Date(existing.updated_at)) {
    await runSql(
      'UPDATE monthly_income SET user_id = ?, amount = ?, created_at = ?, updated_at = ?, is_synced = 1 WHERE id = ?',
      [remote.user_id, remote.amount, remote.created_at, remote.updated_at, remote.id]
    );
  }
}