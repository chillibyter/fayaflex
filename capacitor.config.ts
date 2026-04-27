import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fayaflex.app',
  appName: 'FayaFlex',
  webDir: 'empty-web-dir',
  server: {
    url: 'https://fayaflex.com',
    androidScheme: 'https',
    iosScheme: 'capacitor',
    // Allow requests to fayaflex.com from native apps
    allowNavigation: ['*.fayaflex.com'],
  },
  ios: {
    contentInset: 'automatic',
    // Enable native HTTP to bypass WebView CORS issues
    limitsNavigationsToAppBoundDomains: false,
  },
  android: {
    backgroundColor: '#0f172a',
  },
  plugins: {
    CapacitorHttp: {
      // Route fetch/XHR through native code to bypass CORS
      enabled: true,
    },
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: false,
      backgroundColor: "#10A37F",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#FFFFFF",
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#0f172a',
    },
    Camera: {
      permissions: ['camera', 'photos'],
    },
    GoogleAuth: {
      scopes: ['profile', 'email'],
      // iOS client ID from Google Cloud Console (matches the reversed URL
      // scheme + GIDClientID we set in ios/App/App/Info.plist).
      iosClientId: '389653262932-j2dt5jj7emlf972jtqqv8t6i5jdrt7oe.apps.googleusercontent.com',
      // Web/server-side OAuth client ID. Used by the backend to verify
      // the ID token's audience. Falls back to GOOGLE_CLIENT_ID env var
      // if set at sync time.
      serverClientId: process.env.GOOGLE_CLIENT_ID || '389653262932-j2dt5jj7emlf972jtqqv8t6i5jdrt7oe.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
