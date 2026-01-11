import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { Capacitor } from "@capacitor/core";
import { 
  getAuthToken as getStoredToken, 
  setAuthToken as setStoredToken, 
  clearAuthToken as clearStoredToken,
  migrateFromLocalStorage
} from "./authStorage";

const API_BASE_URL = Capacitor.isNativePlatform() ? 'https://www.fayaflex.com' : '';

let cachedToken: string | null = null;
let tokenInitialized = false;

export function getApiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

export async function initializeAuth(): Promise<void> {
  if (tokenInitialized) return;
  await migrateFromLocalStorage();
  cachedToken = await getStoredToken();
  tokenInitialized = true;
  console.log("[Auth] Token initialized:", cachedToken ? "present" : "none");
}

export function getAuthToken(): string | null {
  return cachedToken;
}

export async function setAuthToken(token: string): Promise<void> {
  cachedToken = token;
  await setStoredToken(token);
}

export async function clearAuthToken(): Promise<void> {
  cachedToken = null;
  await clearStoredToken();
}

function getAuthHeaders(): Record<string, string> {
  return cachedToken ? { 'Authorization': `Bearer ${cachedToken}` } : {};
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const headers: Record<string, string> = {
    ...getAuthHeaders(),
  };
  if (data) {
    headers['Content-Type'] = 'application/json';
  }
  
  const fullUrl = getApiUrl(url);
  const isNative = Capacitor.isNativePlatform();
  
  console.log(`[API] ${method} ${fullUrl} (native: ${isNative})`);
  
  try {
    const res = await fetch(fullUrl, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      // Native apps use Bearer token auth, web uses session cookies
      credentials: isNative ? "omit" : "include",
    });

    console.log(`[API] Response: ${res.status} ${res.statusText}`);
    await throwIfResNotOk(res);
    return res;
  } catch (error: any) {
    console.error(`[API] Fetch error for ${fullUrl}:`, error.message || error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const path = queryKey.join("/") as string;
    const fullUrl = getApiUrl(path);
    const isNative = Capacitor.isNativePlatform();
    const res = await fetch(fullUrl, {
      // Native apps use Bearer token auth, web uses session cookies
      credentials: isNative ? "omit" : "include",
      headers: getAuthHeaders(),
    });

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
