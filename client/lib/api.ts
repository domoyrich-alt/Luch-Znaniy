/**
 * API Configuration
 * Централизованная настройка API для мобильного приложения
 * С поддержкой JWT токенов
 */

import { getApiUrl as getBaseApiUrl } from "./query-client";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Базовый URL API из переменных окружения (единая логика)
const API_URL = getBaseApiUrl();

console.log('[API] Base URL:', API_URL);

// Ключи хранения токенов
const ACCESS_TOKEN_KEY = '@auth_access_token';
const REFRESH_TOKEN_KEY = '@auth_refresh_token';

// Токен в памяти для быстрого доступа
let accessTokenCache: string | null = null;

/**
 * Получить полный URL для API запроса
 */
export const getApiUrl = (path: string): string => {
  // Убираем начальный слэш если есть
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${API_URL}/${cleanPath}`;
};

// ==================== JWT TOKEN MANAGEMENT ====================

/**
 * Сохранить токены после логина
 */
export const saveTokens = async (accessToken: string, refreshToken: string): Promise<void> => {
  accessTokenCache = accessToken;
  await AsyncStorage.multiSet([
    [ACCESS_TOKEN_KEY, accessToken],
    [REFRESH_TOKEN_KEY, refreshToken],
  ]);
};

/**
 * Получить access token (из кеша или storage)
 */
export const getAccessToken = async (): Promise<string | null> => {
  if (accessTokenCache) return accessTokenCache;
  accessTokenCache = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  return accessTokenCache;
};

/**
 * Получить refresh token
 */
export const getRefreshToken = async (): Promise<string | null> => {
  return AsyncStorage.getItem(REFRESH_TOKEN_KEY);
};

/**
 * Очистить токены (logout)
 */
export const clearTokens = async (): Promise<void> => {
  accessTokenCache = null;
  await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);
};

/**
 * Обновить токены через refresh endpoint
 */
export const refreshAccessToken = async (): Promise<boolean> => {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return false;

  try {
    const response = await fetch(getApiUrl('api/auth/refresh'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      await clearTokens();
      return false;
    }

    const data = await response.json();
    await saveTokens(data.accessToken, data.refreshToken);
    return true;
  } catch (error) {
    console.error('[API] Token refresh failed:', error);
    await clearTokens();
    return false;
  }
};

/**
 * Выполнить fetch с JWT авторизацией и автообновлением токена
 */
export const apiFetch = async (
  path: string, 
  options?: RequestInit
): Promise<Response> => {
  const url = getApiUrl(path);
  
  const accessToken = await getAccessToken();
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
  };

  const mergedOptions: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options?.headers,
    },
  };

  try {
    let response = await fetch(url, mergedOptions);
    
    // Если 401 - пробуем обновить токен и повторить запрос
    if (response.status === 401 && accessToken) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        const newToken = await getAccessToken();
        const retryOptions: RequestInit = {
          ...mergedOptions,
          headers: {
            ...mergedOptions.headers,
            'Authorization': `Bearer ${newToken}`,
          },
        };
        response = await fetch(url, retryOptions);
      }
    }
    
    return response;
  } catch (error) {
    console.error(`[API] Request failed: ${path}`, error);
    throw error;
  }
};

/**
 * GET запрос
 */
export const apiGet = async <T>(path: string): Promise<T | null> => {
  try {
    const response = await apiFetch(path);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error(`[API] GET ${path} failed:`, error);
    return null;
  }
};

/**
 * POST запрос
 */
export const apiPost = async <T>(path: string, data?: any): Promise<T | null> => {
  try {
    const response = await apiFetch(path, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error(`[API] POST ${path} failed:`, error);
    return null;
  }
};

/**
 * DELETE запрос
 */
export const apiDelete = async (path: string): Promise<boolean> => {
  try {
    const response = await apiFetch(path, { method: 'DELETE' });
    return response.ok;
  } catch (error) {
    console.error(`[API] DELETE ${path} failed:`, error);
    return false;
  }
};

export default {
  getApiUrl,
  apiFetch,
  apiGet,
  apiPost,
  apiDelete,
  API_URL,
  saveTokens,
  getAccessToken,
  getRefreshToken,
  clearTokens,
  refreshAccessToken,
};
