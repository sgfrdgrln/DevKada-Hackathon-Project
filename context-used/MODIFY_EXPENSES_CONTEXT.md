/*
TASK: Refactor ExpensesScreen into a modern, dynamic expense dashboard with proper UX hierarchy and filtering system.

========================================================
CRITICAL UI FIXES
========================================================

1. HEADER POSITIONING (IMPORTANT)
- "Your current expenses (dynamic)" must be the MAIN heading at the TOP of the screen
- It should appear ABOVE:
  - total expense amount
  - donut/overview section
- Do NOT place it below the total

2. TOTAL EXPENSES (DYNAMIC)
- Replace static value "PHP 2,491.34"
- Calculate dynamically from filteredExpenses:
    total = sum(filteredExpenses.amount)

3. REMOVE SEARCH TOGGLE
- Search bar MUST always be visible
- DO NOT use open/close toggle state
- Search input should always be rendered

4. SEARCH FUNCTION
- Search icon is optional (can remain decorative)
- Search input filters by:
  - expense.note only

========================================================
FILTER SYSTEM DESIGN
========================================================

A. CATEGORY FILTER (CHIP GROUP)
- Keep as CHIP GROUP (already correct)
- Options:
  - Food & Snacks
  - Groceries
  - Bills
  - Digital Payment
  - Others

B. DATE FILTER (POPOVER MENU)
- Replace chip group with ICON BUTTON
- Use Ionicons:
  - "calendar-outline"
- On press → show popup menu (Modal or ActionSheet style)
- Options:
  - All
  - Today
  - Last Week
  - Last Month
- This filter controls what appears in:
  - heading context ("Your current expenses")
  - expense list
  - total calculation

C. SORT FILTER (POPOVER MENU)
- Replace chip group with ICON BUTTON
- Use Ionicons:
  - "swap-vertical-outline"
- On press → popup menu
- Options:
  - Date Desc
  - Date Asc
  - Highest to Lowest
  - Lowest to Highest

========================================================
EXPENSE LIST BEHAVIOR
========================================================

- Only render ONE unified list:
  filteredExpenses (already computed)
- Each item must show:
  - category icon
  - category title
  - note subtitle
  - amount

- EMPTY STATE:
  Show when filteredExpenses.length === 0

========================================================
FILTER LOGIC RULES
========================================================

- All filters must combine together:
  search + category + date + sort

- DATE FILTER RULES:
  - Today → only today’s expenses
  - Last Week → last 7 days
  - Last Month → last 30 days

- SEARCH RULE:
  - matches expense.note (case insensitive)

========================================================
DYNAMIC HEADING BEHAVIOR
========================================================

"Your current expenses (dynamic)" should reflect:
- If Date = Today → "Today's expenses"
- If Date = Last Week → "This week's expenses"
- If Date = Last Month → "This month's expenses"
- Else → "Your current expenses"

========================================================
UI REQUIREMENTS
========================================================

- Keep theme support (activeColors)
- Keep FAB unchanged
- Keep modal unchanged
- Keep category chip UI unchanged
- Make date + sort compact (icons only + popup)

========================================================
PERFORMANCE REQUIREMENT
========================================================

- Use useMemo for:
  - filteredExpenses
  - totalExpenses
  - displayItems

========================================================
BONUS UX (IF POSSIBLE)
========================================================

- Show active filter indicator dot on icons
- Add "Clear filters" resets everything
- Animate popup menu lightly (fade/slide)
*/