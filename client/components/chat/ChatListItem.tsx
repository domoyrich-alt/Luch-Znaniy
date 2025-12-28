import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { Chat } from '@/types/chat';
import { Spacing, BorderRadius } from '@/constants/theme';

interface ChatListItemProps {
  chat: Chat;
  onPress: (chat: Chat) => void;
  onLongPress?: (chat: Chat) => void;
}

export function ChatListItem({ chat, onPress, onLongPress }: ChatListItemProps) {
  const { theme } = useTheme();

  // Используем name или title для обратной совместимости
  const chatName = chat.name || chat.title || '';

  const getAvatarColor = () => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#8B5CF6'];
    const index = chatName.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const formatTime = (dateString?: string | number) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Вчера';
    } else if (days < 7) {
      return date.toLocaleDateString('ru', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('ru', { day: '2-digit', month: '2-digit' });
    }
  };

  const getLastMessagePreview = () => {
    if (!chat.lastMessage) return 'Нет сообщений';
    
    const prefix = chat.type === 'group' && chat.lastMessage.senderName 
      ? `${chat.lastMessage.senderName}: ` 
      : '';

    switch (chat.lastMessage.type) {
      case 'voice':
        return `${prefix}🎤 Голосовое сообщение`;
      case 'image':
        return `${prefix}📷 Фото`;
      case 'file':
        return `${prefix}📎 ${chat.lastMessage.mediaFileName || chat.lastMessage.media?.name || 'Файл'}`;
      default:
        return `${prefix}${chat.lastMessage.text}`;
    }
  };

  // Получить время последнего сообщения
  const getLastMessageTime = () => {
    const msg = chat.lastMessage;
    if (!msg) return chat.updatedAt;
    return msg.createdAt || (msg.timestamp ? new Date(msg.timestamp).toISOString() : undefined) || chat.updatedAt;
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        { backgroundColor: pressed ? theme.backgroundSecondary : theme.backgroundDefault },
        chat.isPinned && styles.pinnedContainer,
      ]}
      onPress={() => onPress(chat)}
      onLongPress={() => onLongPress?.(chat)}
    >
      {/* Аватар */}
      <View style={styles.avatarSection}>
        <View style={[styles.avatar, { backgroundColor: getAvatarColor() }]}>
          <ThemedText style={styles.avatarText}>
            {chatName.charAt(0).toUpperCase()}
          </ThemedText>
        </View>
        {/* Онлайн индикатор */}
        {chat.type === 'private' && chat.participants[0]?.isOnline && (
          <View style={styles.onlineIndicator} />
        )}
      </View>

      {/* Контент */}
      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.titleRow}>
            {chat.type === 'group' && (
              <Feather name="users" size={14} color={theme.textSecondary} style={{ marginRight: 4 }} />
            )}
            <ThemedText style={styles.title} numberOfLines={1}>
              {chatName}
            </ThemedText>
            {chat.isMuted && (
              <Feather name="volume-x" size={14} color={theme.textSecondary} style={{ marginLeft: 4 }} />
            )}
          </View>
          <View style={styles.rightSection}>
            {chat.lastMessage?.status === 'read' && (
              <Feather name="check" size={14} color="#4ECDC4" />
            )}
            <ThemedText style={[styles.time, { color: chat.unreadCount > 0 ? theme.primary : theme.textSecondary }]}>
              {formatTime(getLastMessageTime())}
            </ThemedText>
          </View>
        </View>

        <View style={styles.bottomRow}>
          <ThemedText style={[styles.preview, { color: theme.textSecondary }]} numberOfLines={1}>
            {getLastMessagePreview()}
          </ThemedText>
          
          <View style={styles.badges}>
            {chat.isPinned && (
              <Feather name="bookmark" size={14} color={theme.textSecondary} />
            )}
            {chat.unreadCount > 0 && (
              <View style={[styles.unreadBadge, { backgroundColor: chat.isMuted ? theme.textSecondary : theme.primary }]}>
                <ThemedText style={styles.unreadText}>
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
    padding: Spacing.md,
    alignItems: 'center',
  },
  pinnedContainer: {
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  avatarSection: {
    position: 'relative',
    marginRight: Spacing.md,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#fff',
  },
  content: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  time: {
    fontSize: 13,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  preview: {
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
