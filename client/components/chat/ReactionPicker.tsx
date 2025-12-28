import React from 'react';
import { View, StyleSheet, Pressable, Modal } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { REACTION_EMOJIS } from '@/types/chat';
import { Spacing, BorderRadius } from '@/constants/theme';

interface ReactionPickerProps {
  visible: boolean;
  onSelect: (emoji: string) => void;
  onClose: () => void;
  position?: { x: number; y: number };
}

export function ReactionPicker({ visible, onSelect, onClose, position }: ReactionPickerProps) {
  const { theme } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View
          style={[
            styles.container,
            { backgroundColor: theme.backgroundDefault },
            position && { top: position.y - 60, left: Math.max(10, Math.min(position.x - 120, 200)) },
          ]}
        >
          {REACTION_EMOJIS.map((emoji) => (
            <Pressable
              key={emoji}
              style={({ pressed }) => [styles.emojiButton, pressed && styles.emojiPressed]}
              onPress={() => {
                onSelect(emoji);
                onClose();
              }}
            >
              <ThemedText style={styles.emoji}>{emoji}</ThemedText>
            </Pressable>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  container: {
    position: 'absolute',
    flexDirection: 'row',
    padding: Spacing.sm,
    borderRadius: BorderRadius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  emojiButton: {
    padding: 8,
    borderRadius: 20,
  },
  emojiPressed: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    transform: [{ scale: 1.2 }],
  },
  emoji: {
    fontSize: 24,
  },
});
