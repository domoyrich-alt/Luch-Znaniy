import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius, Colors } from '@/constants/theme';
import type { Message, Reaction } from '@/types/chat';

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  onLongPress?: () => void;
  onReactionPress?: (emoji: string) => void;
  onReplyPress?: () => void;
}

export function MessageBubble({
  message,
  isOwnMessage,
  onLongPress,
  onReactionPress,
  onReplyPress,
}: MessageBubbleProps) {
  const { theme } = useTheme();

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusIcon = () => {
    switch (message.status) {
      case 'sending':
        return <Feather name="clock" size={14} color={isOwnMessage ? '#FFFFFF99' : theme.textSecondary} />;
      case 'sent':
        return <Feather name="check" size={14} color={isOwnMessage ? '#FFFFFF99' : theme.textSecondary} />;
      case 'delivered':
        return (
          <View style={{ flexDirection: 'row', marginLeft: -4 }}>
            <Feather name="check" size={14} color={isOwnMessage ? '#FFFFFF99' : theme.textSecondary} />
            <Feather name="check" size={14} color={isOwnMessage ? '#FFFFFF99' : theme.textSecondary} />
          </View>
        );
      case 'read':
        return (
          <View style={{ flexDirection: 'row', marginLeft: -4 }}>
            <Feather name="check" size={14} color={Colors.light.primary} />
            <Feather name="check" size={14} color={Colors.light.primary} />
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <Pressable
      onLongPress={onLongPress}
      style={[styles.container, isOwnMessage ? styles.ownContainer : styles.otherContainer]}
    >
      {/* Переслано из */}
      {message.forwardedFrom && (
        <View style={styles.forwardedHeader}>
          <Feather name="corner-up-right" size={14} color={theme.textSecondary} />
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            Переслано из {message.forwardedFrom.chatName}
          </ThemedText>
        </View>
      )}

      {/* Ответ на сообщение */}
      {message.replyTo && (
        <View style={[styles.replyContainer, { backgroundColor: isOwnMessage ? '#FFFFFF20' : theme.backgroundSecondary }]}>
          <View style={[styles.replyBorder, { backgroundColor: Colors.light.primary }]} />
          <View style={styles.replyContent}>
            <ThemedText type="caption" style={{ color: Colors.light.primary, fontWeight: '600' }}>
              {message.replyTo.senderName}
            </ThemedText>
            <ThemedText 
              type="small" 
              numberOfLines={1}
              style={{ color: isOwnMessage ? '#FFFFFF99' : theme.textSecondary }}
            >
              {message.replyTo.text || 'Медиафайл'}
            </ThemedText>
          </View>
        </View>
      )}

      {/* Имя отправителя (для групповых чатов) */}
      {!isOwnMessage && (
        <ThemedText type="caption" style={[styles.senderName, { color: Colors.light.primary }]}>
          {message.senderName}
        </ThemedText>
      )}

      {/* Контент сообщения */}
      {message.type === 'text' && message.text && (
        <ThemedText type="body" style={isOwnMessage ? styles.ownMessageText : {}}>
          {message.text}
        </ThemedText>
      )}

      {message.type === 'voice' && (
        <View style={styles.voiceContainer}>
          <Feather name="mic" size={20} color={isOwnMessage ? '#FFFFFF' : theme.primary} />
          <View style={styles.waveform}>
            {[...Array(20)].map((_, i) => (
              <View
                key={i}
                style={[
                  styles.waveformBar,
                  {
                    height: Math.random() * 20 + 10,
                    backgroundColor: isOwnMessage ? '#FFFFFF' : theme.primary,
                  },
                ]}
              />
            ))}
          </View>
          <ThemedText type="caption" style={{ color: isOwnMessage ? '#FFFFFF' : theme.text }}>
            {message.voiceDuration || 0}s
          </ThemedText>
        </View>
      )}

      {message.type === 'image' && message.mediaUrl && (
        <View style={styles.imageContainer}>
          <Feather name="image" size={48} color={isOwnMessage ? '#FFFFFF' : theme.textSecondary} />
        </View>
      )}

      {message.type === 'file' && message.fileName && (
        <View style={styles.fileContainer}>
          <Feather name="file" size={24} color={isOwnMessage ? '#FFFFFF' : theme.primary} />
          <ThemedText type="small" style={{ color: isOwnMessage ? '#FFFFFF' : theme.text }}>
            {message.fileName}
          </ThemedText>
        </View>
      )}

      {/* Закреплено */}
      {message.isPinned && (
        <View style={styles.pinnedIndicator}>
          <Feather name="bookmark" size={12} color={Colors.light.yellowAccent} />
          <ThemedText type="caption" style={{ color: Colors.light.yellowAccent }}>
            Закреплено
          </ThemedText>
        </View>
      )}

      {/* Время и статус */}
      <View style={styles.footer}>
        <ThemedText type="caption" style={[styles.messageTime, { color: isOwnMessage ? '#FFFFFF99' : theme.textSecondary }]}>
          {formatTime(message.createdAt)}
          {message.isEdited && ' (изменено)'}
        </ThemedText>
        {isOwnMessage && <View style={styles.statusIcon}>{getStatusIcon()}</View>}
      </View>

      {/* Реакции */}
      {message.reactions.length > 0 && (
        <View style={[styles.reactionsContainer, { backgroundColor: theme.backgroundRoot }]}>
          {message.reactions.map((reaction, index) => (
            <Pressable
              key={index}
              onPress={() => onReactionPress?.(reaction.emoji)}
              style={styles.reactionBubble}
            >
              <ThemedText type="small">{reaction.emoji}</ThemedText>
            </Pressable>
          ))}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    maxWidth: '80%',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.xs,
  },
  ownContainer: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.light.primary,
  },
  otherContainer: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  ownMessageText: {
    color: '#FFFFFF',
  },
  senderName: {
    fontWeight: '600',
  },
  forwardedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  replyContainer: {
    flexDirection: 'row',
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  replyBorder: {
    width: 3,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.sm,
  },
  replyContent: {
    flex: 1,
    gap: 2,
  },
  voiceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
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
    borderRadius: BorderRadius.sm,
  },
  imageContainer: {
    width: 200,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: BorderRadius.md,
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.sm,
  },
  pinnedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    alignSelf: 'flex-end',
  },
  messageTime: {
    fontSize: 11,
  },
  statusIcon: {
    marginLeft: Spacing.xs,
  },
  reactionsContainer: {
    position: 'absolute',
    bottom: -12,
    right: Spacing.md,
    flexDirection: 'row',
    gap: Spacing.xs,
    padding: Spacing.xs,
    borderRadius: BorderRadius.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reactionBubble: {
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
