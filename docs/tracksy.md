# Tracksy Documentation

Tracksy is an offline-first expense tracker built with Expo Router and Supabase. The app stores data locally in SQLite, syncs authenticated user data to Supabase, and supports guest/offline usage when a session is not available.

## Product Summary

Tracksy is designed to help users track expenses quickly and review spending trends without forcing an always-online workflow.

Core capabilities:

- Expense creation, editing, and deletion
- Monthly income tracking
- Receipt capture and total extraction
- Spending insights over multiple time ranges
- AI chatbot assistance for expense-related questions
- Authenticated and offline guest flows

## Architecture Overview

### Routing and App Shell

Expo Router drives the app structure under `app/`.

- `app/_layout.tsx` sets up the root stack, theme provider, toast host, and session routing logic
- `app/(tabs)/_layout.tsx` defines the bottom tab navigator
- Individual route files map directly to screens

### Local Storage

SQLite is the local source of truth for expense and monthly income data.

- Expense records are stored in `expenses`
- Monthly income is stored in `monthly_income`
- Queries and mutations live in `utils/sqlite.ts`

### Remote Sync

Supabase is used for authenticated sync.

- `utils/supabase.ts` creates the client
- `services/syncService.ts` pushes and pulls expense and income data
- `hooks/useAutoSync.ts` and `hooks/useMonthlyIncomeAutoSync.ts` listen for local changes and trigger syncing

### Receipt Extraction

Receipt upload and parsing are handled through the extraction service.

- `services/extractService.ts` posts the receipt image to a backend endpoint
- The home screen can launch the camera or image picker and send the image for parsing

### Insights and Chat

- `services/insightService.ts` builds spending summaries from local expense data
- `app/(tabs)/insights.tsx` renders charts, trend labels, and category summaries
- `app/chatbot.tsx` uses the expense list for finance-aware replies and can also call external AI APIs

## App Flow

1. App boots into `app/_layout.tsx`.
2. Session state and onboarding state are read from AsyncStorage and Supabase.
3. The user is routed to onboarding, auth, guest profile, or the tab stack.
4. Local data is read from SQLite for dashboard, insights, and expense screens.
5. Sync hooks push changes to Supabase when the device is online.

## Screens

### Welcome and Onboarding

- `app/welcome.tsx` introduces the app
- `app/onboarding.tsx` completes the initial setup flow

### Authentication

- `app/auth.tsx` manages sign in and sign up
- Supabase sessions are checked during startup

### Main Tabs

- Home shows expense totals, monthly income, and quick actions
- Expenses manages the expense list and editing flow
- Insights summarizes spending patterns over time
- Profile contains account and sync-related controls

### Supporting Screens

- `app/calculator.tsx` provides a calculator utility
- `app/modal.tsx` is used for modal presentation
- `app/guest-profile.tsx` supports offline guest identity
- `app/chatbot.tsx` handles conversational expense questions

## Runtime Dependencies

Tracksy depends on several native and runtime libraries that must be present in the production build:

- `expo-sqlite`
- `expo-camera`
- `expo-image-picker`
- `react-native-reanimated`
- `react-native-gesture-handler`
- `react-native-safe-area-context`
- `@react-native-async-storage/async-storage`
- `@react-native-community/netinfo`

## Environment Variables

The app expects these public values during build/runtime:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_KEY`
- `EXPO_PUBLIC_GEMINI_API_KEY`
- `EXPO_PUBLIC_GROQ_API_KEY`
- `EXPO_PUBLIC_RECEIPT_EXTRACT_URL`

Recommended practice:

- Keep them available in EAS build secrets or app config
- Avoid relying on undefined values at module import time
- Add fallback handling in network client setup where possible

## Data Lifecycle

### Expense Creation

1. User creates an expense in the UI.
2. The record is stored in SQLite first.
3. If authenticated and online, the expense is pushed to Supabase.
4. A local change event is emitted for background sync.

### Insights

1. Insights screen loads local expenses.
2. Records are grouped into daily, weekly, or monthly buckets.
3. Totals, averages, peaks, and top categories are derived from local data.

### Monthly Income

1. Monthly income is stored locally.
2. If a Supabase session exists, the value is mirrored remotely.
3. Sync hooks keep local and remote values aligned.

## Production Notes

Tracksy is intended to run in both Expo Go and standalone APK builds, but standalone APKs rely on native modules and env vars being correctly bundled.

Important checks for APK builds:

- Verify native config plugins are included in `app.json`
- Ensure `babel.config.js` keeps the Reanimated plugin enabled
- Confirm the app entry loads gesture handler before navigation code
- Make sure API keys and backend URLs are present at build time

## Development Commands

```bash
npm install
npx expo start
npm run lint
```

## Build Commands

```bash
eas build -p android --profile preview
eas build -p android --profile production
```

## Suggested Next Documentation Additions

- API reference for services in `services/`
- Schema reference for `project-schema.sql`
- Sync behavior guide for offline and authenticated flows
- Troubleshooting guide for APK startup issues