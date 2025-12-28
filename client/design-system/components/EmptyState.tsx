/**
 * DESIGN SYSTEM - EMPTY STATE
 * Component for displaying empty states with optional action
 */

import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Spacing, BorderRadius } from '../tokens/spacing';
import { Typography } from '../tokens/typography';
import { ThemeColors } from '../tokens/colors';

interface EmptyStateProps {
  icon?: string;
  emoji?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon,
  emoji = '🔍',
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      {/* Top glow */}
      <View style={styles.glowContainer}>
        <LinearGradient
          colors={['rgba(139, 92, 246, 0.15)', 'transparent']}
          style={styles.glow}
        />
      </View>
      
      {/* Icon/Emoji */}
      <Text style={styles.emoji}>{emoji}</Text>
      
      {/* Title */}
      <Text style={styles.title}>{title}</Text>
      
      {/* Description */}
      {description && (
        <Text style={styles.description}>{description}</Text>
      )}
      
      {/* Action button */}
      {actionLabel && onAction && (
        <Pressable 
          style={({ pressed }) => [
            styles.actionButton,
            pressed && styles.actionButtonPressed,
          ]}
          onPress={onAction}
        >
          <Text style={styles.actionLabel}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['5xl'],
    paddingHorizontal: Spacing['2xl'],
  },
  glowContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    zIndex: -1,
  },
  glow: {
    flex: 1,
  },
  emoji: {
    fontSize: 64,
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.headline.medium,
    color: ThemeColors.dark.text,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  description: {
    ...Typography.body.medium,
    color: ThemeColors.dark.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing['2xl'],
    maxWidth: 280,
  },
  actionButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  actionButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  actionLabel: {
    ...Typography.label.large,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
