import webpush from "web-push";
import admin from "firebase-admin";
import { storage } from "./storage";
import { DEFAULT_NOTIFICATION_PREFS, type NotificationPrefs } from "@shared/schema";

type NotificationType = keyof NotificationPrefs;

let webPushReady = false;
let firebaseReady = false;
let vapidPublicKey: string | null = null;

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

initWebPush();
initFirebase();

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
    } else {
      // ios / android
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
