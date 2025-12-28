import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { useSettings } from '@/context/SettingsContext';
import { ACCENT_COLORS } from '@/types/settings';
import { Spacing, BorderRadius } from '@/constants/theme';

type ThemeMode = 'light' | 'dark' | 'system';

export default function AppearanceSettingsScreen() {
  const { theme, isDark, setTheme, themeMode } = useTheme();
  const { settings, updateAppearanceSettings } = useSettings();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const themeModes: { key: ThemeMode; label: string; icon: string }[] = [
    { key: 'light', label: 'Светлая', icon: 'sun' },
    { key: 'dark', label: 'Тёмная', icon: 'moon' },
    { key: 'system', label: 'Системная', icon: 'smartphone' },
  ];

  const fontSizes: { key: 'small' | 'medium' | 'large'; label: string; size: number }[] = [
    { key: 'small', label: 'Маленький', size: 14 },
    { key: 'medium', label: 'Средний', size: 16 },
    { key: 'large', label: 'Большой', size: 18 },
  ];

  // Обработчик изменения темы - обновляет и ThemeContext и Settings
  const handleThemeChange = (mode: ThemeMode) => {
    setTheme(mode); // Применяет тему сразу
    updateAppearanceSettings({ theme: mode }); // Сохраняет в настройки
  };

  return (
    <ThemedView style={styles.container}>
      {/* Хедер */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color={theme.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Внешний вид</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Тема */}
        <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          ТЕМА
        </ThemedText>
        <View style={[styles.section, { backgroundColor: theme.backgroundDefault }]}>
          {themeModes.map((mode) => (
            <Pressable
              key={mode.key}
              style={[styles.menuItem, { borderBottomColor: theme.backgroundSecondary }]}
              onPress={() => handleThemeChange(mode.key)}
            >
              <Feather name={mode.icon as any} size={20} color={theme.primary} />
              <ThemedText style={styles.menuItemLabel}>{mode.label}</ThemedText>
              {themeMode === mode.key && (
                <Feather name="check" size={20} color={theme.primary} />
              )}
            </Pressable>
          ))}
        </View>

        {/* Акцентный цвет */}
        <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          АКЦЕНТНЫЙ ЦВЕТ
        </ThemedText>
        <View style={[styles.section, { backgroundColor: theme.backgroundDefault }]}>
          <View style={styles.colorsGrid}>
            {ACCENT_COLORS.map((color) => (
              <Pressable
                key={color.value}
                style={[
                  styles.colorButton,
                  { backgroundColor: color.value },
                  settings.appearance.accentColor === color.value && styles.colorButtonSelected,
                ]}
                onPress={() => updateAppearanceSettings({ accentColor: color.value })}
              >
                {settings.appearance.accentColor === color.value && (
                  <Feather name="check" size={20} color="#FFFFFF" />
                )}
              </Pressable>
            ))}
          </View>
        </View>

        {/* Размер шрифта */}
        <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          РАЗМЕР ШРИФТА
        </ThemedText>
        <View style={[styles.section, { backgroundColor: theme.backgroundDefault }]}>
          {fontSizes.map((size) => (
            <Pressable
              key={size.key}
              style={[styles.menuItem, { borderBottomColor: theme.backgroundSecondary }]}
              onPress={() => updateAppearanceSettings({ fontSize: size.key })}
            >
              <ThemedText style={[styles.fontSizePreview, { fontSize: size.size }]}>
                Aa
              </ThemedText>
              <ThemedText style={styles.menuItemLabel}>{size.label}</ThemedText>
              {settings.appearance.fontSize === size.key && (
                <Feather name="check" size={20} color={theme.primary} />
              )}
            </Pressable>
          ))}
        </View>

        {/* Чат */}
        <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          ЧАТ
        </ThemedText>
        <View style={[styles.section, { backgroundColor: theme.backgroundDefault }]}>
          <View style={[styles.menuItem, { borderBottomColor: theme.backgroundSecondary }]}>
            <Feather name="message-circle" size={20} color={theme.primary} />
            <View style={styles.menuItemContent}>
              <ThemedText style={styles.menuItemLabel}>Пузыри сообщений</ThemedText>
              <ThemedText style={[styles.menuItemDescription, { color: theme.textSecondary }]}>
                Округлённые рамки сообщений
              </ThemedText>
            </View>
            <Switch
              value={settings.appearance.chatBubbles}
              onValueChange={(value) => updateAppearanceSettings({ chatBubbles: value })}
              trackColor={{ false: theme.backgroundSecondary, true: theme.primary }}
            />
          </View>
          <View style={[styles.menuItem, { borderBottomColor: theme.backgroundSecondary }]}>
            <Feather name="corner-down-left" size={20} color={theme.primary} />
            <View style={styles.menuItemContent}>
              <ThemedText style={styles.menuItemLabel}>Отправка по Enter</ThemedText>
              <ThemedText style={[styles.menuItemDescription, { color: theme.textSecondary }]}>
                Отправлять сообщение при нажатии Enter
              </ThemedText>
            </View>
            <Switch
              value={settings.appearance.sendOnEnter}
              onValueChange={(value) => updateAppearanceSettings({ sendOnEnter: value })}
              trackColor={{ false: theme.backgroundSecondary, true: theme.primary }}
            />
          </View>
        </View>

        {/* Анимации */}
        <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          АНИМАЦИИ
        </ThemedText>
        <View style={[styles.section, { backgroundColor: theme.backgroundDefault }]}>
          <View style={[styles.menuItem, { borderBottomColor: theme.backgroundSecondary }]}>
            <Feather name="zap" size={20} color={theme.primary} />
            <View style={styles.menuItemContent}>
              <ThemedText style={styles.menuItemLabel}>Анимации</ThemedText>
              <ThemedText style={[styles.menuItemDescription, { color: theme.textSecondary }]}>
                Плавные переходы и эффекты
              </ThemedText>
            </View>
            <Switch
              value={settings.appearance.animations}
              onValueChange={(value) => updateAppearanceSettings({ animations: value })}
              trackColor={{ false: theme.backgroundSecondary, true: theme.primary }}
            />
          </View>
        </View>

        {/* Предпросмотр */}
        <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          ПРЕДПРОСМОТР
        </ThemedText>
        <View style={[styles.previewSection, { backgroundColor: theme.backgroundSecondary }]}>
          <View style={styles.previewChat}>
            {/* Входящее сообщение */}
            <View style={[styles.previewMessage, styles.previewIncoming]}>
              <View
                style={[
                  styles.previewBubble,
                  { backgroundColor: theme.backgroundDefault },
                  settings.appearance.chatBubbles && styles.previewBubbleRounded,
                ]}
              >
                <ThemedText style={{ fontSize: fontSizes.find(f => f.key === settings.appearance.fontSize)?.size || 16 }}>
                  Привет! Как дела?
                </ThemedText>
              </View>
            </View>

            {/* Исходящее сообщение */}
            <View style={[styles.previewMessage, styles.previewOutgoing]}>
              <View
                style={[
                  styles.previewBubble,
                  { backgroundColor: settings.appearance.accentColor || theme.primary },
                  settings.appearance.chatBubbles && styles.previewBubbleRounded,
                ]}
              >
                <ThemedText style={{ color: '#FFFFFF', fontSize: fontSizes.find(f => f.key === settings.appearance.fontSize)?.size || 16 }}>
                  Отлично! А у тебя?
                </ThemedText>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    paddingBottom: Spacing.xl * 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: Spacing.lg,
    marginBottom: Spacing.xs,
    marginHorizontal: Spacing.md,
  },
  section: {
    marginHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    gap: Spacing.md,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemLabel: {
    flex: 1,
    fontSize: 16,
  },
  menuItemDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  fontSizePreview: {
    fontWeight: '600',
    width: 32,
  },
  colorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  colorButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorButtonSelected: {
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  previewSection: {
    marginHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  previewChat: {
    gap: Spacing.sm,
  },
  previewMessage: {
    maxWidth: '75%',
  },
  previewIncoming: {
    alignSelf: 'flex-start',
  },
  previewOutgoing: {
    alignSelf: 'flex-end',
  },
  previewBubble: {
    padding: Spacing.sm,
    borderRadius: 4,
  },
  previewBubbleRounded: {
    borderRadius: BorderRadius.lg,
  },
});
