import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { syncExpenses } from '@/services/syncService';
import { supabase } from '@/utils/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const theme = useColorScheme() ?? 'light';
  const activeColors = Colors[theme];
  const router = useRouter();

  const submitLabel = mode === 'login' ? 'Sign in' : 'Create account';
  const titleText = mode === 'login' ? 'Welcome back' : 'Create your account';
  const selectedSegmentColor = '#723FEB';
  const subtitleText = mode === 'login'
    ? 'Sign in to sync and access your expenses.'
    : 'Sign up to back up your data and sync across devices.';

  const handleContinueAsGuest = async () => {
    if (loading) return;
    await AsyncStorage.setItem('authMode', 'offline');
    const name = await AsyncStorage.getItem('userName');
    if (name?.trim()) {
      await AsyncStorage.setItem('onboardingComplete', '1');
      router.replace('/(tabs)');
      return;
    }
    router.replace('/guest-profile');
  };

  const handleSubmit = async () => {
    if (loading) return;
    setError(null);

    if (mode === 'register' && !username.trim()) {
      setError('Please enter a username.');
      return;
    }

    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) throw signInError;
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              display_name: username.trim(),
            },
          },
        });
        if (signUpError) throw signUpError;
      }

      await AsyncStorage.setItem('authMode', 'supabase');
      await syncExpenses();
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err?.message ?? 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: activeColors.background }]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme === 'light' ? '#FFFFFF' : '#151A1F',
                borderColor: theme === 'light' ? '#E9EDF2' : '#26313B',
              },
            ]}
          >
            <Text style={[styles.title, { color: activeColors.text }]}>{titleText}</Text>
            <Text style={[styles.subtitle, { color: activeColors.icon }]}>{subtitleText}</Text>

            <View style={styles.segmentedControl}>
              {(['login', 'register'] as const).map((value) => {
                const isActive = value === mode;
                return (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.segment,
                      { borderColor: activeColors.icon },
                      isActive && { backgroundColor: selectedSegmentColor, borderColor: selectedSegmentColor },
                    ]}
                    disabled={loading}
                    onPress={() => {
                      setError(null);
                      setMode(value);
                    }}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        { color: activeColors.text },
                        isActive && { color: '#FFFFFF' },
                      ]}
                    >
                      {value === 'login' ? 'Login' : 'Register'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {mode === 'register' ? (
              <>
                <Text style={[styles.label, { color: activeColors.icon }]}>Username</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme === 'light' ? '#F4F7FA' : '#23272B',
                      color: activeColors.text,
                      borderColor: activeColors.icon,
                    },
                  ]}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="How should we call you?"
                  placeholderTextColor={theme === 'light' ? '#8B97A4' : '#787D85'}
                />
              </>
            ) : null}

            <Text style={[styles.label, { color: activeColors.icon }]}>Email</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme === 'light' ? '#F4F7FA' : '#23272B',
                  color: activeColors.text,
                  borderColor: activeColors.icon,
                },
              ]}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={theme === 'light' ? '#8B97A4' : '#787D85'}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Text style={[styles.label, { color: activeColors.icon }]}>Password</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme === 'light' ? '#F4F7FA' : '#23272B',
                  color: activeColors.text,
                  borderColor: activeColors.icon,
                },
              ]}
              value={password}
              onChangeText={setPassword}
              placeholder="At least 6 characters"
              placeholderTextColor={theme === 'light' ? '#8B97A4' : '#787D85'}
              secureTextEntry
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>{submitLabel}</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={handleContinueAsGuest} disabled={loading} style={styles.guestLinkWrap}>
              <Text style={[styles.guestLinkText, { color: activeColors.tint }]}>Continue as Guest</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 460,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    marginBottom: 20,
    textAlign: 'center',
  },
  segmentedControl: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  segment: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 8,
    alignItems: 'center',
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '600',
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
  guestLinkWrap: {
    marginTop: 14,
    alignItems: 'center',
  },
  guestLinkText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
