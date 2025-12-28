/**
 * TELEGRAM-STYLE CHAT LIST
 * Чистый минималистичный дизайн как в Telegram
 * - Тёмный хедер с поиском
 * - Свайп-действия (влево - удалить, вправо - закрепить/беззвучный)
 * - Чистый и быстрый список чатов
 */

import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  RefreshControl,
  Animated,
  Dimensions,
  Alert,
  PanResponder,
  StatusBar,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/context/AuthContext';
import { wsClient } from '@/lib/websocket';

// НЕОНОВЫЕ ЦВЕТА
const NEON = {
  primary: '#8B5CF6',
  secondary: '#4ECDC4',
  accent: '#FF6B9D',
  bgDark: '#0A0A0F',
  bgCard: '#141420',
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0B0',
  glowPurple: 'rgba(139, 92, 246, 0.5)',
  glowCyan: 'rgba(78, 205, 196, 0.5)',
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_HEIGHT = 76;
const SWIPE_THRESHOLD = 80;
const ACTION_WIDTH = 75;

// ==================== MOCK DATA ====================
const MOCK_CHATS = [
  {
    id: '1',
    name: 'Чат класса 9А',
    avatarUrl: null,
    phoneNumber: '+7 (999) 123-45-67',
    lastMessage: { text: 'Всем привет! Завтра контрольная', senderName: 'Мария', createdAt: Date.now() - 60000 },
    unreadCount: 3,
    isPinned: true,
    isMuted: false,
    type: 'group' as const,
  },
  {
    id: '2', 
    name: 'Школьный психолог',
    avatarUrl: null,
    phoneNumber: '+7 (999) 234-56-78',
    lastMessage: { text: 'Можете записаться на консультацию', senderName: null, createdAt: Date.now() - 3600000 },
    unreadCount: 0,
    isPinned: true,
    isMuted: false,
    type: 'private' as const,
  },
  {
    id: '3',
    name: 'Иван Петров',
    avatarUrl: null,
    phoneNumber: '+7 (999) 345-67-89',
    lastMessage: { text: 'Скинь домашку по математике', senderName: null, createdAt: Date.now() - 7200000 },
    unreadCount: 1,
    isPinned: false,
    isMuted: false,
    type: 'private' as const,
  },
  {
    id: '4',
    name: 'Родительский чат',
    avatarUrl: null,
    phoneNumber: null,
    lastMessage: { text: 'Собрание в пятницу в 18:00', senderName: 'Классный руководитель', createdAt: Date.now() - 86400000 },
    unreadCount: 12,
    isPinned: false,
    isMuted: true,
    type: 'group' as const,
  },
  {
    id: '5',
    name: 'Учительская',
    avatarUrl: null,
    phoneNumber: null,
    lastMessage: { text: 'Напоминаю о педсовете', senderName: 'Директор', createdAt: Date.now() - 172800000 },
    unreadCount: 0,
    isPinned: false,
    isMuted: false,
    type: 'group' as const,
  },
  {
    id: '6',
    name: 'Анна Сидорова',
    avatarUrl: null,
    phoneNumber: '+7 (999) 456-78-90',
    lastMessage: { text: '👍', senderName: null, createdAt: Date.now() - 259200000 },
    unreadCount: 0,
    isPinned: false,
    isMuted: false,
    type: 'private' as const,
  },
];

// ==================== SWIPEABLE CHAT ITEM ====================
interface SwipeableChatItemProps {
  chat: typeof MOCK_CHATS[0];
  onPress: () => void;
  onDelete: (id: string) => void;
  onPin: (id: string, pinned: boolean) => void;
  onMute: (id: string, muted: boolean) => void;
}

const SwipeableChatItem = React.memo(function SwipeableChatItem({ 
  chat, 
  onPress, 
  onDelete,
  onPin,
  onMute,
}: SwipeableChatItemProps) {
  const { theme } = useTheme();
  const translateX = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [isSwipeOpen, setIsSwipeOpen] = useState(false);
  const currentTranslateX = useRef(0);
  
  // Отслеживаем текущее значение translateX
  useEffect(() => {
    const listener = translateX.addListener(({ value }) => {
      currentTranslateX.current = value;
    });
    return () => translateX.removeListener(listener);
  }, [translateX]);
  
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Только если движение достаточно горизонтальное и значительное
        const isHorizontal = Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 2;
        const isSignificant = Math.abs(gestureState.dx) > 15;
        return isHorizontal && isSignificant;
      },
      onPanResponderGrant: () => {
        // Сохраняем текущую позицию
        translateX.setOffset(currentTranslateX.current);
        translateX.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        // Ограничиваем свайп
        const maxSwipeLeft = -ACTION_WIDTH;
        const maxSwipeRight = ACTION_WIDTH * 2;
        const newValue = Math.max(maxSwipeLeft, Math.min(maxSwipeRight, gestureState.dx));
        translateX.setValue(newValue);
      },
      onPanResponderRelease: (_, gestureState) => {
        translateX.flattenOffset();
        
        const velocity = gestureState.vx;
        const currentValue = currentTranslateX.current;
        
        // Определяем конечную позицию на основе скорости и позиции
        let toValue = 0;
        
        if (velocity < -0.5 || (currentValue < -SWIPE_THRESHOLD / 2 && velocity <= 0)) {
          // Свайп влево - показать удаление
          toValue = -ACTION_WIDTH;
          setIsSwipeOpen(true);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } else if (velocity > 0.5 || (currentValue > SWIPE_THRESHOLD / 2 && velocity >= 0)) {
          // Свайп вправо - показать закрепить/беззвучный
          toValue = ACTION_WIDTH * 2;
          setIsSwipeOpen(true);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } else {
          // Вернуть на место
          toValue = 0;
          setIsSwipeOpen(false);
        }
        
        Animated.spring(translateX, {
          toValue,
          useNativeDriver: true,
          friction: 10,
          tension: 100,
        }).start();
      },
    })
  ).current;
  
  const closeSwipe = useCallback(() => {
    setIsSwipeOpen(false);
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      friction: 10,
      tension: 100,
    }).start();
  }, [translateX]);
  
  const handlePress = useCallback(() => {
    if (isSwipeOpen) {
      // Если свайп открыт - закрыть его
      closeSwipe();
    } else {
      // Иначе - открыть чат
      Haptics.selectionAsync();
      onPress();
    }
  }, [isSwipeOpen, closeSwipe, onPress]);
  
  const handlePressIn = () => {
    if (!isSwipeOpen) {
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        useNativeDriver: true,
      }).start();
    }
  };
  
  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  const handleDelete = () => {
    Alert.alert(
      'Удалить чат',
      `Удалить чат с ${chat.name}?`,
      [
        { text: 'Отмена', style: 'cancel', onPress: closeSwipe },
        { 
          text: 'Удалить', 
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            onDelete(chat.id);
          }
        },
      ]
    );
  };

  const handlePin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPin(chat.id, !chat.isPinned);
    closeSwipe();
  };

  const handleMute = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onMute(chat.id, !chat.isMuted);
    closeSwipe();
  };

  const getAvatarColor = () => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFB347', '#DDA0DD', '#8B5CF6', '#F093FB'];
    const index = chat.name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const formatTime = (timestamp: number) => {
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
  };

  const getLastMessagePreview = () => {
    if (!chat.lastMessage) return 'Нет сообщений';
    const prefix = chat.lastMessage.senderName ? `${chat.lastMessage.senderName}: ` : '';
    return prefix + chat.lastMessage.text;
  };

  return (
    <View style={styles.swipeableContainer}>
      {/* Левая сторона - действия при свайпе вправо (закрепить/беззвучный) */}
      <View style={styles.leftActionsContainer}>
        <Pressable
          style={[styles.swipeAction, { backgroundColor: chat.isPinned ? '#8E8E93' : '#8B5CF6' }]}
          onPress={handlePin}
        >
          <Feather name={chat.isPinned ? 'bookmark' : 'bookmark'} size={22} color="#FFFFFF" />
          <ThemedText style={styles.swipeActionText}>
            {chat.isPinned ? 'Открепить' : 'Закрепить'}
          </ThemedText>
        </Pressable>
        <Pressable
          style={[styles.swipeAction, { backgroundColor: chat.isMuted ? '#4ECDC4' : '#FFB347' }]}
          onPress={handleMute}
        >
          <Feather name={chat.isMuted ? 'bell' : 'bell-off'} size={22} color="#FFFFFF" />
          <ThemedText style={styles.swipeActionText}>
            {chat.isMuted ? 'Со звуком' : 'Без звука'}
          </ThemedText>
        </Pressable>
      </View>

      {/* Правая сторона - действие при свайпе влево (удалить) */}
      <View style={styles.rightActionsContainer}>
        <Pressable
          style={[styles.swipeAction, { backgroundColor: '#FF6B6B' }]}
          onPress={handleDelete}
        >
          <Feather name="trash-2" size={22} color="#FFFFFF" />
          <ThemedText style={styles.swipeActionText}>Удалить</ThemedText>
        </Pressable>
      </View>

      {/* Основной контент чата */}
      <Animated.View 
        style={[
          styles.chatItemWrapper,
          { 
            transform: [
              { translateX },
              { scale: scaleAnim }
            ] 
          }
        ]}
        {...panResponder.panHandlers}
      >
        <Pressable
          style={styles.chatItem}
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          {/* Avatar */}
          <View style={[styles.avatar, { backgroundColor: getAvatarColor() }]}>
            <ThemedText style={styles.avatarText}>
              {chat.name.charAt(0).toUpperCase()}
            </ThemedText>
            {chat.type === 'group' && (
              <View style={styles.groupIndicator}>
                <Feather name="users" size={8} color="#fff" />
              </View>
            )}
          </View>

          {/* Content */}
          <View style={styles.chatContent}>
            <View style={styles.topRow}>
              <View style={styles.nameRow}>
                {chat.isPinned && (
                  <Feather 
                    name="bookmark" 
                    size={14} 
                    color="#8B5CF6" 
                    style={{ marginRight: 4 }}
                  />
                )}
                <ThemedText style={styles.chatName} numberOfLines={1}>
                  {chat.name}
                </ThemedText>
              </View>
              <View style={styles.timeRow}>
                {chat.isMuted && (
                  <Feather name="bell-off" size={14} color="#8E8E93" />
                )}
                <ThemedText style={[styles.chatTime, { color: chat.unreadCount > 0 ? '#8B5CF6' : '#8E8E93' }]}>
                  {formatTime(chat.lastMessage?.createdAt || Date.now())}
                </ThemedText>
              </View>
            </View>
            
            <View style={styles.bottomRow}>
              <ThemedText 
                style={styles.lastMessage} 
                numberOfLines={1}
              >
                {getLastMessagePreview()}
              </ThemedText>
              
              {chat.unreadCount > 0 && (
                <View style={[
                  styles.unreadBadge, 
                  { backgroundColor: chat.isMuted ? '#8E8E93' : '#8B5CF6' }
                ]}>
                  <ThemedText style={styles.unreadText}>
                    {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                  </ThemedText>
                </View>
              )}
            </View>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
});

// ==================== CHAT ITEM ====================
interface ChatItemProps {
  chat: typeof MOCK_CHATS[0];
  onPress: () => void;
}

const ChatItem = React.memo(function ChatItem({ chat, onPress }: ChatItemProps) {
  const { theme } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };
  
  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  const getAvatarColor = () => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFB347', '#DDA0DD', '#8B5CF6', '#F093FB'];
    const index = chat.name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const formatTime = (timestamp: number) => {
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
  };

  const getLastMessagePreview = () => {
    if (!chat.lastMessage) return 'Нет сообщений';
    const prefix = chat.lastMessage.senderName ? `${chat.lastMessage.senderName}: ` : '';
    return prefix + chat.lastMessage.text;
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        style={styles.chatItem}
        onPress={() => {
          Haptics.selectionAsync();
          onPress();
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {/* Avatar */}
        <View style={[styles.avatar, { backgroundColor: getAvatarColor() }]}>
          <ThemedText style={styles.avatarText}>
            {chat.name.charAt(0).toUpperCase()}
          </ThemedText>
          {chat.type === 'group' && (
            <View style={styles.groupIndicator}>
              <Feather name="users" size={8} color="#fff" />
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.chatContent}>
          <View style={styles.topRow}>
            <View style={styles.nameRow}>
              {chat.isPinned && (
                <Feather 
                  name="bookmark" 
                  size={14} 
                  color="#8B5CF6" 
                  style={{ marginRight: 4 }}
                />
              )}
              <ThemedText style={styles.chatName} numberOfLines={1}>
                {chat.name}
              </ThemedText>
            </View>
            <View style={styles.timeRow}>
              {chat.isMuted && (
                <Feather name="bell-off" size={14} color="#8E8E93" />
              )}
              <ThemedText style={[styles.chatTime, { color: chat.unreadCount > 0 ? '#8B5CF6' : '#8E8E93' }]}>
                {formatTime(chat.lastMessage?.createdAt || Date.now())}
              </ThemedText>
            </View>
          </View>
          
          <View style={styles.bottomRow}>
            <ThemedText 
              style={styles.lastMessage} 
              numberOfLines={1}
            >
              {getLastMessagePreview()}
            </ThemedText>
            
            {chat.unreadCount > 0 && (
              <View style={[
                styles.unreadBadge, 
                { backgroundColor: chat.isMuted ? '#8E8E93' : '#8B5CF6' }
              ]}>
                <ThemedText style={styles.unreadText}>
                  {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                </ThemedText>
              </View>
            )}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
});

// ==================== MAIN SCREEN ====================
export default function TelegramChatsListScreen() {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation();
  const flatListRef = useRef<FlatList>(null);

  const [searchText, setSearchText] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [chats, setChats] = useState<typeof MOCK_CHATS>([]);
  const [loading, setLoading] = useState(false); // Start with false for instant display

  // Загрузка реальных чатов с сервера - ОПТИМИЗИРОВАНО
  const loadChats = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      // Only show loading on first load if no chats
      if (chats.length === 0) setLoading(true);
      
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.100.110:5000';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout
      
      const response = await fetch(`${API_URL}/api/user/${user.id}/chats`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        // Преобразуем данные с сервера в формат для отображения - ОПТИМИЗИРОВАНО
        const formattedChats = data.map((chat: any) => {
          const otherUserId = chat.user1Id === user.id ? chat.user2Id : chat.user1Id;
          return {
            id: chat.id.toString(),
            name: chat.otherUser?.firstName 
              ? `${chat.otherUser.firstName} ${chat.otherUser.lastName || ''}`.trim()
              : chat.otherUser?.username || 'Пользователь',
            avatarUrl: chat.otherUser?.avatarUrl || null,
            phoneNumber: chat.otherUser?.phoneNumber || null,
            lastMessage: chat.lastMessage ? {
              text: chat.lastMessage.message || chat.lastMessage.text || '',
              senderName: chat.lastMessage.senderId === user.id ? 'Вы' : null,
              createdAt: new Date(chat.lastMessage.createdAt).getTime(),
            } : null,
            unreadCount: chat.unreadCount || 0,
            isPinned: chat.isPinned || false,
            isMuted: chat.isMuted || false,
            type: chat.type || 'private' as const,
            otherUserId: otherUserId,
            isOnline: chat.otherUser?.isOnline || false,
          };
        });
        
        setChats(formattedChats);
        
        // ВАЖНО: Подключаем WebSocket со списком chatIds для получения сообщений в реальном времени
        const chatIds = formattedChats.map((c: any) => c.id);
        wsClient.connect(user.id, chatIds);
      }
    } catch (error) {
      console.error('Load chats error:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  // Подписываемся на входящие сообщения через WebSocket
  useEffect(() => {
    const handleNewMessage = (wsMessage: any) => {
      const { chatId, message } = wsMessage.payload;
      
      setChats(prev => {
        const chatIndex = prev.findIndex(c => c.id === chatId?.toString());
        if (chatIndex === -1) {
          // Новый чат - нужно перезагрузить список
          loadChats();
          return prev;
        }
        
        // Обновляем последнее сообщение в чате
        const updated = [...prev];
        updated[chatIndex] = {
          ...updated[chatIndex],
          lastMessage: {
            text: message.text || message.message || '',
            senderName: message.senderId === user?.id ? 'Вы' : (message.senderName || ''),
            createdAt: message.createdAt || Date.now(),
          },
          unreadCount: message.senderId !== user?.id 
            ? (updated[chatIndex].unreadCount || 0) + 1 
            : updated[chatIndex].unreadCount,
        };
        
        return updated;
      });
    };

    wsClient.on('message', handleNewMessage);
    
    return () => {
      wsClient.off('message', handleNewMessage);
    };
  }, [user?.id, loadChats]);

  // Handlers для свайп-действий
  const handleDeleteChat = useCallback((id: string) => {
    setChats(prev => prev.filter(chat => chat.id !== id));
  }, []);

  const handlePinChat = useCallback((id: string, pinned: boolean) => {
    setChats(prev => prev.map(chat => 
      chat.id === id ? { ...chat, isPinned: pinned } : chat
    ));
  }, []);

  const handleMuteChat = useCallback((id: string, muted: boolean) => {
    setChats(prev => prev.map(chat => 
      chat.id === id ? { ...chat, isMuted: muted } : chat
    ));
  }, []);

  // Фильтрация
  const filteredChats = useMemo(() => {
    if (!searchText) return chats;
    const q = searchText.toLowerCase();
    return chats.filter(chat => 
      chat.name.toLowerCase().includes(q) ||
      chat.lastMessage?.text?.toLowerCase().includes(q)
    );
  }, [chats, searchText]);

  // Сортировка: закреплённые сверху
  const sortedChats = useMemo(() => {
    return [...filteredChats].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return (b.lastMessage?.createdAt || 0) - (a.lastMessage?.createdAt || 0);
    });
  }, [filteredChats]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadChats();
    setRefreshing(false);
  }, [loadChats]);

  const handleChatPress = useCallback((chat: any) => {
    // Сразу обнуляем счётчик непрочитанных в UI для мгновенной отзывчивости
    setChats(prev => prev.map(c => 
      c.id === chat.id ? { ...c, unreadCount: 0 } : c
    ));
    
    // Отмечаем прочитанными на сервере (в фоне)
    if (user?.id) {
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.100.110:5000';
      fetch(`${API_URL}/api/chats/${chat.id}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      }).catch(() => {});
    }
    
    (navigation as any).navigate('TelegramChat', {
      chatId: parseInt(chat.id),
      otherUserId: chat.otherUserId || 1,
      otherUserName: chat.name,
      phoneNumber: chat.phoneNumber,
      chatType: chat.type,
    });
  }, [navigation, user?.id]);

  const renderItem = useCallback(({ item }: { item: typeof MOCK_CHATS[0] }) => (
    <SwipeableChatItem 
      chat={item} 
      onPress={() => handleChatPress(item)} 
      onDelete={handleDeleteChat}
      onPin={handlePinChat}
      onMute={handleMuteChat}
    />
  ), [handleChatPress, handleDeleteChat, handlePinChat, handleMuteChat]);

  const keyExtractor = useCallback((item: typeof MOCK_CHATS[0]) => item.id, []);

  const getItemLayout = useCallback((_: any, index: number) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  }), []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: NEON.bgDark }]} edges={['top']}>
      <StatusBar barStyle="light-content" />

      {/* ТЁМНЫЙ HEADER */}
      <View style={[styles.header, { backgroundColor: NEON.bgDark, borderBottomColor: NEON.primary + '30' }]}>
        <View style={styles.headerTop}>
          <ThemedText style={[styles.headerTitle, { color: NEON.textPrimary }]}>Чаты</ThemedText>
          <Pressable
            style={styles.headerButton}
            onPress={() => (navigation as any).navigate('NewChat')}
          >
            <LinearGradient
              colors={[NEON.primary, NEON.secondary]}
              style={styles.headerButtonGradient}
            >
              <Feather name="edit" size={18} color="#FFFFFF" />
            </LinearGradient>
          </Pressable>
        </View>

        {/* ТЁМНАЯ СТРОКА ПОИСКА */}
        <View style={[styles.searchContainer, { backgroundColor: NEON.bgCard, borderColor: NEON.primary + '30' }]}>
          <Feather name="search" size={18} color={NEON.primary} />
          <TextInput
            style={[styles.searchInput, { color: NEON.textPrimary }]}
            placeholder="Поиск"
            placeholderTextColor={NEON.textSecondary}
            value={searchText}
            onChangeText={setSearchText}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            returnKeyType="search"
          />
          {searchText.length > 0 && (
            <Pressable onPress={() => setSearchText('')}>
              <View style={styles.clearButton}>
                <Feather name="x" size={14} color={NEON.textSecondary} />
              </View>
            </Pressable>
          )}
        </View>
      </View>

      {/* СПИСОК ЧАТОВ */}
      <FlatList
        ref={flatListRef}
        data={sortedChats}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        style={[styles.list, { backgroundColor: NEON.bgDark }]}
        contentContainerStyle={sortedChats.length === 0 ? styles.emptyList : undefined}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={15}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#8B5CF6"
            colors={['#8B5CF6']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Feather name="message-circle" size={48} color="#8E8E93" />
            </View>
            <ThemedText style={styles.emptyTitle}>
              {searchText ? 'Ничего не найдено' : 'Нет чатов'}
            </ThemedText>
            <ThemedText style={styles.emptySubtitle}>
              {searchText 
                ? 'Попробуйте изменить запрос' 
                : 'Начните общение прямо сейчас'}
            </ThemedText>
          </View>
        }
        ItemSeparatorComponent={() => (
          <View style={styles.separator} />
        )}
      />
    </SafeAreaView>
  );
}

// ==================== STYLES ====================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#08080C', // Глубокий тёмный фон с легким фиолетовым оттенком
  },

  // Красивый Header с градиентом
  header: {
    backgroundColor: 'transparent',
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(139, 92, 246, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  headerButton: {
    padding: 6,
  },

  // Красивый Поиск с неоновым свечением
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(139, 92, 246, 0.2)',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    paddingVertical: 0,
    fontWeight: '500',
  },
  clearButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(142, 142, 147, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerButtonGradient: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },

  // Список
  list: {
    flex: 1,
    backgroundColor: '#08080C',
  },
  emptyList: {
    flex: 1,
  },
  separator: {
    height: 1,
    marginLeft: 88,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },

  // Chat Item - Красивый дизайн
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    height: ITEM_HEIGHT,
    backgroundColor: '#08080C',
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  groupIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#08080C',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
  },
  chatContent: {
    flex: 1,
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  nameRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatName: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 10,
  },
  chatTime: {
    fontSize: 14,
    fontWeight: '500',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    flex: 1,
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '400',
  },
  unreadBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    marginLeft: 10,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // Empty State - Красивый дизайн
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 10,
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.5)',
    lineHeight: 24,
  },

  // Swipeable
  swipeableContainer: {
    position: 'relative',
    overflow: 'hidden',
  },
  chatItemWrapper: {
    backgroundColor: '#08080C',
  },
  leftActionsContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightActionsContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  swipeAction: {
    width: ACTION_WIDTH,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  swipeActionText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
});
