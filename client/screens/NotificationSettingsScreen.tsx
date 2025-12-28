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
import { Spacing, BorderRadius } from '@/constants/theme';

export default function NotificationSettingsScreen() {
  const { theme } = useTheme();
  const { settings, updateNotificationSettings } = useSettings();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const MenuItem = ({
    icon,
    label,
    description,
    showSwitch,
    switchValue,
    onSwitchChange,
    onPress,
    disabled,
  }: {
    icon: string;
    label: string;
    description?: string;
    showSwitch?: boolean;
    switchValue?: boolean;
    onSwitchChange?: (value: boolean) => void;
    onPress?: () => void;
    disabled?: boolean;
  }) => (
    <Pressable
      style={[
        styles.menuItem,
        { borderBottomColor: theme.backgroundSecondary },
        disabled && styles.menuItemDisabled,
      ]}
      onPress={onPress}
      disabled={showSwitch || disabled}
    >
      <Feather name={icon as any} size={20} color={disabled ? theme.textSecondary : theme.primary} />
      <View style={styles.menuItemContent}>
        <ThemedText style={[styles.menuItemLabel, disabled && { color: theme.textSecondary }]}>
          {label}
        </ThemedText>
        {description && (
          <ThemedText style={[styles.menuItemDescription, { color: theme.textSecondary }]}>
            {description}
          </ThemedText>
        )}
      </View>
      {showSwitch && (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: theme.backgroundSecondary, true: theme.primary }}
          disabled={disabled}
        />
      )}
    </Pressable>
  );

  const notificationsEnabled = settings.notifications.enabled;

  return (
    <ThemedView style={styles.container}>
      {/* Хедер */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color={theme.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Уведомления</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Главный переключатель */}
        <View style={[styles.mainToggle, { backgroundColor: theme.backgroundDefault }]}>
          <MenuItem
            icon="bell"
            label="Уведомления"
            description="Включить push-уведомления"
            showSwitch
            switchValue={settings.notifications.enabled}
            onSwitchChange={(value) => updateNotificationSettings({ enabled: value })}
          />
        </View>

        {/* Типы уведомлений */}
        <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          ТИПЫ УВЕДОМЛЕНИЙ
        </ThemedText>
        <View style={[styles.section, { backgroundColor: theme.backgroundDefault }]}>
          <MenuItem
            icon="message-circle"
            label="Сообщения"
            description="Уведомления о новых сообщениях"
            showSwitch
            switchValue={settings.notifications.messages}
            onSwitchChange={(value) => updateNotificationSettings({ messages: value })}
            disabled={!notificationsEnabled}
          />
          <MenuItem
            icon="users"
            label="Группы"
            description="Уведомления от групповых чатов"
            showSwitch
            switchValue={settings.notifications.groups}
            onSwitchChange={(value) => updateNotificationSettings({ groups: value })}
            disabled={!notificationsEnabled}
          />
          <MenuItem
            icon="at-sign"
            label="Упоминания"
            description="Когда вас упоминают в группе"
            showSwitch
            switchValue={settings.notifications.mentions}
            onSwitchChange={(value) => updateNotificationSettings({ mentions: value })}
            disabled={!notificationsEnabled}
          />
        </View>

        {/* Звуки и вибрация */}
        <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          ЗВУКИ И ВИБРАЦИЯ
        </ThemedText>
        <View style={[styles.section, { backgroundColor: theme.backgroundDefault }]}>
          <MenuItem
            icon="volume-2"
            label="Звук уведомлений"
            showSwitch
            switchValue={settings.notifications.sound}
            onSwitchChange={(value) => updateNotificationSettings({ sound: value })}
            disabled={!notificationsEnabled}
          />
          <MenuItem
            icon="smartphone"
            label="Вибрация"
            showSwitch
            switchValue={settings.notifications.vibration}
            onSwitchChange={(value) => updateNotificationSettings({ vibration: value })}
            disabled={!notificationsEnabled}
          />
        </View>

        {/* Отображение */}
        <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          ОТОБРАЖЕНИЕ
        </ThemedText>
        <View style={[styles.section, { backgroundColor: theme.backgroundDefault }]}>
          <MenuItem
            icon="eye"
            label="Предпросмотр сообщений"
            description="Показывать текст в уведомлении"
            showSwitch
            switchValue={settings.notifications.preview}
            onSwitchChange={(value) => updateNotificationSettings({ preview: value })}
            disabled={!notificationsEnabled}
          />
        </View>

        {/* Подсказка */}
        <View style={styles.hint}>
          <ThemedText style={[styles.hintText, { color: theme.textSecondary }]}>
            Вы также можете настроить уведомления для каждого чата отдельно через информацию о чате.
          </ThemedText>
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
  mainToggle: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
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
  menuItemDisabled: {
    opacity: 0.5,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemLabel: {
    fontSize: 16,
  },
  menuItemDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  hint: {
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  hintText: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
});
