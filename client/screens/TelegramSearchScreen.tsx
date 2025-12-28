/**
 * TELEGRAM SEARCH SCREEN
 * Полноценный экран поиска как в Telegram
 * 
 * Объединяет:
 * - Строку поиска с debounce
 * - Фильтры по типу
 * - Результаты с группировкой
 * - Недавние поиски
 * - Глобальный поиск по @username
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  SafeAreaView,
  StatusBar,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useSearchStore, SearchResult } from '../store/SearchStore';
import { useChatStore } from '../store/ChatStore';
import { TelegramSearchBar } from '../components/chat/TelegramSearchBar';
import { TelegramSearchResults } from '../components/chat/TelegramSearchResults';
import { ThemedText } from '../components/ThemedText';

export const TelegramSearchScreen: React.FC = () => {
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // Store
  const { 
    state, 
    query, 
    clearSearch,
    recentSearches,
    setQuery,
  } = useSearchStore();
  
  const { selectChat, setUIState } = useChatStore();
  
  // Анимация появления
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, []);
  
  // Обработчик выбора результата
  const handleSelectResult = useCallback((result: SearchResult) => {
    Haptics.selectionAsync();
    
    // Закрываем клавиатуру
    Keyboard.dismiss();
    
    switch (result.type) {
      case 'chat':
      case 'contact':
        if (result.chat) {
          selectChat(result.chat.id);
          (navigation as any).navigate('TelegramChat', { chatId: result.chat.id });
        }
        break;
      
      case 'message':
        if (result.message) {
          selectChat(result.message.chatId);
          setUIState('chat_selected', { 
            selectedChatId: result.message.chatId,
            selectedMessageId: result.message.id,
          });
          (navigation as any).navigate('TelegramChat', { 
            chatId: result.message.chatId,
            highlightMessageId: result.message.id,
          });
        }
        break;
      
      case 'user':
      case 'channel':
      case 'bot':
        if (result.user) {
          Alert.alert(
            'Профиль',
            'Открытие профиля из поиска пока в разработке.'
          );
        }
        break;
    }
  }, [selectChat, setUIState, navigation]);
  
  // Обработчик отмены
  const handleCancel = useCallback(() => {
    clearSearch();
    navigation.goBack();
  }, [clearSearch, navigation]);
  
  // Обработчик выбора недавнего поиска
  const handleSelectRecentSearch = useCallback((recentQuery: string) => {
    setQuery(recentQuery);
    Haptics.selectionAsync();
  }, [setQuery]);
  
  // Обработчик очистки истории
  const handleClearHistory = useCallback(() => {
    useSearchStore.getState().clearHistory();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />
      
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Строка поиска */}
        <TelegramSearchBar
          autoFocus
          showFilters
          showCancel
          onCancel={handleCancel}
          placeholder="Поиск сообщений и чатов"
        />
        
        {/* Контент */}
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.resultsContainer}>
            {/* Недавние поиски (если нет запроса) */}
            {query.length === 0 && recentSearches.length > 0 && (
              <View style={styles.recentSection}>
                <View style={styles.recentHeader}>
                  <ThemedText style={styles.recentTitle}>Недавние поиски</ThemedText>
                  <ThemedText 
                    style={styles.clearButton} 
                    onPress={handleClearHistory}
                  >
                    Очистить
                  </ThemedText>
                </View>
                
                {recentSearches.slice(0, 5).map((recentQuery, index) => (
                  <RecentSearchItem
                    key={index}
                    query={recentQuery}
                    onPress={() => handleSelectRecentSearch(recentQuery)}
                  />
                ))}
              </View>
            )}
            
            {/* Подсказки (если короткий запрос) */}
            {query.length > 0 && query.length < 3 && state === 'typing' && (
              <View style={styles.hintContainer}>
                <ThemedText style={styles.hintText}>
                  Введите минимум 3 символа для поиска
                </ThemedText>
              </View>
            )}
            
            {/* Результаты поиска */}
            {query.length >= 2 && (
              <TelegramSearchResults
                onSelectResult={handleSelectResult}
                showSections
              />
            )}
            
            {/* Начальное состояние */}
            {query.length === 0 && recentSearches.length === 0 && (
              <View style={styles.emptyState}>
                <ThemedText style={styles.emptyTitle}>Поиск</ThemedText>
                <ThemedText style={styles.emptySubtitle}>
                  Ищите сообщения, чаты, контакты{'\n'}
                  и людей по @username
                </ThemedText>
              </View>
            )}
          </View>
        </TouchableWithoutFeedback>
      </Animated.View>
    </SafeAreaView>
  );
};

// ==================== КОМПОНЕНТ НЕДАВНЕГО ПОИСКА ====================

interface RecentSearchItemProps {
  query: string;
  onPress: () => void;
}

const RecentSearchItem: React.FC<RecentSearchItemProps> = ({ query, onPress }) => {
  const handleRemove = useCallback(() => {
    const { recentSearches } = useSearchStore.getState();
    const filtered = recentSearches.filter(q => q !== query);
    useSearchStore.setState({ recentSearches: filtered });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [query]);
  
  return (
    <View style={styles.recentItem}>
      <View style={styles.recentIcon}>
        <View style={styles.clockIcon}>
          {/* Иконка часов */}
        </View>
      </View>
      
      <ThemedText style={styles.recentQuery} onPress={onPress}>
        {query}
      </ThemedText>
      
      <ThemedText style={styles.removeButton} onPress={handleRemove}>
        ×
      </ThemedText>
    </View>
  );
};

// ==================== СТИЛИ ====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  content: {
    flex: 1,
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  recentSection: {
    paddingTop: 16,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  recentTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
  },
  clearButton: {
    fontSize: 13,
    color: '#007AFF',
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  recentIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clockIcon: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#8E8E93',
  },
  recentQuery: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  removeButton: {
    fontSize: 22,
    color: '#8E8E93',
    paddingHorizontal: 8,
  },
  hintContainer: {
    padding: 20,
    alignItems: 'center',
  },
  hintText: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000',
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
});

export default TelegramSearchScreen;
