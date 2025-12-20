import React from 'react';
import { View, StyleSheet, Pressable, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius, Colors } from '@/constants/theme';

interface MediaPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelectCamera: () => void;
  onSelectGallery: () => void;
  onSelectFile: () => void;
}

export function MediaPicker({
  visible,
  onClose,
  onSelectCamera,
  onSelectGallery,
  onSelectFile,
}: MediaPickerProps) {
  const { theme } = useTheme();

  const options = [
    { icon: 'camera', label: 'Камера', onPress: onSelectCamera, color: Colors.light.primary },
    { icon: 'image', label: 'Галерея', onPress: onSelectGallery, color: Colors.light.secondary },
    { icon: 'file', label: 'Файл', onPress: onSelectFile, color: Colors.light.yellowAccent },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
          <View style={styles.header}>
            <ThemedText type="h4">Прикрепить</ThemedText>
            <Pressable onPress={onClose}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
          </View>
          <View style={styles.options}>
            {options.map((option) => (
              <Pressable
                key={option.label}
                onPress={() => {
                  option.onPress();
                  onClose();
                }}
                style={({ pressed }) => [
                  styles.option,
                  { backgroundColor: pressed ? theme.backgroundSecondary : 'transparent' },
                ]}
              >
                <View style={[styles.iconContainer, { backgroundColor: option.color + '15' }]}>
                  <Feather name={option.icon as any} size={24} color={option.color} />
                </View>
                <ThemedText type="body">{option.label}</ThemedText>
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
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  options: {
    gap: Spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
