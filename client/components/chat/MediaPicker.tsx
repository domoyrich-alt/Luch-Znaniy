import React from 'react';
import { View, StyleSheet, Pressable, Modal, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
// expo-document-picker не установлен, файлы будут добавлены позже
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { MessageMedia } from '@/types/chat';
import { Spacing, BorderRadius } from '@/constants/theme';

interface MediaPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (media: MessageMedia) => void;
}

export function MediaPicker({ visible, onClose, onSelect }: MediaPickerProps) {
  const { theme } = useTheme();

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Ошибка', 'Нужен доступ к галерее');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images as any,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]) {
        onSelect({
          type: 'image',
          uri: result.assets[0].uri,
          width: result.assets[0].width,
          height: result.assets[0].height,
        });
        onClose();
      }
    } catch (error) {
      console.error('Ошибка выбора изображения:', error);
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Ошибка', 'Нужен доступ к камере');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]) {
        onSelect({
          type: 'image',
          uri: result.assets[0].uri,
          width: result.assets[0].width,
          height: result.assets[0].height,
        });
        onClose();
      }
    } catch (error) {
      console.error('Ошибка камеры:', error);
    }
  };

  const pickFile = async () => {
    // expo-document-picker не установлен
    Alert.alert(
      'Документы',
      'Для отправки документов нужно установить expo-document-picker.\nПока доступны только фото и видео.',
      [{ text: 'OK' }]
    );
  };

  const options = [
    { icon: 'image', label: 'Галерея', color: '#3390EC', onPress: pickImage },
    { icon: 'camera', label: 'Камера', color: '#58D68D', onPress: takePhoto },
    { icon: 'file-text', label: 'Файл', color: '#AF7AC5', onPress: pickFile },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={[styles.container, { backgroundColor: theme.backgroundDefault }]}>
          <View style={styles.handle} />
          
          <View style={styles.optionsGrid}>
            {options.map((option, index) => (
              <Pressable
                key={index}
                style={styles.option}
                onPress={option.onPress}
              >
                <View style={[styles.optionIcon, { backgroundColor: option.color }]}>
                  <Feather name={option.icon as any} size={26} color="#fff" />
                </View>
                <ThemedText style={[styles.optionLabel, { color: theme.text }]}>{option.label}</ThemedText>
              </Pressable>
            ))}
          </View>

          <Pressable
            style={[styles.cancelButton, { backgroundColor: theme.backgroundSecondary }]}
            onPress={onClose}
          >
            <ThemedText style={[styles.cancelText, { color: theme.text }]}>Отмена</ThemedText>
          </Pressable>
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: Spacing.lg,
    paddingBottom: 40,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: 'rgba(150,150,150,0.4)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  optionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.lg,
    paddingHorizontal: 10,
  },
  option: {
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  optionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  cancelButton: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
