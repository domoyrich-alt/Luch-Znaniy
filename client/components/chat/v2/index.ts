/**
 * V2 CHAT COMPONENTS INDEX
 * Экспорт всех компонентов новой архитектуры
 */

// Тема
export { 
  TelegramDarkColors,
  TelegramSizes,
  TelegramTypography,
  TelegramAnimations,
  TelegramShadows,
  default as TelegramTheme,
} from '@/constants/telegramDarkTheme';

// Компоненты списка чатов
export { 
  ChatListWidget, 
  type Chat,
} from './ChatListWidget';

// Компоненты чата
export { ChatHeader } from './ChatHeader';
export { MessageBubble, type Message, type MessageReaction } from './MessageBubble';
export { ChatInput } from './ChatInput';
export { ChatInputV2 } from './ChatInputV2';

// Видео и голосовые сообщения
export { VideoCircleMessage } from './VideoCircleMessage';
export { VideoCircleRecorder } from './VideoCircleRecorder';
export { VideoCircleRecorderV2 } from './VideoCircleRecorderV2';
export { VoiceWaveform } from './VoiceWaveform';

// Пикеры и меню
export { AttachMenu, type AttachOption } from './AttachMenu';
export { EmojiPicker } from './EmojiPicker';
export { ReactionPicker } from './ReactionPicker';

// Typing indicator
export { TypingIndicator, TypingDots } from './TypingIndicator';

// Навигация
export { BottomNavigation, type TabId } from './BottomNavigation';
