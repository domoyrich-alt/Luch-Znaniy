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
export { MessageBubble, type Message } from './MessageBubble';
export { ChatInput } from './ChatInput';

// Пикеры и меню
export { AttachMenu, type AttachOption } from './AttachMenu';
export { EmojiPicker } from './EmojiPicker';

// Навигация
export { BottomNavigation, type TabId } from './BottomNavigation';
