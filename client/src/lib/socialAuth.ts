import { Capacitor } from "@capacitor/core";
import { apiRequest } from "./queryClient";

// Social login configuration
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export interface SocialLoginResult {
  user: any;
  token: string;
}

/**
 * Handle Google Sign-In
 * On web: Uses Google Identity Services
 * On native: Uses native SDK (requires additional setup)
 */
export async function signInWithGoogle(): Promise<SocialLoginResult> {
  if (Capacitor.isNativePlatform()) {
    // Native Google Sign-In requires platform-specific SDK integration
    // This is a placeholder - actual implementation requires native plugins
    throw new Error("Google Sign-In on native requires additional setup. Please configure the native Google SDK in your Xcode/Android Studio project.");
  }

  // Web-based Google Sign-In using Google Identity Services
  return new Promise((resolve, reject) => {
    if (!GOOGLE_CLIENT_ID) {
      reject(new Error("Google Sign-In is not configured"));
      return;
    }

    // Check if Google Identity Services is loaded
    if (typeof google === "undefined" || !google.accounts) {
      reject(new Error("Google Sign-In is not available"));
      return;
    }

    // Initialize Google Identity Services
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async (response: any) => {
        try {
          // Send ID token to our backend for verification
          const res = await apiRequest("POST", "/api/auth/google", {
            idToken: response.credential,
          });
          const data = await res.json();
          resolve(data);
        } catch (error) {
          reject(error);
        }
      },
    });

    // Prompt the user to select an account
    google.accounts.id.prompt((notification: any) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        // If the prompt is not displayed, try the button approach
        reject(new Error("Google Sign-In was cancelled or not available"));
      }
    });
  });
}

/**
 * Handle Apple Sign-In
 * On iOS: Uses native Sign in with Apple
 * On web/Android: Uses Apple JS SDK (limited support)
 */
export async function signInWithApple(): Promise<SocialLoginResult> {
  if (Capacitor.getPlatform() === "ios") {
    // Native Apple Sign-In on iOS requires platform-specific SDK integration
    // This is a placeholder - actual implementation requires native plugins
    throw new Error("Apple Sign-In on iOS requires native SDK setup in Xcode.");
  }

  // Web-based Apple Sign-In (limited - Apple prefers native)
  throw new Error("Apple Sign-In is only available on iOS devices.");
}

/**
 * Check if social login is available
 * Note: Native social login requires additional SDK setup in Xcode/Android Studio
 * Currently only web-based Google Sign-In is supported when VITE_GOOGLE_CLIENT_ID is configured
 */
export function isSocialLoginAvailable(): { google: boolean; apple: boolean } {
  const isNative = Capacitor.isNativePlatform();

  return {
    // Google is available on web if configured (native requires SDK setup)
    google: !isNative && !!GOOGLE_CLIENT_ID && typeof google !== "undefined",
    // Apple Sign-In disabled until native SDK is integrated
    // (Native iOS requires Sign in with Apple capability in Xcode)
    apple: false,
  };
}

// Declare Google Identity Services types
declare global {
  const google: {
    accounts: {
      id: {
        initialize: (config: any) => void;
        prompt: (callback?: (notification: any) => void) => void;
        renderButton: (element: HTMLElement, config: any) => void;
      };
    };
  };
}
