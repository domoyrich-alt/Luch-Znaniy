/**
 * NEON THEME - Неоновая тема с красивым свечением
 * 
 * Ультра-современный неоновый дизайн с фиолетовым/бирюзовым свечением
 * Тёмный фон с акцентными цветами
 */

export const NEON_COLORS = {
  // Основные неоновые цвета
  primary: '#8B5CF6',
  primaryLight: '#A78BFA',
  primaryDark: '#7C3AED',
  primaryGlow: 'rgba(139, 92, 246, 0.5)',
  
  secondary: '#4ECDC4',
  secondaryLight: '#6EE7DE',
  secondaryDark: '#2DD4BF',
  secondaryGlow: 'rgba(78, 205, 196, 0.5)',
  
  accent: '#F093FB',
  accentGlow: 'rgba(240, 147, 251, 0.5)',
  
  pink: '#FF6B9D',
  pinkGlow: 'rgba(255, 107, 157, 0.5)',
  
  // Белое свечение
  whiteGlow: 'rgba(255, 255, 255, 0.15)',
  whiteBright: 'rgba(255, 255, 255, 0.3)',
  
  // Фоны - глубокие тёмные тона
  backgroundDark: '#08080C',
  backgroundCard: '#0F0F14',
  backgroundSecondary: '#16161D',
  backgroundTertiary: '#1C1C26',
  
  // Текст
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  textDisabled: '#4B5563',
  
  // Статусы
  success: '#10B981',
  successGlow: 'rgba(16, 185, 129, 0.4)',
  warning: '#FBBF24',
  warningGlow: 'rgba(251, 191, 36, 0.4)',
  error: '#EF4444',
  errorGlow: 'rgba(239, 68, 68, 0.4)',
  info: '#3B82F6',
  infoGlow: 'rgba(59, 130, 246, 0.4)',
  
  // Градиенты
  gradientPrimary: ['#8B5CF6', '#6366F1'],
  gradientSecondary: ['#4ECDC4', '#06B6D4'],
  gradientPink: ['#F093FB', '#F5576C'],
  gradientSunset: ['#FF6B6B', '#FBBF24'],
  gradientNeon: ['#8B5CF6', '#F093FB', '#4ECDC4'],
  gradientCool: ['#6366F1', '#8B5CF6', '#EC4899'],
  
  // Границы
  borderDefault: 'rgba(139, 92, 246, 0.15)',
  borderLight: 'rgba(139, 92, 246, 0.08)',
  borderActive: 'rgba(139, 92, 246, 0.4)',
};

export const NEON_SHADOWS = {
  // Тени с неоновым свечением - улучшенные
  primary: {
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 12,
  },
  primarySubtle: {
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  secondary: {
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 12,
  },
  secondarySubtle: {
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  white: {
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 25,
    elevation: 18,
  },
  card: {
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  button: {
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 8,
  },
  fab: {
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 14,
  },
};

// Стили для неонового свечения по бокам
export const NEON_GLOW_STYLES = {
  leftGlow: {
    position: 'absolute' as const,
    left: 0,
    top: 0,
    bottom: 0,
    width: 100,
    backgroundColor: 'transparent',
  },
  rightGlow: {
    position: 'absolute' as const,
    right: 0,
    top: 0,
    bottom: 0,
    width: 100,
    backgroundColor: 'transparent',
  },
  topGlow: {
    position: 'absolute' as const,
    left: 0,
    right: 0,
    top: 0,
    height: 100,
    backgroundColor: 'transparent',
  },
};

// Градиенты для свечения
export const GLOW_GRADIENTS = {
  left: ['rgba(139, 92, 246, 0.3)', 'rgba(139, 92, 246, 0.1)', 'transparent'],
  right: ['transparent', 'rgba(78, 205, 196, 0.1)', 'rgba(78, 205, 196, 0.3)'],
  top: ['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)', 'transparent'],
};
