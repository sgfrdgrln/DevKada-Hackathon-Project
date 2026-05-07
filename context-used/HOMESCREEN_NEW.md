Refactor the Home screen analytics section to make the expense dashboard more consistent and meaningful for an expense tracking app.

Changes required:

1. Replace the large hardcoded value:

   * Remove:

     ```tsx
     PHP 2,491.34
     ```
   * Replace it with the dynamically calculated TOTAL EXPENSES from all expenses:

     ```tsx
     expenses.reduce((sum, e) => sum + e.amount, 0)
     ```
   * Format to 2 decimal places.

2. Add a label above the large amount:

   * Text: `Total Expenses`
   * Use existing `sectionLabel` style.
   * Match current theme colors.

3. Replace the first analytics card:

   * Change title from:
     `Monthly income`
   * To:
     `Weekly Spending`

4. Replace the hardcoded monthly income amount:

   * Remove:

     ```tsx
     PHP 14,305.33
     ```
   * Replace with dynamically calculated weekly expenses:

     ```tsx
     thisWeekExpenses.reduce((sum, e) => sum + e.amount, 0)
     ```
   * Format to 2 decimal places.

5. Keep the second card as:

   * `Monthly Spending`
   * Continue using:

     ```tsx
     thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0)
     ```

6. Ensure:

   * No hardcoded analytics values remain.
   * All amounts update automatically when expenses change.
   * Styling and spacing remain visually identical.
   * Works in both dark and light mode.

Goal:

* Main headline = overall/lifetime expenses.
* First card = last 7 days spending.
* Second card = last 30 days spending.
* Create a more realistic finance dashboard experience.
