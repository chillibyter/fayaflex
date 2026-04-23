import { Capacitor } from "@capacitor/core";
import { apiRequest, getApiUrl, getAuthHeaders } from "./queryClient";

// We dynamically import @capacitor/push-notifications so the web bundle
// doesn't break if the plugin isn't available in the browser environment.

// Push tokens and status are scoped per authenticated user so that on a
// shared device, switching accounts can't make user B inherit user A's
// "registered" state (which would otherwise short-circuit registration
// for user B). The active user's id is set via setActivePushUser(),
// called from the auth hook on login/logout.
const TOKEN_KEY_PREFIX = "fayaflex_push_token:";
const STATUS_KEY_PREFIX = "fayaflex_push_status:";
const ACTIVE_USER_KEY = "fayaflex_push_active_user";

function activeUserId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_USER_KEY);
  } catch {
    return null;
  }
}

function tokenKey(): string | null {
  const id = activeUserId();
  return id ? `${TOKEN_KEY_PREFIX}${id}` : null;
}

function statusKey(): string | null {
  const id = activeUserId();
  return id ? `${STATUS_KEY_PREFIX}${id}` : null;
}

export function setActivePushUser(userId: string | null) {
  try {
    if (userId) localStorage.setItem(ACTIVE_USER_KEY, userId);
    else localStorage.removeItem(ACTIVE_USER_KEY);
  } catch {}
}

export type PushStatus = {
  platform: "ios" | "android" | "web" | "unknown";
  permission: "granted" | "denied" | "prompt" | "unsupported" | "unknown";
  registered: boolean;
  lastError?: string | null;
  updatedAt: number;
};

function readStatus(): PushStatus {
  const key = statusKey();
  if (!key) {
    return { platform: "unknown", permission: "unknown", registered: false, updatedAt: 0 };
  }
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    platform: "unknown",
    permission: "unknown",
    registered: false,
    updatedAt: 0,
  };
}

function writeStatus(patch: Partial<PushStatus>) {
  const key = statusKey();
  if (!key) return; // No active user — don't persist status to a global key.
  const next: PushStatus = { ...readStatus(), ...patch, updatedAt: Date.now() };
  try {
    localStorage.setItem(key, JSON.stringify(next));
    // Let UI subscribers update without a full reload
    window.dispatchEvent(new CustomEvent("fayaflex:push-status", { detail: next }));
  } catch {}
}

export function getPushStatus(): PushStatus {
  return readStatus();
}

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
    const key = tokenKey();
    if (key) localStorage.setItem(key, token);
    writeStatus({ platform, registered: true, lastError: null });
  } catch (e: any) {
    console.warn("[Push] register failed:", e);
    writeStatus({ platform, registered: false, lastError: String(e?.message || e) });
  }
}

async function unregisterToken() {
  const key = tokenKey();
  const sKey = statusKey();
  const token = key ? localStorage.getItem(key) : null;
  if (token) {
    try {
      await fetch(getApiUrl(`/api/push/token?token=${encodeURIComponent(token)}`), {
        method: "DELETE",
        credentials: "include",
        headers: getAuthHeaders(),
      });
    } catch {}
  }
  if (key) localStorage.removeItem(key);
  if (sKey) localStorage.removeItem(sKey);
}

// ---------------- Native (iOS / Android via FCM/APNs) ----------------
// We attach the registration listeners exactly once per app session so
// re-running initNativePush() never produces duplicate POSTs.
let nativeListenersAttached = false;

async function initNativePush() {
  const platform: "ios" | "android" =
    Capacitor.getPlatform() === "ios" ? "ios" : "android";
  writeStatus({ platform });

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
      writeStatus({ permission: "denied", registered: false });
      return false;
    }
    writeStatus({ permission: "granted" });

    if (!nativeListenersAttached) {
      nativeListenersAttached = true;

      PushNotifications.addListener("registration", async (token) => {
        await registerToken(token.value, platform);
        console.log(`[Push] ${platform} token registered`);
      });

      PushNotifications.addListener("registrationError", (err) => {
        // Common Android cause: missing google-services.json / FCM not set up.
        const msg = (err as any)?.error || JSON.stringify(err);
        console.error("[Push] Native registration error:", msg);
        writeStatus({ registered: false, lastError: `Registration error: ${msg}` });
      });

      // Show in-app banner when notification arrives while app is foregrounded
      // (iOS does NOT show system banners for foreground apps).
      PushNotifications.addListener("pushNotificationReceived", (notif) => {
        try {
          window.dispatchEvent(
            new CustomEvent("fayaflex:push", {
              detail: {
                title: notif.title || "FayaFlex",
                body: notif.body || "",
                url: (notif.data as any)?.url,
              },
            })
          );
        } catch {}
      });

      PushNotifications.addListener("pushNotificationActionPerformed", (notif) => {
        // Navigate when user taps a notification
        const url = notif.notification.data?.url;
        if (url && typeof url === "string") {
          try { window.location.href = url; } catch {}
        }
      });
    }

    await PushNotifications.register();

    // Android-specific watchdog: if FCM is mis-configured (e.g. missing
    // google-services.json) the registration listener will never fire AND
    // registrationError sometimes doesn't either. Log a diagnostic so
    // the issue is visible in `adb logcat` and the settings page.
    if (platform === "android") {
      setTimeout(() => {
        const k = tokenKey();
        if (!k || !localStorage.getItem(k)) {
          const msg =
            "Android push token did not arrive within 10s — check google-services.json and FCM project setup.";
          console.warn("[Push]", msg);
          const status = readStatus();
          if (!status.registered && !status.lastError) {
            writeStatus({ lastError: msg });
          }
        }
      }, 10_000);
    }

    return true;
  } catch (e: any) {
    console.warn("[Push] initNativePush failed:", e);
    writeStatus({ lastError: String(e?.message || e) });
    return false;
  }
}

// ---------------- Web (PWA via Push API + VAPID) ----------------
async function initWebPush() {
  writeStatus({ platform: "web" });
  if (typeof window === "undefined") return false;
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    console.log("[Push] Web push not supported in this browser");
    writeStatus({ permission: "unsupported" });
    return false;
  }

  try {
    const reg = await navigator.serviceWorker.ready;
    let subscription = await reg.pushManager.getSubscription();

    if (!subscription) {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        console.log("[Push] Web push permission not granted");
        writeStatus({ permission: perm === "denied" ? "denied" : "prompt", registered: false });
        return false;
      }

      const res = await fetch(getApiUrl(`/api/push/vapid-public-key`));
      if (!res.ok) {
        console.warn("[Push] No VAPID key available");
        writeStatus({ lastError: "Server has no VAPID key" });
        return false;
      }
      const { publicKey } = await res.json();

      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
    }
    writeStatus({ permission: "granted" });

    const subJson: any = subscription.toJSON();
    await registerToken(subJson.endpoint, "web", subJson);
    console.log("[Push] Web push subscribed");
    return true;
  } catch (e: any) {
    console.warn("[Push] initWebPush failed:", e);
    writeStatus({ lastError: String(e?.message || e) });
    return false;
  }
}

// Single entry point — call after user is authenticated
let initInFlight = false;
let resumeListenerAttached = false;

export async function initPushNotifications() {
  if (initInFlight) return;
  // If we already have a token saved AND a previous status confirmed
  // registration for *this user*, don't request permission again. We still
  // re-register on app resume below to recover from server-side token loss.
  const status = readStatus();
  const key = tokenKey();
  if (status.registered && key && localStorage.getItem(key)) {
    return;
  }

  initInFlight = true;
  try {
    if (Capacitor.isNativePlatform()) {
      await initNativePush();
      // On native, re-attempt on app resume so users who toggle the OS
      // permission later (settings → app → notifications) get registered
      // without having to reinstall the app.
      if (!resumeListenerAttached) {
        try {
          const { App } = await import("@capacitor/app");
          App.addListener("appStateChange", (state) => {
            if (state.isActive) {
              const s = readStatus();
              if (!s.registered) {
                initNativePush().catch(() => {});
              }
            }
          });
          resumeListenerAttached = true;
        } catch {
          // @capacitor/app not installed; ignore.
        }
      }
    } else {
      await initWebPush();
    }
  } finally {
    initInFlight = false;
  }
}

// Call on logout to clean up. Clears this user's token + status so a
// subsequent login on the same device starts fresh.
export async function disablePushNotifications() {
  await unregisterToken();
  setActivePushUser(null);
}

// Re-export so settings UI can request a server-side test
export async function sendTestPush() {
  return apiRequest("POST", "/api/push/test", {});
}
