/**
 * TELEGRAM DARK THEME
 * Темная тема в стиле Telegram с неоновыми акцентами
 */

// ======================
// ОСНОВНЫЕ ЦВЕТА
// ======================
export const TelegramDarkColors = {
  // Фоны
  background: '#0F0F0F',           // Главный фон (черный)
  backgroundSecondary: '#1A1A1A',  // Вторичный фон (левая панель)
  backgroundTertiary: '#2D2D2D',   // Третичный фон (карточки)
  surface: '#1E1E1E',              // Поверхность элементов
  
  // Границы и разделители
  border: '#2D2D2D',
  separator: '#2D2D2D',
  divider: 'rgba(255, 255, 255, 0.08)',
  
  // Текст
  textPrimary: '#FFFFFF',
  textSecondary: '#8E8E93',
  textTertiary: '#636366',
  textAccent: '#8A2BE2',
  
  // Акцентные цвета
  primary: '#8A2BE2',              // Неоново-фиолетовый (основной)
  primaryLight: '#9D4EDD',
  primaryDark: '#7B1FA2',
  
  // Функциональные цвета
  accent: '#8A2BE2',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  info: '#007AFF',
  online: '#34C759',
  
  // Сообщения
  messageMine: '#8A2BE2',          // Мои сообщения - фиолетовый
  messageTheirs: '#2D2D2D',        // Чужие сообщения - серый
  messageText: '#FFFFFF',
  messageTime: 'rgba(255, 255, 255, 0.6)',
  
  // Overlay и эффекты
  overlay: 'rgba(0, 0, 0, 0.5)',
  ripple: 'rgba(255, 255, 255, 0.1)',
  shadow: 'rgba(0, 0, 0, 0.3)',
  glow: 'rgba(138, 43, 226, 0.3)',  // Фиолетовое свечение
};

// ======================
// РАЗМЕРЫ И ОТСТУПЫ
// ======================
export const TelegramSizes = {
  // Отступы
  paddingXS: 4,
  paddingS: 8,
  paddingM: 12,
  paddingL: 16,
  paddingXL: 20,
  paddingXXL: 24,
  
  // Радиусы
  radiusXS: 4,
  radiusS: 8,
  radiusM: 12,
  radiusL: 16,
  radiusXL: 20,
  radiusFull: 9999,
  
  // Размеры элементов
  avatarSmall: 36,
  avatarMedium: 44,
  avatarLarge: 56,
  avatarXL: 80,
  
  chatItemHeight: 72,
  headerHeight: 56,
  bottomNavHeight: 56,
  inputMinHeight: 44,
  inputMaxHeight: 120,
  
  // Сообщения
  messageMaxWidth: '75%',
  messagePadding: 12,
  messageRadius: 12,
  messageCornerRadius: 4,  // Угол со стороны отправителя
  
  // Иконки
  iconSmall: 18,
  iconMedium: 22,
  iconLarge: 26,
  iconXL: 32,
};

// ======================
// ТИПОГРАФИКА
// ======================
export const TelegramTypography = {
  // Заголовки
  titleLarge: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  titleMedium: {
    fontSize: 22,
    fontWeight: '600' as const,
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  titleSmall: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  
  // Текст
  bodyLarge: {
    fontSize: 17,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  bodyMedium: {
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  bodySmall: {
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18,
  },
  
  // Вспомогательный текст
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  timestamp: {
    fontSize: 11,
    fontWeight: '400' as const,
    lineHeight: 14,
  },
  
  // Кнопки
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 22,
  },
  buttonSmall: {
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 18,
  },
};

// ======================
// АНИМАЦИИ
// ======================
export const TelegramAnimations = {
  // Длительности
  durationFast: 150,
  durationNormal: 250,
  durationSlow: 350,
  
  // Пружинные настройки
  springTension: 300,
  springFriction: 25,
  
  // Свайп настройки
  swipeThreshold: 60,
  swipeActionWidth: 80,
  maxSwipeOffset: 120,
  horizontalThreshold: 10,
  directionLockRatio: 1.5,
};

// ======================
// ТЕНИ
// ======================
export const TelegramShadows = {
  none: {},
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1,
    elevation: 1,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  glow: {
    shadowColor: '#8A2BE2',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
};

// ======================
// ЭКСПОРТ ПО УМОЛЧАНИЮ
// ======================
export default {
  colors: TelegramDarkColors,
  sizes: TelegramSizes,
  typography: TelegramTypography,
  animations: TelegramAnimations,
  shadows: TelegramShadows,
};
