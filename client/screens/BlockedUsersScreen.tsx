import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
  TextInput,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { useSettings } from '@/context/SettingsContext';
import { BlockedUser } from '@/types/settings';
import { Spacing, BorderRadius } from '@/constants/theme';

export default function BlockedUsersScreen() {
  const { theme } = useTheme();
  const { settings, unblockUser } = useSettings();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return settings.blockedUsers;
    return settings.blockedUsers.filter(
      user =>
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [settings.blockedUsers, searchQuery]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const handleUnblock = (user: BlockedUser) => {
    Alert.alert(
      'Разблокировать?',
      `Вы уверены, что хотите разблокировать ${user.displayName || user.username}?`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Разблокировать',
          onPress: () => unblockUser(user.id),
        },
      ]
    );
  };

  const renderBlockedUser = ({ item }: { item: BlockedUser }) => (
    <View style={[styles.userItem, { borderBottomColor: theme.backgroundSecondary }]}>
      {/* Аватар */}
      <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
        <ThemedText style={styles.avatarText}>
          {(item.displayName || item.username).charAt(0).toUpperCase()}
        </ThemedText>
      </View>

      {/* Информация */}
      <View style={styles.userInfo}>
        <ThemedText style={styles.userName}>
          {item.displayName || item.username}
        </ThemedText>
        <ThemedText style={[styles.userUsername, { color: theme.textSecondary }]}>
          @{String(item.username || '').replace(/^@+/, '')}
        </ThemedText>
        <ThemedText style={[styles.blockedDate, { color: theme.textSecondary }]}>
          Заблокирован {formatDate(item.blockedAt)}
        </ThemedText>
      </View>

      {/* Кнопка разблокировки */}
      <Pressable
        style={[styles.unblockButton, { borderColor: theme.primary }]}
        onPress={() => handleUnblock(item)}
      >
        <ThemedText style={[styles.unblockButtonText, { color: theme.primary }]}>
          Разблокировать
        </ThemedText>
      </Pressable>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Feather name="shield" size={64} color={theme.textSecondary} />
      <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
        {searchQuery ? 'Пользователи не найдены' : 'Нет заблокированных пользователей'}
      </ThemedText>
      <ThemedText style={[styles.emptySubtext, { color: theme.textSecondary }]}>
        {searchQuery
          ? 'Попробуйте изменить запрос'
          : 'Заблокированные пользователи не смогут отправлять вам сообщения'}
      </ThemedText>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      {/* Хедер */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color={theme.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Чёрный список</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      {/* Поиск */}
      {settings.blockedUsers.length > 0 && (
        <View style={[styles.searchContainer, { backgroundColor: theme.backgroundSecondary }]}>
          <Feather name="search" size={18} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Поиск..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Feather name="x" size={18} color={theme.textSecondary} />
            </Pressable>
          )}
        </View>
      )}

      {/* Счётчик */}
      {settings.blockedUsers.length > 0 && (
        <View style={styles.counter}>
          <ThemedText style={[styles.counterText, { color: theme.textSecondary }]}>
            Заблокировано: {settings.blockedUsers.length}
          </ThemedText>
        </View>
      )}

      {/* Список */}
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        renderItem={renderBlockedUser}
        contentContainerStyle={filteredUsers.length === 0 && styles.emptyList}
        ListEmptyComponent={renderEmpty}
      />
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  counter: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  counterText: {
    fontSize: 12,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    gap: Spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  userUsername: {
    fontSize: 14,
    marginTop: 2,
  },
  blockedDate: {
    fontSize: 12,
    marginTop: 4,
  },
  unblockButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  unblockButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  emptyList: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: Spacing.xs,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
});
