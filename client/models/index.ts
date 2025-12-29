/**
 * МОДЕЛИ ЧАТА
 * 
 * Экспорт всех классов и типов для системы чатов
 */

// Основные классы
export { Chat } from './Chat';
export { Message } from './Message';
export { User } from './User';
export { chatManager, ChatManager } from './ChatManager';

// Типы Chat
export type { ChatData, ChatType } from './Chat';

// Типы Message
export type {
  MessageStatus,
  MessageType,
  MessageMedia,
  MessageReaction,
  ReplyInfo,
  ForwardInfo,
  MessageData,
} from './Message';

// Типы User
export type {
  UserStatus,
  UserRole,
  UserData,
} from './User';

// Типы ChatManager
export type { ChatListItem } from './ChatManager';
