import React from 'react';
import { View, StyleSheet, Pressable, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { ChatMessage, MessageAction } from '@/types/chat';
import { Spacing, BorderRadius } from '@/constants/theme';

interface MessageContextMenuProps {
  visible: boolean;
  message: ChatMessage | null;
  isOwn: boolean;
  onAction: (action: MessageAction) => void;
  onClose: () => void;
}

export function MessageContextMenu({ visible, message, isOwn, onAction, onClose }: MessageContextMenuProps) {
  const { theme } = useTheme();

  if (!message) return null;

  const actions: { action: MessageAction; icon: string; label: string; color?: string; condition?: boolean }[] = [
    { action: 'reply', icon: 'corner-up-left', label: 'Ответить' },
    { action: 'forward', icon: 'corner-up-right', label: 'Переслать' },
    { action: 'copy', icon: 'copy', label: 'Копировать', condition: message.type === 'text' },
    { action: 'edit', icon: 'edit-2', label: 'Редактировать', condition: isOwn && message.type === 'text' },
    { action: 'pin', icon: 'bookmark', label: message.isPinned ? 'Открепить' : 'Закрепить' },
    { action: 'delete', icon: 'trash-2', label: 'Удалить', color: '#FF6B6B' },
  ];

  const filteredActions = actions.filter(a => a.condition === undefined || a.condition);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={[styles.container, { backgroundColor: theme.backgroundDefault }]}>
          {/* Превью сообщения */}
          <View style={[styles.preview, { backgroundColor: theme.backgroundSecondary }]}>
            <ThemedText style={styles.previewText} numberOfLines={2}>
              {message.type === 'text' ? message.text : `[${message.type}]`}
            </ThemedText>
          </View>

          {/* Действия */}
          <View style={styles.actions}>
            {filteredActions.map((item, index) => (
              <Pressable
                key={item.action}
                style={[
                  styles.actionItem,
                  index < filteredActions.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.backgroundSecondary },
                ]}
                onPress={() => {
                  onAction(item.action);
                  onClose();
                }}
              >
                <Feather name={item.icon as any} size={20} color={item.color || theme.text} />
                <ThemedText style={[styles.actionLabel, item.color && { color: item.color }]}>
                  {item.label}
                </ThemedText>
              </Pressable>
            ))}
          </View>
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
    padding: Spacing.xl,
  },
  container: {
    width: '100%',
    maxWidth: 300,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  preview: {
    padding: Spacing.md,
    borderBottomWidth: 1,
  },
  previewText: {
    fontSize: 14,
  },
  actions: {},
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  actionLabel: {
    fontSize: 16,
  },
});
