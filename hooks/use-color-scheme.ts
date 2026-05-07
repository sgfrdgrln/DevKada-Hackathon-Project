import { useContext } from 'react';
import { useColorScheme as nativeUseColorScheme } from 'react-native';
import { ThemeContext } from '@/theme/ThemeContext';

export function useColorScheme() {
  const themeContext = useContext(ThemeContext);
  return themeContext?.theme ?? nativeUseColorScheme();
}
