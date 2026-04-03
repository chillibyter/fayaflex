/**
 * Garmin Health API integration
 *
 * Uses OAuth 1.0a (3-legged) to connect users' Garmin Connect accounts and
 * pull active calories, steps, and workout data via the Wellness REST API.
 *
 * Endpoints used:
 *   POST https://connectapi.garmin.com/oauth-service/oauth/request_token
 *   GET  https://connect.garmin.com/oauthConfirm  (user authorization)
 *   POST https://connectapi.garmin.com/oauth-service/oauth/access_token
 *   GET  https://apis.garmin.com/wellness-api/rest/dailies
 *   GET  https://apis.garmin.com/wellness-api/rest/activities
 */

import crypto from "crypto";

const GARMIN_REQUEST_TOKEN_URL =
  "https://connectapi.garmin.com/oauth-service/oauth/request_token";
const GARMIN_ACCESS_TOKEN_URL =
  "https://connectapi.garmin.com/oauth-service/oauth/access_token";
const GARMIN_AUTH_URL = "https://connect.garmin.com/oauthConfirm";
const GARMIN_API_BASE = "https://apis.garmin.com/wellness-api/rest";

// ─── OAuth 1.0a helpers ──────────────────────────────────────────────────────

function generateNonce(): string {
  return crypto.randomBytes(16).toString("hex");
}

function percentEncode(s: string): string {
  return encodeURIComponent(s).replace(/[!'()*]/g, (c) =>
    "%" + c.charCodeAt(0).toString(16).toUpperCase()
  );
}

/**
 * Build and sign an OAuth 1.0a Authorization header.
 * queryParams: additional query-string parameters that must be included in the
 *              signature base string but should NOT appear in the header itself.
 */
function buildAuthHeader(
  method: string,
  url: string,
  consumerKey: string,
  consumerSecret: string,
  tokenKey?: string,
  tokenSecret?: string,
  verifier?: string,
  queryParams: Record<string, string | number> = {}
): string {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = generateNonce();

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: nonce,
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: timestamp,
    oauth_version: "1.0",
  };
  if (tokenKey) oauthParams.oauth_token = tokenKey;
  if (verifier) oauthParams.oauth_verifier = verifier;

  // All params (oauth + query) must be part of the signature base string
  const allParams: Record<string, string> = {
    ...oauthParams,
    ...Object.fromEntries(
      Object.entries(queryParams).map(([k, v]) => [k, String(v)])
    ),
  };

  const paramString = Object.keys(allParams)
    .sort()
    .map((k) => `${percentEncode(k)}=${percentEncode(allParams[k])}`)
    .join("&");

  const baseString =
    method.toUpperCase() +
    "&" +
    percentEncode(url) +
    "&" +
    percentEncode(paramString);

  const signingKey =
    percentEncode(consumerSecret) +
    "&" +
    (tokenSecret ? percentEncode(tokenSecret) : "");

  const signature = crypto
    .createHmac("sha1", signingKey)
    .update(baseString)
    .digest("base64");

  oauthParams.oauth_signature = signature;

  const headerParts = Object.entries(oauthParams)
    .map(([k, v]) => `${k}="${percentEncode(v)}"`)
    .join(", ");

  return `OAuth ${headerParts}`;
}

// ─── Step 1: Request Token ───────────────────────────────────────────────────

export async function getRequestToken(
  consumerKey: string,
  consumerSecret: string,
  callbackUrl: string
): Promise<{ oauthToken: string; oauthTokenSecret: string }> {
  const authHeader = buildAuthHeader(
    "POST",
    GARMIN_REQUEST_TOKEN_URL,
    consumerKey,
    consumerSecret,
    undefined,
    undefined,
    undefined,
    { oauth_callback: callbackUrl }
  );

  const response = await fetch(GARMIN_REQUEST_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `oauth_callback=${percentEncode(callbackUrl)}`,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Garmin request token failed (${response.status}): ${body}`);
  }

  const body = await response.text();
  const params = new URLSearchParams(body);
  const oauthToken = params.get("oauth_token");
  const oauthTokenSecret = params.get("oauth_token_secret");

  if (!oauthToken || !oauthTokenSecret) {
    throw new Error(`Unexpected Garmin response: ${body}`);
  }

  return { oauthToken, oauthTokenSecret };
}

// ─── Build the URL to redirect the user to for authorization ─────────────────

export function buildAuthorizationUrl(requestToken: string): string {
  return `${GARMIN_AUTH_URL}?oauth_token=${encodeURIComponent(requestToken)}`;
}

// ─── Step 3: Exchange verifier for Access Token ───────────────────────────────

export async function getAccessToken(
  consumerKey: string,
  consumerSecret: string,
  requestToken: string,
  requestTokenSecret: string,
  verifier: string
): Promise<{ oauthToken: string; oauthTokenSecret: string }> {
  const authHeader = buildAuthHeader(
    "POST",
    GARMIN_ACCESS_TOKEN_URL,
    consumerKey,
    consumerSecret,
    requestToken,
    requestTokenSecret,
    verifier
  );

  const response = await fetch(GARMIN_ACCESS_TOKEN_URL, {
    method: "POST",
    headers: { Authorization: authHeader },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Garmin access token failed (${response.status}): ${body}`);
  }

  const body = await response.text();
  const params = new URLSearchParams(body);
  const oauthToken = params.get("oauth_token");
  const oauthTokenSecret = params.get("oauth_token_secret");

  if (!oauthToken || !oauthTokenSecret) {
    throw new Error(`Unexpected Garmin token response: ${body}`);
  }

  return { oauthToken, oauthTokenSecret };
}

// ─── Signed API call helper ───────────────────────────────────────────────────

async function garminGet(
  endpoint: string,
  queryParams: Record<string, string | number>,
  consumerKey: string,
  consumerSecret: string,
  userToken: string,
  userTokenSecret: string
): Promise<any> {
  const url = `${GARMIN_API_BASE}/${endpoint}`;
  const authHeader = buildAuthHeader(
    "GET",
    url,
    consumerKey,
    consumerSecret,
    userToken,
    userTokenSecret,
    undefined,
    queryParams
  );

  const queryString = Object.entries(queryParams)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");

  const response = await fetch(`${url}?${queryString}`, {
    headers: { Authorization: authHeader },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Garmin API ${endpoint} failed (${response.status}): ${body}`);
  }

  return response.json();
}

// ─── Data fetching ────────────────────────────────────────────────────────────

export interface GarminDailySummary {
  summaryId: string;
  startTimeInSeconds: number;
  activeKilocalories: number;
  bmrKilocalories: number;
  totalKilocalories: number;
  steps: number;
  distanceInMeters?: number;
}

export interface GarminActivity {
  summaryId: string;
  startTimeInSeconds: number;
  activityType: string;
  durationInSeconds: number;
  activeKilocalories: number;
  steps?: number;
}

/**
 * Fetch daily summaries for a date range.
 * startTime / endTime are Unix timestamps (seconds).
 */
export async function fetchDailies(
  consumerKey: string,
  consumerSecret: string,
  userToken: string,
  userTokenSecret: string,
  startTimeSeconds: number,
  endTimeSeconds: number
): Promise<GarminDailySummary[]> {
  const data = await garminGet(
    "dailies",
    {
      uploadStartTimeInSeconds: startTimeSeconds,
      uploadEndTimeInSeconds: endTimeSeconds,
    },
    consumerKey,
    consumerSecret,
    userToken,
    userTokenSecret
  );
  return data?.dailies ?? [];
}

/**
 * Fetch activity (workout) summaries for a date range.
 */
export async function fetchActivities(
  consumerKey: string,
  consumerSecret: string,
  userToken: string,
  userTokenSecret: string,
  startTimeSeconds: number,
  endTimeSeconds: number
): Promise<GarminActivity[]> {
  const data = await garminGet(
    "activities",
    {
      uploadStartTimeInSeconds: startTimeSeconds,
      uploadEndTimeInSeconds: endTimeSeconds,
    },
    consumerKey,
    consumerSecret,
    userToken,
    userTokenSecret
  );
  return data?.activityFiles ?? data?.activities ?? [];
}

/**
 * Convert a Garmin Unix timestamp (seconds) to a local "YYYY-MM-DD" date string.
 * Garmin timestamps represent the LOCAL start of the day for the user.
 * We treat them as UTC-midnight equivalents for date bucketing purposes.
 */
export function garminTimestampToDate(timestampSeconds: number): string {
  const d = new Date(timestampSeconds * 1000);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Merge dailies + activities into per-day totals.
 * Returns an array of { date, calories, steps, workouts } objects.
 */
export function mergeGarminData(
  dailies: GarminDailySummary[],
  activities: GarminActivity[]
): Array<{ date: string; calories: number; steps: number; workouts: number }> {
  const byDate: Record<
    string,
    { calories: number; steps: number; workouts: number }
  > = {};

  for (const d of dailies) {
    const date = garminTimestampToDate(d.startTimeInSeconds);
    if (!byDate[date]) byDate[date] = { calories: 0, steps: 0, workouts: 0 };
    // Use activeKilocalories — this is already the active (non-resting) burn
    byDate[date].calories = Math.max(byDate[date].calories, d.activeKilocalories || 0);
    byDate[date].steps = Math.max(byDate[date].steps, d.steps || 0);
  }

  for (const a of activities) {
    const date = garminTimestampToDate(a.startTimeInSeconds);
    if (!byDate[date]) byDate[date] = { calories: 0, steps: 0, workouts: 0 };
    byDate[date].workouts += 1;
    // If no daily summary for this day, use activity calories
    if (!byDate[date].calories) {
      byDate[date].calories = a.activeKilocalories || 0;
    }
  }

  return Object.entries(byDate).map(([date, vals]) => ({ date, ...vals }));
}
