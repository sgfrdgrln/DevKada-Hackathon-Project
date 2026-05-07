/*
TASK: Refactor the ExpensesScreen UI and logic.

GOAL:
Improve the expenses dashboard into a dynamic, searchable, and filterable expense tracker.

========================================================
UI CHANGES
========================================================

1. Replace the section title:
   FROM: "Expenses for this week"
   TO: "Your current expenses (dynamic)"

2. Remove entirely these sections:
   - "This Month"
   - "Last Month"
   - "Last 2 months"

3. Replace them with ONE unified expenses list that is dynamic.

========================================================
NEW FEATURES TO ADD
========================================================

A. SEARCH FUNCTION
- Add a search icon (Ionicons: "search-outline")
- Place it directly BELOW the total expenses overview section
- When pressed, reveal a TextInput or search bar
- Search should filter expenses by `note`

B. CATEGORY FILTER
Add filter options:
- Food & Snacks
- Groceries
- Bills
- Digital Payment
- Others

C. DATE FILTER
Add filter options:
- Today
- Last Week
- Last Month

D. SORTING OPTIONS
Add sorting controls:
- Highest to Lowest (amount DESC)
- Lowest to Highest (amount ASC)
- Sort by Date Ascending
- Sort by Date Descending

========================================================
DATA BEHAVIOR
========================================================

- All filters (search, category, date, sorting) must work together
- Filtering must be applied on `expenses` state before rendering
- Do NOT mutate original expenses array; use derived filtered list via useMemo if needed

========================================================
UI REQUIREMENTS
========================================================

- Keep design consistent with existing theme system (activeColors)
- Use clean minimal UI (chips or segmented controls allowed for filters)
- Keep FAB (add expense button) unchanged
- Keep modal (add expense) unchanged

========================================================
EXPENSE LIST
========================================================

- Render ONE unified list of expenses
- Each item must remain:
  - icon
  - title (category)
  - subtitle (note)
  - amount

========================================================
BONUS (if possible)
========================================================

- Add empty state when no results after filtering
- Add "clear filters" button
*/