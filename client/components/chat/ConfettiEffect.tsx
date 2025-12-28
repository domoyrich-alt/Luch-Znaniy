import React, { useEffect, useRef, memo } from 'react';
import { View, StyleSheet, Animated, Dimensions, Easing } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ConfettiProps {
  active: boolean;
  count?: number;
  duration?: number;
  onComplete?: () => void;
}

interface Particle {
  startX: number;
  x: Animated.Value;
  y: Animated.Value;
  rotation: Animated.Value;
  scale: Animated.Value;
  color: string;
  emoji: string;
}

const COLORS = ['#8B5CF6', '#4ECDC4', '#FF6B9D', '#FFD93D', '#6BCB77', '#FF6B6B'];
const EMOJIS = ['🎉', '✨', '⭐', '🌟', '💫', '🎊', '🥳', '💖', '🎁', '🎈'];

const ConfettiEffect = memo(function ConfettiEffect({
  active,
  count = 50,
  duration = 2500,
  onComplete,
}: ConfettiProps) {
  const particles = useRef<Particle[]>([]);
  const isAnimating = useRef(false);
  
  useEffect(() => {
    if (active && !isAnimating.current) {
      isAnimating.current = true;
      
      // Create particles
      particles.current = Array.from({ length: count }, () => {
        const startX = Math.random() * SCREEN_WIDTH;
        return {
        startX,
        x: new Animated.Value(startX),
        y: new Animated.Value(-50),
        rotation: new Animated.Value(0),
        scale: new Animated.Value(0.5 + Math.random() * 0.5),
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
        };
      });
      
      // Animate each particle
      const animations = particles.current.map((particle, index) => {
        const delay = Math.random() * 500;
        const endX = particle.startX + (Math.random() - 0.5) * 200;
        
        return Animated.parallel([
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(particle.y, {
              toValue: SCREEN_HEIGHT + 50,
              duration: duration + Math.random() * 1000,
              easing: Easing.quad,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(particle.x, {
              toValue: endX,
              duration: duration + Math.random() * 1000,
              easing: Easing.linear,
              useNativeDriver: true,
            }),
          ]),
          Animated.loop(
            Animated.timing(particle.rotation, {
              toValue: 360,
              duration: 1000 + Math.random() * 1000,
              easing: Easing.linear,
              useNativeDriver: true,
            })
          ),
        ]);
      });
      
      Animated.parallel(animations).start(() => {
        isAnimating.current = false;
        onComplete?.();
      });
    }
  }, [active, count, duration, onComplete]);
  
  if (!active) return null;
  
  return (
    <View style={styles.container} pointerEvents="none">
      {particles.current.map((particle, index) => (
        <Animated.Text
          key={index}
          style={[
            styles.particle,
            {
              transform: [
                { translateX: particle.x },
                { translateY: particle.y },
                {
                  rotate: particle.rotation.interpolate({
                    inputRange: [0, 360],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
                { scale: particle.scale },
              ],
            },
          ]}
        >
          {particle.emoji}
        </Animated.Text>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  particle: {
    position: 'absolute',
    fontSize: 24,
  },
});

export default ConfettiEffect;
