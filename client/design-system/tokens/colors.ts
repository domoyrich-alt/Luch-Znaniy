/**
 * DESIGN SYSTEM - COLORS
 * Centralized color tokens combining theme.ts and neonTheme.ts
 */

// Base color palette
export const BaseColors = {
  // Purple/Violet spectrum
  purple50: '#F5F3FF',
  purple100: '#EDE9FE',
  purple200: '#DDD6FE',
  purple300: '#C4B5FD',
  purple400: '#A78BFA',
  purple500: '#8B5CF6',
  purple600: '#7C3AED',
  purple700: '#6D28D9',
  purple800: '#5B21B6',
  purple900: '#4C1D95',
  
  // Cyan/Teal spectrum
  cyan50: '#ECFEFF',
  cyan100: '#CFFAFE',
  cyan200: '#A5F3FC',
  cyan300: '#67E8F9',
  cyan400: '#22D3EE',
  cyan500: '#06B6D4',
  cyan600: '#0891B2',
  cyan700: '#0E7490',
  cyan800: '#155E75',
  cyan900: '#164E63',
  
  // Emerald/Green spectrum
  emerald50: '#ECFDF5',
  emerald100: '#D1FAE5',
  emerald200: '#A7F3D0',
  emerald300: '#6EE7B7',
  emerald400: '#34D399',
  emerald500: '#10B981',
  emerald600: '#059669',
  emerald700: '#047857',
  emerald800: '#065F46',
  emerald900: '#064E3B',
  
  // Amber/Yellow spectrum
  amber50: '#FFFBEB',
  amber100: '#FEF3C7',
  amber200: '#FDE68A',
  amber300: '#FCD34D',
  amber400: '#FBBF24',
  amber500: '#F59E0B',
  amber600: '#D97706',
  amber700: '#B45309',
  amber800: '#92400E',
  amber900: '#78350F',
  
  // Red spectrum
  red50: '#FEF2F2',
  red100: '#FEE2E2',
  red200: '#FECACA',
  red300: '#FCA5A5',
  red400: '#F87171',
  red500: '#EF4444',
  red600: '#DC2626',
  red700: '#B91C1C',
  red800: '#991B1B',
  red900: '#7F1D1D',
  
  // Blue spectrum
  blue50: '#EFF6FF',
  blue100: '#DBEAFE',
  blue200: '#BFDBFE',
  blue300: '#93C5FD',
  blue400: '#60A5FA',
  blue500: '#3B82F6',
  blue600: '#2563EB',
  blue700: '#1D4ED8',
  blue800: '#1E40AF',
  blue900: '#1E3A8A',
  
  // Grayscale
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  
  // Pure colors
  white: '#FFFFFF',
  black: '#000000',
};

// Neon accent colors
export const NeonColors = {
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
};

// Semantic colors for interactive elements
export const SemanticColors = {
  interactive: {
    primary: '#8B5CF6',
    hover: '#7C3AED',
    pressed: '#6D28D9',
    disabled: '#4B5563',
  },
  feedback: {
    success: { 
      bg: '#10B98120', 
      text: '#10B981', 
      border: '#10B98140',
      glow: 'rgba(16, 185, 129, 0.4)',
    },
    warning: { 
      bg: '#F59E0B20', 
      text: '#F59E0B', 
      border: '#F59E0B40',
      glow: 'rgba(251, 191, 36, 0.4)',
    },
    error: { 
      bg: '#EF444420', 
      text: '#EF4444', 
      border: '#EF444440',
      glow: 'rgba(239, 68, 68, 0.4)',
    },
    info: { 
      bg: '#3B82F620', 
      text: '#3B82F6', 
      border: '#3B82F640',
      glow: 'rgba(59, 130, 246, 0.4)',
    },
  },
  surface: {
    elevated: '#1A1A2E',
    overlay: 'rgba(0,0,0,0.7)',
    glass: 'rgba(255,255,255,0.05)',
  },
};

// Theme colors (light/dark mode support)
export const ThemeColors = {
  light: {
    text: '#11181C',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    buttonText: '#FFFFFF',
    tabIconDefault: '#687076',
    tabIconSelected: '#7C3AED',
    link: '#7C3AED',
    backgroundRoot: '#FFFFFF',
    backgroundDefault: '#F3F4F6',
    backgroundSecondary: '#E5E7EB',
    backgroundTertiary: '#D1D5DB',
    primary: '#7C3AED',
    primaryLight: '#A78BFA',
    secondary: '#3B82F6',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    border: '#E5E7EB',
    cardBackground: '#FFFFFF',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  dark: {
    text: '#ECEDEE',
    textSecondary: '#9BA1A6',
    textTertiary: '#6B7280',
    buttonText: '#FFFFFF',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#A78BFA',
    link: '#A78BFA',
    backgroundRoot: '#0F0F0F',
    backgroundDefault: '#1A1A1A',
    backgroundSecondary: '#252525',
    backgroundTertiary: '#303030',
    primary: '#A78BFA',
    primaryLight: '#C4B5FD',
    secondary: '#60A5FA',
    success: '#34D399',
    warning: '#FBBF24',
    error: '#F87171',
    border: '#2A2A2A',
    cardBackground: '#1A1A1A',
    overlay: 'rgba(0, 0, 0, 0.7)',
  },
};

// Role badge colors
export const RoleBadgeColors: Record<string, string> = {
  student: '#3B82F6',
  teacher: '#10B981',
  director: '#F59E0B',
  curator: '#EF4444',
  cook: '#8B5CF6',
  ceo: '#DC2626',
  parent: '#0EA5E9',
};

// Grade colors
export const GradeColors = {
  excellent: '#10B981',
  good: '#3B82F6',
  average: '#F59E0B',
  poor: '#EF4444',
};

// Gradients for backgrounds and effects
export const Gradients = {
  primary: ['#8B5CF6', '#6366F1'],
  secondary: ['#4ECDC4', '#06B6D4'],
  pink: ['#F093FB', '#F5576C'],
  sunset: ['#FF6B6B', '#FBBF24'],
  neon: ['#8B5CF6', '#F093FB', '#4ECDC4'],
  cool: ['#6366F1', '#8B5CF6', '#EC4899'],
  warm: ['#F59E0B', '#EF4444', '#EC4899'],
  success: ['#10B981', '#34D399'],
  ocean: ['#06B6D4', '#3B82F6'],
};
