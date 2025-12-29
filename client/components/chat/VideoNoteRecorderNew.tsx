/**
 * VIDEO NOTE RECORDER - Запись круглых видеосообщений как в Telegram
 * С настоящим круговым прогресс-кольцом и пульсацией
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  Dimensions,
  PanResponder,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
  runOnJS,
  cancelAnimation,
} from 'react-native-reanimated';
import Svg, { Circle, G } from 'react-native-svg';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ThemedText } from '@/components/ThemedText';
import { LinearGradient } from 'expo-linear-gradient';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CIRCLE_SIZE = Math.min(SCREEN_WIDTH * 0.65, 260);
const CIRCLE_SIZE_RECORDING = CIRCLE_SIZE + 30; // Увеличенный размер при записи
const RING_STROKE_WIDTH = 5;
const RING_RADIUS = (CIRCLE_SIZE_RECORDING / 2) + RING_STROKE_WIDTH + 8;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const MAX_DURATION = 60; // 60 секунд максимум
const SWIPE_CANCEL_THRESHOLD = 100; // Порог свайпа для отмены

// Визуальные состояния
type RecordingState = 'idle' | 'recording' | 'cancelled';

interface VideoNoteRecorderProps {
  visible: boolean;
  onClose: () => void;
  onVideoRecorded: (uri: string) => void;
}

export default function VideoNoteRecorder({ 
  visible, 
  onClose, 
  onVideoRecorded 
}: VideoNoteRecorderProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [state, setState] = useState<RecordingState>('idle');
  const [recordingTime, setRecordingTime] = useState(0);
  const [facing, setFacing] = useState<'front' | 'back'>('front');
  const [cancelHintVisible, setCancelHintVisible] = useState(false);
  
  const cameraRef = useRef<CameraView>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  
  // Reanimated shared values
  const progress = useSharedValue(0);
  const scale = useSharedValue(1);
  const pulseScale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const cancelSwipeY = useSharedValue(0);
  const ringOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(1);
  
  const isRecording = state === 'recording';

  // Сброс при закрытии
  useEffect(() => {
    if (!visible) {
      setState('idle');
      setRecordingTime(0);
      progress.value = 0;
      scale.value = 1;
      pulseScale.value = 1;
      opacity.value = 1;
      cancelSwipeY.value = 0;
      ringOpacity.value = 0;
    }
  }, [visible]);

  // Пульсация при записи
  useEffect(() => {
    if (isRecording) {
      // Плавная пульсация 1.0 <-> 1.05
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1.0, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1, // Бесконечно
        true
      );
      
      // Показываем кольцо прогресса
      ringOpacity.value = withTiming(1, { duration: 300 });
      
      // Увеличиваем камеру
      scale.value = withSpring(CIRCLE_SIZE_RECORDING / CIRCLE_SIZE, {
        damping: 15,
        stiffness: 100,
      });
    } else {
      cancelAnimation(pulseScale);
      pulseScale.value = withTiming(1, { duration: 200 });
      ringOpacity.value = withTiming(0, { duration: 200 });
      scale.value = withSpring(1, { damping: 15, stiffness: 100 });
    }
  }, [isRecording]);

  // Таймер записи и прогресс
  useEffect(() => {
    if (isRecording) {
      startTimeRef.current = Date.now();
      
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setRecordingTime(elapsed);
        
        // Обновляем прогресс (0-1)
        const newProgress = Math.min(elapsed / MAX_DURATION, 1);
        progress.value = withTiming(newProgress, { 
          duration: 100,
          easing: Easing.linear 
        });
        
        if (elapsed >= MAX_DURATION) {
          stopRecording();
        }
      }, 100); // Более частое обновление для плавности
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  // PanResponder для свайпа вверх (отмена)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (isRecording && gestureState.dy < 0) {
          // Свайп вверх
          cancelSwipeY.value = gestureState.dy;
          const swipeProgress = Math.min(Math.abs(gestureState.dy) / SWIPE_CANCEL_THRESHOLD, 1);
          opacity.value = 1 - (swipeProgress * 0.5);
          
          if (Math.abs(gestureState.dy) > SWIPE_CANCEL_THRESHOLD * 0.5) {
            setCancelHintVisible(true);
          } else {
            setCancelHintVisible(false);
          }
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (Math.abs(gestureState.dy) > SWIPE_CANCEL_THRESHOLD) {
          // Отмена записи
          cancelRecording();
        } else {
          // Возврат к нормальному состоянию
          cancelSwipeY.value = withSpring(0);
          opacity.value = withTiming(1, { duration: 150 });
          setCancelHintVisible(false);
        }
      },
    })
  ).current;

  const startRecording = useCallback(async () => {
    if (!cameraRef.current || isRecording) return;
    
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setState('recording');
      
      // Анимация кнопки
      buttonScale.value = withSpring(0.9);
      
      const video = await cameraRef.current.recordAsync({
        maxDuration: MAX_DURATION,
      });
      
      if (video?.uri && state !== 'cancelled') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onVideoRecorded(video.uri);
        onClose();
      }
    } catch (error) {
      console.error('Recording error:', error);
      setState('idle');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [isRecording, state, onVideoRecorded, onClose]);

  const stopRecording = useCallback(async () => {
    if (!cameraRef.current || !isRecording) return;
    
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      buttonScale.value = withSpring(1);
      await cameraRef.current.stopRecording();
      setState('idle');
    } catch (error) {
      console.error('Stop recording error:', error);
      setState('idle');
    }
  }, [isRecording]);

  const cancelRecording = useCallback(async () => {
    setState('cancelled');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    
    if (cameraRef.current) {
      try {
        await cameraRef.current.stopRecording();
      } catch {}
    }
    
    // Анимация исчезновения
    opacity.value = withTiming(0, { duration: 200 }, () => {
      runOnJS(onClose)();
    });
    
    setCancelHintVisible(false);
  }, [onClose]);

  const toggleFacing = useCallback(() => {
    if (isRecording) return;
    setFacing(prev => prev === 'front' ? 'back' : 'front');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Animated styles
  const cameraContainerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value * pulseScale.value },
      { translateY: cancelSwipeY.value },
    ],
    opacity: opacity.value,
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
  }));

  // Анимированные пропсы для SVG круга прогресса
  const animatedCircleProps = useAnimatedProps(() => {
    // strokeDashoffset уменьшается от RING_CIRCUMFERENCE до 0 по мере прогресса
    const strokeDashoffset = RING_CIRCUMFERENCE * (1 - progress.value);
    return {
      strokeDashoffset,
    };
  });

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  // Запрос разрешений
  if (!permission?.granted) {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.container}>
          <View style={styles.permissionBox}>
            <Feather name="camera-off" size={48} color="#FF6B6B" />
            <ThemedText style={styles.permissionText}>
              Нужен доступ к камере
            </ThemedText>
            <Pressable style={styles.permissionButton} onPress={requestPermission}>
              <ThemedText style={styles.permissionButtonText}>Разрешить</ThemedText>
            </Pressable>
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
      <View style={styles.container}>
        <Pressable style={styles.backdrop} onPress={() => !isRecording && onClose()} />
        
        <Animated.View style={[styles.content, { opacity }]}>
          {/* Заголовок */}
          <View style={styles.header}>
            <Pressable onPress={() => isRecording ? cancelRecording() : onClose()} style={styles.headerButton}>
              <Feather name="x" size={24} color="#fff" />
            </Pressable>
            <ThemedText style={styles.headerTitle}>
              {isRecording ? formatTime(recordingTime) : 'Видеосообщение'}
            </ThemedText>
            <Pressable 
              onPress={toggleFacing} 
              style={[styles.headerButton, isRecording && { opacity: 0.3 }]}
              disabled={isRecording}
            >
              <Feather name="refresh-cw" size={20} color="#fff" />
            </Pressable>
          </View>

          {/* Подсказка отмены */}
          {cancelHintVisible && (
            <View style={styles.cancelHint}>
              <Feather name="x-circle" size={20} color="#FF4757" />
              <ThemedText style={styles.cancelHintText}>Отпустите для отмены</ThemedText>
            </View>
          )}

          {/* Камера с круговым прогресс-кольцом */}
          <View style={styles.cameraWrapper} {...panResponder.panHandlers}>
            {/* SVG кольцо прогресса */}
            <Animated.View style={[styles.progressRingContainer, ringStyle]}>
              <Svg width={RING_RADIUS * 2 + 20} height={RING_RADIUS * 2 + 20}>
                <G rotation="-90" origin={`${RING_RADIUS + 10}, ${RING_RADIUS + 10}`}>
                  {/* Фоновое кольцо */}
                  <Circle
                    cx={RING_RADIUS + 10}
                    cy={RING_RADIUS + 10}
                    r={RING_RADIUS}
                    stroke="rgba(51, 144, 236, 0.2)"
                    strokeWidth={RING_STROKE_WIDTH}
                    fill="transparent"
                  />
                  {/* Прогресс кольцо */}
                  <AnimatedCircle
                    cx={RING_RADIUS + 10}
                    cy={RING_RADIUS + 10}
                    r={RING_RADIUS}
                    stroke="#3390EC"
                    strokeWidth={RING_STROKE_WIDTH}
                    fill="transparent"
                    strokeDasharray={RING_CIRCUMFERENCE}
                    strokeLinecap="round"
                    animatedProps={animatedCircleProps}
                  />
                </G>
              </Svg>
            </Animated.View>

            {/* Камера в круге */}
            <Animated.View style={[styles.cameraCircleOuter, cameraContainerStyle]}>
              <View style={[
                styles.cameraCircle, 
                isRecording && styles.cameraCircleRecording
              ]}>
                <CameraView
                  ref={cameraRef}
                  style={styles.camera}
                  facing={facing}
                  mode="video"
                />
              </View>
            </Animated.View>
            
            {/* Красная точка записи */}
            {isRecording && (
              <View style={styles.recordingIndicator}>
                <Animated.View style={[styles.recordingDot, { 
                  opacity: useAnimatedStyle(() => ({
                    opacity: interpolate(
                      Math.sin(Date.now() / 500),
                      [-1, 1],
                      [0.5, 1]
                    )
                  })).opacity 
                }]} />
              </View>
            )}
          </View>

          {/* Таймер и подсказка */}
          <View style={styles.timerContainer}>
            {isRecording ? (
              <>
                <View style={styles.timerBadge}>
                  <View style={styles.timerDot} />
                  <ThemedText style={styles.timerText}>{formatTime(recordingTime)}</ThemedText>
                </View>
                <ThemedText style={styles.hint}>↑ Свайп вверх для отмены</ThemedText>
              </>
            ) : (
              <ThemedText style={styles.hint}>Удерживайте для записи</ThemedText>
            )}
          </View>

          {/* Кнопка записи */}
          <View style={styles.controls}>
            <Animated.View style={buttonAnimatedStyle}>
              <Pressable
                onPressIn={startRecording}
                onPressOut={isRecording ? stopRecording : undefined}
                style={styles.recordButton}
              >
                <LinearGradient
                  colors={isRecording ? ['#FF4757', '#FF6B6B'] : ['#3390EC', '#5AABEE']}
                  style={styles.recordButtonGradient}
                >
                  {isRecording ? (
                    <View style={styles.stopIcon} />
                  ) : (
                    <Feather name="video" size={32} color="#fff" />
                  )}
                </LinearGradient>
              </Pressable>
            </Animated.View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    alignItems: 'center',
    paddingVertical: 20,
    width: '100%',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },

  // Cancel hint
  cancelHint: {
    position: 'absolute',
    top: 80,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 71, 87, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
    zIndex: 100,
  },
  cancelHintText: {
    color: '#FF4757',
    fontSize: 14,
    fontWeight: '600',
  },

  // Camera wrapper
  cameraWrapper: {
    width: RING_RADIUS * 2 + 40,
    height: RING_RADIUS * 2 + 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  
  // SVG Progress ring container
  progressRingContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Camera circle
  cameraCircleOuter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraCircle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    overflow: 'hidden',
    backgroundColor: '#000',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cameraCircleRecording: {
    borderColor: '#3390EC',
    borderWidth: 4,
  },
  camera: {
    flex: 1,
  },

  // Recording indicator
  recordingIndicator: {
    position: 'absolute',
    top: 15,
    right: 15,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF3B30',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },

  // Timer
  timerContainer: {
    alignItems: 'center',
    marginBottom: 30,
    minHeight: 60,
    justifyContent: 'center',
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 10,
    marginBottom: 8,
  },
  timerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF3B30',
  },
  timerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  hint: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
  },

  // Record button
  controls: {
    alignItems: 'center',
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    shadowColor: '#3390EC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  recordButtonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#fff',
  },

  // Permission UI
  permissionBox: {
    backgroundColor: '#1C1C1E',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    gap: 16,
    marginHorizontal: 20,
  },
  permissionText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  permissionButton: {
    backgroundColor: '#3390EC',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  closeButtonText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
  },
});
