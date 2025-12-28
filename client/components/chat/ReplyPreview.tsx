import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { ChatMessage } from '@/types/chat';
import { Spacing } from '@/constants/theme';

interface ReplyPreviewProps {
  message: ChatMessage;
  onCancel: () => void;
}

export function ReplyPreview({ message, onCancel }: ReplyPreviewProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundSecondary }]}>
      <View style={[styles.line, { backgroundColor: theme.primary }]} />
      <View style={styles.content}>
        <ThemedText style={[styles.name, { color: theme.primary }]} numberOfLines={1}>
          {message.senderName}
        </ThemedText>
        <ThemedText style={[styles.text, { color: theme.textSecondary }]} numberOfLines={1}>
          {message.type === 'text' ? message.text : `[${message.type}]`}
        </ThemedText>
      </View>
      <Pressable onPress={onCancel} hitSlop={10} style={styles.closeButton}>
        <Feather name="x" size={20} color={theme.textSecondary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: 8,
  },
  line: {
    width: 3,
    height: '100%',
    borderRadius: 2,
    marginRight: Spacing.sm,
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
  },
  text: {
    fontSize: 13,
  },
  closeButton: {
    padding: 4,
  },
});
