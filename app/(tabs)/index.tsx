import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const [fabOpen, setFabOpen] = useState(false);

  const expenseItems = [
    {
      id: '1',
      icon: 'restaurant-outline',
      title: 'Food and Snacks',
      subtitle: 'Expenses for food and snacks in a week',
      amount: 'PHP 905.03',
    },
    {
      id: '2',
      icon: 'basket-outline',
      title: 'Groceries',
      subtitle: 'Expenses for basic household supplies',
      amount: 'PHP 7,302.03',
    },
  ] as const;

  const lastMonthItems = [
    {
      id: '1',
      icon: 'restaurant-outline',
      title: 'Food and Snacks',
      subtitle: 'Expenses for food and snacks last month',
      amount: 'PHP 903.08',
    },
    {
      id: '2',
      icon: 'basket-outline',
      title: 'Groceries',
      subtitle: 'Expenses for basic household supplies last month',
      amount: 'PHP 8,302.05',
    },
  ] as const;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person-outline" size={16} color="#FFFFFF" />
          </View>
          <Text style={styles.heading}>What&apos;s new?</Text>
        </View>

        <Text style={styles.sectionLabel}>Expenses for this week</Text>

        <View style={styles.overviewRow}>
          <View style={styles.overviewLeft}>
            <Text style={styles.amountMain}>PHP 2,491.34</Text>
            <View style={styles.pillButton}>
              <Text style={styles.pillText}>View insights</Text>
            </View>
          </View>

          <View style={styles.overviewRight}>
            <View style={styles.donutOuter}>
              <View style={styles.donutInner} />
            </View>
          </View>
        </View>

        <Text style={styles.progressTitle}>Progress Report</Text>
        <Text style={styles.progressText}>
          You have gained 30% more expense in groceries in the last 2 weeks!
        </Text>

        <View style={styles.metricRow}>
          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Ionicons name="wallet-outline" size={14} color="#FFFFFF" />
              <Ionicons name="ellipsis-horizontal" size={14} color="#8B8B95" />
            </View>
            <Text style={styles.metricLabel}>Monthly income</Text>
            <Text style={styles.metricAmount}>PHP 14,305.33</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Ionicons name="trending-down-outline" size={14} color="#FFFFFF" />
              <Ionicons name="ellipsis-horizontal" size={14} color="#8B8B95" />
            </View>
            <Text style={styles.metricLabel}>Monthly Spending</Text>
            <Text style={styles.metricAmount}>PHP 8,305.33</Text>
          </View>
        </View>

        <Text style={styles.monthLabel}>This Month</Text>
        {expenseItems.map((item) => (
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

        <Text style={styles.monthLabel}>Last Month</Text>
        {lastMonthItems.map((item) => (
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

        <View style={styles.pillButtonSecondary}>
          <Text style={styles.pillText}>View Expenses</Text>
        </View>
      </ScrollView>

      <View pointerEvents="box-none" style={styles.fabLayer}>
        <View pointerEvents="box-none" style={styles.fabWrap}>
          {fabOpen ? (
            <>
              <Pressable style={styles.quickActionButton} onPress={() => setFabOpen(false)}>
                <Ionicons name="scan-outline" size={18} color="#FFFFFF" />
              </Pressable>
              <Pressable style={styles.quickActionButton} onPress={() => setFabOpen(false)}>
                <Ionicons name="images-outline" size={18} color="#FFFFFF" />
              </Pressable>
              <Pressable style={styles.quickActionButton} onPress={() => setFabOpen(false)}>
                <Ionicons name="calculator-outline" size={18} color="#FFFFFF" />
              </Pressable>
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
  avatarCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#D8D8D8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    color: '#FFFFFF',
    fontSize: 20,
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
});
