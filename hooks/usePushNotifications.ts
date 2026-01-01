import { useEffect } from 'react';
import { useLanguage } from './useLanguage';

export const usePushNotifications = () => {
  const { t } = useLanguage();

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      console.log('This browser does not support desktop notification');
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  };

  const sendNotification = (title: string, body: string) => {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.ico', // Assuming a favicon exists or browser default
      });
    }
  };

  // Simulate a daily check
  useEffect(() => {
    const checkDailyEvents = async () => {
      const granted = await requestPermission();
      if (granted) {
        // Mock: Simulating receiving a push notification for daily spin
        // In real app, this would be a listener to Firebase Messaging
        const hasSeenNotification = sessionStorage.getItem('daily_push_sent');
        if (!hasSeenNotification) {
            setTimeout(() => {
                sendNotification(t('push_title'), t('push_body_spin'));
                sessionStorage.setItem('daily_push_sent', 'true');
            }, 5000);
        }
      }
    };
    
    checkDailyEvents();
  }, [t]);

  return { sendNotification, requestPermission };
};