import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/Card';
import { SettingsItem } from '@/components/settings/SettingsItem';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';

export default function AboutScreen() {
  const { theme } = useTheme();

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.appIcon}>
          <View style={[styles.iconCircle, { backgroundColor: theme.primary }]}>
            <ThemedText type="h1" style={{ color: '#FFFFFF' }}>
              📚
            </ThemedText>
          </View>
        </View>

        <ThemedText type="h2" style={styles.appName}>
          Луч Знаний
        </ThemedText>

        <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: 'center' }}>
          Версия 1.0.0
        </ThemedText>

        <Card style={[styles.card, { marginTop: Spacing['2xl'] }]}>
          <SettingsItem icon="code" label="Разработчик" value="Школьная команда" type="display" />
          <SettingsItem icon="mail" label="Email" value="support@luch.school" type="display" />
          <SettingsItem icon="globe" label="Веб-сайт" value="luch.school" type="display" />
        </Card>

        <Card style={[styles.card, { marginTop: Spacing.lg }]}>
          <SettingsItem icon="file-text" label="Лицензионное соглашение" onPress={() => {}} />
          <SettingsItem icon="shield" label="Политика конфиденциальности" onPress={() => {}} />
          <SettingsItem icon="book" label="Условия использования" onPress={() => {}} />
        </Card>

        <ThemedText type="caption" style={styles.copyright}>
          © 2025 Луч Знаний. Все права защищены.
        </ThemedText>
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
    alignItems: 'center',
  },
  appIcon: {
    marginBottom: Spacing.lg,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    padding: 0,
    overflow: 'hidden',
  },
  copyright: {
    marginTop: Spacing['2xl'],
    textAlign: 'center',
    opacity: 0.6,
  },
});
