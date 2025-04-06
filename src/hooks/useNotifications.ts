import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../components/ui/use-toast';
import { MealCycle } from '../types';
import { getCurrentTimeout } from '../config';
import { 
  playNotificationSound, 
  requestNotificationPermission,
  showBrowserNotification 
} from '../utils/notificationSound';

const NOTIFICATION_INTERVALS = [20, 40, 60, 90, 120, 180]; // minutes

export const useNotifications = (activeMealCycle: MealCycle | null) => {
  const { toast } = useToast();
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertTitle, setAlertTitle] = useState('');
  const [hasNotificationPermission, setHasNotificationPermission] = useState(false);
  const [lastNotified, setLastNotified] = useState<Record<number, boolean>>({});

  const checkPermission = async () => {
    try {
      const permission = await requestNotificationPermission();
      setNotificationPermission(permission as NotificationPermission);
      setHasNotificationPermission(permission === 'granted');
    } catch (error) {
      console.error('Error checking notification permission:', error);
    }
  };

  // Only check permission when explicitly requested
  const requestPermission = async () => {
    await checkPermission();
  };

  const showNotification = useCallback((title: string, description: string, isCritical = false, type: 'readingDue' | 'readingOverdue' | 'critical' = 'readingDue') => {
    if (notificationPermission === 'granted') {
      if (isCritical) {
        // Play sound for critical notifications
        playNotificationSound();
        
        // Show browser notification if permission granted
        showBrowserNotification(title, {
          body: description,
          tag: 'glucose-reading',
          type
        });
        
        // Show modal for critical notifications
        setAlertTitle(title);
        setAlertMessage(description);
        setShowAlert(true);
      } else {
        // Show toast for non-critical notifications
        toast({
          title,
          description,
          duration: 5000,
        });
      }
    }
  }, [toast, notificationPermission]);

  const getNotificationStatus = useCallback(() => {
    if (!activeMealCycle) return null;

    const now = Date.now();
    const startTime = activeMealCycle.startTime;
    const timeout = getCurrentTimeout();
    const intervals = Object.keys(activeMealCycle.postprandialReadings || {}).map(Number);

    if (!startTime) return null;

    const nextInterval = intervals.find(interval => {
      const intervalTime = startTime + (interval * 60 * 1000);
      return intervalTime > now && !activeMealCycle.postprandialReadings?.[interval];
    });

    if (nextInterval) {
      const intervalTime = startTime + (nextInterval * 60 * 1000);
      const timeUntilNext = intervalTime - now;
      const isDue = timeUntilNext <= 0;
      const isOverdue = timeUntilNext < -5 * 60 * 1000; // 5 minutes overdue

      return {
        isDue,
        isOverdue,
        nextInterval,
        timeUntilNext,
      };
    }

    return null;
  }, [activeMealCycle]);

  useEffect(() => {
    if (!activeMealCycle?.startTime) return;

    const checkReadings = () => {
      const intervals = [20, 40, 60, 90, 120, 180];
      
      for (const minutesMark of intervals) {
        // Skip if reading is already completed
        if (activeMealCycle.postprandialReadings[minutesMark]) {
          continue;
        }

        const status = getNotificationStatus();
        
        // Play sound only once when reading becomes due
        if (status && status.isDue && !lastNotified[minutesMark]) {
          playNotificationSound();
          setLastNotified(prev => ({ ...prev, [minutesMark]: true }));
        }
      }
    };

    const interval = setInterval(checkReadings, 1000);
    return () => clearInterval(interval);
  }, [activeMealCycle, getNotificationStatus, lastNotified]);

  return {
    showNotification,
    getNotificationStatus,
    requestPermission,
    notificationPermission,
    alertState: {
      isOpen: showAlert,
      onClose: () => setShowAlert(false),
      title: alertTitle,
      description: alertMessage
    }
  };
};
