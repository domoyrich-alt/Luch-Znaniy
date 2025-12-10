import { Colors } from "@/constants/theme";
import { useThemeContext } from "@/context/ThemeContext";

export function useTheme() {
  const { isDark } = useThemeContext();
  const theme = Colors[isDark ? "dark" : "light"];

  return {
    theme,
    isDark,
  };
}
