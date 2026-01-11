import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { Capacitor } from "@capacitor/core";
import { CapacitorHttp, HttpResponse } from "@capacitor/core";
import { 
  getAuthToken as getStoredToken, 
  setAuthToken as setStoredToken, 
  clearAuthToken as clearStoredToken,
  migrateFromLocalStorage
} from "./authStorage";

const API_BASE_URL = Capacitor.isNativePlatform() ? 'https://fayaflex.com' : '';
const isNative = Capacitor.isNativePlatform();

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

async function nativeRequest(
  method: string,
  url: string,
  headers: Record<string, string>,
  data?: unknown
): Promise<Response> {
  console.log(`[API] Native ${method} ${url}`);
  
  try {
    const options: any = {
      url,
      headers,
      method: method.toUpperCase(),
    };
    
    if (data) {
      options.data = data;
    }
    
    const response: HttpResponse = await CapacitorHttp.request(options);
    
    console.log(`[API] Native response: ${response.status}`);
    
    // Convert CapacitorHttp response to fetch-like Response
    const body = typeof response.data === 'string' 
      ? response.data 
      : JSON.stringify(response.data);
    
    return new Response(body, {
      status: response.status,
      headers: response.headers,
    });
  } catch (error: any) {
    console.error(`[API] Native request error:`, error.message || error);
    throw error;
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
  
  console.log(`[API] ${method} ${fullUrl} (native: ${isNative})`);
  
  // Use native HTTP for iOS/Android to bypass WebView CORS restrictions
  if (isNative) {
    const res = await nativeRequest(method, fullUrl, headers, data);
    await throwIfResNotOk(res);
    return res;
  }
  
  // Web uses standard fetch with session cookies
  try {
    const res = await fetch(fullUrl, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
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
    const headers = getAuthHeaders();
    
    let res: Response;
    
    // Use native HTTP for iOS/Android to bypass WebView CORS restrictions
    if (isNative) {
      res = await nativeRequest("GET", fullUrl, headers);
    } else {
      res = await fetch(fullUrl, {
        credentials: "include",
        headers,
      });
    }

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
