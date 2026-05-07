You are a senior React Native (Expo SDK 54) debugging assistant.

My production Android APK builds successfully using EAS, but it crashes immediately on launch after installation.

Your task is to analyze this codebase and find ALL possible reasons for a runtime crash in a standalone APK (not Expo Go).

Focus ONLY on production runtime issues.

## PRIORITY AREAS TO CHECK:

### 1. App entry / startup crash
- Check `App.tsx`, `index.js`, or `expo-router/_layout.tsx`
- Look for:
  - Unhandled exceptions during import
  - Async code running at top-level
  - Missing providers causing crash
  - Hooks used incorrectly outside components

### 2. Environment variables
- Check all usage of:
  - process.env.EXPO_PUBLIC_*
- Identify any variables that may be undefined in production APK
- Flag missing fallback handling

### 3. Native modules crash risk
- expo-sqlite usage
- react-native-reanimated usage
- expo-camera / image-picker usage
- check if any are initialized before app mount

### 4. Reanimated / gesture handler setup
- Ensure react-native-reanimated is properly configured
- Check Babel config requirement:
  - react-native-reanimated/plugin must be included
- Look for incorrect import order:
  - gesture-handler must be imported first if used

### 5. Expo Router issues
- Check `_layout.tsx` for:
  - missing NavigationContainer equivalents
  - invalid conditional rendering
  - async logic in layout

### 6. AsyncStorage / Supabase initialization
- Check if Supabase client is created safely
- Ensure no blocking async calls during app bootstrap

### 7. Silent crash patterns
- console.log statements in production-safe areas
- try/catch missing in startup logic
- invalid JSON parsing or null access

## OUTPUT FORMAT:

For each issue found:
- File path
- Line / component
- Why it crashes in APK (not Expo Go)
- Suggested fix

Then provide:
- "Most likely root cause"
- "Top 3 fixes in priority order"

Be strict and assume production APK environment only (not development).