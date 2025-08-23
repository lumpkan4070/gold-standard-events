import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

declare global {
  interface Window {
    plugins: {
      OneSignal: {
        startInit: (appId: string) => {
          endInit: () => void;
          handleNotificationReceived: (callback: (data: any) => void) => void;
          handleNotificationOpened: (callback: (data: any) => void) => void;
          inFocusDisplaying: (displayOption: number) => void;
        };
        setSubscription: (enable: boolean) => void;
        promptForPushNotificationsWithUserResponse: (callback: (accepted: boolean) => void) => void;
        getIds: (callback: (ids: { userId: string; pushToken: string }) => void) => void;
      };
    };
  }
}

export const useOneSignal = () => {
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      // Mobile app initialization
      const initOneSignal = () => {
        if (window.plugins?.OneSignal) {
          console.log("Initializing OneSignal for mobile...");
          
          const oneSignal = window.plugins.OneSignal
            .startInit("67ee2082-8942-4205-9177-87682cc0682b");
          
          oneSignal.handleNotificationReceived((data: any) => {
            console.log("Notification received:", data);
          });
          
          oneSignal.handleNotificationOpened((data: any) => {
            console.log("Notification opened:", data);
          });
          
          // Display notification even when app is in focus
          oneSignal.inFocusDisplaying(2);
          
          oneSignal.endInit();
          
          // Auto-subscribe user to notifications
          setTimeout(() => {
            window.plugins.OneSignal.setSubscription(true);
            
            // Get the user ID for testing
            window.plugins.OneSignal.getIds((ids) => {
              console.log("OneSignal User ID:", ids.userId);
              console.log("Push Token:", ids.pushToken);
            });
          }, 1000);
        }
      };

      // Wait for device ready if needed
      if (document.readyState === 'complete') {
        initOneSignal();
      } else {
        document.addEventListener('deviceready', initOneSignal);
      }
    } else {
      // Web browser - keep existing web implementation
      console.log("Running in web browser - using web OneSignal");
    }
  }, []);

  const promptForPermissions = () => {
    if (Capacitor.isNativePlatform() && window.plugins?.OneSignal) {
      window.plugins.OneSignal.promptForPushNotificationsWithUserResponse((accepted) => {
        console.log("User accepted notifications:", accepted);
      });
    }
  };

  return { promptForPermissions };
};
