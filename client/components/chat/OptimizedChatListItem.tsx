/**
 * TELEGRAM-STYLE OPTIMIZED CHAT LIST ITEM
 * 
 * Особенности:
 * - Плотный двухколоночный макет
 * - Свайп-жесты
 * - Оптимизация для виртуализированного списка
 * - Минимум перерисовок
 */

import React, { useRef, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  Pressable, 
  Animated, 
  PanResponder,
  Dimensions,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { Chat, MessageStatus } from '@/store/ChatStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = 80;

interface OptimizedChatListItemProps {
  chat: Chat;
  onPress: () => void;
  onLongPress?: () => void;
  onPin: () => void;
  onMute: () => void;
  onArchive: () => void;
  onDelete: () => void;
  height?: number;
}

function OptimizedChatListItem({
  chat,
  onPress,
  onLongPress,
  onPin,
  onMute,
  onArchive,
  onDelete,
  height = 72,
}: OptimizedChatListItemProps) {
  const { theme } = useTheme();
  const translateX = useRef(new Animated.Value(0)).current;

  // Pan responder для свайпов
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 15 && Math.abs(gestureState.dy) < 15;
      },
      onPanResponderMove: (_, gestureState) => {
        translateX.setValue(gestureState.dx);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > SWIPE_THRESHOLD) {
          // Свайп вправо - закрепить
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
          onPin();
        } else if (gestureState.dx < -SWIPE_THRESHOLD) {
          // Свайп влево - архивировать
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
          onArchive();
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // Цвет аватара
  const getAvatarColor = useCallback(() => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFB347', '#DDA0DD', '#8B5CF6', '#F093FB'];
    return colors[chat.name.charCodeAt(0) % colors.length];
  }, [chat.name]);

  // Форматирование времени
  const formatTime = useCallback((timestamp?: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - timestamp;
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
  }, []);

  // Превью последнего сообщения
  const getLastMessagePreview = useCallback(() => {
    if (!chat.lastMessage) {
      return chat.draft?.text ? `✏️ ${chat.draft.text}` : 'Нет сообщений';
    }
    
    const msg = chat.lastMessage;
    switch (msg.type) {
      case 'voice':
        return '🎤 Голосовое';
      case 'image':
        return '📷 Фото';
      case 'file':
        return `📎 ${msg.mediaFileName || 'Файл'}`;
      default:
        return msg.text || '';
    }
  }, [chat.lastMessage, chat.draft]);

  // Иконка статуса
  const renderStatusIcon = () => {
    if (!chat.lastMessage) return null;
    
    const status = chat.lastMessage.status;
    switch (status) {
      case 'sending':
        return <Feather name="clock" size={13} color={theme.textSecondary} />;
      case 'sent':
        return <Feather name="check" size={13} color={theme.textSecondary} />;
      case 'delivered':
        return <MaterialCommunityIcons name="check-all" size={13} color={theme.textSecondary} />;
      case 'read':
        return <MaterialCommunityIcons name="check-all" size={13} color="#4ECDC4" />;
      case 'failed':
        return <Feather name="alert-circle" size={13} color={theme.error} />;
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { height }]}>
      {/* Свайп фон - слева (закрепить) */}
      <View style={[styles.swipeBackground, styles.swipeLeft]}>
        <LinearGradient
          colors={['#4ECDC4', '#45B7D1']}
          style={styles.swipeAction}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Feather name={chat.isPinned ? 'bookmark' : 'bookmark'} size={22} color="#fff" />
          <ThemedText style={styles.swipeText}>
            {chat.isPinned ? 'Открепить' : 'Закрепить'}
          </ThemedText>
        </LinearGradient>
      </View>

      {/* Свайп фон - справа (архив) */}
      <View style={[styles.swipeBackground, styles.swipeRight]}>
        <LinearGradient
          colors={['#FF8E8E', '#FF6B6B']}
          style={[styles.swipeAction, styles.swipeActionRight]}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 0 }}
        >
          <ThemedText style={styles.swipeText}>Архив</ThemedText>
          <Feather name="archive" size={22} color="#fff" />
        </LinearGradient>
      </View>

      {/* Основной контент */}
      <Animated.View
        style={[
          styles.content,
          { transform: [{ translateX }] },
        ]}
        {...panResponder.panHandlers}
      >
        <Pressable
          style={({ pressed }) => [
            styles.pressable,
            { 
              backgroundColor: pressed 
                ? theme.backgroundSecondary 
                : chat.isPinned 
                  ? theme.primary + '08' 
                  : theme.backgroundDefault,
            },
          ]}
          onPress={onPress}
          onLongPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onLongPress?.();
          }}
          delayLongPress={400}
        >
          {/* Аватар */}
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: getAvatarColor() }]}>
              <ThemedText style={styles.avatarText}>
                {chat.name.charAt(0).toUpperCase()}
              </ThemedText>
            </View>
            {chat.type === 'private' && chat.otherUser?.isOnline && (
              <View style={styles.onlineIndicator} />
            )}
          </View>

          {/* Контент */}
          <View style={styles.textContent}>
            {/* Верхняя строка: имя + время */}
            <View style={styles.topRow}>
              <View style={styles.nameContainer}>
                {chat.type === 'group' && (
                  <Feather 
                    name="users" 
                    size={13} 
                    color={theme.textSecondary} 
                    style={styles.typeIcon} 
                  />
                )}
                {chat.type === 'channel' && (
                  <Feather 
                    name="radio" 
                    size={13} 
                    color={theme.textSecondary} 
                    style={styles.typeIcon} 
                  />
                )}
                <ThemedText style={styles.name} numberOfLines={1}>
                  {chat.name}
                </ThemedText>
                {chat.isMuted && (
                  <Feather 
                    name="volume-x" 
                    size={12} 
                    color={theme.textSecondary} 
                    style={styles.muteIcon} 
                  />
                )}
              </View>
              
              <View style={styles.timeContainer}>
                {renderStatusIcon()}
                <ThemedText 
                  style={[
                    styles.time,
                    { color: chat.unreadCount > 0 ? theme.primary : theme.textSecondary }
                  ]}
                >
                  {formatTime(chat.lastMessage?.createdAt || chat.updatedAt)}
                </ThemedText>
              </View>
            </View>

            {/* Нижняя строка: сообщение + badges */}
            <View style={styles.bottomRow}>
              <ThemedText 
                style={[styles.preview, { color: theme.textSecondary }]} 
                numberOfLines={1}
              >
                {getLastMessagePreview()}
              </ThemedText>
              
              <View style={styles.badges}>
                {chat.isPinned && (
                  <Feather 
                    name="bookmark" 
                    size={12} 
                    color={theme.primary} 
                    style={styles.pinnedIcon} 
                  />
                )}
                {chat.unreadCount > 0 && (
                  <View 
                    style={[
                      styles.unreadBadge, 
                      { backgroundColor: chat.isMuted ? theme.textSecondary : theme.primary }
                    ]}
                  >
                    <ThemedText style={styles.unreadText}>
                      {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                    </ThemedText>
                  </View>
                )}
              </View>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

// Мемоизация для предотвращения лишних ререндеров
export default React.memo(OptimizedChatListItem, (prev, next) => {
  return (
    prev.chat.id === next.chat.id &&
    prev.chat.name === next.chat.name &&
    prev.chat.lastMessage?.id === next.chat.lastMessage?.id &&
    prev.chat.lastMessage?.status === next.chat.lastMessage?.status &&
    prev.chat.unreadCount === next.chat.unreadCount &&
    prev.chat.isPinned === next.chat.isPinned &&
    prev.chat.isMuted === next.chat.isMuted &&
    prev.chat.otherUser?.isOnline === next.chat.otherUser?.isOnline
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },

  // Свайп фон
  swipeBackground: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: SCREEN_WIDTH,
  },
  swipeLeft: {
    left: -SCREEN_WIDTH + 80,
  },
  swipeRight: {
    right: -SCREEN_WIDTH + 80,
  },
  swipeAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 8,
  },
  swipeActionRight: {
    justifyContent: 'flex-end',
  },
  swipeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },

  // Контент
  content: {
    flex: 1,
  },
  pressable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  // Аватар
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#31A24C',
    borderWidth: 2,
    borderColor: '#fff',
  },

  // Текст
  textContent: {
    flex: 1,
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  nameContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIcon: {
    marginRight: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  muteIcon: {
    marginLeft: 4,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 8,
  },
  time: {
    fontSize: 12,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  preview: {
    flex: 1,
    fontSize: 14,
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    gap: 6,
  },
  pinnedIcon: {
    marginRight: 0,
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
    fontSize: 11,
    fontWeight: '700',
  },
});
