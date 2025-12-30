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
}: ChatInputProps) {
  const [inputHeight, setInputHeight] = useState(44);
  const [isRecording, setIsRecording] = useState(false);
  const [recordMode, setRecordMode] = useState<'voice' | 'video'>('voice');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [showVideoRecorder, setShowVideoRecorder] = useState(false);
  
  const inputRef = useRef<TextInput>(null);
  const sendButtonAnim = useRef(new Animated.Value(0)).current;
  const micButtonAnim = useRef(new Animated.Value(1)).current;
  const recordingAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
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
                isRecording && { backgroundColor: colors.error },
              ]}
              onPress={handleModeToggle}
              onLongPress={handleRecordPressIn}
              onPressOut={handleRecordPressOut}
              delayLongPress={200}
            >
              <Animated.View 
                style={{ 
                  opacity: isRecording ? recordingAnim : 1,
                  transform: [{ scale: isRecording ? pulseAnim : 1 }],
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

          {isRecording && (
            <View style={styles.recordingIndicator}>
              <View style={styles.recordingDot} />
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
    color: '#5EB5F7',
    fontWeight: '600',
    marginBottom: 2,
  },
  replyText: {
    fontSize: 14,
    color: '#8B9BA5',
  },
  replyClose: {
    padding: 8,
    marginLeft: 8,
  },
  
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  
  inputButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
  },
  
  inputContainer: {
    flex: 1,
    backgroundColor: '#242F3D',
    borderRadius: 20,
    marginHorizontal: 4,
    overflow: 'hidden',
  },
  inputContainerWithMedia: {
    borderRadius: 16,
  },
  
  textInput: {
    color: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 44,
    maxHeight: 120,
    fontSize: 16,
  },
  textInputWithMedia: {
    paddingTop: 8,
    minHeight: 40,
  },
  
  inlineMediaContainer: {
    padding: 8,
    paddingBottom: 0,
  },
  inlineMediaContent: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  inlineMediaImage: {
    width: SCREEN_WIDTH * 0.5,
    height: SCREEN_WIDTH * 0.35,
    borderRadius: 12,
    backgroundColor: '#1A2430',
  },
  inlineMediaFile: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#1A2430',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inlineMediaClose: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  inlineMediaCloseCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inlineMediaName: {
    fontSize: 12,
    color: '#8B9BA5',
    marginTop: 4,
    marginLeft: 4,
  },
  
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
    backgroundColor: '#5EB5F7',
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
  videoCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#5EB5F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingIndicator: {
    position: 'absolute',
    left: -120,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4444',
    marginRight: 8,
  },
  recordingText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    marginRight: 8,
  },
  recordingHint: {
    fontSize: 12,
    color: '#8B9BA5',
  },
});

export default ChatInput;
