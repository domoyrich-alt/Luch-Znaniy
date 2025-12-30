/**
 * CHAT INPUT WIDGET (v2)
 * Поле ввода со скрепкой, смайликами и микрофоном
 * 
 * Структура:
 * [Скрепка] [Поле ввода + превью] [Смайлик] [Отправить/Микрофон]
 */

import React, { useState, useRef, useCallback, useEffect, memo } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
  Image,
} from 'react-native';
import { Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/ThemedText';
import { 
  TelegramDarkColors as colors, 
  TelegramSizes as sizes,
  TelegramTypography as typography,
  TelegramAnimations as animations,
} from '@/constants/telegramDarkTheme';

// Включаем LayoutAnimation для Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ======================
// ТИПЫ
// ======================
interface ReplyInfo {
  id: number;
  text: string;
  senderName: string;
}

interface MediaPreview {
  uri: string;
  type: 'photo' | 'video' | 'file';
  name?: string;
}

interface ChatInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onAttachPress: () => void;
  onEmojiPress: () => void;
  onVoiceStart?: () => void;
  onVoiceEnd?: () => void;
  replyTo?: ReplyInfo | null;
  onCancelReply?: () => void;
  mediaPreview?: MediaPreview | null;
  onCancelMedia?: () => void;
  disabled?: boolean;
  placeholder?: string;
  bottomInset?: number;
}

// ======================
// INPUT BUTTON
// ======================
const InputButton = memo(function InputButton({
  icon,
  iconFamily = 'feather',
  onPress,
  onLongPress,
  size = sizes.iconMedium,
  color = colors.primary,
  disabled = false,
}: {
  icon: string;
  iconFamily?: 'feather' | 'ionicons' | 'material';
  onPress?: () => void;
  onLongPress?: () => void;
  size?: number;
  color?: string;
  disabled?: boolean;
}) {
  const handlePress = () => {
    if (disabled) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.();
  };

  const IconComponent = iconFamily === 'ionicons' 
    ? Ionicons 
    : iconFamily === 'material' 
      ? MaterialIcons 
      : Feather;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.inputButton,
        pressed && !disabled && { opacity: 0.7 },
        disabled && { opacity: 0.5 },
      ]}
      onPress={handlePress}
      onLongPress={onLongPress}
      disabled={disabled}
    >
      <IconComponent name={icon as any} size={size} color={color} />
    </Pressable>
  );
});

// ======================
// REPLY PREVIEW
// ======================
const ReplyPreview = memo(function ReplyPreview({
  replyTo,
  onCancel,
}: {
  replyTo: ReplyInfo;
  onCancel: () => void;
}) {
  return (
    <View style={styles.replyContainer}>
      <View style={styles.replyLine} />
      <View style={styles.replyContent}>
        <ThemedText style={styles.replyName}>{replyTo.senderName}</ThemedText>
        <ThemedText style={styles.replyText} numberOfLines={1}>
          {replyTo.text}
        </ThemedText>
      </View>
      <Pressable style={styles.replyClose} onPress={onCancel}>
        <Feather name="x" size={18} color={colors.textSecondary} />
      </Pressable>
    </View>
  );
});

// ======================
// MEDIA PREVIEW
// ======================
const MediaPreviewComponent = memo(function MediaPreviewComponent({
  media,
  onCancel,
}: {
  media: MediaPreview;
  onCancel: () => void;
}) {
  return (
    <View style={styles.mediaPreviewContainer}>
      {media.type === 'photo' ? (
        <Image source={{ uri: media.uri }} style={styles.mediaPreviewImage} />
      ) : (
        <View style={styles.mediaPreviewFile}>
          <Feather 
            name={media.type === 'video' ? 'video' : 'file'} 
            size={20} 
            color={colors.primary} 
          />
        </View>
      )}
      <ThemedText style={styles.mediaPreviewName} numberOfLines={1}>
        {media.name || (media.type === 'photo' ? 'Фото' : 'Файл')}
      </ThemedText>
      <Pressable style={styles.mediaPreviewClose} onPress={onCancel}>
        <Feather name="x" size={16} color={colors.textSecondary} />
      </Pressable>
    </View>
  );
});

// ======================
// CHAT INPUT
// ======================
export const ChatInput = memo(function ChatInput({
  value,
  onChangeText,
  onSend,
  onAttachPress,
  onEmojiPress,
  onVoiceStart,
  onVoiceEnd,
  replyTo,
  onCancelReply,
  mediaPreview,
  onCancelMedia,
  disabled = false,
  placeholder = 'Сообщение...',
  bottomInset = 0,
}: ChatInputProps) {
  const [inputHeight, setInputHeight] = useState(sizes.inputMinHeight);
  const [isRecording, setIsRecording] = useState(false);
  
  const inputRef = useRef<TextInput>(null);
  const sendButtonAnim = useRef(new Animated.Value(0)).current;
  const micButtonAnim = useRef(new Animated.Value(1)).current;
  const recordingAnim = useRef(new Animated.Value(0)).current;

  const hasText = value.trim().length > 0;
  const hasMedia = !!mediaPreview;
  const canSend = hasText || hasMedia;

  // Анимация кнопки отправки/микрофона
  useEffect(() => {
    Animated.parallel([
      Animated.spring(sendButtonAnim, {
        toValue: canSend ? 1 : 0,
        tension: 200,
        friction: 15,
        useNativeDriver: true,
      }),
      Animated.spring(micButtonAnim, {
        toValue: canSend ? 0 : 1,
        tension: 200,
        friction: 15,
        useNativeDriver: true,
      }),
    ]).start();
  }, [canSend]);

  // Обработчик отправки
  const handleSend = useCallback(() => {
    if (!canSend || disabled) return;
    
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onSend();
  }, [canSend, disabled, onSend]);

  // Обработчик голосового сообщения
  const handleVoicePressIn = useCallback(() => {
    if (canSend) return;
    
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setIsRecording(true);
    onVoiceStart?.();
    
    Animated.loop(
      Animated.sequence([
        Animated.timing(recordingAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(recordingAnim, {
          toValue: 0.5,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [canSend, onVoiceStart, recordingAnim]);

  const handleVoicePressOut = useCallback(() => {
    if (!isRecording) return;
    
    setIsRecording(false);
    recordingAnim.stopAnimation();
    recordingAnim.setValue(0);
    onVoiceEnd?.();
  }, [isRecording, recordingAnim, onVoiceEnd]);

  // Изменение высоты инпута
  const handleContentSizeChange = useCallback((e: any) => {
    const newHeight = Math.min(
      Math.max(sizes.inputMinHeight, e.nativeEvent.contentSize.height),
      sizes.inputMaxHeight
    );
    if (newHeight !== inputHeight) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setInputHeight(newHeight);
    }
  }, [inputHeight]);

  // Анимации для кнопок
  const sendScale = sendButtonAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  const micScale = micButtonAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  return (
    <View style={[styles.container, { paddingBottom: Math.max(bottomInset, 8) }]}>
      {/* Reply preview */}
      {replyTo && onCancelReply && (
        <ReplyPreview replyTo={replyTo} onCancel={onCancelReply} />
      )}

      {/* Input row */}
      <View style={styles.inputRow}>
        {/* Скрепка */}
        <InputButton
          icon="paperclip"
          onPress={onAttachPress}
          disabled={disabled}
        />

        {/* Поле ввода */}
        <View style={styles.inputContainer}>
          {/* Превью медиа */}
          {mediaPreview && onCancelMedia && (
            <MediaPreviewComponent media={mediaPreview} onCancel={onCancelMedia} />
          )}

          <TextInput
            ref={inputRef}
            style={[styles.textInput, { height: inputHeight }]}
            value={value}
            onChangeText={onChangeText}
            onContentSizeChange={handleContentSizeChange}
            placeholder={placeholder}
            placeholderTextColor={colors.textTertiary}
            multiline
            maxLength={4096}
            editable={!disabled}
          />
        </View>

        {/* Смайлик */}
        <InputButton
          icon="smile"
          onPress={onEmojiPress}
          disabled={disabled}
        />

        {/* Отправить / Микрофон */}
        <View style={styles.sendButtonContainer}>
          {/* Кнопка отправки */}
          <Animated.View
            style={[
              styles.sendButton,
              {
                opacity: sendButtonAnim,
                transform: [{ scale: sendScale }],
              },
            ]}
            pointerEvents={canSend ? 'auto' : 'none'}
          >
            <Pressable
              style={[styles.sendButtonInner, { backgroundColor: colors.primary }]}
              onPress={handleSend}
            >
              <Ionicons name="send" size={18} color={colors.textPrimary} />
            </Pressable>
          </Animated.View>

          {/* Кнопка микрофона */}
          <Animated.View
            style={[
              styles.micButton,
              {
                opacity: micButtonAnim,
                transform: [{ scale: micScale }],
              },
            ]}
            pointerEvents={!canSend ? 'auto' : 'none'}
          >
            <Pressable
              style={[
                styles.micButtonInner,
                isRecording && { backgroundColor: colors.error },
              ]}
              onPressIn={handleVoicePressIn}
              onPressOut={handleVoicePressOut}
            >
              <Animated.View style={{ opacity: isRecording ? recordingAnim : 1 }}>
                <Ionicons 
                  name="mic" 
                  size={22} 
                  color={isRecording ? colors.textPrimary : colors.primary} 
                />
              </Animated.View>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    </View>
  );
});

// ======================
// СТИЛИ
// ======================
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1A1A1A',
    borderTopWidth: 1,
    borderTopColor: '#2D2D2D',
  },
  
  // Reply
  replyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#2D2D2D',
  },
  replyLine: {
    width: 2,
    height: '100%',
    backgroundColor: '#3390EC',
    borderRadius: 1,
    marginRight: 8,
  },
  replyContent: {
    flex: 1,
  },
  replyName: {
    ...typography.caption,
    color: '#3390EC',
    fontWeight: '600',
  },
  replyText: {
    ...typography.caption,
    color: '#707579',
  },
  replyClose: {
    padding: 8,
  },
  
  // Input row
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  
  inputButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
  },
  
  // Input container
  inputContainer: {
    flex: 1,
    backgroundColor: '#2D2D2D',
    borderRadius: 22,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  textInput: {
    ...typography.bodyMedium,
    color: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 44,
    maxHeight: 120,
    fontSize: 16,
  },
  
  // Media preview
  mediaPreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2D2D2D',
    backgroundColor: '#252525',
  },
  mediaPreviewImage: {
    width: 50,
    height: 50,
    borderRadius: 10,
  },
  mediaPreviewFile: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: '#2D2D2D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaPreviewName: {
    ...typography.caption,
    color: '#707579',
    flex: 1,
    marginLeft: 12,
  },
  mediaPreviewClose: {
    padding: 4,
    marginLeft: 8,
  },
  
  // Send/Mic buttons
  sendButtonContainer: {
    width: 44,
    height: 44,
    position: 'relative',
  },
  sendButton: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3390EC',  // Синий Telegram
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButton: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButtonInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChatInput;
