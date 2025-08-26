import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.victorybistro.ios',
  appName: 'Victory Bistro Ultra Lounge',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      backgroundColor: "#000000",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      style: "LIGHT",
      backgroundColor: "#000000"
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    Camera: {
      permissions: {
        camera: "Camera access is required to capture photos for events and QR code scanning.",
        photos: "Photo library access is required to save and share event photos."
      }
    },
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#488AFF",
      sound: "beep.wav"
    }
  },
  ios: {
    contentInset: "automatic",
    backgroundColor: "#000000"
  },
  android: {
    backgroundColor: "#000000",
    allowMixedContent: true,
    captureInput: true
  }
};

export default config;