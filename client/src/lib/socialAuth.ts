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
    try {
      const { GoogleAuth } = await import("@southdevs/capacitor-google-auth");

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

      const res = await apiRequest("POST", "/api/auth/google", {
        idToken: result.authentication.idToken,
      });
      const data = await res.json();
      const { token, ...user } = data;
      return { user, token };
    } catch (error: any) {
      console.error("Native Google Sign-In error:", error);
      if (error.message?.includes("not implemented") || error.message?.includes("not available") || error.message?.includes("plugin_not_installed")) {
        console.log("[SocialAuth] Native plugin unavailable, falling back to redirect flow");
        return signInWithGoogleRedirect();
      }
      throw new Error(error.message || "Google Sign-In failed");
    }
  }

  return signInWithGoogleWeb();
}

async function signInWithGoogleRedirect(): Promise<SocialLoginResult> {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error("Google Sign-In is not configured.");
  }
  const redirectUri = `${window.location.origin}/api/auth/google/callback`;
  const state = crypto.randomUUID();
  sessionStorage.setItem("google_auth_state", state);
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "offline",
    prompt: "select_account",
  });
  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  return new Promise(() => {});
}

function signInWithGoogleWeb(): Promise<SocialLoginResult> {
  return new Promise((resolve, reject) => {
    if (!GOOGLE_CLIENT_ID) {
      reject(new Error("Google Sign-In is not configured. Please set up VITE_GOOGLE_CLIENT_ID."));
      return;
    }

    if (typeof google === "undefined" || !google.accounts) {
      reject(new Error("Google Sign-In is not available. Please ensure the Google Identity Services script is loaded."));
      return;
    }

    console.log("[SocialAuth] Starting Google OAuth2 popup flow");
    const client = google.accounts.oauth2.initCodeClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: "openid email profile",
      ux_mode: "popup",
      callback: async (response: any) => {
        if (response.error) {
          console.error("[SocialAuth] OAuth2 error:", response.error);
          reject(new Error("Google Sign-In was cancelled"));
          return;
        }
        try {
          const res = await apiRequest("POST", "/api/auth/google", {
            code: response.code,
          });
          const data = await res.json();
          const { token, ...user } = data;
          resolve({ user, token });
        } catch (error) {
          reject(error);
        }
      },
    });
    client.requestCode();
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
