import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/Button';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius, Colors } from '@/constants/theme';

// Моковые данные пользователей для выбора
const MOCK_USERS = [
  { id: 1, name: 'Иван Иванов', avatar: '👨', isOnline: true },
  { id: 2, name: 'Мария Петрова', avatar: '👩', isOnline: false },
  { id: 3, name: 'Алексей Сидоров', avatar: '👨', isOnline: true },
];

export default function NewChatScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);

  const toggleUser = (userId: number) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleCreateChat = () => {
    if (selectedUsers.length > 0) {
      console.log('Создание чата с пользователями:', selectedUsers);
      navigation.goBack();
    }
  };

  const renderUser = ({ item }: { item: typeof MOCK_USERS[0] }) => {
    const isSelected = selectedUsers.includes(item.id);

    return (
      <Pressable
        onPress={() => toggleUser(item.id)}
        style={[
          styles.userItem,
          { backgroundColor: isSelected ? theme.primary + '15' : 'transparent' },
        ]}
      >
        <View style={[styles.avatar, { backgroundColor: theme.primary + '15' }]}>
          <ThemedText type="h4">{item.avatar}</ThemedText>
        </View>
        <View style={styles.userInfo}>
          <ThemedText type="body" style={{ fontWeight: '600' }}>
            {item.name}
          </ThemedText>
          <ThemedText type="caption" style={{ color: item.isOnline ? Colors.light.success : theme.textSecondary }}>
            {item.isOnline ? 'В сети' : 'Не в сети'}
          </ThemedText>
        </View>
        {isSelected && <Feather name="check" size={24} color={theme.primary} />}
      </Pressable>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="h4">Выберите участников</ThemedText>
        <ThemedText type="caption" style={{ color: theme.textSecondary }}>
          {selectedUsers.length} выбрано
        </ThemedText>
      </View>

      <FlatList
        data={MOCK_USERS}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderUser}
        showsVerticalScrollIndicator={false}
      />

      {selectedUsers.length > 0 && (
        <View style={[styles.footer, { backgroundColor: theme.backgroundDefault }]}>
          <Button onPress={handleCreateChat}>
            Создать чат ({selectedUsers.length})
          </Button>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: Spacing.lg,
    gap: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
  },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
});
