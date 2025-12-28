import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, Dimensions, Easing } from 'react-native';
import { ThemedText } from './ThemedText';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface AnimatedGiftProps {
  emoji: string;
  show: boolean;
  onComplete:  () => void;
  senderName?: string;
  giftName?: string;
}

export function AnimatedGift({ emoji, show, onComplete, senderName, giftName }: AnimatedGiftProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(100)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;
  const textFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (show) {
      // Reset animations
      fadeAnim.setValue(0);
      scaleAnim.setValue(0);
      translateY.setValue(100);
      rotateAnim.setValue(0);
      glowAnim.setValue(0);
      sparkleAnim.setValue(0);
      textFade.setValue(0);

      Animated.sequence([
        // 1. Initial appearance with bounce
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.spring(scaleAnim, { 
            toValue: 1, 
            friction: 3, 
            tension: 40,
            useNativeDriver: true 
          }),
          Animated.timing(translateY, { toValue: 0, duration: 500, useNativeDriver: true, easing: Easing.out(Easing.back(1.5)) })
        ]),
        // 2. Sparkle and glow effect
        Animated.parallel([
          Animated.loop(
            Animated.sequence([
              Animated.timing(glowAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
              Animated.timing(glowAnim, { toValue: 0.5, duration: 500, useNativeDriver: true }),
            ]),
            { iterations: 3 }
          ),
          Animated.loop(
            Animated.timing(rotateAnim, { toValue: 1, duration: 2000, useNativeDriver: true, easing: Easing.linear }),
            { iterations: 1 }
          ),
          // Show sender name with delay
          Animated.sequence([
            Animated.delay(300),
            Animated.timing(textFade, { toValue: 1, duration: 400, useNativeDriver: true }),
          ]),
        ]),
        Animated.delay(1500),
        // 3. Exit
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: -150, duration: 400, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 0.5, duration: 400, useNativeDriver: true }),
        ])
      ]).start(onComplete);
    }
  }, [show]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (!show) return null;

  return (
    <View style={styles.container}>
      {/* Background overlay */}
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]} />
      
      <Animated.View style={[
        styles.giftContainer,
        {
          opacity: fadeAnim,
          transform: [
            { scale: scaleAnim },
            { translateY }
          ]
        }
      ]}>
        {/* Rotating glow ring */}
        <Animated.View style={[
          styles.glowRing,
          {
            opacity: glowAnim,
            transform: [{ rotate }]
          }
        ]}>
          <LinearGradient
            colors={['#FFD700', '#FF6B6B', '#4ECDC4', '#9B59B6', '#FFD700']}
            style={styles.glowGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>
        
        {/* Gift emoji */}
        <View style={styles.emojiWrapper}>
          <ThemedText style={styles.giftEmoji}>{emoji}</ThemedText>
        </View>

        {/* Sender info */}
        {senderName && (
          <Animated.View style={[styles.senderInfo, { opacity: textFade }]}>
            <ThemedText style={styles.fromText}>От</ThemedText>
            <ThemedText style={styles.senderName}>{senderName}</ThemedText>
            {giftName && <ThemedText style={styles.giftName}>{giftName}</ThemedText>}
          </Animated.View>
        )}
      </Animated.View>
      
      {/* Sparkles */}
      {[...Array(8)].map((_, i) => (
        <Sparkle 
          key={i} 
          show={show} 
          delay={i * 100} 
          angle={(i * 45)} 
          fadeAnim={fadeAnim}
        />
      ))}
    </View>
  );
}

// Sparkle component for visual effect
const Sparkle = ({ show, delay, angle, fadeAnim }: { show: boolean; delay: number; angle: number; fadeAnim: Animated.Value }) => {
  const sparklePos = useRef(new Animated.Value(0)).current;
  const sparkleOpacity = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    if (show) {
      sparklePos.setValue(0);
      sparkleOpacity.setValue(0);
      
      Animated.sequence([
        Animated.delay(delay + 300),
        Animated.parallel([
          Animated.timing(sparklePos, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.sequence([
            Animated.timing(sparkleOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
            Animated.delay(400),
            Animated.timing(sparkleOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
          ])
        ])
      ]).start();
    }
  }, [show]);
  
  const rad = (angle * Math.PI) / 180;
  const distance = sparklePos.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 150],
  });
  
  return (
    <Animated.View 
      style={[
        styles.sparkle,
        {
          opacity: Animated.multiply(sparkleOpacity, fadeAnim),
          transform: [
            { translateX: Animated.multiply(distance, Math.cos(rad)) },
            { translateY: Animated.multiply(distance, Math.sin(rad)) },
          ]
        }
      ]}
    >
      <ThemedText style={styles.sparkleText}>✨</ThemedText>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right:  0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
    zIndex: 1000,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  giftContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    overflow: 'hidden',
  },
  glowGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
  },
  emojiWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  giftEmoji: {
    fontSize: 60,
  },
  senderInfo: {
    marginTop: 20,
    alignItems: 'center',
  },
  fromText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  senderName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 4,
  },
  giftName: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  sparkle: {
    position: 'absolute',
  },
  sparkleText: {
    fontSize: 24,
  },
});