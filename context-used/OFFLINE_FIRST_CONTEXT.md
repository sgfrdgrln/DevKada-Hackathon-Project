You are working on a React Native (Expo) app using:

- expo-sqlite (local database)
- Supabase (remote backend + auth)
- Offline-first architecture

CURRENT PROBLEM:
When users log into different accounts, they see the same data. This is incorrect behavior.

GOAL:
Implement proper separation between:

1. Offline Mode (no user / guest mode)
2. Online Mode (authenticated Supabase user)

CORE REQUIREMENTS:

──────────────────────────────
🔐 1. DATA ISOLATION RULE
──────────────────────────────

Each user must only see their own data.

- Every record MUST belong to a specific user_id
- NEVER mix data between users in SQLite or Supabase
- Always filter queries by user_id when in online mode

──────────────────────────────
📱 2. MODES
──────────────────────────────

The app must support two modes:

A. OFFLINE MODE (Guest)
- No Supabase login required
- Data stored ONLY in SQLite
- user_id is NULL or "local"
- Data is NOT synced to Supabase
- Completely isolated per device

B. ONLINE MODE (Authenticated)
- Requires Supabase login
- user_id is taken from Supabase session
- SQLite is still used locally
- Data is synced to Supabase

──────────────────────────────
🔄 3. SYNC RULES (ONLINE ONLY)
──────────────────────────────

Only sync when:
- User is authenticated
- Internet is available

Sync behavior:
- Push local unsynced data WHERE user_id = currentUserId
- Pull remote data filtered by user_id = currentUserId
- Upsert into SQLite per user

NEVER:
- Pull all expenses from Supabase without filtering user_id
- Mix local guest data with authenticated user data

──────────────────────────────
🧠 4. SQLITE DESIGN RULE
──────────────────────────────

SQLite schema MUST support multi-user isolation:

expenses table includes:
- id
- user_id (nullable for offline mode)
- amount
- category
- note
- created_at
- updated_at
- is_synced

RULE:
- Offline mode → user_id = NULL or "local"
- Online mode → user_id = Supabase user id

──────────────────────────────
🔍 5. QUERY RULES
──────────────────────────────

When fetching data:

- OFFLINE MODE:
  SELECT * FROM expenses WHERE user_id IS NULL OR user_id = 'local'

- ONLINE MODE:
  SELECT * FROM expenses WHERE user_id = currentUserId

NEVER use:
- SELECT * FROM expenses (unfiltered)

──────────────────────────────
⚠️ 6. LOGIN BEHAVIOR FIX
──────────────────────────────

When user logs in:

1. DO NOT reuse existing local guest data
2. DO NOT overwrite all SQLite rows blindly
3. Perform one of these strategies:

OPTION A (Recommended):
- Keep guest data separate (user_id = NULL/local)
- Load only current user data after login

OPTION B:
- Prompt user: "Merge local data into account?"

──────────────────────────────
🧩 7. EXPECTED RESULT

- Guest users see only their local device data
- Logged-in users see only their own Supabase data
- No cross-account data leakage
- Switching accounts resets visible dataset correctly