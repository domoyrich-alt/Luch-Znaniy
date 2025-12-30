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
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/ThemedText';
import { 
  TelegramDarkColors as colors, 
  TelegramSizes as sizes,
  TelegramAnimations as animations,
  TelegramTypography as typography,
} from '@/constants/telegramDarkTheme';

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
  status?: string;
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

  // Форматирование времени
  const formatTime = (time?: string | Date): string => {
    if (!time) return '';
    const date = typeof time === 'string' ? new Date(time) : time;
    return date.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
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
          {/* Аватар */}
          <View style={styles.avatarContainer}>
            {chat.avatar ? (
              <Image source={{ uri: chat.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                <ThemedText style={styles.avatarText}>
                  {chat.name.charAt(0).toUpperCase()}
                </ThemedText>
              </View>
            )}
            
            {/* Онлайн индикатор */}
            {chat.isOnline && (
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
                {formatTime(chat.lastMessageTime)}
              </ThemedText>
            </View>

            {/* Нижняя строка: статус/сообщение + счетчик */}
            <View style={styles.chatFooter}>
              <ThemedText
                style={styles.chatStatus}
                numberOfLines={1}
              >
                {chat.lastMessage || chat.status || 'Нет статуса'}
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
// СТИЛИ
// ======================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  listContent: {
    flexGrow: 1,
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
  
  // Chat item
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sizes.paddingL,
    paddingVertical: sizes.paddingM,
    minHeight: sizes.chatItemHeight,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  
  // Avatar
  avatarContainer: {
    position: 'relative',
    marginRight: sizes.paddingM,
  },
  avatar: {
    width: sizes.avatarMedium,
    height: sizes.avatarMedium,
    borderRadius: sizes.avatarMedium / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.online,
    borderWidth: 2,
    borderColor: colors.backgroundSecondary,
  },
  
  // Chat content
  chatContent: {
    flex: 1,
    justifyContent: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: sizes.paddingS,
  },
  pinIcon: {
    marginRight: 4,
  },
  chatName: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    fontWeight: '500',
    flex: 1,
  },
  chatTime: {
    ...typography.caption,
    color: colors.textSecondary,
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
    marginRight: sizes.paddingS,
  },
  
  // Unread badge
  unreadBadge: {
    backgroundColor: colors.primary,
    borderRadius: sizes.radiusFull,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ChatListWidget;
