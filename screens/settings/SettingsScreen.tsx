import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ThemedView } from '@/components/ThemedView';
import { Card } from '@/components/Card';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { SettingsItem } from '@/components/settings/SettingsItem';
import { Spacing, Colors } from '@/constants/theme';

export default function SettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Аккаунт */}
        <SettingsSection title="🔐 Аккаунт">
          <Card style={styles.card}>
            <SettingsItem icon="user" label="Редактировать профиль" onPress={() => navigation.navigate('EditProfile')} />
            <SettingsItem icon="lock" label="Изменить пароль" onPress={() => navigation.navigate('ChangePassword')} />
            <SettingsItem icon="mail" label="Привязка email" value="не указан" onPress={() => {}} />
            <SettingsItem icon="phone" label="Привязка телефона" value="не указан" onPress={() => {}} />
          </Card>
        </SettingsSection>

        {/* Приватность */}
        <SettingsSection title="🔒 Приватность">
          <Card style={styles.card}>
            <SettingsItem icon="eye" label="Приватность" onPress={() => navigation.navigate('PrivacySettings')} />
            <SettingsItem icon="user-x" label="Чёрный список" onPress={() => navigation.navigate('BlockedUsers')} />
          </Card>
        </SettingsSection>

        {/* Уведомления */}
        <SettingsSection title="🔔 Уведомления">
          <Card style={styles.card}>
            <SettingsItem icon="bell" label="Настройки уведомлений" onPress={() => navigation.navigate('NotificationSettings')} />
          </Card>
        </SettingsSection>

        {/* Внешний вид */}
        <SettingsSection title="🎨 Внешний вид">
          <Card style={styles.card}>
            <SettingsItem icon="palette" label="Оформление" onPress={() => navigation.navigate('AppearanceSettings')} />
          </Card>
        </SettingsSection>

        {/* Общие */}
        <SettingsSection title="🌐 Общие">
          <Card style={styles.card}>
            <SettingsItem icon="globe" label="Язык" value="Русский" onPress={() => {}} />
            <SettingsItem icon="download" label="Автозагрузка медиа" value="WiFi" onPress={() => {}} />
            <SettingsItem icon="trash-2" label="Очистка кэша" onPress={() => {}} />
            <SettingsItem icon="info" label="О приложении" onPress={() => navigation.navigate('About')} />
            <SettingsItem icon="message-circle" label="Связаться с поддержкой" onPress={() => {}} />
          </Card>
        </SettingsSection>

        {/* Аккаунт - Удаление */}
        <SettingsSection title="">
          <Card style={styles.card}>
            <SettingsItem
              icon="alert-triangle"
              label="Удалить аккаунт"
              onPress={() => {}}
              color={Colors.light.error}
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
