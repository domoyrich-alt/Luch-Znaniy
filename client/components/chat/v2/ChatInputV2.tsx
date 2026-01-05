/**
 * CHAT INPUT V2 - Telegram-Style Input Bar
 * 
 * Features:
 * - Multiple photo previews in horizontal scrollable list
 * - Mic/Video toggle button on tap
 * - Video recording with swipe gestures (up to lock, left to cancel)
 * - Dynamic height expansion
 * - Theme: Background #0D1B2A, Accents #7AA2F7
 */

import React, { useState, useRef, useCallback, useEffect, memo } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  Animated,
  PanResponder,
  LayoutAnimation,
  Platform,
  UIManager,
  Image,
  Dimensions,
  ScrollView,
  NativeSyntheticEvent,
  TextInputSelectionChangeEventData,
} from 'react-native';
import { Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/ThemedText';
import { 
  TelegramDarkColors as colors, 
  TelegramSizes as sizes,
} from '@/constants/telegramDarkTheme';
import { VideoCircleRecorderV2 } from './VideoCircleRecorderV2';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Theme colors
const THEME = {
  background: '#0D1B2A',
  backgroundSecondary: '#1B263B',
  surface: '#253142',
  accent: '#7AA2F7',
  accentDark: '#5A8AE6',
  text: '#FFFFFF',
  textSecondary: '#8899A6',
  border: '#3D4F66',
  error: '#F7768E',
  success: '#9ECE6A',
};

// ======================
// TYPES
// ======================
interface ReplyInfo {
  id: number;
  text: string;
  senderName: string;
}

interface MediaItem {
  id: string;
  uri: string;
  type: 'photo' | 'video' | 'file';
  name?: string;
  thumbnail?: string;
}

interface VideoCircleData {
  uri: string;
  duration: number;
}

interface ChatInputV2Props {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onAttachPress: () => void;
  onEmojiPress: () => void;
  onVoiceRecorded?: (uri: string, duration: number) => void;
  onVideoCircleRecorded?: (data: VideoCircleData) => void;
  replyTo?: ReplyInfo | null;
  onCancelReply?: () => void;
  mediaItems?: MediaItem[];
  onRemoveMedia?: (id: string) => void;
  onClearAllMedia?: () => void;
  disabled?: boolean;
  placeholder?: string;
  bottomInset?: number;
  onSelectionChange?: (selection: { start: number; end: number }) => void;
  selection?: { start: number; end: number };
}

// ======================
// INPUT BUTTON COMPONENT
// ======================
const InputButton = memo(function InputButton({
  icon,
  iconFamily = 'feather',
  onPress,
  onLongPress,
  size = 22,
  color = THEME.accent,
  disabled = false,
  style,
}: {
  icon: string;
  iconFamily?: 'feather' | 'ionicons' | 'material';
  onPress?: () => void;
  onLongPress?: () => void;
  size?: number;
  color?: string;
  disabled?: boolean;
  style?: any;
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
        pressed && !disabled && { opacity: 0.7, backgroundColor: THEME.surface },
        disabled && { opacity: 0.5 },
        style,
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
        <Feather name="x" size={18} color={THEME.textSecondary} />
      </Pressable>
    </View>
  );
});

// ======================
// MEDIA PREVIEW ITEM (Square with delete badge)
// ======================
const MediaPreviewItem = memo(function MediaPreviewItem({
  item,
  onRemove,
}: {
  item: MediaItem;
  onRemove: () => void;
}) {
  return (
    <View style={styles.mediaPreviewItem}>
      {item.type === 'photo' || item.thumbnail ? (
        <Image 
          source={{ uri: item.thumbnail || item.uri }} 
          style={styles.mediaPreviewImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.mediaPreviewFile}>
          <Feather 
            name={item.type === 'video' ? 'video' : 'file'} 
            size={24} 
            color={THEME.accent} 
          />
        </View>
      )}
      
      {/* Video duration badge */}
      {item.type === 'video' && (
        <View style={styles.videoDurationBadge}>
          <Ionicons name="play" size={8} color="#fff" />
        </View>
      )}
      
      {/* Delete badge */}
      <Pressable style={styles.mediaDeleteBadge} onPress={onRemove}>
        <View style={styles.mediaDeleteBadgeInner}>
          <Feather name="x" size={12} color="#fff" />
        </View>
      </Pressable>
    </View>
  );
});

// ======================
// MEDIA PREVIEW LIST (Horizontal Scrollable)
// ======================
const MediaPreviewList = memo(function MediaPreviewList({
  items,
  onRemove,
  onClearAll,
}: {
  items: MediaItem[];
  onRemove: (id: string) => void;
  onClearAll?: () => void;
}) {
  if (!items.length) return null;

  return (
    <View style={styles.mediaPreviewContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.mediaPreviewScroll}
      >
        {items.map((item) => (
          <MediaPreviewItem 
            key={item.id} 
            item={item} 
            onRemove={() => onRemove(item.id)} 
          />
        ))}
      </ScrollView>
      
      {items.length > 1 && onClearAll && (
        <Pressable style={styles.clearAllButton} onPress={onClearAll}>
          <Feather name="trash-2" size={16} color={THEME.error} />
        </Pressable>
      )}
    </View>
  );
});

// ======================
// RECORD BUTTON WITH GESTURES
// ======================
const RecordButton = memo(function RecordButton({
  mode,
  onModeToggle,
  onRecordStart,
  onRecordEnd,
  onRecordCancel,
  onRecordLock,
  isRecording,
  isLocked,
  disabled,
}: {
  mode: 'voice' | 'video';
  onModeToggle: () => void;
  onRecordStart: () => void;
  onRecordEnd: () => void;
  onRecordCancel: () => void;
  onRecordLock: () => void;
  isRecording: boolean;
  isLocked: boolean;
  disabled: boolean;
}) {
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const lockIconOpacity = useRef(new Animated.Value(0)).current;
  const cancelIconOpacity = useRef(new Animated.Value(0)).current;
  
  const isSwipingRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });

  // Pulse animation when recording
  useEffect(() => {
    if (isRecording && !isLocked) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
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
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [isRecording, isLocked]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: () => {
        if (disabled) return;
        
        isSwipingRef.current = false;
        startPosRef.current = { x: 0, y: 0 };
        
        Animated.spring(scale, {
          toValue: 1.3,
          tension: 300,
          friction: 10,
          useNativeDriver: true,
        }).start();

        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        
        // Start recording after delay (long press)
        setTimeout(() => {
          if (!isSwipingRef.current) {
            onRecordStart();
          }
        }, 200);
      },

      onPanResponderMove: (_, gestureState) => {
        if (disabled || !isRecording) return;
        
        const { dx, dy } = gestureState;
        isSwipingRef.current = true;

        // Swipe up to lock
        if (dy < -30) {
          translateY.setValue(Math.max(dy, -80));
          const progress = Math.min(Math.abs(dy) / 80, 1);
          lockIconOpacity.setValue(progress);
          cancelIconOpacity.setValue(0);
        }
        // Swipe left to cancel
        else if (dx < -30) {
          translateX.setValue(Math.max(dx, -100));
          const progress = Math.min(Math.abs(dx) / 100, 1);
          cancelIconOpacity.setValue(progress);
          lockIconOpacity.setValue(0);
        }
      },

      onPanResponderRelease: (_, gestureState) => {
        if (disabled) return;
        
        const { dx, dy } = gestureState;

        Animated.parallel([
          Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
          Animated.timing(lockIconOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
          Animated.timing(cancelIconOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
        ]).start();

        if (!isRecording) {
          // Short tap = toggle mode
          if (!isSwipingRef.current) {
            onModeToggle();
          }
          return;
        }

        // Swipe up threshold reached = lock
        if (dy < -60) {
          if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
          onRecordLock();
        }
        // Swipe left threshold reached = cancel
        else if (dx < -80) {
          if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          }
          onRecordCancel();
        }
        // Normal release = end recording
        else {
          onRecordEnd();
        }
      },

      onPanResponderTerminate: () => {
        Animated.parallel([
          Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
        ]).start();
        
        if (isRecording && !isLocked) {
          onRecordCancel();
        }
      },
    })
  ).current;

  return (
    <View style={styles.recordButtonContainer}>
      {/* Lock indicator (swipe up) */}
      <Animated.View 
        style={[
          styles.lockIndicator,
          { opacity: lockIconOpacity },
        ]}
      >
        <Feather name="lock" size={20} color={THEME.accent} />
        <ThemedText style={styles.gestureHint}>Заблокировать</ThemedText>
      </Animated.View>

      {/* Cancel indicator (swipe left) */}
      <Animated.View 
        style={[
          styles.cancelIndicator,
          { opacity: cancelIconOpacity },
        ]}
      >
        <Feather name="x" size={20} color={THEME.error} />
        <ThemedText style={styles.gestureHint}>Отмена</ThemedText>
      </Animated.View>

      {/* Main button */}
      <Animated.View
        style={[
          styles.recordButton,
          {
            transform: [
              { scale: isRecording ? pulseAnim : scale },
              { translateY },
              { translateX },
            ],
          },
          isRecording && styles.recordButtonActive,
        ]}
        {...panResponder.panHandlers}
      >
        {mode === 'voice' ? (
          <Ionicons 
            name="mic" 
            size={22} 
            color={isRecording ? '#fff' : THEME.accent} 
          />
        ) : (
          <View style={[
            styles.videoIconCircle,
            isRecording && styles.videoIconCircleActive,
          ]}>
            <Ionicons 
              name="videocam" 
              size={14} 
              color={isRecording ? '#fff' : THEME.accent} 
            />
          </View>
        )}
      </Animated.View>
    </View>
  );
});

// ======================
// MAIN CHAT INPUT COMPONENT
// ======================
export const ChatInputV2 = memo(function ChatInputV2({
  value,
  onChangeText,
  onSend,
  onAttachPress,
  onEmojiPress,
  onVoiceRecorded,
  onVideoCircleRecorded,
  replyTo,
  onCancelReply,
  mediaItems = [],
  onRemoveMedia,
  onClearAllMedia,
  disabled = false,
  placeholder = 'Сообщение...',
  bottomInset = 0,
  onSelectionChange,
  selection,
}: ChatInputV2Props) {
  const [inputHeight, setInputHeight] = useState(48);
  const [recordMode, setRecordMode] = useState<'voice' | 'video'>('voice');
  const [isRecording, setIsRecording] = useState(false);
  const [isRecordingLocked, setIsRecordingLocked] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [showVideoRecorder, setShowVideoRecorder] = useState(false);
  
  const inputRef = useRef<TextInput>(null);
  const sendButtonAnim = useRef(new Animated.Value(0)).current;
  const micButtonAnim = useRef(new Animated.Value(1)).current;
  const durationTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const hasText = value.trim().length > 0;
  const hasMedia = mediaItems.length > 0;
  const canSend = hasText || hasMedia;

  // Animate send/mic button transition
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

  const handleModeToggle = useCallback(() => {
    if (canSend || isRecording) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setRecordMode(prev => prev === 'voice' ? 'video' : 'voice');
  }, [canSend, isRecording]);

  const handleRecordStart = useCallback(() => {
    if (canSend) return;
    
    if (recordMode === 'video') {
      setShowVideoRecorder(true);
      return;
    }
    
    setIsRecording(true);
    setRecordingDuration(0);
    
    durationTimer.current = setInterval(() => {
      setRecordingDuration(prev => prev + 1);
    }, 1000);
  }, [canSend, recordMode]);

  const handleRecordEnd = useCallback(() => {
    if (!isRecording) return;
    
    setIsRecording(false);
    setIsRecordingLocked(false);
    
    if (durationTimer.current) {
      clearInterval(durationTimer.current);
      durationTimer.current = null;
    }
    
    if (recordingDuration >= 1) {
      onVoiceRecorded?.('voice_recording_uri', recordingDuration);
    }
    
    setRecordingDuration(0);
  }, [isRecording, recordingDuration, onVoiceRecorded]);

  const handleRecordCancel = useCallback(() => {
    setIsRecording(false);
    setIsRecordingLocked(false);
    
    if (durationTimer.current) {
      clearInterval(durationTimer.current);
      durationTimer.current = null;
    }
    
    setRecordingDuration(0);
  }, []);

  const handleRecordLock = useCallback(() => {
    setIsRecordingLocked(true);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  }, []);

  const handleVideoRecorded = useCallback((uri: string, duration: number) => {
    setShowVideoRecorder(false);
    onVideoCircleRecorded?.({ uri, duration });
  }, [onVideoCircleRecorded]);

  const handleContentSizeChange = useCallback((e: any) => {
    const newHeight = Math.min(
      Math.max(48, e.nativeEvent.contentSize.height + 16),
      140
    );
    if (newHeight !== inputHeight) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setInputHeight(newHeight);
    }
  }, [inputHeight]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const sendScale = sendButtonAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  const micScale = micButtonAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  // Calculate container height dynamically
  const containerHeight = inputHeight + (hasMedia ? 88 : 0) + (replyTo ? 56 : 0);

  return (
    <View style={[styles.container, { paddingBottom: Math.max(bottomInset, 8) }]}>
      {/* Reply Preview */}
      {replyTo && onCancelReply && (
        <ReplyPreview replyTo={replyTo} onCancel={onCancelReply} />
      )}

      {/* Media Preview List */}
      {hasMedia && onRemoveMedia && (
        <MediaPreviewList 
          items={mediaItems} 
          onRemove={onRemoveMedia}
          onClearAll={onClearAllMedia}
        />
      )}

      {/* Recording Indicator */}
      {isRecording && (
        <View style={styles.recordingIndicator}>
          <View style={styles.recordingDot} />
          <ThemedText style={styles.recordingDuration}>
            {formatDuration(recordingDuration)}
          </ThemedText>
          {isRecordingLocked ? (
            <Pressable style={styles.sendRecordingButton} onPress={handleRecordEnd}>
              <Ionicons name="send" size={18} color="#fff" />
            </Pressable>
          ) : (
            <ThemedText style={styles.recordingHint}>
              ← Отмена | ↑ Заблокировать
            </ThemedText>
          )}
          {isRecordingLocked && (
            <Pressable style={styles.cancelRecordingButton} onPress={handleRecordCancel}>
              <Feather name="trash-2" size={18} color={THEME.error} />
            </Pressable>
          )}
        </View>
      )}

      {/* Main Input Row */}
      {!isRecording && (
        <View style={styles.inputRow}>
          {/* Attach Button */}
          <InputButton
            icon="paperclip"
            onPress={onAttachPress}
            disabled={disabled}
          />

          {/* Input Container */}
          <View style={[
            styles.inputContainer,
            { minHeight: inputHeight },
          ]}>
            <TextInput
              ref={inputRef}
              style={[styles.textInput, { height: inputHeight - 16 }]}
              value={value}
              onChangeText={onChangeText}
              onContentSizeChange={handleContentSizeChange}
              onSelectionChange={(e: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => {
                onSelectionChange?.(e.nativeEvent.selection);
              }}
              selection={selection}
              placeholder={hasMedia ? "Добавить подпись..." : placeholder}
              placeholderTextColor={THEME.textSecondary}
              multiline
              maxLength={4096}
              editable={!disabled}
            />
          </View>

          {/* Emoji Button */}
          <InputButton
            icon="smile"
            onPress={onEmojiPress}
            disabled={disabled}
          />

          {/* Send / Record Button */}
          <View style={styles.actionButtonContainer}>
            {/* Send Button */}
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
              <Pressable style={styles.sendButtonInner} onPress={handleSend}>
                <Ionicons name="send" size={18} color="#fff" />
              </Pressable>
            </Animated.View>

            {/* Record Button */}
            <Animated.View
              style={[
                styles.recordButtonWrapper,
                {
                  opacity: micButtonAnim,
                  transform: [{ scale: micScale }],
                },
              ]}
              pointerEvents={!canSend ? 'auto' : 'none'}
            >
              <RecordButton
                mode={recordMode}
                onModeToggle={handleModeToggle}
                onRecordStart={handleRecordStart}
                onRecordEnd={handleRecordEnd}
                onRecordCancel={handleRecordCancel}
                onRecordLock={handleRecordLock}
                isRecording={isRecording}
                isLocked={isRecordingLocked}
                disabled={disabled}
              />
            </Animated.View>
          </View>
        </View>
      )}

      {/* Video Circle Recorder Modal */}
      <VideoCircleRecorderV2
        visible={showVideoRecorder}
        onClose={() => setShowVideoRecorder(false)}
        onVideoRecorded={handleVideoRecorded}
      />
    </View>
  );
});

// ======================
// STYLES
// ======================
const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.background,
    borderTopWidth: 1,
    borderTopColor: THEME.border,
  },

  // Reply styles
  replyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: THEME.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  replyLine: {
    width: 2,
    height: 36,
    backgroundColor: THEME.accent,
    borderRadius: 1,
    marginRight: 10,
  },
  replyContent: {
    flex: 1,
  },
  replyName: {
    fontSize: 14,
    color: THEME.accent,
    fontWeight: '600',
    marginBottom: 2,
  },
  replyText: {
    fontSize: 14,
    color: THEME.textSecondary,
  },
  replyClose: {
    padding: 8,
    marginLeft: 8,
  },

  // Media preview styles
  mediaPreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: THEME.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  mediaPreviewScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 8,
  },
  mediaPreviewItem: {
    width: 72,
    height: 72,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: THEME.surface,
  },
  mediaPreviewImage: {
    width: '100%',
    height: '100%',
  },
  mediaPreviewFile: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoDurationBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 4,
    padding: 2,
  },
  mediaDeleteBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  mediaDeleteBadgeInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearAllButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },

  // Input row styles
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  inputButton: {
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 21,
  },
  inputContainer: {
    flex: 1,
    backgroundColor: THEME.backgroundSecondary,
    borderRadius: 22,
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: THEME.border,
    justifyContent: 'center',
  },
  textInput: {
    color: THEME.text,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
    letterSpacing: -0.2,
    maxHeight: 120,
  },

  // Action button container
  actionButtonContainer: {
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
    backgroundColor: THEME.accent,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: THEME.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  recordButtonWrapper: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Record button styles
  recordButtonContainer: {
    position: 'relative',
  },
  recordButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  recordButtonActive: {
    backgroundColor: THEME.error,
  },
  videoIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: THEME.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoIconCircleActive: {
    backgroundColor: THEME.error,
    borderColor: THEME.error,
  },
  lockIndicator: {
    position: 'absolute',
    bottom: 60,
    alignItems: 'center',
    width: 100,
    left: -29,
  },
  cancelIndicator: {
    position: 'absolute',
    right: 60,
    alignItems: 'center',
    top: 10,
  },
  gestureHint: {
    fontSize: 10,
    color: THEME.textSecondary,
    marginTop: 4,
  },

  // Recording indicator styles
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: THEME.backgroundSecondary,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: THEME.error,
    marginRight: 10,
  },
  recordingDuration: {
    fontSize: 16,
    color: THEME.text,
    fontWeight: '600',
    marginRight: 16,
  },
  recordingHint: {
    fontSize: 12,
    color: THEME.textSecondary,
    flex: 1,
  },
  sendRecordingButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: THEME.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  cancelRecordingButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: THEME.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});

export default ChatInputV2;
