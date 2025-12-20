import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius, Colors } from '@/constants/theme';

interface VoiceRecorderProps {
  onRecordComplete: (duration: number) => void;
  onCancel: () => void;
}

export function VoiceRecorder({ onRecordComplete, onCancel }: VoiceRecorderProps) {
  const { theme } = useTheme();
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);

  const startRecording = () => {
    setIsRecording(true);
    // В реальном приложении здесь будет запуск записи аудио
  };

  const stopRecording = () => {
    setIsRecording(false);
    onRecordComplete(duration);
  };

  const cancelRecording = () => {
    setIsRecording(false);
    onCancel();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundSecondary }]}>
      {!isRecording ? (
        <Pressable
          onPress={startRecording}
          style={[styles.recordButton, { backgroundColor: Colors.light.error }]}
        >
          <Feather name="mic" size={24} color="#FFFFFF" />
        </Pressable>
      ) : (
        <View style={styles.recordingContainer}>
          <View style={styles.waveAnimation}>
            <View style={[styles.pulse, { backgroundColor: Colors.light.error }]} />
          </View>
          <ThemedText type="body" style={{ color: Colors.light.error, fontWeight: '600' }}>
            Запись... {duration}s
          </ThemedText>
          <View style={styles.actions}>
            <Pressable onPress={cancelRecording} style={styles.actionButton}>
              <Feather name="x" size={24} color={theme.textSecondary} />
            </Pressable>
            <Pressable
              onPress={stopRecording}
              style={[styles.actionButton, { backgroundColor: Colors.light.success }]}
            >
              <Feather name="check" size={24} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  recordButton: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  recordingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  waveAnimation: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulse: {
    width: 12,
    height: 12,
    borderRadius: BorderRadius.full,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginLeft: 'auto',
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
