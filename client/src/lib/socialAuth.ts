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
 * On native: Uses @southdevs/capacitor-google-auth plugin
 * On web: Uses Google Identity Services
 */
export async function signInWithGoogle(): Promise<SocialLoginResult> {
  if (Capacitor.isNativePlatform()) {
    // Native Google Sign-In using Capacitor plugin
    try {
      const { GoogleAuth } = await import("@southdevs/capacitor-google-auth");
      
      // Initialize if not already done
      await GoogleAuth.initialize({
        clientId: GOOGLE_CLIENT_ID || "",
        scopes: ["profile", "email"],
        grantOfflineAccess: true,
      });
      
      const result = await GoogleAuth.signIn({
        clientId: GOOGLE_CLIENT_ID || undefined,
        scopes: ["profile", "email"],
      });
      
      if (!result.authentication?.idToken) {
        throw new Error("Failed to get ID token from Google Sign-In");
      }
      
      // Send ID token to backend for verification
      const res = await apiRequest("POST", "/api/auth/google", {
        idToken: result.authentication.idToken,
      });
      const data = await res.json();
      return data;
    } catch (error: any) {
      console.error("Native Google Sign-In error:", error);
      throw new Error(error.message || "Google Sign-In failed");
    }
  }

  // Web-based Google Sign-In using Google OAuth2 popup flow
  return new Promise((resolve, reject) => {
    if (!GOOGLE_CLIENT_ID) {
      reject(new Error("Google Sign-In is not configured. Please set up VITE_GOOGLE_CLIENT_ID."));
      return;
    }

    if (typeof google === "undefined" || !google.accounts) {
      reject(new Error("Google Sign-In is not available. Please ensure the Google Identity Services script is loaded."));
      return;
    }

    const handleCredentialResponse = async (response: any) => {
      try {
        const res = await apiRequest("POST", "/api/auth/google", {
          idToken: response.credential,
        });
        const data = await res.json();
        resolve(data);
      } catch (error) {
        reject(error);
      }
    };

    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse,
    });

    google.accounts.id.prompt((notification: any) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        console.log("[SocialAuth] One Tap not available, using OAuth2 popup flow");
        const client = google.accounts.oauth2.initCodeClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: "openid email profile",
          ux_mode: "popup",
          callback: async (response: any) => {
            if (response.error) {
              reject(new Error("Google Sign-In was cancelled"));
              return;
            }
            try {
              const res = await apiRequest("POST", "/api/auth/google", {
                code: response.code,
              });
              const data = await res.json();
              resolve(data);
            } catch (error) {
              reject(error);
            }
          },
        });
        client.requestCode();
      }
    });
  });
}

/**
 * Handle Apple Sign-In
 * On iOS: Uses @capacitor-community/apple-sign-in native plugin
 * On web/Android: Not supported (Apple requires native iOS for best experience)
 */
export async function signInWithApple(): Promise<SocialLoginResult> {
  if (Capacitor.getPlatform() === "ios") {
    try {
      const { SignInWithApple } = await import("@capacitor-community/apple-sign-in");
      
      const result = await SignInWithApple.authorize({
        clientId: "com.fayaflex.app",
        redirectURI: "https://www.fayaflex.com/api/auth/apple/callback",
        scopes: "email name",
        state: crypto.randomUUID(),
        nonce: crypto.randomUUID(),
      });
      
      if (!result.response?.identityToken) {
        throw new Error("Failed to get identity token from Apple Sign-In");
      }
      
      // Send identity token to backend for verification
      const res = await apiRequest("POST", "/api/auth/apple", {
        idToken: result.response.identityToken,
        authorizationCode: result.response.authorizationCode,
        user: result.response.user ? {
          email: result.response.email,
          givenName: result.response.givenName,
          familyName: result.response.familyName,
        } : undefined,
      });
      const data = await res.json();
      return data;
    } catch (error: any) {
      console.error("Native Apple Sign-In error:", error);
      if (error.message?.includes("cancelled") || error.code === "1001") {
        throw new Error("Sign in with Apple was cancelled");
      }
      throw new Error(error.message || "Apple Sign-In failed");
    }
  }

  // Apple Sign-In is only fully supported on iOS
  // On web, you could implement Sign in with Apple JS but it requires domain verification
  throw new Error("Sign in with Apple is only available on iOS devices. Please use another sign-in method.");
}

/**
 * Check if social login is available
 * Returns availability based on platform and configuration
 */
export function isSocialLoginAvailable(): { google: boolean; apple: boolean } {
  const platform = Capacitor.getPlatform();
  const isNative = Capacitor.isNativePlatform();

  return {
    // Google is available on native (with plugin) and on web (if configured and GIS loaded)
    google: isNative || (!!GOOGLE_CLIENT_ID && typeof google !== "undefined"),
    // Apple Sign-In is only available on iOS
    apple: platform === "ios",
  };
}

// Declare Google Identity Services types for web
declare global {
  const google: {
    accounts: {
      id: {
        initialize: (config: any) => void;
        prompt: (callback?: (notification: any) => void) => void;
        renderButton: (element: HTMLElement, config: any) => void;
      };
      oauth2: {
        initCodeClient: (config: any) => { requestCode: () => void };
      };
    };
  };
}
