/**
 * TELEGRAM-STYLE CHAT CONTEXT MENU
 * 
 * Контекстное меню для сообщений с анимациями и haptic feedback
 * Long-press = контекст
 */

import React, { useRef, useEffect, memo } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
  Modal,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/ThemedText';
import { Message } from '@/store/ChatStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '🎉', '💯'];

interface MenuAction {
  id: string;
  icon: string;
  label: string;
  color?: string;
  onPress: () => void;
}

interface TelegramContextMenuProps {
  visible: boolean;
  message: Message | null;
  position: { x: number; y: number };
  isOwn: boolean;
  onClose: () => void;
  onReaction: (emoji: string) => void;
  onReply: () => void;
  onForward: () => void;
  onCopy: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onPin?: () => void;
  theme: any;
}

function TelegramContextMenu({
  visible,
  message,
  position,
  isOwn,
  onClose,
  onReaction,
  onReply,
  onForward,
  onCopy,
  onEdit,
  onDelete,
  onPin,
  theme,
}: TelegramContextMenuProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 200,
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
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible || !message) return null;

  // Вычисляем позицию меню
  const menuHeight = 280;
  const reactionHeight = 60;
  const totalHeight = menuHeight + reactionHeight;
  
  const top = Math.max(
    60,
    Math.min(position.y - totalHeight / 2, SCREEN_HEIGHT - totalHeight - 60)
  );
  const left = Math.max(16, Math.min(position.x - 140, SCREEN_WIDTH - 296));

  // Формируем действия
  const actions: MenuAction[] = [
    {
      id: 'reply',
      icon: 'corner-up-left',
      label: 'Ответить',
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onReply();
        onClose();
      },
    },
    {
      id: 'forward',
      icon: 'corner-up-right',
      label: 'Переслать',
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onForward();
        onClose();
      },
    },
    {
      id: 'copy',
      icon: 'copy',
      label: 'Копировать',
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onCopy();
        onClose();
      },
    },
  ];

  if (onPin) {
    actions.push({
      id: 'pin',
      icon: 'bookmark',
      label: 'Закрепить',
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPin();
        onClose();
      },
    });
  }

  if (isOwn && onEdit) {
    actions.push({
      id: 'edit',
      icon: 'edit-2',
      label: 'Редактировать',
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onEdit();
        onClose();
      },
    });
  }

  if (onDelete) {
    actions.push({
      id: 'delete',
      icon: 'trash-2',
      label: 'Удалить',
      color: theme.error,
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onDelete();
        onClose();
      },
    });
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <BlurView intensity={20} style={StyleSheet.absoluteFill} />
        
        <Animated.View
          style={[
            styles.menuContainer,
            {
              top,
              left,
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Реакции */}
          <View style={[styles.reactionsRow, { backgroundColor: theme.backgroundDefault }]}>
            {REACTION_EMOJIS.map((emoji) => (
              <Pressable
                key={emoji}
                style={({ pressed }) => [
                  styles.reactionItem,
                  pressed && { backgroundColor: theme.backgroundSecondary },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onReaction(emoji);
                  onClose();
                }}
              >
                <ThemedText style={styles.reactionEmoji}>{emoji}</ThemedText>
              </Pressable>
            ))}
          </View>

          {/* Действия */}
          <View style={[styles.actionsContainer, { backgroundColor: theme.backgroundDefault }]}>
            {actions.map((action, index) => (
              <Pressable
                key={action.id}
                style={({ pressed }) => [
                  styles.actionRow,
                  pressed && { backgroundColor: theme.backgroundSecondary },
                  index < actions.length - 1 && styles.actionBorder,
                ]}
                onPress={action.onPress}
              >
                <Feather 
                  name={action.icon as any} 
                  size={20} 
                  color={action.color || theme.text} 
                />
                <ThemedText 
                  style={[
                    styles.actionLabel,
                    action.color && { color: action.color },
                  ]}
                >
                  {action.label}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

export default memo(TelegramContextMenu);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  menuContainer: {
    position: 'absolute',
    width: 280,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
  },
  
  // Реакции
  reactionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  reactionItem: {
    padding: 8,
    borderRadius: 20,
  },
  reactionEmoji: {
    fontSize: 24,
  },

  // Действия
  actionsContainer: {
    paddingVertical: 4,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  actionBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  actionLabel: {
    fontSize: 16,
    flex: 1,
  },
});
