/**
 * КЛАСС СООБЩЕНИЯ (Message)
 * 
 * Хранит:
 * - message_id — уникальный идентификатор
 * - sender_id — ID отправителя
 * - text или media — содержимое
 * - timestamp — время отправки
 * - status — статус (отправлено, доставлено, прочитано)
 * 
 * Методы:
 * - editText(string new_text)
 * - markRead()
 */

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
export type MessageType = 'text' | 'voice' | 'image' | 'video' | 'file' | 'video_note' | 'sticker' | 'system';

export interface MessageMedia {
  type: 'image' | 'video' | 'audio' | 'file' | 'video_note' | 'sticker';
  uri: string;
  name?: string;
  size?: number;
  duration?: number;  // для аудио/видео в секундах
  width?: number;
  height?: number;
  thumbnail?: string; // превью для видео
  waveform?: number[]; // волна для голосовых
}

export interface MessageReaction {
  emoji: string;
  userId: string;
  userName: string;
}

export interface ReplyInfo {
  messageId: string;
  senderId: string;
  senderName: string;
  text?: string;
  mediaType?: string;
}

export interface ForwardInfo {
  originalChatId: string;
  originalChatName: string;
  originalSenderId: string;
  originalSenderName: string;
  originalTimestamp: Date;
}

export interface MessageData {
  messageId: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text?: string;
  type: MessageType;
  media?: MessageMedia;
  timestamp: Date;
  status: MessageStatus;
  replyTo?: ReplyInfo;
  forwardedFrom?: ForwardInfo;
  reactions: MessageReaction[];
  isEdited: boolean;
  isDeleted: boolean;
  isPinned: boolean;
  editedAt?: Date;
  readAt?: Date;
}

export class Message {
  private _messageId: string;
  private _chatId: string;
  private _senderId: string;
  private _senderName: string;
  private _senderAvatar?: string;
  private _text?: string;
  private _type: MessageType;
  private _media?: MessageMedia;
  private _timestamp: Date;
  private _status: MessageStatus;
  private _replyTo?: ReplyInfo;
  private _forwardedFrom?: ForwardInfo;
  private _reactions: MessageReaction[];
  private _isEdited: boolean;
  private _isDeleted: boolean;
  private _isPinned: boolean;
  private _editedAt?: Date;
  private _readAt?: Date;

  // Listener для обновления UI
  private _onStatusChange?: (status: MessageStatus) => void;

  constructor(data: Partial<MessageData> & { messageId: string; chatId: string; senderId: string }) {
    this._messageId = data.messageId;
    this._chatId = data.chatId;
    this._senderId = data.senderId;
    this._senderName = data.senderName || '';
    this._senderAvatar = data.senderAvatar;
    this._text = data.text;
    this._type = data.type || 'text';
    this._media = data.media;
    this._timestamp = data.timestamp || new Date();
    this._status = data.status || 'sending';
    this._replyTo = data.replyTo;
    this._forwardedFrom = data.forwardedFrom;
    this._reactions = data.reactions || [];
    this._isEdited = data.isEdited || false;
    this._isDeleted = data.isDeleted || false;
    this._isPinned = data.isPinned || false;
    this._editedAt = data.editedAt;
    this._readAt = data.readAt;
  }

  // ==================== GETTERS ====================

  get messageId(): string {
    return this._messageId;
  }

  get chatId(): string {
    return this._chatId;
  }

  get senderId(): string {
    return this._senderId;
  }

  get senderName(): string {
    return this._senderName;
  }

  get senderAvatar(): string | undefined {
    return this._senderAvatar;
  }

  get text(): string | undefined {
    return this._text;
  }

  get type(): MessageType {
    return this._type;
  }

  get media(): MessageMedia | undefined {
    return this._media;
  }

  get timestamp(): Date {
    return this._timestamp;
  }

  get status(): MessageStatus {
    return this._status;
  }

  get replyTo(): ReplyInfo | undefined {
    return this._replyTo;
  }

  get forwardedFrom(): ForwardInfo | undefined {
    return this._forwardedFrom;
  }

  get reactions(): MessageReaction[] {
    return [...this._reactions];
  }

  get isEdited(): boolean {
    return this._isEdited;
  }

  get isDeleted(): boolean {
    return this._isDeleted;
  }

  get isPinned(): boolean {
    return this._isPinned;
  }

  get editedAt(): Date | undefined {
    return this._editedAt;
  }

  get readAt(): Date | undefined {
    return this._readAt;
  }

  // ==================== МЕТОДЫ ====================

  /**
   * Редактировать текст сообщения
   * @param newText Новый текст
   * @returns true если отредактировано
   */
  editText(newText: string): boolean {
    if (this._isDeleted) {
      return false;
    }

    if (this._type !== 'text') {
      return false; // Можно редактировать только текстовые сообщения
    }

    this._text = newText;
    this._isEdited = true;
    this._editedAt = new Date();

    return true;
  }

  /**
   * Пометить сообщение как прочитанное
   */
  markRead(): void {
    if (this._status !== 'read') {
      this._status = 'read';
      this._readAt = new Date();
      this._onStatusChange?.('read');
    }
  }

  /**
   * Обновить статус сообщения
   * @param status Новый статус
   */
  updateStatus(status: MessageStatus): void {
    // Статус может только повышаться: sending -> sent -> delivered -> read
    const statusOrder: MessageStatus[] = ['sending', 'sent', 'delivered', 'read'];
    const currentIndex = statusOrder.indexOf(this._status);
    const newIndex = statusOrder.indexOf(status);

    if (newIndex > currentIndex || status === 'failed') {
      this._status = status;
      this._onStatusChange?.(status);
    }
  }

  /**
   * Пометить как удалённое
   */
  markDeleted(): void {
    this._isDeleted = true;
    this._text = undefined;
    this._media = undefined;
  }

  /**
   * Закрепить/открепить сообщение
   * @param pinned Состояние закрепления
   */
  setPinned(pinned: boolean): void {
    this._isPinned = pinned;
  }

  /**
   * Добавить реакцию
   * @param emoji Эмодзи реакции
   * @param userId ID пользователя
   * @param userName Имя пользователя
   */
  addReaction(emoji: string, userId: string, userName: string): void {
    // Проверяем, не добавил ли уже этот пользователь такую реакцию
    const existingIndex = this._reactions.findIndex(
      r => r.emoji === emoji && r.userId === userId
    );

    if (existingIndex === -1) {
      this._reactions.push({ emoji, userId, userName });
    }
  }

  /**
   * Удалить реакцию
   * @param emoji Эмодзи реакции
   * @param userId ID пользователя
   */
  removeReaction(emoji: string, userId: string): void {
    const index = this._reactions.findIndex(
      r => r.emoji === emoji && r.userId === userId
    );

    if (index !== -1) {
      this._reactions.splice(index, 1);
    }
  }

  /**
   * Получить количество реакций по эмодзи
   * @param emoji Эмодзи
   * @returns Количество реакций
   */
  getReactionCount(emoji: string): number {
    return this._reactions.filter(r => r.emoji === emoji).length;
  }

  /**
   * Проверить, добавил ли пользователь реакцию
   * @param emoji Эмодзи
   * @param userId ID пользователя
   * @returns true если добавил
   */
  hasUserReacted(emoji: string, userId: string): boolean {
    return this._reactions.some(r => r.emoji === emoji && r.userId === userId);
  }

  // ==================== EVENT LISTENERS ====================

  /**
   * Подписаться на изменение статуса
   */
  onStatusChange(callback: (status: MessageStatus) => void): void {
    this._onStatusChange = callback;
  }

  // ==================== УТИЛИТЫ ====================

  /**
   * Получить время в формате HH:MM
   */
  getTimeString(): string {
    return this._timestamp.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Получить дату в читаемом формате
   */
  getDateString(): string {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDate = new Date(
      this._timestamp.getFullYear(),
      this._timestamp.getMonth(),
      this._timestamp.getDate()
    );

    const diffDays = Math.floor((today.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Сегодня';
    if (diffDays === 1) return 'Вчера';
    if (diffDays < 7) {
      const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
      return days[this._timestamp.getDay()];
    }

    return this._timestamp.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: this._timestamp.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  }

  /**
   * Получить превью текста для списка чатов
   * @param maxLength Максимальная длина
   */
  getPreviewText(maxLength: number = 50): string {
    if (this._isDeleted) {
      return '🗑 Сообщение удалено';
    }

    if (this._media) {
      switch (this._media.type) {
        case 'image': return '📷 Фото';
        case 'video': return '🎬 Видео';
        case 'video_note': return '📹 Видеосообщение';
        case 'audio': return '🎵 Голосовое сообщение';
        case 'file': return `📎 ${this._media.name || 'Файл'}`;
        case 'sticker': return '😀 Стикер';
        default: return '📎 Вложение';
      }
    }

    if (!this._text) return '';

    if (this._text.length <= maxLength) {
      return this._text;
    }

    return this._text.substring(0, maxLength - 3) + '...';
  }

  // ==================== СЕРИАЛИЗАЦИЯ ====================

  /**
   * Сериализовать в JSON
   */
  toJSON(): MessageData {
    return {
      messageId: this._messageId,
      chatId: this._chatId,
      senderId: this._senderId,
      senderName: this._senderName,
      senderAvatar: this._senderAvatar,
      text: this._text,
      type: this._type,
      media: this._media,
      timestamp: this._timestamp,
      status: this._status,
      replyTo: this._replyTo,
      forwardedFrom: this._forwardedFrom,
      reactions: this._reactions,
      isEdited: this._isEdited,
      isDeleted: this._isDeleted,
      isPinned: this._isPinned,
      editedAt: this._editedAt,
      readAt: this._readAt,
    };
  }

  /**
   * Создать из JSON
   */
  static fromJSON(data: MessageData): Message {
    return new Message({
      ...data,
      timestamp: new Date(data.timestamp),
      editedAt: data.editedAt ? new Date(data.editedAt) : undefined,
      readAt: data.readAt ? new Date(data.readAt) : undefined,
    });
  }

  /**
   * Создать текстовое сообщение
   */
  static createText(
    chatId: string,
    senderId: string,
    senderName: string,
    text: string,
    options?: Partial<MessageData>
  ): Message {
    return new Message({
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      chatId,
      senderId,
      senderName,
      text,
      type: 'text',
      status: 'sending',
      ...options,
    });
  }

  /**
   * Создать медиа-сообщение
   */
  static createMedia(
    chatId: string,
    senderId: string,
    senderName: string,
    media: MessageMedia,
    text?: string,
    options?: Partial<MessageData>
  ): Message {
    const typeMap: Record<string, MessageType> = {
      image: 'image',
      video: 'video',
      audio: 'voice',
      file: 'file',
      video_note: 'video_note',
      sticker: 'sticker',
    };

    return new Message({
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      chatId,
      senderId,
      senderName,
      text,
      type: typeMap[media.type] || 'file',
      media,
      status: 'sending',
      ...options,
    });
  }
}
