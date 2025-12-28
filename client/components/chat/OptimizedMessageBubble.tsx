/**
 * TELEGRAM-STYLE OPTIMIZED MESSAGE BUBBLE
 * 
 * Особенности:
 * - Минимум перерисовок (React.memo с глубоким сравнением)
 * - Анимации появления
 * - Поддержка всех типов контента
 * - Статусы доставки (✔️ → ✔️✔️ → синие ✔️✔️)
 */

import React, { useRef, useEffect, useCallback, memo } from 'react';
import { 
  View, 
  StyleSheet, 
  Pressable, 
  Animated, 
  Image,
  Dimensions,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/ThemedText';
import { Message, MessageStatus, Reaction } from '@/store/ChatStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_BUBBLE_WIDTH = SCREEN_WIDTH * 0.75;

interface OptimizedMessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  showSenderName: boolean;
  onLongPress: (message: Message) => void;
  onReactionPress: (messageId: string, emoji: string) => void;
  onReplyPress: (message: Message) => void;
  onMediaPress?: (message: Message) => void;
  theme: {
    primary: string;
    backgroundSecondary: string;
    textSecondary: string;
    text: string;
    error: string;
  };
}

// Компонент иконки статуса
const StatusIcon = memo(function StatusIcon({ 
  status, 
  isOwn 
}: { 
  status: MessageStatus; 
  isOwn: boolean 
}) {
  if (!isOwn) return null;
  
  const color = status === 'read' ? '#4ECDC4' : 'rgba(255,255,255,0.7)';
  
  switch (status) {
    case 'sending':
      return <Feather name="clock" size={14} color="rgba(255,255,255,0.7)" />;
    case 'sent':
      return <Feather name="check" size={14} color="rgba(255,255,255,0.7)" />;
    case 'delivered':
      return <MaterialCommunityIcons name="check-all" size={14} color="rgba(255,255,255,0.7)" />;
    case 'read':
      return <MaterialCommunityIcons name="check-all" size={14} color={color} />;
    case 'failed':
      return <Feather name="alert-circle" size={14} color="#FF6B6B" />;
    default:
      return null;
  }
});

// Компонент реакций
const ReactionsView = memo(function ReactionsView({
  reactions,
  onPress,
  theme,
}: {
  reactions: Reaction[];
  onPress: (emoji: string) => void;
  theme: any;
}) {
  if (!reactions?.length) return null;

  return (
    <View style={styles.reactions}>
      {reactions.map((reaction, index) => (
        <Pressable
          key={`${reaction.emoji}-${index}`}
          style={[
            styles.reactionBubble,
            reaction.hasReacted && { backgroundColor: theme.primary + '30' },
          ]}
          onPress={() => onPress(reaction.emoji)}
        >
          <ThemedText style={styles.reactionEmoji}>{reaction.emoji}</ThemedText>
          {reaction.count > 1 && (
            <ThemedText style={styles.reactionCount}>{reaction.count}</ThemedText>
          )}
        </Pressable>
      ))}
    </View>
  );
});

// Компонент медиа контента
const MediaContent = memo(function MediaContent({
  message,
  isOwn,
  onPress,
  theme,
}: {
  message: Message;
  isOwn: boolean;
  onPress?: () => void;
  theme: any;
}) {
  if (message.type === 'image' && message.mediaUrl) {
    return (
      <Pressable style={styles.mediaContainer} onPress={onPress}>
        <Image 
          source={{ uri: message.mediaUrl }} 
          style={styles.mediaImage}
          resizeMode="cover"
        />
      </Pressable>
    );
  }

  if (message.type === 'voice') {
    const duration = message.mediaDuration || 0;
    const formatted = `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`;
    
    return (
      <View style={styles.voiceMessage}>
        <Pressable 
          style={[
            styles.playButton, 
            { backgroundColor: isOwn ? 'rgba(255,255,255,0.2)' : theme.primary + '20' }
          ]}
          onPress={onPress}
        >
          <Feather name="play" size={18} color={isOwn ? '#fff' : theme.primary} />
        </Pressable>
        <View style={styles.waveform}>
          {[...Array(18)].map((_, i) => (
            <View
              key={i}
              style={[
                styles.waveformBar,
                { 
                  height: Math.random() * 18 + 6,
                  backgroundColor: isOwn ? 'rgba(255,255,255,0.5)' : theme.primary + '50',
                },
              ]}
            />
          ))}
        </View>
        <ThemedText 
          style={[
            styles.voiceDuration, 
            { color: isOwn ? 'rgba(255,255,255,0.7)' : theme.textSecondary }
          ]}
        >
          {formatted}
        </ThemedText>
      </View>
    );
  }

  if (message.type === 'file' && message.mediaFileName) {
    return (
      <Pressable style={styles.fileMessage} onPress={onPress}>
        <View 
          style={[
            styles.fileIcon, 
            { backgroundColor: isOwn ? 'rgba(255,255,255,0.2)' : theme.backgroundSecondary }
          ]}
        >
          <Feather name="file-text" size={24} color={isOwn ? '#fff' : theme.primary} />
        </View>
        <View style={styles.fileInfo}>
          <ThemedText 
            style={[styles.fileName, { color: isOwn ? '#fff' : theme.text }]} 
            numberOfLines={1}
          >
            {message.mediaFileName}
          </ThemedText>
          <ThemedText 
            style={[styles.fileSize, { color: isOwn ? 'rgba(255,255,255,0.7)' : theme.textSecondary }]}
          >
            {message.mediaSize ? `${(message.mediaSize / 1024).toFixed(1)} KB` : 'Файл'}
          </ThemedText>
        </View>
        <Feather name="download" size={20} color={isOwn ? '#fff' : theme.primary} />
      </Pressable>
    );
  }

  return null;
});

function OptimizedMessageBubble({
  message,
  isOwn,
  showAvatar,
  showSenderName,
  onLongPress,
  onReactionPress,
  onReplyPress,
  onMediaPress,
  theme,
}: OptimizedMessageBubbleProps) {
  // Анимации
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 120,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLongPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onLongPress(message);
  }, [message, onLongPress]);

  const handleReactionPress = useCallback((emoji: string) => {
    onReactionPress(message.id, emoji);
  }, [message.id, onReactionPress]);

  // Форматирование времени
  const formatTime = useCallback((timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('ru', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }, []);

  // Системное сообщение
  if (message.type === 'system') {
    return (
      <View style={styles.systemContainer}>
        <View style={[styles.systemBubble, { backgroundColor: theme.backgroundSecondary }]}>
          <ThemedText style={[styles.systemText, { color: theme.textSecondary }]}>
            {message.text}
          </ThemedText>
        </View>
      </View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        isOwn ? styles.ownContainer : styles.otherContainer,
        { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
      ]}
    >
      {/* Аватар */}
      {showAvatar && !isOwn && (
        <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
          <ThemedText style={styles.avatarText}>
            {message.senderName?.charAt(0).toUpperCase() || '?'}
          </ThemedText>
        </View>
      )}
      {!showAvatar && !isOwn && <View style={styles.avatarPlaceholder} />}

      {/* Пузырь */}
      <Pressable
        onLongPress={handleLongPress}
        delayLongPress={300}
        style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
      >
        <LinearGradient
          colors={isOwn 
            ? [theme.primary, theme.primary + 'DD'] 
            : [theme.backgroundSecondary, theme.backgroundSecondary]
          }
          style={[
            styles.bubble,
            isOwn ? styles.ownBubble : styles.otherBubble,
          ]}
        >
          {/* Имя отправителя */}
          {showSenderName && !isOwn && message.senderName && (
            <ThemedText style={[styles.senderName, { color: theme.primary }]}>
              {message.senderName}
            </ThemedText>
          )}

          {/* Reply preview */}
          {message.replyTo && (
            <Pressable
              style={[
                styles.replyPreview,
                { backgroundColor: isOwn ? 'rgba(255,255,255,0.15)' : theme.backgroundSecondary }
              ]}
              onPress={() => onReplyPress(message)}
            >
              <View 
                style={[styles.replyLine, { backgroundColor: isOwn ? '#fff' : theme.primary }]} 
              />
              <View style={styles.replyContent}>
                <ThemedText 
                  style={[styles.replyName, { color: isOwn ? '#fff' : theme.primary }]}
                >
                  {message.replyTo.senderName}
                </ThemedText>
                <ThemedText 
                  style={[
                    styles.replyText, 
                    { color: isOwn ? 'rgba(255,255,255,0.8)' : theme.textSecondary }
                  ]} 
                  numberOfLines={1}
                >
                  {message.replyTo.text}
                </ThemedText>
              </View>
            </Pressable>
          )}

          {/* Медиа контент */}
          <MediaContent 
            message={message} 
            isOwn={isOwn} 
            onPress={() => onMediaPress?.(message)}
            theme={theme} 
          />

          {/* Текст */}
          {message.text && (
            <ThemedText 
              style={[styles.text, { color: isOwn ? '#fff' : theme.text }]}
            >
              {message.text}
              {message.isEdited && (
                <ThemedText 
                  style={[
                    styles.editedLabel, 
                    { color: isOwn ? 'rgba(255,255,255,0.6)' : theme.textSecondary }
                  ]}
                >
                  {' (ред.)'}
                </ThemedText>
              )}
            </ThemedText>
          )}

          {/* Футер */}
          <View style={styles.footer}>
            <ThemedText 
              style={[
                styles.time, 
                { color: isOwn ? 'rgba(255,255,255,0.7)' : theme.textSecondary }
              ]}
            >
              {formatTime(message.createdAt)}
            </ThemedText>
            <StatusIcon status={message.status} isOwn={isOwn} />
          </View>
        </LinearGradient>

        {/* Реакции */}
        <ReactionsView 
          reactions={message.reactions} 
          onPress={handleReactionPress}
          theme={theme}
        />
      </Pressable>
    </Animated.View>
  );
}

// Глубокое сравнение для оптимизации
export default memo(OptimizedMessageBubble, (prev, next) => {
  return (
    prev.message.id === next.message.id &&
    prev.message.text === next.message.text &&
    prev.message.status === next.message.status &&
    prev.message.isEdited === next.message.isEdited &&
    prev.message.reactions?.length === next.message.reactions?.length &&
    prev.isOwn === next.isOwn &&
    prev.showAvatar === next.showAvatar &&
    prev.showSenderName === next.showSenderName
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    marginVertical: 2,
  },
  ownContainer: {
    justifyContent: 'flex-end',
  },
  otherContainer: {
    justifyContent: 'flex-start',
  },

  // Аватар
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    alignSelf: 'flex-end',
  },
  avatarPlaceholder: {
    width: 40,
  },
  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  // Пузырь
  bubble: {
    maxWidth: MAX_BUBBLE_WIDTH,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
  },
  ownBubble: {
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    borderBottomLeftRadius: 4,
  },

  // Текст
  senderName: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  text: {
    fontSize: 15,
    lineHeight: 20,
  },
  editedLabel: {
    fontSize: 12,
    fontStyle: 'italic',
  },

  // Футер
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 4,
  },
  time: {
    fontSize: 11,
  },

  // Reply
  replyPreview: {
    flexDirection: 'row',
    padding: 6,
    borderRadius: 8,
    marginBottom: 6,
  },
  replyLine: {
    width: 3,
    borderRadius: 2,
    marginRight: 8,
  },
  replyContent: {
    flex: 1,
  },
  replyName: {
    fontSize: 12,
    fontWeight: '600',
  },
  replyText: {
    fontSize: 12,
  },

  // Реакции
  reactions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
    gap: 4,
  },
  reactionBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  reactionEmoji: {
    fontSize: 14,
  },
  reactionCount: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Медиа
  mediaContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 4,
  },
  mediaImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
  },
  voiceMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 160,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveform: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 28,
  },
  waveformBar: {
    width: 3,
    borderRadius: 2,
  },
  voiceDuration: {
    fontSize: 12,
    minWidth: 32,
    textAlign: 'right',
  },
  fileMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 180,
  },
  fileIcon: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
  },
  fileSize: {
    fontSize: 12,
  },

  // Системное сообщение
  systemContainer: {
    alignItems: 'center',
    marginVertical: 8,
    paddingHorizontal: 16,
  },
  systemBubble: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  systemText: {
    fontSize: 13,
    textAlign: 'center',
  },
});
