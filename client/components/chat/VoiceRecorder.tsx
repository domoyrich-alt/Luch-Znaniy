import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Pressable, Animated, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';

interface VoiceRecorderProps {
  visible: boolean;
  onSend: (duration: number) => void;
  onCancel: () => void;
}

export function VoiceRecorder({ visible, onSend, onCancel }: VoiceRecorderProps) {
  const { theme } = useTheme();
  const [duration, setDuration] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (visible) {
      setIsRecording(true);
      setDuration(0);
      interval = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

      // Пульсирующая анимация
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      setIsRecording(false);
      pulseAnim.setValue(1);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [visible]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSend = () => {
    onSend(duration);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={[styles.recordingContainer, { backgroundColor: theme.backgroundDefault }]}>
          <Pressable onPress={onCancel} style={styles.cancelButton}>
            <Feather name="trash-2" size={24} color="#FF6B6B" />
          </Pressable>

          <View style={styles.recordingInfo}>
            <Animated.View style={[styles.recordingDot, { transform: [{ scale: pulseAnim }] }]} />
            <ThemedText style={styles.durationText}>{formatDuration(duration)}</ThemedText>
          </View>

          <Pressable
            onPress={handleSend}
            style={[styles.sendButton, { backgroundColor: theme.primary }]}
          >
            <Feather name="send" size={20} color="#fff" />
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    padding: Spacing.md,
  },
  recordingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  cancelButton: {
    padding: 8,
  },
  recordingInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recordingDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FF6B6B',
  },
  durationText: {
    fontSize: 24,
    fontWeight: '600',
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});