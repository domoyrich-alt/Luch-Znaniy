/**
 * DESIGN SYSTEM - BUTTON (ENHANCED)
 * Button component with variants, sizes, loading states, and haptic feedback
 */

import React, { ReactNode } from 'react';
import { Text, StyleSheet, Pressable, ViewStyle, StyleProp, ActivityIndicator } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  WithSpringConfig,
} from 'react-native-reanimated';
import { BorderRadius, Spacing } from '../tokens/spacing';
import { Typography } from '../tokens/typography';
import { SemanticColors } from '../tokens/colors';
import { useHaptics } from '../hooks/useHaptics';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  onPress?: () => void;
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  hapticFeedback?: boolean;
}

const springConfig: WithSpringConfig = {
  damping: 15,
  mass: 0.3,
  stiffness: 150,
  overshootClamping: true,
  energyThreshold: 0.001,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Button({
  onPress,
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  hapticFeedback = true,
}: ButtonProps) {
  const scale = useSharedValue(1);
  const haptics = useHaptics();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(0.95, springConfig);
    }
  };

  const handlePressOut = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(1, springConfig);
    }
  };

  const handlePress = () => {
    if (!disabled && !loading && onPress) {
      if (hapticFeedback) {
        haptics.light();
      }
      onPress();
    }
  };

  // Variant styles
  const variantStyles: Record<ButtonVariant, ViewStyle> = {
    primary: {
      backgroundColor: SemanticColors.interactive.primary,
    },
    secondary: {
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: SemanticColors.interactive.primary,
    },
    ghost: {
      backgroundColor: 'rgba(139, 92, 246, 0.1)',
    },
    danger: {
      backgroundColor: SemanticColors.feedback.error.text,
    },
  };

  // Size styles
  const sizeStyles = {
    sm: {
      height: 40,
      paddingHorizontal: Spacing.lg,
      fontSize: Typography.label.medium.fontSize,
    },
    md: {
      height: Spacing.buttonHeight,
      paddingHorizontal: Spacing.xl,
      fontSize: Typography.body.medium.fontSize,
    },
    lg: {
      height: 56,
      paddingHorizontal: Spacing['2xl'],
      fontSize: Typography.body.large.fontSize,
    },
  };

  const textColor = variant === 'secondary' ? SemanticColors.interactive.primary : '#FFFFFF';

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[
        styles.button,
        variantStyles[variant],
        {
          height: sizeStyles[size].height,
          paddingHorizontal: sizeStyles[size].paddingHorizontal,
          opacity: disabled ? 0.5 : 1,
        },
        fullWidth && styles.fullWidth,
        animatedStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text
          style={[
            styles.text,
            {
              color: textColor,
              fontSize: sizeStyles[size].fontSize,
            },
          ]}
        >
          {children}
        </Text>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: {
    width: '100%',
  },
  text: {
    ...Typography.body.medium,
    fontWeight: '600',
  },
});
