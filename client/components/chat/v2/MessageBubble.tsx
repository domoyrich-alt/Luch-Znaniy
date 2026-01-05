/**
 * MESSAGE BUBBLE (v2)
 * Компонент сообщения с правильными цветами и скруглениями
 * 
 * Стили сообщений:
 * - Мои сообщения: фиолетовый фон, скругление справа меньше
 * - Чужие сообщения: серый фон, скругление слева меньше
 * 
 * Фичи:
 * - Swipe-to-Reply с haptic feedback
 * - Видеокружки
 * - Double-tap для быстрой реакции ❤️
 * - Отображение реакций
 */

import React, { memo, useRef, useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Image,
  Platform,
  Animated,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
  TouchableOpacity,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/ThemedText';
import { VideoCircleMessage } from './VideoCircleMessage';
import { 
  TelegramDarkColors as colors, 
  TelegramSizes as sizes,
  TelegramTypography as typography,
} from '@/constants/telegramDarkTheme';

// ======================
// ТИПЫ
// ======================
export interface MessageReaction {
  emoji: string;
  count: number;
  users: number[];
}

export interface Message {
  id: number;
  text?: string;
  senderId: number;
  createdAt: string | Date;
  isRead?: boolean;
  mediaUrl?: string;
  mediaType?: 'photo' | 'video' | 'audio' | 'document' | 'video_circle';
  mediaDuration?: number;
  replyTo?: {
    id: number;
    text: string;
    senderName: string;
  };
  isGift?: boolean;
  reactions?: MessageReaction[];
  isEdited?: boolean;
}

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showTail?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  onImagePress?: (url: string) => void;
  onReply?: (message: Message) => void;
  onDoubleTap?: (message: Message) => void;
  onReactionPress?: (message: Message, emoji: string) => void;
  currentUserId?: number;
}

// Swipe-to-Reply константы
const SWIPE_THRESHOLD = 60;
const MAX_SWIPE = 80;
const DOUBLE_TAP_DELAY = 300;

// ======================
// REACTIONS DISPLAY
// ======================
const ReactionsDisplay = memo(function ReactionsDisplay({
  reactions,
  isOwn,
  onReactionPress,
  currentUserId,
}: {
  reactions: MessageReaction[];
  isOwn: boolean;
  onReactionPress?: (emoji: string) => void;
  currentUserId?: number;
}) {
  if (!reactions || reactions.length === 0) return null;

  return (
    <View style={[reactionsStyles.container, isOwn && reactionsStyles.containerOwn]}>
      {reactions.map((reaction) => {
        const isMyReaction = currentUserId && reaction.users.includes(currentUserId);
        return (
          <TouchableOpacity
            key={reaction.emoji}
            style={[
              reactionsStyles.reaction,
              isMyReaction && reactionsStyles.reactionMine,
            ]}
            onPress={() => onReactionPress?.(reaction.emoji)}
            activeOpacity={0.7}
          >
            <ThemedText style={reactionsStyles.emoji}>{reaction.emoji}</ThemedText>
            {reaction.count > 1 && (
              <ThemedText style={reactionsStyles.count}>{reaction.count}</ThemedText>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
});

const reactionsStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
    gap: 4,
  },
  containerOwn: {
    justifyContent: 'flex-end',
  },
  reaction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  reactionMine: {
    backgroundColor: `${colors.primary}30`,
  },
  emoji: {
    fontSize: 16,
  },
  count: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});

// ======================
// MESSAGE STATUS ICON
// ======================
const MessageStatus = memo(function MessageStatus({ 
  isRead, 
  isOwn 
}: { 
  isRead?: boolean; 
  isOwn: boolean;
}) {
  if (!isOwn) return null;
  
  return (
    <View style={statusStyles.container}>
      {isRead ? (
        <Ionicons name="checkmark-done" size={14} color={colors.messageTime} />
      ) : (
        <Ionicons name="checkmark" size={14} color={colors.messageTime} />
      )}
    </View>
  );
});

const statusStyles = StyleSheet.create({
  container: {
    marginLeft: 4,
  },
});

// ======================
// MESSAGE BUBBLE
// ======================
export const MessageBubble = memo(function MessageBubble({
  message,
  isOwn,
  showTail = true,
  onPress,
  onLongPress,
  onImagePress,
  onReply,
  onDoubleTap,
  onReactionPress,
  currentUserId,
}: MessageBubbleProps) {
  // Swipe-to-Reply анимация
  const translateX = useRef(new Animated.Value(0)).current;
  const replyIconOpacity = useRef(new Animated.Value(0)).current;
  const hasTriggeredHaptic = useRef(false);
  const lastTapRef = useRef<number>(0);
  
  // Double-tap heart animation
  const heartScale = useRef(new Animated.Value(0)).current;
  const heartOpacity = useRef(new Animated.Value(0)).current;
  const [showHeart, setShowHeart] = useState(false);

  const handleDoubleTap = useCallback(() => {
    if (onDoubleTap) {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      
      // Show heart animation
      setShowHeart(true);
      heartScale.setValue(0);
      heartOpacity.setValue(1);
      
      Animated.sequence([
        Animated.spring(heartScale, {
          toValue: 1,
          tension: 300,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.delay(500),
        Animated.timing(heartOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => setShowHeart(false));
      
      onDoubleTap(message);
    }
  }, [onDoubleTap, message, heartScale, heartOpacity]);

  const handlePress = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      handleDoubleTap();
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
      onPress?.();
    }
  }, [handleDoubleTap, onPress]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const { dx, dy } = gestureState;
        // Только горизонтальный свайп влево (для reply)
        return Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 2 && dx < 0;
      },
      onPanResponderMove: (_, gestureState) => {
        const { dx } = gestureState;
        // Ограничиваем свайп
        const clampedX = Math.max(-MAX_SWIPE, Math.min(0, dx));
        translateX.setValue(clampedX);
        
        // Показываем иконку reply
        const progress = Math.abs(clampedX) / SWIPE_THRESHOLD;
        replyIconOpacity.setValue(Math.min(progress, 1));
        
        // Haptic при достижении порога
        if (Math.abs(dx) >= SWIPE_THRESHOLD && !hasTriggeredHaptic.current) {
          if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
          hasTriggeredHaptic.current = true;
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const { dx } = gestureState;
        
        if (Math.abs(dx) >= SWIPE_THRESHOLD && onReply) {
          if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
          onReply(message);
        }
        
        // Сброс анимации
        Animated.parallel([
          Animated.spring(translateX, {
            toValue: 0,
            tension: 200,
            friction: 20,
            useNativeDriver: true,
          }),
          Animated.timing(replyIconOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
        
        hasTriggeredHaptic.current = false;
      },
      onPanResponderTerminate: () => {
        Animated.parallel([
          Animated.spring(translateX, {
            toValue: 0,
            tension: 200,
            friction: 20,
            useNativeDriver: true,
          }),
          Animated.timing(replyIconOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
        hasTriggeredHaptic.current = false;
      },
    })
  ).current;

  const handleLongPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onLongPress?.();
  };

  // Форматирование времени
  const formatTime = (time: string | Date): string => {
    const date = typeof time === 'string' ? new Date(time) : time;
    return date.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
  };

  // Если нет ни текста ни медиа - не рендерим пустой пузырь
  const hasContent = (message.text && message.text.trim().length > 0) || 
                     message.mediaUrl || 
                     message.isGift ||
                     message.replyTo;
  
  if (!hasContent) {
    return null;
  }

  // Стили для пузыря в зависимости от отправителя
  const bubbleStyles = [
    styles.bubble,
    isOwn ? styles.bubbleOwn : styles.bubbleOther,
    showTail && (isOwn ? styles.bubbleOwnTail : styles.bubbleOtherTail),
  ];

  // Рендер видеокружка
  if (message.mediaType === 'video_circle' && message.mediaUrl) {
    return (
      <View style={[styles.container, isOwn && styles.containerOwn]}>
        <Animated.View 
          style={{ transform: [{ translateX }] }}
          {...panResponder.panHandlers}
        >
          <VideoCircleMessage
            uri={message.mediaUrl}
            duration={message.mediaDuration}
            size={200}
            isOwn={isOwn}
          />
          
          {/* Время под кружком */}
          <View style={[styles.videoCircleTime, isOwn && styles.videoCircleTimeOwn]}>
            <ThemedText style={styles.time}>
              {formatTime(message.createdAt)}
            </ThemedText>
            <MessageStatus isRead={message.isRead} isOwn={isOwn} />
          </View>
        </Animated.View>
        
        {/* Reply icon */}
        <Animated.View 
          style={[
            styles.replyIcon,
            { opacity: replyIconOpacity },
          ]}
        >
          <Feather name="corner-up-left" size={20} color={colors.primary} />
        </Animated.View>
      </View>
    );
  }

  // Рендер фото
  if (message.mediaType === 'photo' && message.mediaUrl) {
    return (
      <View style={[styles.container, isOwn && styles.containerOwn]}>
        <Animated.View 
          style={{ transform: [{ translateX }] }}
          {...panResponder.panHandlers}
        >
          <Pressable
            style={bubbleStyles}
            onPress={() => onImagePress?.(message.mediaUrl!)}
            onLongPress={handleLongPress}
          >
            <Image
              source={{ uri: message.mediaUrl }}
              style={styles.mediaImage}
              resizeMode="cover"
            />
            
            {/* Время и статус на фото */}
            <View style={styles.mediaTimeContainer}>
              <ThemedText style={styles.mediaTime}>
                {formatTime(message.createdAt)}
              </ThemedText>
              <MessageStatus isRead={message.isRead} isOwn={isOwn} />
            </View>
          </Pressable>
        </Animated.View>
        
        {/* Reply icon */}
        <Animated.View 
          style={[
            styles.replyIcon,
            { opacity: replyIconOpacity },
          ]}
        >
          <Feather name="corner-up-left" size={20} color={colors.primary} />
        </Animated.View>
      </View>
    );
  }

  // Рендер подарка
  if (message.isGift || message.text?.startsWith('🎁 Подарок:')) {
    return (
      <View style={[styles.container, isOwn && styles.containerOwn]}>
        <Animated.View 
          style={{ transform: [{ translateX }] }}
          {...panResponder.panHandlers}
        >
          <Pressable
            style={[styles.giftBubble, isOwn ? styles.giftBubbleOwn : styles.giftBubbleOther]}
            onPress={onPress}
            onLongPress={handleLongPress}
          >
            <ThemedText style={styles.giftText}>{message.text}</ThemedText>
            
            <View style={styles.timeRow}>
              <ThemedText style={styles.time}>
                {formatTime(message.createdAt)}
              </ThemedText>
              <MessageStatus isRead={message.isRead} isOwn={isOwn} />
            </View>
          </Pressable>
        </Animated.View>
        
        {/* Reply icon */}
        <Animated.View 
          style={[
            styles.replyIcon,
            { opacity: replyIconOpacity },
          ]}
        >
          <Feather name="corner-up-left" size={20} color={colors.primary} />
        </Animated.View>
      </View>
    );
  }

  // Обычное текстовое сообщение
  return (
    <View style={[styles.container, isOwn && styles.containerOwn]}>
      <Animated.View 
        style={{ transform: [{ translateX }] }}
        {...panResponder.panHandlers}
      >
        <Pressable
          style={({ pressed }) => [
            ...bubbleStyles,
            pressed && { opacity: 0.9 },
          ]}
          onPress={handlePress}
          onLongPress={handleLongPress}
        >
          {/* Reply preview */}
          {message.replyTo && (
            <View style={[
              styles.replyContainer,
              { borderLeftColor: isOwn ? 'rgba(255,255,255,0.5)' : colors.primary }
            ]}>
              <ThemedText style={styles.replyName}>
                {message.replyTo.senderName}
              </ThemedText>
              <ThemedText style={styles.replyText} numberOfLines={1}>
                {message.replyTo.text}
              </ThemedText>
            </View>
          )}

          {/* Текст сообщения */}
          {message.text && message.text.trim().length > 0 && (
            <ThemedText style={[
              styles.text,
              isOwn && styles.textOwn,
            ]}>
              {message.text}
            </ThemedText>
          )}

          {/* Время и статус */}
          <View style={styles.timeRow}>
            {message.isEdited && (
              <ThemedText style={[styles.time, isOwn && styles.timeOwn]}>
                изм.{' '}
              </ThemedText>
            )}
            <ThemedText style={[
              styles.time,
              isOwn && styles.timeOwn,
            ]}>
              {formatTime(message.createdAt)}
            </ThemedText>
            <MessageStatus isRead={message.isRead} isOwn={isOwn} />
          </View>
          
          {/* Double-tap heart animation */}
          {showHeart && (
            <Animated.View
              style={[
                styles.heartAnimation,
                {
                  transform: [{ scale: heartScale }],
                  opacity: heartOpacity,
                },
              ]}
            >
              <ThemedText style={styles.heartEmoji}>❤️</ThemedText>
            </Animated.View>
          )}
        </Pressable>
        
        {/* Reactions display */}
        <ReactionsDisplay
          reactions={message.reactions || []}
          isOwn={isOwn}
          onReactionPress={(emoji) => onReactionPress?.(message, emoji)}
          currentUserId={currentUserId}
        />
      </Animated.View>
      
      {/* Reply icon */}
      <Animated.View 
        style={[
          styles.replyIcon,
          { opacity: replyIconOpacity },
        ]}
      >
        <Feather name="corner-up-left" size={20} color={colors.primary} />
      </Animated.View>
    </View>
  );
});

// ======================
// СТИЛИ (High-fidelity Telegram-style)
// ======================
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 3,
    paddingHorizontal: sizes.paddingChat || 14,
    maxWidth: '100%',
  },
  containerOwn: {
    justifyContent: 'flex-end',
  },
  
  // Пузырь сообщения - Premium 18px radius with tails
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: sizes.messagePadding || 14,
    paddingVertical: 8,
    paddingBottom: 6,
    borderRadius: sizes.messageRadius || 18,
    // Premium shadow effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  bubbleOwn: {
    backgroundColor: colors.messageMine,
    borderBottomRightRadius: sizes.messageTailRadius || 6,  // Tail corner
    marginLeft: 'auto',
  },
  bubbleOther: {
    backgroundColor: colors.messageTheirs,
    borderBottomLeftRadius: sizes.messageTailRadius || 6,   // Tail corner  
    marginRight: 'auto',
  },
  bubbleOwnTail: {
    borderBottomRightRadius: sizes.messageTailRadius || 6,
  },
  bubbleOtherTail: {
    borderBottomLeftRadius: sizes.messageTailRadius || 6,
  },
  
  // Текст - SF Pro Display style
  text: {
    ...typography.bodyMedium,
    color: colors.messageText,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  textOwn: {
    color: colors.messageText,
  },
  
  // Время - тонкий и аккуратный
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 4,
  },
  time: {
    ...typography.timestamp,
    color: colors.messageTime,
    fontSize: 11,
    letterSpacing: 0.1,
  },
  timeOwn: {
    color: 'rgba(255, 255, 255, 0.65)',
  },
  
  // Reply
  replyContainer: {
    borderLeftWidth: 2,
    paddingLeft: sizes.paddingS,
    marginBottom: sizes.paddingS,
  },
  replyName: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  replyText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  
  // Медиа
  mediaImage: {
    width: 200,
    height: 200,
    borderRadius: sizes.radiusM,
  },
  mediaTimeContainer: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: sizes.radiusS,
  },
  mediaTime: {
    ...typography.timestamp,
    color: colors.textPrimary,
  },
  
  // Подарок
  giftBubble: {
    maxWidth: '75%',
    paddingHorizontal: sizes.paddingL,
    paddingVertical: sizes.paddingM,
    borderRadius: sizes.radiusL,
    borderWidth: 1,
  },
  giftBubbleOwn: {
    backgroundColor: `${colors.primary}30`,
    borderColor: colors.primary,
  },
  giftBubbleOther: {
    backgroundColor: `${colors.warning}20`,
    borderColor: colors.warning,
  },
  giftText: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  
  // Swipe-to-Reply иконка
  replyIcon: {
    position: 'absolute',
    right: -40,
    top: '50%',
    marginTop: -16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${colors.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Время для видеокружка
  videoCircleTime: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  videoCircleTimeOwn: {
    justifyContent: 'flex-end',
  },
  
  // Heart animation for double-tap
  heartAnimation: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -24,
    marginLeft: -24,
  },
  heartEmoji: {
    fontSize: 48,
  },
});

export default MessageBubble;
