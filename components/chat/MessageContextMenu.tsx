import React from 'react';
import { View, StyleSheet, Pressable, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius, Colors } from '@/constants/theme';

interface MessageContextMenuProps {
  visible: boolean;
  onClose: () => void;
  onReply: () => void;
  onForward: () => void;
  onCopy: () => void;
  onEdit?: () => void;
  onDelete: () => void;
  onPin?: () => void;
  onReact: () => void;
  isOwnMessage: boolean;
}

export function MessageContextMenu({
  visible,
  onClose,
  onReply,
  onForward,
  onCopy,
  onEdit,
  onDelete,
  onPin,
  onReact,
  isOwnMessage,
}: MessageContextMenuProps) {
  const { theme } = useTheme();

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  const menuItems = [
    { icon: 'smile', label: 'Реакция', onPress: () => handleAction(onReact), color: Colors.light.yellowAccent },
    { icon: 'corner-up-left', label: 'Ответить', onPress: () => handleAction(onReply), color: Colors.light.primary },
    { icon: 'corner-up-right', label: 'Переслать', onPress: () => handleAction(onForward), color: Colors.light.secondary },
    { icon: 'copy', label: 'Копировать', onPress: () => handleAction(onCopy), color: theme.textSecondary },
  ];

  if (isOwnMessage && onEdit) {
    menuItems.push({ icon: 'edit-2', label: 'Редактировать', onPress: () => handleAction(onEdit), color: theme.textSecondary });
  }

  if (onPin) {
    menuItems.push({ icon: 'bookmark', label: 'Закрепить', onPress: () => handleAction(onPin), color: theme.textSecondary });
  }

  menuItems.push({ icon: 'trash-2', label: 'Удалить', onPress: () => handleAction(onDelete), color: Colors.light.error });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
          {menuItems.map((item, index) => (
            <Pressable
              key={index}
              onPress={item.onPress}
              style={({ pressed }) => [
                styles.menuItem,
                { backgroundColor: pressed ? theme.backgroundSecondary : 'transparent' },
              ]}
            >
              <Feather name={item.icon as any} size={20} color={item.color} />
              <ThemedText type="body" style={{ color: item.color === Colors.light.error ? item.color : theme.text }}>
                {item.label}
              </ThemedText>
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
    minWidth: 200,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
});
