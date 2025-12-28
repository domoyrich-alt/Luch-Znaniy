/**
 * TELEGRAM-STYLE CHAT INPUT
 * 
 * Особенности:
 * - Плавные анимации при переключении режимов
 * - Поддержка голосовых сообщений
 * - Reply preview
 * - Attach меню
 */

import React, { useState, useRef, useCallback, memo, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  Animated,
  Keyboard,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/ThemedText';
import { Message } from '@/store/ChatStore';

// Включаем LayoutAnimation для Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface TelegramChatInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onAttach: () => void;
  onVoiceStart?: () => void;
  onVoiceEnd?: () => void;
  replyTo?: Message | null;
  onCancelReply?: () => void;
  editingMessage?: Message | null;
  onCancelEdit?: () => void;
  disabled?: boolean;
  placeholder?: string;
  theme: any;
  bottomInset?: number;
}

function TelegramChatInput({
  value,
  onChangeText,
  onSend,
  onAttach,
  onVoiceStart,
  onVoiceEnd,
  replyTo,
  onCancelReply,
  editingMessage,
  onCancelEdit,
  disabled = false,
  placeholder = 'Сообщение...',
  theme,
  bottomInset = 0,
}: TelegramChatInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [inputHeight, setInputHeight] = useState(40);
  const [isRecording, setIsRecording] = useState(false);
  
  const inputRef = useRef<TextInput>(null);
  const sendButtonAnim = useRef(new Animated.Value(0)).current;
  const micButtonAnim = useRef(new Animated.Value(1)).current;
  const recordingAnim = useRef(new Animated.Value(0)).current;

  const hasText = value.trim().length > 0;
  const hasReplyOrEdit = replyTo || editingMessage;

  // Анимация кнопки отправки/микрофона
  useEffect(() => {
    Animated.parallel([
      Animated.spring(sendButtonAnim, {
        toValue: hasText ? 1 : 0,
        tension: 200,
        friction: 15,
        useNativeDriver: true,
      }),
      Animated.spring(micButtonAnim, {
        toValue: hasText ? 0 : 1,
        tension: 200,
        friction: 15,
        useNativeDriver: true,
      }),
    ]).start();
  }, [hasText]);

  // Обработчик отправки
  const handleSend = useCallback(() => {
    if (!hasText || disabled) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSend();
  }, [hasText, disabled, onSend]);

  // Обработчик голосового сообщения
  const handleVoicePress = useCallback(() => {
    if (hasText) {
      handleSend();
      return;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Начинаем запись
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
  }, [hasText, handleSend, onVoiceStart]);

  const handleVoiceRelease = useCallback(() => {
    if (!isRecording) return;
    
    setIsRecording(false);
    recordingAnim.stopAnimation();
    recordingAnim.setValue(0);
    onVoiceEnd?.();
  }, [isRecording, onVoiceEnd]);

  // Высота инпута
  const handleContentSizeChange = useCallback((e: any) => {
    const newHeight = Math.min(Math.max(40, e.nativeEvent.contentSize.height), 120);
    if (newHeight !== inputHeight) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setInputHeight(newHeight);
    }
  }, [inputHeight]);

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundDefault }]}>
      {/* Reply/Edit Preview */}
      {hasReplyOrEdit && (
        <View style={[styles.previewBar, { borderTopColor: theme.border }]}>
          <View style={[styles.previewLine, { backgroundColor: theme.primary }]} />
          
          <View style={styles.previewContent}>
            <ThemedText style={[styles.previewTitle, { color: theme.primary }]}>
              {editingMessage ? 'Редактирование' : replyTo?.senderName || 'Ответ'}
            </ThemedText>
            <ThemedText 
              style={[styles.previewText, { color: theme.textSecondary }]} 
              numberOfLines={1}
            >
              {editingMessage?.text || replyTo?.text || 'Медиа'}
            </ThemedText>
          </View>
          
          <Pressable
            style={styles.previewClose}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              editingMessage ? onCancelEdit?.() : onCancelReply?.();
            }}
          >
            <Feather name="x" size={20} color={theme.textSecondary} />
          </Pressable>
        </View>
      )}

      {/* Input Row */}
      <View style={[styles.inputRow, { paddingBottom: Math.max(bottomInset, 8) }]}>
        {/* Attach Button */}
        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            pressed && { opacity: 0.7 },
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onAttach();
          }}
          disabled={disabled}
        >
          <Feather name="paperclip" size={22} color={theme.primary} />
        </Pressable>

        {/* Text Input */}
        <View 
          style={[
            styles.inputWrapper, 
            { 
              backgroundColor: theme.backgroundSecondary,
              minHeight: inputHeight,
            },
          ]}
        >
          <TextInput
            ref={inputRef}
            style={[
              styles.textInput, 
              { 
                color: theme.text,
                height: inputHeight - 16,
              },
            ]}
            placeholder={placeholder}
            placeholderTextColor={theme.textSecondary}
            value={value}
            onChangeText={onChangeText}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onContentSizeChange={handleContentSizeChange}
            multiline
            maxLength={4000}
            editable={!disabled && !isRecording}
            returnKeyType="default"
          />
          
          {/* Emoji Button */}
          <Pressable
            style={styles.emojiButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              // Открыть эмодзи пикер
            }}
          >
            <Feather name="smile" size={22} color={theme.textSecondary} />
          </Pressable>
        </View>

        {/* Send/Voice Button */}
        <View style={styles.sendButtonContainer}>
          {/* Send Button */}
          <Animated.View
            style={[
              styles.sendButtonWrapper,
              {
                opacity: sendButtonAnim,
                transform: [
                  {
                    scale: sendButtonAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <Pressable
              style={[styles.sendButton, { backgroundColor: theme.primary }]}
              onPress={handleSend}
              disabled={!hasText || disabled}
            >
              <Feather name="send" size={20} color="#fff" />
            </Pressable>
          </Animated.View>

          {/* Mic Button */}
          <Animated.View
            style={[
              styles.micButtonWrapper,
              {
                opacity: micButtonAnim,
                transform: [
                  {
                    scale: micButtonAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                pressed && { opacity: 0.7 },
                isRecording && [styles.recordingButton, { backgroundColor: theme.error }],
              ]}
              onPressIn={handleVoicePress}
              onPressOut={handleVoiceRelease}
              disabled={disabled}
            >
              <Animated.View
                style={isRecording ? {
                  opacity: recordingAnim,
                } : undefined}
              >
                <Feather 
                  name="mic" 
                  size={22} 
                  color={isRecording ? '#fff' : theme.primary} 
                />
              </Animated.View>
            </Pressable>
          </Animated.View>
        </View>
      </View>

      {/* Recording Indicator */}
      {isRecording && (
        <View style={[styles.recordingIndicator, { backgroundColor: theme.backgroundDefault }]}>
          <Animated.View
            style={[
              styles.recordingDot,
              { 
                backgroundColor: theme.error,
                opacity: recordingAnim,
              },
            ]}
          />
          <ThemedText style={[styles.recordingText, { color: theme.text }]}>
            Запись...
          </ThemedText>
          <Pressable
            style={styles.recordingCancel}
            onPress={() => {
              setIsRecording(false);
              recordingAnim.stopAnimation();
              recordingAnim.setValue(0);
            }}
          >
            <ThemedText style={[styles.recordingCancelText, { color: theme.error }]}>
              Отмена
            </ThemedText>
          </Pressable>
        </View>
      )}
    </View>
  );
}

export default memo(TelegramChatInput);

const styles = StyleSheet.create({
  container: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },

  // Preview Bar
  previewBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  previewLine: {
    width: 3,
    height: '100%',
    borderRadius: 2,
    marginRight: 10,
  },
  previewContent: {
    flex: 1,
  },
  previewTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  previewText: {
    fontSize: 13,
    marginTop: 2,
  },
  previewClose: {
    padding: 8,
    marginLeft: 8,
  },

  // Input Row
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingTop: 8,
    gap: 8,
  },

  // Action Buttons
  actionButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Input
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    paddingTop: 0,
    paddingBottom: 0,
  },
  emojiButton: {
    padding: 4,
    marginLeft: 4,
    alignSelf: 'flex-end',
  },

  // Send/Mic Buttons
  sendButtonContainer: {
    width: 40,
    height: 40,
    position: 'relative',
  },
  sendButtonWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  micButtonWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingButton: {
    borderRadius: 20,
  },

  // Recording Indicator
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  recordingText: {
    flex: 1,
    fontSize: 15,
  },
  recordingCancel: {
    padding: 8,
  },
  recordingCancelText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
