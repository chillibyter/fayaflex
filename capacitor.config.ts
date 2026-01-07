import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fayaflex.app',
  appName: 'FayaFlex',
  webDir: 'empty-web-dir',
  server: {
    url: 'https://fayaflex.com',
    androidScheme: 'https',
    iosScheme: 'https',
    cleartext: true,
  },
  ios: {
    contentInset: 'automatic',
  },
  android: {
    backgroundColor: '#0f172a',
  },
  plugins: {
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
