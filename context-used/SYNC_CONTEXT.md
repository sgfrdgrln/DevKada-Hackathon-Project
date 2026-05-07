Refactor the app syncing system to support true automatic cloud sync when the user is authenticated with Supabase Auth.

Requirements:

* If the user is logged in using Supabase Auth, enable ONLINE MODE automatically.

* In ONLINE MODE:

  * Expenses should automatically sync with Supabase in the background.
  * Do NOT require any manual sync button.
  * Every create, update, or delete operation should:

    1. Save locally first (offline-first approach).
    2. Queue sync if offline.
    3. Automatically push to Supabase once internet connection returns.
  * Fetch latest cloud data on:

    * app startup
    * login
    * reconnecting to internet
    * app returning to foreground
  * Avoid duplicate uploads using:

    * `synced_at`
    * `updated_at`
    * or `is_synced` fields.
  * Resolve conflicts using latest `updated_at`.

* If the user chooses “Continue as Guest”:

  * Enable OFFLINE MODE.
  * Store everything locally only using SQLite.
  * No cloud sync.
  * No Supabase requests.
  * Guest data must remain isolated from authenticated user data.

Database expectations:

* Each expense should include:

  * `id`
  * `user_id`
  * `created_at`
  * `updated_at`
  * `is_synced`
  * optional `deleted_at` for soft deletes

Implementation goals:

* Create a reusable sync service/hook.
* Prevent multiple sync requests running simultaneously.
* Debounce or batch sync operations to avoid rate limits.
* Sync silently in background without blocking UI.
* Add proper loading/error handling.
* Keep analytics working offline and online.

UX requirements:

* Remove manual sync UI entirely for authenticated users.
* Show a small sync status indicator:

  * “Synced”
  * “Syncing…”
  * “Offline”
* Authentication screen should:

  * Center the form vertically.
  * Register tab should ask for:

    * display name
    * email
    * password
  * Only email must be unique.

Technical notes:

* Use Supabase session persistence.
* Detect connectivity changes.
* Use offline-first architecture.
* Reuse existing SQLite local database.
* Sync should feel seamless like modern apps (Notion, Spotify, etc.).
* Minimize unnecessary network requests.
