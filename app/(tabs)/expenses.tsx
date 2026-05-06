import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { createExpense, listExpenses } from '@/services/expenseService';
import type { Expense as DbExpense } from '@/utils/sqlite';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import type { ComponentProps } from 'react';
import { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const CATEGORY_OPTIONS = [
  'Food & Snacks',
  'Groceries',
  'Bills',
  'Digital Payment',
  'Others',
] as const;

export default function ExpensesScreen() {
  const [expenses, setExpenses] = useState<DbExpense[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [category, setCategory] = useState<string>(CATEGORY_OPTIONS[0]);
  const [amountInput, setAmountInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const theme = useColorScheme() ?? 'light';
  const activeColors = Colors[theme];

  async function load() {
    const rows = await listExpenses();
    setExpenses(rows);
  }

  useEffect(() => {
    void load();
  }, []);

  function openModal() {
    setCategory(CATEGORY_OPTIONS[0]);
    setAmountInput('');
    setNoteInput('');
    setFormError(null);
    setIsModalVisible(true);
  }

  async function handleSave() {
    const parsedAmount = Number(amountInput);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setFormError('Enter a valid amount.');
      return;
    }

    setFormError(null);
    await createExpense({
      amount: parsedAmount,
      category,
      note: noteInput.trim() ? noteInput.trim() : null,
    });
    setIsModalVisible(false);
    void load();
  }

  const monthItems = expenses.map((e) => ({
    id: e.id,
    icon: ((e.category && e.category.toLowerCase().includes('food')) ? 'restaurant-outline' : 'basket-outline') as ComponentProps<typeof Ionicons>['name'],
    title: e.category ?? 'Manual',
    subtitle: e.note ?? 'Added manually',
    amount: `PHP ${Number(e.amount).toFixed(2)}`,
  }));

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: activeColors.background }]}> 
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionLabel, { color: activeColors.icon }]}>Expenses for this week</Text>

        <View style={styles.overviewRow}>
          <View style={styles.overviewLeft}>
            <Text style={[styles.amountMain, { color: activeColors.text }]}>PHP 2,491.34</Text>
            <View style={[styles.pillButton, { borderColor: activeColors.tint }]}> 
              <Text style={[styles.pillText, { color: activeColors.tint }]}>View insights</Text>
            </View>
          </View>

          <View style={styles.donutOuter}>
            <View style={[styles.donutInner, { backgroundColor: activeColors.background }]} />
          </View>
        </View>

        <View style={styles.monthBlock}>
          <Text style={[styles.monthLabel, { color: activeColors.icon }]}>This Month</Text>
          {monthItems.slice(0, 2).map((item) => (
            <View key={item.id} style={styles.expenseItem}>
              <View style={styles.expenseLeft}>
                <View style={[styles.expenseIconBox, { backgroundColor: theme === 'light' ? '#E8EAF6' : '#2A253A', borderColor: activeColors.icon }]}> 
                  <Ionicons name={item.icon} size={12} color={activeColors.tint} />
                </View>
                <View style={styles.expenseTextWrap}>
                  <Text style={[styles.expenseTitle, { color: activeColors.text }]}>{item.title}</Text>
                  <Text style={[styles.expenseSubtitle, { color: activeColors.icon }]}>{item.subtitle}</Text>
                </View>
              </View>
              <Text style={[styles.expenseAmount, { color: activeColors.text }]}>{item.amount}</Text>
            </View>
          ))}
        </View>

        <View style={styles.rightAlignedBlock}>
          <Text style={[styles.rightMonthLabel, { color: activeColors.icon }]}>Last Month</Text>
          {monthItems.slice(2, 4).map((item) => (
            <View key={item.id} style={styles.expenseItem}>
              <View style={styles.expenseLeft}>
                <View style={[styles.expenseIconBox, { backgroundColor: theme === 'light' ? '#E8EAF6' : '#2A253A', borderColor: activeColors.icon }]}> 
                  <Ionicons name={item.icon} size={12} color={activeColors.tint} />
                </View>
                <View style={styles.expenseTextWrap}>
                  <Text style={[styles.expenseTitle, { color: activeColors.text }]}>{item.title}</Text>
                  <Text style={[styles.expenseSubtitle, { color: activeColors.icon }]}>{item.subtitle}</Text>
                </View>
              </View>
              <Text style={[styles.expenseAmount, { color: activeColors.text }]}>{item.amount}</Text>
            </View>
          ))}
        </View>

        <View style={styles.monthBlock}>
          <Text style={[styles.monthLabel, { color: activeColors.icon }]}>Last 2 months</Text>
          <View style={styles.expenseItem}>
            <View style={styles.expenseLeft}>
              <View style={[styles.expenseIconBox, { backgroundColor: theme === 'light' ? '#E8EAF6' : '#2A253A', borderColor: activeColors.icon }]}> 
                <Ionicons name="restaurant-outline" size={12} color={activeColors.tint} />
              </View>
              <View style={styles.expenseTextWrap}>
                <Text style={[styles.expenseTitle, { color: activeColors.text }]}>Food and Snacks</Text>
                <Text style={[styles.expenseSubtitle, { color: activeColors.icon }]}>Expenses for food and snacks in a week</Text>
              </View>
            </View>
            <Text style={[styles.expenseAmount, { color: activeColors.text }]}>PHP 930.03</Text>
          </View>
          <View style={styles.expenseItem}>
            <View style={styles.expenseLeft}>
              <View style={[styles.expenseIconBox, { backgroundColor: theme === 'light' ? '#E8EAF6' : '#2A253A', borderColor: activeColors.icon }]}> 
                <Ionicons name="basket-outline" size={12} color={activeColors.tint} />
              </View>
              <View style={styles.expenseTextWrap}>
                <Text style={[styles.expenseTitle, { color: activeColors.text }]}>Groceries</Text>
                <Text style={[styles.expenseSubtitle, { color: activeColors.icon }]}>Expenses for basic household supplies</Text>
              </View>
            </View>
            <Text style={[styles.expenseAmount, { color: activeColors.text }]}>PHP 5,252,656</Text>
          </View>
        </View>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
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
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={[styles.actionButtonText, { color: activeColors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButtonPrimary} onPress={handleSave}>
                <Text style={styles.actionButtonTextPrimary}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
