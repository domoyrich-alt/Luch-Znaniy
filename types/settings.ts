// Типы для настроек пользователя

export interface UserSettings {
  // Приватность
  profileVisibility: 'all' | 'class' | 'none';
  gradesVisibility: 'all' | 'self' | 'parents';
  showOnlineStatus: boolean;
  showLastSeen: boolean;
  
  // Уведомления
  pushEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  gradeNotifications: boolean;
  homeworkNotifications: boolean;
  eventReminders: boolean;
  emailNotifications: boolean;
  
  // Внешний вид
  theme: 'light' | 'dark' | 'system';
  accentColor: string;
  fontSize: 'small' | 'medium' | 'large';
  compactMode: boolean;
  
  // Общие
  language: 'ru' | 'en' | 'kz';
  autoDownloadMedia: 'wifi' | 'always' | 'never';
}

export const DEFAULT_SETTINGS: UserSettings = {
  // Приватность
  profileVisibility: 'all',
  gradesVisibility: 'self',
  showOnlineStatus: true,
  showLastSeen: true,
  
  // Уведомления
  pushEnabled: true,
  soundEnabled: true,
  vibrationEnabled: true,
  gradeNotifications: true,
  homeworkNotifications: true,
  eventReminders: true,
  emailNotifications: false,
  
  // Внешний вид
  theme: 'system',
  accentColor: '#4A90E2',
  fontSize: 'medium',
  compactMode: false,
  
  // Общие
  language: 'ru',
  autoDownloadMedia: 'wifi',
};
