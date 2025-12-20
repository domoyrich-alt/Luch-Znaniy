import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { Card } from '@/components/Card';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { SettingsItem } from '@/components/settings/SettingsItem';
import { useSettings } from '@/hooks/useSettings';
import { Spacing } from '@/constants/theme';

export default function NotificationSettingsScreen() {
  const { settings, updateSettings } = useSettings();

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <SettingsSection title="Основные">
          <Card style={styles.card}>
            <SettingsItem
              icon="bell"
              label="Push-уведомления"
              type="switch"
              value={settings.pushEnabled}
              onValueChange={(value) => updateSettings({ pushEnabled: value })}
            />
            <SettingsItem
              icon="volume-2"
              label="Звуки сообщений"
              type="switch"
              value={settings.soundEnabled}
              onValueChange={(value) => updateSettings({ soundEnabled: value })}
            />
            <SettingsItem
              icon="smartphone"
              label="Вибрация"
              type="switch"
              value={settings.vibrationEnabled}
              onValueChange={(value) => updateSettings({ vibrationEnabled: value })}
            />
          </Card>
        </SettingsSection>

        <SettingsSection title="Образование">
          <Card style={styles.card}>
            <SettingsItem
              icon="award"
              label="Уведомления о новых оценках"
              type="switch"
              value={settings.gradeNotifications}
              onValueChange={(value) => updateSettings({ gradeNotifications: value })}
            />
            <SettingsItem
              icon="book"
              label="Уведомления о домашних заданиях"
              type="switch"
              value={settings.homeworkNotifications}
              onValueChange={(value) => updateSettings({ homeworkNotifications: value })}
            />
            <SettingsItem
              icon="calendar"
              label="Напоминания о событиях"
              type="switch"
              value={settings.eventReminders}
              onValueChange={(value) => updateSettings({ eventReminders: value })}
            />
          </Card>
        </SettingsSection>

        <SettingsSection title="Email">
          <Card style={styles.card}>
            <SettingsItem
              icon="mail"
              label="Email-уведомления"
              type="switch"
              value={settings.emailNotifications}
              onValueChange={(value) => updateSettings({ emailNotifications: value })}
            />
          </Card>
        </SettingsSection>
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
  card: {
    padding: 0,
    overflow: 'hidden',
  },
});
