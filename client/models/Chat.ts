/**
 * КЛАСС ЧАТА (Chat)
 * 
 * Хранит:
 * - chat_id — уникальный идентификатор
 * - participants — список пользователей
 * - messages — список сообщений
 * 
 * Методы:
 * - addMessage(Message msg)
 * - deleteMessage(int msg_id)
 * - getMessages(int count, int offset)
 */

import { Message, MessageStatus } from './Message';
import { User } from './User';

export type ChatType = 'private' | 'group' | 'channel';

export interface ChatData {
  chatId: string;
  type: ChatType;
  name: string;
  avatar?: string;
  description?: string;
  participants: User[];
  messages: Message[];
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Chat {
  private _chatId: string;
  private _type: ChatType;
  private _name: string;
  private _avatar?: string;
  private _description?: string;
  private _participants: Map<string, User>;
  private _messages: Message[];
  private _unreadCount: number;
  private _isPinned: boolean;
  private _isMuted: boolean;
  private _createdAt: Date;
  private _updatedAt: Date;

  // Listeners для обновления UI
  private _onMessagesChange?: (messages: Message[]) => void;
  private _onUnreadChange?: (count: number) => void;

  constructor(data: Partial<ChatData> & { chatId: string }) {
    this._chatId = data.chatId;
    this._type = data.type || 'private';
    this._name = data.name || '';
    this._avatar = data.avatar;
    this._description = data.description;
    this._participants = new Map();
    this._messages = [];
    this._unreadCount = data.unreadCount || 0;
    this._isPinned = data.isPinned || false;
    this._isMuted = data.isMuted || false;
    this._createdAt = data.createdAt || new Date();
    this._updatedAt = data.updatedAt || new Date();

    // Инициализация участников
    if (data.participants) {
      data.participants.forEach(user => {
        this._participants.set(user.userId, user);
      });
    }

    // Инициализация сообщений
    if (data.messages) {
      this._messages = [...data.messages];
    }
  }

  // ==================== GETTERS ====================

  get chatId(): string {
    return this._chatId;
  }

  get type(): ChatType {
    return this._type;
  }

  get name(): string {
    return this._name;
  }

  get avatar(): string | undefined {
    return this._avatar;
  }

  get description(): string | undefined {
    return this._description;
  }

  get participants(): User[] {
    return Array.from(this._participants.values());
  }

  get messages(): Message[] {
    return [...this._messages];
  }

  get lastMessage(): Message | undefined {
    return this._messages[this._messages.length - 1];
  }

  get unreadCount(): number {
    return this._unreadCount;
  }

  get isPinned(): boolean {
    return this._isPinned;
  }

  get isMuted(): boolean {
    return this._isMuted;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // ==================== SETTERS ====================

  set name(value: string) {
    this._name = value;
    this._updatedAt = new Date();
  }

  set avatar(value: string | undefined) {
    this._avatar = value;
    this._updatedAt = new Date();
  }

  set description(value: string | undefined) {
    this._description = value;
    this._updatedAt = new Date();
  }

  set isPinned(value: boolean) {
    this._isPinned = value;
    this._updatedAt = new Date();
  }

  set isMuted(value: boolean) {
    this._isMuted = value;
    this._updatedAt = new Date();
  }

  // ==================== МЕТОДЫ РАБОТЫ С СООБЩЕНИЯМИ ====================

  /**
   * Добавить сообщение в чат
   * @param msg Сообщение для добавления
   * @returns Добавленное сообщение
   */
  addMessage(msg: Message): Message {
    // Проверяем что сообщения нет в списке
    const existingIndex = this._messages.findIndex(m => m.messageId === msg.messageId);
    
    if (existingIndex === -1) {
      // Добавляем новое сообщение
      this._messages.push(msg);
      
      // Сортируем по времени
      this._messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      
      // Увеличиваем счётчик непрочитанных (если не от текущего пользователя)
      if (msg.status !== 'read') {
        this._unreadCount++;
        this._onUnreadChange?.(this._unreadCount);
      }
    } else {
      // Обновляем существующее сообщение
      this._messages[existingIndex] = msg;
    }

    this._updatedAt = new Date();
    this._onMessagesChange?.(this._messages);
    
    return msg;
  }

  /**
   * Удалить сообщение из чата
   * @param msgId ID сообщения для удаления
   * @returns true если удалено, false если не найдено
   */
  deleteMessage(msgId: string): boolean {
    const index = this._messages.findIndex(m => m.messageId === msgId);
    
    if (index !== -1) {
      const message = this._messages[index];
      
      // Мягкое удаление - помечаем как удалённое
      message.markDeleted();
      
      this._updatedAt = new Date();
      this._onMessagesChange?.(this._messages);
      
      return true;
    }
    
    return false;
  }

  /**
   * Полное удаление сообщения (без возможности восстановления)
   * @param msgId ID сообщения
   * @returns true если удалено
   */
  hardDeleteMessage(msgId: string): boolean {
    const index = this._messages.findIndex(m => m.messageId === msgId);
    
    if (index !== -1) {
      this._messages.splice(index, 1);
      this._updatedAt = new Date();
      this._onMessagesChange?.(this._messages);
      return true;
    }
    
    return false;
  }

  /**
   * Получить сообщения с пагинацией
   * @param count Количество сообщений
   * @param offset Смещение от начала (старые сообщения)
   * @returns Массив сообщений
   */
  getMessages(count: number = 50, offset: number = 0): Message[] {
    // Возвращаем сообщения от конца (новые первые при скролле вверх)
    const startIndex = Math.max(0, this._messages.length - offset - count);
    const endIndex = Math.max(0, this._messages.length - offset);
    
    return this._messages.slice(startIndex, endIndex);
  }

  /**
   * Получить сообщение по ID
   * @param msgId ID сообщения
   * @returns Сообщение или undefined
   */
  getMessage(msgId: string): Message | undefined {
    return this._messages.find(m => m.messageId === msgId);
  }

  /**
   * Обновить статус сообщения
   * @param msgId ID сообщения
   * @param status Новый статус
   */
  updateMessageStatus(msgId: string, status: MessageStatus): void {
    const message = this.getMessage(msgId);
    if (message) {
      message.updateStatus(status);
      this._onMessagesChange?.(this._messages);
    }
  }

  /**
   * Пометить все сообщения как прочитанные
   */
  markAllAsRead(): void {
    this._messages.forEach(msg => {
      if (msg.status !== 'read') {
        msg.markRead();
      }
    });
    
    this._unreadCount = 0;
    this._onUnreadChange?.(0);
    this._onMessagesChange?.(this._messages);
  }

  // ==================== МЕТОДЫ РАБОТЫ С УЧАСТНИКАМИ ====================

  /**
   * Добавить участника в чат
   * @param user Пользователь
   */
  addParticipant(user: User): void {
    this._participants.set(user.userId, user);
    this._updatedAt = new Date();
  }

  /**
   * Удалить участника из чата
   * @param userId ID пользователя
   * @returns true если удалён
   */
  removeParticipant(userId: string): boolean {
    const result = this._participants.delete(userId);
    if (result) {
      this._updatedAt = new Date();
    }
    return result;
  }

  /**
   * Получить участника по ID
   * @param userId ID пользователя
   * @returns Пользователь или undefined
   */
  getParticipant(userId: string): User | undefined {
    return this._participants.get(userId);
  }

  /**
   * Проверить является ли пользователь участником
   * @param userId ID пользователя
   * @returns true если участник
   */
  hasParticipant(userId: string): boolean {
    return this._participants.has(userId);
  }

  // ==================== EVENT LISTENERS ====================

  /**
   * Подписаться на изменения сообщений
   */
  onMessagesChange(callback: (messages: Message[]) => void): void {
    this._onMessagesChange = callback;
  }

  /**
   * Подписаться на изменения счётчика непрочитанных
   */
  onUnreadChange(callback: (count: number) => void): void {
    this._onUnreadChange = callback;
  }

  // ==================== СЕРИАЛИЗАЦИЯ ====================

  /**
   * Сериализовать в JSON
   */
  toJSON(): ChatData {
    return {
      chatId: this._chatId,
      type: this._type,
      name: this._name,
      avatar: this._avatar,
      description: this._description,
      participants: this.participants,
      messages: this._messages,
      unreadCount: this._unreadCount,
      isPinned: this._isPinned,
      isMuted: this._isMuted,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  /**
   * Создать из JSON
   */
  static fromJSON(data: ChatData): Chat {
    return new Chat(data);
  }
}
