/**
 * MESSAGE BUBBLE (v2)
 * Компонент сообщения с правильными цветами и скруглениями
 * 
 * Стили сообщений:
 * - Мои сообщения: фиолетовый фон, скругление справа меньше
 * - Чужие сообщения: серый фон, скругление слева меньше
 */

import React, { memo } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Image,
  Platform,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
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
export interface Message {
  id: number;
  text?: string;
  senderId: number;
  createdAt: string | Date;
  isRead?: boolean;
  mediaUrl?: string;
  mediaType?: 'photo' | 'video' | 'audio' | 'document';
  replyTo?: {
    id: number;
    text: string;
    senderName: string;
  };
  isGift?: boolean;
}

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showTail?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  onImagePress?: (url: string) => void;
}

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
}: MessageBubbleProps) {
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

  // Стили для пузыря в зависимости от отправителя
  const bubbleStyles = [
    styles.bubble,
    isOwn ? styles.bubbleOwn : styles.bubbleOther,
    showTail && (isOwn ? styles.bubbleOwnTail : styles.bubbleOtherTail),
  ];

  // Рендер фото
  if (message.mediaType === 'photo' && message.mediaUrl) {
    return (
      <View style={[styles.container, isOwn && styles.containerOwn]}>
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
      </View>
    );
  }

  // Рендер подарка
  if (message.isGift || message.text?.startsWith('🎁 Подарок:')) {
    return (
      <View style={[styles.container, isOwn && styles.containerOwn]}>
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
      </View>
    );
  }

  // Обычное текстовое сообщение
  return (
    <View style={[styles.container, isOwn && styles.containerOwn]}>
      <Pressable
        style={({ pressed }) => [
          ...bubbleStyles,
          pressed && { opacity: 0.9 },
        ]}
        onPress={onPress}
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
        <ThemedText style={[
          styles.text,
          isOwn && styles.textOwn,
        ]}>
          {message.text}
        </ThemedText>

        {/* Время и статус */}
        <View style={styles.timeRow}>
          <ThemedText style={[
            styles.time,
            isOwn && styles.timeOwn,
          ]}>
            {formatTime(message.createdAt)}
          </ThemedText>
          <MessageStatus isRead={message.isRead} isOwn={isOwn} />
        </View>
      </Pressable>
    </View>
  );
});

// ======================
// СТИЛИ
// ======================
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: 12,
    maxWidth: '100%',
  },
  containerOwn: {
    justifyContent: 'flex-end',
  },
  
  // Пузырь сообщения
  bubble: {
    maxWidth: '75%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  bubbleOwn: {
    backgroundColor: '#8A2BE2',      // НЕОНОВО-ФИОЛЕТОВЫЙ
    borderTopRightRadius: 4,         // Маленький угол справа
  },
  bubbleOther: {
    backgroundColor: '#2D2D2D',      // СЕРЫЙ
    borderTopLeftRadius: 4,          // Маленький угол слева
  },
  bubbleOwnTail: {
    borderTopRightRadius: 4,
  },
  bubbleOtherTail: {
    borderTopLeftRadius: 4,
  },
  
  // Текст
  text: {
    ...typography.bodyMedium,
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 22,
  },
  textOwn: {
    color: '#FFFFFF',
  },
  
  // Время
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  time: {
    ...typography.timestamp,
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
  },
  timeOwn: {
    color: 'rgba(255, 255, 255, 0.6)',
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
});

export default MessageBubble;
