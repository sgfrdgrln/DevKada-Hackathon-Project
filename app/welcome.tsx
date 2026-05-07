import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function WelcomeScreen() {
  const router = useRouter();
  const theme = useColorScheme() ?? 'light';
  const activeColors = Colors[theme];

  const handleOffline = async () => {
    await AsyncStorage.setItem('authMode', 'offline');
    router.replace('/onboarding');
  };

  const handleSignIn = async () => {
    await AsyncStorage.setItem('authMode', 'supabase');
    router.replace('/auth');
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={[styles.safeArea, { backgroundColor: activeColors.background }]}> 
        <View style={styles.background}>
          <View style={[styles.glowOne, { backgroundColor: activeColors.tint }]} />
          <View style={[styles.glowTwo, { backgroundColor: theme === 'light' ? '#FFCFB3' : '#3B2A5A' }]} />
        </View>

        <View style={styles.content}>
          <Text style={[styles.kicker, { color: activeColors.tint }]}>Tracksy</Text>
          <Text style={[styles.title, { color: activeColors.text }]}>Track money your way</Text>
          <Text style={[styles.subtitle, { color: activeColors.icon }]}>Use the app fully offline or sign in to sync across devices.</Text>

          <View style={styles.card}>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: activeColors.tint }]}
              onPress={handleSignIn}
            >
              <Text style={styles.primaryText}>Sign in to sync</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: activeColors.tint }]}
              onPress={handleOffline}
            >
              <Text style={[styles.secondaryText, { color: activeColors.tint }]}>Stay offline</Text>
            </TouchableOpacity>

            <Text style={[styles.note, { color: activeColors.icon }]}>You can enable sync later from Profile.</Text>
          </View>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  glowOne: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 140,
    top: -90,
    right: -60,
    opacity: 0.18,
  },
  glowTwo: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 120,
    bottom: -80,
    left: -60,
    opacity: 0.2,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  kicker: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 12,
    fontWeight: '700',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 32,
  },
  card: {
    borderRadius: 24,
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    gap: 12,
  },
  primaryButton: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryButton: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  secondaryText: {
    fontSize: 15,
    fontWeight: '600',
  },
  note: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
});
