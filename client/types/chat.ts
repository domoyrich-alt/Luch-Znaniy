// Типы для системы чатов

export interface ChatReaction {
  emoji: string;
  userId: string;
  userName: string;
  count?: number;        // количество таких реакций
  hasReacted?: boolean;  // реагировал ли текущий пользователь
}

export interface MessageMedia {
  type: 'image' | 'video' | 'audio' | 'file';
  uri: string;
  name?: string;
  size?: number;
  duration?: number; // для аудио/видео
  width?: number;
  height?: number;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  type: 'text' | 'voice' | 'image' | 'file' | 'system';
  timestamp: number;
  createdAt?: string;      // для обратной совместимости (ISO date string)
  media?: MessageMedia;
  // Поля для обратной совместимости (используются в MessageBubble)
  mediaUrl?: string;
  mediaFileName?: string;
  mediaDuration?: number;
  replyTo?: ChatMessage;
  forwardedFrom?: {
    chatId: string;
    chatName: string;
    senderName: string;
  };
  reactions: ChatReaction[];
  isEdited?: boolean;
  isDeleted?: boolean;
  isPinned?: boolean;
  status: 'sending' | 'sent' | 'delivered' | 'read';
}

export interface ChatParticipant {
  id: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'member';
  isOnline: boolean;
  lastSeenAt?: string;
}

export interface Chat {
  id: string;
  type: 'private' | 'group' | 'channel';
  name: string;
  title?: string;          // alias для name (обратная совместимость)
  avatar?: string;
  description?: string;
  participants: ChatParticipant[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  isOnline?: boolean;
  mutedUntil?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChatDraft {
  chatId: string;
  text: string;
  replyTo?: ChatMessage;
}

export type MessageAction = 
  | 'reply' 
  | 'forward' 
  | 'edit' 
  | 'delete' 
  | 'copy' 
  | 'pin' 
  | 'react';

export const REACTION_EMOJIS = ['❤️', '👍', '😂', '😮', '😢', '🔥', '👎', '🎉'];
