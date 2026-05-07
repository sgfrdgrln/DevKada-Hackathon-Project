# Tracksy

Tracksy is an Expo SDK 54 expense tracker built with Expo Router, Supabase, SQLite, and React Native. It supports offline-first expense capture, synced user sessions, receipt scanning, monthly income tracking, and an insights dashboard for spending analysis.

## What Tracksy Does

Tracksy helps users:

- Record expenses locally and sync them when online
- Track monthly income
- Scan receipt images and extract totals
- View spending insights by day, week, and month
- Chat with a finance assistant about expense totals and budgets
- Use either authenticated Supabase sessions or offline guest mode

## Stack

- Expo SDK 54
- Expo Router
- React Native 0.81
- Supabase Auth and database sync
- Expo SQLite for local persistence
- AsyncStorage for lightweight local settings
- NetInfo for online/offline detection
- Expo Camera and Image Picker for receipt capture
- React Native Reanimated and Gesture Handler for navigation and UI interactions

## Project Structure

- `app/` - routes and screens managed by Expo Router
- `components/` - shared UI pieces
- `hooks/` - reusable app hooks such as auto-sync and theme helpers
- `services/` - data and sync logic for expenses, insights, receipts, and monthly income
- `utils/` - SQLite, Supabase, and emitter helpers
- `theme/` - global theme context
- `constants/` - theme values and shared constants

## Main Screens

- `app/welcome.tsx` - landing screen
- `app/onboarding.tsx` - first-run onboarding
- `app/auth.tsx` - authentication flow
- `app/guest-profile.tsx` - offline guest setup
- `app/(tabs)/index.tsx` - home dashboard and quick actions
- `app/(tabs)/expenses.tsx` - expense management
- `app/(tabs)/insights.tsx` - spending analytics
- `app/(tabs)/profile.tsx` - account and sync controls
- `app/chatbot.tsx` - finance chatbot
- `app/calculator.tsx` - calculator utility

## Setup

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app locally

   ```bash
   npx expo start
   ```

3. Run lint checks

   ```bash
   npm run lint
   ```

## Environment Variables

Tracksy relies on Expo public environment variables for runtime services.

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_KEY`
- `EXPO_PUBLIC_GEMINI_API_KEY`
- `EXPO_PUBLIC_GROQ_API_KEY`
- `EXPO_PUBLIC_RECEIPT_EXTRACT_URL`

These must be available in the build environment for standalone APKs.

## Data Flow

1. Expenses are written to SQLite first.
2. If the user is authenticated and online, data is synced to Supabase.
3. Auto-sync hooks listen for local change events and push updates in the background.
4. Insights and chatbot screens read from the local expense store.

## Android Build Notes

- The app uses Expo Router as the entry system.
- Native modules include SQLite, Camera, Image Picker, Reanimated, Gesture Handler, AsyncStorage, and NetInfo.
- Production APKs should be built with the same native module set that the app imports at runtime.

## Documentation

For a fuller project overview, see [docs/tracksy.md](docs/tracksy.md).

## Useful Commands

```bash
npm run android
npm run ios
npm run web
npm run reset-project
```
