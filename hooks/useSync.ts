import { signInAnonymously, syncExpenses } from '@/services/syncService';
import { getAllExpenses, initDatabase } from '@/utils/sqlite';
import { supabase } from '@/utils/supabase';
import NetInfo from '@react-native-community/netinfo';
import { useCallback, useEffect, useRef } from 'react';

export function useSync({ intervalMs = 1000 * 60 * 2 } = {}) {
  const mounted = useRef(true);
  const onlineRef = useRef<boolean>(false);

  const start = useCallback(async () => {
    await initDatabase();

    // ensure we have an anonymous session
    const user = (await supabase.auth.getSession()).data?.session?.user;
    if (!user) {
      await signInAnonymously();
    }

    // initial network state
    const state = await NetInfo.fetch();
    onlineRef.current = !!state.isConnected;

    // initial sync if online
    if (onlineRef.current) void syncExpenses();
  }, []);

  useEffect(() => {
    mounted.current = true;
    void start();

    const unsubscribe = NetInfo.addEventListener((state) => {
      const nowOnline = !!state.isConnected;
      if (!onlineRef.current && nowOnline) {
        // just became online
        void syncExpenses();
      }
      onlineRef.current = nowOnline;
    });

    const id = setInterval(() => {
      if (onlineRef.current) void syncExpenses();
    }, intervalMs);

    return () => {
      mounted.current = false;
      unsubscribe();
      clearInterval(id);
    };
  }, [start, intervalMs]);

  const getLocal = useCallback(async () => {
    return await getAllExpenses();
  }, []);

  return { getLocal };
}
