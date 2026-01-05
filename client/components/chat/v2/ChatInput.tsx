/**
 * CHAT INPUT WIDGET (v2)
 * Поле ввода со скрепкой, смайликами и микрофоном
 * 
 * Структура:
 * [Скрепка] [Поле ввода + превью фото] [Смайлик] [Отправить/Микрофон]
 * 
 * Улучшения:
 * - Фото вставляется в поле ввода
 * - Можно добавить текст под фото
 * - Поле расширяется при добавлении фото
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
  Dimensions,
  NativeSyntheticEvent,
  TextInputSelectionChangeEventData,
} from 'react-native';
import { Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/ThemedText';
import { 
  TelegramDarkColors as colors, 
  TelegramSizes as sizes,
  TelegramTypography as typography,
} from '@/constants/telegramDarkTheme';
import { VideoCircleRecorder } from './VideoCircleRecorder';
import { VoiceWaveform } from './VoiceWaveform';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

interface VideoCircleData {
  uri: string;
  duration: number;
}

interface ChatInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onAttachPress: () => void;
  onEmojiPress: () => void;
  onVoiceStart?: () => void;
  onVoiceEnd?: () => void;
  onVideoCircleRecorded?: (data: VideoCircleData) => void;
  replyTo?: ReplyInfo | null;
  onCancelReply?: () => void;
  mediaPreview?: MediaPreview | null;
  onCancelMedia?: () => void;
  disabled?: boolean;
  placeholder?: string;
  bottomInset?: number;
  /** Callback для получения текущей позиции курсора */
  onSelectionChange?: (selection: { start: number; end: number }) => void;
  /** Текущая позиция курсора для вставки emoji */
  selection?: { start: number; end: number };
}

const InputButton = memo(function InputButton({
  icon,
  iconFamily = 'feather',
  onPress,
  onLongPress,
  size = 22,
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
        pressed && !disabled && { opacity: 0.7, backgroundColor: colors.surface },
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

const InlineMediaPreview = memo(function InlineMediaPreview({
  media,
  onCancel,
}: {
  media: MediaPreview;
  onCancel: () => void;
}) {
  const isPhoto = media.type === 'photo';
  
  return (
    <View style={styles.inlineMediaContainer}>
      <View style={styles.inlineMediaContent}>
        {isPhoto ? (
          <Image source={{ uri: media.uri }} style={styles.inlineMediaImage} />
        ) : (
          <View style={styles.inlineMediaFile}>
            <Feather 
              name={media.type === 'video' ? 'video' : 'file'} 
              size={32} 
              color={colors.primary} 
            />
          </View>
        )}
        <Pressable style={styles.inlineMediaClose} onPress={onCancel}>
          <View style={styles.inlineMediaCloseCircle}>
            <Feather name="x" size={14} color="#fff" />
          </View>
        </Pressable>
      </View>
      {media.name && !isPhoto && (
        <ThemedText style={styles.inlineMediaName} numberOfLines={1}>
          {media.name}
        </ThemedText>
      )}
    </View>
  );
});

export const ChatInput = memo(function ChatInput({
  value,
  onChangeText,
  onSend,
  onAttachPress,
  onEmojiPress,
  onVoiceStart,
  onVoiceEnd,
  onVideoCircleRecorded,
  replyTo,
  onCancelReply,
  mediaPreview,
  onCancelMedia,
  disabled = false,
  placeholder = 'Сообщение...',
  bottomInset = 0,
  onSelectionChange,
  selection,
}: ChatInputProps) {
  const [inputHeight, setInputHeight] = useState(44);
  const [isRecording, setIsRecording] = useState(false);
  const [recordMode, setRecordMode] = useState<'voice' | 'video'>('voice');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [showVideoRecorder, setShowVideoRecorder] = useState(false);
  const [localSelection, setLocalSelection] = useState({ start: 0, end: 0 });
  
  const inputRef = useRef<TextInput>(null);
  const sendButtonAnim = useRef(new Animated.Value(0)).current;
  const micButtonAnim = useRef(new Animated.Value(1)).current;
  const recordingAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const micScaleAnim = useRef(new Animated.Value(1)).current;
  const durationTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const wasLongPress = useRef(false);

  const hasText = value.trim().length > 0;
  const hasMedia = !!mediaPreview;
  const canSend = hasText || hasMedia;

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

  const handleSend = useCallback(() => {
    if (!canSend || disabled) return;
    
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onSend();
  }, [canSend, disabled, onSend]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleModeToggle = useCallback(() => {
    if (canSend || isRecording) return;
    if (wasLongPress.current) {
      wasLongPress.current = false;
      return;
    }
    
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setRecordMode(prev => prev === 'voice' ? 'video' : 'voice');
  }, [canSend, isRecording]);

  const handleRecordPressIn = useCallback(() => {
    if (canSend) return;
    
    wasLongPress.current = true;
    
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    if (recordMode === 'video') {
      setShowVideoRecorder(true);
      return;
    }
    
    setIsRecording(true);
    setRecordingDuration(0);
    onVoiceStart?.();
    
    durationTimer.current = setInterval(() => {
      setRecordingDuration(prev => prev + 1);
    }, 1000);
    
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ])
    ).start();
    
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
  }, [canSend, recordMode, onVoiceStart, recordingAnim, pulseAnim]);

  const handleRecordPressOut = useCallback(() => {
    if (!isRecording) return;
    
    setIsRecording(false);
    
    if (durationTimer.current) {
      clearInterval(durationTimer.current);
      durationTimer.current = null;
    }
    
    recordingAnim.stopAnimation();
    recordingAnim.setValue(0);
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
    
    onVoiceEnd?.();
    setRecordingDuration(0);
  }, [isRecording, recordingAnim, pulseAnim, onVoiceEnd]);

  const handleVideoRecorded = useCallback((uri: string, duration: number) => {
    setShowVideoRecorder(false);
    onVideoCircleRecorded?.({ uri, duration });
  }, [onVideoCircleRecorded]);

  const handleContentSizeChange = useCallback((e: any) => {
    const newHeight = Math.min(
      Math.max(44, e.nativeEvent.contentSize.height),
      120
    );
    if (newHeight !== inputHeight) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setInputHeight(newHeight);
    }
  }, [inputHeight]);

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
      {replyTo && onCancelReply && (
        <ReplyPreview replyTo={replyTo} onCancel={onCancelReply} />
      )}

      <View style={styles.inputRow}>
        <InputButton
          icon="paperclip"
          onPress={onAttachPress}
          disabled={disabled}
        />

        <View style={[
          styles.inputContainer,
          hasMedia && styles.inputContainerWithMedia,
        ]}>
          {mediaPreview && onCancelMedia && (
            <InlineMediaPreview media={mediaPreview} onCancel={onCancelMedia} />
          )}

          <TextInput
            ref={inputRef}
            style={[
              styles.textInput, 
              { height: inputHeight },
              hasMedia && styles.textInputWithMedia,
            ]}
            value={value}
            onChangeText={onChangeText}
            onContentSizeChange={handleContentSizeChange}
            onSelectionChange={(e: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => {
              const sel = e.nativeEvent.selection;
              setLocalSelection(sel);
              onSelectionChange?.(sel);
            }}
            selection={selection}
            placeholder={hasMedia ? "Добавить подпись..." : placeholder}
            placeholderTextColor={colors.textTertiary}
            multiline
            maxLength={4096}
            editable={!disabled}
          />
        </View>

        <InputButton
          icon="smile"
          onPress={onEmojiPress}
          disabled={disabled}
        />

        <View style={styles.sendButtonContainer}>
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
              style={styles.sendButtonInner}
              onPress={handleSend}
            >
              <Ionicons name="send" size={18} color="#fff" />
            </Pressable>
          </Animated.View>

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
                isRecording && styles.micButtonRecording,
              ]}
              onPress={handleModeToggle}
              onLongPress={handleRecordPressIn}
              onPressOut={handleRecordPressOut}
              delayLongPress={200}
            >
              <Animated.View 
                style={{ 
                  transform: [{ scale: isRecording ? pulseAnim : micScaleAnim }],
                }}
              >
                {recordMode === 'voice' ? (
                  <Ionicons 
                    name="mic" 
                    size={22} 
                    color={isRecording ? '#fff' : colors.primary} 
                  />
                ) : (
                  <View style={[
                    styles.videoCircle,
                    isRecording && { backgroundColor: '#fff' },
                  ]}>
                    <Ionicons 
                      name="videocam" 
                      size={14} 
                      color={isRecording ? colors.error : colors.primary} 
                    />
                  </View>
                )}
              </Animated.View>
            </Pressable>
          </Animated.View>

          {/* Recording indicator с waveform */}
          {isRecording && (
            <View style={styles.recordingIndicator}>
              <View style={styles.recordingDot} />
              <VoiceWaveform 
                isRecording={isRecording} 
                barCount={5} 
                maxHeight={20}
                color={colors.error}
              />
              <ThemedText style={styles.recordingText}>
                {formatDuration(recordingDuration)}
              </ThemedText>
              <ThemedText style={styles.recordingHint}>
                {recordMode === 'voice' ? 'Голос' : 'Видео'}
              </ThemedText>
            </View>
          )}
        </View>
      </View>

      <VideoCircleRecorder
        visible={showVideoRecorder}
        onClose={() => setShowVideoRecorder(false)}
        onVideoRecorded={handleVideoRecorded}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#17212B',
    borderTopWidth: 1,
    borderTopColor: '#232E3C',
  },
  
  replyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#1E2936',
    borderBottomWidth: 1,
    borderBottomColor: '#232E3C',
  },
  replyLine: {
    width: 2,
    height: 36,
    backgroundColor: '#5EB5F7',
    borderRadius: 1,
    marginRight: 10,
  },
  replyContent: {
    flex: 1,
  },
  replyName: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  replyText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  replyClose: {
    padding: 8,
    marginLeft: 8,
  },
  
  // Input row - sleek design
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  
  // Icon buttons - 2px stroke weight style
  inputButton: {
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 21,
  },
  
  // Input container - sleek with subtle border
  inputContainer: {
    flex: 1,
    backgroundColor: colors.inputBackground || '#1B263B',
    borderRadius: 22,
    marginHorizontal: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.inputBorder || '#3D4F66',
  },
  inputContainerWithMedia: {
    borderRadius: 18,
  },
  
  // Text input - premium typography
  textInput: {
    color: colors.textPrimary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    minHeight: 48,
    maxHeight: 140,
    fontSize: 16,
    letterSpacing: -0.2,
  },
  textInputWithMedia: {
    paddingTop: 10,
    minHeight: 44,
  },
  
  // Inline media preview
  inlineMediaContainer: {
    padding: 10,
    paddingBottom: 0,
  },
  inlineMediaContent: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  inlineMediaImage: {
    width: SCREEN_WIDTH * 0.5,
    height: SCREEN_WIDTH * 0.35,
    borderRadius: 14,
    backgroundColor: colors.surface,
  },
  inlineMediaFile: {
    width: 80,
    height: 80,
    borderRadius: 14,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inlineMediaClose: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  inlineMediaCloseCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inlineMediaName: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    marginLeft: 4,
  },
  
  // Send button - premium gradient feel
  sendButtonContainer: {
    width: 42,
    height: 42,
    position: 'relative',
  },
  sendButton: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonInner: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  micButton: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButtonInner: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButtonRecording: {
    backgroundColor: colors.error,
  },
  videoCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Recording indicator
  recordingIndicator: {
    position: 'absolute',
    left: -120,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(13, 27, 42, 0.9)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
    marginRight: 8,
  },
  recordingText: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '600',
    marginRight: 8,
  },
  recordingHint: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});

export default ChatInput;
