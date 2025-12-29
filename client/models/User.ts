/**
 * КЛАСС ПОЛЬЗОВАТЕЛЯ (User)
 * 
 * Хранит:
 * - user_id — уникальный идентификатор
 * - username — имя пользователя
 * - avatar — ссылка или объект изображения
 * 
 * Методы:
 * - sendMessage(Chat chat, Message msg)
 */

import { Chat } from './Chat';
import { Message, MessageMedia } from './Message';

export type UserStatus = 'online' | 'offline' | 'away' | 'busy';
export type UserRole = 'admin' | 'member' | 'owner';

export interface UserData {
  userId: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  bio?: string;
  phoneNumber?: string;
  email?: string;
  status: UserStatus;
  isOnline: boolean;
  lastSeenAt?: Date;
  role?: UserRole;
  isVerified?: boolean;
  isBlocked?: boolean;
  isMuted?: boolean;
  createdAt: Date;
}

export class User {
  private _userId: string;
  private _username: string;
  private _firstName: string;
  private _lastName: string;
  private _avatar?: string;
  private _bio?: string;
  private _phoneNumber?: string;
  private _email?: string;
  private _status: UserStatus;
  private _isOnline: boolean;
  private _lastSeenAt?: Date;
  private _role: UserRole;
  private _isVerified: boolean;
  private _isBlocked: boolean;
  private _isMuted: boolean;
  private _createdAt: Date;

  // Callback для отправки сообщений через сеть
  private _sendMessageCallback?: (chatId: string, message: Message) => Promise<Message>;

  constructor(data: Partial<UserData> & { userId: string }) {
    this._userId = data.userId;
    this._username = data.username || '';
    this._firstName = data.firstName || '';
    this._lastName = data.lastName || '';
    this._avatar = data.avatar;
    this._bio = data.bio;
    this._phoneNumber = data.phoneNumber;
    this._email = data.email;
    this._status = data.status || 'offline';
    this._isOnline = data.isOnline || false;
    this._lastSeenAt = data.lastSeenAt;
    this._role = data.role || 'member';
    this._isVerified = data.isVerified || false;
    this._isBlocked = data.isBlocked || false;
    this._isMuted = data.isMuted || false;
    this._createdAt = data.createdAt || new Date();
  }

  // ==================== GETTERS ====================

  get userId(): string {
    return this._userId;
  }

  get username(): string {
    return this._username;
  }

  get firstName(): string {
    return this._firstName;
  }

  get lastName(): string {
    return this._lastName;
  }

  get fullName(): string {
    return `${this._firstName} ${this._lastName}`.trim() || this._username;
  }

  get displayName(): string {
    if (this._firstName || this._lastName) {
      return this.fullName;
    }
    return this._username || 'Пользователь';
  }

  get avatar(): string | undefined {
    return this._avatar;
  }

  get bio(): string | undefined {
    return this._bio;
  }

  get phoneNumber(): string | undefined {
    return this._phoneNumber;
  }

  get email(): string | undefined {
    return this._email;
  }

  get status(): UserStatus {
    return this._status;
  }

  get isOnline(): boolean {
    return this._isOnline;
  }

  get lastSeenAt(): Date | undefined {
    return this._lastSeenAt;
  }

  get role(): UserRole {
    return this._role;
  }

  get isVerified(): boolean {
    return this._isVerified;
  }

  get isBlocked(): boolean {
    return this._isBlocked;
  }

  get isMuted(): boolean {
    return this._isMuted;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get initials(): string {
    const first = this._firstName?.charAt(0) || '';
    const last = this._lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || this._username?.charAt(0)?.toUpperCase() || '?';
  }

  // ==================== SETTERS ====================

  set username(value: string) {
    this._username = value;
  }

  set firstName(value: string) {
    this._firstName = value;
  }

  set lastName(value: string) {
    this._lastName = value;
  }

  set avatar(value: string | undefined) {
    this._avatar = value;
  }

  set bio(value: string | undefined) {
    this._bio = value;
  }

  set phoneNumber(value: string | undefined) {
    this._phoneNumber = value;
  }

  set email(value: string | undefined) {
    this._email = value;
  }

  set status(value: UserStatus) {
    this._status = value;
    this._isOnline = value === 'online';
    if (!this._isOnline) {
      this._lastSeenAt = new Date();
    }
  }

  set role(value: UserRole) {
    this._role = value;
  }

  set isBlocked(value: boolean) {
    this._isBlocked = value;
  }

  set isMuted(value: boolean) {
    this._isMuted = value;
  }

  // ==================== МЕТОДЫ ====================

  /**
   * Установить callback для отправки сообщений
   * @param callback Функция отправки
   */
  setSendMessageCallback(callback: (chatId: string, message: Message) => Promise<Message>): void {
    this._sendMessageCallback = callback;
  }

  /**
   * Отправить текстовое сообщение в чат
   * @param chat Чат для отправки
   * @param text Текст сообщения
   * @returns Отправленное сообщение
   */
  async sendMessage(chat: Chat, text: string): Promise<Message> {
    // Создаём сообщение
    const message = Message.createText(
      chat.chatId,
      this._userId,
      this.displayName,
      text,
      { senderAvatar: this._avatar }
    );

    // Добавляем в чат (optimistic update)
    chat.addMessage(message);

    // Отправляем на сервер
    if (this._sendMessageCallback) {
      try {
        const sentMessage = await this._sendMessageCallback(chat.chatId, message);
        // Обновляем статус на "отправлено"
        message.updateStatus('sent');
        return sentMessage;
      } catch (error) {
        // Помечаем как failed
        message.updateStatus('failed');
        throw error;
      }
    }

    return message;
  }

  /**
   * Отправить медиа-сообщение
   * @param chat Чат для отправки
   * @param media Медиа-контент
   * @param caption Подпись (опционально)
   * @returns Отправленное сообщение
   */
  async sendMediaMessage(chat: Chat, media: MessageMedia, caption?: string): Promise<Message> {
    const message = Message.createMedia(
      chat.chatId,
      this._userId,
      this.displayName,
      media,
      caption,
      { senderAvatar: this._avatar }
    );

    // Добавляем в чат (optimistic update)
    chat.addMessage(message);

    // Отправляем на сервер
    if (this._sendMessageCallback) {
      try {
        const sentMessage = await this._sendMessageCallback(chat.chatId, message);
        message.updateStatus('sent');
        return sentMessage;
      } catch (error) {
        message.updateStatus('failed');
        throw error;
      }
    }

    return message;
  }

  /**
   * Переслать сообщение в другой чат
   * @param message Сообщение для пересылки
   * @param toChat Целевой чат
   * @returns Пересланное сообщение
   */
  async forwardMessage(message: Message, toChat: Chat): Promise<Message> {
    const forwardedMessage = new Message({
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      chatId: toChat.chatId,
      senderId: this._userId,
      senderName: this.displayName,
      senderAvatar: this._avatar,
      text: message.text,
      type: message.type,
      media: message.media,
      status: 'sending',
      forwardedFrom: {
        originalChatId: message.chatId,
        originalChatName: '', // Нужно получить из Chat
        originalSenderId: message.senderId,
        originalSenderName: message.senderName,
        originalTimestamp: message.timestamp,
      },
    });

    toChat.addMessage(forwardedMessage);

    if (this._sendMessageCallback) {
      try {
        const sentMessage = await this._sendMessageCallback(toChat.chatId, forwardedMessage);
        forwardedMessage.updateStatus('sent');
        return sentMessage;
      } catch (error) {
        forwardedMessage.updateStatus('failed');
        throw error;
      }
    }

    return forwardedMessage;
  }

  /**
   * Получить статус в читаемом формате
   */
  getStatusText(): string {
    if (this._isOnline) {
      return 'в сети';
    }

    if (!this._lastSeenAt) {
      return 'был(а) недавно';
    }

    const diff = Date.now() - this._lastSeenAt.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'был(а) только что';
    if (minutes < 60) return `был(а) ${minutes} мин. назад`;
    if (hours < 24) return `был(а) ${hours} ч. назад`;
    if (days < 7) return `был(а) ${days} д. назад`;

    return this._lastSeenAt.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
    });
  }

  /**
   * Обновить онлайн-статус
   * @param isOnline Онлайн ли пользователь
   */
  setOnline(isOnline: boolean): void {
    this._isOnline = isOnline;
    this._status = isOnline ? 'online' : 'offline';
    
    if (!isOnline) {
      this._lastSeenAt = new Date();
    }
  }

  // ==================== СЕРИАЛИЗАЦИЯ ====================

  /**
   * Сериализовать в JSON
   */
  toJSON(): UserData {
    return {
      userId: this._userId,
      username: this._username,
      firstName: this._firstName,
      lastName: this._lastName,
      avatar: this._avatar,
      bio: this._bio,
      phoneNumber: this._phoneNumber,
      email: this._email,
      status: this._status,
      isOnline: this._isOnline,
      lastSeenAt: this._lastSeenAt,
      role: this._role,
      isVerified: this._isVerified,
      isBlocked: this._isBlocked,
      isMuted: this._isMuted,
      createdAt: this._createdAt,
    };
  }

  /**
   * Создать из JSON
   */
  static fromJSON(data: UserData): User {
    return new User({
      ...data,
      lastSeenAt: data.lastSeenAt ? new Date(data.lastSeenAt) : undefined,
      createdAt: new Date(data.createdAt),
    });
  }
}
