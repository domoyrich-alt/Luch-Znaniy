// Типы для настроек приложения

export interface UserSettings {
  // Профиль
  profile: {
    displayName?: string;
    bio?: string;
    status?: string;
    avatar?: string;
    showOnlineStatus: boolean;
    showLastSeen: boolean;
    showGrades: boolean;
    profileVisibility: 'everyone' | 'contacts' | 'nobody';
  };
  
  // Приватность
  privacy: {
    showPhone: 'everyone' | 'contacts' | 'nobody';
    showLastSeen: 'everyone' | 'contacts' | 'nobody';
    showAvatar: 'everyone' | 'contacts' | 'nobody';
    showBio: 'everyone' | 'contacts' | 'nobody';
    readReceipts: boolean;
  };
  
  // Уведомления
  notifications: {
    enabled: boolean;
    messages: boolean;
    groups: boolean;
    mentions: boolean;
    sound: boolean;
    vibration: boolean;
    preview: boolean;
    // Старые поля для совместимости
    pushEnabled?: boolean;
    soundEnabled?: boolean;
    vibrationEnabled?: boolean;
    grades?: boolean;
    homework?: boolean;
    events?: boolean;
    announcements?: boolean;
  };
  
  // Внешний вид
  appearance: {
    theme: 'light' | 'dark' | 'system';
    accentColor: string;
    fontSize: 'small' | 'medium' | 'large';
    chatBubbles: boolean;
    sendOnEnter: boolean;
    animations: boolean;
    reduceAnimations?: boolean;
  };
  
  // Общие
  general: {
    language: 'ru' | 'en' | 'kz';
    autoDownloadMedia: boolean;
  };
  
  // Чёрный список
  blockedUsers: BlockedUser[];
}

export const DEFAULT_SETTINGS: UserSettings = {
  profile: {
    showOnlineStatus: true,
    showLastSeen: true,
    showGrades: false,
    profileVisibility: 'everyone',
  },
  privacy: {
    showPhone: 'contacts',
    showLastSeen: 'everyone',
    showAvatar: 'everyone',
    showBio: 'everyone',
    readReceipts: true,
  },
  notifications: {
    enabled: true,
    messages: true,
    groups: true,
    mentions: true,
    sound: true,
    vibration: true,
    preview: true,
    pushEnabled: true,
    soundEnabled: true,
    vibrationEnabled: true,
    grades: true,
    homework: true,
    events: true,
    announcements: true,
  },
  appearance: {
    theme: 'system',
    accentColor: '#007AFF',
    fontSize: 'medium',
    chatBubbles: true,
    sendOnEnter: false,
    animations: true,
    reduceAnimations: false,
  },
  general: {
    language: 'ru',
    autoDownloadMedia: true,
  },
  blockedUsers: [],
};

export interface BlockedUser {
  id: string;
  username: string;
  displayName?: string;
  avatar?: string;
  blockedAt: number;
}

export const ACCENT_COLORS = [
  { name: 'Синий', value: '#007AFF' },
  { name: 'Красный', value: '#FF6B6B' },
  { name: 'Бирюзовый', value: '#4ECDC4' },
  { name: 'Зелёный', value: '#22C55E' },
  { name: 'Фиолетовый', value: '#8B5CF6' },
  { name: 'Оранжевый', value: '#F59E0B' },
  { name: 'Розовый', value: '#EC4899' },
  { name: 'Индиго', value: '#6366F1' },
];

export const LANGUAGES = [
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'kz', name: 'Қазақша', flag: '🇰🇿' },
];

