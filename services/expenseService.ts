import {
  createExpense as createLocalExpense,
  deleteExpenseLocal,
  getAllExpenses,
  getExpenseById,
  updateExpenseLocal,
} from '@/utils/sqlite';
import { supabase } from '@/utils/supabase';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

type CreatePayload = {
  amount: number;
  category?: string | null;
  note?: string | null;
};

export async function createExpense(payload: CreatePayload) {
  const session = await supabase.auth.getSession();
  const userId = session.data.session?.user?.id;
  if (!userId) throw new Error('User not signed in');

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
  return await getAllExpenses();
}

export async function getExpense(id: string) {
  return await getExpenseById(id);
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