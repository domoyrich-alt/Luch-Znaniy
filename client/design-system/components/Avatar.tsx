/**
 * DESIGN SYSTEM - AVATAR
 * Avatar component with gradient border and online status
 */

import React from 'react';
import { View, Text, StyleSheet, Image, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Spacing } from '../tokens/spacing';
import { Typography } from '../tokens/typography';
import { Gradients } from '../tokens/colors';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  size?: AvatarSize;
  source?: { uri?: string };
  fallback?: string;
  gradientColors?: string[];
  showOnline?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Avatar({ 
  size = 'md',
  source,
  fallback = '👤',
  gradientColors = Gradients.primary,
  showOnline = false,
  style,
}: AvatarProps) {
  const sizeMap = {
    sm: Spacing.avatarSm,
    md: Spacing.avatarMd,
    lg: Spacing.avatarLg,
    xl: Spacing.avatarXl,
  };

  const avatarSize = sizeMap[size];
  const borderWidth = size === 'sm' ? 2 : size === 'md' ? 3 : 4;
  const onlineIndicatorSize = Math.round(avatarSize * 0.25);

  // Get initials from fallback if it's text
  const getInitials = (text: string) => {
    if (text.length <= 2) return text;
    const words = text.split(' ');
    if (words.length >= 2) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    }
    return text.substring(0, 2).toUpperCase();
  };

  const isEmoji = /\p{Emoji}/u.test(fallback);
  const initials = isEmoji ? fallback : getInitials(fallback);

  return (
    <View style={[{ width: avatarSize, height: avatarSize }, style]}>
      {/* Gradient border */}
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.gradientBorder,
          {
            width: avatarSize,
            height: avatarSize,
            borderRadius: avatarSize / 2,
          },
        ]}
      >
        {/* Inner container */}
        <View
          style={[
            styles.innerContainer,
            {
              width: avatarSize - borderWidth * 2,
              height: avatarSize - borderWidth * 2,
              borderRadius: (avatarSize - borderWidth * 2) / 2,
            },
          ]}
        >
          {source?.uri ? (
            <Image
              source={source}
              style={[
                styles.image,
                {
                  width: avatarSize - borderWidth * 2,
                  height: avatarSize - borderWidth * 2,
                  borderRadius: (avatarSize - borderWidth * 2) / 2,
                },
              ]}
            />
          ) : (
            <Text
              style={[
                styles.fallbackText,
                {
                  fontSize: isEmoji ? avatarSize * 0.5 : avatarSize * 0.35,
                },
              ]}
            >
              {initials}
            </Text>
          )}
        </View>
      </LinearGradient>

      {/* Online indicator */}
      {showOnline && (
        <View
          style={[
            styles.onlineIndicator,
            {
              width: onlineIndicatorSize,
              height: onlineIndicatorSize,
              borderRadius: onlineIndicatorSize / 2,
              bottom: 0,
              right: 0,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  gradientBorder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerContainer: {
    backgroundColor: '#1A1A2E',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    resizeMode: 'cover',
  },
  fallbackText: {
    ...Typography.body.large,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  onlineIndicator: {
    position: 'absolute',
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#0F0F0F',
  },
});
