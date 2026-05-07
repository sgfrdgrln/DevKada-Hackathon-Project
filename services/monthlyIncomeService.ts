import { emitMonthlyIncomeChange } from '@/utils/monthlyIncomeChangeEmitter';
import {
    getMonthlyIncomeForUser,
    getUnsyncedMonthlyIncome,
    markMonthlyIncomeAsSynced,
    setMonthlyIncomeLocal,
} from '@/utils/sqlite';
import { supabase } from '@/utils/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

const LOCAL_USER_ID_KEY = 'localUserId';

async function getLocalUserId() {
  const stored = await AsyncStorage.getItem(LOCAL_USER_ID_KEY);
  if (stored) return stored;

  const newId = uuidv4();
  await AsyncStorage.setItem(LOCAL_USER_ID_KEY, newId);
  return newId;
}

async function getCurrentUserId(): Promise<string | null> {
  const session = await supabase.auth.getSession();
  return session.data.session?.user?.id ?? null;
}

async function getEffectiveUserId(): Promise<string> {
  return (await getCurrentUserId()) ?? (await getLocalUserId());
}

export async function getMonthlyIncome(): Promise<number | null> {
  try {
    const userId = await getEffectiveUserId();

    const record = await getMonthlyIncomeForUser(userId);
    return record?.amount ?? null;
  } catch (err) {
    console.warn('getMonthlyIncome failed', err);
    return null;
  }
}

export async function setMonthlyIncome(amount: number | null): Promise<void> {
  try {
    const authUserId = await getCurrentUserId();
    const userId = authUserId ?? (await getLocalUserId());

    const id = `income_${userId}`;

    // Save to SQLite locally
    await setMonthlyIncomeLocal(id, userId, amount);

    // Try to sync to Supabase if authenticated and online
    if (authUserId) {
      try {
        const netState = await NetInfo.fetch();
        if (netState.isConnected) {
          if (amount === null) {
            await supabase.from('monthly_income').delete().eq('id', id);
          } else {
            const now = new Date().toISOString();
            await supabase.from('monthly_income').upsert({
              id,
              user_id: userId,
              amount,
              created_at: now,
              updated_at: now,
            });
            await markMonthlyIncomeAsSynced(id);
          }
        }
      } catch (err) {
        console.warn('Direct Supabase upload failed for monthly income, will retry on sync', err);
      }
    }

    // Emit event for auto-sync
    emitMonthlyIncomeChange({ type: 'update', income: amount });
  } catch (err) {
    console.warn('setMonthlyIncome failed', err);
    throw err;
  }
}

export async function pushUnsyncedMonthlyIncome(userId: string) {
  try {
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
    const { data, error } = await supabase
      .from('monthly_income')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is fine
      console.warn('pullMonthlyIncome error', error);
      return;
    }

    if (data) {
      const { upsertMonthlyIncome } = await import('@/utils/sqlite');
      await upsertMonthlyIncome(data);
    }
  } catch (err) {
    console.warn('pullMonthlyIncome failed', err);
  }
}
