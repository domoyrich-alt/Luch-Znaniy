/**
 * VIDEO CIRCLE MESSAGE
 * Отображение видеокружка в чате как в Telegram
 * 
 * Особенности:
 * - Круглое видео без рамок
 * - Кнопка воспроизведения
 * - Индикатор длительности
 * - Анимация воспроизведения
 */

import React, { useState, useRef, useCallback, memo } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Animated,
  Platform,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/ThemedText';
import { 
  TelegramDarkColors as colors, 
} from '@/constants/telegramDarkTheme';

interface VideoCircleMessageProps {
  uri: string;
  duration?: number;
  size?: number;
  isOwn?: boolean;
  onPress?: () => void;
}

export const VideoCircleMessage = memo(function VideoCircleMessage({
  uri,
  duration = 0,
  size = 200,
  isOwn = false,
  onPress,
}: VideoCircleMessageProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const videoRef = useRef<Video>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    
    setIsLoaded(true);
    setIsPlaying(status.isPlaying);
    
    if (status.positionMillis !== undefined) {
      setCurrentTime(status.positionMillis / 1000);
    }
    
    if (status.durationMillis) {
      const progress = status.positionMillis / status.durationMillis;
      progressAnim.setValue(progress);
    }
    
    if (status.didJustFinish) {
      setIsPlaying(false);
      progressAnim.setValue(0);
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, []);

  const togglePlayback = useCallback(async () => {
    if (!videoRef.current) return;

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (isPlaying) {
      await videoRef.current.pauseAsync();
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    } else {
      await videoRef.current.playAsync();
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isPlaying]);

  const progressRotation = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Pressable 
      style={[
        styles.container,
        isOwn && styles.containerOwn,
      ]} 
      onPress={onPress || togglePlayback}
    >
      <Animated.View 
        style={[
          styles.videoWrapper,
          { 
            width: size,
            height: size,
            borderRadius: size / 2,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        {/* Прогресс кольцо */}
        <Animated.View 
          style={[
            styles.progressRing,
            { 
              width: size + 4,
              height: size + 4,
              borderRadius: (size + 4) / 2,
              transform: [{ rotate: progressRotation }],
              opacity: isPlaying ? 1 : 0,
            },
          ]}
        />
        
        {/* Видео */}
        <View 
          style={[
            styles.videoCircle,
            { width: size, height: size, borderRadius: size / 2 },
          ]}
        >
          <Video
            ref={videoRef}
            source={{ uri }}
            style={styles.video}
            resizeMode={ResizeMode.COVER}
            isLooping={false}
            onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
            isMuted={false}
          />
          
          {/* Оверлей с кнопкой воспроизведения */}
          {!isPlaying && (
            <View style={styles.overlay}>
              <View style={styles.playButton}>
                <Ionicons name="play" size={size * 0.2} color="#fff" />
              </View>
            </View>
          )}
        </View>
        
        {/* Длительность */}
        <View style={styles.durationBadge}>
          <ThemedText style={styles.durationText}>
            {isPlaying ? formatDuration(currentTime) : formatDuration(duration)}
          </ThemedText>
        </View>
      </Animated.View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    marginVertical: 4,
  },
  containerOwn: {
    alignSelf: 'flex-end',
  },
  videoWrapper: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressRing: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: 'transparent',
    borderTopColor: '#5EB5F7',
    borderRightColor: '#5EB5F7',
  },
  videoCircle: {
    overflow: 'hidden',
    backgroundColor: '#1A2430',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 4,
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  durationText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
});

export default VideoCircleMessage;
