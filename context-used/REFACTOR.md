Refactor this Expo React Native SQLite module to fix the "no such table: expenses" error.

Requirements:
1. Use `expo-sqlite` correctly with `openDatabaseAsync` (NOT openDatabaseSync).
2. Ensure database initialization is always awaited before any query runs.
3. Create a safe `getDb()` singleton that initializes the database once.
4. Use `execAsync` for schema creation (CREATE TABLE).
5. Ensure all query functions (getAll, insert, update, delete) always call `await getDb()` before executing.
6. Remove any race conditions where queries run before initDatabase().
7. Keep the existing Expense type and sync logic intact.
8. Fix any incorrect or unused variables (like redundant SELECT queries).
9. Ensure functions are safe for React Native app lifecycle (app cold start, background resume).
10. Make the module production-ready and crash-proof for offline-first sync.

Output a fully refactored `sqlite.ts` file.