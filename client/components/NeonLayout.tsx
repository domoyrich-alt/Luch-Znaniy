import React, { useRef, useEffect, ReactNode } from 'react';
import { View, StyleSheet, Animated, Dimensions, StatusBar, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

// Экспортируем неоновые цвета для использования везде
export const NEON = {
  // Основные цвета
  primary: '#8B5CF6',      // Фиолетовый
  secondary: '#4ECDC4',    // Бирюзовый  
  accent: '#FF6B9D',       // Розовый
  warning: '#FFD93D',      // Жёлтый
  success: '#6BCB77',      // Зелёный
  error: '#FF6B6B',        // Красный
  info: '#3B82F6',         // Синий
  
  // Фоны
  bgDark: '#0A0A0F',       // Основной тёмный фон
  bgCard: '#141420',       // Фон карточки
  bgSecondary: '#1A1A2E',  // Вторичный фон
  bgTertiary: '#252542',   // Третичный фон
  
  // Текст
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0B0',
  textMuted: '#606070',
  
  // Свечения
  glowPurple: 'rgba(139, 92, 246, 0.5)',
  glowCyan: 'rgba(78, 205, 196, 0.5)',
  glowPink: 'rgba(255, 107, 157, 0.4)',
  glowYellow: 'rgba(255, 217, 61, 0.4)',
  glowGreen: 'rgba(107, 203, 119, 0.4)',
  
  // Градиенты (массивы цветов)
  gradientPrimary: ['#8B5CF6', '#6366F1'] as [string, string],
  gradientSecondary: ['#4ECDC4', '#45B7AA'] as [string, string],
  gradientAccent: ['#FF6B9D', '#FF4B7D'] as [string, string],
  gradientWarm: ['#FFD93D', '#FF8C42'] as [string, string],
  gradientCool: ['#3B82F6', '#8B5CF6'] as [string, string],
  gradientSuccess: ['#6BCB77', '#4ADE80'] as [string, string],
};

interface NeonLayoutProps {
  children: ReactNode;
  showSideGlow?: boolean;
  showTopGlow?: boolean;
  backgroundColor?: string;
}

export function NeonLayout({ 
  children, 
  showSideGlow = true,
  showTopGlow = false,
  backgroundColor = NEON.bgDark 
}: NeonLayoutProps) {
  const glowAnim = useRef(new Animated.Value(0.6)).current;
  const insets = useSafeAreaInsets();
  
  useEffect(() => {
    // Пульсация неонового свечения
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { 
          toValue: 1, 
          duration: 2500, 
          useNativeDriver: true 
        }),
        Animated.timing(glowAnim, { 
          toValue: 0.5, 
          duration: 2500, 
          useNativeDriver: true 
        })
      ])
    ).start();
  }, []);
  
  return (
    <View style={[styles.container, { backgroundColor }]}>
      <StatusBar barStyle="light-content" />
      
      {/* Левое неоновое свечение */}
      {showSideGlow && (
        <Animated.View style={[styles.leftGlow, { opacity: glowAnim }]}>
          <LinearGradient
            colors={[NEON.glowPurple, 'rgba(139, 92, 246, 0.15)', 'transparent']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      )}
      
      {/* Правое неоновое свечение */}
      {showSideGlow && (
        <Animated.View style={[styles.rightGlow, { opacity: glowAnim }]}>
          <LinearGradient
            colors={['transparent', 'rgba(78, 205, 196, 0.15)', NEON.glowCyan]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      )}
      
      {/* Верхнее свечение (опционально) */}
      {showTopGlow && (
        <Animated.View style={[styles.topGlow, { opacity: glowAnim }]}>
          <LinearGradient
            colors={[NEON.glowPurple, 'transparent']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      )}
      
      {children}
    </View>
  );
}

// Неоновая карточка
interface NeonCardProps {
  children: ReactNode;
  borderColor?: string;
  style?: any;
  onPress?: () => void;
}

export function NeonCard({ children, borderColor = NEON.primary, style, onPress }: NeonCardProps) {
  return (
    <View 
      style={[
        styles.neonCard, 
        { borderColor: borderColor + '30' },
        style
      ]}
    >
      {children}
    </View>
  );
}

// Неоновая кнопка
interface NeonButtonProps {
  children: ReactNode;
  onPress: () => void;
  colors?: [string, string];
  style?: any;
  disabled?: boolean;
}

export function NeonButton({ 
  children, 
  onPress, 
  colors = NEON.gradientPrimary,
  style,
  disabled = false
}: NeonButtonProps) {
  return (
    <View style={[styles.neonButtonWrapper, style, disabled && styles.disabled]}>
      <LinearGradient
        colors={colors}
        style={styles.neonButtonGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.neonButtonContent}>
          {children}
        </View>
      </LinearGradient>
    </View>
  );
}

// Неоновый индикатор статистики
interface NeonStatProps {
  emoji: string;
  value: string | number;
  label: string;
  color: string;
}

export function NeonStat({ emoji, value, label, color }: NeonStatProps) {
  return (
    <View style={[styles.statCard, { borderColor: color + '40' }]}>
      <LinearGradient
        colors={[color + '20', 'transparent']}
        style={styles.statGradient}
      >
        <View style={styles.statEmoji}>
          <Text style={styles.statEmojiText}>{emoji}</Text>
        </View>
        <Text style={[styles.statValue, { color }]}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  // Неоновые свечения
  leftGlow: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 80,
    zIndex: 1,
    pointerEvents: 'none',
  },
  rightGlow: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    zIndex: 1,
    pointerEvents: 'none',
  },
  topGlow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 150,
    zIndex: 1,
    pointerEvents: 'none',
  },
  
  // Неоновая карточка
  neonCard: {
    backgroundColor: NEON.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    shadowColor: NEON.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  
  // Неоновая кнопка
  neonButtonWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: NEON.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  neonButtonGradient: {
    borderRadius: 16,
  },
  neonButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 8,
  },
  disabled: {
    opacity: 0.5,
  },
  
  // Статистика
  statCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  statGradient: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  statEmoji: {
    marginBottom: 8,
  },
  statEmojiText: {
    fontSize: 28,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    color: NEON.textSecondary,
    marginTop: 4,
  },
});

export default NeonLayout;
