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
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/ThemedText';
import { useAuth } from '@/context/AuthContext';
import ChatService, { PrivateChat } from '@/services/ChatService';

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
      <ThemedText style={styles.headerTitle}>Чаты</ThemedText>
      
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
      
      // Преобразуем в формат Chat
      const formattedChats: Chat[] = userChats.map(chat => ({
        id: chat.id,
        name: chat.otherUser?.firstName 
          ? `${chat.otherUser.firstName}${chat.otherUser.lastName ? ` ${chat.otherUser.lastName}` : ''}`
          : chat.otherUser?.username 
            ? `@${chat.otherUser.username}`
            : 'Пользователь',
        avatar: chat.otherUser?.avatarUrl,
        lastMessage: undefined, // Последнее сообщение нужно загружать отдельно
        lastMessageTime: chat.lastMessageAt || undefined,
        unreadCount: 0, // TODO: добавить в API
        isOnline: chat.otherUser?.isOnline || false,
        isPinned: false, // TODO: добавить в API
        isMuted: false,  // TODO: добавить в API
        status: chat.otherUser?.status || chat.otherUser?.bio,
      }));
      
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
    // Находим оригинальный чат для получения otherUserId
    const originalChat = chats.find(c => c.id === chat.id);
    
    (navigation.navigate as any)('ChatNew', {
      chatId: chat.id,
      otherUserId: originalChat?.id, // TODO: нужно хранить otherUserId
      otherUserName: chat.name,
      otherUserAvatar: chat.avatar,
      isOnline: chat.isOnline,
    });
  }, [navigation, chats]);

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
  const handlePinChat = useCallback((chatId: number) => {
    setChats(prev => prev.map(chat => 
      chat.id === chatId 
        ? { ...chat, isPinned: !chat.isPinned }
        : chat
    ));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

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
  headerTitle: {
    ...typography.titleLarge,
    color: colors.textPrimary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
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
