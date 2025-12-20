import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/Card';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';

// Моковые данные заблокированных пользователей
const MOCK_BLOCKED_USERS = [
  { id: 1, name: 'Пользователь 1', avatar: '👤' },
  { id: 2, name: 'Пользователь 2', avatar: '👤' },
];

export default function BlockedUsersScreen() {
  const { theme } = useTheme();

  const renderUser = ({ item }: { item: typeof MOCK_BLOCKED_USERS[0] }) => (
    <View style={[styles.userItem, { borderBottomColor: theme.border }]}>
      <View style={[styles.avatar, { backgroundColor: theme.primary + '15' }]}>
        <ThemedText type="h4">{item.avatar}</ThemedText>
      </View>
      <ThemedText type="body" style={styles.userName}>
        {item.name}
      </ThemedText>
      <Feather name="x" size={20} color={theme.textSecondary} />
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      {MOCK_BLOCKED_USERS.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Feather name="user-x" size={48} color={theme.textSecondary} />
          <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.md }}>
            Чёрный список пуст
          </ThemedText>
        </View>
      ) : (
        <Card style={styles.card}>
          <FlatList
            data={MOCK_BLOCKED_USERS}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderUser}
          />
        </Card>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.lg,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    flex: 1,
  },
});
