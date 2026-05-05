import { createExpense, listExpenses } from '@/services/expenseService';
import type { Expense as DbExpense } from '@/utils/sqlite';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import type { ComponentProps } from 'react';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ExpensesScreen() {
  const [expenses, setExpenses] = useState<DbExpense[]>([]);

  async function load() {
    const rows = await listExpenses();
    setExpenses(rows);
  }

  useEffect(() => {
    void load();
  }, []);

  const monthItems = expenses.map((e) => ({
    id: e.id,
    icon: ((e.category && e.category.toLowerCase().includes('food')) ? 'restaurant-outline' : 'basket-outline') as ComponentProps<typeof Ionicons>['name'],
    title: e.category ?? 'Manual',
    subtitle: e.note ?? 'Added manually',
    amount: `PHP ${Number(e.amount).toFixed(2)}`,
  }));

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>Expenses for this week</Text>

        <View style={styles.overviewRow}>
          <View style={styles.overviewLeft}>
            <Text style={styles.amountMain}>PHP 2,491.34</Text>
            <View style={styles.pillButton}>
              <Text style={styles.pillText}>View insights</Text>
            </View>
          </View>

          <View style={styles.donutOuter}>
            <View style={styles.donutInner} />
          </View>
        </View>

        <View style={styles.monthBlock}>
          <Text style={styles.monthLabel}>This Month</Text>
          {monthItems.slice(0, 2).map((item) => (
            <View key={item.id} style={styles.expenseItem}>
              <View style={styles.expenseLeft}>
                <View style={styles.expenseIconBox}>
                  <Ionicons name={item.icon} size={12} color="#F1F1F5" />
                </View>
                <View style={styles.expenseTextWrap}>
                  <Text style={styles.expenseTitle}>{item.title}</Text>
                  <Text style={styles.expenseSubtitle}>{item.subtitle}</Text>
                </View>
              </View>
              <Text style={styles.expenseAmount}>{item.amount}</Text>
            </View>
          ))}
        </View>

        <View style={styles.rightAlignedBlock}>
          <Text style={styles.rightMonthLabel}>Last Month</Text>
          {monthItems.slice(2, 4).map((item) => (
            <View key={item.id} style={styles.expenseItem}>
              <View style={styles.expenseLeft}>
                <View style={styles.expenseIconBox}>
                  <Ionicons name={item.icon} size={12} color="#F1F1F5" />
                </View>
                <View style={styles.expenseTextWrap}>
                  <Text style={styles.expenseTitle}>{item.title}</Text>
                  <Text style={styles.expenseSubtitle}>{item.subtitle}</Text>
                </View>
              </View>
              <Text style={styles.expenseAmount}>{item.amount}</Text>
            </View>
          ))}
        </View>

        <View style={styles.monthBlock}>
          <Text style={styles.monthLabel}>Last 2 months</Text>
          <View style={styles.expenseItem}>
            <View style={styles.expenseLeft}>
              <View style={styles.expenseIconBox}>
                <Ionicons name="restaurant-outline" size={12} color="#F1F1F5" />
              </View>
              <View style={styles.expenseTextWrap}>
                <Text style={styles.expenseTitle}>Food and Snacks</Text>
                <Text style={styles.expenseSubtitle}>Expenses for food and snacks in a week</Text>
              </View>
            </View>
            <Text style={styles.expenseAmount}>PHP 930.03</Text>
          </View>
          <View style={styles.expenseItem}>
            <View style={styles.expenseLeft}>
              <View style={styles.expenseIconBox}>
                <Ionicons name="basket-outline" size={12} color="#F1F1F5" />
              </View>
              <View style={styles.expenseTextWrap}>
                <Text style={styles.expenseTitle}>Groceries</Text>
                <Text style={styles.expenseSubtitle}>Expenses for basic household supplies</Text>
              </View>
            </View>
            <Text style={styles.expenseAmount}>PHP 5,252,656</Text>
          </View>
        </View>

        <View style={styles.actionWrap}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={async () => {
              // create a simple manual expense and refresh list
              await createExpense({ amount: 123.45, category: 'Manual', note: 'Added from UI' });
              void load();
            }}
          >
            <Text style={styles.actionText}>Add Expense Manually</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    paddingTop: 14,
    paddingBottom: 128,
  },
  sectionLabel: {
    color: '#C5C5CF',
    fontSize: 12,
    marginBottom: 8,
  },
  overviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  overviewLeft: {
    flex: 1,
    paddingRight: 12,
  },
  amountMain: {
    color: '#F4F4F6',
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  pillButton: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#723FEB',
    borderRadius: 999,
    alignSelf: 'flex-start',
    paddingHorizontal: 11,
    paddingVertical: 4,
  },
  pillText: {
    color: '#E7DEFF',
    fontSize: 9,
  },
  donutOuter: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 12,
    borderTopColor: '#8EDDE8',
    borderRightColor: '#723FEB',
    borderBottomColor: '#723FEB',
    borderLeftColor: '#2A2440',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-34deg' }],
  },
  donutInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#1A1A1A',
  },
  monthBlock: {
    marginTop: 4,
  },
 rightAlignedBlock: {
  marginTop: 8,
},
  monthLabel: {
    color: '#8D8D97',
    fontSize: 16,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  rightMonthLabel: {
    color: '#8D8D97',
    fontSize: 16,
    marginBottom: 8,
    alignSelf: 'flex-end',
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 11,
  },
  expenseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  expenseIconBox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#7D7D87',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expenseTextWrap: {
    flexShrink: 1,
  },
  expenseTitle: {
    color: '#D7D7DE',
    fontSize: 11,
  },
  expenseSubtitle: {
    color: '#767681',
    fontSize: 7.5,
    marginTop: 1,
  },
  expenseAmount: {
    color: '#D7D7DE',
    fontSize: 11,
    marginLeft: 8,
  },
  actionWrap: {
    marginTop: 18,
    alignItems: 'center',
  },
  actionButton: {
    width: '100%',
    backgroundColor: '#723FEB',
    borderRadius: 4,
    paddingVertical: 14,
    alignItems: 'center',
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
});
