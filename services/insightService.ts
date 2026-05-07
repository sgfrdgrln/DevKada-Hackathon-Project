import { listExpenses } from '@/services/expenseService';

type InsightRange = 'daily' | 'weekly' | 'monthly';

export type ExpenseInsight = {
  total: number;
  average: number;
  peakLabel: string;
  peakValue: number;
  topCategory: string;
  topCategoryAmount: number;
  statusMessage: string;
  chartValues: number[];
  chartLabels: string[];
};

const DAY_LABELS = ['Sun', 'Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat'];
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function getDailyBuckets(now: Date) {
  const buckets = Array.from({ length: 7 }, (_, index) => {
    const bucketStart = startOfDay(new Date(now));
    bucketStart.setDate(now.getDate() - (6 - index));
    return {
      label: DAY_LABELS[bucketStart.getDay()],
      start: bucketStart,
      end: endOfDay(bucketStart),
      total: 0,
    };
  });
  return buckets;
}

function getWeeklyBuckets(now: Date) {
  const dateOfMonth = now.getDate();
  const weekOfMonth = Math.floor((dateOfMonth - 1) / 7);
  const bucketsToShow = weekOfMonth + 1;

  const buckets = Array.from({ length: bucketsToShow }, (_, index) => {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const weekStart = new Date(monthStart);
    weekStart.setDate(monthStart.getDate() + index * 7);
    const weekEnd = endOfDay(new Date(weekStart));
    weekEnd.setDate(weekStart.getDate() + 6);

    return {
      label: `Week ${index + 1}`,
      start: startOfDay(weekStart),
      end: weekEnd,
      total: 0,
    };
  });
  return buckets;
}

function getMonthlyBuckets(now: Date) {
  const currentMonth = now.getMonth();
  const buckets = Array.from({ length: currentMonth + 1 }, (_, index) => {
    const monthStart = new Date(now.getFullYear(), index, 1);
    const monthEnd = new Date(now.getFullYear(), index + 1, 0, 23, 59, 59, 999);
    return {
      label: MONTH_LABELS[index],
      start: monthStart,
      end: monthEnd,
      total: 0,
    };
  });
  return buckets;
}

function buildBuckets(range: InsightRange, now: Date) {
  switch (range) {
    case 'daily':
      return getDailyBuckets(now);
    case 'weekly':
      return getWeeklyBuckets(now);
    case 'monthly':
      return getMonthlyBuckets(now);
    default:
      return getMonthlyBuckets(now);
  }
}

function formatCurrency(amount: number) {
  return `PHP ${amount.toFixed(2)}`;
}

export async function getExpenseInsights(range: InsightRange): Promise<ExpenseInsight> {
  const expenses = await listExpenses();
  const now = new Date();
  const buckets = buildBuckets(range, now);
  const categoryTotals: Record<string, number> = {};
  let total = 0;

  for (const expense of expenses) {
    const expenseDate = new Date(expense.created_at);
    if (Number.isNaN(expenseDate.getTime())) continue;

    const amount = Number(expense.amount ?? 0);
    total += amount;

    const category = expense.category?.trim() || 'Others';
    categoryTotals[category] = (categoryTotals[category] ?? 0) + amount;

    const bucket = buckets.find((bucketItem) => expenseDate >= bucketItem.start && expenseDate <= bucketItem.end);
    if (bucket) {
      bucket.total += amount;
    }
  }

  const chartValues = buckets.map((bucket) => bucket.total);
  const chartLabels = buckets.map((bucket) => bucket.label);
  const peakValue = Math.max(...chartValues, 0);
  const peakIndex = chartValues.indexOf(peakValue);
  const peakLabel = chartLabels[peakIndex] ?? 'N/A';
  const average = Math.round((total || 0) / Math.max(chartValues.length, 1));

  const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
  const [topCategory = ['Others', 0]] = sortedCategories;
  const [topCategoryName, topCategoryAmount] = topCategory;

  const previousValue = chartValues.length > 1 ? chartValues[chartValues.length - 2] : 0;
  const lastValue = chartValues[chartValues.length - 1] ?? 0;
  const trendChange = previousValue ? Math.round(((lastValue - previousValue) / previousValue) * 100) : 0;
  const trendLabel = previousValue
    ? trendChange > 0
      ? `Spending is up ${trendChange}% versus the previous period.`
      : trendChange < 0
      ? `Spending is down ${Math.abs(trendChange)}% versus the previous period.`
      : 'Spending is flat compared to the previous period.'
    : `This period has ${formatCurrency(lastValue)} in spending; add more expenses to build trend comparisons.`;

  const statusMessage = expenses.length
    ? `Top category is ${topCategoryName} with ${formatCurrency(topCategoryAmount)}. ${trendLabel}`
    : 'You have no recorded expenses yet. Add an expense to see your insights here.';

  return {
    total,
    average,
    peakLabel,
    peakValue,
    topCategory: topCategoryName,
    topCategoryAmount,
    statusMessage,
    chartValues,
    chartLabels,
  };
}
