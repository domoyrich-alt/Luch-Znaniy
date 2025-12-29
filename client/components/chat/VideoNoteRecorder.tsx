/**
 * VIDEO NOTE RECORDER — Telegram December 2025 Style
 * Точная копия как на скриншоте:
 * • Круглое превью камеры по центру
 * • Внизу: переключение камеры, mute, таймер, Cancel, кнопка отправки
 * • Справа: счетчик (1x), пауза
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  Dimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ThemedText } from '@/components/ThemedText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CIRCLE_SIZE = Math.min(SCREEN_WIDTH * 0.75, 320);

interface VideoNoteRecorderProps {
  visible: boolean;
  onClose: () => void;
  onVideoRecorded: (uri: string) => void;
}

export default function VideoNoteRecorder({
  visible,
  onClose,
  onVideoRecorded,
}: VideoNoteRecorderProps) {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [facing, setFacing] = useState<'front' | 'back'>('front');

  const cameraRef = useRef<CameraView>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoUriRef = useRef<string | null>(null);

  // Автостарт записи при открытии
  useEffect(() => {
    if (visible && permission?.granted) {
      const timer = setTimeout(() => {
        startRecording();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [visible, permission?.granted]);

  // Cleanup при закрытии
  useEffect(() => {
    if (!visible) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setIsRecording(false);
      setRecordingTime(0);
    }
  }, [visible]);

  const startRecording = async () => {
    if (!cameraRef.current || isRecording) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsRecording(true);
    setRecordingTime(0);

    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => {
        if (prev >= 600) { // 60 секунд = 600 десятых
          sendVideo();
          return 600;
        }
        return prev + 1;
      });
    }, 100); // 100ms для показа сотых долей секунды

    try {
      const video = await cameraRef.current.recordAsync({ 
        maxDuration: 60,
      });
      if (video?.uri) {
        videoUriRef.current = video.uri;
      }
    } catch (error) {
      console.error('Video recording error:', error);
      setIsRecording(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const stopRecording = () => {
    if (!cameraRef.current) return;
    try {
      cameraRef.current.stopRecording();
    } catch {}
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
  };

  const sendVideo = () => {
    stopRecording();
    setTimeout(() => {
      if (videoUriRef.current) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onVideoRecorded(videoUriRef.current);
        videoUriRef.current = null;
      }
      onClose();
    }, 300);
  };

  const cancelRecording = () => {
    stopRecording();
    videoUriRef.current = null;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
  };

  const toggleFacing = () => {
    setFacing((prev) => (prev === 'front' ? 'back' : 'front'));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const formatTime = (centiseconds: number) => {
    const totalSeconds = Math.floor(centiseconds / 10);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    const cs = centiseconds % 10;
    return `${mins}:${secs.toString().padStart(2, '0')},${cs}0`;
  };

  if (!visible) return null;

  if (!permission?.granted) {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.permissionContainer}>
          <View style={styles.permissionBox}>
            <Feather name="camera-off" size={48} color="#FF453A" />
            <ThemedText style={styles.permissionTitle}>Доступ к камере</ThemedText>
            <ThemedText style={styles.permissionText}>
              Разрешите доступ к камере для записи видеосообщений
            </ThemedText>
            <Pressable style={styles.permissionButton} onPress={requestPermission}>
              <ThemedText style={styles.permissionButtonText}>Разрешить</ThemedText>
            </Pressable>
            <Pressable onPress={onClose}>
              <ThemedText style={styles.cancelTextPerm}>Отмена</ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={[styles.overlay, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        
        {/* Круглая камера по центру */}
        <View style={styles.cameraContainer}>
          <View style={styles.cameraCircle}>
            <CameraView
              ref={cameraRef}
              style={StyleSheet.absoluteFillObject}
              facing={facing}
              mode="video"
            />
            {/* Ручка сверху как в Telegram */}
            <View style={styles.cameraHandle} />
          </View>
        </View>

        {/* Правая панель: 1x и пауза */}
        <View style={styles.rightControls}>
          <Pressable style={styles.rightButton}>
            <ThemedText style={styles.zoomText}>1x</ThemedText>
          </Pressable>
          <Pressable style={styles.rightButton} onPress={togglePause}>
            <Feather name={isPaused ? "play" : "pause"} size={22} color="#fff" />
          </Pressable>
        </View>

        {/* Нижняя панель управления */}
        <View style={styles.bottomControls}>
          {/* Верхний ряд: переключение камеры, mute */}
          <View style={styles.topRow}>
            <Pressable style={styles.controlButton} onPress={toggleFacing}>
              <MaterialCommunityIcons name="camera-flip-outline" size={26} color="#fff" />
            </Pressable>
            <Pressable style={styles.controlButton} onPress={toggleMute}>
              <Feather name={isMuted ? "mic-off" : "mic"} size={24} color="#fff" />
            </Pressable>
          </View>

          {/* Нижний ряд: таймер, Cancel, Send */}
          <View style={styles.bottomRow}>
            {/* Таймер с красной точкой */}
            <View style={styles.timerContainer}>
              <View style={styles.recordingDot} />
              <ThemedText style={styles.timerText}>{formatTime(recordingTime)}</ThemedText>
            </View>

            {/* Cancel */}
            <Pressable onPress={cancelRecording}>
              <ThemedText style={styles.cancelButton}>Cancel</ThemedText>
            </Pressable>

            {/* Send button */}
            <Pressable style={styles.sendButton} onPress={sendVideo}>
              <Feather name="arrow-up" size={28} color="#fff" />
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#1C1C1E',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Камера
  cameraContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraCircle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  cameraHandle: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },

  // Правые кнопки
  rightControls: {
    position: 'absolute',
    right: 20,
    top: '50%',
    marginTop: 60,
    gap: 16,
  },
  rightButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(60, 60, 60, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  // Нижняя панель
  bottomControls: {
    width: '100%',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 16,
    marginBottom: 20,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(60, 60, 60, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF3B30',
  },
  timerText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  cancelButton: {
    color: '#3B9EFF',
    fontSize: 18,
    fontWeight: '500',
  },
  sendButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B9EFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Permission
  permissionContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  permissionBox: {
    backgroundColor: '#1C1C1E',
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    gap: 16,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
  },
  permissionText: {
    fontSize: 15,
    color: '#AAA',
    textAlign: 'center',
    lineHeight: 22,
  },
  permissionButton: {
    backgroundColor: '#3B9EFF',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
  },
  permissionButtonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '600',
  },
  cancelTextPerm: {
    color: '#AAA',
    fontSize: 16,
    marginTop: 8,
  },
});
