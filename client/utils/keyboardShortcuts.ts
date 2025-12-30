/**
 * TELEGRAM KEYBOARD SHORTCUTS
 * Горячие клавиши как в Telegram Desktop
 */

import { useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean; // Cmd на Mac
  description: string;
  action: () => void;
}

// === Стандартные горячие клавиши Telegram Desktop ===
export const TELEGRAM_SHORTCUTS = {
  // Навигация
  GLOBAL_SEARCH: { key: 'k', ctrl: true, description: 'Глобальный поиск' },
  SEARCH_IN_CHAT: { key: 'f', ctrl: true, description: 'Поиск в чате' },
  NEXT_CHAT: { key: 'Tab', ctrl: true, description: 'Следующий чат' },
  PREV_CHAT: { key: 'Tab', ctrl: true, shift: true, description: 'Предыдущий чат' },
  CLOSE_CHAT: { key: 'Escape', description: 'Закрыть чат' },
  GO_TO_END: { key: 'End', ctrl: true, description: 'К последнему сообщению' },
  
  // Сообщения
  SEND_MESSAGE: { key: 'Enter', description: 'Отправить сообщение' },
  NEW_LINE: { key: 'Enter', shift: true, description: 'Новая строка' },
  EDIT_LAST: { key: 'ArrowUp', description: 'Редактировать последнее сообщение' },
  REPLY: { key: 'r', ctrl: true, description: 'Ответить на сообщение' },
  FORWARD: { key: 'f', ctrl: true, shift: true, description: 'Переслать сообщение' },
  DELETE: { key: 'Delete', description: 'Удалить сообщение' },
  COPY: { key: 'c', ctrl: true, description: 'Копировать' },
  SELECT_ALL: { key: 'a', ctrl: true, description: 'Выделить всё' },
  
  // Медиа
  ATTACH_FILE: { key: 'o', ctrl: true, description: 'Прикрепить файл' },
  VOICE_MESSAGE: { key: 'r', ctrl: true, shift: true, description: 'Голосовое сообщение' },
  
  // Форматирование
  BOLD: { key: 'b', ctrl: true, description: 'Жирный' },
  ITALIC: { key: 'i', ctrl: true, description: 'Курсив' },
  UNDERLINE: { key: 'u', ctrl: true, description: 'Подчёркнутый' },
  STRIKETHROUGH: { key: 's', ctrl: true, shift: true, description: 'Зачёркнутый' },
  MONOSPACE: { key: 'm', ctrl: true, shift: true, description: 'Моноширинный' },
  LINK: { key: 'k', ctrl: true, shift: true, description: 'Добавить ссылку' },
  
  // Другое
  SETTINGS: { key: ',', ctrl: true, description: 'Настройки' },
  LOCK: { key: 'l', ctrl: true, description: 'Заблокировать' },
  MINIMIZE: { key: 'm', ctrl: true, description: 'Свернуть' },
  QUIT: { key: 'q', ctrl: true, description: 'Выход' },
} as const;

/**
 * Хук для глобальных горячих клавиш
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  useEffect(() => {
    // Только для веб
    if (Platform.OS !== 'web') return;

    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcutsRef.current) {
        const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : !event.ctrlKey && !event.metaKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          event.preventDefault();
          event.stopPropagation();
          shortcut.action();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, []);
}

/**
 * Хук для горячих клавиш чата
 */
export function useChatKeyboardShortcuts({
  onSearch,
  onGlobalSearch,
  onSend,
  onReply,
  onForward,
  onDelete,
  onEdit,
  onAttach,
  onClose,
  onNextChat,
  onPrevChat,
  onScrollToEnd,
}: {
  onSearch?: () => void;
  onGlobalSearch?: () => void;
  onSend?: () => void;
  onReply?: () => void;
  onForward?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  onAttach?: () => void;
  onClose?: () => void;
  onNextChat?: () => void;
  onPrevChat?: () => void;
  onScrollToEnd?: () => void;
}) {
  const shortcuts: KeyboardShortcut[] = [];

  if (onGlobalSearch) {
    shortcuts.push({
      ...TELEGRAM_SHORTCUTS.GLOBAL_SEARCH,
      action: onGlobalSearch,
    });
  }

  if (onSearch) {
    shortcuts.push({
      ...TELEGRAM_SHORTCUTS.SEARCH_IN_CHAT,
      action: onSearch,
    });
  }

  if (onClose) {
    shortcuts.push({
      ...TELEGRAM_SHORTCUTS.CLOSE_CHAT,
      action: onClose,
    });
  }

  if (onNextChat) {
    shortcuts.push({
      ...TELEGRAM_SHORTCUTS.NEXT_CHAT,
      action: onNextChat,
    });
  }

  if (onPrevChat) {
    shortcuts.push({
      ...TELEGRAM_SHORTCUTS.PREV_CHAT,
      action: onPrevChat,
    });
  }

  if (onReply) {
    shortcuts.push({
      ...TELEGRAM_SHORTCUTS.REPLY,
      action: onReply,
    });
  }

  if (onForward) {
    shortcuts.push({
      ...TELEGRAM_SHORTCUTS.FORWARD,
      action: onForward,
    });
  }

  if (onDelete) {
    shortcuts.push({
      ...TELEGRAM_SHORTCUTS.DELETE,
      action: onDelete,
    });
  }

  if (onAttach) {
    shortcuts.push({
      ...TELEGRAM_SHORTCUTS.ATTACH_FILE,
      action: onAttach,
    });
  }

  if (onScrollToEnd) {
    shortcuts.push({
      ...TELEGRAM_SHORTCUTS.GO_TO_END,
      action: onScrollToEnd,
    });
  }

  useKeyboardShortcuts(shortcuts);
}

/**
 * Хук для форматирования текста
 */
export function useTextFormattingShortcuts({
  onBold,
  onItalic,
  onUnderline,
  onStrikethrough,
  onMonospace,
  onLink,
}: {
  onBold?: () => void;
  onItalic?: () => void;
  onUnderline?: () => void;
  onStrikethrough?: () => void;
  onMonospace?: () => void;
  onLink?: () => void;
}) {
  const shortcuts: KeyboardShortcut[] = [];

  if (onBold) {
    shortcuts.push({ ...TELEGRAM_SHORTCUTS.BOLD, action: onBold });
  }
  if (onItalic) {
    shortcuts.push({ ...TELEGRAM_SHORTCUTS.ITALIC, action: onItalic });
  }
  if (onUnderline) {
    shortcuts.push({ ...TELEGRAM_SHORTCUTS.UNDERLINE, action: onUnderline });
  }
  if (onStrikethrough) {
    shortcuts.push({ ...TELEGRAM_SHORTCUTS.STRIKETHROUGH, action: onStrikethrough });
  }
  if (onMonospace) {
    shortcuts.push({ ...TELEGRAM_SHORTCUTS.MONOSPACE, action: onMonospace });
  }
  if (onLink) {
    shortcuts.push({ ...TELEGRAM_SHORTCUTS.LINK, action: onLink });
  }

  useKeyboardShortcuts(shortcuts);
}

/**
 * Получить строку с комбинацией клавиш для отображения
 */
export function getShortcutString(shortcut: { key: string; ctrl?: boolean; shift?: boolean; alt?: boolean }): string {
  const parts: string[] = [];
  
  const isMac = Platform.OS === 'web' && typeof navigator !== 'undefined' && 
    /Mac|iPod|iPhone|iPad/.test(navigator.platform);

  if (shortcut.ctrl) {
    parts.push(isMac ? '⌘' : 'Ctrl');
  }
  if (shortcut.shift) {
    parts.push(isMac ? '⇧' : 'Shift');
  }
  if (shortcut.alt) {
    parts.push(isMac ? '⌥' : 'Alt');
  }
  
  // Форматируем клавишу
  let key = shortcut.key;
  if (key === 'ArrowUp') key = '↑';
  else if (key === 'ArrowDown') key = '↓';
  else if (key === 'ArrowLeft') key = '←';
  else if (key === 'ArrowRight') key = '→';
  else if (key === 'Enter') key = '↵';
  else if (key === 'Escape') key = 'Esc';
  else if (key === 'Delete') key = 'Del';
  else key = key.toUpperCase();
  
  parts.push(key);
  
  return parts.join(isMac ? '' : '+');
}

export default {
  useKeyboardShortcuts,
  useChatKeyboardShortcuts,
  useTextFormattingShortcuts,
  getShortcutString,
  TELEGRAM_SHORTCUTS,
};
