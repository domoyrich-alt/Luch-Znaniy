/**
 * TELEGRAM-LIKE SEARCH STATE MACHINE
 * Поиск как в Telegram: локальный → серверный → глобальный
 * 
 * Один UI, под капотом — диспетчер поисков:
 * - Локальный (0 мс) — кэш, контакты, недавние
 * - Серверный (async) — старые сообщения, чаты вне кэша
 * - Глобальный — @username, каналы, боты
 * - Внутри чата — координаты в истории
 * - По медиа — фильтры по типу
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Chat, Message, MediaType, useChatStore } from './ChatStore';
import { apiFetch } from '../lib/api';

// ==================== ТИПЫ ПОИСКА ====================

export type SearchScope = 
  | 'all'           // Всё (локальный + серверный + глобальный)
  | 'chats'         // Только чаты
  | 'messages'      // Только сообщения
  | 'contacts'      // Только контакты
  | 'media'         // Только медиа
  | 'in_chat';      // Внутри конкретного чата

export type MediaFilter = 'all' | 'photo' | 'video' | 'file' | 'voice' | 'link';

export type SearchResultType = 
  | 'chat'          // Чат
  | 'contact'       // Контакт
  | 'message'       // Сообщение
  | 'user'          // Пользователь (глобальный)
  | 'channel'       // Канал
  | 'bot';          // Бот

export interface SearchResult {
  id: string;
  type: SearchResultType;
  source: 'local' | 'server' | 'global';
  score: number;           // Ранг для сортировки
  
  // Данные результата
  chat?: Chat;
  message?: Message;
  user?: GlobalUser;
  
  // Подсветка совпадений
  highlights?: {
    field: string;
    indices: [number, number][];
  }[];
  
  // Метаданные
  matchedField?: string;   // Где найдено совпадение
  isRecent?: boolean;      // Недавний результат
  timestamp?: number;
}

export interface GlobalUser {
  id: number;
  username?: string;
  firstName: string;
  lastName?: string;
  avatarUrl?: string;
  type: 'user' | 'bot' | 'channel';
  isVerified?: boolean;
  subscribersCount?: number;
  bio?: string;
  // Доступность
  canMessage: boolean;     // Можно написать
  isBlocked: boolean;      // Заблокировал тебя
  isPrivate: boolean;      // Скрытый профиль
}

export interface MediaSearchResult {
  id: string;
  chatId: string;
  messageId: string;
  mediaType: MediaType;
  mediaUrl: string;
  fileName?: string;
  fileSize?: number;
  duration?: number;
  thumbnailUrl?: string;
  timestamp: number;
  senderName?: string;
}

export interface InChatSearchResult {
  messageId: string;
  position: number;        // Позиция в истории
  text?: string;
  highlights: [number, number][];
  timestamp: number;
}

// ==================== СОСТОЯНИЕ ПОИСКА ====================

export type SearchState = 
  | 'idle'           // Ожидание
  | 'typing'         // Ввод (локальный поиск)
  | 'searching'      // Серверный поиск
  | 'results'        // Есть результаты
  | 'no_results';    // Ничего не найдено

interface SearchStoreState {
  // Основное состояние
  state: SearchState;
  query: string;
  scope: SearchScope;
  
  // Контекст
  currentChatId?: string;  // Для поиска внутри чата
  mediaFilter: MediaFilter;
  
  // Результаты по источникам
  localResults: SearchResult[];
  serverResults: SearchResult[];
  globalResults: SearchResult[];
  
  // Объединённые результаты
  mergedResults: SearchResult[];
  
  // Поиск внутри чата
  inChatResults: InChatSearchResult[];
  currentInChatIndex: number;
  
  // Медиа поиск
  mediaResults: MediaSearchResult[];
  
  // Состояние загрузки
  isLocalSearching: boolean;
  isServerSearching: boolean;
  isGlobalSearching: boolean;
  
  // Кэш
  recentSearches: string[];
  searchHistory: Map<string, SearchResult[]>;
  
  // Debounce
  lastQueryTime: number;
  pendingQuery?: string;
}

interface SearchStoreActions {
  // Основные действия поиска
  setQuery: (query: string) => void;
  setScope: (scope: SearchScope) => void;
  setMediaFilter: (filter: MediaFilter) => void;
  setCurrentChatId: (chatId?: string) => void;
  
  // Поиск
  search: (query: string) => Promise<void>;
  searchLocal: (query: string) => void;
  searchServer: (query: string) => Promise<void>;
  searchGlobal: (query: string) => Promise<void>;
  searchInChat: (chatId: string, query: string) => Promise<void>;
  searchMedia: (chatId: string, filter: MediaFilter) => Promise<void>;
  
  // Навигация по результатам
  navigateToResult: (resultId: string) => void;
  navigateInChatPrev: () => void;
  navigateInChatNext: () => void;
  jumpToInChatResult: (index: number) => void;
  
  // Очистка
  clearSearch: () => void;
  clearResults: () => void;
  
  // История
  addToHistory: (query: string) => void;
  clearHistory: () => void;
  getRecentSearches: () => string[];
  
  // Утилиты
  mergeResults: () => void;
  rankResults: (results: SearchResult[]) => SearchResult[];
  tokenize: (text: string) => string[];
  matchPrefix: (text: string, query: string) => boolean;
  calculateScore: (result: SearchResult, query: string) => number;
}

type SearchStore = SearchStoreState & SearchStoreActions;

// ==================== КОНСТАНТЫ ====================

const DEBOUNCE_MS = 200;
const MAX_LOCAL_RESULTS = 50;
const MAX_SERVER_RESULTS = 100;
const MAX_GLOBAL_RESULTS = 30;
const MAX_RECENT_SEARCHES = 10;

// ==================== УТИЛИТЫ ПОИСКА ====================

/**
 * Нормализация текста для поиска
 */
const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Убираем диакритику
    .trim();
};

/**
 * Токенизация запроса
 */
const tokenize = (text: string): string[] => {
  return normalizeText(text)
    .split(/\s+/)
    .filter(token => token.length > 0);
};

/**
 * Проверка prefix match
 */
const matchPrefix = (text: string, query: string): boolean => {
  const normalizedText = normalizeText(text);
  const normalizedQuery = normalizeText(query);
  return normalizedText.startsWith(normalizedQuery);
};

/**
 * Fuzzy match с tolerance
 */
const fuzzyMatch = (text: string, query: string, tolerance: number = 2): boolean => {
  const normalizedText = normalizeText(text);
  const normalizedQuery = normalizeText(query);
  
  if (normalizedText.includes(normalizedQuery)) return true;
  
  // Levenshtein distance для коротких строк
  if (normalizedQuery.length <= 5) {
    return levenshteinDistance(normalizedText.slice(0, normalizedQuery.length + tolerance), normalizedQuery) <= tolerance;
  }
  
  return false;
};

/**
 * Levenshtein distance
 */
const levenshteinDistance = (a: string, b: string): number => {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
};

/**
 * Найти индексы совпадений для подсветки
 */
const findHighlights = (text: string, query: string): [number, number][] => {
  const highlights: [number, number][] = [];
  const normalizedText = normalizeText(text);
  const normalizedQuery = normalizeText(query);
  
  let startIndex = 0;
  let index: number;
  
  while ((index = normalizedText.indexOf(normalizedQuery, startIndex)) !== -1) {
    highlights.push([index, index + normalizedQuery.length]);
    startIndex = index + 1;
  }
  
  return highlights;
};

/**
 * Проверка на глобальный поиск (@username)
 */
const isGlobalQuery = (query: string): boolean => {
  return query.startsWith('@') || 
         query.startsWith('#') ||
         query.includes('t.me/');
};

/**
 * Извлечь username из запроса
 */
const extractUsername = (query: string): string => {
  if (query.startsWith('@')) {
    return query.slice(1);
  }
  if (query.includes('t.me/')) {
    const match = query.match(/t\.me\/([a-zA-Z0-9_]+)/);
    return match ? match[1] : query;
  }
  return query;
};

// ==================== СОЗДАНИЕ STORE ====================

export const useSearchStore = create<SearchStore>()(
  subscribeWithSelector((set, get) => ({
    // Начальное состояние
    state: 'idle',
    query: '',
    scope: 'all',
    currentChatId: undefined,
    mediaFilter: 'all',
    
    localResults: [],
    serverResults: [],
    globalResults: [],
    mergedResults: [],
    
    inChatResults: [],
    currentInChatIndex: -1,
    
    mediaResults: [],
    
    isLocalSearching: false,
    isServerSearching: false,
    isGlobalSearching: false,
    
    recentSearches: [],
    searchHistory: new Map(),
    
    lastQueryTime: 0,
    pendingQuery: undefined,

    // ==================== УСТАНОВКА ПАРАМЕТРОВ ====================

    setQuery: (query: string) => {
      const now = Date.now();
      const { lastQueryTime, search } = get();
      
      set({ query, state: query.length > 0 ? 'typing' : 'idle' });
      
      // Debounce
      if (now - lastQueryTime < DEBOUNCE_MS) {
        set({ pendingQuery: query });
        setTimeout(() => {
          const { pendingQuery } = get();
          if (pendingQuery === query && query.length > 0) {
            search(query);
          }
        }, DEBOUNCE_MS);
      } else if (query.length > 0) {
        search(query);
      } else {
        get().clearResults();
      }
      
      set({ lastQueryTime: now });
    },

    setScope: (scope: SearchScope) => {
      set({ scope });
      const { query, search } = get();
      if (query.length > 0) {
        search(query);
      }
    },

    setMediaFilter: (filter: MediaFilter) => {
      set({ mediaFilter: filter });
      const { currentChatId, searchMedia } = get();
      if (currentChatId) {
        searchMedia(currentChatId, filter);
      }
    },

    setCurrentChatId: (chatId?: string) => {
      set({ 
        currentChatId: chatId, 
        scope: chatId ? 'in_chat' : 'all',
        inChatResults: [],
        currentInChatIndex: -1,
      });
    },

    // ==================== ОСНОВНОЙ ПОИСК ====================

    search: async (query: string) => {
      if (query.length === 0) {
        get().clearResults();
        return;
      }

      const { scope, currentChatId, searchLocal, searchServer, searchGlobal, searchInChat, addToHistory } = get();
      
      // Добавляем в историю
      addToHistory(query);
      
      // 1. ЛОКАЛЬНЫЙ ПОИСК (мгновенно)
      searchLocal(query);
      
      // 2. Определяем, нужен ли серверный/глобальный
      if (scope === 'in_chat' && currentChatId) {
        // Поиск внутри чата
        await searchInChat(currentChatId, query);
      } else {
        // Параллельный серверный и глобальный поиск
        const promises: Promise<void>[] = [];
        
        if (scope === 'all' || scope === 'chats' || scope === 'messages') {
          promises.push(searchServer(query));
        }
        
        if (isGlobalQuery(query) || scope === 'all') {
          promises.push(searchGlobal(query));
        }
        
        await Promise.all(promises);
      }
      
      // Merge результатов
      get().mergeResults();
    },

    // ==================== ЛОКАЛЬНЫЙ ПОИСК (0 мс) ====================

    searchLocal: (query: string) => {
      set({ isLocalSearching: true });
      
      const results: SearchResult[] = [];
      const chatStore = useChatStore.getState();
      const tokens = tokenize(query);
      const { scope } = get();
      
      // 1. Поиск по чатам (названия)
      if (scope === 'all' || scope === 'chats') {
        chatStore.chats.forEach((chat, chatId) => {
          // Поиск по имени чата
          if (fuzzyMatch(chat.name, query)) {
            results.push({
              id: `local-chat-${chatId}`,
              type: 'chat',
              source: 'local',
              score: calculateLocalScore(chat, query, 'name'),
              chat,
              matchedField: 'name',
              highlights: [{
                field: 'name',
                indices: findHighlights(chat.name, query),
              }],
              isRecent: Date.now() - chat.updatedAt < 24 * 60 * 60 * 1000, // 24h
              timestamp: chat.updatedAt,
            });
          }
          
          // Поиск по @username
          if (chat.username && matchPrefix(chat.username, extractUsername(query))) {
            results.push({
              id: `local-username-${chatId}`,
              type: 'chat',
              source: 'local',
              score: calculateLocalScore(chat, query, 'username') + 10, // Бонус за username
              chat,
              matchedField: 'username',
              highlights: [{
                field: 'username',
                indices: findHighlights(chat.username, query),
              }],
              timestamp: chat.updatedAt,
            });
          }
        });
      }
      
      // 2. Поиск по кэшированным сообщениям
      if (scope === 'all' || scope === 'messages') {
        chatStore.messages.forEach((messages, chatId) => {
          const chat = chatStore.chats.get(chatId);
          
          messages.slice(-100).forEach(message => { // Последние 100 сообщений
            if (message.text && fuzzyMatch(message.text, query)) {
              results.push({
                id: `local-msg-${message.id}`,
                type: 'message',
                source: 'local',
                score: calculateMessageScore(message, query),
                message,
                chat,
                matchedField: 'text',
                highlights: [{
                  field: 'text',
                  indices: findHighlights(message.text, query),
                }],
                timestamp: message.createdAt,
              });
            }
          });
        });
      }
      
      // Ранжирование локальных результатов
      const rankedResults = results
        .sort((a, b) => b.score - a.score)
        .slice(0, MAX_LOCAL_RESULTS);
      
      set({ 
        localResults: rankedResults,
        isLocalSearching: false,
        state: rankedResults.length > 0 ? 'results' : get().state,
      });
    },

    // ==================== СЕРВЕРНЫЙ ПОИСК (async) ====================

    searchServer: async (query: string) => {
      set({ isServerSearching: true });
      
      try {
        // Симуляция серверного запроса
        // В реальном приложении: API call
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const response = await apiFetch(`api/search?q=${encodeURIComponent(query)}&type=messages`);
        
        if (!response.ok) {
          // Тихая ошибка
          set({ isServerSearching: false });
          return;
        }
        
        const data = await response.json();
        
        const results: SearchResult[] = (data.results || []).map((item: any, index: number) => ({
          id: `server-${item.type}-${item.id}`,
          type: item.type as SearchResultType,
          source: 'server' as const,
          score: 100 - index, // Сервер уже отранжировал
          message: item.message,
          chat: item.chat,
          highlights: item.highlights,
          timestamp: item.timestamp,
        }));
        
        set({ 
          serverResults: results.slice(0, MAX_SERVER_RESULTS),
          isServerSearching: false,
        });
        
        // Merge с локальными
        get().mergeResults();
        
      } catch (error) {
        // Тихая ошибка - просто не показываем серверные результаты
        set({ isServerSearching: false });
      }
    },

    // ==================== ГЛОБАЛЬНЫЙ ПОИСК ====================

    searchGlobal: async (query: string) => {
      set({ isGlobalSearching: true });
      
      try {
        const username = extractUsername(query);
        
        // Симуляция глобального поиска
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const response = await apiFetch(`api/search/global?q=${encodeURIComponent(username)}`);
        
        if (!response.ok) {
          set({ isGlobalSearching: false });
          return;
        }
        
        const data = await response.json();
        
        const results: SearchResult[] = (data.results || [])
          .filter((item: any) => {
            // Фильтрация по доступности (ACL)
            // Заблокированные пользователи не показываются
            return !item.isBlocked && item.visible !== false;
          })
          .map((item: any, index: number) => ({
            id: `global-${item.type}-${item.id}`,
            type: item.type as SearchResultType,
            source: 'global' as const,
            score: calculateGlobalScore(item, query),
            user: {
              id: item.id,
              username: item.username,
              firstName: item.firstName,
              lastName: item.lastName,
              avatarUrl: item.avatarUrl,
              type: item.type,
              isVerified: item.isVerified,
              subscribersCount: item.subscribersCount,
              bio: item.bio,
              canMessage: item.canMessage !== false,
              isBlocked: item.isBlocked || false,
              isPrivate: item.isPrivate || false,
            } as GlobalUser,
            highlights: [{
              field: 'username',
              indices: findHighlights(item.username || '', username),
            }],
            timestamp: item.lastActivity,
          }));
        
        set({ 
          globalResults: results.slice(0, MAX_GLOBAL_RESULTS),
          isGlobalSearching: false,
        });
        
        get().mergeResults();
        
      } catch (error) {
        set({ isGlobalSearching: false });
      }
    },

    // ==================== ПОИСК ВНУТРИ ЧАТА ====================

    searchInChat: async (chatId: string, query: string) => {
      if (!query || query.length < 2) {
        set({ inChatResults: [], currentInChatIndex: -1 });
        return;
      }
      
      set({ isServerSearching: true });
      
      try {
        // Сначала локальный поиск по кэшу
        const chatStore = useChatStore.getState();
        const cachedMessages = chatStore.messages.get(chatId) || [];
        
        const localMatches: InChatSearchResult[] = cachedMessages
          .filter(msg => msg.text && fuzzyMatch(msg.text, query))
          .map((msg, index) => ({
            messageId: msg.id,
            position: index,
            text: msg.text,
            highlights: findHighlights(msg.text || '', query),
            timestamp: msg.createdAt,
          }));
        
        // Показываем локальные сразу
        if (localMatches.length > 0) {
          set({ 
            inChatResults: localMatches,
            currentInChatIndex: 0,
          });
        }
        
        // Серверный поиск для полной истории
        const response = await fetch(
          `/api/chats/${chatId}/search?q=${encodeURIComponent(query)}`
        );
        
        if (response.ok) {
          const data = await response.json();
          
          const serverResults: InChatSearchResult[] = (data.results || []).map((item: any) => ({
            messageId: item.messageId,
            position: item.position,
            text: item.text,
            highlights: item.highlights || findHighlights(item.text || '', query),
            timestamp: item.timestamp,
          }));
          
          // Merge локальных и серверных, убирая дубликаты
          const mergedResults = mergeInChatResults(localMatches, serverResults);
          
          set({ 
            inChatResults: mergedResults,
            currentInChatIndex: mergedResults.length > 0 ? 0 : -1,
            state: mergedResults.length > 0 ? 'results' : 'no_results',
          });
        }
        
      } catch (error) {
        // Оставляем локальные результаты
      } finally {
        set({ isServerSearching: false });
      }
    },

    // ==================== ПОИСК ПО МЕДИА ====================

    searchMedia: async (chatId: string, filter: MediaFilter) => {
      set({ isServerSearching: true, mediaResults: [] });
      
      try {
        const response = await fetch(
          `/api/chats/${chatId}/media?type=${filter}`
        );
        
        if (!response.ok) {
          set({ isServerSearching: false });
          return;
        }
        
        const data = await response.json();
        
        const results: MediaSearchResult[] = (data.media || []).map((item: any) => ({
          id: item.id,
          chatId,
          messageId: item.messageId,
          mediaType: item.mediaType,
          mediaUrl: item.mediaUrl,
          fileName: item.fileName,
          fileSize: item.fileSize,
          duration: item.duration,
          thumbnailUrl: item.thumbnailUrl,
          timestamp: item.timestamp,
          senderName: item.senderName,
        }));
        
        // Сортировка по дате (новые первые)
        results.sort((a, b) => b.timestamp - a.timestamp);
        
        set({ 
          mediaResults: results,
          isServerSearching: false,
        });
        
      } catch (error) {
        set({ isServerSearching: false });
      }
    },

    // ==================== НАВИГАЦИЯ ПО РЕЗУЛЬТАТАМ ====================

    navigateToResult: (resultId: string) => {
      const { mergedResults, inChatResults } = get();
      
      // Найти результат
      const result = mergedResults.find(r => r.id === resultId);
      
      if (result) {
        const chatStore = useChatStore.getState();
        
        if (result.type === 'chat' && result.chat) {
          chatStore.selectChat(result.chat.id);
        } else if (result.type === 'message' && result.message) {
          chatStore.selectChat(result.message.chatId);
          chatStore.setUIState('chat_selected', {
            selectedMessageId: result.message.id,
          });
        } else if (result.type === 'user' && result.user) {
          // Создать или открыть чат с пользователем
          // chatStore.createOrOpenChat(result.user.id);
        }
      }
    },

    navigateInChatPrev: () => {
      const { inChatResults, currentInChatIndex } = get();
      if (currentInChatIndex > 0) {
        set({ currentInChatIndex: currentInChatIndex - 1 });
      }
    },

    navigateInChatNext: () => {
      const { inChatResults, currentInChatIndex } = get();
      if (currentInChatIndex < inChatResults.length - 1) {
        set({ currentInChatIndex: currentInChatIndex + 1 });
      }
    },

    jumpToInChatResult: (index: number) => {
      const { inChatResults } = get();
      if (index >= 0 && index < inChatResults.length) {
        set({ currentInChatIndex: index });
      }
    },

    // ==================== ОЧИСТКА ====================

    clearSearch: () => {
      set({
        state: 'idle',
        query: '',
        localResults: [],
        serverResults: [],
        globalResults: [],
        mergedResults: [],
        inChatResults: [],
        currentInChatIndex: -1,
        mediaResults: [],
        isLocalSearching: false,
        isServerSearching: false,
        isGlobalSearching: false,
      });
    },

    clearResults: () => {
      set({
        localResults: [],
        serverResults: [],
        globalResults: [],
        mergedResults: [],
        state: 'idle',
      });
    },

    // ==================== ИСТОРИЯ ====================

    addToHistory: (query: string) => {
      if (query.length < 2) return;
      
      const { recentSearches } = get();
      const filtered = recentSearches.filter(q => q !== query);
      const updated = [query, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      
      set({ recentSearches: updated });
      
      // Сохраняем в AsyncStorage (для персистентности)
      try {
        // AsyncStorage.setItem('recent_searches', JSON.stringify(updated));
      } catch {}
    },

    clearHistory: () => {
      set({ recentSearches: [] });
      // AsyncStorage.removeItem('recent_searches');
    },

    getRecentSearches: () => {
      return get().recentSearches;
    },

    // ==================== MERGE & RANK ====================

    mergeResults: () => {
      const { localResults, serverResults, globalResults, query } = get();
      
      // Объединяем все результаты
      const allResults = [...localResults, ...serverResults, ...globalResults];
      
      // Убираем дубликаты (по ID сущности)
      const uniqueResults = deduplicateResults(allResults);
      
      // Ранжируем
      const ranked = get().rankResults(uniqueResults);
      
      set({ 
        mergedResults: ranked,
        state: ranked.length > 0 ? 'results' : 'no_results',
      });
    },

    rankResults: (results: SearchResult[]) => {
      const { query } = get();
      
      return results
        .map(result => ({
          ...result,
          score: get().calculateScore(result, query),
        }))
        .sort((a, b) => {
          // Сначала по типу (чаты выше сообщений)
          const typePriority: Record<SearchResultType, number> = {
            chat: 100,
            contact: 90,
            user: 80,
            channel: 70,
            bot: 60,
            message: 50,
          };
          
          const typeScoreA = typePriority[a.type] || 0;
          const typeScoreB = typePriority[b.type] || 0;
          
          if (typeScoreA !== typeScoreB) {
            return typeScoreB - typeScoreA;
          }
          
          // Затем по score
          if (b.score !== a.score) {
            return b.score - a.score;
          }
          
          // Затем по времени (недавние выше)
          return (b.timestamp || 0) - (a.timestamp || 0);
        });
    },

    calculateScore: (result: SearchResult, query: string) => {
      let score = result.score;
      
      // Бонус за точное совпадение
      if (result.matchedField) {
        const fieldValue = getFieldValue(result, result.matchedField);
        if (fieldValue && normalizeText(fieldValue) === normalizeText(query)) {
          score += 50;
        }
      }
      
      // Бонус за недавность
      if (result.isRecent) {
        score += 20;
      }
      
      // Бонус за локальный источник (быстрее)
      if (result.source === 'local') {
        score += 10;
      }
      
      // Бонус за pinned чаты
      if (result.chat?.isPinned) {
        score += 15;
      }
      
      return score;
    },

    tokenize,
    matchPrefix,
  }))
);

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

/**
 * Подсчёт локального score для чата
 */
function calculateLocalScore(chat: Chat, query: string, field: string): number {
  let score = 0;
  
  // Базовый score за совпадение
  score += 50;
  
  // Бонус за pinned
  if (chat.isPinned) score += 30;
  
  // Бонус за недавнюю активность
  const hoursSinceUpdate = (Date.now() - chat.updatedAt) / (1000 * 60 * 60);
  if (hoursSinceUpdate < 1) score += 25;
  else if (hoursSinceUpdate < 24) score += 15;
  else if (hoursSinceUpdate < 168) score += 5; // Неделя
  
  // Бонус за непрочитанные
  if (chat.unreadCount > 0) score += 10;
  
  // Штраф за заархивированные
  if (chat.isArchived) score -= 20;
  
  // Штраф за muted
  if (chat.isMuted) score -= 5;
  
  return score;
}

/**
 * Подсчёт score для сообщения
 */
function calculateMessageScore(message: Message, query: string): number {
  let score = 0;
  
  // Базовый score
  score += 30;
  
  // Бонус за недавность
  const hoursSinceCreated = (Date.now() - message.createdAt) / (1000 * 60 * 60);
  if (hoursSinceCreated < 1) score += 20;
  else if (hoursSinceCreated < 24) score += 10;
  else if (hoursSinceCreated < 168) score += 5;
  
  // Бонус за точное совпадение в начале
  if (message.text && normalizeText(message.text).startsWith(normalizeText(query))) {
    score += 15;
  }
  
  return score;
}

/**
 * Подсчёт score для глобального результата
 */
function calculateGlobalScore(item: any, query: string): number {
  let score = 0;
  
  // Базовый score
  score += 40;
  
  // Бонус за verified
  if (item.isVerified) score += 30;
  
  // Бонус за популярность
  if (item.subscribersCount > 1000000) score += 25;
  else if (item.subscribersCount > 100000) score += 20;
  else if (item.subscribersCount > 10000) score += 15;
  else if (item.subscribersCount > 1000) score += 10;
  
  // Бонус за точное совпадение username
  if (item.username && normalizeText(item.username) === normalizeText(extractUsername(query))) {
    score += 40;
  }
  
  // Штраф если нельзя написать
  if (!item.canMessage) score -= 10;
  
  return score;
}

/**
 * Удаление дубликатов из результатов
 */
function deduplicateResults(results: SearchResult[]): SearchResult[] {
  const seen = new Set<string>();
  const unique: SearchResult[] = [];
  
  for (const result of results) {
    // Создаём уникальный ключ
    let key: string;
    if (result.chat) {
      key = `chat-${result.chat.id}`;
    } else if (result.message) {
      key = `msg-${result.message.id}`;
    } else if (result.user) {
      key = `user-${result.user.id}`;
    } else {
      key = result.id;
    }
    
    if (!seen.has(key)) {
      seen.add(key);
      // Предпочитаем локальные результаты
      unique.push(result);
    }
  }
  
  return unique;
}

/**
 * Merge результатов поиска внутри чата
 */
function mergeInChatResults(
  local: InChatSearchResult[],
  server: InChatSearchResult[]
): InChatSearchResult[] {
  const seen = new Set<string>();
  const merged: InChatSearchResult[] = [];
  
  // Сначала локальные
  for (const result of local) {
    seen.add(result.messageId);
    merged.push(result);
  }
  
  // Затем серверные (без дубликатов)
  for (const result of server) {
    if (!seen.has(result.messageId)) {
      seen.add(result.messageId);
      merged.push(result);
    }
  }
  
  // Сортировка по позиции
  return merged.sort((a, b) => b.position - a.position);
}

/**
 * Получить значение поля для score
 */
function getFieldValue(result: SearchResult, field: string): string | undefined {
  if (field === 'name' && result.chat) {
    return result.chat.name;
  }
  if (field === 'username') {
    return result.chat?.username || result.user?.username;
  }
  if (field === 'text' && result.message) {
    return result.message.text;
  }
  return undefined;
}

// ==================== СЕЛЕКТОРЫ ====================

/**
 * Селектор для получения отфильтрованных результатов по типу
 */
export const selectResultsByType = (type: SearchResultType) => (state: SearchStore) =>
  state.mergedResults.filter(r => r.type === type);

/**
 * Селектор для проверки загрузки
 */
export const selectIsSearching = (state: SearchStore) =>
  state.isLocalSearching || state.isServerSearching || state.isGlobalSearching;

/**
 * Селектор для текущего результата в чате
 */
export const selectCurrentInChatResult = (state: SearchStore) => {
  const { inChatResults, currentInChatIndex } = state;
  if (currentInChatIndex >= 0 && currentInChatIndex < inChatResults.length) {
    return inChatResults[currentInChatIndex];
  }
  return null;
};

/**
 * Селектор для группированных результатов
 */
export const selectGroupedResults = (state: SearchStore) => {
  const groups: Record<SearchResultType, SearchResult[]> = {
    chat: [],
    contact: [],
    message: [],
    user: [],
    channel: [],
    bot: [],
  };
  
  for (const result of state.mergedResults) {
    groups[result.type].push(result);
  }
  
  return groups;
};
