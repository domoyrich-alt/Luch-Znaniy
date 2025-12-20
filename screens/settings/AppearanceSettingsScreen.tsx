import React from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/Card';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { SettingsItem } from '@/components/settings/SettingsItem';
import { ColorPicker } from '@/components/settings/ColorPicker';
import { useTheme } from '@/hooks/useTheme';
import { useThemeContext } from '@/context/ThemeContext';
import { useSettings } from '@/hooks/useSettings';
import { Spacing, BorderRadius } from '@/constants/theme';

export default function AppearanceSettingsScreen() {
  const { theme } = useTheme();
  const { themeMode, setThemeMode } = useThemeContext();
  const { settings, updateSettings } = useSettings();

  const themeOptions = [
    { mode: 'light' as const, label: 'Светлая' },
    { mode: 'dark' as const, label: 'Тёмная' },
    { mode: 'system' as const, label: 'Системная' },
  ];

  const fontSizeOptions = [
    { size: 'small' as const, label: 'Маленький' },
    { size: 'medium' as const, label: 'Средний' },
    { size: 'large' as const, label: 'Большой' },
  ];

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <SettingsSection title="Тема">
          <Card style={styles.themeCard}>
            {themeOptions.map((option) => (
              <Pressable
                key={option.mode}
                onPress={() => setThemeMode(option.mode)}
                style={[
                  styles.themeOption,
                  {
                    backgroundColor: themeMode === option.mode ? theme.primary + '15' : 'transparent',
                    borderColor: themeMode === option.mode ? theme.primary : theme.border,
                  },
                ]}
              >
                <ThemedText
                  type="body"
                  style={{ color: themeMode === option.mode ? theme.primary : theme.text }}
                >
                  {option.label}
                </ThemedText>
              </Pressable>
            ))}
          </Card>
        </SettingsSection>

        <SettingsSection title="Цвет">
          <Card style={styles.colorCard}>
            <ColorPicker
              selectedColor={settings.accentColor}
              onSelectColor={(color) => updateSettings({ accentColor: color })}
            />
          </Card>
        </SettingsSection>

        <SettingsSection title="Размер шрифта">
          <Card style={styles.themeCard}>
            {fontSizeOptions.map((option) => (
              <Pressable
                key={option.size}
                onPress={() => updateSettings({ fontSize: option.size })}
                style={[
                  styles.themeOption,
                  {
                    backgroundColor: settings.fontSize === option.size ? theme.primary + '15' : 'transparent',
                    borderColor: settings.fontSize === option.size ? theme.primary : theme.border,
                  },
                ]}
              >
                <ThemedText
                  type="body"
                  style={{ color: settings.fontSize === option.size ? theme.primary : theme.text }}
                >
                  {option.label}
                </ThemedText>
              </Pressable>
            ))}
          </Card>
        </SettingsSection>

        <SettingsSection title="Дополнительно">
          <Card style={styles.card}>
            <SettingsItem
              icon="minimize-2"
              label="Сжатый вид списков"
              type="switch"
              value={settings.compactMode}
              onValueChange={(value) => updateSettings({ compactMode: value })}
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
  themeCard: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  colorCard: {
    padding: Spacing.lg,
  },
  themeOption: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
});
