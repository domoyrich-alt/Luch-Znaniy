import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Alert,
  Switch,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';

type RouteParams = {
  ChatInfo: {
    chatId: string;
    chatName: string;
    chatType?: 'private' | 'group';
    avatar?: string;
  };
};

export default function ChatInfoScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, 'ChatInfo'>>();
  const insets = useSafeAreaInsets();

  const { chatId, chatName, chatType = 'private', avatar } = route.params;

  const [isMuted, setIsMuted] = useState(false);
  const [isPinned, setIsPinned] = useState(false);

  const MenuItem = ({ 
    icon, 
    label, 
    value, 
    color, 
    onPress,
    showSwitch,
    switchValue,
    onSwitchChange,
  }: { 
    icon: string; 
    label: string; 
    value?: string; 
    color?: string;
    onPress?: () => void;
    showSwitch?: boolean;
    switchValue?: boolean;
    onSwitchChange?: (value: boolean) => void;
  }) => (
    <Pressable
      style={[styles.menuItem, { borderBottomColor: theme.backgroundSecondary }]}
      onPress={onPress}
      disabled={showSwitch}
    >
      <Feather name={icon as any} size={20} color={color || theme.primary} />
      <View style={styles.menuItemContent}>
        <ThemedText style={[styles.menuItemLabel, color && { color }]}>{label}</ThemedText>
        {value && (
          <ThemedText style={[styles.menuItemValue, { color: theme.textSecondary }]}>
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

  const handleBlockUser = () => {
    Alert.alert(
      'Заблокировать пользователя?',
      `Вы уверены, что хотите заблокировать ${chatName}?`,
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Заблокировать', style: 'destructive', onPress: () => Alert.alert('Пользователь заблокирован') },
      ]
    );
  };

  const handleDeleteChat = () => {
    Alert.alert(
      'Удалить чат?',
      'Все сообщения будут удалены. Это действие нельзя отменить.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: () => {
            navigation.navigate('ChatsList');
          },
        },
      ]
    );
  };

  return (
    <ThemedView style={styles.container}>
      {/* Хедер */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color={theme.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Информация</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Профиль */}
        <View style={styles.profileSection}>
          <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatarImage} />
            ) : (
              <ThemedText style={styles.avatarText}>
                {chatName.charAt(0).toUpperCase()}
              </ThemedText>
            )}
          </View>
          <ThemedText style={styles.name}>{chatName}</ThemedText>
          <ThemedText style={[styles.status, { color: theme.textSecondary }]}>
            {chatType === 'group' ? '25 участников' : 'был(а) в 14:30'}
          </ThemedText>

          {/* Быстрые действия */}
          <View style={styles.quickActions}>
            <Pressable style={styles.quickAction}>
              <View style={[styles.quickActionIcon, { backgroundColor: theme.primary }]}>
                <Feather name="phone" size={20} color="#FFFFFF" />
              </View>
              <ThemedText style={styles.quickActionText}>Позвонить</ThemedText>
            </Pressable>
            <Pressable style={styles.quickAction}>
              <View style={[styles.quickActionIcon, { backgroundColor: theme.primary }]}>
                <Feather name="video" size={20} color="#FFFFFF" />
              </View>
              <ThemedText style={styles.quickActionText}>Видео</ThemedText>
            </Pressable>
            <Pressable style={styles.quickAction} onPress={() => navigation.navigate('SearchMessages', { chatId })}>
              <View style={[styles.quickActionIcon, { backgroundColor: theme.primary }]}>
                <Feather name="search" size={20} color="#FFFFFF" />
              </View>
              <ThemedText style={styles.quickActionText}>Поиск</ThemedText>
            </Pressable>
          </View>
        </View>

        {/* Информация */}
        {chatType === 'private' && (
          <View style={[styles.section, { backgroundColor: theme.backgroundDefault }]}>
            <MenuItem icon="user" label="Имя пользователя" value={`@${chatName.toLowerCase().replace(' ', '_')}`} />
            <MenuItem icon="info" label="О себе" value="Ученик 10А класса" />
            <MenuItem icon="phone" label="Телефон" value="+7 (999) 123-45-67" />
          </View>
        )}

        {/* Настройки уведомлений */}
        <View style={[styles.section, { backgroundColor: theme.backgroundDefault }]}>
          <MenuItem
            icon="bell-off"
            label="Без звука"
            showSwitch
            switchValue={isMuted}
            onSwitchChange={setIsMuted}
          />
          <MenuItem
            icon="bookmark"
            label="Закрепить чат"
            showSwitch
            switchValue={isPinned}
            onSwitchChange={setIsPinned}
          />
        </View>

        {/* Медиа */}
        <View style={[styles.section, { backgroundColor: theme.backgroundDefault }]}>
          <MenuItem
            icon="image"
            label="Медиа"
            value="12 фото, 3 видео"
            onPress={() => Alert.alert('Медиафайлы')}
          />
          <MenuItem
            icon="file"
            label="Файлы"
            value="5 файлов"
            onPress={() => Alert.alert('Файлы')}
          />
          <MenuItem
            icon="link"
            label="Ссылки"
            value="8 ссылок"
            onPress={() => Alert.alert('Ссылки')}
          />
          <MenuItem
            icon="mic"
            label="Голосовые"
            value="15 сообщений"
            onPress={() => Alert.alert('Голосовые')}
          />
        </View>

        {/* Участники группы */}
        {chatType === 'group' && (
          <View style={[styles.section, { backgroundColor: theme.backgroundDefault }]}>
            <MenuItem
              icon="users"
              label="Участники"
              value="25"
              onPress={() => Alert.alert('Участники')}
            />
            <MenuItem
              icon="user-plus"
              label="Добавить участника"
              onPress={() => Alert.alert('Добавить')}
            />
          </View>
        )}

        {/* Опасные действия */}
        <View style={[styles.section, { backgroundColor: theme.backgroundDefault }]}>
          {chatType === 'private' && (
            <MenuItem
              icon="slash"
              label="Заблокировать"
              color="#FF6B6B"
              onPress={handleBlockUser}
            />
          )}
          <MenuItem
            icon="trash-2"
            label="Удалить чат"
            color="#FF6B6B"
            onPress={handleDeleteChat}
          />
          {chatType === 'group' && (
            <MenuItem
              icon="log-out"
              label="Выйти из группы"
              color="#FF6B6B"
              onPress={() => Alert.alert('Выйти из группы?')}
            />
          )}
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
    paddingBottom: Spacing.xl,
  },
  profileSection: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: '600',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: Spacing.md,
  },
  status: {
    fontSize: 14,
    marginTop: Spacing.xs,
  },
  quickActions: {
    flexDirection: 'row',
    marginTop: Spacing.lg,
    gap: Spacing.xl,
  },
  quickAction: {
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionText: {
    fontSize: 12,
    marginTop: Spacing.xs,
  },
  section: {
    marginTop: Spacing.md,
    borderRadius: BorderRadius.md,
    marginHorizontal: Spacing.md,
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
  menuItemValue: {
    fontSize: 14,
    marginTop: 2,
  },
});
