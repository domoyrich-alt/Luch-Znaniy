/**
 * VIDEO CIRCLE RECORDER V2
 * Telegram-style video circle recording with gestures
 * 
 * Features:
 * - Circular camera preview (masked circle)
 * - Swipe up to lock recording
 * - Swipe left to cancel
 * - Progress ring animation
 * - Front/back camera toggle
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Animated,
  Modal,
  Platform,
  PanResponder,
  Dimensions,
} from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Defs, Mask, Rect } from 'react-native-svg';

import { ThemedText } from '@/components/ThemedText';

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
  error: '#F7768E',
  success: '#9ECE6A',
};

const CIRCLE_SIZE = 200;
const PROGRESS_STROKE_WIDTH = 4;

interface VideoCircleRecorderV2Props {
  visible: boolean;
  onClose: () => void;
  onVideoRecorded: (uri: string, duration: number) => void;
  maxDuration?: number;
}

// Animated circle for progress
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function VideoCircleRecorderV2({
  visible,
  onClose,
  onVideoRecorded,
  maxDuration = 60,
}: VideoCircleRecorderV2Props) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [duration, setDuration] = useState(0);
  const [facing, setFacing] = useState<'front' | 'back'>('front');
  const [isCancelled, setIsCancelled] = useState(false);
  
  const cameraRef = useRef<CameraView>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const lockIndicatorAnim = useRef(new Animated.Value(0)).current;
  const cancelIndicatorAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;

  // Request permissions
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      const audioStatus = await Camera.requestMicrophonePermissionsAsync();
      setHasPermission(status === 'granted' && audioStatus.status === 'granted');
    })();
  }, []);

  // Open/close animation
  useEffect(() => {
    if (visible) {
      setIsCancelled(false);
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 200,
        friction: 15,
        useNativeDriver: true,
      }).start();
      
      // Auto-start recording
      setTimeout(() => {
        startRecording();
      }, 300);
    } else {
      scaleAnim.setValue(0);
      setIsRecording(false);
      setIsLocked(false);
      setDuration(0);
      setIsCancelled(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [visible]);

  const startRecording = useCallback(async () => {
    if (!cameraRef.current || isRecording) return;

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }

    setIsRecording(true);
    setDuration(0);

    // Start timer
    timerRef.current = setInterval(() => {
      setDuration(prev => {
        if (prev >= maxDuration - 1) {
          stopRecording(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1000);

    // Start progress animation
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: maxDuration * 1000,
      useNativeDriver: false,
    }).start();

    try {
      const video = await cameraRef.current.recordAsync({
        maxDuration,
      });
      
      if (video?.uri && !isCancelled) {
        onVideoRecorded(video.uri, duration);
      }
    } catch (error) {
      console.error('Recording error:', error);
    }
  }, [isRecording, maxDuration, isCancelled, onVideoRecorded, duration]);

  const stopRecording = useCallback(async (cancelled: boolean = false) => {
    if (!cameraRef.current || !isRecording) return;

    setIsCancelled(cancelled);
    setIsRecording(false);
    setIsLocked(false);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    progressAnim.stopAnimation();
    progressAnim.setValue(0);

    try {
      await cameraRef.current.stopRecording();
    } catch (error) {
      console.error('Stop recording error:', error);
    }

    if (cancelled) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      onClose();
    } else {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
  }, [isRecording, onClose]);

  const lockRecording = useCallback(() => {
    setIsLocked(true);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  }, []);

  const toggleFacing = useCallback(() => {
    setFacing(prev => prev === 'front' ? 'back' : 'front');
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Pan responder for gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isLocked,
      onMoveShouldSetPanResponder: () => !isLocked,

      onPanResponderMove: (_, gestureState) => {
        if (isLocked) return;
        
        const { dx, dy } = gestureState;

        // Swipe up to lock
        if (dy < -30) {
          translateY.setValue(Math.max(dy, -100));
          const progress = Math.min(Math.abs(dy) / 80, 1);
          lockIndicatorAnim.setValue(progress);
          cancelIndicatorAnim.setValue(0);
        }
        // Swipe left to cancel
        else if (dx < -30) {
          translateX.setValue(Math.max(dx, -120));
          const progress = Math.min(Math.abs(dx) / 100, 1);
          cancelIndicatorAnim.setValue(progress);
          lockIndicatorAnim.setValue(0);
        }
      },

      onPanResponderRelease: (_, gestureState) => {
        if (isLocked) return;
        
        const { dx, dy } = gestureState;

        Animated.parallel([
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
          Animated.timing(lockIndicatorAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
          Animated.timing(cancelIndicatorAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
        ]).start();

        // Lock threshold
        if (dy < -60) {
          lockRecording();
        }
        // Cancel threshold
        else if (dx < -80) {
          stopRecording(true);
        }
        // Normal release = stop recording
        else if (!isLocked) {
          stopRecording(false);
        }
      },

      onPanResponderTerminate: () => {
        Animated.parallel([
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
        ]).start();
      },
    })
  ).current;

  // Progress circle calculations
  const circumference = 2 * Math.PI * ((CIRCLE_SIZE / 2) + PROGRESS_STROKE_WIDTH);
  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  if (!visible) return null;

  if (hasPermission === false) {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.permissionContainer}>
            <Ionicons name="camera-outline" size={48} color={THEME.textSecondary} />
            <ThemedText style={styles.permissionText}>
              Нужен доступ к камере и микрофону
            </ThemedText>
            <Pressable style={styles.permissionButton} onPress={onClose}>
              <ThemedText style={styles.permissionButtonText}>Закрыть</ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        {/* Lock Indicator */}
        <Animated.View 
          style={[
            styles.lockIndicator,
            { opacity: lockIndicatorAnim },
          ]}
        >
          <View style={styles.lockIndicatorInner}>
            <Feather name="lock" size={24} color={THEME.accent} />
            <ThemedText style={styles.lockText}>Заблокировать</ThemedText>
          </View>
        </Animated.View>

        {/* Cancel Indicator */}
        <Animated.View 
          style={[
            styles.cancelIndicator,
            { opacity: cancelIndicatorAnim },
          ]}
        >
          <View style={styles.cancelIndicatorInner}>
            <Feather name="x" size={24} color={THEME.error} />
            <ThemedText style={styles.cancelText}>Отмена</ThemedText>
          </View>
        </Animated.View>

        {/* Main Container */}
        <Animated.View 
          style={[
            styles.container,
            {
              transform: [
                { scale: scaleAnim },
                { translateY },
                { translateX },
              ],
            },
          ]}
          {...(!isLocked ? panResponder.panHandlers : {})}
        >
          {/* Circular Camera Preview */}
          <View style={styles.cameraContainer}>
            {/* Progress Ring */}
            <Svg 
              width={CIRCLE_SIZE + PROGRESS_STROKE_WIDTH * 2} 
              height={CIRCLE_SIZE + PROGRESS_STROKE_WIDTH * 2}
              style={styles.progressRing}
            >
              {/* Background circle */}
              <Circle
                cx={(CIRCLE_SIZE / 2) + PROGRESS_STROKE_WIDTH}
                cy={(CIRCLE_SIZE / 2) + PROGRESS_STROKE_WIDTH}
                r={CIRCLE_SIZE / 2}
                stroke={THEME.surface}
                strokeWidth={PROGRESS_STROKE_WIDTH}
                fill="none"
              />
              {/* Progress circle */}
              <AnimatedCircle
                cx={(CIRCLE_SIZE / 2) + PROGRESS_STROKE_WIDTH}
                cy={(CIRCLE_SIZE / 2) + PROGRESS_STROKE_WIDTH}
                r={CIRCLE_SIZE / 2}
                stroke={THEME.error}
                strokeWidth={PROGRESS_STROKE_WIDTH}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                rotation="-90"
                origin={`${(CIRCLE_SIZE / 2) + PROGRESS_STROKE_WIDTH}, ${(CIRCLE_SIZE / 2) + PROGRESS_STROKE_WIDTH}`}
              />
            </Svg>

            {/* Camera View */}
            <View style={styles.cameraMask}>
              <CameraView
                ref={cameraRef}
                style={styles.camera}
                facing={facing}
                mode="video"
              />
            </View>

            {/* Duration */}
            <View style={styles.durationBadge}>
              <View style={styles.recordingDot} />
              <ThemedText style={styles.durationText}>
                {formatDuration(duration)}
              </ThemedText>
            </View>
          </View>

          {/* Controls */}
          <View style={styles.controls}>
            {/* Flip Camera */}
            <Pressable style={styles.controlButton} onPress={toggleFacing}>
              <Ionicons name="camera-reverse-outline" size={24} color={THEME.text} />
            </Pressable>

            {/* Stop/Send Button */}
            {isLocked ? (
              <View style={styles.lockedControls}>
                <Pressable 
                  style={styles.cancelButton} 
                  onPress={() => stopRecording(true)}
                >
                  <Feather name="trash-2" size={24} color={THEME.error} />
                </Pressable>
                <Pressable 
                  style={styles.sendButton} 
                  onPress={() => stopRecording(false)}
                >
                  <Ionicons name="send" size={24} color="#fff" />
                </Pressable>
              </View>
            ) : (
              <ThemedText style={styles.hint}>
                ↑ Заблокировать | ← Отмена
              </ThemedText>
            )}

            {/* Close Button */}
            <Pressable style={styles.controlButton} onPress={onClose}>
              <Feather name="x" size={24} color={THEME.text} />
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    alignItems: 'center',
  },
  
  // Lock indicator
  lockIndicator: {
    position: 'absolute',
    top: SCREEN_HEIGHT / 2 - 180,
    alignSelf: 'center',
  },
  lockIndicatorInner: {
    alignItems: 'center',
    backgroundColor: THEME.backgroundSecondary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
  },
  lockText: {
    fontSize: 12,
    color: THEME.accent,
    marginTop: 4,
  },

  // Cancel indicator
  cancelIndicator: {
    position: 'absolute',
    left: 40,
    top: SCREEN_HEIGHT / 2 - 30,
  },
  cancelIndicatorInner: {
    alignItems: 'center',
    backgroundColor: THEME.backgroundSecondary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
  },
  cancelText: {
    fontSize: 12,
    color: THEME.error,
    marginTop: 4,
  },

  // Camera container
  cameraContainer: {
    width: CIRCLE_SIZE + PROGRESS_STROKE_WIDTH * 2,
    height: CIRCLE_SIZE + PROGRESS_STROKE_WIDTH * 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressRing: {
    position: 'absolute',
  },
  cameraMask: {
    width: CIRCLE_SIZE - 4,
    height: CIRCLE_SIZE - 4,
    borderRadius: CIRCLE_SIZE / 2,
    overflow: 'hidden',
  },
  camera: {
    width: '100%',
    height: '100%',
  },
  durationBadge: {
    position: 'absolute',
    bottom: -30,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.error,
    marginRight: 8,
  },
  durationText: {
    fontSize: 14,
    color: THEME.text,
    fontWeight: '600',
  },

  // Controls
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 60,
    gap: 24,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: THEME.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockedControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  cancelButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: THEME.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: THEME.accent,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: THEME.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  hint: {
    fontSize: 12,
    color: THEME.textSecondary,
    textAlign: 'center',
    maxWidth: 150,
  },

  // Permission
  permissionContainer: {
    alignItems: 'center',
    backgroundColor: THEME.backgroundSecondary,
    padding: 32,
    borderRadius: 20,
    marginHorizontal: 40,
  },
  permissionText: {
    fontSize: 16,
    color: THEME.text,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: THEME.accent,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  permissionButtonText: {
    fontSize: 16,
    color: THEME.text,
    fontWeight: '600',
  },
});

export default VideoCircleRecorderV2;
