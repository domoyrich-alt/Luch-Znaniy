import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserSettings, DEFAULT_SETTINGS, BlockedUser } from '@/types/settings';

const SETTINGS_KEY = '@app_settings';

interface SettingsContextType {
  settings: UserSettings;
  isLoading: boolean;
  
  // Профиль
  updateProfileSettings: (updates: Partial<UserSettings['profile']>) => Promise<void>;
  
  // Приватность
  updatePrivacySettings: (updates: Partial<UserSettings['privacy']>) => Promise<void>;
  
  // Уведомления
  updateNotificationSettings: (updates: Partial<UserSettings['notifications']>) => Promise<void>;
  
  // Внешний вид
  updateAppearanceSettings: (updates: Partial<UserSettings['appearance']>) => Promise<void>;
  
  // Общие
  updateGeneralSettings: (updates: Partial<UserSettings['general']>) => Promise<void>;
  
  // Чёрный список
  blockUser: (user: Omit<BlockedUser, 'blockedAt'>) => Promise<void>;
  unblockUser: (userId: string) => Promise<void>;
  isUserBlocked: (userId: string) => boolean;
  
  // Сброс
  resetSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // Загрузка настроек при старте
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem(SETTINGS_KEY);

      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings({ 
          ...DEFAULT_SETTINGS, 
          ...parsed,
          profile: { ...DEFAULT_SETTINGS.profile, ...parsed.profile },
          privacy: { ...DEFAULT_SETTINGS.privacy, ...parsed.privacy },
          notifications: { ...DEFAULT_SETTINGS.notifications, ...parsed.notifications },
          appearance: { ...DEFAULT_SETTINGS.appearance, ...parsed.appearance },
          general: { ...DEFAULT_SETTINGS.general, ...parsed.general },
          blockedUsers: parsed.blockedUsers || [],
        });
      }
    } catch (error) {
      console.error('Ошибка загрузки настроек:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (newSettings: UserSettings) => {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Ошибка сохранения настроек:', error);
      throw error;
    }
  };

  const updateProfileSettings = async (updates: Partial<UserSettings['profile']>) => {
    const newSettings = {
      ...settings,
      profile: { ...settings.profile, ...updates },
    };
    await saveSettings(newSettings);
  };

  const updatePrivacySettings = async (updates: Partial<UserSettings['privacy']>) => {
    const newSettings = {
      ...settings,
      privacy: { ...settings.privacy, ...updates },
    };
    await saveSettings(newSettings);
  };

  const updateNotificationSettings = async (updates: Partial<UserSettings['notifications']>) => {
    const newSettings = {
      ...settings,
      notifications: { ...settings.notifications, ...updates },
    };
    await saveSettings(newSettings);
  };

  const updateAppearanceSettings = async (updates: Partial<UserSettings['appearance']>) => {
    const newSettings = {
      ...settings,
      appearance: { ...settings.appearance, ...updates },
    };
    await saveSettings(newSettings);
  };

  const updateGeneralSettings = async (updates: Partial<UserSettings['general']>) => {
    const newSettings = {
      ...settings,
      general: { ...settings.general, ...updates },
    };
    await saveSettings(newSettings);
  };

  const blockUser = async (user: Omit<BlockedUser, 'blockedAt'>) => {
    const newBlockedUser: BlockedUser = {
      ...user,
      blockedAt: Date.now(),
    };
    const newSettings = {
      ...settings,
      blockedUsers: [...settings.blockedUsers, newBlockedUser],
    };
    await saveSettings(newSettings);
  };

  const unblockUser = async (userId: string) => {
    const newSettings = {
      ...settings,
      blockedUsers: settings.blockedUsers.filter(u => u.id !== userId),
    };
    await saveSettings(newSettings);
  };

  const isUserBlocked = (userId: string) => {
    return settings.blockedUsers.some(u => u.id === userId);
  };

  const resetSettings = async () => {
    await AsyncStorage.removeItem(SETTINGS_KEY);
    setSettings(DEFAULT_SETTINGS);
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        isLoading,
        updateProfileSettings,
        updatePrivacySettings,
        updateNotificationSettings,
        updateAppearanceSettings,
        updateGeneralSettings,
        blockUser,
        unblockUser,
        isUserBlocked,
        resetSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings должен использоваться внутри SettingsProvider');
  }
  return context;
}
