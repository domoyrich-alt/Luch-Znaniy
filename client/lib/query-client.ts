import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { Platform } from "react-native";

/**
 * Gets the base URL for the Express API server
 * @returns {string} The API base URL
 */
export function getApiUrl(): string {
  const directUrl = process.env.EXPO_PUBLIC_API_URL;
  if (directUrl && directUrl.length > 0) {
    return directUrl.endsWith("/") ? directUrl.slice(0, -1) : directUrl;
  }

  const rawHost = process.env.EXPO_PUBLIC_DOMAIN;
  const host = rawHost?.trim();
  if (host && host.length > 0) {
    // Если уже есть протокол — берём origin (без path/query)
    if (/^https?:\/\//i.test(host)) {
      try {
        const url = new URL(host);
        return url.origin;
      } catch {
        return host.endsWith("/") ? host.slice(0, -1) : host;
      }
    }

    // Если по ошибке передали с путём (domain/path) — отрежем путь
    const hostOnly = host.split("/")[0].trim();

    const isLocal =
      hostOnly.includes("localhost") ||
      hostOnly.startsWith("127.") ||
      hostOnly.startsWith("10.") ||
      hostOnly.startsWith("192.168.") ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostOnly);

    return `${isLocal ? "http" : "https"}://${hostOnly}`;
  }

  if (__DEV__ && Platform.OS !== "web") {
    // На физическом устройстве/эмуляторе localhost:5000 обычно недоступен.
    console.warn(
      "[API] EXPO_PUBLIC_DOMAIN/EXPO_PUBLIC_API_URL is not set; falling back to http://localhost:5000. " +
        "If you are running on a phone via Expo Go, set EXPO_PUBLIC_DOMAIN to your tunnel domain (e.g. xxxx.trycloudflare.com) and restart Expo with --clear.",
    );
  }

  // fallback
  return "http://localhost:5000";
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  route: string,
  data?: unknown | undefined,
): Promise<Response> {
  const baseUrl = getApiUrl();
  const url = `${baseUrl}${route.startsWith("/") ? route : "/" + route}`;

  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const baseUrl = getApiUrl();
    const path = queryKey.join("/");
    const url = `${baseUrl}${path.startsWith("/") ? path : "/" + path}`;

    const res = await fetch(url);

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});