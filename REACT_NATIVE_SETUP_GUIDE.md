# React Native + Expo Mobile App Setup Guide
## Ultimate Fitness Challenge - iOS & Android Health Integration

This guide will help you build a React Native mobile app using Expo that integrates with Apple HealthKit and Google Fit to automatically sync fitness data to your UFC backend.

---

## 📋 Prerequisites

### Essential Tools
- **Node.js** (v18 or higher) - Already installed if you're running the web app
- **Expo account** - Sign up at https://expo.dev (free tier available)
- **Apple Developer account** ($99/year) - Required for iOS builds with HealthKit
- **iPhone** for testing iOS features
- **Android phone** (optional) for testing Android features

### Optional (for local iOS builds)
- **macOS** computer
- **Xcode** (latest version from Mac App Store)
- **CocoaPods** - Install via: `sudo gem install cocoapods`

---

## 🚀 Step 1: Install Expo CLI

```bash
# Install Expo CLI globally
npm install -g expo-cli eas-cli

# Login to your Expo account
expo login
```

---

## 📱 Step 2: Create New Expo Project

```bash
# Create a new Expo project with TypeScript
npx create-expo-app@latest ufc-mobile --template expo-template-blank-typescript

# Navigate to project directory
cd ufc-mobile

# Install required dependencies
npm install expo-health expo-auth-session expo-web-browser expo-secure-store @react-navigation/native @react-navigation/stack expo-status-bar
```

---

## 🏗️ Step 3: Project Structure

Create the following folder structure:

```
ufc-mobile/
├── app/
│   ├── screens/
│   │   ├── LoginScreen.tsx
│   │   ├── DashboardScreen.tsx
│   │   └── SyncScreen.tsx
│   ├── services/
│   │   ├── api.ts
│   │   ├── health.ts
│   │   └── auth.ts
│   └── types/
│       └── index.ts
├── app.json
├── App.tsx
└── package.json
```

---

## ⚙️ Step 4: Configure app.json

Update your `app.json` to include HealthKit and Google Fit permissions:

```json
{
  "expo": {
    "name": "UFC Mobile",
    "slug": "ufc-mobile",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.yourcompany.ufc",
      "infoPlist": {
        "NSHealthShareUsageDescription": "UFC needs access to read your fitness data to track calories and steps",
        "NSHealthUpdateUsageDescription": "UFC needs access to update your fitness data"
      },
      "config": {
        "usesNonExemptEncryption": false
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.yourcompany.ufc",
      "permissions": [
        "ACTIVITY_RECOGNITION",
        "com.google.android.gms.permission.ACTIVITY_RECOGNITION"
      ]
    },
    "plugins": [
      [
        "expo-health",
        {
          "healthSharePermission": "Allow UFC to read your fitness data"
        }
      ]
    ]
  }
}
```

---

## 🔐 Step 5: Authentication Service

Create `app/services/auth.ts`:

```typescript
import * as SecureStore from 'expo-secure-store';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

const API_URL = 'https://your-replit-app.replit.app'; // Replace with your Replit deployment URL

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

class AuthService {
  private sessionCookie: string | null = null;
  private redirectUri = AuthSession.makeRedirectUri({ useProxy: true });

  async initialize() {
    this.sessionCookie = await SecureStore.getItemAsync('session_cookie');
  }

  /**
   * Authenticate with Replit Auth via OAuth 2.0 / OpenID Connect
   * This opens a web browser for the user to log in with their Replit account
   */
  async loginWithReplit(): Promise<User> {
    try {
      // Construct the Replit Auth URL
      const authUrl = `${API_URL}/login?redirect_uri=${encodeURIComponent(this.redirectUri)}`;

      // Open browser for authentication
      const result = await WebBrowser.openAuthSessionAsync(authUrl, this.redirectUri);

      if (result.type !== 'success') {
        throw new Error('Authentication cancelled or failed');
      }

      // After successful auth, the backend sets a session cookie
      // We need to extract it from the redirect URL or make a request to get the session
      
      // Make a request to get the current user (which will validate the session)
      const userResponse = await fetch(`${API_URL}/api/auth/user`, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!userResponse.ok) {
        throw new Error('Failed to get user session after authentication');
      }

      const user = await userResponse.json();
      
      if (!user) {
        throw new Error('No user returned after authentication');
      }

      // Store session indicator (the actual session is managed by cookies)
      await SecureStore.setItemAsync('authenticated', 'true');
      await SecureStore.setItemAsync('user_id', user.id);

      return user;
    } catch (error: any) {
      console.error('Replit Auth error:', error);
      throw error;
    }
  }

  /**
   * Get the current authenticated user
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await fetch(`${API_URL}/api/auth/user`, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        return null;
      }

      const user = await response.json();
      return user || null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const authenticated = await SecureStore.getItemAsync('authenticated');
    if (authenticated !== 'true') {
      return false;
    }

    // Verify with backend
    const user = await this.getCurrentUser();
    return !!user;
  }

  /**
   * Logout the user
   */
  async logout() {
    try {
      // Call logout endpoint
      await fetch(`${API_URL}/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage
      await SecureStore.deleteItemAsync('authenticated');
      await SecureStore.deleteItemAsync('user_id');
      this.sessionCookie = null;
    }
  }

  /**
   * Get user ID from secure storage (for offline access)
   */
  async getUserId(): Promise<string | null> {
    return await SecureStore.getItemAsync('user_id');
  }
}

export const authService = new AuthService();
```

**Important Notes about Authentication:**

1. **Replit Auth uses OpenID Connect:** The backend uses Replit's authentication system, which requires users to log in through a web browser
2. **Session Cookies:** Authentication is managed via HTTP-only session cookies that are automatically handled by the browser
3. **Mobile Flow:** The mobile app opens a web browser for login, then the backend sets session cookies that persist across requests
4. **Credentials:** Use `credentials: 'include'` in all fetch requests to send cookies with each API call

---

## 🏥 Step 6: Health Data Service

Create `app/services/health.ts`:

```typescript
import * as Health from 'expo-health';
import { Platform } from 'react-native';

export interface HealthData {
  date: string; // YYYY-MM-DD format
  calories: number;
  steps: number;
  workoutType?: string;
}

class HealthService {
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'ios') {
      // Request HealthKit permissions
      const granted = await Health.requestPermissionsAsync([
        Health.HealthPermission.StepCount,
        Health.HealthPermission.ActiveEnergyBurned,
        Health.HealthPermission.Workout,
      ]);
      return granted;
    } else if (Platform.OS === 'android') {
      // Request Google Fit permissions
      const granted = await Health.requestPermissionsAsync([
        Health.HealthPermission.StepCount,
        Health.HealthPermission.ActiveEnergyBurned,
        Health.HealthPermission.Workout,
      ]);
      return granted;
    }
    return false;
  }

  async getHealthData(startDate: Date, endDate: Date): Promise<HealthData[]> {
    const healthData: Map<string, HealthData> = new Map();

    // Get steps data
    const steps = await Health.getStepCountAsync({
      startDate,
      endDate,
    });

    // Get calories data
    const calories = await Health.getActiveEnergyBurnedAsync({
      startDate,
      endDate,
    });

    // Get workouts
    const workouts = await Health.getWorkoutsAsync({
      startDate,
      endDate,
    });

    // Aggregate data by date
    steps.forEach((step) => {
      const dateStr = this.formatDate(step.startDate);
      if (!healthData.has(dateStr)) {
        healthData.set(dateStr, {
          date: dateStr,
          calories: 0,
          steps: 0,
        });
      }
      const data = healthData.get(dateStr)!;
      data.steps += step.value;
    });

    calories.forEach((cal) => {
      const dateStr = this.formatDate(cal.startDate);
      if (!healthData.has(dateStr)) {
        healthData.set(dateStr, {
          date: dateStr,
          calories: 0,
          steps: 0,
        });
      }
      const data = healthData.get(dateStr)!;
      data.calories += Math.round(cal.value);
    });

    // Add workout types
    workouts.forEach((workout) => {
      const dateStr = this.formatDate(workout.startDate);
      if (healthData.has(dateStr)) {
        const data = healthData.get(dateStr)!;
        data.workoutType = workout.activityType;
      }
    });

    return Array.from(healthData.values());
  }

  async getLastWeekData(): Promise<HealthData[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    return this.getHealthData(startDate, endDate);
  }

  async getLastMonthData(): Promise<HealthData[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    return this.getHealthData(startDate, endDate);
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getProviderName(): string {
    return Platform.OS === 'ios' ? 'apple_health' : 'android_health';
  }
}

export const healthService = new HealthService();
```

---

## 🔄 Step 7: API Service

Create `app/services/api.ts`:

```typescript
const API_URL = 'https://your-replit-app.replit.app'; // Replace with your Replit deployment URL

export interface SyncResponse {
  success: boolean;
  synced: number;
  created: number;
  updated: number;
  skipped: number;
}

class ApiService {
  /**
   * Sync health data to backend
   * Session authentication is handled automatically via cookies
   */
  async syncHealthData(provider: string, activities: any[]): Promise<SyncResponse> {
    const response = await fetch(`${API_URL}/api/devices/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include', // Critical: sends session cookies
      body: JSON.stringify({
        provider,
        activities,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Sync failed' }));
      throw new Error(error.message || 'Sync failed');
    }

    return response.json();
  }

  /**
   * Connect a health device
   */
  async connectDevice(provider: string): Promise<void> {
    const response = await fetch(`${API_URL}/api/devices/toggle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include', // Critical: sends session cookies
      body: JSON.stringify({
        provider,
        isConnected: true,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to connect device' }));
      throw new Error(error.message || 'Failed to connect device');
    }
  }

  /**
   * Get device connections
   */
  async getDeviceConnections(): Promise<any[]> {
    const response = await fetch(`${API_URL}/api/devices`, {
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch device connections');
    }

    return response.json();
  }
}

export const apiService = new ApiService();
```

**Important:** All API requests must include `credentials: 'include'` to send session cookies with each request. This is how authentication is maintained between the mobile app and backend.

---

## 📱 Step 8: Sync Screen Component

Create `app/screens/SyncScreen.tsx`:

```typescript
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { healthService } from '../services/health';
import { apiService } from '../services/api';

export default function SyncScreen() {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const handleSync = async () => {
    try {
      setSyncing(true);

      // Request health permissions
      const granted = await healthService.requestPermissions();
      if (!granted) {
        Alert.alert('Permission Denied', 'Please grant health data access to sync your activities.');
        return;
      }

      // Get health data from last 30 days
      const healthData = await healthService.getLastMonthData();
      
      if (healthData.length === 0) {
        Alert.alert('No Data', 'No health data found to sync.');
        return;
      }

      // Sync to backend
      const provider = healthService.getProviderName();
      const result = await apiService.syncHealthData(provider, healthData);

      setLastSync(new Date());
      
      Alert.alert(
        'Sync Complete',
        `Successfully synced ${result.synced} activities!\n\nCreated: ${result.created}\nUpdated: ${result.updated}\nSkipped: ${result.skipped}`
      );
    } catch (error: any) {
      console.error('Sync error:', error);
      Alert.alert('Sync Failed', error.message || 'Failed to sync health data');
    } finally {
      setSyncing(false);
    }
  };

  const handleConnectDevice = async () => {
    try {
      const granted = await healthService.requestPermissions();
      if (granted) {
        const provider = healthService.getProviderName();
        await apiService.connectDevice(provider);
        Alert.alert('Success', 'Device connected! You can now sync your health data.');
      }
    } catch (error: any) {
      Alert.alert('Connection Failed', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Health Data Sync</Text>
      <Text style={styles.subtitle}>
        Sync your fitness data from {healthService.getProviderName() === 'apple_health' ? 'Apple Health' : 'Google Fit'}
      </Text>

      {lastSync && (
        <Text style={styles.lastSync}>
          Last synced: {lastSync.toLocaleString()}
        </Text>
      )}

      <TouchableOpacity
        style={[styles.button, syncing && styles.buttonDisabled]}
        onPress={handleSync}
        disabled={syncing}
      >
        {syncing ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Sync Now</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.secondaryButton]}
        onPress={handleConnectDevice}
      >
        <Text style={styles.secondaryButtonText}>Connect Device</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  lastSync: {
    fontSize: 14,
    color: '#999',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#0ea5e9',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 8,
    marginVertical: 10,
    width: '100%',
    maxWidth: 300,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#0ea5e9',
  },
  secondaryButtonText: {
    color: '#0ea5e9',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
```

---

## 🎨 Step 9: Main App Component

Update `App.tsx`:

```typescript
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import SyncScreen from './app/screens/SyncScreen';
import { authService } from './app/services/auth';

const Stack = createStackNavigator();

// Login Screen Component
function LoginScreen({ navigation }: any) {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      await authService.loginWithReplit();
      // Navigation will happen automatically when auth state changes
    } catch (error: any) {
      alert(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.loginContainer}>
      <Text style={styles.loginTitle}>Ultimate Fitness Challenge</Text>
      <Text style={styles.loginSubtitle}>
        Track your fitness journey and compete with your team
      </Text>
      
      <TouchableOpacity
        style={styles.loginButton}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.loginButtonText}>Login with Replit</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    async function initialize() {
      await authService.initialize();
      const authenticated = await authService.isAuthenticated();
      setIsAuthenticated(authenticated);
      setIsReady(true);
    }
    initialize();
  }, []);

  // Refresh auth state periodically
  useEffect(() => {
    if (!isReady) return;

    const interval = setInterval(async () => {
      const authenticated = await authService.isAuthenticated();
      setIsAuthenticated(authenticated);
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [isReady]);

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator screenOptions={{ headerShown: true }}>
        {isAuthenticated ? (
          <Stack.Screen 
            name="Sync" 
            component={SyncScreen}
            options={{ 
              title: 'UFC - Sync Health Data',
              headerRight: () => (
                <TouchableOpacity
                  onPress={async () => {
                    await authService.logout();
                    setIsAuthenticated(false);
                  }}
                  style={{ marginRight: 15 }}
                >
                  <Text style={{ color: '#0ea5e9' }}>Logout</Text>
                </TouchableOpacity>
              ),
            }}
          />
        ) : (
          <Stack.Screen 
            name="Login" 
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  loginTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  loginSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  loginButton: {
    backgroundColor: '#0ea5e9',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 8,
    minWidth: 200,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
```

---

## 📦 Step 10: Testing with Expo Go

```bash
# Start the development server
npx expo start

# Scan QR code with:
# - iPhone: Camera app or Expo Go app
# - Android: Expo Go app
```

**Note:** HealthKit features will NOT work in Expo Go. You need a development build or production build for testing health features.

---

## 🏗️ Step 11: Create Development Build

For testing HealthKit features, create a development build:

```bash
# Install EAS CLI if not already installed
npm install -g eas-cli

# Configure EAS
eas build:configure

# Create iOS development build
eas build --profile development --platform ios

# Or create Android development build
eas build --profile development --platform android
```

After the build completes, install it on your test device.

---

## 🚀 Step 12: Production Build (App Store / Play Store)

### iOS App Store

1. **Configure bundle identifier** in `app.json`
2. **Build for production:**
```bash
eas build --profile production --platform ios
```
3. **Submit to App Store:**
```bash
eas submit --platform ios
```

### Android Play Store

1. **Configure package name** in `app.json`
2. **Build for production:**
```bash
eas build --profile production --platform android
```
3. **Submit to Play Store:**
```bash
eas submit --platform android
```

---

## 🔐 Step 13: Environment Variables

Create `.env` file in your mobile project:

```
API_URL=https://your-replit-app.replit.app
```

Install `react-native-dotenv`:
```bash
npm install react-native-dotenv
```

---

## 🐛 Troubleshooting

### HealthKit Not Working
- Ensure you're using a development or production build (not Expo Go)
- Check that `NSHealthShareUsageDescription` is in `app.json`
- Verify your Apple Developer account is active

### Authentication Issues
- Make sure your backend URL is correct
- Check that CORS is configured on your backend
- Verify session cookies are being sent properly

### Build Failures
- Clear cache: `expo r -c`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check EAS build logs for specific errors

---

## 📚 Additional Resources

- **Expo Documentation:** https://docs.expo.dev
- **Expo Health API:** https://docs.expo.dev/versions/latest/sdk/health/
- **Apple HealthKit Guide:** https://developer.apple.com/health-fitness/
- **Google Fit REST API:** https://developers.google.com/fit/rest

---

## ✅ Checklist

- [ ] Install Expo CLI
- [ ] Create new Expo project
- [ ] Configure app.json with permissions
- [ ] Implement authentication service
- [ ] Implement health data service
- [ ] Implement API sync service
- [ ] Create sync screen UI
- [ ] Test with development build
- [ ] Configure production builds
- [ ] Submit to App Store / Play Store

---

## 💡 Next Steps

1. **Enhance UI:** Add more screens (dashboard, profile, teams view)
2. **Background Sync:** Implement background tasks for automatic syncing
3. **Push Notifications:** Alert users about challenges and achievements
4. **Offline Support:** Store data locally and sync when connected
5. **Analytics:** Track user engagement and sync patterns

---

## 🆘 Need Help?

If you encounter issues:
1. Check the Expo documentation
2. Review the backend API logs on Replit
3. Test API endpoints with Postman first
4. Join Expo Discord community for support

**Your backend is now ready to receive health data from the mobile app!**
