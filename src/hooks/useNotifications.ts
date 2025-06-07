import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';

interface Notification {
  id: string;
  type: 'alert' | 'report' | 'system' | 'connection' | 'heartbeat';
  title?: string;
  message: string;
  data?: any;
  timestamp: string;
  fromUserId?: string;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [connected, setConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  const addNotification = useCallback((notification: Notification) => {
    // Skip heartbeat notifications from UI
    if (notification.type === 'heartbeat') {
      return;
    }

    setNotifications(prev => {
      // Avoid duplicates
      if (prev.some(n => n.id === notification.id)) {
        return prev;
      }
      
      const updated = [notification, ...prev].slice(0, 100); // Keep last 100
      return updated;
    });

    // Increment unread count for actual notifications
    if (notification.type !== 'connection') {
      setUnreadCount(prev => prev + 1);
    }
  }, []);

  const markAsRead = useCallback((notificationId?: string) => {
    if (notificationId) {
      // Mark specific notification as read (implement if needed)
    } else {
      // Mark all as read
      setUnreadCount(0);
    }
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  const sendNotification = useCallback(async (notification: {
    type: 'alert' | 'report' | 'system';
    title: string;
    message: string;
    userId?: string;
    data?: any;
  }) => {
    try {
      const { error } = await apiService.sendNotification(notification);
      if (error) {
        console.error('Failed to send notification:', error);
      }
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setConnected(false);
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    let cleanup: (() => void) | null = null;

    const connectToNotifications = async () => {
      try {
        cleanup = await apiService.subscribeToNotifications((notification: Notification) => {
          if (notification.type === 'connection') {
            setConnected(true);
          }
          addNotification(notification);
        });
        
        console.log('Connected to real-time notifications');
      } catch (error) {
        console.error('Failed to connect to notifications:', error);
        setConnected(false);
        
        // Retry connection after 5 seconds
        setTimeout(connectToNotifications, 5000);
      }
    };

    connectToNotifications();

    return () => {
      if (cleanup) {
        cleanup();
      }
      setConnected(false);
    };
  }, [user, addNotification]);

  return {
    notifications,
    connected,
    unreadCount,
    addNotification,
    markAsRead,
    clearNotifications,
    sendNotification
  };
};