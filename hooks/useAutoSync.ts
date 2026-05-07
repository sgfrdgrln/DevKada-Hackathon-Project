import { pushUnsyncedExpenses } from '@/services/syncService';
import { subscribeToExpenseChange } from '@/utils/expenseChangeEmitter';
import { supabase } from '@/utils/supabase';
import NetInfo from '@react-native-community/netinfo';
import { useEffect, useRef } from 'react';

let syncTimeout: NodeJS.Timeout | null = null;
const SYNC_DEBOUNCE_MS = 3000; // Wait 3 seconds after last change before syncing

async function performAutoSync(): Promise<void> {
  try {
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      console.log('Auto sync: offline, skipping');
      return;
    }

    const { data, error } = await supabase.auth.getUser();
    const userId = data.user?.id;
    if (error || !userId) {
      console.log('Auto sync: not authenticated, skipping');
      return;
    }

    await pushUnsyncedExpenses(userId);
    console.log('Auto sync: completed successfully');
  } catch (err) {
    console.warn('Auto sync failed', err);
  }
}

export function useAutoSync() {
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    unsubscribeRef.current = subscribeToExpenseChange((event) => {
      console.log('Expense change detected:', event.type);

      // Clear existing timeout
      if (syncTimeout) {
        clearTimeout(syncTimeout);
      }

      // Debounce: wait before syncing
      syncTimeout = setTimeout(() => {
        void performAutoSync();
      }, SYNC_DEBOUNCE_MS);
    });

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      if (syncTimeout) {
        clearTimeout(syncTimeout);
      }
    };
  }, []);
}
