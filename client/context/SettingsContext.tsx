import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserSettings, DEFAULT_SETTINGS, BlockedUser } from '@/types/settings';
import { useAuth } from '@/context/AuthContext';

const SETTINGS_KEY_PREFIX = '@app_settings:';
const LEGACY_SETTINGS_KEY = '@app_settings';

function getSettingsKey(userId: number | null | undefined): string {
  return `${SETTINGS_KEY_PREFIX}${userId ?? 'guest'}`;
}

interface SettingsContextType {
  settings: UserSettings;
  isLoading: boolean;
  
  /** Версия профиля - инкрементируется при каждом обновлении для инвалидации кэша */
  profileVersion: number;
  
  // Профиль
  updateProfileSettings: (updates: Partial<UserSettings['profile']>) => Promise<void>;
  
  /** Принудительно инвалидировать кэш профиля (инкрементирует profileVersion) */
  invalidateProfileCache: () => void;
  
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
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [profileVersion, setProfileVersion] = useState(0);

  // Загружаем настройки при старте и при смене пользователя
  useEffect(() => {
    loadSettingsForUser(user?.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const loadSettingsForUser = async (userId?: number | null) => {
    try {
      setIsLoading(true);
      const key = getSettingsKey(userId);
      let savedSettings = await AsyncStorage.getItem(key);

      // Миграция: раньше настройки были общими для всех аккаунтов.
      // Если для пользователя ещё нет своих настроек, переносим legacy в per-user ключ.
      if ((!savedSettings || savedSettings.length === 0) && userId) {
        const legacy = await AsyncStorage.getItem(LEGACY_SETTINGS_KEY);
        if (legacy && legacy.length > 0) {
          await AsyncStorage.setItem(key, legacy);
          await AsyncStorage.removeItem(LEGACY_SETTINGS_KEY);
          savedSettings = legacy;
        }
      }

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
      } else {
        // Нет сохранённых настроек для этого пользователя
        setSettings(DEFAULT_SETTINGS);
      }
    } catch (error) {
      console.error('Ошибка загрузки настроек:', error);
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (newSettings: UserSettings) => {
    try {
      await AsyncStorage.setItem(getSettingsKey(user?.id), JSON.stringify(newSettings));
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
    // Инкрементируем версию профиля для инвалидации кэша во всех компонентах
    setProfileVersion(v => v + 1);
  };

  const invalidateProfileCache = () => {
    setProfileVersion(v => v + 1);
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
    await AsyncStorage.removeItem(getSettingsKey(user?.id));
    setSettings(DEFAULT_SETTINGS);
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        isLoading,
        profileVersion,
        updateProfileSettings,
        invalidateProfileCache,
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
