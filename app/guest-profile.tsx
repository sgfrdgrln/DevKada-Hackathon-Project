import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function GuestProfileScreen() {
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const theme = useColorScheme() ?? 'light';
  const activeColors = Colors[theme];
  const router = useRouter();

  const handleContinue = async () => {
    if (loading) return;
    setError(null);

    if (!displayName.trim()) {
      setError('Please enter your display name.');
      return;
    }

    setLoading(true);
    try {
      await AsyncStorage.setItem('userName', displayName.trim());
      await AsyncStorage.setItem('authMode', 'offline');
      router.replace('/(tabs)');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={[styles.safeArea, { backgroundColor: activeColors.background }]}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme === 'light' ? '#FFFFFF' : '#151A1F',
                borderColor: theme === 'light' ? '#E9EDF2' : '#26313B',
              },
            ]}
          >
            <Text style={[styles.title, { color: activeColors.text }]}>Continue as Guest</Text>
            <Text style={[styles.subtitle, { color: activeColors.icon }]}>Set a display name for offline mode. You can change this later in Profile.</Text>

            <Text style={[styles.label, { color: activeColors.icon }]}>Display name</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme === 'light' ? '#F4F7FA' : '#23272B',
                  color: activeColors.text,
                  borderColor: activeColors.icon,
                },
              ]}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Enter your name"
              placeholderTextColor={theme === 'light' ? '#8B97A4' : '#787D85'}
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
              onPress={handleContinue}
              disabled={loading}
            >
              <Text style={styles.primaryButtonText}>{loading ? 'Saving...' : 'Continue'}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 14,
  },
  primaryButton: {
    backgroundColor: '#723FEB',
    borderRadius: 16,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    color: '#F28B82',
    fontSize: 12,
    marginBottom: 10,
  },
});
