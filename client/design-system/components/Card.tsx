/**
 * DESIGN SYSTEM - CARD (ENHANCED)
 * Card component with variants (default, glass, gradient, interactive)
 */

import React, { ReactNode } from 'react';
import { View, StyleSheet, Pressable, ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  WithSpringConfig,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { BorderRadius, Spacing } from '../tokens/spacing';
import { ThemeColors, SemanticColors, Gradients } from '../tokens/colors';
import { Shadows } from '../tokens/shadows';

type CardVariant = 'default' | 'glass' | 'gradient' | 'interactive';

interface CardProps {
  children: ReactNode;
  variant?: CardVariant;
  gradientColors?: string[];
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

const springConfig: WithSpringConfig = {
  damping: 15,
  mass: 0.3,
  stiffness: 150,
  overshootClamping: true,
  energyThreshold: 0.001,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Card({
  children,
  variant = 'default',
  gradientColors = Gradients.primary,
  onPress,
  style,
}: CardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (onPress || variant === 'interactive') {
      scale.value = withSpring(0.98, springConfig);
    }
  };

  const handlePressOut = () => {
    if (onPress || variant === 'interactive') {
      scale.value = withSpring(1, springConfig);
    }
  };

  // Default variant
  if (variant === 'default') {
    const CardComponent = onPress ? AnimatedPressable : Animated.View;
    return (
      <CardComponent
        onPress={onPress}
        onPressIn={onPress ? handlePressIn : undefined}
        onPressOut={onPress ? handlePressOut : undefined}
        style={[
          styles.card,
          styles.defaultCard,
          animatedStyle,
          style,
        ]}
      >
        {children}
      </CardComponent>
    );
  }

  // Glass variant
  if (variant === 'glass') {
    const CardComponent = onPress ? Pressable : View;
    return (
      <CardComponent
        onPress={onPress}
        style={[styles.card, style]}
      >
        <BlurView 
          intensity={20} 
          tint="dark"
          style={styles.glassBlur}
        >
          <View style={styles.glassContent}>
            {children}
          </View>
          
          {/* Border gradient */}
          <View style={styles.glassBorderContainer}>
            <LinearGradient
              colors={['rgba(139, 92, 246, 0.3)', 'rgba(78, 205, 196, 0.3)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.glassBorder}
            />
          </View>
        </BlurView>
      </CardComponent>
    );
  }

  // Gradient variant
  if (variant === 'gradient') {
    const CardComponent = onPress ? AnimatedPressable : Animated.View;
    return (
      <CardComponent
        onPress={onPress}
        onPressIn={onPress ? handlePressIn : undefined}
        onPressOut={onPress ? handlePressOut : undefined}
        style={[styles.card, animatedStyle, style]}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientCard}
        >
          {children}
        </LinearGradient>
      </CardComponent>
    );
  }

  // Interactive variant
  if (variant === 'interactive') {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.card,
          styles.interactiveCard,
          animatedStyle,
          style,
        ]}
      >
        {children}
      </AnimatedPressable>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius['2xl'],
    overflow: 'hidden',
  },
  defaultCard: {
    backgroundColor: ThemeColors.dark.cardBackground,
    padding: Spacing.xl,
    ...Shadows.medium,
  },
  glassBlur: {
    borderRadius: BorderRadius['2xl'],
    overflow: 'hidden',
  },
  glassContent: {
    padding: Spacing.xl,
    backgroundColor: SemanticColors.surface.glass,
  },
  glassBorderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: BorderRadius['2xl'],
    padding: 1,
  },
  glassBorder: {
    flex: 1,
    borderRadius: BorderRadius['2xl'],
  },
  gradientCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius['2xl'],
  },
  interactiveCard: {
    backgroundColor: ThemeColors.dark.cardBackground,
    padding: Spacing.xl,
    borderWidth: 2,
    borderColor: 'rgba(139, 92, 246, 0.2)',
    ...Shadows.medium,
  },
});
