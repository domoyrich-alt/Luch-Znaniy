/**
 * TYPING INDICATOR
 * Telegram-style typing animation with three bouncing dots
 * 
 * Features:
 * - Animated bouncing dots
 * - Fade in/out animation
 * - Telegram style appearance
 */

import React, { memo, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
} from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { 
  TelegramDarkColors as colors,
  TelegramTypography as typography,
} from '@/constants/telegramDarkTheme';

interface TypingIndicatorProps {
  visible: boolean;
  userName?: string;
}

export const TypingIndicator = memo(function TypingIndicator({
  visible,
  userName,
}: TypingIndicatorProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      // Start bouncing animation
      const createBounceAnimation = (anim: Animated.Value, delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(anim, {
              toValue: -6,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ])
        );
      };

      const bounce1 = createBounceAnimation(dot1Anim, 0);
      const bounce2 = createBounceAnimation(dot2Anim, 150);
      const bounce3 = createBounceAnimation(dot3Anim, 300);

      bounce1.start();
      bounce2.start();
      bounce3.start();

      return () => {
        bounce1.stop();
        bounce2.stop();
        bounce3.stop();
      };
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, fadeAnim, dot1Anim, dot2Anim, dot3Anim]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.bubble}>
        <View style={styles.dotsContainer}>
          <Animated.View
            style={[styles.dot, { transform: [{ translateY: dot1Anim }] }]}
          />
          <Animated.View
            style={[styles.dot, { transform: [{ translateY: dot2Anim }] }]}
          />
          <Animated.View
            style={[styles.dot, { transform: [{ translateY: dot3Anim }] }]}
          />
        </View>
      </View>
      {userName && (
        <ThemedText style={styles.typingText}>
          {userName} печатает...
        </ThemedText>
      )}
    </Animated.View>
  );
});

// Simple inline typing dots (for header subtitle)
export const TypingDots = memo(function TypingDots() {
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createBounceAnimation = (anim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0.4,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const bounce1 = createBounceAnimation(dot1Anim, 0);
    const bounce2 = createBounceAnimation(dot2Anim, 150);
    const bounce3 = createBounceAnimation(dot3Anim, 300);

    bounce1.start();
    bounce2.start();
    bounce3.start();

    return () => {
      bounce1.stop();
      bounce2.stop();
      bounce3.stop();
    };
  }, [dot1Anim, dot2Anim, dot3Anim]);

  return (
    <View style={styles.inlineDotsContainer}>
      <Animated.View style={[styles.inlineDot, { opacity: dot1Anim }]} />
      <Animated.View style={[styles.inlineDot, { opacity: dot2Anim }]} />
      <Animated.View style={[styles.inlineDot, { opacity: dot3Anim }]} />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bubble: {
    backgroundColor: colors.messageTheirs,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textSecondary,
  },
  typingText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  
  // Inline dots for header
  inlineDotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  inlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
});

export default TypingIndicator;
