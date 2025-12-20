import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius, Colors } from '@/constants/theme';
import type { Chat } from '@/types/chat';

interface ChatListItemProps {
  chat: Chat;
  onPress: () => void;
}

export function ChatListItem({ chat, onPress }: ChatListItemProps) {
  const { theme } = useTheme();

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'только что';
    if (diffMins < 60) return `${diffMins} мин`;
    if (diffHours < 24) return `${diffHours} ч`;
    if (diffDays === 1) return 'вчера';
    if (diffDays < 7) return `${diffDays} дн`;
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  const getChatIcon = () => {
    switch (chat.type) {
      case 'class':
        return 'users';
      case 'group':
        return 'users';
      case 'private':
        return 'user';
      default:
        return 'message-circle';
    }
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        { backgroundColor: pressed ? theme.backgroundSecondary : 'transparent' },
      ]}
    >
      {/* Аватар */}
      <View style={[styles.avatar, { backgroundColor: theme.primary + '15' }]}>
        {chat.avatar ? (
          <ThemedText type="h4">{chat.avatar}</ThemedText>
        ) : (
          <Feather name={getChatIcon() as any} size={24} color={theme.primary} />
        )}
      </View>

      {/* Содержимое */}
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <ThemedText type="body" style={styles.chatName} numberOfLines={1}>
              {chat.name}
            </ThemedText>
            {chat.isPinned && (
              <Feather name="bookmark" size={14} color={Colors.light.yellowAccent} style={{ marginLeft: Spacing.xs }} />
            )}
          </View>
          {chat.lastMessage && (
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              {formatTime(chat.lastMessage.createdAt)}
            </ThemedText>
          )}
        </View>

        <View style={styles.footer}>
          <View style={styles.messageRow}>
            {/* Индикатор отправителя для групповых чатов */}
            {chat.type !== 'private' && chat.lastMessage && (
              <ThemedText type="small" style={{ color: Colors.light.primary, fontWeight: '600' }}>
                {chat.lastMessage.senderName}:{' '}
              </ThemedText>
            )}
            
            {/* Превью последнего сообщения */}
            <ThemedText
              type="small"
              style={[
                styles.lastMessage,
                { color: chat.unreadCount > 0 ? theme.text : theme.textSecondary },
              ]}
              numberOfLines={1}
            >
              {chat.lastMessage?.text || 'Нет сообщений'}
            </ThemedText>
          </View>

          {/* Непрочитанные сообщения / Муте */}
          <View style={styles.badges}>
            {chat.isMuted && (
              <Feather name="volume-x" size={16} color={theme.textSecondary} />
            )}
            {chat.unreadCount > 0 && (
              <View style={[styles.unreadBadge, { backgroundColor: Colors.light.primary }]}>
                <ThemedText type="caption" style={styles.unreadText}>
                  {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                </ThemedText>
              </View>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: Spacing.xs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  chatName: {
    fontWeight: '600',
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messageRow: {
    flex: 1,
    flexDirection: 'row',
    marginRight: Spacing.sm,
  },
  lastMessage: {
    flex: 1,
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xs,
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
