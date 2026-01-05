/**
 * TELEGRAM DARK THEME
 * Темная тема в стиле Telegram с фиолетовыми акцентами
 */

// ======================
// ОСНОВНЫЕ ЦВЕТА (Purple Telegram Palette)
// ======================
export const TelegramDarkColors = {
  // Фоны - темная тема как в Telegram
  background: '#0E0E0E',           // Главный фон чата - очень темный
  backgroundSecondary: '#1A1A1A',  // Вторичный фон (левая панель)
  backgroundTertiary: '#252525',   // Третичный фон (карточки, поле ввода)
  surface: '#2A2A2A',              // Поверхность элементов
  surfaceElevated: '#303030',      // Приподнятые элементы
  
  // Границы и разделители
  border: '#2A2A2A',
  separator: '#252525',
  divider: 'rgba(255, 255, 255, 0.08)',
  
  // Текст - высокий контраст
  textPrimary: '#ECEDEE',
  textSecondary: '#9BA1A6',        // Dimmed gray для вторичного текста
  textTertiary: '#6B7280',
  textAccent: '#8B5CF6',
  
  // Акцентные цвета - фиолетовые как в обновленном дизайне
  primary: '#8B5CF6',              // Фиолетовый акцент
  primaryLight: '#A855F7',
  primaryDark: '#7C3AED',
  
  // Функциональные цвета
  accent: '#8B5CF6',
  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',
  info: '#60A5FA',
  online: '#22C55E',
  
  // Сообщения - Telegram style
  messageMine: '#8B5CF6',          // Мои сообщения - фиолетовый
  messageMineGradientStart: '#8B5CF6',
  messageMineGradientEnd: '#7C3AED',
  messageTheirs: '#2A2A2A',        // Чужие сообщения - темно-серый
  messageText: '#FFFFFF',
  messageTime: 'rgba(255, 255, 255, 0.55)',
  
  // Overlay и эффекты
  overlay: 'rgba(14, 14, 14, 0.85)',
  ripple: 'rgba(139, 92, 246, 0.12)',
  shadow: 'rgba(0, 0, 0, 0.35)',
  glow: 'rgba(139, 92, 246, 0.25)',  // Фиолетовое свечение
  
  // Дополнительные цвета для UI
  inputBackground: '#252525',
  inputBorder: '#2A2A2A',
  headerBackground: 'rgba(26, 26, 26, 0.92)',
  tabBarBackground: 'rgba(26, 26, 26, 0.95)',
};

// ======================
// РАЗМЕРЫ И ОТСТУПЫ (High-fidelity UI specs)
// ======================
export const TelegramSizes = {
  // Отступы - увеличенные для премиум вида
  paddingXS: 4,
  paddingS: 8,
  paddingM: 12,
  paddingL: 16,
  paddingXL: 20,
  paddingXXL: 24,
  paddingChat: 14,          // Отступы в чате
  
  // Радиусы - bubble radius 18px
  radiusXS: 4,
  radiusS: 8,
  radiusM: 12,
  radiusL: 16,
  radiusXL: 20,
  radiusFull: 9999,
  
  // Размеры элементов
  avatarSmall: 38,
  avatarMedium: 48,         // Увеличенный аватар в списке
  avatarLarge: 60,
  avatarXL: 88,
  
  chatItemHeight: 76,       // Больше высота для "воздуха"
  headerHeight: 60,
  bottomNavHeight: 60,
  inputMinHeight: 48,
  inputMaxHeight: 140,
  
  // Сообщения - bubble radius 18px with tails
  messageMaxWidth: '78%',
  messagePadding: 14,
  messageRadius: 18,        // Premium bubble radius
  messageTailRadius: 6,     // Tail corner radius
  messageCornerRadius: 6,   // Угол со стороны отправителя
  
  // Иконки - 2px stroke weight
  iconSmall: 18,
  iconMedium: 22,
  iconLarge: 24,
  iconXL: 28,
  iconStrokeWidth: 2,       // Consistent stroke weight
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
