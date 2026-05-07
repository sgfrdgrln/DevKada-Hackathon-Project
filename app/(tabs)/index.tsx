import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAutoSync } from '@/hooks/useAutoSync';
import { useMonthlyIncomeAutoSync } from '@/hooks/useMonthlyIncomeAutoSync';
import { listExpenses } from '@/services/expenseService';
import { extractReceiptData } from '@/services/extractService';
import { syncExpenses } from '@/services/syncService';
import { subscribeToNameChange } from '@/utils/nameChangeEmitter';
import type { Expense as DbExpense } from '@/utils/sqlite';
import { supabase } from '@/utils/supabase';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Link, useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const [fabOpen, setFabOpen] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [expenses, setExpenses] = useState<DbExpense[]>([]);
  const [name, setName] = useState('User');
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const theme = useColorScheme() ?? 'light';
  const activeColors = Colors[theme];
  const [monthlyIncome, setMonthlyIncome] = useState<number | null>(null);
  const [editingIncome, setEditingIncome] = useState(false);
  const [incomeInput, setIncomeInput] = useState('');

  useEffect(() => {
    const loadData = async () => {
      const { data } = await supabase.auth.getUser();
      const displayName = data.user?.user_metadata?.display_name;
      if (displayName && typeof displayName === 'string') {
        setName(displayName);
      } else {
        const storedName = await AsyncStorage.getItem('userName');
        if (storedName) setName(storedName);
      }

      const rows = await listExpenses();
      setExpenses(rows);
      // load monthly income
      try {
        const { getMonthlyIncome } = await import('@/services/monthlyIncomeService');
        const saved = await getMonthlyIncome();
        setMonthlyIncome(saved);
      } catch (err) {
        console.warn('load monthly income failed', err);
      }
    };

    loadData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        const { data } = await supabase.auth.getUser();
        const displayName = data.user?.user_metadata?.display_name;
        if (displayName && typeof displayName === 'string') {
          setName(displayName);
        } else {
          const storedName = await AsyncStorage.getItem('userName');
          if (storedName) setName(storedName);
        }

        const rows = await listExpenses();
        setExpenses(rows);
      };

      loadData();
    }, [])
  );

  useEffect(() => {
    const unsubscribe = subscribeToNameChange((nextName) => {
      if (nextName?.trim()) {
        setName(nextName.trim());
      }
    });

    return unsubscribe;
  }, []);

  // Enable auto-sync for expenses and monthly income
  useAutoSync();
  useMonthlyIncomeAutoSync();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Sync all data if authenticated
      await syncExpenses();
      
      // Also sync monthly income
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user?.id) {
        const { pushUnsyncedMonthlyIncome, pullMonthlyIncome } = await import('@/services/monthlyIncomeService');
        await pushUnsyncedMonthlyIncome(data.user.id);
        await pullMonthlyIncome(data.user.id);
      }
      
      // Reload local data
      const rows = await listExpenses();
      setExpenses(rows);
      
      const { getMonthlyIncome } = await import('@/services/monthlyIncomeService');
      const saved = await getMonthlyIncome();
      setMonthlyIncome(saved);
    } catch (error) {
      console.warn('Refresh failed', error);
    } finally {
      setRefreshing(false);
    }
  }, []);



  function openExpensesModal(amount: string) {
    setFabOpen(false);
    router.push({ pathname: '/expenses', params: { openModal: '1', amount } });
  }

  async function processReceipt(imageUri: string) {
    setIsExtracting(true);

    try {
      const result = await extractReceiptData(imageUri);
      const total = typeof result.total_amount === 'number' ? result.total_amount : null;
      const formatted = total !== null && Number.isFinite(total) ? total.toFixed(2) : '';
      openExpensesModal(formatted);
    } catch (err) {
      console.warn('receipt extraction failed', err);
      openExpensesModal('');
    } finally {
      setIsExtracting(false);
    }
  }

  async function openCamera() {
    if (isExtracting) return;
    const permission = await Camera.requestCameraPermissionsAsync();
    if (!permission.granted) {
      openExpensesModal('');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      await processReceipt(result.assets[0].uri);
    }
  }

  const now = new Date();

  const weekStart = new Date();
  weekStart.setDate(now.getDate() - 7);

  const monthStart = new Date();
  monthStart.setDate(now.getDate() - 30);

  const thisWeekExpenses = expenses.filter((expense) => {
    return new Date(expense.created_at) >= weekStart;
  });

  const thisMonthExpenses = expenses.filter((expense) => {
    return new Date(expense.created_at) >= monthStart;
  });

  const thisWeekTotal = thisWeekExpenses.reduce(
  (sum, e) => sum + Number(e.amount || 0),
  0
);

  const weeklyCategoryData = groupExpensesByCategory(thisWeekExpenses);

  const monthlyCategoryData = groupExpensesByCategory(thisMonthExpenses);

  async function pickImage() {
    if (isExtracting) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      openExpensesModal('');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      await processReceipt(result.assets[0].uri);
    }
  }

  function groupExpensesByCategory(items: DbExpense[]) {
    const grouped: Record<string, number> = {};

    items.forEach((expense) => {
      const category = expense.category || 'Others';

      if (!grouped[category]) {
        grouped[category] = 0;
      }

      grouped[category] += Number(expense.amount);
    });

    return Object.entries(grouped).map(([category, total], index) => ({
      id: String(index),
      icon:
        category.toLowerCase().includes('food')
          ? 'restaurant-outline'
          : 'basket-outline',
      title: category,
      subtitle: `Expenses for ${category.toLowerCase()}`,
      amount: `PHP ${total.toFixed(2)}`,
    }));
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: activeColors.background }]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={activeColors.tint} />}
      >
        <View style={styles.header}>
          <View style={styles.greetingArea}>
            <Text style={[styles.greeting, { color: activeColors.text }]}>Hi, {name.trim() ? name.trim().split(' ')[0] : 'there'} 👋</Text>
            <Text style={[styles.subheading, { color: activeColors.icon }]}>What's new?</Text>
          </View>
          <View style={[styles.avatar, { backgroundColor: `${activeColors.tint}20` }]}>
            <Text style={[styles.avatarText, { color: activeColors.tint }]}>
              {name.trim()?.[0]?.toUpperCase() ?? 'U'}
            </Text>
          </View>
        </View>

        <View style={styles.overviewRow}>
          <View style={styles.overviewLeft}>
             <Text style={[styles.subheading, { color: activeColors.icon }]}>Expense this week</Text>
            <Text style={[styles.amountMain, { color: activeColors.text }]}>PHP {thisWeekTotal.toFixed(2)}</Text>
            <Link href="/insights" asChild>
              <Pressable style={[styles.pillButton, { borderColor: activeColors.tint }]}>
                <Text style={[styles.pillText, { color: activeColors.tint }]}>View insights</Text>
              </Pressable>
            </Link>
          </View>
          <View style={styles.overviewRight}>
            <View style={styles.donutOuter}>
              <View style={[styles.donutInner, { backgroundColor: activeColors.background }]} />
            </View>
          </View>
        </View>

        <Modal animationType="fade" transparent visible={editingIncome} onRequestClose={() => setEditingIncome(false)}>
          <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
            <View style={[styles.modalCard, { width: '90%', padding: 16, borderRadius: 12, backgroundColor: theme === 'light' ? '#FFFFFF' : '#111015' }]}>
              <Text style={{fontSize:16, fontWeight:'600', marginBottom:8, color: activeColors.text}}>Edit Monthly Income</Text>
              <TextInput
                value={incomeInput}
                onChangeText={setIncomeInput}
                keyboardType="decimal-pad"
                placeholder="e.g. 14305.33"
                placeholderTextColor={theme === 'light' ? '#8B97A4' : '#787D85'}
                style={{borderWidth:1, borderColor: activeColors.icon, borderRadius:8, padding:10, color: activeColors.text, marginBottom:12}}
              />
              <View style={{flexDirection:'row', justifyContent:'flex-end', gap:8}}>
                <TouchableOpacity onPress={() => setEditingIncome(false)} style={{paddingHorizontal:12, paddingVertical:8}}>
                  <Text style={{color: activeColors.icon}}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={async () => {
                  const parsed = Number(incomeInput);
                  if (!Number.isFinite(parsed) || parsed < 0) {
                    setIncomeInput('');
                    setEditingIncome(false);
                    return;
                  }
                  try {
                    const { setMonthlyIncome: saveIncome } = await import('@/services/monthlyIncomeService');
                    await saveIncome(parsed);
                    setMonthlyIncome(parsed); // Update UI state immediately
                    setIncomeInput('');
                  } catch (err) {
                    console.warn('save monthly income failed', err);
                  } finally {
                    setEditingIncome(false);
                  }
                }} style={{backgroundColor: activeColors.tint, paddingHorizontal:12, paddingVertical:8, borderRadius:8}}>
                  <Text style={{color:'#fff'}}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Text style={[styles.progressTitle, { color: activeColors.text }]}>Progress Report</Text>
        <Text style={[styles.progressText, { color: activeColors.icon }]}>
          You have gained 30% more expense in groceries in the last 2 weeks!
        </Text>

        {expenses.length > 0 ? (
          <>
            <View style={styles.metricRow}>
              <View style={[styles.metricCard, { backgroundColor: theme === 'light' ? '#F7F8FA' : '#111015' }]}>
                <View style={styles.metricHeader}>
                  <Ionicons name="wallet-outline" size={14} color={activeColors.tint} />
                  <Ionicons name="ellipsis-horizontal" size={14} color={activeColors.icon} />
                </View>
                <Text style={[styles.metricLabel, { color: activeColors.icon }]}>Monthly income</Text>
                <TouchableOpacity onPress={() => {
                  setIncomeInput(monthlyIncome !== null ? String(monthlyIncome.toFixed(2)) : '');
                  setEditingIncome(true);
                }}>
                  <Text style={[styles.metricAmount, { color: activeColors.text }]}>{monthlyIncome !== null ? `PHP ${monthlyIncome.toFixed(2)}` : 'Not set'}</Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.metricCard, { backgroundColor: theme === 'light' ? '#F7F8FA' : '#111015' }]}>
                <View style={styles.metricHeader}>
                  <Ionicons name="trending-down-outline" size={14} color={activeColors.tint} />
                  <Ionicons name="ellipsis-horizontal" size={14} color={activeColors.icon} />
                </View>
                <Text style={[styles.metricLabel, { color: activeColors.icon }]}>Monthly Spending</Text>
                <Text style={[styles.metricAmount, { color: activeColors.text }]}>PHP {thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0).toFixed(2)}</Text>
              </View>
            </View>

            <Text style={[styles.monthLabel, { color: activeColors.icon }]}>This Week</Text>
            {weeklyCategoryData.length > 0 ? (
              weeklyCategoryData.map((item) => (
                <View key={item.id} style={styles.expenseItem}>
                  <View style={styles.expenseLeft}>
                    <View
                      style={[
                        styles.expenseIconBox,
                        { borderColor: activeColors.icon },
                      ]}
                    >
                      <Ionicons
                        name={item.icon as any}
                        size={12}
                        color={activeColors.tint}
                      />
                    </View>

                    <View style={styles.expenseTextWrap}>
                      <Text
                        style={[
                          styles.expenseTitle,
                          { color: activeColors.text },
                        ]}
                      >
                        {item.title}
                      </Text>

                      <Text
                        style={[
                          styles.expenseSubtitle,
                          { color: activeColors.icon },
                        ]}
                      >
                        {item.subtitle}
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={[
                      styles.expenseAmount,
                      { color: activeColors.text },
                    ]}
                  >
                    {item.amount}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={[styles.emptyText, { color: activeColors.icon }]}>No expenses yet</Text>
            )}

            <Text style={[styles.monthLabel, { color: activeColors.icon }]}>This Month</Text>
            {monthlyCategoryData.length > 0 ? (
              monthlyCategoryData.map((item) => (
                <View key={item.id} style={styles.expenseItem}>
                  <View style={styles.expenseLeft}>
                    <View
                      style={[
                        styles.expenseIconBox,
                        {
                          backgroundColor:
                            theme === 'light' ? '#E8EAF6' : '#2A253A',
                          borderColor: activeColors.icon,
                        },
                      ]}
                    >
                      <Ionicons
                        name={item.icon as any}
                        size={12}
                        color={activeColors.tint}
                      />
                    </View>

                    <View style={styles.expenseTextWrap}>
                      <Text
                        style={[
                          styles.expenseTitle,
                          { color: activeColors.text },
                        ]}
                      >
                        {item.title}
                      </Text>

                      <Text
                        style={[
                          styles.expenseSubtitle,
                          { color: activeColors.icon },
                        ]}
                      >
                        {item.subtitle}
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={[
                      styles.expenseAmount,
                      { color: activeColors.text },
                    ]}
                  >
                    {item.amount}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={[styles.emptyText, { color: activeColors.icon }]}>No expenses yet</Text>
            )}

            <Link href="/expenses" asChild>
              <Pressable style={[styles.pillButtonSecondary, { borderColor: activeColors.tint }]}>
                <Text style={[styles.pillText, { color: activeColors.tint }]}>View Expenses</Text>
              </Pressable>
            </Link>
          </>
        ) : (
          <View style={styles.noExpensesContainer}>
            <Ionicons name="wallet-outline" size={48} color={activeColors.icon} />
            <Text style={[styles.noExpensesText, { color: activeColors.text }]}>No expenses yet</Text>
            <Text style={[styles.noExpensesSubtext, { color: activeColors.icon }]}>Start tracking your spending by creating your first expense</Text>
          </View>
        )}
      </ScrollView>

      {isExtracting ? (
        <View style={styles.extractingOverlay}>
          <View
            style={[
              styles.extractingCard,
              { backgroundColor: theme === 'light' ? '#FFFFFF' : '#1B1B22' },
            ]}
          >
            <ActivityIndicator color={activeColors.tint} />
            <Text style={[styles.extractingText, { color: activeColors.text }]}>Extracting receipt...</Text>
          </View>
        </View>
      ) : null}

      <View pointerEvents="box-none" style={styles.fabLayer}>
        <View pointerEvents="box-none" style={styles.fabWrap}>
          {fabOpen ? (
            <>
              <Pressable
                style={[styles.quickActionButton, isExtracting && styles.actionButtonDisabled]}
                onPress={openCamera}
                disabled={isExtracting}
              >
                <Ionicons name="scan-outline" size={18} color="#FFFFFF" />
              </Pressable>
              <Pressable
                style={[styles.quickActionButton, isExtracting && styles.actionButtonDisabled]}
                onPress={pickImage}
                disabled={isExtracting}
              >
                <Ionicons name="images-outline" size={18} color="#FFFFFF" />
              </Pressable>
              <Link href="/calculator" asChild>
                <Pressable style={styles.quickActionButton} onPress={() => setFabOpen(false)}>
                  <Ionicons name="calculator-outline" size={18} color="#FFFFFF" />
                </Pressable>
              </Link>
            </>
          ) : null}

          <Pressable style={styles.plusFab} onPress={() => setFabOpen((value) => !value)}>
            <Ionicons name={fabOpen ? 'close' : 'add'} size={22} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  content: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 128,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    gap: 12,
  },
  greetingArea: {
    flex: 1,
  },
  greeting: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 6,
    lineHeight: 30,
  },
  subheading: {
    color: '#C3C3CD',
    fontSize: 14,
    lineHeight: 18,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 42,
    fontWeight: '700',
  },
  textWrap: {
    flex: 1,
  },
  avatarCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#D8D8D8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    color: '#C3C3CD',
    fontSize: 12,
    marginBottom: 8,
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  overviewLeft: {
    flex: 1,
    paddingRight: 10,
  },
  overviewRight: {
    width: 124,
    alignItems: 'center',
  },
  amountMain: {
    color: '#F4F4F6',
    fontSize: 42,
    lineHeight: 46,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  pillButton: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#723FEB',
    borderRadius: 999,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillButtonSecondary: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#723FEB',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: 'flex-end',
  },
  pillText: {
    color: '#DCD3FF',
    fontSize: 10,
  },
  donutOuter: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 12,
    borderTopColor: '#8FDCE7',
    borderRightColor: '#8FDCE7',
    borderBottomColor: '#723FEB',
    borderLeftColor: '#221D2F',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-32deg' }],
  },
  donutInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#111015',
  },
  progressTitle: {
    color: '#723FEB',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 4,
  },
  progressText: {
    color: '#C8C8D1',
    fontSize: 10,
    lineHeight: 14,
    maxWidth: 180,
    marginBottom: 16,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#111015',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metricLabel: {
    color: '#BDBDC7',
    fontSize: 10,
    marginBottom: 6,
  },
  metricAmount: {
    color: '#F2F2F4',
    fontSize: 28,
    lineHeight: 30,
  },
  monthLabel: {
    marginTop: 16,
    marginBottom: 10,
    color: '#8E8E98',
    fontSize: 14,
    fontWeight: '600',
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 12,
  },
  noExpensesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  noExpensesText: {
    fontSize: 16,
    fontWeight: '600',
  },
  noExpensesSubtext: {
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 240,
  },
  expenseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  expenseIconBox: {
    width: 17,
    height: 17,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#7C7C87',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expenseTextWrap: {
    flexShrink: 1,
  },
  expenseTitle: {
    color: '#D3D3DB',
    fontSize: 12,
  },
  expenseSubtitle: {
    color: '#71717C',
    fontSize: 8,
    marginTop: 1,
  },
  expenseAmount: {
    color: '#CFCFD6',
    fontSize: 12,
    marginLeft: 6,
  },
  fabLayer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingRight: 16,
    paddingBottom: 96,
  },
  fabWrap: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  plusFab: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#723FEB',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  quickActionButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#5E2DCC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  extractingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  extractingCard: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    gap: 10,
  },
  extractingText: {
    fontSize: 12,
  },
  modalCard: {
    minWidth: 280,
  },
});
