import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius, Colors } from '@/constants/theme';
import type { Message } from '@/types/chat';

interface ReplyPreviewProps {
  message: Message;
  onCancel: () => void;
}

export function ReplyPreview({ message, onCancel }: ReplyPreviewProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundSecondary }]}>
      <View style={[styles.border, { backgroundColor: Colors.light.primary }]} />
      <View style={styles.content}>
        <ThemedText type="caption" style={{ color: Colors.light.primary, fontWeight: '600' }}>
          Ответ на сообщение от {message.senderName}
        </ThemedText>
        <ThemedText type="small" numberOfLines={1} style={{ color: theme.textSecondary }}>
          {message.text || 'Медиафайл'}
        </ThemedText>
      </View>
      <Pressable onPress={onCancel} style={styles.closeButton}>
        <Feather name="x" size={20} color={theme.textSecondary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  border: {
    width: 3,
    height: '100%',
    borderRadius: BorderRadius.sm,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  closeButton: {
    padding: Spacing.xs,
  },
});
