/**
 * CHAT LIST WIDGET (v2)
 * Левая панель - список чатов с правильным свайпом
 * 
 * Архитектура:
 * - SwipeableChatItem: Элемент с горизонтальным свайпом
 * - ChatListWidget: Контейнер со списком
 * 
 * Исправления:
 * - Гистерезис для определения направления жеста
 * - Блокировка вертикального скролла при свайпе
 * - Правильные анимации и haptic feedback
 */

import React, { useRef, useCallback, useState, memo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  Animated,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
  Platform,
  Image,
  RefreshControl,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/ThemedText';
import { GradientAvatarPlaceholder } from '@/components/GradientAvatarPlaceholder';
import { 
  TelegramDarkColors as colors, 
  TelegramSizes as sizes,
  TelegramAnimations as animations,
  TelegramTypography as typography,
} from '@/constants/telegramDarkTheme';
import { getApiUrl } from '@/lib/query-client';
import { formatLastSeen, formatMessageTime } from '@/utils/chatUtils';

// Хелпер для преобразования относительных URL в абсолютные
const resolveAvatarUrl = (url?: string | null): string | null => {
  if (!url) return null;
  const trimmed = String(url).trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  try {
    return new URL(trimmed, getApiUrl()).toString();
  } catch {
    return trimmed;
  }
};

// ======================
// ТИПЫ
// ======================
export interface Chat {
  id: number;
  name: string;
  avatar?: string;
  lastMessage?: string;
  lastMessageTime?: string | Date;
  unreadCount?: number;
  isOnline?: boolean;
  isPinned?: boolean;
  isMuted?: boolean;
  isBlocked?: boolean;
  status?: string;
  lastMessageSenderId?: number;
  isLastMessageRead?: boolean;
  lastSeenAt?: string | number | Date | null;
  /** ID собеседника для открытия чата */
  otherUserId?: number;
}

interface SwipeableChatItemProps {
  chat: Chat;
  onPress: () => void;
  onDelete?: () => void;
  onPin?: () => void;
  onMute?: () => void;
  onSwipeStart?: () => void;
  onSwipeEnd?: () => void;
}

interface ChatListWidgetProps {
  chats: Chat[];
  onChatPress: (chat: Chat) => void;
  onDeleteChat?: (chatId: number) => void;
  onPinChat?: (chatId: number) => void;
  onMuteChat?: (chatId: number) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  ListHeaderComponent?: React.ReactElement;
}

// ======================
// SWIPEABLE CHAT ITEM
// ======================
const SwipeableChatItem = memo(function SwipeableChatItem({
  chat,
  onPress,
  onDelete,
  onPin,
  onMute,
  onSwipeStart,
  onSwipeEnd,
}: SwipeableChatItemProps) {
  // Анимации
  const translateX = useRef(new Animated.Value(0)).current;
  const leftOpacity = useRef(new Animated.Value(0)).current;
  const rightOpacity = useRef(new Animated.Value(0)).current;
  const leftScale = useRef(new Animated.Value(0.8)).current;
  const rightScale = useRef(new Animated.Value(0.8)).current;
  
  // Состояние свайпа
  const hasTriggeredHaptic = useRef(false);
  const isSwiping = useRef(false);
  const isDirectionLocked = useRef(false);

  // Эластичное сопротивление
  const applyElasticResistance = (offset: number): number => {
    if (Math.abs(offset) <= animations.maxSwipeOffset) {
      return offset;
    }
    const overflow = Math.abs(offset) - animations.maxSwipeOffset;
    const resistance = animations.maxSwipeOffset + (overflow * 0.3);
    return offset > 0 ? resistance : -resistance;
  };

  // Сброс анимации
  const resetAnimation = useCallback(() => {
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: 0,
        tension: animations.springTension,
        friction: animations.springFriction,
        useNativeDriver: true,
      }),
      Animated.timing(leftOpacity, {
        toValue: 0,
        duration: animations.durationFast,
        useNativeDriver: true,
      }),
      Animated.timing(rightOpacity, {
        toValue: 0,
        duration: animations.durationFast,
        useNativeDriver: true,
      }),
      Animated.spring(leftScale, {
        toValue: 0.8,
        tension: animations.springTension,
        friction: animations.springFriction,
        useNativeDriver: true,
      }),
      Animated.spring(rightScale, {
        toValue: 0.8,
        tension: animations.springTension,
        friction: animations.springFriction,
        useNativeDriver: true,
      }),
    ]).start();
    
    isSwiping.current = false;
    isDirectionLocked.current = false;
    onSwipeEnd?.();
  }, [translateX, leftOpacity, rightOpacity, leftScale, rightScale, onSwipeEnd]);

  // PanResponder с гистерезисом
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      
      onMoveShouldSetPanResponder: (
        _: GestureResponderEvent,
        gestureState: PanResponderGestureState
      ) => {
        const { dx, dy } = gestureState;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        
        // ГИСТЕРЕЗИС: Горизонтальное движение должно преобладать
        if (absDx > animations.horizontalThreshold && 
            absDx > absDy * animations.directionLockRatio) {
          isSwiping.current = true;
          isDirectionLocked.current = true;
          onSwipeStart?.();
          return true;
        }
        return false;
      },
      
      onPanResponderGrant: () => {
        hasTriggeredHaptic.current = false;
        isSwiping.current = false;
        isDirectionLocked.current = false;
      },
      
      onPanResponderMove: (
        _: GestureResponderEvent,
        gestureState: PanResponderGestureState
      ) => {
        if (!isSwiping.current) return;
        
        const { dx } = gestureState;
        const elasticDx = applyElasticResistance(dx);
        translateX.setValue(elasticDx);
        
        // Показываем действия
        if (dx < -10) {
          const progress = Math.min(Math.abs(dx) / animations.swipeThreshold, 1);
          leftOpacity.setValue(progress);
          rightOpacity.setValue(0);
          leftScale.setValue(0.8 + (progress * 0.4));
        } else if (dx > 10) {
          const progress = Math.min(dx / animations.swipeThreshold, 1);
          rightOpacity.setValue(progress);
          leftOpacity.setValue(0);
          rightScale.setValue(0.8 + (progress * 0.4));
        }
        
        // Haptic при пороге
        if (Math.abs(dx) >= animations.swipeThreshold && !hasTriggeredHaptic.current) {
          if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
          hasTriggeredHaptic.current = true;
        }
      },
      
      onPanResponderRelease: (
        _: GestureResponderEvent,
        gestureState: PanResponderGestureState
      ) => {
        if (!isSwiping.current) return;
        
        const { dx } = gestureState;
        
        if (dx <= -animations.swipeThreshold && onDelete) {
          if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
          onDelete();
        } else if (dx >= animations.swipeThreshold && onPin) {
          if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
          onPin();
        }
        
        resetAnimation();
      },
      
      onPanResponderTerminate: () => {
        resetAnimation();
      },
      
      // Блокируем скролл при активном свайпе
      onPanResponderTerminationRequest: () => !isSwiping.current,
    })
  ).current;

  // Получаем статус пользователя
  const getUserStatus = (): string => {
    if (chat.lastMessage) return chat.lastMessage;
    if (chat.status) return chat.status;
    return formatLastSeen(chat.lastSeenAt, chat.isOnline);
  };

  return (
    <View style={styles.swipeContainer}>
      {/* Левое действие (удалить) */}
      <Animated.View
        style={[
          styles.swipeAction,
          styles.swipeActionLeft,
          { opacity: leftOpacity },
        ]}
      >
        <Animated.View 
          style={[
            styles.actionButton, 
            { backgroundColor: colors.error, transform: [{ scale: leftScale }] }
          ]}
        >
          <Feather name="trash-2" size={sizes.iconMedium} color={colors.textPrimary} />
          <ThemedText style={styles.actionText}>Удалить</ThemedText>
        </Animated.View>
      </Animated.View>

      {/* Правое действие (закрепить) */}
      <Animated.View
        style={[
          styles.swipeAction,
          styles.swipeActionRight,
          { opacity: rightOpacity },
        ]}
      >
        <Animated.View 
          style={[
            styles.actionButton, 
            { backgroundColor: colors.primary, transform: [{ scale: rightScale }] }
          ]}
        >
          <Feather name="bookmark" size={sizes.iconMedium} color={colors.textPrimary} />
          <ThemedText style={styles.actionText}>
            {chat.isPinned ? 'Открепить' : 'Закрепить'}
          </ThemedText>
        </Animated.View>
      </Animated.View>

      {/* Контент элемента */}
      <Animated.View
        style={[
          styles.itemContent,
          { transform: [{ translateX }] },
        ]}
        {...panResponder.panHandlers}
      >
        <Pressable
          style={({ pressed }) => [
            styles.chatItem,
            pressed && { backgroundColor: colors.surface },
          ]}
          onPress={onPress}
        >
          {/* Glassmorphism эффект */}
          <View style={styles.glassContainer}>
            <BlurView intensity={20} tint="dark" style={styles.glassBlur}>
              <View style={styles.glassOverlay} />
            </BlurView>
          </View>
          
          {/* Аватар */}
          <View style={styles.avatarContainer}>
            {chat.isBlocked ? (
              <View style={[styles.avatar, { backgroundColor: colors.textTertiary }]}>
                <ThemedText style={styles.avatarText}>
                  {chat.name.charAt(0).toUpperCase()}
                </ThemedText>
              </View>
            ) : (() => {
              const avatarUrl = resolveAvatarUrl(chat.avatar);
              if (avatarUrl) {
                return <Image source={{ uri: avatarUrl }} style={styles.avatar} />;
              }
              return (
                <GradientAvatarPlaceholder
                  name={chat.name}
                  size={52}
                />
              );
            })()}
            
            {/* Онлайн индикатор */}
            {chat.isOnline && !chat.isBlocked && (
              <View style={styles.onlineIndicator} />
            )}
          </View>

          {/* Основной контент */}
          <View style={styles.chatContent}>
            {/* Верхняя строка: имя + время */}
            <View style={styles.chatHeader}>
              <View style={styles.nameContainer}>
                {chat.isPinned && (
                  <Feather 
                    name="bookmark" 
                    size={14} 
                    color={colors.textSecondary} 
                    style={styles.pinIcon}
                  />
                )}
                <ThemedText 
                  style={styles.chatName} 
                  numberOfLines={1}
                >
                  {chat.name}
                </ThemedText>
              </View>
              <ThemedText style={styles.chatTime}>
                {formatMessageTime(chat.lastMessageTime)}
              </ThemedText>
            </View>

            {/* Нижняя строка: статус/сообщение + счетчик */}
            <View style={styles.chatFooter}>
              <ThemedText
                style={[
                  styles.chatStatus,
                  chat.isOnline && styles.chatStatusOnline,
                ]}
                numberOfLines={1}
              >
                {getUserStatus()}
              </ThemedText>
              
              {chat.unreadCount && chat.unreadCount > 0 ? (
                <View style={[
                  styles.unreadBadge,
                  chat.isMuted && { backgroundColor: colors.textTertiary }
                ]}>
                  <ThemedText style={styles.unreadText}>
                    {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                  </ThemedText>
                </View>
              ) : chat.isMuted ? (
                <Ionicons 
                  name="volume-mute" 
                  size={16} 
                  color={colors.textTertiary} 
                />
              ) : null}
            </View>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
});

// ======================
// CHAT LIST WIDGET
// ======================
export function ChatListWidget({
  chats,
  onChatPress,
  onDeleteChat,
  onPinChat,
  onMuteChat,
  onRefresh,
  refreshing = false,
  ListHeaderComponent,
}: ChatListWidgetProps) {
  const [swipingItemId, setSwipingItemId] = useState<number | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const handleSwipeStart = useCallback((chatId: number) => {
    setSwipingItemId(chatId);
  }, []);

  const handleSwipeEnd = useCallback(() => {
    setSwipingItemId(null);
  }, []);

  const renderItem = useCallback(({ item }: { item: Chat }) => (
    <SwipeableChatItem
      chat={item}
      onPress={() => onChatPress(item)}
      onDelete={onDeleteChat ? () => onDeleteChat(item.id) : undefined}
      onPin={onPinChat ? () => onPinChat(item.id) : undefined}
      onMute={onMuteChat ? () => onMuteChat(item.id) : undefined}
      onSwipeStart={() => handleSwipeStart(item.id)}
      onSwipeEnd={handleSwipeEnd}
    />
  ), [onChatPress, onDeleteChat, onPinChat, onMuteChat, handleSwipeStart, handleSwipeEnd]);

  const keyExtractor = useCallback((item: Chat) => item.id.toString(), []);

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={chats}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={ListHeaderComponent}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          ) : undefined
        }
        // Отключаем скролл при свайпе
        scrollEnabled={swipingItemId === null}
      />
    </View>
  );
}

// ======================
// СТИЛИ (High-fidelity Premium Design)
// ======================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  listContent: {
    flexGrow: 1,
    paddingTop: 4,
  },
  
  // Swipe container
  swipeContainer: {
    position: 'relative',
    overflow: 'hidden',
    minHeight: sizes.chatItemHeight,
  },
  swipeAction: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: animations.swipeActionWidth,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeActionLeft: {
    right: 0,
  },
  swipeActionRight: {
    left: 0,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: sizes.paddingS,
    width: '100%',
    height: '100%',
    gap: 4,
  },
  actionText: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: '500',
  },
  itemContent: {
    backgroundColor: colors.backgroundSecondary,
    zIndex: 1,
  },
  
  // Chat item - увеличенные отступы для "воздуха"
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sizes.paddingL + 2,
    paddingVertical: sizes.paddingM + 2,
    minHeight: sizes.chatItemHeight,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
    position: 'relative',
    overflow: 'hidden',
  },
  
  // Glassmorphism - улучшенный эффект
  glassContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  glassBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(27, 38, 59, 0.85)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  
  // Avatar - увеличенный с gradient border
  avatarContainer: {
    position: 'relative',
    marginRight: sizes.paddingM + 2,
  },
  avatar: {
    width: sizes.avatarMedium,
    height: sizes.avatarMedium,
    borderRadius: sizes.avatarMedium / 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarText: {
    color: colors.textPrimary,
    fontSize: 19,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.online,
    borderWidth: 2.5,
    borderColor: colors.backgroundSecondary,
  },
  
  // Chat content - улучшенная типографика
  chatContent: {
    flex: 1,
    justifyContent: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: sizes.paddingM,
  },
  pinIcon: {
    marginRight: 5,
  },
  chatName: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 16,
    letterSpacing: -0.3,
    flex: 1,
  },
  chatTime: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
    letterSpacing: 0.1,
  },
  chatFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatStatus: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    flex: 1,
    marginRight: sizes.paddingM,
    fontSize: 14,
  },
  chatStatusOnline: {
    color: colors.online,
  },
  
  // Unread badge - premium style
  unreadBadge: {
    backgroundColor: colors.primary,
    borderRadius: sizes.radiusFull,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 7,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  unreadText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});

export default ChatListWidget;
