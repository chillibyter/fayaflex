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
      // The web/server-side OAuth client ID — Google requires this on
      // native so the returned ID token can be verified by our backend.
      // Set GOOGLE_CLIENT_ID for both web and native (use the Web client ID
      // from Google Cloud, NOT the iOS/Android client ID).
      scopes: ['profile', 'email'],
      serverClientId: process.env.GOOGLE_CLIENT_ID,
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
