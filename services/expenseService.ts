import {
  createExpense as createLocalExpense,
  deleteExpenseLocal,
  getAllExpensesForUser,
  getExpenseByIdForUser,
  updateExpenseLocal,
} from '@/utils/sqlite';
import { supabase } from '@/utils/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

  const id = uuidv4();
  const now = new Date().toISOString();

  await createLocalExpense({
    id,
    user_id: userId,
    amount: payload.amount,
    category: payload.category ?? null,
    note: payload.note ?? null,
    created_at: now,
    updated_at: now,
  } as any);

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
  await updateExpenseLocal(id, {
    ...changes,
    updated_at: new Date().toISOString(),
  } as any);
}

export async function deleteExpense(id: string) {
  // delete locally
  await deleteExpenseLocal(id);
}
// create CRUD