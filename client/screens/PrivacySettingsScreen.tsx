import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { useSettings } from '@/context/SettingsContext';
import { Spacing, BorderRadius } from '@/constants/theme';

export default function PrivacySettingsScreen() {
  const { theme } = useTheme();
  const { settings, updatePrivacySettings } = useSettings();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const MenuItem = ({
    icon,
    label,
    description,
    value,
    options,
    showSwitch,
    switchValue,
    onSwitchChange,
    onPress,
  }: {
    icon: string;
    label: string;
    description?: string;
    value?: string;
    options?: string[];
    showSwitch?: boolean;
    switchValue?: boolean;
    onSwitchChange?: (value: boolean) => void;
    onPress?: () => void;
  }) => (
    <Pressable
      style={[styles.menuItem, { borderBottomColor: theme.backgroundSecondary }]}
      onPress={onPress}
      disabled={showSwitch}
    >
      <Feather name={icon as any} size={20} color={theme.primary} />
      <View style={styles.menuItemContent}>
        <ThemedText style={styles.menuItemLabel}>{label}</ThemedText>
        {description && (
          <ThemedText style={[styles.menuItemDescription, { color: theme.textSecondary }]}>
            {description}
          </ThemedText>
        )}
        {value && (
          <ThemedText style={[styles.menuItemValue, { color: theme.primary }]}>
            {value}
          </ThemedText>
        )}
      </View>
      {showSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: theme.backgroundSecondary, true: theme.primary }}
        />
      ) : onPress && (
        <Feather name="chevron-right" size={20} color={theme.textSecondary} />
      )}
    </Pressable>
  );

  return (
    <ThemedView style={styles.container}>
      {/* Хедер */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color={theme.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Конфиденциальность</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Кто может видеть */}
        <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          КТО МОЖЕТ ВИДЕТЬ
        </ThemedText>
        <View style={[styles.section, { backgroundColor: theme.backgroundDefault }]}>
          <MenuItem
            icon="phone"
            label="Номер телефона"
            value={settings.privacy.showPhone === 'everyone' ? 'Все' : settings.privacy.showPhone === 'contacts' ? 'Контакты' : 'Никто'}
            onPress={() => {
              const options = ['everyone', 'contacts', 'nobody'] as const;
              const currentIndex = options.indexOf(settings.privacy.showPhone);
              updatePrivacySettings({ showPhone: options[(currentIndex + 1) % 3] });
            }}
          />
          <MenuItem
            icon="clock"
            label="Последний визит"
            value={settings.privacy.showLastSeen === 'everyone' ? 'Все' : settings.privacy.showLastSeen === 'contacts' ? 'Контакты' : 'Никто'}
            onPress={() => {
              const options = ['everyone', 'contacts', 'nobody'] as const;
              const currentIndex = options.indexOf(settings.privacy.showLastSeen);
              updatePrivacySettings({ showLastSeen: options[(currentIndex + 1) % 3] });
            }}
          />
          <MenuItem
            icon="image"
            label="Фото профиля"
            value={settings.privacy.showAvatar === 'everyone' ? 'Все' : settings.privacy.showAvatar === 'contacts' ? 'Контакты' : 'Никто'}
            onPress={() => {
              const options = ['everyone', 'contacts', 'nobody'] as const;
              const currentIndex = options.indexOf(settings.privacy.showAvatar);
              updatePrivacySettings({ showAvatar: options[(currentIndex + 1) % 3] });
            }}
          />
          <MenuItem
            icon="info"
            label="О себе"
            value={settings.privacy.showBio === 'everyone' ? 'Все' : settings.privacy.showBio === 'contacts' ? 'Контакты' : 'Никто'}
            onPress={() => {
              const options = ['everyone', 'contacts', 'nobody'] as const;
              const currentIndex = options.indexOf(settings.privacy.showBio);
              updatePrivacySettings({ showBio: options[(currentIndex + 1) % 3] });
            }}
          />
        </View>

        {/* Статус чтения */}
        <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          СТАТУС ЧТЕНИЯ
        </ThemedText>
        <View style={[styles.section, { backgroundColor: theme.backgroundDefault }]}>
          <MenuItem
            icon="check-circle"
            label="Галочки прочтения"
            description="Показывать когда вы прочитали сообщение"
            showSwitch
            switchValue={settings.privacy.readReceipts}
            onSwitchChange={(value) => updatePrivacySettings({ readReceipts: value })}
          />
        </View>

        {/* Безопасность */}
        <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          БЕЗОПАСНОСТЬ
        </ThemedText>
        <View style={[styles.section, { backgroundColor: theme.backgroundDefault }]}>
          <MenuItem
            icon="lock"
            label="Двухфакторная аутентификация"
            description="Дополнительная защита аккаунта"
            onPress={() =>
              Alert.alert(
                'Двухфакторная аутентификация',
                'Скоро будет доступно в следующем обновлении.'
              )
            }
          />
          <MenuItem
            icon="key"
            label="Сменить пароль"
            onPress={() =>
              Alert.alert(
                'Смена пароля',
                'Скоро будет доступно в следующем обновлении.'
              )
            }
          />
        </View>

        {/* Чёрный список */}
        <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          ЧЁРНЫЙ СПИСОК
        </ThemedText>
        <View style={[styles.section, { backgroundColor: theme.backgroundDefault }]}>
          <MenuItem
            icon="slash"
            label="Заблокированные пользователи"
            value={`${settings.blockedUsers.length} пользователей`}
            onPress={() => navigation.navigate('BlockedUsers')}
          />
        </View>

        {/* Подсказка */}
        <View style={styles.hint}>
          <ThemedText style={[styles.hintText, { color: theme.textSecondary }]}>
            Настройки приватности позволяют контролировать, кто может видеть вашу информацию и связываться с вами.
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
    fontSize: 16,
  },
  menuItemDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  menuItemValue: {
    fontSize: 14,
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
