You are working on a React Native Expo app using:

- expo-router
- React Native
- TypeScript
- Supabase Auth
- expo-sqlite
- Offline-first architecture

CURRENT APP FLOW:
The app has two onboarding options:

1. Continue as Guest
2. Continue with Supabase Account

The app already supports offline-first SQLite storage.

TASK:
Improve the authentication UI and onboarding flow without breaking guest mode.

──────────────────────────────
🎨 AUTH SCREEN UI
──────────────────────────────

1. Center the authentication form vertically and horizontally
   - Use SafeAreaView
   - Use KeyboardAvoidingView
   - Clean spacing
   - Modern mobile UI
   - Responsive layout

2. Create a clean auth card/container
   - Rounded corners
   - Proper padding
   - Modern inputs/buttons
   - Mobile-first styling

3. Keep the onboarding options:
   - "Continue as Guest"
   - "Sign In / Register"

──────────────────────────────
👤 REGISTER FLOW
──────────────────────────────

On the REGISTER tab, require:

- Username
- Email
- Password

IMPORTANT RULES:
- Username is ONLY the display name
- Username does NOT need to be unique
- ONLY email must be unique

Use Supabase signup like this:

await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      display_name: username,
    },
  },
});

Store username inside:
- user_metadata.display_name

DO NOT:
- Validate username uniqueness
- Use username for login
- Create custom auth tables

──────────────────────────────
🔑 LOGIN FLOW
──────────────────────────────

Login should ONLY use:
- Email
- Password

Use:
supabase.auth.signInWithPassword()

──────────────────────────────
👥 GUEST MODE RULES
──────────────────────────────

Guest mode must still work.

When user taps:
"Continue as Guest"

- Do NOT require authentication
- Do NOT create Supabase account
- Use SQLite only
- Store guest records locally
- user_id should be NULL or "local"

Guest users should NOT sync data.

──────────────────────────────
🔄 ONLINE MODE RULES
──────────────────────────────

Authenticated users:
- Use Supabase auth
- Sync SQLite data with Supabase
- Use authenticated user.id as user_id

IMPORTANT:
- Never mix guest data with authenticated user data
- Queries must always filter by user_id

──────────────────────────────
📱 UX REQUIREMENTS
──────────────────────────────

- Show loading states
- Disable buttons while loading
- Show friendly validation errors
- Password minimum length = 6
- Proper keyboard handling
- Smooth tab switching between Login/Register

──────────────────────────────
⚠️ IMPORTANT
──────────────────────────────

Keep the architecture simple.

The app is:
- Offline-first
- SQLite-powered
- Supabase is only used for:
  - authentication
  - optional cloud sync