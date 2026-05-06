import { syncExpenses } from '@/services/syncService';
import { useAppTheme } from '@/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../constants/theme';

const settingsIcon = require('../../assets/famicons-settings.png');

export default function ProfileScreen() {
  const [name, setName] = useState('User');
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const { theme, setTheme } = useAppTheme();
  const activeColors = Colors[theme];
  const nextTheme = theme === 'light' ? 'dark' : 'light';

  const handleSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);

    try {
      const result = await syncExpenses();
      if (result.status === 'offline') {
        Alert.alert('No internet connection', 'Connect to the internet and try again.');
        return;
      }
      if (result.status === 'unauthenticated') {
        Alert.alert('Sign in required', 'Please sign in before syncing.');
        return;
      }
      if (result.status === 'success') {
        const now = new Date();
        setLastSyncedAt(now);
        Alert.alert('Sync successful', 'Backup complete.');
        return;
      }
      Alert.alert('Sync failed', 'Please try again.');
    } catch (error) {
      console.warn('Sync failed', error);
      Alert.alert('Sync failed', 'Please try again.');
    } finally {
      setIsSyncing(false);
    }
  };


  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: activeColors.background }]}> 
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={[styles.avatar, { backgroundColor: `${activeColors.tint}20` }]}> 
            <Text style={[styles.avatarText, { color: activeColors.tint }]}> {name.trim()?.[0]?.toUpperCase() ?? 'U'} </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.label, { color: activeColors.icon }]}>Profile name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme === 'light' ? '#F4F7FA' : '#23272B', color: activeColors.text, borderColor: activeColors.icon }]}
              value={name}
              onChangeText={setName}
              placeholder="User"
              placeholderTextColor={theme === 'light' ? '#8B97A4' : '#787D85'}
            />
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: activeColors.text }]}>Account Actions</Text>

        <View style={[styles.card, { backgroundColor: theme === 'light' ? '#F8FAFC' : '#1A1D21' }]}> 
          <TouchableOpacity style={styles.option} activeOpacity={0.7}>
            <View style={[styles.iconBox, { backgroundColor: theme === 'light' ? '#DEEBFF' : '#22272E' }]}> 
              <Image source={settingsIcon} style={styles.icon} />
            </View>
            <View style={styles.optionText}> 
              <Text style={[styles.optionTitle, { color: activeColors.text }]}>Settings</Text>
              <Text style={[styles.optionSubtitle, { color: activeColors.icon }]}>Customize your preferences</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.option, isSyncing && styles.optionDisabled]}
            activeOpacity={0.7}
            onPress={handleSync}
            disabled={isSyncing}
          >
            <View style={[styles.iconBox, { backgroundColor: theme === 'light' ? '#E2F1FF' : '#1E2C3A' }]}> 
              {isSyncing ? (
                <ActivityIndicator color={activeColors.tint} />
              ) : (
                <Ionicons name="cloud-upload-outline" size={22} color={activeColors.tint} />
              )}
            </View>
            <View style={styles.optionText}> 
              <Text style={[styles.optionTitle, { color: activeColors.text }]}>Sync / Backup</Text>
              <Text style={[styles.optionSubtitle, { color: activeColors.icon }]}>Save and sync your expenses to the cloud</Text>
              {lastSyncedAt ? (
                <Text style={[styles.optionMeta, { color: activeColors.icon }]}>Last synced: {lastSyncedAt.toLocaleString('en-US')}</Text>
              ) : null}
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.option} activeOpacity={0.7} onPress={() => setTheme(nextTheme)}>
            <View style={[styles.iconBox, { backgroundColor: theme === 'light' ? '#FFF0C7' : '#2F2F35' }]}> 
              <Text style={styles.themeIcon}>{theme === 'light' ? '☀️' : '🌙'}</Text>
            </View>
            <View style={styles.optionText}> 
              <Text style={[styles.optionTitle, { color: activeColors.text }]}>Theme</Text>
              <Text style={[styles.optionSubtitle, { color: activeColors.icon }]}>Switch to {nextTheme} mode</Text>
            </View>
            <View style={[styles.themeBadge, { backgroundColor: theme === 'light' ? '#E2E8F0' : '#23272E' }]}> 
              <Text style={[styles.badgeText, { color: activeColors.text }]}> {theme === 'light' ? 'Light' : 'Dark'} </Text>
            </View>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 18,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  input: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  card: {
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 18,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  icon: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
  },
  themeIcon: {
    fontSize: 20,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  optionSubtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  optionMeta: {
    fontSize: 11,
    marginTop: 4,
  },
  optionDisabled: {
    opacity: 0.6,
  },
  themeBadge: {
    borderRadius: 14,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
