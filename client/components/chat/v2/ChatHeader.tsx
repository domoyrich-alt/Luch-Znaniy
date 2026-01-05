/**
 * CHAT HEADER WIDGET (v2)
 * Верхняя панель чата с аватаром, статусом и кнопками
 * 
 * Структура:
 * [Назад] [Аватар] [Имя + Статус] [----] [Поиск] [Звонок] [Видео] [Меню]
 */

import React, { useRef, useEffect, memo } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Image,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/ThemedText';
import { 
  TelegramDarkColors as colors, 
  TelegramSizes as sizes,
  TelegramTypography as typography,
  TelegramAnimations as animations,
} from '@/constants/telegramDarkTheme';

// ======================
// ТИПЫ
// ======================
interface ChatHeaderProps {
  chatName: string;
  avatar?: string;
  isOnline?: boolean;
  lastSeen?: Date | string;
  isTyping?: boolean;
  membersCount?: number;
  onBackPress?: () => void;
  onAvatarPress?: () => void;
  onCallPress?: () => void;
  onVideoCallPress?: () => void;
  onSearchPress?: () => void;
  onMenuPress?: () => void;
  showBackButton?: boolean;
}

// ======================
// HEADER BUTTON
// ======================
const HeaderButton = memo(function HeaderButton({
  icon,
  iconFamily = 'ionicons',
  onPress,
  size = sizes.iconLarge,
}: {
  icon: string;
  iconFamily?: 'ionicons' | 'feather' | 'material';
  onPress?: () => void;
  size?: number;
}) {
  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.();
  };

  const IconComponent = iconFamily === 'feather' 
    ? Feather 
    : iconFamily === 'material' 
      ? MaterialIcons 
      : Ionicons;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.iconButton,
        pressed && { opacity: 0.7 },
      ]}
      onPress={handlePress}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <IconComponent name={icon as any} size={size} color="#FFFFFF" />
    </Pressable>
  );
});

// ======================
// CHAT HEADER
// ======================
export const ChatHeader = memo(function ChatHeader({
  chatName,
  avatar,
  isOnline = false,
  lastSeen,
  isTyping = false,
  membersCount,
  onBackPress,
  onAvatarPress,
  onCallPress,
  onVideoCallPress,
  onSearchPress,
  onMenuPress,
  showBackButton = true,
}: ChatHeaderProps) {
  // Анимация для "печатает..."
  const typingAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    if (isTyping) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(typingAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(typingAnim, {
            toValue: 0.5,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      typingAnim.stopAnimation();
      typingAnim.setValue(1);
    }
  }, [isTyping]);

  // Форматирование времени последнего визита
  const formatLastSeen = (time?: Date | string): string => {
    if (!time) return '';
    const date = typeof time === 'string' ? new Date(time) : time;
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'только что';
    if (minutes < 60) return `был(а) ${minutes} мин. назад`;
    if (hours < 24) return `был(а) ${hours} ч. назад`;
    if (days < 7) return `был(а) ${days} д. назад`;
    
    return `был(а) ${date.toLocaleDateString('ru', { day: 'numeric', month: 'short' })}`;
  };

  // Получение текста статуса
  const getStatusText = (): string => {
    if (isTyping) return 'печатает...';
    if (membersCount) return `${membersCount} участников`;
    if (isOnline) return 'в сети';
    if (lastSeen) return formatLastSeen(lastSeen);
    return '';
  };

  const statusText = getStatusText();
  const statusColor = isTyping ? colors.primary : isOnline ? colors.online : colors.textSecondary;

  const handleAvatarPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onAvatarPress?.();
  };

  return (
    <View style={styles.container}>
      {/* ЛЕВАЯ СЕКЦИЯ */}
      <View style={styles.leftSection}>
        {/* Кнопка назад */}
        {showBackButton && (
          <HeaderButton
            icon="chevron-back"
            onPress={onBackPress}
            size={28}
          />
        )}

        {/* Аватар */}
        <Pressable 
          style={styles.avatarContainer}
          onPress={handleAvatarPress}
        >
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <ThemedText style={styles.avatarText}>
                {chatName.charAt(0).toUpperCase()}
              </ThemedText>
            </View>
          )}
          
          {/* Онлайн индикатор */}
          {isOnline && !membersCount && (
            <View style={styles.onlineIndicator} />
          )}
        </Pressable>

        {/* Название и статус */}
        <Pressable 
          style={styles.titleContainer}
          onPress={handleAvatarPress}
        >
          <ThemedText 
            style={styles.title} 
            numberOfLines={1}
          >
            {chatName}
          </ThemedText>
          
          {statusText ? (
            <Animated.View style={{ opacity: isTyping ? typingAnim : 1 }}>
              <ThemedText 
                style={[styles.status, { color: statusColor }]}
                numberOfLines={1}
              >
                {statusText}
              </ThemedText>
            </Animated.View>
          ) : null}
        </Pressable>
      </View>

      {/* ПРАВАЯ СЕКЦИЯ */}
      <View style={styles.rightSection}>
        {/* Звонок */}
        {onCallPress && (
          <HeaderButton
            icon="call-outline"
            onPress={onCallPress}
          />
        )}

        {/* Видео звонок */}
        {onVideoCallPress && (
          <HeaderButton
            icon="videocam-outline"
            onPress={onVideoCallPress}
          />
        )}

        {/* Поиск */}
        {onSearchPress && (
          <HeaderButton
            icon="search"
            iconFamily="feather"
            size={sizes.iconMedium}
            onPress={onSearchPress}
          />
        )}

        {/* Меню */}
        {onMenuPress && (
          <HeaderButton
            icon="ellipsis-vertical"
            onPress={onMenuPress}
          />
        )}
      </View>
    </View>
  );
});

// ======================
// СТИЛИ (Premium Glassmorphism Design)
// ======================
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: sizes.headerHeight,
    backgroundColor: colors.headerBackground || 'rgba(13, 27, 42, 0.92)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
    paddingHorizontal: sizes.paddingM,
    // Premium blur effect via native backdrop
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  // Левая секция
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  // Аватар - premium styling
  avatarContainer: {
    position: 'relative',
    marginRight: sizes.paddingM,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  avatarText: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: colors.online,
    borderWidth: 2.5,
    borderColor: colors.background,
  },
  
  // Название и статус - premium typography
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 17,
    letterSpacing: -0.3,
  },
  status: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
    fontSize: 13,
    letterSpacing: 0,
  },
  
  // Правая секция - consistent icon spacing
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  
  // Кнопки - 2px stroke weight icons
  iconButton: {
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 21,
  },
});

export default ChatHeader;
