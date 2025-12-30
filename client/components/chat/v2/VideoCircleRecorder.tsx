/**
 * VIDEO CIRCLE RECORDER
 * Компонент записи видеокружков как в Telegram
 * 
 * Особенности:
 * - Круглое превью камеры
 * - Анимация записи
 * - Таймер
 * - Кнопка отмены/отправки
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Animated,
  Modal,
  Platform,
} from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/ThemedText';
import { 
  TelegramDarkColors as colors, 
} from '@/constants/telegramDarkTheme';

interface VideoCircleRecorderProps {
  visible: boolean;
  onClose: () => void;
  onVideoRecorded: (uri: string, duration: number) => void;
  maxDuration?: number;
}

export function VideoCircleRecorder({
  visible,
  onClose,
  onVideoRecorded,
  maxDuration = 60,
}: VideoCircleRecorderProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [facing, setFacing] = useState<'front' | 'back'>('front');
  
  const cameraRef = useRef<CameraView>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      const audioStatus = await Camera.requestMicrophonePermissionsAsync();
      setHasPermission(status === 'granted' && audioStatus.status === 'granted');
    })();
  }, []);

  useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 200,
        friction: 15,
        useNativeDriver: true,
      }).start();
    } else {
      scaleAnim.setValue(0);
      setIsRecording(false);
      setDuration(0);
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

    timerRef.current = setInterval(() => {
      setDuration(prev => {
        if (prev >= maxDuration - 1) {
          stopRecording();
          return prev;
        }
        return prev + 1;
      });
    }, 1000);

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.timing(progressAnim, {
      toValue: 1,
      duration: maxDuration * 1000,
      useNativeDriver: false,
    }).start();

    try {
      const video = await cameraRef.current.recordAsync({
        maxDuration,
      });
      if (video?.uri) {
        onVideoRecorded(video.uri, duration);
      }
    } catch (error) {
      console.error('Recording error:', error);
    }
  }, [isRecording, maxDuration, duration, onVideoRecorded]);

  const stopRecording = useCallback(async () => {
    if (!cameraRef.current || !isRecording) return;

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setIsRecording(false);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
    progressAnim.stopAnimation();
    progressAnim.setValue(0);

    try {
      await cameraRef.current.stopRecording();
    } catch (error) {
      console.error('Stop recording error:', error);
    }
  }, [isRecording]);

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

  const progressRotation = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (hasPermission === false) {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.permissionContainer}>
            <ThemedText style={styles.permissionText}>
              Нужен доступ к камере и микрофону
            </ThemedText>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <ThemedText style={styles.closeButtonText}>Закрыть</ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <Animated.View 
          style={[
            styles.container,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          {/* Заголовок */}
          <View style={styles.header}>
            <Pressable style={styles.headerButton} onPress={onClose}>
              <Ionicons name="close" size={28} color="#fff" />
            </Pressable>
            <ThemedText style={styles.headerTitle}>
              Видеосообщение
            </ThemedText>
            <Pressable style={styles.headerButton} onPress={toggleFacing}>
              <Ionicons name="camera-reverse" size={24} color="#fff" />
            </Pressable>
          </View>

          {/* Круглое превью камеры */}
          <View style={styles.cameraContainer}>
            <Animated.View 
              style={[
                styles.cameraWrapper,
                { transform: [{ scale: isRecording ? pulseAnim : 1 }] },
              ]}
            >
              {/* Прогресс кольцо */}
              {isRecording && (
                <Animated.View 
                  style={[
                    styles.progressRing,
                    { transform: [{ rotate: progressRotation }] },
                  ]}
                />
              )}
              
              <View style={styles.cameraCircle}>
                {Platform.OS !== 'web' && hasPermission ? (
                  <CameraView
                    ref={cameraRef}
                    style={styles.camera}
                    facing={facing}
                    mode="video"
                  />
                ) : (
                  <View style={[styles.camera, styles.cameraPlaceholder]}>
                    <Ionicons name="videocam" size={48} color={colors.textTertiary} />
                    <ThemedText style={styles.placeholderText}>
                      Камера недоступна в веб-версии
                    </ThemedText>
                  </View>
                )}
              </View>
            </Animated.View>

            {/* Таймер */}
            {isRecording && (
              <View style={styles.timerContainer}>
                <View style={styles.recordingDot} />
                <ThemedText style={styles.timerText}>
                  {formatDuration(duration)}
                </ThemedText>
              </View>
            )}
          </View>

          {/* Кнопка записи */}
          <View style={styles.controls}>
            <Pressable
              style={[
                styles.recordButton,
                isRecording && styles.recordButtonActive,
              ]}
              onPress={isRecording ? stopRecording : startRecording}
            >
              <View style={[
                styles.recordButtonInner,
                isRecording && styles.recordButtonInnerActive,
              ]} />
            </Pressable>
            
            <ThemedText style={styles.hint}>
              {isRecording ? 'Нажмите для отправки' : 'Нажмите для записи'}
            </ThemedText>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const CIRCLE_SIZE = 240;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  cameraContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  cameraWrapper: {
    width: CIRCLE_SIZE + 8,
    height: CIRCLE_SIZE + 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressRing: {
    position: 'absolute',
    width: CIRCLE_SIZE + 8,
    height: CIRCLE_SIZE + 8,
    borderRadius: (CIRCLE_SIZE + 8) / 2,
    borderWidth: 4,
    borderColor: 'transparent',
    borderTopColor: '#5EB5F7',
    borderRightColor: '#5EB5F7',
  },
  cameraCircle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    overflow: 'hidden',
    backgroundColor: '#1A2430',
  },
  camera: {
    width: '100%',
    height: '100%',
  },
  cameraPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
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
  timerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  controls: {
    alignItems: 'center',
  },
  recordButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  recordButtonActive: {
    borderColor: '#FF4444',
  },
  recordButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF4444',
  },
  recordButtonInnerActive: {
    width: 24,
    height: 24,
    borderRadius: 4,
  },
  hint: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  permissionContainer: {
    backgroundColor: '#1A2430',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  closeButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default VideoCircleRecorder;
