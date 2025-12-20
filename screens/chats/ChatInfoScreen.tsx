import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/Card';
import { SettingsItem } from '@/components/settings/SettingsItem';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';

type ChatInfoRouteParams = {
  ChatInfo: {
    chatId: number;
  };
};

export default function ChatInfoScreen() {
  const { theme } = useTheme();
  const route = useRoute<RouteProp<ChatInfoRouteParams, 'ChatInfo'>>();

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Информация о чате */}
        <View style={styles.chatHeader}>
          <View style={[styles.avatar, { backgroundColor: theme.primary + '15' }]}>
            <Feather name="users" size={48} color={theme.primary} />
          </View>
          <ThemedText type="h3" style={styles.chatName}>
            Название чата
          </ThemedText>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            5 участников
          </ThemedText>
        </View>

        {/* Участники */}
        <View style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Участники
          </ThemedText>
          <Card style={styles.card}>
            <SettingsItem icon="user" label="Участник 1" type="display" value="Онлайн" />
            <SettingsItem icon="user" label="Участник 2" type="display" value="был(а) 5 мин назад" />
          </Card>
        </View>

        {/* Настройки чата */}
        <View style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Настройки
          </ThemedText>
          <Card style={styles.card}>
            <SettingsItem icon="volume-x" label="Отключить уведомления" type="switch" value={false} />
            <SettingsItem icon="search" label="Поиск по сообщениям" onPress={() => {}} />
            <SettingsItem icon="image" label="Медиафайлы" onPress={() => {}} />
          </Card>
        </View>

        {/* Действия */}
        <View style={styles.section}>
          <Card style={styles.card}>
            <SettingsItem icon="trash-2" label="Очистить историю" onPress={() => {}} color="#E24A4A" />
            <SettingsItem icon="log-out" label="Выйти из чата" onPress={() => {}} color="#E24A4A" />
          </Card>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  chatHeader: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  chatName: {
    marginBottom: Spacing.xs,
  },
  section: {
    marginBottom: Spacing['2xl'],
  },
  sectionTitle: {
    marginBottom: Spacing.lg,
  },
  card: {
    padding: 0,
    overflow: 'hidden',
  },
});
