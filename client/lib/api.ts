/**
 * API Configuration
 * Централизованная настройка API для мобильного приложения
 */

// Базовый URL API из переменных окружения
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.100.110:5000';

console.log('[API] Base URL:', API_URL);

/**
 * Получить полный URL для API запроса
 */
export const getApiUrl = (path: string): string => {
  // Убираем начальный слэш если есть
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${API_URL}/${cleanPath}`;
};

/**
 * Выполнить fetch с правильным базовым URL
 */
export const apiFetch = async (
  path: string, 
  options?: RequestInit
): Promise<Response> => {
  const url = getApiUrl(path);
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const mergedOptions: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options?.headers,
    },
  };

  try {
    const response = await fetch(url, mergedOptions);
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
};
