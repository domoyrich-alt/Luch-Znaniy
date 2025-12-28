/**
 * TELEGRAM SEARCH BAR
 * Универсальная строка поиска с live input
 * 
 * Особенности:
 * - Debounce 200ms
 * - Отмена поиска
 * - Фильтры
 * - История поиска
 * - Анимированное появление
 */

import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Pressable,
  Keyboard,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSearchStore, SearchScope, MediaFilter } from '../../store/SearchStore';
import { ThemedText } from '../ThemedText';

interface TelegramSearchBarProps {
  placeholder?: string;
  autoFocus?: boolean;
  showFilters?: boolean;
  showCancel?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  onCancel?: () => void;
  style?: any;
}

const FILTERS: { key: SearchScope; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { key: 'all', label: 'Все', icon: 'search' },
  { key: 'chats', label: 'Чаты', icon: 'message-circle' },
  { key: 'messages', label: 'Сообщения', icon: 'file-text' },
  { key: 'contacts', label: 'Контакты', icon: 'users' },
  { key: 'media', label: 'Медиа', icon: 'image' },
];

const MEDIA_FILTERS: { key: MediaFilter; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { key: 'all', label: 'Все', icon: 'grid' },
  { key: 'photo', label: 'Фото', icon: 'image' },
  { key: 'video', label: 'Видео', icon: 'video' },
  { key: 'file', label: 'Файлы', icon: 'file' },
  { key: 'voice', label: 'Голосовые', icon: 'mic' },
  { key: 'link', label: 'Ссылки', icon: 'link' },
];

export const TelegramSearchBar: React.FC<TelegramSearchBarProps> = ({
  placeholder = 'Поиск',
  autoFocus = false,
  showFilters = false,
  showCancel = true,
  onFocus,
  onBlur,
  onCancel,
  style,
}) => {
  const inputRef = useRef<TextInput>(null);
  
  // Store
  const {
    query,
    setQuery,
    scope,
    setScope,
    mediaFilter,
    setMediaFilter,
    state,
    clearSearch,
    recentSearches,
  } = useSearchStore();
  
  // Анимации
  const focusAnim = useRef(new Animated.Value(0)).current;
  const [isFocused, setIsFocused] = useState(false);
  const [showRecentSearches, setShowRecentSearches] = useState(false);
  
  // Фокус при autoFocus
  useEffect(() => {
    if (autoFocus) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [autoFocus]);
  
  // Анимация фокуса
  useEffect(() => {
    Animated.spring(focusAnim, {
      toValue: isFocused ? 1 : 0,
      useNativeDriver: false,
      tension: 100,
      friction: 10,
    }).start();
  }, [isFocused]);
  
  // Обработчики
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    setShowRecentSearches(query.length === 0);
    onFocus?.();
    Haptics.selectionAsync();
  }, [query, onFocus]);
  
  const handleBlur = useCallback(() => {
    setIsFocused(false);
    setShowRecentSearches(false);
    onBlur?.();
  }, [onBlur]);
  
  const handleChangeText = useCallback((text: string) => {
    setQuery(text);
    setShowRecentSearches(text.length === 0 && isFocused);
  }, [setQuery, isFocused]);
  
  const handleClear = useCallback(() => {
    clearSearch();
    inputRef.current?.focus();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [clearSearch]);
  
  const handleCancel = useCallback(() => {
    clearSearch();
    Keyboard.dismiss();
    onCancel?.();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [clearSearch, onCancel]);
  
  const handleSelectRecentSearch = useCallback((recentQuery: string) => {
    setQuery(recentQuery);
    setShowRecentSearches(false);
  }, [setQuery]);
  
  const handleSelectFilter = useCallback((filter: SearchScope) => {
    setScope(filter);
    Haptics.selectionAsync();
  }, [setScope]);
  
  const handleSelectMediaFilter = useCallback((filter: MediaFilter) => {
    setMediaFilter(filter);
    Haptics.selectionAsync();
  }, [setMediaFilter]);
  
  // Анимированные стили
  const containerWidth = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['100%', showCancel ? '85%' : '100%'],
  });
  
  const cancelOpacity = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  
  const cancelTranslateX = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });
  
  // Индикатор загрузки
  const isSearching = state === 'searching' || state === 'typing';
  
  return (
    <View style={[styles.wrapper, style]}>
      <View style={styles.row}>
        <Animated.View style={[styles.container, { width: containerWidth }]}>
          <View style={styles.inputWrapper}>
            {/* Иконка поиска / загрузка */}
            <View style={styles.iconContainer}>
              {isSearching ? (
                <Animated.View
                  style={[
                    styles.loadingIndicator,
                    {
                      transform: [{
                        rotate: focusAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '360deg'],
                        }),
                      }],
                    },
                  ]}
                >
                  <Feather name="loader" size={18} color="#8E8E93" />
                </Animated.View>
              ) : (
                <Feather name="search" size={18} color="#8E8E93" />
              )}
            </View>
            
            {/* Поле ввода */}
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder={placeholder}
              placeholderTextColor="#8E8E93"
              value={query}
              onChangeText={handleChangeText}
              onFocus={handleFocus}
              onBlur={handleBlur}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              clearButtonMode="never"
              selectionColor="#007AFF"
            />
            
            {/* Кнопка очистки */}
            {query.length > 0 && (
              <TouchableOpacity
                onPress={handleClear}
                style={styles.clearButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <View style={styles.clearIcon}>
                  <Feather name="x" size={12} color="#fff" />
                </View>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
        
        {/* Кнопка отмены */}
        {showCancel && (
          <Animated.View
            style={[
              styles.cancelContainer,
              {
                opacity: cancelOpacity,
                transform: [{ translateX: cancelTranslateX }],
              },
            ]}
          >
            <TouchableOpacity onPress={handleCancel}>
              <ThemedText style={styles.cancelText}>Отмена</ThemedText>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
      
      {/* Фильтры поиска */}
      {showFilters && isFocused && (
        <Animated.View
          style={[
            styles.filtersContainer,
            { opacity: focusAnim },
          ]}
        >
          <Animated.ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersContent}
          >
            {FILTERS.map((filter) => (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterChip,
                  scope === filter.key && styles.filterChipActive,
                ]}
                onPress={() => handleSelectFilter(filter.key)}
              >
                <Feather
                  name={filter.icon}
                  size={14}
                  color={scope === filter.key ? '#fff' : '#007AFF'}
                />
                <ThemedText
                  style={[
                    styles.filterChipText,
                    scope === filter.key && styles.filterChipTextActive,
                  ]}
                >
                  {filter.label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </Animated.ScrollView>
          
          {/* Медиа фильтры */}
          {scope === 'media' && (
            <Animated.ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filtersContent}
              style={styles.mediaFilters}
            >
              {MEDIA_FILTERS.map((filter) => (
                <TouchableOpacity
                  key={filter.key}
                  style={[
                    styles.filterChip,
                    styles.filterChipSmall,
                    mediaFilter === filter.key && styles.filterChipActive,
                  ]}
                  onPress={() => handleSelectMediaFilter(filter.key)}
                >
                  <Feather
                    name={filter.icon}
                    size={12}
                    color={mediaFilter === filter.key ? '#fff' : '#007AFF'}
                  />
                  <ThemedText
                    style={[
                      styles.filterChipText,
                      styles.filterChipTextSmall,
                      mediaFilter === filter.key && styles.filterChipTextActive,
                    ]}
                  >
                    {filter.label}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </Animated.ScrollView>
          )}
        </Animated.View>
      )}
      
      {/* Недавние поиски */}
      {showRecentSearches && recentSearches.length > 0 && (
        <View style={styles.recentContainer}>
          <View style={styles.recentHeader}>
            <ThemedText style={styles.recentTitle}>Недавние</ThemedText>
            <TouchableOpacity onPress={() => useSearchStore.getState().clearHistory()}>
              <ThemedText style={styles.clearHistoryText}>Очистить</ThemedText>
            </TouchableOpacity>
          </View>
          {recentSearches.slice(0, 5).map((recentQuery, index) => (
            <TouchableOpacity
              key={index}
              style={styles.recentItem}
              onPress={() => handleSelectRecentSearch(recentQuery)}
            >
              <Feather name="clock" size={16} color="#8E8E93" />
              <ThemedText style={styles.recentItemText}>{recentQuery}</ThemedText>
              <Feather name="arrow-up-left" size={16} color="#8E8E93" />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#000000', // ЧЁРНЫЙ фон
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  container: {
    height: 36,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E', // Тёмно-серый инпут
    borderRadius: 10,
    paddingHorizontal: 8,
    height: 36,
  },
  iconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingIndicator: {
    width: 18,
    height: 18,
  },
  input: {
    flex: 1,
    fontSize: 17,
    color: '#FFFFFF', // Белый текст
    paddingVertical: 0,
    marginLeft: 4,
  },
  clearButton: {
    padding: 4,
  },
  clearIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#8E8E93',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelContainer: {
    marginLeft: 12,
  },
  cancelText: {
    fontSize: 17,
    color: '#007AFF',
  },
  filtersContainer: {
    paddingBottom: 8,
    backgroundColor: '#000000', // Чёрный фон фильтров
  },
  filtersContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#2C2C2E', // Тёмно-серый чип
    gap: 4,
  },
  filterChipSmall: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  filterChipActive: {
    backgroundColor: '#007AFF',
  },
  filterChipText: {
    fontSize: 14,
    color: '#007AFF',
  },
  filterChipTextSmall: {
    fontSize: 12,
  },
  filterChipTextActive: {
    color: '#fff',
  },
  mediaFilters: {
    marginTop: 8,
  },
  recentContainer: {
    backgroundColor: '#1C1C1E', // Тёмный фон истории
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  recentTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
  },
  clearHistoryText: {
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
  recentItemText: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF', // Белый текст истории
  },
});

export default TelegramSearchBar;
