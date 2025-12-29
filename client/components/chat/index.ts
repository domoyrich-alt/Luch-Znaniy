/**
 * TELEGRAM-STYLE CHAT COMPONENTS INDEX
 * 
 * Экспорт всех компонентов чата
 */

// Существующие компоненты
export { MessageBubble } from './MessageBubble';
export { ChatListItem } from './ChatListItem';
export { MediaPicker } from './MediaPicker';
export { MessageContextMenu } from './MessageContextMenu';
export { ReactionPicker } from './ReactionPicker';
export { ReplyPreview } from './ReplyPreview';
export { VoiceRecorder } from './VoiceRecorder';

// Новые оптимизированные компоненты
export { default as OptimizedChatListItem } from './OptimizedChatListItem';
export { default as OptimizedMessageBubble } from './OptimizedMessageBubble';
export { default as TelegramContextMenu } from './TelegramContextMenu';
export { default as TelegramChatInput } from './TelegramChatInput';

// Компоненты поиска
export { default as TelegramSearchBar } from './TelegramSearchBar';
export { default as TelegramSearchResults } from './TelegramSearchResults';
export { default as TelegramInChatSearch } from './TelegramInChatSearch';
export { default as TelegramMediaGallery } from './TelegramMediaGallery';
