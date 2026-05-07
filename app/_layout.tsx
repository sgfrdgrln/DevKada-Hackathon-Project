import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import ToastHost from '@/components/toast';
import { useAutoSync } from '@/hooks/useAutoSync';
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

  // Enable auto-sync for authenticated users
  useAutoSync();

  useEffect(() => {
    const init = async () => {
      const [authMode, sessionResult] = await Promise.all([
        AsyncStorage.getItem('authMode'),
        supabase.auth.getSession(),
      ]);
      if (!authMode && sessionResult.data.session) {
        await AsyncStorage.setItem('authMode', 'supabase');
      }
      setHasSession(!!sessionResult.data.session);
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
      const inGuestProfile = segments[0] === 'guest-profile';
      const [authMode, name, onboardingDone] = await Promise.all([
        AsyncStorage.getItem('authMode'),
        AsyncStorage.getItem('userName'),
        AsyncStorage.getItem('onboardingComplete'),
      ]);
      const isOnboarded = !!name;
      const hasCompletedOnboarding = onboardingDone === '1';

      if (!hasCompletedOnboarding) {
        if (!inOnboarding) router.replace('/onboarding');
        return;
      }

      if (authMode === 'offline') {
        if (!isOnboarded && !inGuestProfile) {
          router.replace('/guest-profile');
          return;
        }
        if (isOnboarded && (inAuth || inOnboarding || inGuestProfile)) {
          router.replace('/(tabs)');
        }
        return;
      }

      if (!authMode) {
        if (!inAuth) router.replace('/auth');
        return;
      }

      if (!hasSession && !inAuth) {
        router.replace('/auth');
      } else if (hasSession && (inAuth || inOnboarding || inGuestProfile)) {
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
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="guest-profile" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <ToastHost />
        <StatusBar style="auto" />
      </AppThemeProvider>
    </GestureHandlerRootView>
  );
}