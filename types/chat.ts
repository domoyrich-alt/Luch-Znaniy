// Типы для системы чатов

export interface Chat {
  id: number;
  type: 'private' | 'group' | 'class';
  name: string;
  avatar?: string;
  lastMessage?: Message;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  participants: ChatParticipant[];
  createdAt: string;
}

export interface Message {
  id: number;
  chatId: number;
  senderId: number;
  senderName: string;
  senderAvatar?: string;
  text?: string;
  type: 'text' | 'image' | 'file' | 'voice' | 'system';
  mediaUrl?: string;
  fileName?: string;
  voiceDuration?: number;
  replyTo?: Message;
  forwardedFrom?: { chatName: string; senderName: string };
  reactions: Reaction[];
  isPinned: boolean;
  isEdited: boolean;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  createdAt: string;
  editedAt?: string;
}

export interface Reaction {
  emoji: string;
  userId: number;
  userName: string;
}

export interface ChatParticipant {
  userId: number;
  name: string;
  avatar?: string;
  role: 'admin' | 'member';
  isOnline: boolean;
  lastSeen?: string;
}
