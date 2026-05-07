import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAutoSync } from '@/hooks/useAutoSync';
import { ExpenseInsight, getExpenseInsights } from '@/services/insightService';
import { syncExpenses } from '@/services/syncService';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type FilterRange = 'daily' | 'weekly' | 'monthly';

const CATEGORY_COLORS = [
  '#723FEB',
  '#97DEF1',
  '#FF6B9D',
  '#FFB347',
  '#76D7C4',
  '#F7DC6F',
  '#BB8FCE',
  '#85C1E2',
];

function getCategoryColor(category: string): string {
  const hash = category.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return CATEGORY_COLORS[hash % CATEGORY_COLORS.length];
}

const FILTER_OPTIONS: { label: string; value: FilterRange }[] = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
];

export default function InsightsScreen() {
  const [selectedRange, setSelectedRange] = useState<FilterRange>('monthly');
  const [insightData, setInsightData] = useState<ExpenseInsight | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(true);
  const [longPressedBar, setLongPressedBar] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [statusExpanded, setStatusExpanded] = useState(false);
  const theme = useColorScheme() ?? 'light';
  const activeColors = Colors[theme];

  async function loadInsights() {
    setLoadingInsights(true);
    try {
      const data = await getExpenseInsights(selectedRange);
      setInsightData(data);
    } catch (error) {
      console.warn('Insight load failed', error);
      setInsightData(null);
    } finally {
      setLoadingInsights(false);
    }
  }

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await syncExpenses();
      await loadInsights();
    } catch (error) {
      console.warn('Refresh failed', error);
    } finally {
      setRefreshing(false);
    }
  }, [selectedRange]);

  useEffect(() => {
    loadInsights();
  }, [selectedRange]);

  // Auto-sync when authenticated
  useAutoSync();

  const chartValues = insightData?.chartValues ?? [];
  const chartLabels = insightData?.chartLabels ?? [];
  const totalValue = insightData?.total ?? 0;
  const peakLabel = insightData?.peakLabel ?? 'N/A';
  const averageValue = insightData?.average ?? 0;
  const topCategory = insightData?.topCategory ?? 'N/A';
  const topCategoryAmount = insightData?.topCategoryAmount ?? 0;
  const statusMessage = insightData?.statusMessage ?? 'Loading your expense analytics...';
  const highlightIndex = Math.max(chartValues.length - 1, 0);

  const maxBarHeight = 120;
  const maxChartValue = Math.max(...chartValues, 1);
  const barHeights = chartValues.map((value) => Math.max(18, Math.round((value / maxChartValue) * maxBarHeight)));

  const handleBarLongPress = (index: number) => {
    setLongPressedBar(index);
    setTimeout(() => {
      setLongPressedBar(null);
    }, 2000);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: activeColors.background }]}> 
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={activeColors.tint}
            colors={[activeColors.tint]}
          />
        }
      >
        <Text style={[styles.heading, { color: activeColors.tint }]}>Insights</Text>
        <Pressable
          onPress={() => setStatusExpanded((prev) => !prev)}
          style={[styles.statusBar, { backgroundColor: theme === 'light' ? '#F7F5FF' : '#23202F' }]}
        >
          <Text
            style={[styles.statusText, { color: activeColors.icon }]}
            numberOfLines={statusExpanded ? undefined : 2}
            ellipsizeMode="tail"
          >
            {statusMessage}
          </Text>
          <Text style={[styles.statusHint, { color: activeColors.icon }]}> 
            {statusExpanded ? 'Tap to collapse' : 'Tap to view full details'}
          </Text>
        </Pressable>

        {loadingInsights ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={activeColors.tint} />
          </View>
        ) : (
          <View style={styles.metricsRow}>
            <View style={[styles.metricCard, { backgroundColor: theme === 'light' ? '#F7F5FF' : '#23202F' }]}>
              <Text style={[styles.metricLabel, { color: activeColors.icon }]}>Total spend</Text>
              <Text style={[styles.metricValue, { color: activeColors.text }]}>{`PHP ${totalValue.toFixed(2)}`}</Text>
            </View>
            <View style={[styles.metricCard, { backgroundColor: theme === 'light' ? '#F7F5FF' : '#23202F' }]}>
              <Text style={[styles.metricLabel, { color: activeColors.icon }]}>Peak period</Text>
              <Text style={[styles.metricValue, { color: activeColors.text }]}>{peakLabel}</Text>
            </View>
            <View style={[styles.metricCard, { backgroundColor: theme === 'light' ? '#F7F5FF' : '#23202F' }]}>
              <Text style={[styles.metricLabel, { color: activeColors.icon }]}>Average</Text>
              <Text style={[styles.metricValue, { color: activeColors.text }]}>{`PHP ${averageValue.toFixed(2)}`}</Text>
            </View>
          </View>
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.barChartContent}>
          <View style={styles.barChart}>
            {chartValues.map((value, index) => {
              const isHighlighted = index === highlightIndex;
              const isLongPressed = longPressedBar === index;
              return (
                <TouchableOpacity
                  key={`${selectedRange}-${index}-${value}`}
                  style={styles.barGroup}
                  onLongPress={() => handleBarLongPress(index)}
                  delayLongPress={300}
                >
                  <View
                    style={[
                      styles.bar,
                      {
                        height: barHeights[index],
                        backgroundColor: isLongPressed
                          ? '#FF6B9D'
                          : isHighlighted
                          ? activeColors.tint
                          : theme === 'light'
                          ? '#C4C4D1'
                          : '#4B4A5A',
                      },
                      (isHighlighted || isLongPressed) && styles.barHighlighted,
                    ]}
                  />
                  {isLongPressed && (
                    <View
                      style={[
                        styles.barTooltip,
                        { backgroundColor: theme === 'light' ? '#F7F5FF' : '#23202F' },
                      ]}
                    >
                      <Text style={[styles.barTooltipText, { color: activeColors.text }]}>
                        PHP {value.toFixed(2)}
                      </Text>
                    </View>
                  )}
                  <Text
                    style={[
                      styles.barLabel,
                      (isHighlighted || isLongPressed) && styles.barLabelHighlighted,
                      {
                        color: isLongPressed ? '#FF6B9D' : isHighlighted ? activeColors.tint : activeColors.icon,
                      },
                    ]}
                  >
                    {chartLabels[index]}
                  </Text>
                </TouchableOpacity>
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
          <View style={styles.donutContainer}>
            <View style={styles.donutOuter}>
              <View style={styles.donutInner} />
            </View>
            <View style={styles.colorLegend}>
              <View
                style={[
                  styles.colorDot,
                  { backgroundColor: getCategoryColor(topCategory) },
                ]}
              />
              <Text style={[styles.colorLabel, { color: activeColors.icon }]}>{topCategory}</Text>
            </View>
          </View>

          <View style={styles.insightTextWrap}>
            <Text style={styles.insightTitle}>Spending summary</Text>
            <Text style={styles.insightLine}>{`Top category: ${topCategory}`}</Text>
            <Text style={styles.insightLine}>{`Top category spend: PHP ${topCategoryAmount.toFixed(2)}`}</Text>
            <Text style={styles.insightLine}>{`Peak period: ${peakLabel}`}</Text>
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
  barTooltip: {
    position: 'absolute',
    top: -30,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    zIndex: 999,
  },
  barTooltipText: {
    fontSize: 11,
    fontWeight: '600',
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
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 18,
  },
  loadingCard: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    padding: 20,
    backgroundColor: '#262337',
    marginBottom: 18,
  },
  statusBar: {
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    width: '100%',
    marginBottom: 16,
  },
  statusText: {
    fontSize: 12,
    lineHeight: 16,
  },
  statusHint: {
    fontSize: 10,
    marginTop: 6,
    opacity: 0.8,
  },
  metricCard: {
    flex: 1,
    borderRadius: 18,
    padding: 14,
    minHeight: 80,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#3F3950',
  },
  metricLabel: {
    fontSize: 10,
    lineHeight: 14,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
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
  donutContainer: {
    alignItems: 'center',
    marginRight: 12,
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
    marginBottom: 8,
  },
  colorLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  colorLabel: {
    fontSize: 10,
    maxWidth: 70,
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
