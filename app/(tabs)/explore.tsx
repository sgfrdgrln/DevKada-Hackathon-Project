import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

type FilterRange = 'daily' | 'weekly' | 'monthly';

const BAR_VALUES_BY_RANGE: Record<FilterRange, readonly number[]> = {
  daily: [22, 40, 18, 55, 34, 76, 50],
  weekly: [36, 68, 30, 82, 70, 48, 24, 33],
  monthly: [76, 12, 80, 14, 66, 84, 78, 46, 24, 30, 14, 40],
};

const LABELS_BY_RANGE: Record<FilterRange, readonly string[]> = {
  daily: ['Sun', 'Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat', 'Sun'],
  weekly: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8'],
  monthly: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};

const FILTER_OPTIONS: { label: string; value: FilterRange }[] = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
];

export default function InsightsScreen() {
  const [selectedRange, setSelectedRange] = useState<FilterRange>('monthly');

  const barValues = useMemo(() => BAR_VALUES_BY_RANGE[selectedRange], [selectedRange]);
  const xAxisLabels = useMemo(() => LABELS_BY_RANGE[selectedRange], [selectedRange]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>Insights</Text>
        <Text style={styles.subtitle}>You have gained 30% more expense in groceries in this month!</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.barChartContent}>
          <View style={styles.barChart}>
            {barValues.map((value, index) => (
              <View key={`${selectedRange}-${index}-${value}`} style={styles.barGroup}>
                <View style={[styles.bar, { height: value }]} />
                <Text style={styles.barLabel}>{xAxisLabels[index]}</Text>
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={styles.chipRow}>
          {FILTER_OPTIONS.map((option) => {
            const isActive = option.value === selectedRange;

            return (
              <Pressable
                key={option.value}
                onPress={() => setSelectedRange(option.value)}
                style={[styles.chip, isActive && styles.chipActive]}>
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.insightBlock}>
          <View style={styles.donutOuter}>
            <View style={styles.donutInner} />
          </View>

          <View style={styles.insightTextWrap}>
            <Text style={styles.insightTitle}>Monthly Insights</Text>
            <Text style={styles.insightLine}>40% is spent with groceries</Text>
            <Text style={styles.insightLine}>20% is spent with food and snacks</Text>
            <Text style={styles.insightLine}>40% is spent with bills</Text>
          </View>
        </View>

        <Text style={styles.botLabel}>AI Chatbot</Text>
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
    paddingTop: 56,
    paddingBottom: 128,
  },
  heading: {
    color: '#723FEB',
    fontSize: 14,
    marginBottom: 6,
  },
  subtitle: {
    color: '#E2E2E8',
    fontSize: 11,
    lineHeight: 16,
    maxWidth: 210,
    marginBottom: 22,
  },
  barChartContent: {
    paddingRight: 6,
    marginBottom: 14,
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  barGroup: {
    width: 44,
    alignItems: 'center',
  },
  bar: {
    width: 12,
    borderRadius: 1,
    backgroundColor: '#723FEB',
  },
  barLabel: {
    color: '#8B8B95',
    fontSize: 9,
    marginTop: 6,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#3F3950',
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: '#201C2B',
  },
  chipActive: {
    borderColor: '#723FEB',
    backgroundColor: '#723FEB',
  },
  chipText: {
    color: '#A39CB5',
    fontSize: 11,
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  insightBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  donutOuter: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 18,
    borderTopColor: '#723FEB',
    borderRightColor: '#723FEB',
    borderBottomColor: '#97DEF1',
    borderLeftColor: '#97DEF1',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-30deg' }],
  },
  donutInner: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#1A1A1A',
  },
  insightTextWrap: {
    marginLeft: 12,
    flexShrink: 1,
  },
  insightTitle: {
    color: '#8B8B95',
    fontSize: 14,
    marginBottom: 6,
  },
  insightLine: {
    color: '#8B8B95',
    fontSize: 10,
    lineHeight: 13,
  },
  botLabel: {
    color: '#FFFFFF',
    fontSize: 17,
    marginTop: 4,
  },
});
