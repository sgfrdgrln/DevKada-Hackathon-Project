import {
    createExpense as createLocalExpense,
    Expense,
    getUnsyncedExpenses,
    initDatabase,
    markAsSynced,
    upsertExpenses,
} from '@/utils/sqlite';
import { supabase } from '@/utils/supabase';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

export async function signInAnonymously(): Promise<string | null> {
  try {
    const { data, error } = await supabase.auth.signInAnonymously?.();
    if (error) throw error;
    // v2 return shape may vary; try data?.user or data?.session
    const user = (data as any)?.user ?? (data as any)?.session?.user;
    return user?.id ?? null;
  } catch (err) {
    console.warn('Anonymous sign-in failed', err);
    return null;
  }
}

export async function pushUnsyncedExpenses(userId: string) {
  try {
    const unsynced = await getUnsyncedExpenses();
    if (!unsynced.length) return;

    // ensure each has user_id
    const rows = unsynced.map((r) => ({
      id: r.id,
      user_id: r.user_id ?? userId,
      amount: r.amount,
      category: r.category,
      note: r.note,
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));

    const { error } = await supabase.from('expenses').upsert(rows, { onConflict: 'id' }).select();
    if (error) throw error;

    // mark local as synced
    await Promise.all(rows.map((r) => markAsSynced(r.id)));
  } catch (err) {
    console.warn('pushUnsyncedExpenses failed', err);
  }
}

export async function pullExpenses(userId: string) {
  try {
    const { data, error } = await supabase.from<Expense>('expenses').select('*').eq('user_id', userId);
    if (error) {
      // If the expenses table isn't present on the Supabase project, avoid noisy stack traces.
      if ((error as any)?.code === 'PGRST205') {
        console.warn('Supabase: `expenses` table not found. Create the table before syncing.');
        return;
      }
      throw error;
    }
    if (!data || !data.length) return;

    // upsert into SQLite
    await upsertExpenses(data as Expense[]);
  } catch (err) {
    console.warn('pullExpenses failed', err);
  }
}

export async function syncExpenses(userId?: string) {
  try {
    await initDatabase();

    let uid = userId;
    if (!uid) {
      const u = await signInAnonymously();
      uid = u ?? undefined;
    }
    if (!uid) return;

    await pushUnsyncedExpenses(uid);
    await pullExpenses(uid);
  } catch (err) {
    console.warn('syncExpenses failed', err);
  }
}

export async function createLocalAndMaybePush(payload: {
  amount: number;
  category?: string;
  note?: string;
  user_id: string;
}) {
  const id = uuidv4();
  const now = new Date().toISOString();

  await createLocalExpense({
    id,
    user_id: payload.user_id,
    amount: payload.amount,
    category: payload.category ?? null,
    note: payload.note ?? null,
    created_at: now,
    updated_at: now,
    is_synced: 0,
  } as any);

  // fire-and-forget push
  setTimeout(() => void pushUnsyncedExpenses(payload.user_id), 0);

  return id;
}
