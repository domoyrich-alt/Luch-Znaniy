/**
 * AVATAR CACHE SERVICE
 * Кэширование аватаров для оптимизации производительности
 * Эквивалент QPixmapCache из Qt
 */

import { Image, Platform } from 'react-native';

// Условный импорт FileSystem только для нативных платформ
let FileSystemModule: any = null;
if (Platform.OS !== 'web') {
  try {
    FileSystemModule = require('expo-file-system');
  } catch (e) {
    console.warn('expo-file-system not available');
  }
}

// Максимальный размер кэша (в количестве элементов)
const MAX_CACHE_SIZE = 100;

// Время жизни кэша (24 часа)
const CACHE_TTL = 24 * 60 * 60 * 1000;

interface CacheEntry {
  uri: string;
  timestamp: number;
  width?: number;
  height?: number;
}

class AvatarCacheService {
  private memoryCache: Map<string, CacheEntry> = new Map();
  private cacheDir: string = '';
  private initialized: boolean = false;

  constructor() {
    if (FileSystemModule?.cacheDirectory) {
      this.cacheDir = `${FileSystemModule.cacheDirectory}avatars/`;
    }
  }

  /**
   * Инициализация кэша
   */
  async initialize(): Promise<void> {
    if (this.initialized || !FileSystemModule || !this.cacheDir) return;

    try {
      const dirInfo = await FileSystemModule.getInfoAsync(this.cacheDir);
      if (!dirInfo.exists) {
        await FileSystemModule.makeDirectoryAsync(this.cacheDir, { intermediates: true });
      }
      this.initialized = true;
    } catch (error) {
      console.warn('AvatarCache: Failed to initialize cache directory:', error);
    }
  }

  /**
   * Генерация ключа кэша
   */
  private generateCacheKey(url: string, size?: number): string {
    const baseKey = url.replace(/[^a-zA-Z0-9]/g, '_');
    return size ? `${baseKey}_${size}` : baseKey;
  }

  /**
   * Получить аватар из кэша или загрузить
   */
  async getAvatar(url: string, size?: number): Promise<string | null> {
    if (!url) return null;

    const cacheKey = this.generateCacheKey(url, size);

    // 1. Проверяем память
    const memoryEntry = this.memoryCache.get(cacheKey);
    if (memoryEntry && Date.now() - memoryEntry.timestamp < CACHE_TTL) {
      return memoryEntry.uri;
    }

    // Если FileSystem недоступен, возвращаем оригинальный URL
    if (!FileSystemModule || !this.cacheDir) {
      return url;
    }

    // 2. Проверяем файловый кэш
    await this.initialize();
    const filePath = `${this.cacheDir}${cacheKey}`;
    
    try {
      const fileInfo = await FileSystemModule.getInfoAsync(filePath);
      if (fileInfo.exists) {
        // Обновляем память
        this.memoryCache.set(cacheKey, {
          uri: filePath,
          timestamp: Date.now(),
        });
        return filePath;
      }
    } catch (error) {
      // Файл не существует, продолжаем загрузку
    }

    // 3. Загружаем и кэшируем
    try {
      const downloadResult = await FileSystemModule.downloadAsync(url, filePath);
      
      if (downloadResult.status === 200) {
        // Сохраняем в память
        this.memoryCache.set(cacheKey, {
          uri: downloadResult.uri,
          timestamp: Date.now(),
        });
        
        // Очищаем старые записи если превышен лимит
        this.evictOldEntries();
        
        return downloadResult.uri;
      }
    } catch (error) {
      console.warn('AvatarCache: Failed to download avatar:', error);
    }

    // Возвращаем оригинальный URL если кэширование не удалось
    return url;
  }

  /**
   * Предзагрузка аватаров (для списков)
   */
  async prefetchAvatars(urls: string[], size?: number): Promise<void> {
    const promises = urls
      .filter(url => url && !this.memoryCache.has(this.generateCacheKey(url, size)))
      .slice(0, 10) // Ограничиваем количество одновременных загрузок
      .map(url => this.getAvatar(url, size));
    
    await Promise.allSettled(promises);
  }

  /**
   * Предзагрузка изображения (для React Native Image)
   */
  prefetchImage(url: string): void {
    if (url) {
      Image.prefetch(url).catch(() => {
        // Игнорируем ошибки предзагрузки
      });
    }
  }

  /**
   * Очистка старых записей
   */
  private evictOldEntries(): void {
    if (this.memoryCache.size <= MAX_CACHE_SIZE) return;

    // Сортируем по времени и удаляем старые
    const entries = Array.from(this.memoryCache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    const toRemove = entries.slice(0, entries.length - MAX_CACHE_SIZE);
    toRemove.forEach(([key]) => this.memoryCache.delete(key));
  }

  /**
   * Очистить весь кэш
   */
  async clearCache(): Promise<void> {
    this.memoryCache.clear();
    
    if (!FileSystemModule || !this.cacheDir) return;
    
    try {
      await FileSystemModule.deleteAsync(this.cacheDir, { idempotent: true });
      await FileSystemModule.makeDirectoryAsync(this.cacheDir, { intermediates: true });
    } catch (error) {
      console.warn('AvatarCache: Failed to clear cache:', error);
    }
  }

  /**
   * Получить размер кэша
   */
  getCacheSize(): number {
    return this.memoryCache.size;
  }

  /**
   * Проверить наличие в кэше
   */
  isCached(url: string, size?: number): boolean {
    const cacheKey = this.generateCacheKey(url, size);
    return this.memoryCache.has(cacheKey);
  }
}

// Singleton instance
export const avatarCache = new AvatarCacheService();

/**
 * Hook для использования кэшированных аватаров
 */
import { useState, useEffect } from 'react';

export function useCachedAvatar(url: string | undefined, size?: number): string | undefined {
  const [cachedUrl, setCachedUrl] = useState<string | undefined>(url);

  useEffect(() => {
    if (!url) {
      setCachedUrl(undefined);
      return;
    }

    let isMounted = true;

    avatarCache.getAvatar(url, size).then(cached => {
      if (isMounted && cached) {
        setCachedUrl(cached);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [url, size]);

  return cachedUrl;
}

export default avatarCache;
