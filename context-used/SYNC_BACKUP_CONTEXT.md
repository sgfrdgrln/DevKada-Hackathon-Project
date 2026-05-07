You are working on a React Native (Expo) expense tracking app using:

Expo SQLite (offline-first local database)
Supabase (cloud backend)
Supabase Auth (email/password or session-based login)

GOAL:
Refactor the architecture so the app is:

Fully offline-first
Uses authenticated user accounts (NO anonymous auth)
Uses manual sync only (NO auto-sync / no background sync triggers)
Prevents API rate limiting issues

CORE DESIGN RULES:

OFFLINE-FIRST PRINCIPLE (CRITICAL)
SQLite is the single source of truth on device
All create/update/delete operations MUST happen in SQLite first
Cloud sync is secondary only
AUTHENTICATION-BASED IDENTITY
Replace all anonymous user logic
Use:
supabase.auth.getUser().id
All expenses must include:
user_id = authenticated user id
SYNC STRATEGY (MANUAL ONLY)
Remove all auto-sync triggers:
❌ no setTimeout sync calls
❌ no onFocus sync
❌ no background sync
❌ no automatic push on insert/update
Sync must ONLY happen when user presses:
"Sync / Backup" button
SYNC FLOW (ON BUTTON PRESS ONLY)

When user presses Sync:

STEP 1: INIT

Ensure database is initialized

STEP 2: PUSH LOCAL → CLOUD

Get unsynced SQLite rows
Upsert into Supabase table expenses
Match using id conflict resolution

STEP 3: PULL CLOUD → LOCAL

Fetch expenses where user_id = current user
Upsert into SQLite
Resolve conflicts using updated_at

STEP 4: MARK SYNCED

Update is_synced = 1 locally after successful push
ERROR HANDLING
If Supabase table missing (PGRST205):
log warning only
do not crash app
If offline:
show "No internet connection"
skip sync safely
PERFORMANCE REQUIREMENT
Avoid frequent API calls
Sync only when explicitly triggered by user
Prevent rate limiting by design (NO background sync logic)
UI REQUIREMENT (PROFILE SCREEN)
Replace logout with:
"Sync / Backup" button

Button states:

idle → "Sync / Backup"
loading → spinner
success → show last synced timestamp
failure → show error alert
DATA SAFETY RULES
SQLite is always safe even without internet
Supabase is just backup storage
Never delete local data during sync
Never overwrite local unless conflict resolution is clear

EXPECTED OUTCOME:

App works fully offline
User must manually sync to cloud
No rate limit issues from background syncing
Clean separation between local storage and cloud backup
Stable login-based multi-device system

IMPORTANT:
Do NOT implement any automatic sync behavior.
All cloud operations must be user-triggered only.