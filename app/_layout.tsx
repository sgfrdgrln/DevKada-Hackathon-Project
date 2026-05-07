import { Stack, useRouter, useSegments } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { AppThemeProvider } from '@/theme/ThemeContext';
import { supabase } from '@/utils/supabase';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      setHasSession(!!data.session);
      setReady(true);
    };

    void init();

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(!!session);
    });

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const checkAndNavigate = async () => {
      const inAuth = segments[0] === 'auth';
      const inOnboarding = segments[0] === 'onboarding';
      const name = await AsyncStorage.getItem('userName');
      const isOnboarded = !!name;
      if (!hasSession && !inAuth) {
        router.replace('/auth');
      } else if (hasSession && !isOnboarded && !inOnboarding) {
        router.replace('/onboarding');
      } else if (hasSession && isOnboarded && (inAuth || inOnboarding)) {
        router.replace('/(tabs)');
      }
    };
    checkAndNavigate();
  }, [hasSession, ready, segments, router]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppThemeProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="auth" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="auto" />
      </AppThemeProvider>
    </GestureHandlerRootView>
  );
}