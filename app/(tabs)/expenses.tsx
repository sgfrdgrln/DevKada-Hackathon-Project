import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAutoSync } from '@/hooks/useAutoSync';
import { showToast } from '@/hooks/useToast';
import { createExpense, deleteExpense, listExpenses, updateExpense } from '@/services/expenseService';
import { syncExpenses } from '@/services/syncService';
import type { Expense as DbExpense } from '@/utils/sqlite';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import type { ComponentProps } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

const CATEGORY_OPTIONS = [
  'Food & Snacks',
  'Groceries',
  'Bills',
  'Digital Payment',
  'Others',
] as const;

const DATE_FILTERS = ['All', 'Today', 'Last Week', 'Last Month'] as const;
const SORT_OPTIONS = ['Date Desc', 'Date Asc', 'Highest to Lowest', 'Lowest to Highest'] as const;

type CategoryFilter = typeof CATEGORY_OPTIONS[number] | 'All';
type DateFilter = typeof DATE_FILTERS[number];
type SortOption = typeof SORT_OPTIONS[number];

const DEFAULT_SORT: SortOption = 'Date Desc';

export default function ExpensesScreen() {
  const [expenses, setExpenses] = useState<DbExpense[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [category, setCategory] = useState<string>(CATEGORY_OPTIONS[0]);
  const [amountInput, setAmountInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('All');
  const [dateFilter, setDateFilter] = useState<DateFilter>('All');
  const [sortOption, setSortOption] = useState<SortOption>(DEFAULT_SORT);
  const [dateMenuOpen, setDateMenuOpen] = useState(false);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { openModal: openModalParam, amount: amountParam } = useLocalSearchParams<{
    openModal?: string;
    amount?: string;
  }>();
  const theme = useColorScheme() ?? 'light';
  const activeColors = Colors[theme];

  async function load() {
    const rows = await listExpenses();
    setExpenses(rows);
  }

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await syncExpenses();
      await load();
    } catch (error) {
      console.warn('Refresh failed', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, []);

  // Auto-sync when authenticated
  useAutoSync();

  const openModalWithAmount = useCallback((nextAmount: string) => {
    setEditingExpenseId(null);
    setCategory(CATEGORY_OPTIONS[0]);
    setAmountInput(nextAmount);
    setNoteInput('');
    setFormError(null);
    setIsModalVisible(true);
  }, []);

  const openEditModal = useCallback((expense: DbExpense) => {
    const fallbackCategory = CATEGORY_OPTIONS[0];
    setEditingExpenseId(expense.id);
    setCategory(expense.category ?? fallbackCategory);
    setAmountInput(String(expense.amount ?? ''));
    setNoteInput(expense.note ?? '');
    setFormError(null);
    setIsModalVisible(true);
  }, []);

  const openModal = useCallback(() => {
    openModalWithAmount('');
  }, [openModalWithAmount]);

  useEffect(() => {
    if (openModalParam === '1') {
      const nextAmount = typeof amountParam === 'string' ? amountParam : '';
      openModalWithAmount(nextAmount);
      router.setParams({ openModal: undefined, amount: undefined });
    }
  }, [openModalParam, amountParam, openModalWithAmount, router]);

  async function handleSave() {
    const parsedAmount = Number(amountInput);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setFormError('Enter a valid amount.');
      return;
    }

    setFormError(null);
    if (editingExpenseId) {
      await updateExpense(editingExpenseId, {
        amount: parsedAmount,
        category,
        note: noteInput.trim() ? noteInput.trim() : null,
      });
      setEditingExpenseId(null);
      showToast('Expense updated', { type: 'success' });
    } else {
      await createExpense({
        amount: parsedAmount,
        category,
        note: noteInput.trim() ? noteInput.trim() : null,
      });
      showToast('Expense added', { type: 'success' });
    }
    setIsModalVisible(false);
    void load();
  }

  async function handleDelete(expenseId: string) {
    Alert.alert('Delete expense', 'Are you sure you want to delete this expense?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteExpense(expenseId);
            showToast('Expense deleted', { type: 'success' });
            await load();
          } catch (err) {
            console.warn('delete failed', err);
            showToast('Delete failed', { type: 'error' });
          }
        },
      },
    ]);
  }

  const filteredExpenses = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(todayStart);
    monthStart.setDate(monthStart.getDate() - 30);

    const filtered = expenses.filter((expense) => {
      if (normalizedQuery) {
        const note = expense.note ?? '';
        if (!note.toLowerCase().includes(normalizedQuery)) return false;
      }

      if (categoryFilter !== 'All') {
        const categoryValue = expense.category ?? 'Others';
        if (categoryValue !== categoryFilter) return false;
      }

      if (dateFilter !== 'All') {
        const createdAt = new Date(expense.created_at);
        if (Number.isNaN(createdAt.getTime())) return false;
        if (dateFilter === 'Today' && createdAt < todayStart) return false;
        if (dateFilter === 'Last Week' && createdAt < weekStart) return false;
        if (dateFilter === 'Last Month' && createdAt < monthStart) return false;
      }

      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      if (sortOption === 'Highest to Lowest') return b.amount - a.amount;
      if (sortOption === 'Lowest to Highest') return a.amount - b.amount;
      if (sortOption === 'Date Asc') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return sorted;
  }, [expenses, searchQuery, categoryFilter, dateFilter, sortOption]);

  const totalExpenses = useMemo(
    () => filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0),
    [filteredExpenses]
  );

  const headingText = useMemo(() => {
    if (dateFilter === 'Today') return "Today's expenses";
    if (dateFilter === 'Last Week') return "This week's expenses";
    if (dateFilter === 'Last Month') return "This month's expenses";
    return 'Your current expenses';
  }, [dateFilter]);

  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
    categoryFilter !== 'All' ||
    dateFilter !== 'All' ||
    sortOption !== DEFAULT_SORT
  );

  const displayItems = useMemo(
    () =>
      filteredExpenses.map((expense) => ({
        id: expense.id,
        icon: ((expense.category && expense.category.toLowerCase().includes('food'))
          ? 'restaurant-outline'
          : 'basket-outline') as ComponentProps<typeof Ionicons>['name'],
        title: expense.category ?? 'Manual',
        subtitle: expense.note ?? 'Added manually',
        createdAt: new Date(expense.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        amount: `PHP ${Number(expense.amount).toFixed(2)}`,
        source: expense,
      })),
    [filteredExpenses]
  );

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setCategoryFilter('All');
    setDateFilter('All');
    setSortOption(DEFAULT_SORT);
  }, []);

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
        <Text style={[styles.pageTitle, { color: activeColors.text }]}>{headingText}</Text>
        <View style={styles.overviewRow}>
          <View style={styles.overviewLeft}>
            <Text style={[styles.amountMain, { color: activeColors.text }]}>PHP {totalExpenses.toFixed(2)}</Text>
            <View style={[styles.pillButton, { borderColor: activeColors.tint }]}> 
              <Text style={[styles.pillText, { color: activeColors.tint }]}>View insights</Text>
            </View>
          </View>

          <View style={styles.donutOuter}>
            <View style={[styles.donutInner, { backgroundColor: activeColors.background }]} />
          </View>
        </View>
        <View style={[styles.searchBar, { borderColor: activeColors.icon, backgroundColor: theme === 'light' ? '#FFFFFF' : '#1B1B22' }]}
        >
          <Ionicons name="search-outline" size={14} color={activeColors.icon} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search notes"
            placeholderTextColor={activeColors.icon}
            style={[styles.searchInput, { color: activeColors.text }]}
          />
        </View>

        <View style={styles.filterGroup}>
          <View style={styles.filterHeaderRow}>
            <Text style={[styles.filterLabel, { color: activeColors.icon }]}>Category</Text>
            <View style={styles.filterIconRow}>
              <TouchableOpacity style={styles.filterIconButton} onPress={() => setDateMenuOpen(true)}>
                <Ionicons name="calendar-outline" size={16} color={activeColors.icon} />
                {dateFilter !== 'All' ? (
                  <View style={[styles.filterDot, { backgroundColor: activeColors.tint }]} />
                ) : null}
              </TouchableOpacity>
              <TouchableOpacity style={styles.filterIconButton} onPress={() => setSortMenuOpen(true)}>
                <Ionicons name="swap-vertical-outline" size={16} color={activeColors.icon} />
                {sortOption !== DEFAULT_SORT ? (
                  <View style={[styles.filterDot, { backgroundColor: activeColors.tint }]} />
                ) : null}
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.filterRow}>
            {CATEGORY_OPTIONS.map((option) => {
              const isActive = option === categoryFilter;
              return (
                <TouchableOpacity
                  key={option}
                  onPress={() => setCategoryFilter(isActive ? 'All' : option)}
                  style={[
                    styles.filterChip,
                    { borderColor: activeColors.icon },
                    isActive && { backgroundColor: activeColors.tint, borderColor: activeColors.tint },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      { color: activeColors.text },
                      isActive && { color: '#FFFFFF' },
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {hasActiveFilters ? (
          <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
            <Text style={[styles.clearFiltersText, { color: activeColors.tint }]}>Clear filters</Text>
          </TouchableOpacity>
        ) : null}

        <View style={styles.expenseListBlock}>
          {displayItems.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyTitle, { color: activeColors.text }]}>No expenses found</Text>
              <Text style={[styles.emptySubtitle, { color: activeColors.icon }]}>Try adjusting your filters.</Text>
            </View>
          ) : (
            displayItems.map((item) => (
              <Swipeable
                key={item.id}
                renderRightActions={() => (
                  <View style={styles.swipeActions}>
                    <TouchableOpacity
                      style={[styles.swipeActionButton, styles.swipeActionEdit]}
                      onPress={() => openEditModal(item.source)}
                    >
                      <Ionicons name="create-outline" size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.swipeActionButton, styles.swipeActionDelete]}
                      onPress={() => handleDelete(item.id)}
                    >
                      <Ionicons name="trash-outline" size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                )}
              >
                <View style={styles.expenseItem}>
                  <View style={styles.expenseLeft}>
                    <View style={[styles.expenseIconBox, { backgroundColor: theme === 'light' ? '#E8EAF6' : '#2A253A', borderColor: activeColors.icon }]}> 
                      <Ionicons name={item.icon} size={12} color={activeColors.tint} />
                    </View>
                    <View style={styles.expenseTextWrap}>
                      <Text style={[styles.expenseTitle, { color: activeColors.text }]}>{item.title}</Text>
                      <Text style={[styles.expenseSubtitle, { color: activeColors.icon }]}>{item.subtitle}</Text>
                      <Text style={[styles.expenseDate, { color: activeColors.icon }]}>{item.createdAt}</Text>
                    </View>
                  </View>
                  <Text style={[styles.expenseAmount, { color: activeColors.text }]}>{item.amount}</Text>
                </View>
              </Swipeable>
            ))
          )}
        </View>
      </ScrollView>

      <Modal
        animationType="fade"
        transparent
        visible={dateMenuOpen}
        onRequestClose={() => setDateMenuOpen(false)}
      >
        <Pressable style={styles.menuBackdrop} onPress={() => setDateMenuOpen(false)}>
          <Pressable
            style={[styles.menuCard, { backgroundColor: theme === 'light' ? '#FFFFFF' : '#1B1B22' }]}
            onPress={() => undefined}
          >
            <Text style={[styles.menuTitle, { color: activeColors.text }]}>Date</Text>
            {DATE_FILTERS.map((option) => {
              const isActive = option === dateFilter;
              return (
                <TouchableOpacity
                  key={option}
                  style={styles.menuItem}
                  onPress={() => {
                    setDateFilter(option);
                    setDateMenuOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.menuItemText,
                      { color: activeColors.text },
                      isActive && { color: activeColors.tint },
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        animationType="fade"
        transparent
        visible={sortMenuOpen}
        onRequestClose={() => setSortMenuOpen(false)}
      >
        <Pressable style={styles.menuBackdrop} onPress={() => setSortMenuOpen(false)}>
          <Pressable
            style={[styles.menuCard, { backgroundColor: theme === 'light' ? '#FFFFFF' : '#1B1B22' }]}
            onPress={() => undefined}
          >
            <Text style={[styles.menuTitle, { color: activeColors.text }]}>Sort</Text>
            {SORT_OPTIONS.map((option) => {
              const isActive = option === sortOption;
              return (
                <TouchableOpacity
                  key={option}
                  style={styles.menuItem}
                  onPress={() => {
                    setSortOption(option);
                    setSortMenuOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.menuItemText,
                      { color: activeColors.text },
                      isActive && { color: activeColors.tint },
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        animationType="slide"
        transparent
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
        >
          <ScrollView contentContainerStyle={styles.modalScrollContent} keyboardShouldPersistTaps="handled">
            <View
              style={[
                styles.modalCard,
                { backgroundColor: theme === 'light' ? '#FFFFFF' : '#1B1B22' },
              ]}
            >
            <Text style={[styles.modalTitle, { color: activeColors.text }]}>Add expense</Text>

            <Text style={[styles.modalLabel, { color: activeColors.icon }]}>Category</Text>
            <View style={styles.categoryRow}>
              {CATEGORY_OPTIONS.map((option) => {
                const isActive = option === category;
                return (
                  <TouchableOpacity
                    key={option}
                    onPress={() => setCategory(option)}
                    style={[
                      styles.categoryChip,
                      { borderColor: activeColors.icon },
                      isActive && { backgroundColor: activeColors.tint, borderColor: activeColors.tint },
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        { color: activeColors.text },
                        isActive && { color: '#FFFFFF' },
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.modalLabel, { color: activeColors.icon }]}>Amount</Text>
            <TextInput
              value={amountInput}
              onChangeText={setAmountInput}
              keyboardType="decimal-pad"
              placeholder="PHP 0.00"
              placeholderTextColor={activeColors.icon}
              style={[styles.input, { color: activeColors.text, borderColor: activeColors.icon }]}
            />

            <Text style={[styles.modalLabel, { color: activeColors.icon }]}>Note (optional)</Text>
            <TextInput
              value={noteInput}
              onChangeText={setNoteInput}
              placeholder="Add a note"
              placeholderTextColor={activeColors.icon}
              multiline
              numberOfLines={3}
              style={[
                styles.input,
                styles.noteInput,
                { color: activeColors.text, borderColor: activeColors.icon },
              ]}
            />

            {formError ? (
              <Text style={styles.errorText}>{formError}</Text>
            ) : null}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.actionButton, { borderColor: activeColors.icon }]}
                onPress={() => {
                  setIsModalVisible(false);
                  setEditingExpenseId(null);
                }}
              >
                <Text style={[styles.actionButtonText, { color: activeColors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButtonPrimary} onPress={handleSave}>
                <Text style={styles.actionButtonTextPrimary}>Save</Text>
              </TouchableOpacity>
            </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      <View pointerEvents="box-none" style={styles.fabLayer}>
        <TouchableOpacity
          style={styles.fab}
          onPress={openModal}
        >
          <Ionicons name="cash-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
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
    paddingTop: 14,
    paddingBottom: 128,
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
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
  filterGroup: {
    marginTop: 12,
  },
  filterHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  filterLabel: {
    fontSize: 11,
  },
  filterIconRow: {
    flexDirection: 'row',
    gap: 10,
  },
  filterIconButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 11,
  },
  clearFiltersButton: {
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  clearFiltersText: {
    fontSize: 11,
    fontWeight: '600',
  },
  expenseListBlock: {
    marginTop: 12,
  },
  emptyState: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 11,
  },
expenseItem: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 14,
  paddingVertical: 10,   // 👈 add this
},
  expenseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
 expenseIconBox: {
  width: 28,   // was 16
  height: 28,  // was 16
  borderRadius: 8,
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
  expenseDate: {
    color: '#767681',
    fontSize: 7.5,
    marginTop: 1,
  },
  expenseAmount: {
    color: '#D7D7DE',
    fontSize: 11,
    marginLeft: 8,
  },
  swipeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 11,
    gap: 8,
  },
  swipeActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swipeActionEdit: {
    backgroundColor: '#3F8EF7',
  },
  swipeActionDelete: {
    backgroundColor: '#E5484D',
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 96,
  },
  menuCard: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  menuItem: {
    paddingVertical: 8,
  },
  menuItemText: {
    fontSize: 12,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  modalCard: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 22,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  modalLabel: {
    fontSize: 11,
    marginBottom: 6,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  categoryChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 11,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    marginBottom: 12,
  },
  noteInput: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#F28B82',
    fontSize: 11,
    marginTop: -4,
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  actionButton: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  actionButtonPrimary: {
    backgroundColor: '#723FEB',
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  actionButtonText: {
    fontSize: 11,
  },
  actionButtonTextPrimary: {
    color: '#FFFFFF',
    fontSize: 11,
  },
});
