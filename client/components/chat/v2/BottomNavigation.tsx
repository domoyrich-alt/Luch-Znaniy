/**
 * BOTTOM NAVIGATION (v2)
 * Нижняя навигация с 5 вкладками
 * 
 * Вкладки: Главная | Действия | Чаты | Кафетерий | Профиль
 */

import React, { memo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/ThemedText';
import { 
  TelegramDarkColors as colors, 
  TelegramSizes as sizes,
  TelegramTypography as typography,
} from '@/constants/telegramDarkTheme';

// ======================
// ТИПЫ
// ======================
export type TabId = 'home' | 'actions' | 'chats' | 'cafeteria' | 'profile';

interface TabConfig {
  id: TabId;
  label: string;
  icon: string;
  iconActive: string;
  iconFamily: 'ionicons' | 'feather' | 'material';
}

interface BottomNavigationProps {
  activeTab: TabId;
  onTabPress: (tabId: TabId) => void;
  unreadChats?: number;
  bottomInset?: number;
}

// ======================
// КОНФИГУРАЦИЯ ВКЛАДОК
// ======================
const TABS: TabConfig[] = [
  { 
    id: 'home', 
    label: 'Главная', 
    icon: 'home-outline', 
    iconActive: 'home',
    iconFamily: 'ionicons',
  },
  { 
    id: 'actions', 
    label: 'Действия', 
    icon: 'flash-outline', 
    iconActive: 'flash',
    iconFamily: 'ionicons',
  },
  { 
    id: 'chats', 
    label: 'Чаты', 
    icon: 'chatbubble-outline', 
    iconActive: 'chatbubble',
    iconFamily: 'ionicons',
  },
  { 
    id: 'cafeteria', 
    label: 'Кафетерий', 
    icon: 'coffee-outline', 
    iconActive: 'coffee',
    iconFamily: 'material',
  },
  { 
    id: 'profile', 
    label: 'Профиль', 
    icon: 'person-outline', 
    iconActive: 'person',
    iconFamily: 'ionicons',
  },
];

// ======================
// TAB BUTTON
// ======================
const TabButton = memo(function TabButton({
  tab,
  isActive,
  badge,
  onPress,
}: {
  tab: TabConfig;
  isActive: boolean;
  badge?: number;
  onPress: () => void;
}) {
  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  const iconColor = isActive ? colors.primary : colors.textSecondary;
  const iconName = isActive ? tab.iconActive : tab.icon;

  const IconComponent = tab.iconFamily === 'feather' 
    ? Feather 
    : tab.iconFamily === 'material'
      ? MaterialCommunityIcons
      : Ionicons;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.tabButton,
        pressed && { opacity: 0.7 },
      ]}
      onPress={handlePress}
    >
      <View style={styles.iconContainer}>
        <IconComponent 
          name={iconName as any} 
          size={24} 
          color={iconColor} 
        />
        
        {/* Badge */}
        {badge && badge > 0 && (
          <View style={styles.badge}>
            <ThemedText style={styles.badgeText}>
              {badge > 99 ? '99+' : badge}
            </ThemedText>
          </View>
        )}
      </View>
      
      <ThemedText 
        style={[
          styles.tabLabel,
          { color: iconColor },
        ]}
      >
        {tab.label}
      </ThemedText>
    </Pressable>
  );
});

// ======================
// BOTTOM NAVIGATION
// ======================
export const BottomNavigation = memo(function BottomNavigation({
  activeTab,
  onTabPress,
  unreadChats = 0,
  bottomInset = 0,
}: BottomNavigationProps) {
  const handleTabPress = useCallback((tabId: TabId) => {
    onTabPress(tabId);
  }, [onTabPress]);

  return (
    <View style={[
      styles.container, 
      { paddingBottom: Math.max(bottomInset, 8) }
    ]}>
      {TABS.map(tab => (
        <TabButton
          key={tab.id}
          tab={tab}
          isActive={activeTab === tab.id}
          badge={tab.id === 'chats' ? unreadChats : undefined}
          onPress={() => handleTabPress(tab.id)}
        />
      ))}
    </View>
  );
});

// ======================
// СТИЛИ
// ======================
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundSecondary,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: sizes.paddingS,
  },
  
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: sizes.paddingXS,
  },
  
  iconContainer: {
    position: 'relative',
    marginBottom: 2,
  },
  
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: colors.primary,
    borderRadius: sizes.radiusFull,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: '700',
  },
  
  tabLabel: {
    ...typography.caption,
    textAlign: 'center',
  },
});

export default BottomNavigation;
