import React, { useRef, useCallback, memo } from 'react';
import { Pressable, Animated, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';

interface DoubleTapLikeProps {
  children: React.ReactNode;
  onDoubleTap: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
}

const DoubleTapLike = memo(function DoubleTapLike({
  children,
  onDoubleTap,
  onLongPress,
  disabled = false,
}: DoubleTapLikeProps) {
  const lastTap = useRef<number>(0);
  const heartScale = useRef(new Animated.Value(0)).current;
  const heartOpacity = useRef(new Animated.Value(0)).current;
  
  const showHeart = useCallback(() => {
    // Reset
    heartScale.setValue(0);
    heartOpacity.setValue(1);
    
    // Animate
    Animated.parallel([
      Animated.spring(heartScale, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(500),
        Animated.timing(heartOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [heartScale, heartOpacity]);
  
  const handlePress = useCallback(() => {
    if (disabled) return;
    
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    if (now - lastTap.current < DOUBLE_TAP_DELAY) {
      // Double tap detected!
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showHeart();
      onDoubleTap();
      lastTap.current = 0;
    } else {
      lastTap.current = now;
    }
  }, [disabled, onDoubleTap, showHeart]);
  
  return (
    <Pressable 
      onPress={handlePress}
      onLongPress={onLongPress}
      delayLongPress={500}
    >
      {children}
      
      {/* Heart Animation Overlay */}
      <Animated.View
        style={[
          styles.heartContainer,
          {
            opacity: heartOpacity,
            transform: [{ scale: heartScale }],
          },
        ]}
        pointerEvents="none"
      >
        <View style={styles.heart}>
          <Animated.Text style={styles.heartEmoji}>❤️</Animated.Text>
        </View>
      </Animated.View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  heartContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  heart: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 50,
    padding: 16,
  },
  heartEmoji: {
    fontSize: 48,
  },
});

export default DoubleTapLike;
