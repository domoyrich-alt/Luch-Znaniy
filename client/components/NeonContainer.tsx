/**
 * NEON CONTAINER - Контейнер с неоновым свечением по бокам
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NEON_COLORS, GLOW_GRADIENTS } from '@/constants/neonTheme';

interface NeonContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  showLeftGlow?: boolean;
  showRightGlow?: boolean;
  showTopGlow?: boolean;
  glowColor?: 'primary' | 'secondary' | 'white' | 'pink';
  glowIntensity?: 'low' | 'medium' | 'high';
}

const getGlowColors = (color: string, intensity: string) => {
  const baseColor = {
    primary: NEON_COLORS.primary,
    secondary: NEON_COLORS.secondary,
    white: '#FFFFFF',
    pink: NEON_COLORS.accent,
  }[color] || NEON_COLORS.primary;

  const opacityMap = {
    low: [0.1, 0.05, 0],
    medium: [0.25, 0.1, 0],
    high: [0.4, 0.2, 0],
  };

  const [o1, o2, o3] = opacityMap[intensity as keyof typeof opacityMap] || opacityMap.medium;
  
  return [
    baseColor.replace(')', `, ${o1})`).replace('rgb', 'rgba'),
    baseColor.replace(')', `, ${o2})`).replace('rgb', 'rgba'),
    'transparent',
  ];
};

export function NeonContainer({
  children,
  style,
  showLeftGlow = true,
  showRightGlow = true,
  showTopGlow = false,
  glowColor = 'primary',
  glowIntensity = 'medium',
}: NeonContainerProps) {
  const leftColors = glowColor === 'primary' 
    ? ['rgba(139, 92, 246, 0.25)', 'rgba(139, 92, 246, 0.1)', 'transparent']
    : glowColor === 'secondary'
    ? ['rgba(78, 205, 196, 0.25)', 'rgba(78, 205, 196, 0.1)', 'transparent']
    : glowColor === 'white'
    ? ['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.08)', 'transparent']
    : ['rgba(240, 147, 251, 0.25)', 'rgba(240, 147, 251, 0.1)', 'transparent'];

  const rightColors = glowColor === 'primary' 
    ? ['transparent', 'rgba(139, 92, 246, 0.1)', 'rgba(139, 92, 246, 0.25)']
    : glowColor === 'secondary'
    ? ['transparent', 'rgba(78, 205, 196, 0.1)', 'rgba(78, 205, 196, 0.25)']
    : glowColor === 'white'
    ? ['transparent', 'rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.2)']
    : ['transparent', 'rgba(240, 147, 251, 0.1)', 'rgba(240, 147, 251, 0.25)'];

  return (
    <View style={[styles.container, style]}>
      {children}
      
      {/* Левое свечение */}
      {showLeftGlow && (
        <LinearGradient
          colors={leftColors as any}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.leftGlow}
          pointerEvents="none"
        />
      )}
      
      {/* Правое свечение */}
      {showRightGlow && (
        <LinearGradient
          colors={rightColors as any}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.rightGlow}
          pointerEvents="none"
        />
      )}
      
      {/* Верхнее свечение */}
      {showTopGlow && (
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)', 'transparent']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.topGlow}
          pointerEvents="none"
        />
      )}
    </View>
  );
}

// Неоновая карточка
export function NeonCard({
  children,
  style,
  glowColor = 'primary',
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  glowColor?: 'primary' | 'secondary' | 'white' | 'pink';
}) {
  const shadowColor = {
    primary: NEON_COLORS.primary,
    secondary: NEON_COLORS.secondary,
    white: '#FFFFFF',
    pink: NEON_COLORS.accent,
  }[glowColor];

  return (
    <View 
      style={[
        styles.card, 
        { 
          shadowColor,
          borderColor: shadowColor + '30',
        },
        style
      ]}
    >
      {children}
    </View>
  );
}

// Неоновая кнопка
export function NeonButton({
  children,
  onPress,
  style,
  colors,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  colors?: [string, string];
}) {
  return (
    <LinearGradient
      colors={colors || NEON_COLORS.gradientPrimary as any}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.button, style]}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NEON_COLORS.backgroundDark,
    overflow: 'hidden',
  },
  leftGlow: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 80,
  },
  rightGlow: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
  },
  topGlow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 120,
  },
  card: {
    backgroundColor: NEON_COLORS.backgroundCard,
    borderRadius: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    shadowColor: NEON_COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
});
