import { Capacitor } from "@capacitor/core";
import { apiRequest, getApiUrl, getAuthHeaders } from "./queryClient";

// We dynamically import @capacitor/push-notifications so the web bundle
// doesn't break if the plugin isn't available in the browser environment.

const STORAGE_KEY = "fayaflex_push_token";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i);
  return output;
}

async function registerToken(token: string, platform: "ios" | "android" | "web", webSubscription?: any) {
  try {
    await apiRequest("POST", "/api/push/register", { token, platform, webSubscription });
    localStorage.setItem(STORAGE_KEY, token);
  } catch (e) {
    console.warn("[Push] register failed:", e);
  }
}

async function unregisterToken() {
  const token = localStorage.getItem(STORAGE_KEY);
  if (!token) return;
  try {
    await fetch(`${getApiUrl()}/api/push/token?token=${encodeURIComponent(token)}`, {
      method: "DELETE",
      credentials: "include",
      headers: getAuthHeaders(),
    });
  } catch {}
  localStorage.removeItem(STORAGE_KEY);
}

// ---------------- Native (iOS / Android via FCM/APNs) ----------------
async function initNativePush() {
  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");

    const perm = await PushNotifications.checkPermissions();
    let granted = perm.receive === "granted";
    if (!granted) {
      const req = await PushNotifications.requestPermissions();
      granted = req.receive === "granted";
    }
    if (!granted) {
      console.log("[Push] Native push permission not granted");
      return;
    }

    PushNotifications.addListener("registration", async (token) => {
      const platform = Capacitor.getPlatform() === "ios" ? "ios" : "android";
      await registerToken(token.value, platform);
      console.log("[Push] Native token registered");
    });

    PushNotifications.addListener("registrationError", (err) => {
      console.error("[Push] Native registration error:", err);
    });

    PushNotifications.addListener("pushNotificationActionPerformed", (notif) => {
      // Navigate when user taps a notification
      const url = notif.notification.data?.url;
      if (url && typeof url === "string") {
        try { window.location.href = url; } catch {}
      }
    });

    await PushNotifications.register();
  } catch (e) {
    console.warn("[Push] initNativePush failed:", e);
  }
}

// ---------------- Web (PWA via Push API + VAPID) ----------------
async function initWebPush() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    console.log("[Push] Web push not supported in this browser");
    return;
  }

  try {
    // Reuse the existing service worker registration
    const reg = await navigator.serviceWorker.ready;

    // Already subscribed? Re-register the token (server may have lost it)
    let subscription = await reg.pushManager.getSubscription();

    if (!subscription) {
      // Ask permission
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        console.log("[Push] Web push permission not granted");
        return;
      }

      // Get VAPID public key from server
      const res = await fetch(`${getApiUrl()}/api/push/vapid-public-key`);
      if (!res.ok) {
        console.warn("[Push] No VAPID key available");
        return;
      }
      const { publicKey } = await res.json();

      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
    }

    const subJson: any = subscription.toJSON();
    await registerToken(subJson.endpoint, "web", subJson);
    console.log("[Push] Web push subscribed");
  } catch (e) {
    console.warn("[Push] initWebPush failed:", e);
  }
}

// Single entry point — call after user is authenticated
let initialized = false;
let initInFlight = false;
export async function initPushNotifications() {
  if (initialized || initInFlight) return;
  initInFlight = true;
  try {
    if (Capacitor.isNativePlatform()) {
      await initNativePush();
    } else {
      await initWebPush();
    }
    // Only mark initialized if a token was actually saved — otherwise allow retries
    if (localStorage.getItem(STORAGE_KEY)) {
      initialized = true;
    }
  } finally {
    initInFlight = false;
  }
}

// Call on logout to clean up
export async function disablePushNotifications() {
  initialized = false;
  await unregisterToken();
}

// Re-export so settings UI can request a server-side test
export async function sendTestPush() {
  return apiRequest("POST", "/api/push/test", {});
}
