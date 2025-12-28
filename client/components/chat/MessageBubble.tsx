import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Pressable, Animated, Image } from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { ChatMessage, ChatReaction, REACTION_EMOJIS } from '@/types/chat';
import { Spacing, BorderRadius } from '@/constants/theme';

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  showAvatar?: boolean;
  onLongPress?: (message: ChatMessage) => void;
  onReactionPress?: (messageId: string, emoji: string) => void;
  onReplyPress?: (message: ChatMessage) => void;
}

export function MessageBubble({
  message,
  isOwn,
  showAvatar = false,
  onLongPress,
  onReactionPress,
  onReplyPress,
}: MessageBubbleProps) {
  const { theme } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const renderStatus = () => {
    if (!isOwn) return null;

    const statusIcon = {
      sending: <Feather name="clock" size={14} color="#888" />,
      sent: <MaterialIcons name="done" size={14} color="#888" />,
      delivered: <MaterialIcons name="done-all" size={14} color="#888" />,
      read: <MaterialIcons name="done-all" size={14} color="#4ECDC4" />,
    };

    return <View style={styles.statusIcon}>{statusIcon[message.status]}</View>;
  };

  const renderReplyPreview = () => {
    if (!message.replyTo) return null;

    return (
      <Pressable
        style={[styles.replyPreview, { backgroundColor: isOwn ? 'rgba(255,255,255,0.15)' : theme.backgroundSecondary }]}
        onPress={() => onReplyPress?.(message)}
      >
        <View style={[styles.replyLine, { backgroundColor: isOwn ? '#fff' : theme.primary }]} />
        <View style={styles.replyContent}>
          <ThemedText style={[styles.replyName, { color: isOwn ? '#fff' : theme.primary }]}>
            {message.replyTo.senderName}
          </ThemedText>
          <ThemedText style={[styles.replyText, { color: isOwn ? 'rgba(255,255,255,0.8)' : theme.textSecondary }]} numberOfLines={1}>
            {message.replyTo.text}
          </ThemedText>
        </View>
      </Pressable>
    );
  };

  const renderReactions = () => {
    if (!message.reactions || message.reactions.length === 0) return null;

    // Группируем реакции по эмодзи
    const groupedReactions = message.reactions.reduce((acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = { emoji: reaction.emoji, count: 0, hasReacted: false };
      }
      acc[reaction.emoji].count = (reaction.count || 1);
      if (reaction.hasReacted) {
        acc[reaction.emoji].hasReacted = true;
      }
      return acc;
    }, {} as Record<string, { emoji: string; count: number; hasReacted: boolean }>);

    return (
      <View style={styles.reactionsContainer}>
        {Object.values(groupedReactions).map((reaction, index) => (
          <Pressable
            key={index}
            style={[
              styles.reactionBubble,
              reaction.hasReacted && { backgroundColor: theme.primary + '30' },
            ]}
            onPress={() => onReactionPress?.(message.id, reaction.emoji)}
          >
            <ThemedText style={styles.reactionEmoji}>{reaction.emoji}</ThemedText>
            <ThemedText style={styles.reactionCount}>{reaction.count}</ThemedText>
          </Pressable>
        ))}
      </View>
    );
  };

  // Вспомогательная функция для получения медиа данных
  const getMediaUrl = () => message.mediaUrl || message.media?.uri;
  const getMediaFileName = () => message.mediaFileName || message.media?.name;
  const getMediaDuration = () => message.mediaDuration || message.media?.duration || 0;

  const renderContent = () => {
    switch (message.type) {
      case 'voice':
        const duration = getMediaDuration();
        return (
          <View style={styles.voiceMessage}>
            <Pressable style={styles.playButton}>
              <Feather name="play" size={18} color={isOwn ? '#fff' : theme.primary} />
            </Pressable>
            <View style={styles.waveform}>
              {[...Array(20)].map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.waveformBar,
                    { 
                      height: Math.random() * 20 + 5, 
                      backgroundColor: isOwn ? 'rgba(255,255,255,0.6)' : theme.primary + '60' 
                    },
                  ]}
                />
              ))}
            </View>
            <ThemedText style={[styles.duration, { color: isOwn ? 'rgba(255,255,255,0.7)' : theme.textSecondary }]}>
              {duration ? `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}` : '0:00'}
            </ThemedText>
          </View>
        );

      case 'image':
        return (
          <Pressable style={styles.imageContainer}>
            <Image source={{ uri: getMediaUrl() }} style={styles.messageImage} resizeMode="cover" />
          </Pressable>
        );

      case 'file':
        return (
          <View style={styles.fileMessage}>
            <View style={[styles.fileIcon, { backgroundColor: isOwn ? 'rgba(255,255,255,0.2)' : theme.backgroundSecondary }]}>
              <Feather name="file-text" size={24} color={isOwn ? '#fff' : theme.primary} />
            </View>
            <View style={styles.fileInfo}>
              <ThemedText style={[styles.fileName, { color: isOwn ? '#fff' : theme.text }]} numberOfLines={1}>
                {getMediaFileName() || 'Файл'}
              </ThemedText>
              <ThemedText style={[styles.fileSize, { color: isOwn ? 'rgba(255,255,255,0.7)' : theme.textSecondary }]}>
                Нажмите для скачивания
              </ThemedText>
            </View>
            <Feather name="download" size={20} color={isOwn ? '#fff' : theme.primary} />
          </View>
        );

      case 'system':
        return (
          <View style={[styles.systemMessage, { backgroundColor: theme.backgroundSecondary }]}>
            <ThemedText style={[styles.systemText, { color: theme.textSecondary }]}>
              {message.text}
            </ThemedText>
          </View>
        );

      default:
        return (
          <ThemedText style={[styles.messageText, { color: isOwn ? '#fff' : theme.text }]}>
            {message.text}
            {message.isEdited && (
              <ThemedText style={[styles.editedLabel, { color: isOwn ? 'rgba(255,255,255,0.6)' : theme.textSecondary }]}>
                {' (ред.)'}
              </ThemedText>
            )}
          </ThemedText>
        );
    }
  };

  if (message.type === 'system') {
    return (
      <View style={styles.systemContainer}>
        {renderContent()}
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
      {showAvatar && !isOwn && (
        <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
          <ThemedText style={styles.avatarText}>
            {message.senderName?.charAt(0).toUpperCase() || '?'}
          </ThemedText>
        </View>
      )}

      <Pressable
        onLongPress={() => onLongPress?.(message)}
        delayLongPress={300}
        style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
      >
        <LinearGradient
          colors={isOwn ? [theme.primary, theme.primary + 'DD'] : [theme.backgroundSecondary, theme.backgroundSecondary]}
          style={[
            styles.bubble,
            isOwn ? styles.ownBubble : styles.otherBubble,
            showAvatar && !isOwn && styles.bubbleWithAvatar,
          ]}
        >
          {showAvatar && !isOwn && (
            <ThemedText style={[styles.senderName, { color: theme.primary }]}>
              {message.senderName}
            </ThemedText>
          )}

          {renderReplyPreview()}
          {renderContent()}

          <View style={styles.footer}>
            <ThemedText style={[styles.time, { color: isOwn ? 'rgba(255,255,255,0.7)' : theme.textSecondary }]}>
              {new Date(message.createdAt || message.timestamp).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
            </ThemedText>
            {renderStatus()}
          </View>
        </LinearGradient>

        {renderReactions()}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 2,
    paddingHorizontal: Spacing.md,
  },
  ownContainer: {
    justifyContent: 'flex-end',
  },
  otherContainer: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    alignSelf: 'flex-end',
  },
  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  bubble: {
    maxWidth: '80%',
    padding: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  ownBubble: {
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    borderBottomLeftRadius: 4,
  },
  bubbleWithAvatar: {
    marginLeft: 0,
  },
  senderName: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  editedLabel: {
    fontSize: 12,
    fontStyle: 'italic',
  },
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
  statusIcon: {
    marginLeft: 2,
  },
  replyPreview: {
    flexDirection: 'row',
    padding: 6,
    borderRadius: 6,
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
  reactionsContainer: {
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
  voiceMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 180,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveform: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 30,
  },
  waveformBar: {
    width: 3,
    borderRadius: 2,
  },
  duration: {
    fontSize: 12,
    minWidth: 35,
    textAlign: 'right',
  },
  imageContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    marginVertical: 4,
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
  },
  fileMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 200,
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
  systemContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  systemMessage: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  systemText: {
    fontSize: 13,
  },
});
