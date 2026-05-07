import { DarkTheme as NavigationDarkTheme, DefaultTheme as NavigationDefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useColorScheme as nativeUseColorScheme } from 'react-native';
import { createContext, useContext, useMemo, useState, type PropsWithChildren } from 'react';

type ThemeMode = 'light' | 'dark';

type ThemeContextType = {
  theme: ThemeMode;
  setTheme: (nextTheme: ThemeMode) => void;
  toggleTheme: () => void;
};

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function AppThemeProvider({ children }: PropsWithChildren<{}>) {
  const systemTheme = (nativeUseColorScheme() ?? 'light') as ThemeMode;
  const [theme, setTheme] = useState<ThemeMode>(systemTheme);

  const value = useMemo(
    () => ({
      theme,
      setTheme: (nextTheme: ThemeMode) => setTheme(nextTheme),
      toggleTheme: () => setTheme((current) => (current === 'light' ? 'dark' : 'light')),
    }),
    [theme]
  );

  return (
    <ThemeContext.Provider value={value}>
      <NavigationThemeProvider value={theme === 'dark' ? NavigationDarkTheme : NavigationDefaultTheme}>
        {children}
      </NavigationThemeProvider>
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within an AppThemeProvider');
  }
  return context;
}
