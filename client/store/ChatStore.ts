/**
 * TELEGRAM-LIKE CHAT STATE MACHINE
 * Реактивная машина состояний для чатов
 * 
 * User Event → UI Event → State Manager → Local Cache → Network Layer → UI Diff → Render
 * 
 * Нет экранов - есть сущности + состояния + права доступа
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { apiFetch, apiGet, apiPost, apiDelete, getApiUrl } from '../lib/api';
import { wsClient, WSMessage } from '../lib/websocket';

// ==================== ТИПЫ ====================

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
export type ChatType = 'private' | 'group' | 'channel' | 'bot';
export type MediaType = 'photo' | 'video' | 'voice' | 'file' | 'sticker';

export interface Message {
  id: string;
  localId?: string; // Для optimistic updates
  chatId: string;
  senderId: number;
  senderName?: string;
  text?: string;
  type: 'text' | 'voice' | 'image' | 'file' | 'system';
  mediaUrl?: string;
  mediaType?: MediaType;
  mediaFileName?: string;
  mediaSize?: number;
  mediaDuration?: number;
  status: MessageStatus;
  readState: 'unread' | 'read';
  reactions: Reaction[];
  replyTo?: {
    id: string;
    text: string;
    senderName: string;
  };
  isEdited?: boolean;
  createdAt: number;
  editedAt?: number;
}

export interface Reaction {
  emoji: string;
  count: number;
  hasReacted: boolean;
  userIds: number[];
}

export interface ChatDraft {
  text: string;
  replyTo?: Message;
  savedAt: number;
}

export interface ChatPermissions {
  canSendMessages: boolean;
  canSendMedia: boolean;
  canAddUsers: boolean;
  canPinMessages: boolean;
  canEditInfo: boolean;
  canDeleteMessages: boolean;
}

export interface ChatMember {
  userId: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  role: 'owner' | 'admin' | 'member' | 'restricted' | 'banned';
  permissions: ChatPermissions;
  isOnline: boolean;
  lastSeenAt?: number;
}

export interface Chat {
  id: string;
  type: ChatType;
  name: string;
  username?: string;
  avatarUrl?: string;
  bio?: string;
  
  // Состояния
  lastMessage?: Message;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  isArchived: boolean;
  isBlocked: boolean;
  
  // Драфт
  draft?: ChatDraft;
  
  // Участники (для групп)
  memberCount?: number;
  onlineCount?: number;
  
  // Для приватных чатов
  otherUser?: ChatMember;
  
  // Метаданные
  createdAt: number;
  updatedAt: number;
}

// ==================== UI СОСТОЯНИЯ ====================

export type ChatUIState = 
  | 'chat_list'           // Список чатов
  | 'chat_selected'       // Выбран чат
  | 'profile_open'        // Открыт профиль
  | 'search_active'       // Активен поиск
  | 'keyboard_active'     // Активна клавиатура
  | 'media_picker'        // Выбор медиа
  | 'reaction_picker'     // Выбор реакции
  | 'context_menu'        // Контекстное меню
  | 'forward_mode';       // Режим пересылки

export interface UIStateData {
  selectedChatId?: string;
  selectedMessageId?: string;
  searchQuery?: string;
  contextMenuPosition?: { x: number; y: number };
  forwardMessageIds?: string[];
}

// ==================== STORE ====================

interface ChatStoreState {
  // Данные
  chats: Map<string, Chat>;
  messages: Map<string, Message[]>; // chatId -> messages
  messagePool: Map<string, Message>; // Пул сообщений для быстрого доступа
  
  // UI состояние
  uiState: ChatUIState;
  uiStateData: UIStateData;
  
  // Кэш
  typingUsers: Map<string, number[]>; // chatId -> userIds
  onlineUsers: Set<number>;
  
  // Загрузка
  isLoading: boolean;
  isSyncing: boolean;
  loadingChats: Set<string>;
  
  // Ошибки (тихие)
  pendingRetries: Map<string, { message: Message; attempts: number }>;
}

interface ChatStoreActions {
  // Инициализация
  initialize: (userId: number) => Promise<void>;
  
  // Состояния UI
  setUIState: (state: ChatUIState, data?: UIStateData) => void;
  
  // Чаты
  loadChats: (userId: number) => Promise<void>;
  selectChat: (chatId: string) => void;
  updateChat: (chatId: string, updates: Partial<Chat>) => void;
  pinChat: (chatId: string, pinned: boolean) => void;
  muteChat: (chatId: string, muted: boolean) => void;
  archiveChat: (chatId: string, archived: boolean) => void;
  blockUser: (userId: number, blocked: boolean) => void;
  deleteChat: (chatId: string) => void;
  
  // Сообщения
  loadMessages: (chatId: string, limit?: number, beforeId?: string) => Promise<void>;
  sendMessage: (chatId: string, message: Partial<Message>) => Promise<void>;
  updateMessageStatus: (messageId: string, status: MessageStatus) => void;
  addReaction: (messageId: string, emoji: string, userId: number) => void;
  removeReaction: (messageId: string, emoji: string, userId: number) => void;
  markAsRead: (chatId: string, userId: number) => void;
  deleteMessage: (messageId: string, forAll: boolean, userId: number) => void;
  editMessage: (messageId: string, newText: string) => void;
  
  // Драфты
  saveDraft: (chatId: string, draft: ChatDraft) => void;
  clearDraft: (chatId: string) => void;
  
  // Реалтайм
  handleIncomingMessage: (message: Message) => void;
  handleMessageUpdate: (messageId: string, updates: Partial<Message>) => void;
  handleTyping: (chatId: string, userId: number, isTyping: boolean) => void;
  handleOnlineStatus: (userId: number, isOnline: boolean) => void;
  
  // Поиск
  searchChats: (query: string) => Chat[];
  searchMessages: (chatId: string, query: string) => Message[];
  
  // Утилиты
  getChatById: (chatId: string) => Chat | undefined;
  getMessages: (chatId: string) => Message[];
  getUnreadCount: () => number;
  
  // Retry логика (тихая)
  retryPendingMessages: () => void;
}

type ChatStore = ChatStoreState & ChatStoreActions;

// ==================== СОЗДАНИЕ STORE ====================

export const useChatStore = create<ChatStore>()(
  subscribeWithSelector((set, get) => ({
    // Начальное состояние
    chats: new Map(),
    messages: new Map(),
    messagePool: new Map(),
    uiState: 'chat_list',
    uiStateData: {},
    typingUsers: new Map(),
    onlineUsers: new Set(),
    isLoading: false,
    isSyncing: false,
    loadingChats: new Set(),
    pendingRetries: new Map(),

    // ==================== ИНИЦИАЛИЗАЦИЯ ====================
    
    initialize: async (userId: number) => {
      set({ isLoading: true });
      try {
        await get().loadChats(userId);
        
        // Получаем список chatIds
        const chatIds = Array.from(get().chats.keys());
        
        // Подключаем WebSocket
        wsClient.connect(userId, chatIds);
        
        // Подписываемся на события WebSocket
        wsClient.on('message', (msg: WSMessage) => {
          get().handleIncomingMessage(msg.payload.message);
        });
        
        wsClient.on('message_delivered', (msg: WSMessage) => {
          // Обновляем статус сообщения на delivered
          const { messageId, localId } = msg.payload;
          if (localId) {
            get().updateMessageStatus(localId, 'delivered');
          }
          if (messageId) {
            get().updateMessageStatus(messageId.toString(), 'delivered');
          }
        });
        
        wsClient.on('message_read', (msg: WSMessage) => {
          // Обновляем статус сообщений на read
          const { messageIds } = msg.payload;
          messageIds?.forEach((id: string) => {
            get().updateMessageStatus(id, 'read');
          });
        });
        
        wsClient.on('message_deleted', (msg: WSMessage) => {
          // Удаляем сообщение из локального состояния
          const { messageId, chatId } = msg.payload;
          if (messageId) {
            const messagePool = new Map(get().messagePool);
            messagePool.delete(messageId.toString());
            
            const messages = new Map(get().messages);
            const chatMessages = messages.get(chatId?.toString() || '');
            if (chatMessages) {
              const updated = chatMessages.filter(m => m.id !== messageId.toString());
              messages.set(chatId?.toString() || '', updated);
            }
            
            set({ messages, messagePool });
          }
        });
        
        wsClient.on('typing', (msg: WSMessage) => {
          get().handleTyping(msg.payload.chatId, msg.payload.userId, true);
        });
        
        wsClient.on('stop_typing', (msg: WSMessage) => {
          get().handleTyping(msg.payload.chatId, msg.payload.userId, false);
        });
        
        wsClient.on('online', (msg: WSMessage) => {
          get().handleOnlineStatus(msg.payload.userId, true);
        });
        
        wsClient.on('offline', (msg: WSMessage) => {
          get().handleOnlineStatus(msg.payload.userId, false);
        });
        
        // Запуск retry логики
        setInterval(() => get().retryPendingMessages(), 5000);
      } finally {
        set({ isLoading: false });
      }
    },

    // ==================== UI СОСТОЯНИЯ ====================
    
    setUIState: (state, data = {}) => {
      set({ 
        uiState: state, 
        uiStateData: { ...get().uiStateData, ...data } 
      });
    },

    // ==================== ЧАТЫ ====================
    
    loadChats: async (userId: number) => {
      try {
        const rawChats = await apiGet<any[]>(`api/user/${userId}/chats`);
        if (!rawChats) return;
        
        const chatsMap = new Map<string, Chat>();
        
        rawChats.forEach((raw: any) => {
          const chat = transformRawChat(raw);
          chatsMap.set(chat.id, chat);
        });
        
        set({ chats: chatsMap });
      } catch (error) {
        console.error('[ChatStore] loadChats error:', error);
        // Тихая ошибка - не пугаем пользователя
      }
    },

    selectChat: (chatId: string) => {
      const chat = get().chats.get(chatId);
      if (chat) {
        set({ 
          uiState: 'chat_selected',
          uiStateData: { selectedChatId: chatId }
        });
        
        // Предзагрузка сообщений
        if (!get().messages.has(chatId)) {
          get().loadMessages(chatId);
        }
      }
    },

    updateChat: (chatId: string, updates: Partial<Chat>) => {
      const chats = new Map(get().chats);
      const chat = chats.get(chatId);
      if (chat) {
        chats.set(chatId, { ...chat, ...updates, updatedAt: Date.now() });
        set({ chats });
      }
    },

    pinChat: (chatId: string, pinned: boolean) => {
      get().updateChat(chatId, { isPinned: pinned });
      // Оптимистичное обновление, синхронизация в фоне
      apiPost(`api/chats/${chatId}/pin`, { pinned }).catch(() => {
        // Откат при ошибке
        get().updateChat(chatId, { isPinned: !pinned });
      });
    },

    muteChat: (chatId: string, muted: boolean) => {
      get().updateChat(chatId, { isMuted: muted });
      apiPost(`api/chats/${chatId}/mute`, { muted }).catch(() => {
        get().updateChat(chatId, { isMuted: !muted });
      });
    },

    archiveChat: (chatId: string, archived: boolean) => {
      // Архив = chat.visible = false, не удаление
      get().updateChat(chatId, { isArchived: archived });
      apiPost(`api/chats/${chatId}/archive`, { archived }).catch(() => {
        get().updateChat(chatId, { isArchived: !archived });
      });
    },

    blockUser: (userId: number, blocked: boolean) => {
      // Блокировка - это фильтр, не удаление
      const chats = get().chats;
      chats.forEach((chat, chatId) => {
        if (chat.type === 'private' && chat.otherUser?.userId === userId) {
          get().updateChat(chatId, { isBlocked: blocked });
        }
      });
      
      apiPost(`api/users/${userId}/block`, { blocked }).catch(() => {});
    },

    deleteChat: (chatId: string) => {
      const chats = new Map(get().chats);
      chats.delete(chatId);
      set({ chats });
      
      apiDelete(`api/chats/${chatId}`).catch(() => {
        // Восстановить при ошибке нужно перезагрузить
      });
    },

    // ==================== СООБЩЕНИЯ ====================
    
    loadMessages: async (chatId: string, limit = 50, beforeId?: string) => {
      const loadingChats = new Set(get().loadingChats);
      if (loadingChats.has(chatId)) return;
      
      loadingChats.add(chatId);
      set({ loadingChats });
      
      try {
        const url = beforeId 
          ? `api/chats/${chatId}/messages?limit=${limit}&before=${beforeId}`
          : `api/chats/${chatId}/messages?limit=${limit}`;
          
        const response = await apiGet(url);
        if (!response) return;
        
        const rawMessages = response as any[];
        const messages = new Map(get().messages);
        const messagePool = new Map(get().messagePool);
        
        const chatMessages = rawMessages.map((raw: any) => transformRawMessage(raw));
        
        // Добавляем в пул для быстрого доступа
        chatMessages.forEach((msg: Message) => {
          messagePool.set(msg.id, msg);
        });
        
        // Объединяем с существующими
        const existingMessages = messages.get(chatId) || [];
        const mergedMessages = beforeId 
          ? [...chatMessages, ...existingMessages]
          : [...existingMessages, ...chatMessages];
        
        // Дедупликация
        const uniqueMessages = Array.from(
          new Map(mergedMessages.map(m => [m.id, m])).values()
        ).sort((a, b) => a.createdAt - b.createdAt);
        
        messages.set(chatId, uniqueMessages);
        set({ messages, messagePool });
        
      } catch (error) {
        console.error('[ChatStore] loadMessages error:', error);
      } finally {
        const loadingChats = new Set(get().loadingChats);
        loadingChats.delete(chatId);
        set({ loadingChats });
      }
    },

    sendMessage: async (chatId: string, message: Partial<Message>) => {
      const localId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Optimistic render - UI не ждёт сеть
      const optimisticMessage: Message = {
        id: localId,
        localId,
        chatId,
        senderId: message.senderId || 0,
        text: message.text,
        type: message.type || 'text',
        status: 'sending', // ✔️ как «в процессе»
        readState: 'unread',
        reactions: [],
        createdAt: Date.now(),
        ...message,
      };
      
      // Добавляем сообщение сразу
      const messages = new Map(get().messages);
      const chatMessages = [...(messages.get(chatId) || []), optimisticMessage];
      messages.set(chatId, chatMessages);
      
      const messagePool = new Map(get().messagePool);
      messagePool.set(localId, optimisticMessage);
      
      // Обновляем lastMessage чата
      get().updateChat(chatId, { 
        lastMessage: optimisticMessage,
        updatedAt: Date.now()
      });
      
      set({ messages, messagePool });
      
      // Уведомляем WebSocket что печатаем (потом отправим)
      wsClient.stopTyping(chatId);
      
      try {
        const response = await apiFetch(`api/chats/${chatId}/messages`, {
          method: 'POST',
          body: JSON.stringify({
            senderId: optimisticMessage.senderId,
            senderName: optimisticMessage.senderName,
            message: optimisticMessage.text,
            type: optimisticMessage.type,
            mediaUrl: optimisticMessage.mediaUrl,
            mediaType: optimisticMessage.mediaType,
            localId: localId, // Для синхронизации с WebSocket
          }),
        });
        
        if (!response.ok) throw new Error('Failed to send');
        
        const serverMessage = await response.json();
        
        // Обновляем сообщение с серверными данными
        const realMessage: Message = {
          ...optimisticMessage,
          id: serverMessage.id.toString(),
          status: 'sent', // Второй ✔️
          createdAt: new Date(serverMessage.createdAt).getTime(),
        };
        
        // Заменяем локальное на серверное
        const updatedMessages = new Map(get().messages);
        const updated = (updatedMessages.get(chatId) || []).map(m => 
          m.localId === localId ? realMessage : m
        );
        updatedMessages.set(chatId, updated);
        
        const updatedPool = new Map(get().messagePool);
        updatedPool.delete(localId);
        updatedPool.set(realMessage.id, realMessage);
        
        set({ messages: updatedMessages, messagePool: updatedPool });
        
      } catch (error) {
        // Помечаем как failed и добавляем в retry очередь
        get().updateMessageStatus(localId, 'failed');
        
        const pendingRetries = new Map(get().pendingRetries);
        pendingRetries.set(localId, { 
          message: optimisticMessage, 
          attempts: 0 
        });
        set({ pendingRetries });
      }
    },

    updateMessageStatus: (messageId: string, status: MessageStatus) => {
      const messagePool = new Map(get().messagePool);
      const message = messagePool.get(messageId);
      
      if (message) {
        const updatedMessage = { ...message, status };
        messagePool.set(messageId, updatedMessage);
        
        // Обновляем в списке сообщений
        const messages = new Map(get().messages);
        const chatMessages = messages.get(message.chatId);
        if (chatMessages) {
          const updated = chatMessages.map(m => m.id === messageId ? updatedMessage : m);
          messages.set(message.chatId, updated);
        }
        
        set({ messages, messagePool });
      }
    },

    addReaction: (messageId: string, emoji: string, userId: number) => {
      const messagePool = new Map(get().messagePool);
      const message = messagePool.get(messageId);
      
      if (message) {
        const reactions = [...message.reactions];
        const existingReaction = reactions.find(r => r.emoji === emoji);
        
        if (existingReaction) {
          if (!existingReaction.userIds.includes(userId)) {
            existingReaction.count++;
            existingReaction.userIds.push(userId);
            existingReaction.hasReacted = true;
          }
        } else {
          reactions.push({
            emoji,
            count: 1,
            hasReacted: true,
            userIds: [userId],
          });
        }
        
        const updatedMessage = { ...message, reactions };
        messagePool.set(messageId, updatedMessage);
        
        // Обновляем в списке
        const messages = new Map(get().messages);
        const chatMessages = messages.get(message.chatId);
        if (chatMessages) {
          const updated = chatMessages.map(m => m.id === messageId ? updatedMessage : m);
          messages.set(message.chatId, updated);
        }
        
        set({ messages, messagePool });
        
        // Отправляем на сервер в фоне
        apiPost(`api/messages/${messageId}/reactions`, { emoji, userId }).catch(() => {});
      }
    },

    removeReaction: (messageId: string, emoji: string, userId: number) => {
      const messagePool = new Map(get().messagePool);
      const message = messagePool.get(messageId);
      
      if (message) {
        const reactions = message.reactions
          .map(r => {
            if (r.emoji === emoji) {
              const userIds = r.userIds.filter(id => id !== userId);
              return {
                ...r,
                count: Math.max(0, r.count - 1),
                userIds,
                hasReacted: false,
              };
            }
            return r;
          })
          .filter(r => r.count > 0);
        
        const updatedMessage = { ...message, reactions };
        messagePool.set(messageId, updatedMessage);
        
        const messages = new Map(get().messages);
        const chatMessages = messages.get(message.chatId);
        if (chatMessages) {
          const updated = chatMessages.map(m => m.id === messageId ? updatedMessage : m);
          messages.set(message.chatId, updated);
        }
        
        set({ messages, messagePool });
        
        apiFetch(`api/messages/${messageId}/reactions`, {
          method: 'DELETE',
          body: JSON.stringify({ emoji, userId }),
        }).catch(() => {});
      }
    },

    markAsRead: (chatId: string, userId: number) => {
      // Оптимистичное обновление
      get().updateChat(chatId, { unreadCount: 0 });
      
      // Обновляем статус сообщений
      const messages = new Map(get().messages);
      const chatMessages = messages.get(chatId);
      if (chatMessages) {
        const updated = chatMessages.map(m => ({
          ...m,
          readState: 'read' as const,
          status: m.senderId !== userId && m.status !== 'read' ? 'read' as const : m.status,
        }));
        messages.set(chatId, updated);
        set({ messages });
      }
      
      // Отправляем на сервер
      apiPost(`api/chats/${chatId}/read`, { userId }).catch(() => {});
    },

    deleteMessage: (messageId: string, forAll: boolean, userId: number) => {
      const messagePool = new Map(get().messagePool);
      const message = messagePool.get(messageId);
      
      if (message) {
        messagePool.delete(messageId);
        
        const messages = new Map(get().messages);
        const chatMessages = messages.get(message.chatId);
        if (chatMessages) {
          const updated = chatMessages.filter(m => m.id !== messageId);
          messages.set(message.chatId, updated);
        }
        
        set({ messages, messagePool });
        
        apiFetch(`api/messages/${messageId}`, {
          method: 'DELETE',
          body: JSON.stringify({ forAll, userId }),
        }).catch(() => {});
      }
    },

    editMessage: (messageId: string, newText: string) => {
      const messagePool = new Map(get().messagePool);
      const message = messagePool.get(messageId);
      
      if (message) {
        const updatedMessage = {
          ...message,
          text: newText,
          isEdited: true,
          editedAt: Date.now(),
        };
        messagePool.set(messageId, updatedMessage);
        
        const messages = new Map(get().messages);
        const chatMessages = messages.get(message.chatId);
        if (chatMessages) {
          const updated = chatMessages.map(m => m.id === messageId ? updatedMessage : m);
          messages.set(message.chatId, updated);
        }
        
        set({ messages, messagePool });
        
        apiFetch(`api/messages/${messageId}`, {
          method: 'PATCH',
          body: JSON.stringify({ text: newText }),
        }).catch(() => {});
      }
    },

    // ==================== ДРАФТЫ ====================
    
    saveDraft: (chatId: string, draft: ChatDraft) => {
      get().updateChat(chatId, { draft });
    },

    clearDraft: (chatId: string) => {
      get().updateChat(chatId, { draft: undefined });
    },

    // ==================== РЕАЛТАЙМ ====================
    
    handleIncomingMessage: (message: Message) => {
      const messages = new Map(get().messages);
      const chatMessages = messages.get(message.chatId) || [];
      
      // Проверяем на дубликат по id
      const exists = chatMessages.some(m => m.id === message.id);
      if (exists) {
        console.log('[ChatStore] Duplicate message ignored:', message.id);
        return;
      }
      
      messages.set(message.chatId, [...chatMessages, message]);
      
      const messagePool = new Map(get().messagePool);
      messagePool.set(message.id, message);
      
      // Обновляем чат
      const chat = get().chats.get(message.chatId);
      if (chat) {
        get().updateChat(message.chatId, {
          lastMessage: message,
          unreadCount: chat.unreadCount + 1,
        });
      }
      
      set({ messages, messagePool });
    },

    handleMessageUpdate: (messageId: string, updates: Partial<Message>) => {
      const messagePool = new Map(get().messagePool);
      const message = messagePool.get(messageId);
      
      if (message) {
        const updatedMessage = { ...message, ...updates };
        messagePool.set(messageId, updatedMessage);
        
        const messages = new Map(get().messages);
        const chatMessages = messages.get(message.chatId);
        if (chatMessages) {
          const updated = chatMessages.map(m => m.id === messageId ? updatedMessage : m);
          messages.set(message.chatId, updated);
        }
        
        set({ messages, messagePool });
      }
    },

    handleTyping: (chatId: string, userId: number, isTyping: boolean) => {
      const typingUsers = new Map(get().typingUsers);
      const chatTyping = typingUsers.get(chatId) || [];
      
      if (isTyping && !chatTyping.includes(userId)) {
        typingUsers.set(chatId, [...chatTyping, userId]);
      } else if (!isTyping) {
        typingUsers.set(chatId, chatTyping.filter(id => id !== userId));
      }
      
      set({ typingUsers });
    },

    handleOnlineStatus: (userId: number, isOnline: boolean) => {
      const onlineUsers = new Set(get().onlineUsers);
      if (isOnline) {
        onlineUsers.add(userId);
      } else {
        onlineUsers.delete(userId);
      }
      set({ onlineUsers });
      
      // Обновляем статус в чатах
      get().chats.forEach((chat, chatId) => {
        if (chat.type === 'private' && chat.otherUser?.userId === userId) {
          const otherUser = { ...chat.otherUser, isOnline };
          get().updateChat(chatId, { otherUser });
        }
      });
    },

    // ==================== ПОИСК ====================
    
    searchChats: (query: string) => {
      const q = query.toLowerCase();
      return Array.from(get().chats.values()).filter(chat => {
        return (
          chat.name.toLowerCase().includes(q) ||
          chat.username?.toLowerCase().includes(q) ||
          chat.lastMessage?.text?.toLowerCase().includes(q)
        );
      });
    },

    searchMessages: (chatId: string, query: string) => {
      const q = query.toLowerCase();
      const chatMessages = get().messages.get(chatId) || [];
      return chatMessages.filter(m => m.text?.toLowerCase().includes(q));
    },

    // ==================== УТИЛИТЫ ====================
    
    getChatById: (chatId: string) => get().chats.get(chatId),
    
    getMessages: (chatId: string) => get().messages.get(chatId) || [],
    
    getUnreadCount: () => {
      let total = 0;
      get().chats.forEach(chat => {
        if (!chat.isMuted && !chat.isArchived) {
          total += chat.unreadCount;
        }
      });
      return total;
    },

    // ==================== RETRY ЛОГИКА ====================
    
    retryPendingMessages: () => {
      const pendingRetries = new Map(get().pendingRetries);
      
      pendingRetries.forEach(async (retry, localId) => {
        if (retry.attempts >= 3) {
          // Максимум попыток - удаляем из очереди
          pendingRetries.delete(localId);
          return;
        }
        
        retry.attempts++;
        
        try {
          const response = await apiFetch(`api/chats/${retry.message.chatId}/messages`, {
            method: 'POST',
            body: JSON.stringify({
              senderId: retry.message.senderId,
              message: retry.message.text,
            }),
          });
          
          if (response.ok) {
            pendingRetries.delete(localId);
            get().updateMessageStatus(localId, 'sent');
          }
        } catch {
          // Продолжаем пытаться
        }
      });
      
      set({ pendingRetries });
    },
  }))
);

// ==================== ТРАНСФОРМЕРЫ ====================

function transformRawChat(raw: any): Chat {
  return {
    id: raw.id?.toString() || '',
    type: raw.type || 'private',
    name: raw.otherUser?.firstName 
      ? `${raw.otherUser.firstName}${raw.otherUser.lastName ? ` ${raw.otherUser.lastName}` : ''}`
      : raw.otherUser?.username || raw.name || 'Чат',
    username: raw.otherUser?.username,
    avatarUrl: raw.otherUser?.avatarUrl,
    bio: raw.otherUser?.bio,
    lastMessage: raw.lastMessage ? transformRawMessage(raw.lastMessage) : undefined,
    unreadCount: raw.unreadCount || 0,
    isPinned: raw.isPinned || false,
    isMuted: raw.isMuted || false,
    isArchived: raw.isArchived || false,
    isBlocked: raw.isBlocked || false,
    draft: raw.draft,
    memberCount: raw.memberCount,
    onlineCount: raw.onlineCount,
    otherUser: raw.otherUser ? {
      userId: raw.otherUser.userId || raw.otherUser.id,
      username: raw.otherUser.username,
      firstName: raw.otherUser.firstName,
      lastName: raw.otherUser.lastName,
      avatarUrl: raw.otherUser.avatarUrl,
      role: 'member',
      permissions: {
        canSendMessages: true,
        canSendMedia: true,
        canAddUsers: false,
        canPinMessages: false,
        canEditInfo: false,
        canDeleteMessages: false,
      },
      isOnline: raw.otherUser.isOnline || false,
      lastSeenAt: raw.otherUser.lastSeenAt ? new Date(raw.otherUser.lastSeenAt).getTime() : undefined,
    } : undefined,
    createdAt: raw.createdAt ? new Date(raw.createdAt).getTime() : Date.now(),
    updatedAt: raw.lastMessageAt ? new Date(raw.lastMessageAt).getTime() : Date.now(),
  };
}

function transformRawMessage(raw: any): Message {
  return {
    id: raw.id?.toString() || '',
    chatId: raw.chatId?.toString() || '',
    senderId: raw.senderId || 0,
    senderName: raw.senderName,
    text: raw.message || raw.text,
    type: raw.mediaType ? (raw.mediaType === 'photo' ? 'image' : raw.mediaType) : 'text',
    mediaUrl: raw.mediaUrl,
    mediaType: raw.mediaType,
    mediaFileName: raw.mediaFileName,
    mediaSize: raw.mediaSize,
    status: raw.isRead ? 'read' : 'delivered',
    readState: raw.isRead ? 'read' : 'unread',
    reactions: raw.reactions || [],
    replyTo: raw.replyTo,
    isEdited: raw.isEdited || false,
    createdAt: raw.createdAt ? new Date(raw.createdAt).getTime() : Date.now(),
    editedAt: raw.editedAt ? new Date(raw.editedAt).getTime() : undefined,
  };
}

// ==================== СЕЛЕКТОРЫ (для оптимизации ререндеров) ====================

export const selectChats = (state: ChatStore) => state.chats;
export const selectMessages = (chatId: string) => (state: ChatStore) => state.messages.get(chatId) || [];
export const selectUIState = (state: ChatStore) => state.uiState;
export const selectUIStateData = (state: ChatStore) => state.uiStateData;
export const selectTypingUsers = (chatId: string) => (state: ChatStore) => state.typingUsers.get(chatId) || [];
export const selectIsOnline = (userId: number) => (state: ChatStore) => state.onlineUsers.has(userId);
export const selectUnreadCount = (state: ChatStore) => state.getUnreadCount();

// Отсортированные чаты для списка
export const selectSortedChats = (state: ChatStore) => {
  const chats = Array.from(state.chats.values());
  
  // Сортировка: Закреплённые → Активные → Архив
  return chats
    .filter(c => !c.isArchived)
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.updatedAt - a.updatedAt;
    });
};

export const selectArchivedChats = (state: ChatStore) => {
  return Array.from(state.chats.values())
    .filter(c => c.isArchived)
    .sort((a, b) => b.updatedAt - a.updatedAt);
};
