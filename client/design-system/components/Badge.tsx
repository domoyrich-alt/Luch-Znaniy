/**
 * DESIGN SYSTEM - BADGE
 * Badge component for roles and statuses
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { BorderRadius, Spacing } from '../tokens/spacing';
import { Typography } from '../tokens/typography';
import { RoleBadgeColors, SemanticColors } from '../tokens/colors';

type BadgeVariant = 'role' | 'status';
type BadgeSize = 'sm' | 'md';
type StatusType = 'success' | 'warning' | 'error' | 'info';
type RoleType = 'student' | 'teacher' | 'director' | 'curator' | 'cook' | 'ceo' | 'parent';

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  label: string;
  role?: RoleType;
  status?: StatusType;
  style?: StyleProp<ViewStyle>;
}

export function Badge({ 
  variant = 'status',
  size = 'md',
  label,
  role,
  status = 'info',
  style,
}: BadgeProps) {
  // Determine colors based on variant
  let backgroundColor: string;
  let textColor: string;
  let borderColor: string;

  if (variant === 'role' && role) {
    backgroundColor = `${RoleBadgeColors[role]}20`;
    textColor = RoleBadgeColors[role];
    borderColor = `${RoleBadgeColors[role]}40`;
  } else if (variant === 'status') {
    const statusColors = SemanticColors.feedback[status];
    backgroundColor = statusColors.bg;
    textColor = statusColors.text;
    borderColor = statusColors.border;
  } else {
    // Default colors
    backgroundColor = SemanticColors.feedback.info.bg;
    textColor = SemanticColors.feedback.info.text;
    borderColor = SemanticColors.feedback.info.border;
  }

  const sizeStyles = {
    sm: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      fontSize: Typography.label.small.fontSize,
    },
    md: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      fontSize: Typography.label.medium.fontSize,
    },
  };

  return (
    <View 
      style={[
        styles.badge,
        {
          backgroundColor,
          borderColor,
          paddingHorizontal: sizeStyles[size].paddingHorizontal,
          paddingVertical: sizeStyles[size].paddingVertical,
        },
        style,
      ]}
    >
      <Text 
        style={[
          styles.label,
          {
            color: textColor,
            fontSize: sizeStyles[size].fontSize,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  label: {
    ...Typography.label.medium,
    fontWeight: '600',
  },
});
