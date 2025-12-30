/**
 * VOICE RECORDER - Как в Telegram (2025)
 * • Удерживай для записи
 * • Свайп влево → отмена (с анимацией)
 * • Отпусти в центре → отправка
 * • Красная точка + таймер
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Modal,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import * as Haptics from 'expo-haptics';

const CANCEL_THRESHOLD = -100; // px влево для отмены

interface VoiceRecorderProps {
  visible: boolean;
  onSend: (duration: number) => void;
  onCancel: () => void;
}

export function VoiceRecorder({ visible, onSend, onCancel }: VoiceRecorderProps) {
  const [duration, setDuration] = useState(0);
  const [isCancelHint, setIsCancelHint] = useState(false);
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (visible) {
      setDuration(0);
      setIsCancelHint(false);
      translateX.setValue(0);
      opacity.setValue(1);

      intervalRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [visible]);

  useEffect(() => {
    const sub = translateX.addListener(({ value }) => {
      setIsCancelHint(value < -50);
    });

    return () => {
      translateX.removeListener(sub);
    };
  }, [translateX]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(1, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = ({ nativeEvent }: any) => {
    if (nativeEvent.state === State.END) {
      if (nativeEvent.translationX < CANCEL_THRESHOLD) {
        // Отмена с анимацией
        Animated.parallel([
          Animated.timing(translateX, {
            toValue: -300,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          onCancel();
        });
      } else {
        // Возврат в центр и отправка
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start(() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          onSend(duration);
        });
      }
    }
  };

  if (!visible) return null;

  return (
    <Modal transparent animationType="fade">
      <View style={styles.overlay}>
        <PanGestureHandler
          onGestureEvent={onGestureEvent}
          onHandlerStateChange={onHandlerStateChange}
          minDist={10}
        >
          <Animated.View
            style={[
              styles.container,
              {
                transform: [{ translateX }],
                opacity,
              },
            ]}
          >
            {/* Стрелка отмены (появляется при свайпе) */}
            <Animated.View
              style={[
                styles.cancelArrow,
                {
                  opacity: translateX.interpolate({
                    inputRange: [-100, 0],
                    outputRange: [1, 0],
                    extrapolate: 'clamp',
                  }),
                },
              ]}
            >
              <Feather name="arrow-left" size={24} color="#FF3B30" />
              <ThemedText style={styles.cancelText}>Отмена</ThemedText>
            </Animated.View>

            {/* Основная панель записи */}
            <View style={styles.recordingPanel}>
              <View style={styles.recordingDot} />
              <ThemedText style={styles.duration}>{formatDuration(duration)}</ThemedText>

              <View style={styles.micIcon}>
                <Feather name="mic" size={28} color="#FFF" />
              </View>

              <ThemedText style={styles.hint}>
                {isCancelHint ? 'Отпустите для отмены' : '↑ Отпустите для отправки'}
              </ThemedText>
            </View>
          </Animated.View>
        </PanGestureHandler>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    marginHorizontal: 16,
    marginBottom: 32,
    borderRadius: 28,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  cancelArrow: {
    position: 'absolute',
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cancelText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
  recordingPanel: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF3B30',
  },
  duration: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    minWidth: 60,
  },
  micIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3390EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  hint: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    position: 'absolute',
    bottom: -30,
    left: 0,
    right: 0,
    textAlign: 'center',
  },
});