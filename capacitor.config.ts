import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.FayaFlex.App',
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
      backgroundColor: "#0f172a",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#0ea5e9",
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
  },
};

export default config;
