/**
 * МЕНЕДЖЕР ЧАТОВ (ChatManager)
 * 
 * Управляет:
 * - Список всех чатов (ChatList)
 * - Переключение между чатами
 * - Синхронизация с сервером через WebSocket
 * - Lazy loading сообщений
 * - Кэширование
 */

import { Chat, ChatData, ChatType } from './Chat';
import { Message, MessageStatus, MessageData, MessageMedia } from './Message';
import { User, UserData } from './User';
import { wsClient, WSMessage } from '../lib/websocket';
import { apiGet, apiPost } from '../lib/api';

export interface ChatListItem {
  chat: Chat;
  lastMessage?: Message;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
}

type ChatEventType = 
  | 'chat_added'
  | 'chat_removed'
  | 'chat_updated'
  | 'message_received'
  | 'message_sent'
  | 'message_deleted'
  | 'message_status_changed'
  | 'typing'
  | 'user_online'
  | 'user_offline';

type ChatEventHandler = (event: { type: ChatEventType; data: any }) => void;

class ChatManager {
  private _chats: Map<string, Chat> = new Map();
  private _currentChatId: string | null = null;
  private _currentUser: User | null = null;
  private _typingUsers: Map<string, Set<string>> = new Map(); // chatId -> Set<userId>
  private _eventHandlers: Set<ChatEventHandler> = new Set();
  private _isInitialized: boolean = false;
  private _loadingChats: Set<string> = new Set();
  private _messageCache: Map<string, Message[]> = new Map(); // chatId -> messages

  // ==================== ИНИЦИАЛИЗАЦИЯ ====================

  /**
   * Инициализировать менеджер чатов
   * @param user Текущий пользователь
   */
  async initialize(user: User): Promise<void> {
    if (this._isInitialized) {
      return;
    }

    this._currentUser = user;

    // Настраиваем callback для отправки сообщений
    user.setSendMessageCallback(this.sendMessageToServer.bind(this));

    // Подключаемся к WebSocket
    this.setupWebSocket();

    // Загружаем список чатов
    await this.loadChats();

    this._isInitialized = true;
  }

  /**
   * Настроить WebSocket обработчики
   */
  private setupWebSocket(): void {
    if (!this._currentUser) return;

    // Подключаемся
    wsClient.connect(parseInt(this._currentUser.userId), this.getChatIds());

    // Обработка новых сообщений
    wsClient.on('message', (msg: WSMessage) => {
      this.handleIncomingMessage(msg.payload);
    });

    // Обработка подтверждения отправки
    wsClient.on('message_sent', (msg: WSMessage) => {
      this.handleMessageSent(msg.payload);
    });

    // Обработка доставки
    wsClient.on('message_delivered', (msg: WSMessage) => {
      this.handleMessageDelivered(msg.payload);
    });

    // Обработка прочтения
    wsClient.on('message_read', (msg: WSMessage) => {
      this.handleMessageRead(msg.payload);
    });

    // Обработка удаления
    wsClient.on('message_deleted', (msg: WSMessage) => {
      this.handleMessageDeleted(msg.payload);
    });

    // Обработка печатания
    wsClient.on('typing', (msg: WSMessage) => {
      this.handleTyping(msg.payload);
    });

    wsClient.on('stop_typing', (msg: WSMessage) => {
      this.handleStopTyping(msg.payload);
    });

    // Обработка онлайн-статуса
    wsClient.on('online', (msg: WSMessage) => {
      this.handleUserOnline(msg.payload);
    });

    wsClient.on('offline', (msg: WSMessage) => {
      this.handleUserOffline(msg.payload);
    });
  }

  /**
   * Отключиться
   */
  disconnect(): void {
    wsClient.disconnect();
    this._chats.clear();
    this._currentChatId = null;
    this._isInitialized = false;
  }

  // ==================== УПРАВЛЕНИЕ ЧАТАМИ ====================

  /**
   * Загрузить список чатов с сервера
   */
  async loadChats(): Promise<Chat[]> {
    if (!this._currentUser) return [];

    try {
      const response = await apiGet<any[]>(`/api/user/${this._currentUser.userId}/chats`);
      
      const chats: Chat[] = [];
      
      if (!response) return chats;
      
      for (const chatData of response) {
        const chat = this.createChatFromResponse(chatData);
        this._chats.set(chat.chatId, chat);
        chats.push(chat);
      }

      return chats;
    } catch (error) {
      console.error('[ChatManager] Error loading chats:', error);
      return [];
    }
  }

  /**
   * Создать объект Chat из ответа сервера
   */
  private createChatFromResponse(data: any): Chat {
    const participants: User[] = [];
    
    // Обработка участников
    if (data.participants) {
      for (const p of data.participants) {
        participants.push(new User({
          userId: String(p.id || p.userId),
          username: p.username,
          firstName: p.firstName || '',
          lastName: p.lastName || '',
          avatar: p.avatarUrl || p.avatar,
          isOnline: p.isOnline || false,
        }));
      }
    }

    // Если это приватный чат, добавляем otherUser
    if (data.otherUser) {
      participants.push(new User({
        userId: String(data.otherUser.id),
        username: data.otherUser.username,
        firstName: data.otherUser.firstName || '',
        lastName: data.otherUser.lastName || '',
        avatar: data.otherUser.avatarUrl,
        isOnline: data.otherUser.isOnline || false,
      }));
    }

    return new Chat({
      chatId: String(data.id || data.chatId),
      type: data.type || 'private',
      name: data.name || data.title || participants[0]?.displayName || 'Чат',
      avatar: data.avatar || data.avatarUrl,
      description: data.description,
      participants,
      unreadCount: data.unreadCount || 0,
      isPinned: data.isPinned || false,
      isMuted: data.isMuted || false,
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
    });
  }

  /**
   * Получить или создать приватный чат
   * @param otherUserId ID другого пользователя
   */
  async getOrCreatePrivateChat(otherUserId: string): Promise<Chat> {
    if (!this._currentUser) {
      throw new Error('User not initialized');
    }

    // Проверяем, есть ли уже такой чат
    for (const chat of this._chats.values()) {
      if (chat.type === 'private' && chat.hasParticipant(otherUserId)) {
        return chat;
      }
    }

    // Создаём новый чат
    try {
      const response = await apiPost<any>('/api/chats/private', {
        user1Id: parseInt(this._currentUser.userId),
        user2Id: parseInt(otherUserId),
      });

      const chat = this.createChatFromResponse(response);
      this._chats.set(chat.chatId, chat);
      
      this.emit({ type: 'chat_added', data: chat });
      
      return chat;
    } catch (error) {
      console.error('[ChatManager] Error creating chat:', error);
      throw error;
    }
  }

  /**
   * Создать групповой чат
   * @param name Название группы
   * @param participantIds ID участников
   */
  async createGroupChat(name: string, participantIds: string[]): Promise<Chat> {
    if (!this._currentUser) {
      throw new Error('User not initialized');
    }

    try {
      const response = await apiPost<any>('/api/chats/group', {
        name,
        creatorId: parseInt(this._currentUser.userId),
        participantIds: participantIds.map(id => parseInt(id)),
      });

      const chat = this.createChatFromResponse(response);
      this._chats.set(chat.chatId, chat);
      
      this.emit({ type: 'chat_added', data: chat });
      
      return chat;
    } catch (error) {
      console.error('[ChatManager] Error creating group:', error);
      throw error;
    }
  }

  /**
   * Получить чат по ID
   * @param chatId ID чата
   */
  getChat(chatId: string): Chat | undefined {
    return this._chats.get(chatId);
  }

  /**
   * Получить все чаты
   */
  getAllChats(): Chat[] {
    return Array.from(this._chats.values());
  }

  /**
   * Получить отсортированный список чатов
   */
  getSortedChatList(): ChatListItem[] {
    const items: ChatListItem[] = [];

    for (const chat of this._chats.values()) {
      items.push({
        chat,
        lastMessage: chat.lastMessage,
        unreadCount: chat.unreadCount,
        isPinned: chat.isPinned,
        isMuted: chat.isMuted,
      });
    }

    // Сортировка: закреплённые сверху, потом по времени последнего сообщения
    return items.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      
      const aTime = a.lastMessage?.timestamp.getTime() || 0;
      const bTime = b.lastMessage?.timestamp.getTime() || 0;
      
      return bTime - aTime;
    });
  }

  /**
   * Получить ID всех чатов
   */
  getChatIds(): string[] {
    return Array.from(this._chats.keys());
  }

  /**
   * Установить текущий чат
   * @param chatId ID чата
   */
  setCurrentChat(chatId: string | null): void {
    this._currentChatId = chatId;
    
    if (chatId) {
      const chat = this._chats.get(chatId);
      if (chat) {
        // Помечаем все сообщения как прочитанные
        chat.markAllAsRead();
        
        // Отправляем на сервер
        this.markChatAsRead(chatId);
      }
    }
  }

  /**
   * Получить текущий чат
   */
  getCurrentChat(): Chat | null {
    if (!this._currentChatId) return null;
    return this._chats.get(this._currentChatId) || null;
  }

  // ==================== РАБОТА С СООБЩЕНИЯМИ ====================

  /**
   * Загрузить сообщения чата
   * @param chatId ID чата
   * @param count Количество
   * @param offset Смещение
   */
  async loadMessages(chatId: string, count: number = 50, offset: number = 0): Promise<Message[]> {
    if (this._loadingChats.has(chatId)) {
      return [];
    }

    this._loadingChats.add(chatId);

    try {
      const response = await apiGet<any[]>(
        `/api/chats/${chatId}/messages?limit=${count}&offset=${offset}`
      );

      const messages: Message[] = [];

      if (!response) return messages;

      for (const msgData of response) {
        const message = this.createMessageFromResponse(msgData);
        messages.push(message);
      }

      // Добавляем в чат
      const chat = this._chats.get(chatId);
      if (chat) {
        for (const msg of messages) {
          chat.addMessage(msg);
        }
      }

      // Кэшируем
      const cached = this._messageCache.get(chatId) || [];
      this._messageCache.set(chatId, [...messages, ...cached]);

      return messages;
    } catch (error) {
      console.error('[ChatManager] Error loading messages:', error);
      return [];
    } finally {
      this._loadingChats.delete(chatId);
    }
  }

  /**
   * Создать объект Message из ответа сервера
   */
  private createMessageFromResponse(data: any): Message {
    return new Message({
      messageId: String(data.id || data.messageId),
      chatId: String(data.chatId),
      senderId: String(data.senderId),
      senderName: data.senderName || `User ${data.senderId}`,
      senderAvatar: data.senderAvatar,
      text: data.message || data.text,
      type: data.mediaType ? this.mapMediaType(data.mediaType) : 'text',
      media: data.mediaUrl ? {
        type: data.mediaType || 'file',
        uri: data.mediaUrl,
        name: data.mediaFileName,
        size: data.mediaSize,
        duration: data.mediaDuration,
      } : undefined,
      timestamp: new Date(data.createdAt || data.timestamp),
      status: data.isRead ? 'read' : (data.status || 'sent'),
      isEdited: data.isEdited || false,
      isDeleted: data.isDeleted || false,
      isPinned: data.isPinned || false,
      reactions: data.reactions || [],
    });
  }

  /**
   * Маппинг типов медиа
   */
  private mapMediaType(type: string): any {
    const map: Record<string, string> = {
      'photo': 'image',
      'video': 'video',
      'voice': 'voice',
      'audio': 'voice',
      'file': 'file',
      'video_note': 'video_note',
    };
    return map[type] || 'file';
  }

  /**
   * Отправить сообщение на сервер
   */
  private async sendMessageToServer(chatId: string, message: Message): Promise<Message> {
    // Отправляем через WebSocket для мгновенной доставки
    wsClient.sendMessage(parseInt(chatId), {
      tempId: message.messageId,
      text: message.text,
      type: message.type,
      media: message.media,
      replyTo: message.replyTo?.messageId,
    });

    // Также отправляем через HTTP для сохранения
    try {
      const response = await apiPost<any>(`/api/chats/${chatId}/messages`, {
        senderId: parseInt(message.senderId),
        message: message.text,
        mediaUrl: message.media?.uri,
        mediaType: message.media?.type,
        mediaFileName: message.media?.name,
        mediaSize: message.media?.size,
        mediaDuration: message.media?.duration,
      });

      return this.createMessageFromResponse(response);
    } catch (error) {
      console.error('[ChatManager] Error sending message:', error);
      throw error;
    }
  }

  /**
   * Удалить сообщение
   * @param chatId ID чата
   * @param messageId ID сообщения
   */
  async deleteMessage(chatId: string, messageId: string): Promise<void> {
    const chat = this._chats.get(chatId);
    if (!chat) return;

    // Удаляем локально
    chat.deleteMessage(messageId);

    // Отправляем на сервер через POST (используем вместо DELETE)
    try {
      await apiPost(`/api/chats/${chatId}/messages/${messageId}/delete`, {});
      
      // Уведомляем через WebSocket
      wsClient.send({
        type: 'message_deleted',
        payload: { chatId, messageId },
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('[ChatManager] Error deleting message:', error);
    }

    this.emit({ type: 'message_deleted', data: { chatId, messageId } });
  }

  /**
   * Редактировать сообщение
   * @param chatId ID чата
   * @param messageId ID сообщения
   * @param newText Новый текст
   */
  async editMessage(chatId: string, messageId: string, newText: string): Promise<void> {
    const chat = this._chats.get(chatId);
    if (!chat) return;

    const message = chat.getMessage(messageId);
    if (!message) return;

    // Редактируем локально
    message.editText(newText);

    // Отправляем на сервер через POST
    try {
      await apiPost(`/api/chats/${chatId}/messages/${messageId}/edit`, {
        text: newText,
      });
    } catch (error) {
      console.error('[ChatManager] Error editing message:', error);
    }
  }

  /**
   * Пометить чат как прочитанный
   */
  private async markChatAsRead(chatId: string): Promise<void> {
    try {
      await apiPost(`/api/chats/${chatId}/read`, {});
      
      wsClient.send({
        type: 'message_read',
        payload: { chatId },
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('[ChatManager] Error marking chat as read:', error);
    }
  }

  // ==================== ОБРАБОТЧИКИ WEBSOCKET ====================

  /**
   * Обработка входящего сообщения
   */
  private handleIncomingMessage(payload: any): void {
    const { chatId, message: msgData } = payload;
    
    const chat = this._chats.get(String(chatId));
    if (!chat) return;

    const message = this.createMessageFromResponse(msgData);
    chat.addMessage(message);

    this.emit({ type: 'message_received', data: { chatId, message } });

    // Если это текущий чат - сразу помечаем как прочитанное
    if (this._currentChatId === String(chatId)) {
      message.markRead();
      this.markChatAsRead(String(chatId));
    }
  }

  /**
   * Обработка подтверждения отправки
   */
  private handleMessageSent(payload: any): void {
    const { chatId, tempId, message: msgData } = payload;
    
    const chat = this._chats.get(String(chatId));
    if (!chat) return;

    // Находим временное сообщение и обновляем
    const tempMessage = chat.getMessage(tempId);
    if (tempMessage) {
      tempMessage.updateStatus('sent');
    }

    this.emit({ type: 'message_sent', data: { chatId, messageId: tempId } });
  }

  /**
   * Обработка доставки
   */
  private handleMessageDelivered(payload: any): void {
    const { chatId, messageId } = payload;
    
    const chat = this._chats.get(String(chatId));
    if (!chat) return;

    chat.updateMessageStatus(String(messageId), 'delivered');

    this.emit({ type: 'message_status_changed', data: { chatId, messageId, status: 'delivered' } });
  }

  /**
   * Обработка прочтения
   */
  private handleMessageRead(payload: any): void {
    const { chatId, messageId } = payload;
    
    const chat = this._chats.get(String(chatId));
    if (!chat) return;

    if (messageId) {
      chat.updateMessageStatus(String(messageId), 'read');
    } else {
      // Все сообщения прочитаны
      chat.markAllAsRead();
    }

    this.emit({ type: 'message_status_changed', data: { chatId, messageId, status: 'read' } });
  }

  /**
   * Обработка удаления сообщения
   */
  private handleMessageDeleted(payload: any): void {
    const { chatId, messageId } = payload;
    
    const chat = this._chats.get(String(chatId));
    if (!chat) return;

    chat.deleteMessage(String(messageId));

    this.emit({ type: 'message_deleted', data: { chatId, messageId } });
  }

  /**
   * Обработка печатания
   */
  private handleTyping(payload: any): void {
    const { chatId, userId } = payload;
    
    if (!this._typingUsers.has(String(chatId))) {
      this._typingUsers.set(String(chatId), new Set());
    }
    
    this._typingUsers.get(String(chatId))!.add(String(userId));

    this.emit({ type: 'typing', data: { chatId, userId } });

    // Автоматически убираем через 5 секунд
    setTimeout(() => {
      this.handleStopTyping({ chatId, userId });
    }, 5000);
  }

  /**
   * Обработка окончания печатания
   */
  private handleStopTyping(payload: any): void {
    const { chatId, userId } = payload;
    
    const typingSet = this._typingUsers.get(String(chatId));
    if (typingSet) {
      typingSet.delete(String(userId));
    }
  }

  /**
   * Обработка выхода пользователя в онлайн
   */
  private handleUserOnline(payload: any): void {
    const { userId } = payload;
    
    // Обновляем статус во всех чатах с этим пользователем
    for (const chat of this._chats.values()) {
      const participant = chat.getParticipant(String(userId));
      if (participant) {
        participant.setOnline(true);
      }
    }

    this.emit({ type: 'user_online', data: { userId } });
  }

  /**
   * Обработка выхода пользователя оффлайн
   */
  private handleUserOffline(payload: any): void {
    const { userId } = payload;
    
    for (const chat of this._chats.values()) {
      const participant = chat.getParticipant(String(userId));
      if (participant) {
        participant.setOnline(false);
      }
    }

    this.emit({ type: 'user_offline', data: { userId } });
  }

  // ==================== TYPING INDICATOR ====================

  /**
   * Отправить индикатор печатания
   */
  sendTyping(chatId: string): void {
    wsClient.startTyping(chatId);
  }

  /**
   * Получить печатающих пользователей в чате
   */
  getTypingUsers(chatId: string): string[] {
    const typingSet = this._typingUsers.get(chatId);
    return typingSet ? Array.from(typingSet) : [];
  }

  // ==================== EVENT SYSTEM ====================

  /**
   * Подписаться на события
   */
  subscribe(handler: ChatEventHandler): () => void {
    this._eventHandlers.add(handler);
    
    return () => {
      this._eventHandlers.delete(handler);
    };
  }

  /**
   * Отправить событие
   */
  private emit(event: { type: ChatEventType; data: any }): void {
    this._eventHandlers.forEach(handler => handler(event));
  }

  // ==================== SINGLETON ====================

  private static _instance: ChatManager;

  static getInstance(): ChatManager {
    if (!ChatManager._instance) {
      ChatManager._instance = new ChatManager();
    }
    return ChatManager._instance;
  }
}

// Экспортируем singleton
export const chatManager = ChatManager.getInstance();
export default chatManager;
