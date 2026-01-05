import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";

interface TelegramChatHeaderProps {
  title: string;
  status?: string;
  avatar: {
    backgroundColor: string;
    text: string;
  };
  onBackPress: () => void;
  onAvatarPress?: () => void;
}

export function TelegramChatHeader({
  title,
  status,
  avatar,
  onBackPress,
  onAvatarPress,
}: TelegramChatHeaderProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundSecondary }]}>
      <Pressable onPress={onBackPress} style={styles.backButton}>
        <Feather name="arrow-left" size={24} color={theme.text} />
      </Pressable>

      <View style={styles.centerContent}>
        <ThemedText style={styles.title} numberOfLines={1}>
          {title}
        </ThemedText>
        {status && (
          <ThemedText style={[styles.status, { color: theme.textSecondary }]} numberOfLines={1}>
            {status}
          </ThemedText>
        )}
      </View>

      <Pressable onPress={onAvatarPress} style={styles.avatarContainer}>
        <LinearGradient
          colors={[avatar.backgroundColor, avatar.backgroundColor + 'CC']}
          style={styles.avatar}
        >
          <ThemedText style={styles.avatarText}>{avatar.text}</ThemedText>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    height: 56,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
  },
  status: {
    fontSize: 13,
    lineHeight: 16,
    marginTop: 2,
  },
  avatarContainer: {
    marginLeft: 4,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
