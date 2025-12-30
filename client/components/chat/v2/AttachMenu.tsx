/**
 * ATTACH MENU (v2)
 * Меню скрепки с 2 колонками и красивой анимацией
 * 
 * Структура:
 * [Фото] [Файл]
 * [Место] [Контакт]
 * [Видео] [Подарок]
 */

import React, { useRef, useEffect, memo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';

import { ThemedText } from '@/components/ThemedText';
import { 
  TelegramDarkColors as colors, 
  TelegramSizes as sizes,
  TelegramTypography as typography,
  TelegramAnimations as animations,
  TelegramShadows as shadows,
} from '@/constants/telegramDarkTheme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ======================
// ТИПЫ
// ======================
export type AttachOption = 
  | 'photo' 
  | 'video' 
  | 'file' 
  | 'location' 
  | 'contact' 
  | 'gift';

interface AttachMenuProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (option: AttachOption) => void;
  position?: { x: number; y: number };
}

// Опции меню
const MENU_OPTIONS: Array<{
  id: AttachOption;
  icon: string;
  iconFamily: 'ionicons' | 'feather' | 'material';
  label: string;
  color: string;
}> = [
  { id: 'photo', icon: 'image', iconFamily: 'feather', label: 'Фото', color: '#007AFF' },
  { id: 'file', icon: 'file-text', iconFamily: 'feather', label: 'Файл', color: '#5856D6' },
  { id: 'location', icon: 'map-pin', iconFamily: 'feather', label: 'Место', color: '#34C759' },
  { id: 'contact', icon: 'user', iconFamily: 'feather', label: 'Контакт', color: '#FF9500' },
  { id: 'video', icon: 'video', iconFamily: 'feather', label: 'Видео', color: '#FF3B30' },
  { id: 'gift', icon: 'gift', iconFamily: 'feather', label: 'Подарок', color: '#AF52DE' },
];

// ======================
// MENU ITEM
// ======================
const MenuItem = memo(function MenuItem({
  option,
  index,
  onPress,
  animValue,
}: {
  option: typeof MENU_OPTIONS[0];
  index: number;
  onPress: () => void;
  animValue: Animated.Value;
}) {
  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  // Последовательная анимация для каждого элемента
  const itemAnim = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const translateY = itemAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });

  const IconComponent = option.iconFamily === 'feather' 
    ? Feather 
    : option.iconFamily === 'material' 
      ? MaterialIcons 
      : Ionicons;

  return (
    <Animated.View
      style={[
        styles.menuItem,
        {
          opacity: itemAnim,
          transform: [{ translateY }],
        },
      ]}
    >
      <Pressable
        style={({ pressed }) => [
          styles.menuItemPressable,
          pressed && { opacity: 0.7 },
        ]}
        onPress={handlePress}
      >
        <View style={[styles.iconContainer, { backgroundColor: option.color }]}>
          <IconComponent 
            name={option.icon as any} 
            size={24} 
            color={colors.textPrimary} 
          />
        </View>
        <ThemedText style={styles.menuLabel}>{option.label}</ThemedText>
      </Pressable>
    </Animated.View>
  );
});

// ======================
// ATTACH MENU
// ======================
export const AttachMenu = memo(function AttachMenu({
  visible,
  onClose,
  onSelect,
  position,
}: AttachMenuProps) {
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const menuAnim = useRef(new Animated.Value(0)).current;
  const itemAnims = useRef(MENU_OPTIONS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (visible) {
      // Анимация появления
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: animations.durationFast,
          useNativeDriver: true,
        }),
        Animated.spring(menuAnim, {
          toValue: 1,
          tension: 300,
          friction: 20,
          useNativeDriver: true,
        }),
      ]).start();

      // Последовательная анимация элементов
      itemAnims.forEach((anim, index) => {
        Animated.timing(anim, {
          toValue: 1,
          duration: animations.durationNormal,
          delay: index * 50,
          useNativeDriver: true,
        }).start();
      });
    } else {
      // Анимация исчезновения
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: animations.durationFast,
          useNativeDriver: true,
        }),
        Animated.timing(menuAnim, {
          toValue: 0,
          duration: animations.durationFast,
          useNativeDriver: true,
        }),
        ...itemAnims.map(anim => 
          Animated.timing(anim, {
            toValue: 0,
            duration: animations.durationFast,
            useNativeDriver: true,
          })
        ),
      ]).start();
    }
  }, [visible]);

  const handleSelect = useCallback((option: AttachOption) => {
    onSelect(option);
    onClose();
  }, [onSelect, onClose]);

  const handleBackdropPress = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onClose();
  }, [onClose]);

  // Анимации меню
  const menuScale = menuAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1],
  });

  const menuTranslateY = menuAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <Animated.View 
        style={[
          styles.backdrop,
          { opacity: backdropAnim },
        ]}
      >
        <Pressable style={styles.backdropPressable} onPress={handleBackdropPress}>
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
        </Pressable>
      </Animated.View>

      {/* Menu */}
      <Animated.View
        style={[
          styles.menuContainer,
          {
            opacity: menuAnim,
            transform: [
              { scale: menuScale },
              { translateY: menuTranslateY },
            ],
          },
        ]}
      >
        <View style={styles.menu}>
          {/* Заголовок */}
          <View style={styles.menuHeader}>
            <ThemedText style={styles.menuTitle}>Прикрепить</ThemedText>
            <Pressable style={styles.closeButton} onPress={handleBackdropPress}>
              <Ionicons name="close" size={24} color="#707579" />
            </Pressable>
          </View>
          
          <View style={styles.menuGrid}>
            {MENU_OPTIONS.map((option, index) => (
              <MenuItem
                key={option.id}
                option={option}
                index={index}
                onPress={() => handleSelect(option.id)}
                animValue={itemAnims[index]}
              />
            ))}
          </View>
          
          {/* Кнопка отмены */}
          <Pressable 
            style={({ pressed }) => [
              styles.cancelButton,
              pressed && { opacity: 0.7 },
            ]} 
            onPress={handleBackdropPress}
          >
            <ThemedText style={styles.cancelText}>Отмена</ThemedText>
          </Pressable>
        </View>
      </Animated.View>
    </Modal>
  );
});

// ======================
// СТИЛИ
// ======================
const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdropPressable: {
    flex: 1,
  },
  
  menuContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  menu: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingBottom: 34,
    ...shadows.large,
  },
  
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2D2D2D',
    marginBottom: 16,
  },
  menuTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  
  menuItem: {
    width: '31%',
    alignItems: 'center',
    marginBottom: 20,
  },
  menuItemPressable: {
    alignItems: 'center',
  },
  
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#252525',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  
  menuLabel: {
    ...typography.caption,
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 14,
  },
  
  cancelButton: {
    marginTop: 8,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#252525',
    alignItems: 'center',
  },
  cancelText: {
    ...typography.bodyMedium,
    color: '#3390EC',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default AttachMenu;
