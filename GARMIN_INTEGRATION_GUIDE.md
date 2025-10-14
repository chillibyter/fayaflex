# Garmin Connect Integration Guide
## UFC - Automatic Fitness Data Sync via Garmin Health API

This guide explains how to complete the Garmin Connect integration for automatic fitness data syncing. The backend infrastructure is ready - you just need to configure OAuth and complete the webhook implementation.

---

## 📋 What's Already Built

✅ **Backend Infrastructure**
- JWT authentication for API requests
- `/api/garmin/connect` - OAuth initiation endpoint (placeholder)
- `/api/webhooks/garmin` - Webhook receiver endpoint (placeholder)
- `/api/devices/sync` - Bulk activity sync endpoint (fully functional)
- Database storage for OAuth tokens in `device_connections` table

✅ **Mobile App Support**
- JWT token endpoint: `/api/auth/mobile-token`
- Enhanced authentication middleware supports both sessions and JWT tokens
- Mobile apps can authenticate with `Authorization: Bearer <token>` header

---

## 🔧 Required Setup

### Step 1: Register for Garmin Developer Account

1. Go to [Garmin Connect Developer Portal](https://developer.garmin.com/)
2. Create an account (free tier available)
3. Register a new application
4. Request access to **Garmin Health API**
5. Note your credentials:
   - **Consumer Key** (like an API key)
   - **Consumer Secret** (like an API secret)

### Step 2: Add Garmin Credentials to Replit

Add these secrets to your Replit environment:

```bash
GARMIN_CONSUMER_KEY=your-consumer-key-here
GARMIN_CONSUMER_SECRET=your-consumer-secret-here
```

You can use the `ask_secrets` tool or add them manually in Replit's Secrets tab.

---

## 🔐 OAuth 1.0a Implementation

Garmin uses **OAuth 1.0a** (not OAuth 2.0), which requires:

### Option 1: Use an OAuth 1.0a Library

Install a library to handle OAuth 1.0a signing:

```bash
npm install oauth-1.0a crypto-js
```

Then update `/api/garmin/connect` endpoint:

```typescript
import OAuth from 'oauth-1.0a';
import crypto from 'crypto';

const oauth = OAuth({
  consumer: {
    key: process.env.GARMIN_CONSUMER_KEY!,
    secret: process.env.GARMIN_CONSUMER_SECRET!
  },
  signature_method: 'HMAC-SHA1',
  hash_function(base_string, key) {
    return crypto
      .createHmac('sha1', key)
      .update(base_string)
      .digest('base64');
  }
});

app.get("/api/garmin/connect", isAuthenticated, async (req: any, res) => {
  const userId = req.user.id;
  const callbackUrl = `${req.protocol}://${req.get('host')}/api/garmin/callback`;
  
  // Step 1: Get request token
  const requestData = {
    url: 'https://connectapi.garmin.com/oauth-service/oauth/request_token',
    method: 'POST',
    data: { oauth_callback: callbackUrl }
  };
  
  const authHeader = oauth.toHeader(oauth.authorize(requestData));
  
  // Make request to Garmin for request token
  const response = await fetch(requestData.url, {
    method: 'POST',
    headers: authHeader
  });
  
  const text = await response.text();
  const params = new URLSearchParams(text);
  const requestToken = params.get('oauth_token');
  
  // Step 2: Redirect user to Garmin authorization page
  const authUrl = `https://connect.garmin.com/oauthConfirm?oauth_token=${requestToken}`;
  res.redirect(authUrl);
});
```

### Option 2: Manual OAuth Flow

If you prefer manual implementation, see [Garmin OAuth 1.0a Documentation](https://developer.garmin.com/gc-developer-program/overview/oauth/).

---

## 🪝 Webhook Implementation

### Step 1: Configure Webhook URL in Garmin

In your Garmin Developer Portal:
1. Go to your application settings
2. Set Push Notification URL to: `https://your-app.replit.app/api/webhooks/garmin`
3. Subscribe to these notification types:
   - `ACTIVITY_SUMMARY` - New activity completed
   - `DAILY_SUMMARY` - Daily stats updated
   - `SLEEP` - Sleep data available (optional)

### Step 2: Process Webhook Data

Update the `/api/webhooks/garmin` endpoint:

```typescript
app.post("/api/webhooks/garmin", async (req, res) => {
  try {
    const webhookData = req.body;
    
    // Garmin webhook format: 
    // { 
    //   userId: "garmin-user-id",
    //   summaries: [{ summaryId: "activity-id", ... }]
    // }
    
    // 1. Find our user by Garmin user ID
    const connection = await storage.getDeviceConnectionByExternalId(
      'garmin', 
      webhookData.userId
    );
    
    if (!connection) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // 2. Fetch activity data from Garmin API
    for (const summary of webhookData.summaries) {
      const activityData = await fetchGarminActivity(
        connection.accessToken,
        summary.summaryId
      );
      
      // 3. Transform Garmin data to our format
      const activities = transformGarminData(activityData);
      
      // 4. Sync to database
      await storage.syncHealthActivities(
        connection.userId,
        'garmin',
        activities
      );
    }
    
    res.status(200).json({ received: true, processed: webhookData.summaries.length });
  } catch (error) {
    console.error("Error processing Garmin webhook:", error);
    res.status(500).json({ message: "Failed to process webhook" });
  }
});

async function fetchGarminActivity(accessToken: string, summaryId: string) {
  const response = await fetch(
    `https://apis.garmin.com/wellness-api/rest/activityDetails?summaryId=${summaryId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  );
  return response.json();
}

function transformGarminData(garminData: any) {
  // Transform Garmin format to our format
  return [{
    date: garminData.calendarDate, // YYYY-MM-DD
    calories: garminData.activeKilocalories || 0,
    steps: garminData.steps || 0,
    workoutType: garminData.activityType || 'general'
  }];
}
```

---

## 🧪 Testing

### Test JWT Authentication (Mobile App)

```bash
# 1. Get a token
curl -X POST https://your-app.replit.app/api/auth/mobile-token \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "password123"}'

# Response: { "token": "eyJhbGc...", "user": {...} }

# 2. Use token to sync data
curl -X POST https://your-app.replit.app/api/devices/sync \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGc..." \
  -d '{
    "provider": "garmin",
    "activities": [
      {"date": "2025-10-14", "calories": 500, "steps": 8000}
    ]
  }'
```

### Test Garmin Webhook

```bash
# Simulate a Garmin webhook
curl -X POST https://your-app.replit.app/api/webhooks/garmin \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "garmin-user-123",
    "summaries": [
      {"summaryId": "activity-456"}
    ]
  }'
```

---

## 📱 Current Mobile App Status

**React Native app created in `/ufc-mobile` folder**
- ✅ Expo + TypeScript template ready
- ⚠️ Dependencies need to be installed in separate environment
- ⚠️ Needs completion on local machine or separate Replit

**To complete mobile app:**
1. Copy `ufc-mobile` folder to local machine or new Replit
2. Run: `npm install expo-health @react-native-async-storage/async-storage axios`
3. Follow implementation in `REACT_NATIVE_SETUP_GUIDE.md`
4. Use JWT token endpoint `/api/auth/mobile-token` for authentication

---

## 🎯 Next Steps

**Quick Win: Manual Garmin Testing**
1. Add Garmin secrets (GARMIN_CONSUMER_KEY, GARMIN_CONSUMER_SECRET)
2. Manually connect a Garmin account in the database
3. Test webhook endpoint with sample data

**Full Implementation:**
1. Install OAuth 1.0a library
2. Complete OAuth flow in `/api/garmin/connect`
3. Add OAuth callback handler
4. Implement webhook processing logic
5. Test end-to-end: Connect → Workout → Auto Sync

**Mobile App:**
1. Set up mobile dev environment
2. Install mobile app dependencies
3. Implement health data fetching
4. Test JWT authentication
5. Enable background sync jobs

---

## 📚 Additional Resources

- [Garmin Health API Docs](https://developer.garmin.com/gc-developer-program/overview/)
- [OAuth 1.0a Specification](https://oauth.net/core/1.0a/)
- [Expo Health Kit Docs](https://docs.expo.dev/versions/latest/sdk/health/)
- [React Native Setup Guide](./REACT_NATIVE_SETUP_GUIDE.md)

---

## 💡 Alternative: Simplified Approach

If OAuth 1.0a is too complex, consider:

**Option A: Manual Token Entry**
- Skip OAuth flow entirely
- User manually gets access token from Garmin
- User pastes token into app settings
- Simpler but less user-friendly

**Option B: Focus on Mobile First**
- Complete React Native app for Apple Health/Google Fit
- These use native SDKs (simpler than Garmin OAuth)
- Add Garmin later as enhancement

**Current Recommendation:** Build mobile app for Apple Health/Google Fit first, then add Garmin OAuth when there's more time for proper implementation.
