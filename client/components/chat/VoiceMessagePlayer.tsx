import React, { useState, useEffect, useRef, memo } from 'react';
import { View, StyleSheet, Pressable, Animated, Easing } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { ThemedText } from '@/components/ThemedText';

interface VoiceMessagePlayerProps {
  duration: number; // в секундах
  waveform?: number[]; // массив значений 0-1 для отрисовки волны
  isOwn?: boolean;
  onPlay?: () => void;
  audioUri?: string;
}

const NEON = {
  primary: '#8B5CF6',
  secondary: '#4ECDC4',
  accent: '#FF6B9D',
  bgDark: '#0A0A0F',
  bgCard: '#141420',
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0B0',
};

// Генерируем случайную волну если не передана
const generateWaveform = (length: number = 40): number[] => {
  return Array.from({ length }, () => 0.2 + Math.random() * 0.8);
};

const VoiceMessagePlayer = memo(function VoiceMessagePlayer({
  duration,
  waveform,
  isOwn = false,
  onPlay,
  audioUri,
}: VoiceMessagePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  
  const animatedProgress = useRef(new Animated.Value(0)).current;
  
  const wave = waveform || generateWaveform();
  
  // Симуляция воспроизведения
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= duration) {
            setIsPlaying(false);
            setProgress(0);
            return 0;
          }
          const newTime = prev + 0.1;
          setProgress(newTime / duration);
          return newTime;
        });
      }, 100);
    }
    
    return () => clearInterval(interval);
  }, [isPlaying, duration]);
  
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsPlaying(!isPlaying);
    onPlay?.();
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const playedBars = Math.floor(progress * wave.length);
  
  return (
    <View style={[styles.container, isOwn ? styles.ownContainer : styles.otherContainer]}>
      {/* Play/Pause Button */}
      <Pressable onPress={handlePress} style={styles.playButton}>
        <View style={[styles.playButtonInner, { backgroundColor: isOwn ? 'rgba(255,255,255,0.2)' : NEON.secondary }]}>
          <Feather 
            name={isPlaying ? "pause" : "play"} 
            size={18} 
            color="#FFF" 
            style={isPlaying ? {} : { marginLeft: 2 }}
          />
        </View>
      </Pressable>
      
      {/* Waveform */}
      <View style={styles.waveformContainer}>
        <View style={styles.waveform}>
          {wave.map((height, index) => (
            <View
              key={index}
              style={[
                styles.waveBar,
                {
                  height: `${height * 100}%`,
                  backgroundColor: index < playedBars 
                    ? (isOwn ? '#fff' : NEON.secondary)
                    : (isOwn ? 'rgba(255,255,255,0.4)' : 'rgba(78,205,196,0.4)'),
                },
              ]}
            />
          ))}
        </View>
        
        {/* Time */}
        <View style={styles.timeContainer}>
          <ThemedText style={[styles.timeText, { color: isOwn ? 'rgba(255,255,255,0.8)' : NEON.textSecondary }]}>
            {formatTime(isPlaying ? currentTime : duration)}
          </ThemedText>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 18,
    minWidth: 200,
    maxWidth: 280,
  },
  ownContainer: {
    backgroundColor: 'transparent',
  },
  otherContainer: {
    backgroundColor: 'transparent',
  },
  playButton: {
    marginRight: 10,
  },
  playButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveformContainer: {
    flex: 1,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 28,
    gap: 2,
  },
  waveBar: {
    flex: 1,
    borderRadius: 1.5,
    minWidth: 2.5,
  },
  timeContainer: {
    marginTop: 4,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default VoiceMessagePlayer;
