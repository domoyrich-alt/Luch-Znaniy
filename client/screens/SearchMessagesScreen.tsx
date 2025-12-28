import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { ChatMessage } from '@/types/chat';
import { Spacing, BorderRadius } from '@/constants/theme';

type RouteParams = {
  SearchMessages: {
    chatId?: string;
  };
};

// Моковые результаты поиска
const MOCK_SEARCH_RESULTS: ChatMessage[] = [
  {
    id: '1',
    chatId: '1',
    senderId: 'user1',
    senderName: 'Анна Иванова',
    type: 'text',
    text: 'Привет! Как дела с домашкой по математике?',
    timestamp: Date.now() - 1000 * 60 * 60 * 24,
    status: 'read',
    reactions: [],
  },
  {
    id: '2',
    chatId: '2',
    senderId: 'user2',
    senderName: 'Дмитрий',
    type: 'text',
    text: 'Завтра контрольная по математике!',
    timestamp: Date.now() - 1000 * 60 * 60 * 48,
    status: 'read',
    reactions: [],
  },
  {
    id: '3',
    chatId: '1',
    senderId: 'user1',
    senderName: 'Анна Иванова',
    type: 'text',
    text: 'Я сделала всю математику, могу помочь!',
    timestamp: Date.now() - 1000 * 60 * 60 * 72,
    status: 'read',
    reactions: [],
  },
];

export default function SearchMessagesScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, 'SearchMessages'>>();
  const insets = useSafeAreaInsets();

  const { chatId } = route.params || {};

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'photos' | 'files' | 'links' | 'voice'>('all');

  const filters = [
    { key: 'all', label: 'Все' },
    { key: 'photos', label: 'Фото' },
    { key: 'files', label: 'Файлы' },
    { key: 'links', label: 'Ссылки' },
    { key: 'voice', label: 'Голосовые' },
  ] as const;

  const filteredResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    let results = MOCK_SEARCH_RESULTS.filter(msg =>
      msg.text.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Фильтр по чату
    if (chatId) {
      results = results.filter(msg => msg.chatId === chatId);
    }

    // Фильтр по типу
    switch (selectedFilter) {
      case 'photos':
        results = results.filter(msg => msg.type === 'image');
        break;
      case 'files':
        results = results.filter(msg => msg.type === 'file');
        break;
      case 'voice':
        results = results.filter(msg => msg.type === 'voice');
        break;
      case 'links':
        results = results.filter(msg => msg.text.includes('http'));
        break;
    }

    return results;
  }, [searchQuery, chatId, selectedFilter]);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Сегодня';
    if (days === 1) return 'Вчера';
    if (days < 7) return `${days} дней назад`;

    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
    });
  };

  const highlightText = (text: string) => {
    if (!searchQuery.trim()) return text;

    const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === searchQuery.toLowerCase() ? (
        <ThemedText key={i} style={{ backgroundColor: theme.primary + '40', fontWeight: '600' }}>
          {part}
        </ThemedText>
      ) : (
        part
      )
    );
  };

  const openMessage = (message: ChatMessage) => {
    // Перейти к сообщению в чате
    navigation.navigate('PrivateChat', {
      chatId: message.chatId,
      chatName: message.senderName,
      highlightMessageId: message.id,
    });
  };

  const renderSearchResult = ({ item }: { item: ChatMessage }) => (
    <Pressable
      style={[styles.resultItem, { backgroundColor: theme.backgroundDefault }]}
      onPress={() => openMessage(item)}
    >
      {/* Аватар отправителя */}
      <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
        <ThemedText style={styles.avatarText}>
          {item.senderName.charAt(0).toUpperCase()}
        </ThemedText>
      </View>

      {/* Контент */}
      <View style={styles.resultContent}>
        <View style={styles.resultHeader}>
          <ThemedText style={styles.senderName}>{item.senderName}</ThemedText>
          <ThemedText style={[styles.resultDate, { color: theme.textSecondary }]}>
            {formatDate(item.timestamp)}
          </ThemedText>
        </View>
        <ThemedText style={[styles.resultText, { color: theme.textSecondary }]} numberOfLines={2}>
          {highlightText(item.text)}
        </ThemedText>
      </View>
    </Pressable>
  );

  return (
    <ThemedView style={styles.container}>
      {/* Хедер с поиском */}
      <View style={[styles.header, { backgroundColor: theme.backgroundDefault, paddingTop: insets.top }]}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color={theme.text} />
        </Pressable>

        <View style={[styles.searchInput, { backgroundColor: theme.backgroundSecondary }]}>
          <Feather name="search" size={18} color={theme.textSecondary} />
          <TextInput
            style={[styles.input, { color: theme.text }]}
            placeholder="Поиск сообщений..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Feather name="x" size={18} color={theme.textSecondary} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Фильтры */}
      <View style={[styles.filters, { backgroundColor: theme.backgroundDefault }]}>
        {filters.map(filter => (
          <Pressable
            key={filter.key}
            style={[
              styles.filterButton,
              selectedFilter === filter.key && { backgroundColor: theme.primary },
            ]}
            onPress={() => setSelectedFilter(filter.key)}
          >
            <ThemedText
              style={[
                styles.filterText,
                { color: selectedFilter === filter.key ? '#FFFFFF' : theme.text },
              ]}
            >
              {filter.label}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      {/* Результаты */}
      {searchQuery.trim() === '' ? (
        <View style={styles.emptyState}>
          <Feather name="search" size={64} color={theme.textSecondary} />
          <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
            Введите текст для поиска
          </ThemedText>
        </View>
      ) : filteredResults.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="inbox" size={64} color={theme.textSecondary} />
          <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
            Ничего не найдено
          </ThemedText>
          <ThemedText style={[styles.emptySubtext, { color: theme.textSecondary }]}>
            Попробуйте изменить запрос
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={filteredResults}
          keyExtractor={item => item.id}
          renderItem={renderSearchResult}
          contentContainerStyle={styles.resultsList}
          ItemSeparatorComponent={() => (
            <View style={[styles.separator, { backgroundColor: theme.backgroundSecondary }]} />
          )}
        />
      )}
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
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  backButton: {
    padding: Spacing.xs,
  },
  searchInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  filterButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  resultsList: {
    padding: Spacing.md,
  },
  resultItem: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  resultContent: {
    flex: 1,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  senderName: {
    fontSize: 16,
    fontWeight: '600',
  },
  resultDate: {
    fontSize: 12,
  },
  resultText: {
    fontSize: 14,
    lineHeight: 20,
  },
  separator: {
    height: 1,
    marginVertical: Spacing.xs,
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
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: Spacing.xs,
  },
});
