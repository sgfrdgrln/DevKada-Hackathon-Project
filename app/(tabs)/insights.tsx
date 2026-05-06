import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

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
  const theme = useColorScheme() ?? 'light';
  const activeColors = Colors[theme];

  const currentMonth = new Date().getMonth(); // 0-11, May = 4
  const currentDate = new Date();
  const dayOfWeek = currentDate.getDay(); // 0-6, Sunday = 0
  const dateOfMonth = currentDate.getDate();
  const weekOfMonth = Math.floor((dateOfMonth - 1) / 7); // 0-3

  const barValues = useMemo(() => {
    const values = BAR_VALUES_BY_RANGE[selectedRange];
    if (selectedRange === 'monthly') {
      return values.slice(0, currentMonth + 1);
    }
    return values;
  }, [selectedRange, currentMonth]);

  const xAxisLabels = useMemo(() => {
    const labels = LABELS_BY_RANGE[selectedRange];
    if (selectedRange === 'monthly') {
      return labels.slice(0, currentMonth + 1);
    }
    return labels;
  }, [selectedRange, currentMonth]);

  const getCurrentIndex = () => {
    switch (selectedRange) {
      case 'monthly':
        return currentMonth;
      case 'weekly':
        return weekOfMonth;
      case 'daily':
        return dayOfWeek;
      default:
        return -1;
    }
  };

  const highlightIndex = getCurrentIndex();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: activeColors.background }]}> 
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.heading, { color: activeColors.tint }]}>Insights</Text>
        <Text style={[styles.subtitle, { color: activeColors.icon }]}>You have gained 30% more expense in groceries in this month!</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.barChartContent}>
          <View style={styles.barChart}>
            {barValues.map((value, index) => {
              const isHighlighted = index === highlightIndex;
              return (
                <View key={`${selectedRange}-${index}-${value}`} style={styles.barGroup}>
                  <View style={[styles.bar, { height: value, backgroundColor: isHighlighted ? activeColors.tint : theme === 'light' ? '#C4C4D1' : '#4B4A5A' }, isHighlighted && styles.barHighlighted]} />
                  <Text style={[styles.barLabel, isHighlighted && styles.barLabelHighlighted, { color: isHighlighted ? activeColors.tint : activeColors.icon }]}>{xAxisLabels[index]}</Text>
                </View>
              );
            })}
          </View>
        </ScrollView>

        <View style={styles.chipRow}>
          {FILTER_OPTIONS.map((option) => {
            const isActive = option.value === selectedRange;

            return (
              <Pressable
                key={option.value}
                onPress={() => setSelectedRange(option.value)}
                style={[
                  styles.chip,
                  { backgroundColor: isActive ? activeColors.tint : theme === 'light' ? '#F0F0F3' : '#1B1D26', borderColor: isActive ? activeColors.tint : '#3F3950' },
                ]}>
                <Text style={[styles.chipText, isActive ? { color: activeColors.background, fontWeight: '600' } : { color: activeColors.icon }]}>{option.label}</Text>
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

      </ScrollView>

      <View pointerEvents="box-none" style={styles.fabLayer}>
        <Link href="../chatbot" asChild>
          <TouchableOpacity style={styles.fab}>
            <Ionicons name="chatbubble-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </Link>
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
    width: 40,
    alignItems: 'center',
  },
  bar: {
    width: 12,
    borderRadius: 1,
    backgroundColor: '#723FEB',
  },
  barHighlighted: {
    backgroundColor: '#E0B0FF',
    shadowColor: '#723FEB',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 8,
  },
  barLabel: {
    color: '#8B8B95',
    fontSize: 9,
    marginTop: 6,
  },
  barLabelHighlighted: {
    color: '#E0B0FF',
    fontWeight: '600',
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
  fabLayer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingRight: 16,
    paddingBottom: 96,
  },
  fab: {
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
});
