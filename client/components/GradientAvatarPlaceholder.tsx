/**
 * GradientAvatarPlaceholder - Стильный градиентный плейсхолдер для аватара
 * 
 * Показывает инициалы пользователя на градиентном фоне когда аватар не доступен.
 * Цвет градиента генерируется на основе имени для консистентности.
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';

// Предустановленные градиенты - Premium Deep Navy palette
const GRADIENT_PRESETS: [string, string][] = [
  ['#7AA2F7', '#5A8AE6'], // Primary Blue
  ['#F7768E', '#FF5A6E'], // Coral Pink
  ['#73DACA', '#4EC9B0'], // Teal
  ['#FF9E64', '#FF8543'], // Orange
  ['#9ECE6A', '#7FB347'], // Green
  ['#7DCFFF', '#5BBCE8'], // Sky Blue
  ['#BB9AF7', '#9D7EE8'], // Purple
  ['#A9DC76', '#8BC34A'], // Lime
  ['#FFD93D', '#FFB21A'], // Gold
  ['#FF79C6', '#FF5CAD'], // Magenta
];

interface GradientAvatarPlaceholderProps {
  /** Имя пользователя (firstName) */
  firstName?: string | null;
  /** Фамилия пользователя (lastName) */
  lastName?: string | null;
  /** Полное имя (альтернатива firstName + lastName) */
  name?: string | null;
  /** Username (используется если нет имени) */
  username?: string | null;
  /** Размер аватара */
  size?: number;
  /** Размер шрифта инициалов (по умолчанию size * 0.4) */
  fontSize?: number;
  /** Кастомный стиль контейнера */
  style?: ViewStyle;
  /** Кастомный стиль текста */
  textStyle?: TextStyle;
  /** Форсировать конкретный градиент (индекс 0-9) */
  gradientIndex?: number;
}

/**
 * Генерирует стабильный хэш на основе строки для выбора градиента
 */
function getStringHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Извлекает инициалы из имени
 */
function getInitials(
  firstName?: string | null,
  lastName?: string | null,
  name?: string | null,
  username?: string | null
): string {
  // Сначала пробуем firstName + lastName
  if (firstName) {
    const first = firstName.trim().charAt(0).toUpperCase();
    const last = lastName?.trim().charAt(0).toUpperCase() || '';
    if (first) return `${first}${last}`;
  }
  
  // Потом пробуем полное имя
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    }
    if (parts.length === 1 && parts[0]) {
      return parts[0].charAt(0).toUpperCase();
    }
  }
  
  // Потом username
  if (username) {
    const cleanUsername = username.replace(/^@+/, '').trim();
    if (cleanUsername) {
      return cleanUsername.charAt(0).toUpperCase();
    }
  }
  
  // Fallback
  return '?';
}

export function GradientAvatarPlaceholder({
  firstName,
  lastName,
  name,
  username,
  size = 50,
  fontSize,
  style,
  textStyle,
  gradientIndex,
}: GradientAvatarPlaceholderProps) {
  // Вычисляем инициалы
  const initials = useMemo(
    () => getInitials(firstName, lastName, name, username),
    [firstName, lastName, name, username]
  );
  
  // Выбираем градиент на основе имени для консистентности
  const gradient = useMemo(() => {
    if (typeof gradientIndex === 'number') {
      return GRADIENT_PRESETS[gradientIndex % GRADIENT_PRESETS.length];
    }
    
    // Генерируем хэш на основе имени
    const nameForHash = firstName || lastName || name || username || 'default';
    const hash = getStringHash(nameForHash);
    return GRADIENT_PRESETS[hash % GRADIENT_PRESETS.length];
  }, [firstName, lastName, name, username, gradientIndex]);
  
  // Вычисляем размер шрифта
  const computedFontSize = fontSize || Math.round(size * 0.4);
  
  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }, style]}>
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, { borderRadius: size / 2 }]}
      >
        <ThemedText
          style={[
            styles.initials,
            { fontSize: computedFontSize, lineHeight: computedFontSize * 1.2 },
            textStyle,
          ]}
        >
          {initials}
        </ThemedText>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    // Premium border effect
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default GradientAvatarPlaceholder;
