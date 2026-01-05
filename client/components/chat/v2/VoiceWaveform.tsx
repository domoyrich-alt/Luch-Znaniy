/**
 * VOICE WAVEFORM
 * Компонент анимации волны при записи голосового сообщения
 */

import React, { useEffect, useRef, memo } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { 
  TelegramDarkColors as colors, 
} from '@/constants/telegramDarkTheme';

interface VoiceWaveformProps {
  isRecording: boolean;
  barCount?: number;
  barWidth?: number;
  barGap?: number;
  minHeight?: number;
  maxHeight?: number;
  color?: string;
}

export const VoiceWaveform = memo(function VoiceWaveform({
  isRecording,
  barCount = 5,
  barWidth = 3,
  barGap = 2,
  minHeight = 8,
  maxHeight = 24,
  color = colors.primary,
}: VoiceWaveformProps) {
  // Создаем анимации для каждого бара
  const barAnimations = useRef(
    Array.from({ length: barCount }, () => new Animated.Value(minHeight))
  ).current;

  useEffect(() => {
    if (isRecording) {
      // Запускаем анимацию для каждого бара с разной задержкой
      const animations = barAnimations.map((anim, index) => {
        const delay = index * 80; // Задержка для каждого бара
        const duration = 300 + Math.random() * 200; // Случайная длительность
        
        return Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: maxHeight * (0.5 + Math.random() * 0.5),
              duration,
              delay,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: false,
            }),
            Animated.timing(anim, {
              toValue: minHeight + Math.random() * (maxHeight - minHeight) * 0.3,
              duration: duration * 0.8,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: false,
            }),
          ])
        );
      });

      Animated.parallel(animations).start();
    } else {
      // Останавливаем и сбрасываем анимации
      barAnimations.forEach((anim) => {
        anim.stopAnimation();
        Animated.timing(anim, {
          toValue: minHeight,
          duration: 200,
          useNativeDriver: false,
        }).start();
      });
    }

    return () => {
      barAnimations.forEach((anim) => anim.stopAnimation());
    };
  }, [isRecording, barAnimations, minHeight, maxHeight]);

  const totalWidth = barCount * barWidth + (barCount - 1) * barGap;

  return (
    <View style={[styles.container, { width: totalWidth, height: maxHeight }]}>
      {barAnimations.map((anim, index) => (
        <Animated.View
          key={index}
          style={[
            styles.bar,
            {
              width: barWidth,
              height: anim,
              backgroundColor: color,
              marginLeft: index > 0 ? barGap : 0,
            },
          ]}
        />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bar: {
    borderRadius: 2,
  },
});

export default VoiceWaveform;
