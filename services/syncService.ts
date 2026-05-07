import { Expense, getUnsyncedExpensesForUser, markAsSynced, upsertExpenses } from '@/utils/sqlite';
import { supabase } from '@/utils/supabase';
import NetInfo from '@react-native-community/netinfo';
import 'react-native-get-random-values';

async function getAuthenticatedUserId(): Promise<string | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.warn('getUser failed', error);
  }
  return data.user?.id ?? null;
}

export async function pushUnsyncedExpenses(userId: string) {
  const unsynced = await getUnsyncedExpensesForUser(userId);
  if (!unsynced.length) return;

  // ensure each has user_id
  const rows = unsynced.map((r) => ({
    id: r.id,
    user_id: userId,
    amount: r.amount,
    category: r.category,
    note: r.note,
    created_at: r.created_at,
    updated_at: r.updated_at,
  }));

  const { error } = await supabase.from('expenses').upsert(rows, { onConflict: 'id' });
  if (error) throw error;

  // mark local as synced
  await Promise.all(rows.map((r) => markAsSynced(r.id)));
}

export async function pullExpenses(userId: string) {
  const { data, error } = await supabase.from('expenses').select('*').eq('user_id', userId);
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
}

export async function syncExpenses() {
  try {
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      return { status: 'offline' as const };
    }

    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return { status: 'unauthenticated' as const };
    }

    await pushUnsyncedExpenses(userId);
    await pullExpenses(userId);

    return { status: 'success' as const };
  } catch (err) {
    console.warn('syncExpenses failed', err);
    return { status: 'error' as const };
  }
}

export async function pushUnsyncedMonthlyIncome(userId: string) {
  try {
    const { getUnsyncedMonthlyIncome, markMonthlyIncomeAsSynced } = await import('@/utils/sqlite');
    const unsynced = await getUnsyncedMonthlyIncome(userId);
    if (!unsynced.length) return;

    for (const record of unsynced) {
      const { error } = await supabase.from('monthly_income').upsert({
        id: record.id,
        user_id: userId,
        amount: record.amount,
        created_at: record.created_at,
        updated_at: record.updated_at,
      });
      if (!error) {
        await markMonthlyIncomeAsSynced(record.id);
      }
    }
  } catch (err) {
    console.warn('pushUnsyncedMonthlyIncome failed', err);
  }
}

export async function pullMonthlyIncome(userId: string) {
  try {
    const { upsertMonthlyIncome } = await import('@/utils/sqlite');
    const { data, error } = await supabase
      .from('monthly_income')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.warn('pullMonthlyIncome error', error);
      return;
    }

    if (data) {
      await upsertMonthlyIncome(data);
    }
  } catch (err) {
    console.warn('pullMonthlyIncome failed', err);
  }
}
