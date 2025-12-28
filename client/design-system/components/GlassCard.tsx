/**
 * DESIGN SYSTEM - GLASS CARD
 * Glassmorphism card with blur effect
 */

import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { BorderRadius, Spacing } from '../tokens/spacing';
import { SemanticColors } from '../tokens/colors';

interface GlassCardProps {
  children: ReactNode;
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
  style?: StyleProp<ViewStyle>;
  withGlow?: boolean;
}

export function GlassCard({ 
  children, 
  intensity = 20, 
  tint = 'dark',
  style,
  withGlow = false,
}: GlassCardProps) {
  return (
    <View style={[styles.container, style]}>
      <BlurView 
        intensity={intensity} 
        tint={tint}
        style={styles.blur}
      >
        <View style={styles.content}>
          {children}
        </View>
        
        {/* Border gradient */}
        <View style={styles.borderContainer}>
          <LinearGradient
            colors={['rgba(139, 92, 246, 0.3)', 'rgba(78, 205, 196, 0.3)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.border}
          />
        </View>
      </BlurView>
      
      {/* Optional glow effect */}
      {withGlow && (
        <View style={styles.glowContainer}>
          <LinearGradient
            colors={['rgba(139, 92, 246, 0.15)', 'transparent']}
            style={styles.glow}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius['2xl'],
    overflow: 'hidden',
  },
  blur: {
    borderRadius: BorderRadius['2xl'],
    overflow: 'hidden',
  },
  content: {
    padding: Spacing.xl,
    backgroundColor: SemanticColors.surface.glass,
  },
  borderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: BorderRadius['2xl'],
    padding: 1,
  },
  border: {
    flex: 1,
    borderRadius: BorderRadius['2xl'],
  },
  glowContainer: {
    position: 'absolute',
    top: -20,
    left: 0,
    right: 0,
    height: 60,
    zIndex: -1,
  },
  glow: {
    flex: 1,
  },
});
