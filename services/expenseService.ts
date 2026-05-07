import { emitExpenseChange } from '@/utils/expenseChangeEmitter';
import {
    createExpense as createLocalExpense,
    deleteExpenseLocal,
    getAllExpensesForUser,
    getExpenseByIdForUser,
    markAsSynced,
    updateExpenseLocal,
} from '@/utils/sqlite';
import { supabase } from '@/utils/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

type CreatePayload = {
  amount: number;
  category?: string | null;
  note?: string | null;
};

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

export async function createExpense(payload: CreatePayload) {
  const userId = (await getCurrentUserId()) ?? (await getLocalUserId());
  const isAuthenticated = await getCurrentUserId();

  const id = uuidv4();
  const now = new Date().toISOString();

  const expense = {
    id,
    user_id: userId,
    amount: payload.amount,
    category: payload.category ?? null,
    note: payload.note ?? null,
    created_at: now,
    updated_at: now,
  };

  // Save locally
  await createLocalExpense(expense as any);

  // Try to sync to Supabase if authenticated and online
  if (isAuthenticated) {
    try {
      const netState = await NetInfo.fetch();
      if (netState.isConnected) {
        const { error } = await supabase.from('expenses').insert([expense]);
        if (!error) {
          await markAsSynced(id);
        }
      }
    } catch (err) {
      console.warn('Direct Supabase upload failed, will retry on sync', err);
    }
  }

  // Emit event for auto-sync
  emitExpenseChange({ type: 'create', id });

  return id;
}

export async function listExpenses() {
  const userId = await getCurrentUserId();
  return userId ? await getAllExpensesForUser(userId) : await getAllExpensesForUser(await getLocalUserId());
}

export async function getExpense(id: string) {
  const userId = await getCurrentUserId();
  return userId ? await getExpenseByIdForUser(id, userId) : await getExpenseByIdForUser(id, await getLocalUserId());
}

export async function updateExpense(id: string, changes: Partial<CreatePayload>) {
  const isAuthenticated = await getCurrentUserId();
  const now = new Date().toISOString();

  const updated = {
    ...changes,
    updated_at: now,
  };

  // Update locally
  await updateExpenseLocal(id, updated as any);

  // Try to sync to Supabase if authenticated and online
  if (isAuthenticated) {
    try {
      const netState = await NetInfo.fetch();
      if (netState.isConnected) {
        const { error } = await supabase
          .from('expenses')
          .update(updated)
          .eq('id', id);
        if (!error) {
          await markAsSynced(id);
        }
      }
    } catch (err) {
      console.warn('Direct Supabase update failed, will retry on sync', err);
    }
  }

  // Emit event for auto-sync
  emitExpenseChange({ type: 'update', id });
}

export async function deleteExpense(id: string) {
  const isAuthenticated = await getCurrentUserId();

  // Delete locally
  await deleteExpenseLocal(id);

  // Try to sync to Supabase if authenticated and online
  if (isAuthenticated) {
    try {
      const netState = await NetInfo.fetch();
      if (netState.isConnected) {
        await supabase.from('expenses').delete().eq('id', id);
      }
    } catch (err) {
      console.warn('Direct Supabase delete failed, will retry on sync', err);
    }
  }

  // Emit event for auto-sync
  emitExpenseChange({ type: 'delete', id });
}