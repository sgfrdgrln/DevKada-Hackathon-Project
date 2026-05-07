import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { extractReceiptData } from '@/services/extractService';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Link, useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { listExpenses } from '@/services/expenseService';
import type { Expense as DbExpense } from '@/utils/sqlite';

export default function HomeScreen() {
  const [fabOpen, setFabOpen] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [expenses, setExpenses] = useState<DbExpense[]>([]);
  const [name, setName] = useState('User');
  const router = useRouter();
  const theme = useColorScheme() ?? 'light';
  const activeColors = Colors[theme];

  useEffect(() => {
    const loadData = async () => {
      const storedName = await AsyncStorage.getItem('userName');
      if (storedName) setName(storedName);

      const rows = await listExpenses();
      setExpenses(rows);
    };

    loadData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        const storedName = await AsyncStorage.getItem('userName');
        if (storedName) setName(storedName);

        const rows = await listExpenses();
        setExpenses(rows);
      };

      loadData();
    }, [])
  );



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
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person-outline" size={16} color={activeColors.background === '#fff' ? '#000' : '#FFF'} />
          </View>
          <View style={styles.textWrap}>
            <Text style={[styles.greeting, { color: activeColors.text }]}>Hi {name}!</Text>
            <Text style={[styles.heading, { color: activeColors.tint }]}>What’s new?</Text>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: activeColors.icon }]}>Expenses for this week</Text>

        <View style={styles.overviewRow}>
          <View style={styles.overviewLeft}>
            <Text style={[styles.amountMain, { color: activeColors.text }]}>PHP 2,491.34</Text>
            <Link href="/explore" asChild>
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

        <Text style={[styles.progressTitle, { color: activeColors.text }]}>Progress Report</Text>
        <Text style={[styles.progressText, { color: activeColors.icon }]}>
          You have gained 30% more expense in groceries in the last 2 weeks!
        </Text>

        <View style={styles.metricRow}>
          <View style={[styles.metricCard, { backgroundColor: theme === 'light' ? '#F7F8FA' : '#111015' }]}>
            <View style={styles.metricHeader}>
              <Ionicons name="wallet-outline" size={14} color={activeColors.tint} />
              <Ionicons name="ellipsis-horizontal" size={14} color={activeColors.icon} />
            </View>
            <Text style={[styles.metricLabel, { color: activeColors.icon }]}>Monthly income</Text>
            <Text style={[styles.metricAmount, { color: activeColors.text }]}>PHP 14,305.33</Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: theme === 'light' ? '#F7F8FA' : '#111015' }]}>
            <View style={styles.metricHeader}>
              <Ionicons name="trending-down-outline" size={14} color={activeColors.tint} />
              <Ionicons name="ellipsis-horizontal" size={14} color={activeColors.icon} />
            </View>
            <Text style={[styles.metricLabel, { color: activeColors.icon }]}>Monthly Spending</Text>
            <Text style={[styles.metricAmount, { color: activeColors.text }]}>PHP 8,305.33</Text>
          </View>
        </View>

        <Text style={[styles.monthLabel, { color: activeColors.icon }]}>
  This Week
</Text>

{weeklyCategoryData.map((item) => (
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
))}

<Text style={[styles.monthLabel, { color: activeColors.icon }]}>
  This Month
</Text>

{monthlyCategoryData.map((item) => (
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
))}

        <Link href="/expenses" asChild>
          <Pressable style={[styles.pillButtonSecondary, { borderColor: activeColors.tint }]}>
            <Text style={[styles.pillText, { color: activeColors.tint }]}>View Expenses</Text>
          </Pressable>
        </Link>
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
    alignItems: 'center',
    marginBottom: 14,
    gap: 8,
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
  greeting: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  heading: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
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
    marginTop: 6,
    marginBottom: 4,
  },
  progressText: {
    color: '#C8C8D1',
    fontSize: 10,
    lineHeight: 14,
    maxWidth: 180,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
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
    marginTop: 12,
    marginBottom: 8,
    color: '#8E8E98',
    fontSize: 18,
    fontWeight: '500',
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 9,
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
});
