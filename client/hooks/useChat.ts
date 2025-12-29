/**
 * ХУКИ ДЛЯ СИСТЕМЫ ЧАТОВ
 * 
 * React хуки для интеграции моделей чата с компонентами:
 * - useChatManager - управление менеджером чатов
 * - useChat - работа с конкретным чатом
 * - useMessages - подписка на сообщения
 * - useTyping - индикатор печатания
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { chatManager, Chat, Message, User, ChatListItem } from '../models';

/**
 * Хук для инициализации и управления ChatManager
 */
export function useChatManager(currentUser: { id: number; firstName: string; lastName: string; username?: string; avatarUrl?: string } | null) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!currentUser) return;

    const user = new User({
      userId: String(currentUser.id),
      firstName: currentUser.firstName,
      lastName: currentUser.lastName,
      username: currentUser.username,
      avatar: currentUser.avatarUrl,
    });

    chatManager.initialize(user)
      .then(() => {
        setIsInitialized(true);
        setChats(chatManager.getSortedChatList());
      })
      .catch((err) => {
        setError(err);
        console.error('[useChatManager] Initialization error:', err);
      });

    // Подписываемся на события
    const unsubscribe = chatManager.subscribe((event) => {
      if (['chat_added', 'chat_removed', 'chat_updated', 'message_received', 'message_sent'].includes(event.type)) {
        setChats(chatManager.getSortedChatList());
      }
    });

    return () => {
      unsubscribe();
    };
  }, [currentUser?.id]);

  const refreshChats = useCallback(async () => {
    await chatManager.loadChats();
    setChats(chatManager.getSortedChatList());
  }, []);

  return {
    isInitialized,
    chats,
    error,
    refreshChats,
    getOrCreateChat: chatManager.getOrCreatePrivateChat.bind(chatManager),
    createGroupChat: chatManager.createGroupChat.bind(chatManager),
  };
}

/**
 * Хук для работы с конкретным чатом
 */
export function useChat(chatId: string | null) {
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const offsetRef = useRef(0);

  useEffect(() => {
    if (!chatId) {
      setChat(null);
      setMessages([]);
      return;
    }

    // Устанавливаем текущий чат
    chatManager.setCurrentChat(chatId);
    
    const currentChat = chatManager.getChat(chatId);
    setChat(currentChat || null);

    // Загружаем сообщения
    setLoading(true);
    offsetRef.current = 0;
    
    chatManager.loadMessages(chatId, 50, 0)
      .then((loadedMessages) => {
        setMessages(loadedMessages);
        setHasMore(loadedMessages.length >= 50);
        offsetRef.current = loadedMessages.length;
      })
      .finally(() => setLoading(false));

    // Подписываемся на обновления
    const unsubscribe = chatManager.subscribe((event) => {
      if (event.data.chatId === chatId) {
        if (event.type === 'message_received' || event.type === 'message_sent') {
          const updatedChat = chatManager.getChat(chatId);
          if (updatedChat) {
            setMessages(updatedChat.messages);
          }
        }
        if (event.type === 'message_deleted') {
          const updatedChat = chatManager.getChat(chatId);
          if (updatedChat) {
            setMessages(updatedChat.messages);
          }
        }
      }
    });

    return () => {
      unsubscribe();
      chatManager.setCurrentChat(null);
    };
  }, [chatId]);

  /**
   * Загрузить больше сообщений (lazy loading при скролле вверх)
   */
  const loadMore = useCallback(async () => {
    if (!chatId || loading || !hasMore) return;

    setLoading(true);
    
    try {
      const moreMessages = await chatManager.loadMessages(chatId, 50, offsetRef.current);
      
      if (moreMessages.length < 50) {
        setHasMore(false);
      }
      
      offsetRef.current += moreMessages.length;
      
      const updatedChat = chatManager.getChat(chatId);
      if (updatedChat) {
        setMessages(updatedChat.messages);
      }
    } finally {
      setLoading(false);
    }
  }, [chatId, loading, hasMore]);

  /**
   * Отправить текстовое сообщение
   */
  const sendMessage = useCallback(async (text: string) => {
    if (!chat) return;
    
    const user = new User({ userId: '0' }); // Временно, нужно получить из контекста
    await user.sendMessage(chat, text);
    
    setMessages(chat.messages);
  }, [chat]);

  /**
   * Удалить сообщение
   */
  const deleteMessage = useCallback(async (messageId: string) => {
    if (!chatId) return;
    await chatManager.deleteMessage(chatId, messageId);
  }, [chatId]);

  /**
   * Редактировать сообщение
   */
  const editMessage = useCallback(async (messageId: string, newText: string) => {
    if (!chatId) return;
    await chatManager.editMessage(chatId, messageId, newText);
  }, [chatId]);

  return {
    chat,
    messages,
    loading,
    hasMore,
    loadMore,
    sendMessage,
    deleteMessage,
    editMessage,
  };
}

/**
 * Хук для подписки на сообщения в реальном времени
 */
export function useMessages(chatId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessageCount, setNewMessageCount] = useState(0);

  useEffect(() => {
    if (!chatId) {
      setMessages([]);
      return;
    }

    const chat = chatManager.getChat(chatId);
    if (chat) {
      setMessages(chat.messages);
    }

    const unsubscribe = chatManager.subscribe((event) => {
      if (event.data.chatId === chatId) {
        const updatedChat = chatManager.getChat(chatId);
        if (updatedChat) {
          setMessages(updatedChat.messages);
          
          if (event.type === 'message_received') {
            setNewMessageCount((prev) => prev + 1);
          }
        }
      }
    });

    return () => unsubscribe();
  }, [chatId]);

  const resetNewMessageCount = useCallback(() => {
    setNewMessageCount(0);
  }, []);

  return {
    messages,
    newMessageCount,
    resetNewMessageCount,
  };
}

/**
 * Хук для индикатора печатания
 */
export function useTyping(chatId: string | null) {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!chatId) {
      setTypingUsers([]);
      return;
    }

    const unsubscribe = chatManager.subscribe((event) => {
      if (event.data.chatId === chatId && event.type === 'typing') {
        setTypingUsers(chatManager.getTypingUsers(chatId));
      }
    });

    return () => unsubscribe();
  }, [chatId]);

  /**
   * Отправить индикатор печатания (с debounce)
   */
  const sendTyping = useCallback(() => {
    if (!chatId) return;

    // Очищаем предыдущий таймаут
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Отправляем typing
    chatManager.sendTyping(chatId);

    // Устанавливаем таймаут для следующей отправки
    typingTimeoutRef.current = setTimeout(() => {
      typingTimeoutRef.current = null;
    }, 3000);
  }, [chatId]);

  /**
   * Получить текст "печатает..."
   */
  const getTypingText = useCallback((): string | null => {
    if (typingUsers.length === 0) return null;
    if (typingUsers.length === 1) return 'печатает...';
    if (typingUsers.length === 2) return 'печатают...';
    return `${typingUsers.length} печатают...`;
  }, [typingUsers]);

  return {
    typingUsers,
    isTyping: typingUsers.length > 0,
    sendTyping,
    getTypingText,
  };
}

/**
 * Хук для отслеживания онлайн-статуса пользователей
 */
export function useOnlineStatus(userIds: string[]) {
  const [onlineStatus, setOnlineStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const updateStatus = () => {
      const status: Record<string, boolean> = {};
      
      for (const userId of userIds) {
        // Проверяем статус во всех чатах
        for (const chat of chatManager.getAllChats()) {
          const participant = chat.getParticipant(userId);
          if (participant) {
            status[userId] = participant.isOnline;
            break;
          }
        }
      }
      
      setOnlineStatus(status);
    };

    updateStatus();

    const unsubscribe = chatManager.subscribe((event) => {
      if (event.type === 'user_online' || event.type === 'user_offline') {
        updateStatus();
      }
    });

    return () => unsubscribe();
  }, [userIds.join(',')]);

  return onlineStatus;
}

/**
 * Хук для поиска по сообщениям
 */
export function useMessageSearch(chatId: string | null) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const search = useCallback((query: string) => {
    setSearchQuery(query);

    if (!chatId || !query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);

    const chat = chatManager.getChat(chatId);
    if (!chat) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    // Локальный поиск
    const results = chat.messages.filter((msg) => 
      msg.text?.toLowerCase().includes(query.toLowerCase())
    );

    setSearchResults(results);
    setIsSearching(false);
  }, [chatId]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
  }, []);

  return {
    searchQuery,
    searchResults,
    isSearching,
    search,
    clearSearch,
  };
}
