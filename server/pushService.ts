import webpush from "web-push";
import admin from "firebase-admin";
import apn from "@parse/node-apn";
import { storage } from "./storage";
import { DEFAULT_NOTIFICATION_PREFS, type NotificationPrefs } from "@shared/schema";

type NotificationType = keyof NotificationPrefs;

let webPushReady = false;
let firebaseReady = false;
let apnsProviderProd: apn.Provider | null = null;
let apnsProviderSandbox: apn.Provider | null = null;
let apnsBundleId: string | null = null;
let vapidPublicKey: string | null = null;

const APNS_TOKEN_REGEX = /^[0-9a-fA-F]{64}$/;

// ---------------- Init Web Push ----------------
function initWebPush() {
  let pub = process.env.VAPID_PUBLIC_KEY;
  let priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:support@fayaflex.com";

  if (!pub || !priv) {
    // Auto-generate keys on first run so dev still works.
    // For production, copy these into env vars so they persist across deploys.
    const keys = webpush.generateVAPIDKeys();
    pub = keys.publicKey;
    priv = keys.privateKey;
    console.warn(
      "[Push] VAPID keys not found in env vars — generated ephemeral keys for this run.\n" +
      "       For production, set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY env vars to:\n" +
      `       VAPID_PUBLIC_KEY=${pub}\n` +
      `       VAPID_PRIVATE_KEY=${priv}`
    );
  }

  try {
    webpush.setVapidDetails(subject, pub, priv);
    webPushReady = true;
    vapidPublicKey = pub;
    console.log("[Push] Web Push (VAPID) initialized");
  } catch (e: any) {
    console.error("[Push] Failed to initialize web-push:", e.message);
  }
}

// ---------------- Init Firebase Admin ----------------
function initFirebase() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) {
    console.log("[Push] FIREBASE_SERVICE_ACCOUNT not set — native push (FCM) disabled");
    return;
  }
  try {
    const serviceAccount = JSON.parse(raw);
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
    firebaseReady = true;
    console.log("[Push] Firebase Admin (FCM) initialized");
  } catch (e: any) {
    console.error("[Push] Failed to initialize Firebase Admin:", e.message);
  }
}

// ---------------- Init APNs (direct, no Firebase) ----------------
function normalizeApnsKey(raw: string): string {
  let k = raw.trim();
  // Replace literal backslash-n with real newline
  k = k.replace(/\\n/g, "\n");
  // If there are no real newlines, the value got flattened — rebuild it.
  if (!k.includes("\n")) {
    const beginMarker = "-----BEGIN PRIVATE KEY-----";
    const endMarker = "-----END PRIVATE KEY-----";
    const beginIdx = k.indexOf(beginMarker);
    const endIdx = k.indexOf(endMarker);
    if (beginIdx >= 0 && endIdx > beginIdx) {
      const body = k.slice(beginIdx + beginMarker.length, endIdx).replace(/\s+/g, "");
      // Re-wrap base64 body to 64-char lines
      const wrapped = body.match(/.{1,64}/g)?.join("\n") || body;
      k = `${beginMarker}\n${wrapped}\n${endMarker}`;
    }
  }
  return k;
}

function initApns() {
  const rawKey = process.env.APNS_KEY;
  const keyId = process.env.APNS_KEY_ID;
  const teamId = process.env.APNS_TEAM_ID;
  const bundleId = process.env.APNS_BUNDLE_ID || "com.fayaflex.app";

  // Optional separate sandbox key (Apple lets you scope keys to one environment)
  const rawKeySandbox = process.env.APNS_KEY_SANDBOX;
  const keyIdSandbox = process.env.APNS_KEY_ID_SANDBOX;

  if (!rawKey || !keyId || !teamId) {
    console.log(
      `[Push] APNs not configured — APNS_KEY=${!!rawKey} APNS_KEY_ID=${!!keyId} APNS_TEAM_ID=${!!teamId}`
    );
    return;
  }

  apnsBundleId = bundleId;

  // A single .p8 APNs Auth Key CAN work for BOTH production and sandbox
  // gateways, but Apple also lets you scope keys to a single environment.
  // Default: use the env-specific key for each gateway (correct when the
  // sandbox key is sandbox-only, which is common). Set
  // APNS_PREFER_SANDBOX_KEY=true to force the sandbox key on prod too
  // (only safe if the sandbox key is dual-scoped).
  const preferSandbox = (process.env.APNS_PREFER_SANDBOX_KEY ?? "false") === "true";

  const prodKeyRaw =
    preferSandbox && rawKeySandbox && keyIdSandbox ? rawKeySandbox : rawKey;
  const prodKeyId =
    preferSandbox && rawKeySandbox && keyIdSandbox ? keyIdSandbox : keyId;

  try {
    const key = normalizeApnsKey(prodKeyRaw);
    apnsProviderProd = new apn.Provider({
      token: { key, keyId: prodKeyId, teamId },
      production: true,
    });
    console.log(`[Push] APNs prod initialized (keyId=${prodKeyId})`);
  } catch (e: any) {
    console.error("[Push] Failed to initialize APNs prod:", e.message);
  }

  try {
    if (rawKeySandbox && keyIdSandbox) {
      const keyS = normalizeApnsKey(rawKeySandbox);
      apnsProviderSandbox = new apn.Provider({
        token: { key: keyS, keyId: keyIdSandbox, teamId },
        production: false,
      });
      console.log(`[Push] APNs sandbox initialized (keyId=${keyIdSandbox})`);
    } else {
      const key = normalizeApnsKey(rawKey);
      apnsProviderSandbox = new apn.Provider({ token: { key, keyId, teamId }, production: false });
      console.log(`[Push] APNs sandbox initialized (using prod key)`);
    }
  } catch (e: any) {
    console.error("[Push] Failed to initialize APNs sandbox:", e.message);
  }
}

initWebPush();
initFirebase();
initApns();

export function getVapidPublicKey(): string | null {
  return vapidPublicKey;
}

// ---------------- Helpers ----------------
function isPrefEnabled(prefs: NotificationPrefs | null | undefined, type: NotificationType): boolean {
  const p = { ...DEFAULT_NOTIFICATION_PREFS, ...(prefs || {}) };
  return p[type] !== false;
}

// ---------------- Public API ----------------
export interface PushPayload {
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, string>; // extra payload (deep-link path, ids, etc.)
  url?: string; // path to open when notification clicked, e.g. "/teams/abc"
}

export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  try {
    const user = await storage.getUser(userId);
    if (!user) return;

    const prefs = (user.notificationPrefs as NotificationPrefs | null) ?? null;
    if (!isPrefEnabled(prefs, payload.type)) {
      return; // user opted out of this notification type
    }

    // Persist a copy in the in-app Notifications Center so the user can see
    // every alert later, even if the OS-level push didn't display.
    try {
      await storage.createAppNotification({
        userId,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        link: payload.url ?? null,
        data: payload.data ?? null,
      });
    } catch (e: any) {
      console.error("[Push] failed to persist app notification:", e.message);
    }

    const tokens = await storage.getUserPushTokens(userId);
    if (!tokens.length) return;

    await Promise.all(tokens.map((t) => sendToToken(t, payload)));
  } catch (e: any) {
    console.error("[Push] sendPushToUser error:", e.message);
  }
}

export async function sendPushToUsers(userIds: string[], payload: PushPayload): Promise<void> {
  await Promise.all(userIds.map((id) => sendPushToUser(id, payload)));
}

async function sendToToken(t: { id: string; token: string; platform: string; webSubscription: any }, payload: PushPayload) {
  try {
    if (t.platform === "web") {
      if (!webPushReady) return;
      const subscription = t.webSubscription;
      if (!subscription) return;
      await webpush.sendNotification(
        subscription,
        JSON.stringify({
          title: payload.title,
          body: payload.body,
          url: payload.url || "/",
          data: payload.data || {},
        })
      );
    } else if (t.platform === "ios" && APNS_TOKEN_REGEX.test(t.token)) {
      if ((!apnsProviderProd && !apnsProviderSandbox) || !apnsBundleId) {
        console.warn("[Push] APNs not initialized — cannot send to iOS device");
        return;
      }
      // Stable collapse-id so iOS dedupes if both gateways deliver.
      const collapseId = `${payload.type || "msg"}-${t.id}-${Date.now()}`;
      const buildNote = () => {
        const note = new apn.Notification();
        note.topic = apnsBundleId!;
        // Required since iOS 13 — without these headers Apple silently
        // drops the notification while still returning 200 OK.
        note.pushType = "alert";
        note.priority = 10;
        note.expiry = Math.floor(Date.now() / 1000) + 3600;
        note.collapseId = collapseId;
        note.alert = { title: payload.title, body: payload.body };
        note.sound = "default";
        note.badge = 1;
        note.mutableContent = 1;
        note.payload = {
          url: payload.url || "/",
          type: payload.type,
          ...(payload.data || {}),
        };
        return note;
      };

      const trySend = async (provider: apn.Provider | null, label: string) => {
        if (!provider) return null;
        const result = await provider.send(buildNote(), t.token);
        if (result.failed.length === 0) {
          console.log(`[Push] APNs (${label}) sent OK to ${t.token.slice(0, 8)}…`);
          return { ok: true as const };
        }
        const failure = result.failed[0];
        const reason = failure.response?.reason || failure.error?.message || "unknown";
        const status = failure.status;
        return { ok: false as const, reason, status };
      };

      // With JWT-based APNs auth, Apple returns 200 OK for the wrong environment
      // and silently drops the message. The only reliable approach is to attempt
      // BOTH gateways every time — the right one delivers, the wrong one no-ops.
      // Same collapse-id on both ensures iOS shows only a single banner.
      const [prodRes, sandboxRes] = await Promise.all([
        trySend(apnsProviderProd, "prod"),
        trySend(apnsProviderSandbox, "sandbox"),
      ]);

      // Log per-gateway results so we can see env mismatches.
      if (prodRes && !prodRes.ok) {
        console.log(`[Push] APNs (prod) FAILED for ${t.token.slice(0, 8)}… status=${prodRes.status} reason=${prodRes.reason}`);
      }
      if (sandboxRes && !sandboxRes.ok) {
        console.log(`[Push] APNs (sandbox) FAILED for ${t.token.slice(0, 8)}… status=${sandboxRes.status} reason=${sandboxRes.reason}`);
      }

      const anyOk = prodRes?.ok || sandboxRes?.ok;
      if (!anyOk) {
        const reason =
          (prodRes && !prodRes.ok && prodRes.reason) ||
          (sandboxRes && !sandboxRes.ok && sandboxRes.reason) ||
          "unknown";
        const isDead = reason === "BadDeviceToken" || reason === "Unregistered" || reason === "DeviceTokenNotForTopic";
        if (isDead) {
          await storage.deletePushTokenById(t.id);
          console.log(`[Push] Pruned dead APNs token ${t.id} (reason=${reason})`);
        }
      }
    } else {
      // FCM token (android, or future iOS via Firebase SDK)
      if (!firebaseReady) return;
      await admin.messaging().send({
        token: t.token,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: {
          url: payload.url || "/",
          type: payload.type,
          ...(payload.data || {}),
        },
        android: {
          priority: "high",
          notification: { sound: "default", channelId: "fayaflex-default" },
        },
        apns: {
          payload: {
            aps: { sound: "default", badge: 1 },
          },
        },
      });
    }
  } catch (e: any) {
    const msg = e?.message || String(e);
    const code = e?.errorInfo?.code || e?.statusCode;

    // Prune dead tokens
    const isDead =
      code === 410 || // web push gone
      code === 404 ||
      code === "messaging/registration-token-not-registered" ||
      code === "messaging/invalid-registration-token";

    if (isDead) {
      try {
        await storage.deletePushTokenById(t.id);
        console.log(`[Push] Pruned dead token ${t.id} (${t.platform})`);
      } catch {}
    } else {
      console.warn(`[Push] Send failed for ${t.platform}:`, msg);
    }
  }
}

// ---------------- Trigger helpers (so callers don't have to know wording) ----------------

export function triggerTeamMessage(opts: {
  teamId: string;
  teamName: string;
  senderName: string;
  recipientUserIds: string[];
  preview: string;
}) {
  void sendPushToUsers(opts.recipientUserIds, {
    type: "teamMessage",
    title: `${opts.teamName}`,
    body: `${opts.senderName}: ${opts.preview.slice(0, 120)}`,
    url: `/teams/${opts.teamId}`,
  });
}

export function triggerReaction(opts: {
  ownerUserId: string;
  reactorName: string;
  reactionType: "thumbs_up" | "thumbs_down";
  activityId: string;
}) {
  const isUp = opts.reactionType === "thumbs_up";
  void sendPushToUser(opts.ownerUserId, {
    type: "reaction",
    title: isUp ? "You got cheered on!" : "Someone reacted",
    body: `${opts.reactorName} ${isUp ? "gave you a thumbs up" : "reacted to your activity"}`,
    url: `/feed`,
    data: { activityId: opts.activityId },
  });
}

export function triggerComment(opts: {
  ownerUserId: string;
  commenterName: string;
  preview: string;
  activityId: string;
}) {
  void sendPushToUser(opts.ownerUserId, {
    type: "comment",
    title: `${opts.commenterName} commented`,
    body: opts.preview.slice(0, 120),
    url: `/feed`,
    data: { activityId: opts.activityId },
  });
}

export function triggerDirectMessage(opts: {
  recipientUserId: string;
  senderId: string;
  senderName: string;
  preview: string;
}) {
  void sendPushToUser(opts.recipientUserId, {
    type: "directMessage",
    title: `${opts.senderName}`,
    body: opts.preview.slice(0, 120),
    url: `/messages/${opts.senderId}`,
  });
}

export function triggerMonthlyWinner(opts: {
  teamId: string;
  teamName: string;
  winnerName: string;
  recipientUserIds: string[];
}) {
  void sendPushToUsers(opts.recipientUserIds, {
    type: "monthlyWinner",
    title: `🏆 ${opts.teamName} has a champion!`,
    body: `${opts.winnerName} won this month's challenge. Congratulations!`,
    url: `/teams/${opts.teamId}/victory-wall`,
  });
}

export function triggerRankChange(opts: {
  userId: string;
  oldRank: number;
  newRank: number;
}) {
  // Only notify when the user actually lost ground (rank number got bigger).
  // newRank > oldRank means someone passed them (e.g. #2 -> #3).
  if (opts.newRank <= opts.oldRank) return;
  void sendPushToUser(opts.userId, {
    type: "rankChange",
    title: "You've been overtaken!",
    body: `You dropped from #${opts.oldRank} to #${opts.newRank} on the leaderboard. Time to fight back!`,
    url: `/leaderboard`,
  });
}
