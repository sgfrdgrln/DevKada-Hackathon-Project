You are building a React Native (Expo) offline-first expense tracker using SQLite for local storage and Supabase for optional cloud sync.

Requirements

The app must work fully offline using SQLite as the primary data source.

Use Supabase only for syncing (not as the main source of truth).

Authentication must use Supabase Anonymous Auth (no login UI).

Each user must have a unique user_id from Supabase.

All records must be tied to user_id.

Sync should be automatic when internet is available.

Tech Stack

React Native (Expo)

SQLite (expo-sqlite)

Supabase JS client

Data Flow

On first app launch:

Automatically sign in using supabase.auth.signInAnonymously()

Store session locally (Supabase handles persistence)

When creating an expense:

Save to SQLite immediately

Mark record as is_synced = 0

Sync process:

Fetch all is_synced = 0 records from SQLite

Push them to Supabase

Mark them as is_synced = 1 after successful upload

On app start (if online):

Fetch latest expenses from Supabase for the current user_id

Merge into SQLite (avoid duplicates using id)

SQLite Schema

Create a local SQLite table named expenses:

id: TEXT PRIMARY KEY (UUID)

user_id: TEXT

amount: REAL

category: TEXT

note: TEXT

created_at: TEXT (ISO string)

updated_at: TEXT (ISO string)

is_synced: INTEGER (0 or 1)

Supabase Table Schema

Table: expenses

Columns:

id: uuid PRIMARY KEY

user_id: uuid (references auth.users.id)

amount: numeric

category: text

note: text

created_at: timestamp

updated_at: timestamp

Supabase RLS नीति (Row Level Security)

Enable RLS and create policy:

Users can only access their own data

SQL:

CREATE POLICY "Users can manage their own expenses"
ON expenses
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

Required Features to Implement

initDatabase() → creates SQLite table

signInAnonymously() → initializes Supabase user

createExpense(expense) → inserts into SQLite

getUnsyncedExpenses() → fetch where is_synced = 0

markAsSynced(id) → update SQLite

syncExpenses():

push unsynced → Supabase

mark synced

pullExpenses():

fetch from Supabase

upsert into SQLite

Additional Constraints

Use UUIDs for IDs (not auto-increment)

Use updated_at for conflict resolution (latest wins)

Do not block UI during sync

Handle offline/online state gracefully

Ensure idempotent sync (no duplicates)

Expected Output

Generate:

SQLite helper module

Supabase client setup

Sync service (push + pull)

Example usage in a React hook or service layer

Code should be clean, modular, and production-ready.