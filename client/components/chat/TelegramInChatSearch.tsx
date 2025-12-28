/**
 * TELEGRAM IN-CHAT SEARCH
 * Поиск внутри конкретного чата
 * 
 * Особенности:
 * - Навигация по результатам (стрелки вверх/вниз)
 * - Счётчик результатов
 * - Прыжки к сообщениям
 * - Подсветка текущего результата
 */

import React, { useCallback, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Keyboard,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { 
  useSearchStore, 
  selectCurrentInChatResult,
} from '../../store/SearchStore';
import { ThemedText } from '../ThemedText';

interface TelegramInChatSearchProps {
  chatId: string;
  onClose: () => void;
  onJumpToMessage: (messageId: string) => void;
}

export const TelegramInChatSearch: React.FC<TelegramInChatSearchProps> = ({
  chatId,
  onClose,
  onJumpToMessage,
}) => {
  const inputRef = useRef<TextInput>(null);
  const slideAnim = useRef(new Animated.Value(-60)).current;
  
  // Store
  const {
    query,
    setQuery,
    setCurrentChatId,
    searchInChat,
    inChatResults,
    currentInChatIndex,
    navigateInChatPrev,
    navigateInChatNext,
    clearSearch,
  } = useSearchStore();
  
  const currentResult = useSearchStore(selectCurrentInChatResult);
  
  // Инициализация
  useEffect(() => {
    setCurrentChatId(chatId);
    
    // Анимация появления
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
    
    // Фокус на input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    
    return () => {
      setCurrentChatId(undefined);
      clearSearch();
    };
  }, [chatId]);
  
  // Прыжок к сообщению при изменении текущего результата
  useEffect(() => {
    if (currentResult) {
      onJumpToMessage(currentResult.messageId);
    }
  }, [currentResult, onJumpToMessage]);
  
  // Обработчики
  const handleChangeText = useCallback((text: string) => {
    setQuery(text);
    if (text.length >= 2) {
      searchInChat(chatId, text);
    }
  }, [chatId, setQuery, searchInChat]);
  
  const handlePrev = useCallback(() => {
    navigateInChatPrev();
    Haptics.selectionAsync();
  }, [navigateInChatPrev]);
  
  const handleNext = useCallback(() => {
    navigateInChatNext();
    Haptics.selectionAsync();
  }, [navigateInChatNext]);
  
  const handleClose = useCallback(() => {
    Keyboard.dismiss();
    
    // Анимация скрытия
    Animated.timing(slideAnim, {
      toValue: -60,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [onClose, slideAnim]);
  
  const handleClear = useCallback(() => {
    setQuery('');
    inputRef.current?.focus();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [setQuery]);
  
  // Рендер счётчика
  const renderCounter = () => {
    if (query.length < 2) {
      return null;
    }
    
    if (inChatResults.length === 0) {
      return (
        <ThemedText style={styles.counterText}>
          Не найдено
        </ThemedText>
      );
    }
    
    return (
      <ThemedText style={styles.counterText}>
        {currentInChatIndex + 1} из {inChatResults.length}
      </ThemedText>
    );
  };
  
  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={styles.searchRow}>
        {/* Поле ввода */}
        <View style={styles.inputContainer}>
          <Feather name="search" size={18} color="#8E8E93" />
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Поиск в чате"
            placeholderTextColor="#8E8E93"
            value={query}
            onChangeText={handleChangeText}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            selectionColor="#007AFF"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
              <View style={styles.clearIcon}>
                <Feather name="x" size={10} color="#fff" />
              </View>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Счётчик */}
        <View style={styles.counterContainer}>
          {renderCounter()}
        </View>
        
        {/* Навигация */}
        <View style={styles.navigationContainer}>
          <TouchableOpacity
            onPress={handlePrev}
            style={[
              styles.navButton,
              (inChatResults.length === 0 || currentInChatIndex === 0) && styles.navButtonDisabled,
            ]}
            disabled={inChatResults.length === 0 || currentInChatIndex === 0}
          >
            <Feather
              name="chevron-up"
              size={22}
              color={inChatResults.length === 0 || currentInChatIndex === 0 ? '#C7C7CC' : '#007AFF'}
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={handleNext}
            style={[
              styles.navButton,
              (inChatResults.length === 0 || currentInChatIndex === inChatResults.length - 1) && styles.navButtonDisabled,
            ]}
            disabled={inChatResults.length === 0 || currentInChatIndex === inChatResults.length - 1}
          >
            <Feather
              name="chevron-down"
              size={22}
              color={inChatResults.length === 0 || currentInChatIndex === inChatResults.length - 1 ? '#C7C7CC' : '#007AFF'}
            />
          </TouchableOpacity>
        </View>
        
        {/* Кнопка закрытия */}
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <ThemedText style={styles.closeText}>Готово</ThemedText>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F2F2F7',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(142, 142, 147, 0.12)',
    borderRadius: 10,
    paddingHorizontal: 8,
    height: 36,
    gap: 6,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
  },
  clearIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#8E8E93',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterContainer: {
    minWidth: 60,
    alignItems: 'center',
  },
  counterText: {
    fontSize: 13,
    color: '#8E8E93',
  },
  navigationContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  navButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  closeButton: {
    paddingHorizontal: 8,
  },
  closeText: {
    fontSize: 17,
    color: '#007AFF',
    fontWeight: '500',
  },
});

export default TelegramInChatSearch;
