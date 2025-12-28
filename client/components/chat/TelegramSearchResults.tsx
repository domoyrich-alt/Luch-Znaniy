/**
 * TELEGRAM SEARCH RESULTS
 * Компонент отображения результатов поиска
 * 
 * Особенности:
 * - Группировка по типу
 * - Подсветка совпадений
 * - Анимированное появление
 * - Приоритет локальных результатов
 * - Плавный merge серверных результатов
 */

import React, { useCallback, useMemo, memo } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Image,
  SectionList,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { 
  useSearchStore, 
  SearchResult, 
  SearchResultType,
  selectGroupedResults,
  selectIsSearching,
  GlobalUser,
  MediaSearchResult,
  InChatSearchResult,
} from '../../store/SearchStore';
import { Chat, Message } from '../../store/ChatStore';
import { ThemedText } from '../ThemedText';

// ==================== ТИПЫ ====================

interface TelegramSearchResultsProps {
  onSelectResult: (result: SearchResult) => void;
  showSections?: boolean;
  emptyComponent?: React.ReactNode;
}

interface ResultItemProps {
  result: SearchResult;
  onPress: () => void;
}

interface HighlightedTextProps {
  text: string;
  highlights?: [number, number][];
  style?: any;
  highlightStyle?: any;
}

// ==================== ПОДСВЕТКА ТЕКСТА ====================

const HighlightedText: React.FC<HighlightedTextProps> = memo(({
  text,
  highlights = [],
  style,
  highlightStyle,
}) => {
  if (!highlights.length) {
    return <ThemedText style={style} numberOfLines={1}>{text}</ThemedText>;
  }
  
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  
  // Сортируем highlights по позиции
  const sortedHighlights = [...highlights].sort((a, b) => a[0] - b[0]);
  
  sortedHighlights.forEach(([start, end], index) => {
    // Текст до highlight
    if (start > lastIndex) {
      parts.push(
        <ThemedText key={`text-${index}`} style={style}>
          {text.slice(lastIndex, start)}
        </ThemedText>
      );
    }
    
    // Highlighted текст
    parts.push(
      <ThemedText
        key={`highlight-${index}`}
        style={[style, styles.highlight, highlightStyle]}
      >
        {text.slice(start, end)}
      </ThemedText>
    );
    
    lastIndex = end;
  });
  
  // Оставшийся текст
  if (lastIndex < text.length) {
    parts.push(
      <ThemedText key="text-end" style={style}>
        {text.slice(lastIndex)}
      </ThemedText>
    );
  }
  
  return (
    <ThemedText style={style} numberOfLines={1}>
      {parts}
    </ThemedText>
  );
});

// ==================== АВАТАР ====================

const Avatar: React.FC<{
  url?: string;
  name: string;
  size?: number;
  type?: 'user' | 'chat' | 'channel' | 'bot';
}> = memo(({ url, name, size = 50, type = 'user' }) => {
  const initials = name
    .split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  
  const backgroundColor = useMemo(() => {
    // Цвет на основе имени
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
      '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  }, [name]);
  
  const iconName: keyof typeof Feather.glyphMap = 
    type === 'channel' ? 'hash' : 
    type === 'bot' ? 'cpu' : 
    'user';
  
  if (url) {
    return (
      <Image
        source={{ uri: url }}
        style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
      />
    );
  }
  
  return (
    <View
      style={[
        styles.avatarPlaceholder,
        { width: size, height: size, borderRadius: size / 2, backgroundColor },
      ]}
    >
      {type === 'user' || type === 'chat' ? (
        <ThemedText style={[styles.avatarInitials, { fontSize: size * 0.4 }]}>
          {initials}
        </ThemedText>
      ) : (
        <Feather name={iconName} size={size * 0.4} color="#fff" />
      )}
    </View>
  );
});

// ==================== РЕЗУЛЬТАТ: ЧАТ ====================

const ChatResultItem: React.FC<ResultItemProps> = memo(({ result, onPress }) => {
  const chat = result.chat!;
  const highlight = result.highlights?.find(h => h.field === 'name');
  
  return (
    <TouchableOpacity style={styles.resultItem} onPress={onPress} activeOpacity={0.7}>
      <Avatar
        url={chat.avatarUrl}
        name={chat.name}
        type={chat.type === 'channel' ? 'channel' : 'chat'}
      />
      <View style={styles.resultContent}>
        <View style={styles.resultHeader}>
          <HighlightedText
            text={chat.name}
            highlights={highlight?.indices}
            style={styles.resultTitle}
          />
          {chat.isPinned && (
            <Feather name="bookmark" size={14} color="#8E8E93" style={styles.pinnedIcon} />
          )}
        </View>
        
        {chat.username && (
          <ThemedText style={styles.resultSubtitle}>@{chat.username}</ThemedText>
        )}
        
        {chat.lastMessage?.text && (
          <ThemedText style={styles.resultPreview} numberOfLines={1}>
            {chat.lastMessage.text}
          </ThemedText>
        )}
      </View>
      
      {result.source === 'local' && (
        <View style={styles.sourceIndicator}>
          <View style={styles.localDot} />
        </View>
      )}
      
      {chat.unreadCount > 0 && (
        <View style={[styles.badge, chat.isMuted && styles.badgeMuted]}>
          <ThemedText style={styles.badgeText}>
            {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
          </ThemedText>
        </View>
      )}
    </TouchableOpacity>
  );
});

// ==================== РЕЗУЛЬТАТ: СООБЩЕНИЕ ====================

const MessageResultItem: React.FC<ResultItemProps> = memo(({ result, onPress }) => {
  const message = result.message!;
  const chat = result.chat;
  const highlight = result.highlights?.find(h => h.field === 'text');
  
  const formattedDate = useMemo(() => {
    const date = new Date(message.createdAt);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Вчера';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
  }, [message.createdAt]);
  
  return (
    <TouchableOpacity style={styles.resultItem} onPress={onPress} activeOpacity={0.7}>
      <Avatar
        url={chat?.avatarUrl}
        name={chat?.name || message.senderName || 'Chat'}
      />
      <View style={styles.resultContent}>
        <View style={styles.resultHeader}>
          <ThemedText style={styles.resultTitle}>
            {chat?.name || 'Chat'}
          </ThemedText>
          <ThemedText style={styles.resultDate}>{formattedDate}</ThemedText>
        </View>
        
        <ThemedText style={styles.resultSender} numberOfLines={1}>
          {message.senderName}:
        </ThemedText>
        
        <HighlightedText
          text={message.text || ''}
          highlights={highlight?.indices}
          style={styles.resultPreview}
        />
      </View>
      
      <Feather name="chevron-right" size={16} color="#C7C7CC" />
    </TouchableOpacity>
  );
});

// ==================== РЕЗУЛЬТАТ: ПОЛЬЗОВАТЕЛЬ (ГЛОБАЛЬНЫЙ) ====================

const UserResultItem: React.FC<ResultItemProps> = memo(({ result, onPress }) => {
  const user = result.user!;
  const highlight = result.highlights?.find(h => h.field === 'username');
  
  return (
    <TouchableOpacity style={styles.resultItem} onPress={onPress} activeOpacity={0.7}>
      <Avatar
        url={user.avatarUrl}
        name={user.firstName + (user.lastName ? ` ${user.lastName}` : '')}
        type={user.type}
      />
      <View style={styles.resultContent}>
        <View style={styles.resultHeader}>
          <ThemedText style={styles.resultTitle}>
            {user.firstName} {user.lastName}
          </ThemedText>
          {user.isVerified && (
            <Feather name="check-circle" size={14} color="#007AFF" style={styles.verifiedIcon} />
          )}
        </View>
        
        {user.username && (
          <HighlightedText
            text={`@${user.username}`}
            highlights={highlight?.indices.map(([start, end]) => [start + 1, end + 1])}
            style={styles.resultSubtitle}
          />
        )}
        
        {user.bio && (
          <ThemedText style={styles.resultPreview} numberOfLines={1}>
            {user.bio}
          </ThemedText>
        )}
        
        {user.subscribersCount !== undefined && user.subscribersCount > 0 && (
          <ThemedText style={styles.subscribersText}>
            {formatSubscribers(user.subscribersCount)} подписчиков
          </ThemedText>
        )}
      </View>
      
      {!user.canMessage && (
        <View style={styles.cantMessageBadge}>
          <Feather name="lock" size={12} color="#8E8E93" />
        </View>
      )}
      
      {result.source === 'global' && (
        <View style={styles.sourceIndicator}>
          <Feather name="globe" size={12} color="#8E8E93" />
        </View>
      )}
    </TouchableOpacity>
  );
});

// ==================== КОМПОНЕНТ СЕКЦИИ ====================

const SectionHeader: React.FC<{ title: string; count: number }> = memo(({ title, count }) => (
  <View style={styles.sectionHeader}>
    <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
    <ThemedText style={styles.sectionCount}>{count}</ThemedText>
  </View>
));

// ==================== ОСНОВНОЙ КОМПОНЕНТ ====================

export const TelegramSearchResults: React.FC<TelegramSearchResultsProps> = ({
  onSelectResult,
  showSections = true,
  emptyComponent,
}) => {
  const { 
    mergedResults, 
    state, 
    query,
    isLocalSearching,
    isServerSearching,
    isGlobalSearching,
  } = useSearchStore();
  
  const groupedResults = useSearchStore(selectGroupedResults);
  const isSearching = useSearchStore(selectIsSearching);
  
  // Секции для SectionList
  const sections = useMemo(() => {
    const sectionData: { title: string; data: SearchResult[]; type: SearchResultType }[] = [];
    
    const sectionConfig: { type: SearchResultType; title: string }[] = [
      { type: 'chat', title: 'Чаты' },
      { type: 'contact', title: 'Контакты' },
      { type: 'user', title: 'Люди' },
      { type: 'channel', title: 'Каналы' },
      { type: 'bot', title: 'Боты' },
      { type: 'message', title: 'Сообщения' },
    ];
    
    for (const config of sectionConfig) {
      const results = groupedResults[config.type];
      if (results && results.length > 0) {
        sectionData.push({
          title: config.title,
          data: results,
          type: config.type,
        });
      }
    }
    
    return sectionData;
  }, [groupedResults]);
  
  // Обработчик нажатия
  const handlePress = useCallback((result: SearchResult) => {
    Haptics.selectionAsync();
    onSelectResult(result);
  }, [onSelectResult]);
  
  // Рендер элемента
  const renderItem = useCallback(({ item }: { item: SearchResult }) => {
    const handleItemPress = () => handlePress(item);
    
    switch (item.type) {
      case 'chat':
      case 'contact':
        return <ChatResultItem result={item} onPress={handleItemPress} />;
      
      case 'message':
        return <MessageResultItem result={item} onPress={handleItemPress} />;
      
      case 'user':
      case 'channel':
      case 'bot':
        return <UserResultItem result={item} onPress={handleItemPress} />;
      
      default:
        return null;
    }
  }, [handlePress]);
  
  // Рендер заголовка секции
  const renderSectionHeader = useCallback(({ section }: { section: { title: string; data: SearchResult[] } }) => (
    <SectionHeader title={section.title} count={section.data.length} />
  ), []);
  
  // Key extractor
  const keyExtractor = useCallback((item: SearchResult) => item.id, []);
  
  // Пустое состояние
  if (state === 'no_results' && query.length > 0) {
    return (
      <View style={styles.emptyContainer}>
        {emptyComponent || (
          <>
            <Feather name="search" size={48} color="#C7C7CC" />
            <ThemedText style={styles.emptyTitle}>Ничего не найдено</ThemedText>
            <ThemedText style={styles.emptySubtitle}>
              По запросу «{query}» ничего не найдено.{'\n'}
              Попробуйте изменить запрос.
            </ThemedText>
          </>
        )}
      </View>
    );
  }
  
  // Начальное состояние
  if (state === 'idle' || mergedResults.length === 0) {
    return null;
  }
  
  // С секциями
  if (showSections && sections.length > 1) {
    return (
      <SectionList
        sections={sections}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        keyExtractor={keyExtractor}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        windowSize={5}
        ListFooterComponent={
          isSearching ? (
            <View style={styles.loadingFooter}>
              <ThemedText style={styles.loadingText}>
                {isServerSearching ? 'Поиск на сервере...' : 
                 isGlobalSearching ? 'Глобальный поиск...' : 
                 'Поиск...'}
              </ThemedText>
            </View>
          ) : null
        }
      />
    );
  }
  
  // Без секций (плоский список)
  return (
    <FlatList
      data={mergedResults}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      style={styles.list}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      initialNumToRender={15}
      maxToRenderPerBatch={10}
      windowSize={5}
      ListFooterComponent={
        isSearching ? (
          <View style={styles.loadingFooter}>
            <ThemedText style={styles.loadingText}>Загрузка...</ThemedText>
          </View>
        ) : null
      }
    />
  );
};

// ==================== УТИЛИТЫ ====================

function formatSubscribers(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

// ==================== СТИЛИ ====================

const styles = StyleSheet.create({
  list: {
    flex: 1,
    backgroundColor: '#fff',
  },
  listContent: {
    paddingBottom: 20,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  resultContent: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    flex: 1,
  },
  resultSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  resultPreview: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  resultDate: {
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 8,
  },
  resultSender: {
    fontSize: 14,
    color: '#007AFF',
    marginTop: 2,
  },
  highlight: {
    backgroundColor: 'rgba(255, 204, 0, 0.4)',
    color: '#000',
  },
  avatar: {
    backgroundColor: '#E5E5EA',
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#fff',
    fontWeight: '600',
  },
  badge: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeMuted: {
    backgroundColor: '#8E8E93',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  pinnedIcon: {
    marginLeft: 4,
  },
  verifiedIcon: {
    marginLeft: 4,
  },
  sourceIndicator: {
    marginLeft: 8,
  },
  localDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34C759',
  },
  cantMessageBadge: {
    padding: 4,
  },
  subscribersText: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F2F2F7',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
  },
  sectionCount: {
    fontSize: 13,
    color: '#8E8E93',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  loadingFooter: {
    padding: 16,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#8E8E93',
  },
});

export default TelegramSearchResults;
