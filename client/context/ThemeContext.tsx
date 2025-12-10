import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useColorScheme as useSystemColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

type ThemeMode = "light" | "dark" | "system";

interface ThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDark: boolean;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "@luch_znaniy_theme";
const NOTIFICATIONS_STORAGE_KEY = "@luch_znaniy_notifications";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useSystemColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>("system");
  const [notificationsEnabled, setNotificationsEnabledState] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme && (savedTheme === "light" || savedTheme === "dark" || savedTheme === "system")) {
        setThemeModeState(savedTheme as ThemeMode);
      }
      const savedNotifications = await AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (savedNotifications !== null) {
        setNotificationsEnabledState(savedNotifications === "true");
      }
    } catch (error) {
      console.log("Error loading theme settings:", error);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.log("Error saving theme:", error);
    }
  };

  const setNotificationsEnabled = async (enabled: boolean) => {
    setNotificationsEnabledState(enabled);
    try {
      await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, String(enabled));
    } catch (error) {
      console.log("Error saving notifications setting:", error);
    }
  };

  const isDark = themeMode === "system" 
    ? systemColorScheme === "dark" 
    : themeMode === "dark";

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        setThemeMode,
        isDark,
        notificationsEnabled,
        setNotificationsEnabled,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeContext must be used within ThemeProvider");
  }
  return context;
}
