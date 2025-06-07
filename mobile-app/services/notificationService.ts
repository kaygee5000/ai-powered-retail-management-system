import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

interface NotificationData {
  title: string;
  body: string;
  data?: any;
  categoryId?: string;
}

class NotificationService {
  private token: string | null = null;

  async initialize(): Promise<boolean> {
    try {
      // Check if device supports notifications
      if (!Device.isDevice) {
        console.warn('Must use physical device for Push Notifications');
        return false;
      }

      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Failed to get push token for push notification!');
        return false;
      }

      // Get the token
      this.token = (await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      })).data;

      // Store token locally
      await AsyncStorage.setItem('expo_push_token', this.token);

      // Configure notification categories
      await this.setupNotificationCategories();

      console.log('Push notification token:', this.token);
      return true;
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return false;
    }
  }

  private async setupNotificationCategories() {
    await Notifications.setNotificationCategoryAsync('ALERT', [
      {
        identifier: 'RESOLVE',
        buttonTitle: 'Resolve',
        options: {
          opensAppToForeground: true,
        },
      },
      {
        identifier: 'VIEW',
        buttonTitle: 'View Details',
        options: {
          opensAppToForeground: true,
        },
      },
    ]);

    await Notifications.setNotificationCategoryAsync('REPORT', [
      {
        identifier: 'APPROVE',
        buttonTitle: 'Approve',
        options: {
          opensAppToForeground: false,
        },
      },
      {
        identifier: 'REVIEW',
        buttonTitle: 'Review',
        options: {
          opensAppToForeground: true,
        },
      },
    ]);
  }

  async scheduleLocalNotification(notification: NotificationData, seconds: number = 0) {
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          categoryIdentifier: notification.categoryId,
          sound: true,
        },
        trigger: seconds > 0 ? { seconds } : null,
      });

      return id;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }

  async sendPushNotification(notification: NotificationData, targetToken?: string) {
    const token = targetToken || this.token;
    if (!token) {
      console.warn('No push token available');
      return false;
    }

    try {
      const message = {
        to: token,
        sound: 'default',
        title: notification.title,
        body: notification.body,
        data: notification.data || {},
        categoryId: notification.categoryId,
      };

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const result = await response.json();
      console.log('Push notification sent:', result);
      return true;
    } catch (error) {
      console.error('Error sending push notification:', error);
      return false;
    }
  }

  async cancelNotification(notificationId: string) {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  async cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  getToken(): string | null {
    return this.token;
  }

  // Set up notification listeners
  addNotificationReceivedListener(listener: (notification: Notifications.Notification) => void) {
    return Notifications.addNotificationReceivedListener(listener);
  }

  addNotificationResponseReceivedListener(
    listener: (response: Notifications.NotificationResponse) => void
  ) {
    return Notifications.addNotificationResponseReceivedListener(listener);
  }

  // Business-specific notification helpers
  async sendLowStockAlert(productName: string, currentStock: number, minStock: number) {
    return this.scheduleLocalNotification({
      title: '📦 Low Stock Alert',
      body: `${productName} is running low: ${currentStock}/${minStock} remaining`,
      categoryId: 'ALERT',
      data: { type: 'low_stock', productName, currentStock, minStock },
    });
  }

  async sendSalesAlert(amount: number, locationName: string) {
    return this.scheduleLocalNotification({
      title: '💰 High Sales Activity',
      body: `Unusual sales spike detected at ${locationName}: $${amount.toFixed(2)}`,
      categoryId: 'ALERT',
      data: { type: 'sales_spike', amount, locationName },
    });
  }

  async sendReportProcessed(reportId: string, confidence: number) {
    return this.scheduleLocalNotification({
      title: '🤖 AI Report Processed',
      body: `Report processed with ${Math.round(confidence * 100)}% confidence`,
      categoryId: 'REPORT',
      data: { type: 'report_processed', reportId, confidence },
    });
  }

  async sendDailyReminder() {
    return this.scheduleLocalNotification({
      title: '📊 Daily Check-in',
      body: 'Review your daily sales and inventory status',
      data: { type: 'daily_reminder' },
    });
  }
}

export const notificationService = new NotificationService();