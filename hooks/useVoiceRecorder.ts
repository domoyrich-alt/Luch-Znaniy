import { useState, useRef } from 'react';

interface UseVoiceRecorderResult {
  isRecording: boolean;
  duration: number;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string | null>;
  cancelRecording: () => void;
}

export function useVoiceRecorder(): UseVoiceRecorderResult {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const durationInterval = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      // В реальном приложении здесь будет инициализация Audio Recording API
      // Например, expo-av или react-native-audio-recorder-player
      setIsRecording(true);
      setDuration(0);

      // Запуск таймера длительности
      durationInterval.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);

      console.log('Запись голосового сообщения начата');
    } catch (error) {
      console.error('Ошибка начала записи:', error);
      throw error;
    }
  };

  const stopRecording = async (): Promise<string | null> => {
    try {
      // Остановка записи
      setIsRecording(false);
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
        durationInterval.current = null;
      }

      // В реальном приложении здесь будет возвращен URI записанного файла
      console.log('Запись голосового сообщения остановлена');
      
      // Заглушка - возвращаем фиктивный URI
      return 'file://path/to/recording.m4a';
    } catch (error) {
      console.error('Ошибка остановки записи:', error);
      return null;
    }
  };

  const cancelRecording = () => {
    setIsRecording(false);
    setDuration(0);
    if (durationInterval.current) {
      clearInterval(durationInterval.current);
      durationInterval.current = null;
    }
    console.log('Запись голосового сообщения отменена');
  };

  return {
    isRecording,
    duration,
    startRecording,
    stopRecording,
    cancelRecording,
  };
}
