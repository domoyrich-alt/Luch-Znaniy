/**
 * REACTION PICKER
 * Telegram-style reaction picker that appears on long press
 * 
 * Features:
 * - Quick emoji selection
 * - Spring animation on appear
 * - Haptic feedback
 */

import React, { memo, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/ThemedText';
import { 
  TelegramDarkColors as colors,
} from '@/constants/telegramDarkTheme';

// Default reactions like Telegram
const DEFAULT_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

interface ReactionPickerProps {
  visible: boolean;
  position: 'top' | 'bottom';
  onReactionSelect: (emoji: string) => void;
  onClose: () => void;
  reactions?: string[];
}

export const ReactionPicker = memo(function ReactionPicker({
  visible,
  position,
  onReactionSelect,
  onClose,
  reactions = DEFAULT_REACTIONS,
}: ReactionPickerProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 300,
          friction: 15,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 0,
          tension: 300,
          friction: 15,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, scaleAnim, opacityAnim]);

  const handleReactionPress = (emoji: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onReactionSelect(emoji);
    onClose();
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        position === 'top' ? styles.containerTop : styles.containerBottom,
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      {reactions.map((emoji, index) => (
        <ReactionButton
          key={emoji}
          emoji={emoji}
          index={index}
          onPress={() => handleReactionPress(emoji)}
        />
      ))}
    </Animated.View>
  );
});

interface ReactionButtonProps {
  emoji: string;
  index: number;
  onPress: () => void;
}

const ReactionButton = memo(function ReactionButton({
  emoji,
  index,
  onPress,
}: ReactionButtonProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 200,
      friction: 10,
      delay: index * 30,
      useNativeDriver: true,
    }).start();
  }, [index, scaleAnim]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={styles.reactionButton}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <ThemedText style={styles.emoji}>{emoji}</ThemedText>
      </TouchableOpacity>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    flexDirection: 'row',
    backgroundColor: colors.backgroundTertiary,
    borderRadius: 24,
    paddingHorizontal: 8,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  containerTop: {
    bottom: '100%',
    marginBottom: 8,
  },
  containerBottom: {
    top: '100%',
    marginTop: 8,
  },
  reactionButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  emoji: {
    fontSize: 24,
  },
});

export default ReactionPicker;
