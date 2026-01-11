import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";

const AUTH_TOKEN_KEY = "ufc_auth_token";
const USER_DATA_KEY = "ufc_user_data";

const isNative = Capacitor.isNativePlatform();

export async function getAuthToken(): Promise<string | null> {
  if (isNative) {
    try {
      const { value } = await Preferences.get({ key: AUTH_TOKEN_KEY });
      return value;
    } catch (error) {
      console.error("[AuthStorage] Failed to get token from native storage:", error);
      return localStorage.getItem(AUTH_TOKEN_KEY);
    }
  }
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export async function setAuthToken(token: string): Promise<void> {
  if (isNative) {
    try {
      await Preferences.set({ key: AUTH_TOKEN_KEY, value: token });
    } catch (error) {
      console.error("[AuthStorage] Failed to set token in native storage:", error);
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    }
  } else {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  }
}

export async function clearAuthToken(): Promise<void> {
  if (isNative) {
    try {
      await Preferences.remove({ key: AUTH_TOKEN_KEY });
    } catch (error) {
      console.error("[AuthStorage] Failed to clear token from native storage:", error);
    }
  }
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

export async function getUserData(): Promise<string | null> {
  if (isNative) {
    const { value } = await Preferences.get({ key: USER_DATA_KEY });
    return value;
  }
  return localStorage.getItem(USER_DATA_KEY);
}

export async function setUserData(userData: string): Promise<void> {
  if (isNative) {
    await Preferences.set({ key: USER_DATA_KEY, value: userData });
  } else {
    localStorage.setItem(USER_DATA_KEY, userData);
  }
}

export async function clearUserData(): Promise<void> {
  if (isNative) {
    await Preferences.remove({ key: USER_DATA_KEY });
  } else {
    localStorage.removeItem(USER_DATA_KEY);
  }
}

export async function clearAllAuthData(): Promise<void> {
  await clearAuthToken();
  await clearUserData();
}

export async function migrateFromLocalStorage(): Promise<void> {
  if (!isNative) return;
  
  const existingToken = localStorage.getItem(AUTH_TOKEN_KEY);
  if (existingToken) {
    await setAuthToken(existingToken);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    console.log("[AuthStorage] Migrated token from localStorage to native storage");
  }
  
  const existingUserData = localStorage.getItem(USER_DATA_KEY);
  if (existingUserData) {
    await setUserData(existingUserData);
    localStorage.removeItem(USER_DATA_KEY);
    console.log("[AuthStorage] Migrated user data from localStorage to native storage");
  }
}
