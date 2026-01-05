/**
 * CHATS LIST SCREEN V2
 * Экран списка чатов с новой архитектурой
 * 
 * Структура:
 * - Header с заголовком и кнопками
 * - ChatListWidget со списком чатов
 * - BottomNavigation (опционально, если не в TabNavigator)
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Alert,
  StatusBar,
  TextInput,
  Platform,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/ThemedText';
import { useAuth } from '@/context/AuthContext';
import ChatService, { PrivateChat } from '@/services/ChatService';
import { wsClient } from '@/lib/websocket';

import {
  ChatListWidget,
  TelegramDarkColors as colors,
  TelegramSizes as sizes,
  TelegramTypography as typography,
  type Chat,
} from '@/components/chat/v2';

// ======================
// HEADER COMPONENT
// ======================
function ChatsHeader({
  isSearchMode,
  searchText,
  onSearchChange,
  onSearchPress,
  onNewChatPress,
  onCloseSearch,
}: {
  isSearchMode: boolean;
  searchText: string;
  onSearchChange: (text: string) => void;
  onSearchPress: () => void;
  onNewChatPress: () => void;
  onCloseSearch: () => void;
}) {
  const insets = useSafeAreaInsets();

  if (isSearchMode) {
    return (
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 8) }]}>
        <Pressable style={styles.headerButton} onPress={onCloseSearch}>
          <Feather name="arrow-left" size={24} color={colors.primary} />
        </Pressable>
        
        <TextInput
          style={styles.searchInput}
          value={searchText}
          onChangeText={onSearchChange}
          placeholder="Поиск..."
          placeholderTextColor={colors.textTertiary}
          autoFocus
        />
        
        {searchText.length > 0 && (
          <Pressable 
            style={styles.headerButton} 
            onPress={() => onSearchChange('')}
          >
            <Feather name="x" size={20} color={colors.textSecondary} />
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.header, { paddingTop: Math.max(insets.top, 8) }]}>
      <Pressable 
        style={styles.headerButton}
        onPress={() => console.log('Edit mode')}
      >
        <ThemedText style={[styles.headerEditButton, { color: colors.primary }]}>
          Edit
        </ThemedText>
      </Pressable>
      
      <View style={styles.headerCenter}>
        <View style={styles.headerTitleContainer}>
          <Feather name="folder" size={18} color={colors.textPrimary} style={{ marginRight: 6 }} />
          <ThemedText style={styles.headerTitle}>Чаты</ThemedText>
        </View>
      </View>
      
      <View style={styles.headerRight}>
        <Pressable 
          style={styles.headerButton}
          onPress={onSearchPress}
        >
          <Feather name="search" size={22} color={colors.primary} />
        </Pressable>
        
        <Pressable 
          style={styles.headerButton}
          onPress={onNewChatPress}
        >
          <Feather name="edit" size={22} color={colors.primary} />
        </Pressable>
      </View>
    </View>
  );
}

// ======================
// MAIN SCREEN
// ======================
export default function ChatsListScreenV2() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  // Состояние
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [isSearchMode, setIsSearchMode] = useState(false);

  // Загрузка чатов
  const loadChats = useCallback(async () => {
    try {
      if (!user?.id) return;
      
      const userChats = await ChatService.getUserChats(user.id);
      
      console.log('[ChatsListScreenV2] Raw chats from server:', userChats.map((c: any) => ({
        id: c.id,
        otherUserAvatarUrl: c.otherUser?.avatarUrl,
        otherUserName: c.otherUser?.firstName,
      })));
      
      // Преобразуем в формат Chat
      const formattedChats: Chat[] = userChats.map((chat: any) => {
        // Определяем ID собеседника
        const otherUserId = chat.user1Id === user?.id ? chat.user2Id : chat.user1Id;
        
        // Получаем текст последнего сообщения
        let lastMessageText = '';
        if (chat.lastMessage) {
          if (chat.lastMessage.message) {
            lastMessageText = chat.lastMessage.message;
          } else if (chat.lastMessage.mediaType) {
            const mediaLabels: Record<string, string> = {
              'photo': '📷 Фото',
              'video': '📹 Видео',
              'video_circle': '🔵 Видеосообщение',
              'audio': '🎵 Аудио',
              'document': '📎 Файл',
            };
            lastMessageText = mediaLabels[chat.lastMessage.mediaType] || '📎 Вложение';
          }
        }
        
        return {
          id: chat.id,
          name: chat.otherUser?.firstName 
            ? `${chat.otherUser.firstName}${chat.otherUser.lastName ? ` ${chat.otherUser.lastName}` : ''}`
            : chat.otherUser?.username 
              ? `@${chat.otherUser.username}`
              : 'Пользователь',
          avatar: chat.otherUser?.avatarUrl || null,
          lastMessage: lastMessageText || undefined,
          lastMessageTime: chat.lastMessage?.createdAt || chat.lastMessageAt || undefined,
          unreadCount: chat.unreadCount || 0,
          isOnline: chat.otherUser?.isOnline || false,
          isPinned: chat.isPinned || false,
          isMuted: chat.isMuted || false,
          status: chat.otherUser?.status || chat.otherUser?.bio,
          lastSeenAt: chat.otherUser?.lastSeenAt,
          otherUserId,
        };
      });
      
      setChats(formattedChats);
    } catch (error) {
      console.error('Ошибка загрузки чатов:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить чаты');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  // Загрузка при фокусе
  useFocusEffect(
    useCallback(() => {
      loadChats();
    }, [loadChats])
  );

  // WebSocket подписка на новые сообщения
  useEffect(() => {
    if (!user?.id) return;

    // Подключаем WebSocket
    wsClient.connect(user.id, []);

    // Обработчик новых сообщений - обновляем список чатов
    const handleNewMessage = () => {
      // Перезагружаем список чатов при получении нового сообщения
      loadChats();
      
      // Haptic feedback
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    };

    wsClient.on('message', handleNewMessage);

    return () => {
      wsClient.off('message', handleNewMessage);
    };
  }, [user?.id, loadChats]);

  // Обновление
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadChats();
  }, [loadChats]);

  // Фильтрация чатов
  const filteredChats = searchText.trim() === ''
    ? chats
    : chats.filter(chat => 
        chat.name.toLowerCase().includes(searchText.toLowerCase()) ||
        chat.lastMessage?.toLowerCase().includes(searchText.toLowerCase())
      );

  // Открытие чата
  const handleChatPress = useCallback((chat: Chat) => {
    (navigation.navigate as any)('ChatNew', {
      chatId: chat.id,
      otherUserId: chat.otherUserId,
      otherUserName: chat.name,
      otherUserAvatar: chat.avatar,
      isOnline: chat.isOnline,
    });
  }, [navigation]);

  // Удаление чата
  const handleDeleteChat = useCallback((chatId: number) => {
    Alert.alert(
      'Удалить чат',
      'Вы уверены, что хотите удалить этот чат?',
      [
        { text: 'Отмена', style: 'cancel' },
        { 
          text: 'Удалить', 
          style: 'destructive',
          onPress: () => {
            setChats(prev => prev.filter(c => c.id !== chatId));
            // TODO: ChatService.deleteChat(chatId)
          }
        },
      ]
    );
  }, []);

  // Закрепление чата
  const handlePinChat = useCallback(async (chatId: number) => {
    const chat = chats.find(c => c.id === chatId);
    const newPinState = !chat?.isPinned;
    
    // Optimistic update
    setChats(prev => prev.map(c => 
      c.id === chatId 
        ? { ...c, isPinned: newPinState }
        : c
    ));
    
    try {
      await fetch(`${process.env.EXPO_PUBLIC_API_URL || ''}/api/chats/${chatId}/pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, isPinned: newPinState }),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      // Revert on error
      setChats(prev => prev.map(c => 
        c.id === chatId 
          ? { ...c, isPinned: !newPinState }
          : c
      ));
      console.error('Failed to pin chat:', error);
    }
  }, [chats, user?.id]);

  // Отключение уведомлений чата
  const handleMuteChat = useCallback(async (chatId: number) => {
    const chat = chats.find(c => c.id === chatId);
    const newMuteState = !chat?.isMuted;
    
    // Optimistic update
    setChats(prev => prev.map(c => 
      c.id === chatId 
        ? { ...c, isMuted: newMuteState }
        : c
    ));
    
    try {
      await fetch(`${process.env.EXPO_PUBLIC_API_URL || ''}/api/chats/${chatId}/mute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, isMuted: newMuteState }),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      // Revert on error
      setChats(prev => prev.map(c => 
        c.id === chatId 
          ? { ...c, isMuted: !newMuteState }
          : c
      ));
      console.error('Failed to mute chat:', error);
    }
  }, [chats, user?.id]);

  // Новый чат
  const handleNewChat = useCallback(() => {
    (navigation.navigate as any)('NewChat');
  }, [navigation]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <ChatsHeader
        isSearchMode={isSearchMode}
        searchText={searchText}
        onSearchChange={setSearchText}
        onSearchPress={() => setIsSearchMode(true)}
        onNewChatPress={handleNewChat}
        onCloseSearch={() => {
          setIsSearchMode(false);
          setSearchText('');
        }}
      />
      
      {/* Chat List */}
      <ChatListWidget
        chats={filteredChats}
        onChatPress={handleChatPress}
        onDeleteChat={handleDeleteChat}
        onPinChat={handlePinChat}
        onMuteChat={handleMuteChat}
        onRefresh={handleRefresh}
        refreshing={refreshing}
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
    backgroundColor: colors.background,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sizes.paddingL,
    paddingBottom: sizes.paddingM,
    backgroundColor: colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerEditButton: {
    fontSize: 17,
    fontWeight: '400',
  },
  headerCenter: {
    flex: 2,
    alignItems: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Search
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: colors.surface,
    borderRadius: sizes.radiusM,
    paddingHorizontal: sizes.paddingM,
    marginHorizontal: sizes.paddingS,
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },
});
