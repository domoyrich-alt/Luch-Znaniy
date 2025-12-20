import React from 'react';
import { View, StyleSheet, Pressable, Modal } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';

interface ReactionPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelectReaction: (emoji: string) => void;
}

const REACTIONS = ['❤️', '👍', '😂', '😮', '😢', '🔥'];

export function ReactionPicker({ visible, onClose, onSelectReaction }: ReactionPickerProps) {
  const { theme } = useTheme();

  const handleSelect = (emoji: string) => {
    onSelectReaction(emoji);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
          {REACTIONS.map((emoji) => (
            <Pressable
              key={emoji}
              onPress={() => handleSelect(emoji)}
              style={({ pressed }) => [
                styles.reactionButton,
                { backgroundColor: pressed ? theme.backgroundSecondary : 'transparent' },
              ]}
            >
              <ThemedText type="h3">{emoji}</ThemedText>
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flexDirection: 'row',
    padding: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  reactionButton: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.full,
  },
});
