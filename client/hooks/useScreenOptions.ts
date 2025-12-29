import { Platform } from "react-native";
import { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { isLiquidGlassAvailable } from "expo-glass-effect";

import { useTheme } from "@/hooks/useTheme";

// Неоновые цвета
const NEON = {
  bgDark: '#0A0A0F',
  primary: '#8B5CF6',
};

interface UseScreenOptionsParams {
  transparent?: boolean;
}

export function useScreenOptions({
  transparent = true,
}: UseScreenOptionsParams = {}): NativeStackNavigationOptions {
  const { theme, isDark } = useTheme();

  return {
    headerTitleAlign: "center",
    headerTransparent: transparent,
    headerBlurEffect: isDark ? "dark" : "light",
    headerTintColor: isDark ? '#FFFFFF' : theme.text,
    headerStyle: {
      backgroundColor: Platform.select({
        ios: transparent ? undefined : (isDark ? NEON.bgDark : theme.backgroundRoot),
        android: isDark ? NEON.bgDark : theme.backgroundRoot,
        web: isDark ? NEON.bgDark : theme.backgroundRoot,
      }),
    },
    gestureEnabled: true,
    gestureDirection: "horizontal",
    fullScreenGestureEnabled: isLiquidGlassAvailable() ? false : true,
    contentStyle: {
      backgroundColor: isDark ? NEON.bgDark : theme.backgroundRoot,
    },
  };
}
