import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { Card } from '@/components/Card';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { SettingsItem } from '@/components/settings/SettingsItem';
import { useSettings } from '@/hooks/useSettings';
import { Spacing } from '@/constants/theme';

export default function PrivacySettingsScreen() {
  const { settings, updateSettings } = useSettings();

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <SettingsSection title="Видимость профиля">
          <Card style={styles.card}>
            <SettingsItem
              icon="users"
              label="Кто видит мой профиль"
              value={settings.profileVisibility === 'all' ? 'Все' : settings.profileVisibility === 'class' ? 'Только класс' : 'Никто'}
              onPress={() => {}}
            />
            <SettingsItem
              icon="award"
              label="Кто видит мои оценки"
              value={settings.gradesVisibility === 'all' ? 'Все' : settings.gradesVisibility === 'self' ? 'Только я' : 'Родители'}
              onPress={() => {}}
            />
          </Card>
        </SettingsSection>

        <SettingsSection title="Статус онлайн">
          <Card style={styles.card}>
            <SettingsItem
              icon="circle"
              label="Показывать статус онлайн"
              type="switch"
              value={settings.showOnlineStatus}
              onValueChange={(value) => updateSettings({ showOnlineStatus: value })}
            />
            <SettingsItem
              icon="clock"
              label='Показывать "был(а) в сети"'
              type="switch"
              value={settings.showLastSeen}
              onValueChange={(value) => updateSettings({ showLastSeen: value })}
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
