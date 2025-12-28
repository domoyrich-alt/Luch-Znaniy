/**
 * DESIGN SYSTEM - SKELETON
 * Animated loading placeholder component
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { BorderRadius } from '../tokens/spacing';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  variant?: 'rect' | 'circle' | 'text';
  style?: StyleProp<ViewStyle>;
}

export function Skeleton({ 
  width = '100%', 
  height = 16, 
  variant = 'rect',
  style 
}: SkeletonProps) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, {
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const variantStyle = {
    rect: { borderRadius: BorderRadius.md },
    circle: { borderRadius: 9999 },
    text: { borderRadius: BorderRadius.sm, height: height * 0.6 },
  };

  return (
    <Animated.View
      style={[
        styles.skeleton,
        variantStyle[variant],
        {
          width,
          height,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#2A2A3E',
  },
});
