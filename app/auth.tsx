import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/utils/supabase';
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const theme = useColorScheme() ?? 'light';
  const activeColors = Colors[theme];
  const router = useRouter();

  const submitLabel = mode === 'login' ? 'Sign in' : 'Create account';

  const handleSubmit = async () => {
    if (loading) return;
    setError(null);

    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }

    if (mode === 'register' && password !== confirmPassword) {
      setError('Passwords do not match.');
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
        });
        if (signUpError) throw signUpError;
      }

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
          <Text style={[styles.title, { color: activeColors.text }]}>Welcome back</Text>
          <Text style={[styles.subtitle, { color: activeColors.icon }]}>Sign in to sync and access your expenses.</Text>

          <View style={styles.segmentedControl}>
            {(['login', 'register'] as const).map((value) => {
              const isActive = value === mode;
              return (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.segment,
                    { borderColor: activeColors.icon },
                    isActive && { backgroundColor: activeColors.tint, borderColor: activeColors.tint },
                  ]}
                  onPress={() => setMode(value)}
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
            placeholder="••••••••"
            placeholderTextColor={theme === 'light' ? '#8B97A4' : '#787D85'}
            secureTextEntry
          />

          {mode === 'register' ? (
            <>
              <Text style={[styles.label, { color: activeColors.icon }]}>Confirm password</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme === 'light' ? '#F4F7FA' : '#23272B',
                    color: activeColors.text,
                    borderColor: activeColors.icon,
                  },
                ]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="••••••••"
                placeholderTextColor={theme === 'light' ? '#8B97A4' : '#787D85'}
                secureTextEntry
              />
            </>
          ) : null}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>{submitLabel}</Text>}
          </TouchableOpacity>
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
    padding: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    marginBottom: 18,
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
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
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
