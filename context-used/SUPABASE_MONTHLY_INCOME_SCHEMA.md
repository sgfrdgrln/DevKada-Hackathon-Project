# Supabase Monthly Income Table Schema

## SQL Schema

Create the following table in your Supabase PostgreSQL database:

```sql
CREATE TABLE monthly_income (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount REAL NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(user_id)
);

-- Create index for efficient queries
CREATE INDEX monthly_income_user_id_idx ON monthly_income(user_id);
```

## Row Level Security (RLS)

Enable RLS on the table and add the following policy:

```sql
-- Allow users to only access their own monthly income
CREATE POLICY "Users can access their own monthly income" ON monthly_income
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

## Notes

- One row per user (enforced by `UNIQUE(user_id)`)
- `id` is set to `income_{user_id}` format on the client side
- `created_at` and `updated_at` are ISO 8601 timestamps
- `amount` is stored as REAL (floating point) to match SQLite
- User deletion cascades and removes their monthly income record

## Verification

After creating the table, verify in Supabase dashboard:
1. Navigate to SQL Editor
2. Create the table using the SQL above
3. Go to Authentication > Policies
4. Enable RLS on the `monthly_income` table
5. Add the policy above

## Sync Behavior

- **Pull**: Client pulls the most recent monthly income record for the user
- **Push**: Client upserts the monthly income record (creates or updates)
- **Upsert Strategy**: Uses `monthly_income` with `onConflict` handling at the app level
- **Sync Debounce**: 3000ms debounce to prevent excessive sync requests
- **Offline**: Income changes are persisted locally to SQLite and synced when online
