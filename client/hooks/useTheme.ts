import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/theme';
import { useThemeContext } from '@/context/ThemeContext';

export function useTheme() {
  const systemColorScheme = useColorScheme();
  const { themeMode, setThemeMode, isDark: contextIsDark } = useThemeContext();
  
  // Используем тему из контекста вместо только системной
  const isDark = contextIsDark;
  const theme = isDark ? Colors.dark : Colors.light;

  const toggleTheme = () => {
    // Переключение между light и dark
    setThemeMode(isDark ? 'light' : 'dark');
  };

  const setTheme = (mode: 'light' | 'dark' | 'system') => {
    setThemeMode(mode);
  };

  return {
    theme,
    isDark,
    toggleTheme,
    setTheme,
    themeMode
  };
}