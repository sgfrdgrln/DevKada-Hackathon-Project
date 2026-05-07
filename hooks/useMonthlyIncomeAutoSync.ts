import { pullMonthlyIncome, pushUnsyncedMonthlyIncome } from '@/services/monthlyIncomeService';
import { subscribeToMonthlyIncomeChange } from '@/utils/monthlyIncomeChangeEmitter';
import { supabase } from '@/utils/supabase';
import NetInfo from '@react-native-community/netinfo';
import { useEffect, useRef } from 'react';

let syncTimeout: NodeJS.Timeout | null = null;
const SYNC_DEBOUNCE_MS = 3000;

async function performMonthlyIncomeAutoSync(): Promise<void> {
  try {
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      console.log('Monthly income auto sync: offline, skipping');
      return;
    }

    const { data, error } = await supabase.auth.getUser();
    const userId = data.user?.id;
    if (error || !userId) {
      console.log('Monthly income auto sync: not authenticated, skipping');
      return;
    }

    await pushUnsyncedMonthlyIncome(userId);
    await pullMonthlyIncome(userId);
    console.log('Monthly income auto sync: completed successfully');
  } catch (err) {
    console.warn('Monthly income auto sync failed', err);
  }
}

export function useMonthlyIncomeAutoSync() {
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    unsubscribeRef.current = subscribeToMonthlyIncomeChange((event) => {
      console.log('Monthly income change detected:', event.type);

      if (syncTimeout) {
        clearTimeout(syncTimeout);
      }

      syncTimeout = setTimeout(() => {
        void performMonthlyIncomeAutoSync();
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
