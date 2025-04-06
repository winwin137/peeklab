import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { MealCycle } from '@/types';
import { getCurrentTimeout, getCurrentIntervals } from '@/config';
import { 
  playNotificationSound, 
  requestNotificationPermission,
  showBrowserNotification 
} from '@/utils/notificationSound';
import { NotificationAlert } from '@/components/notifications/NotificationAlert';

const NOTIFICATION_INTERVALS = [20, 40, 60, 90, 120, 180]; // minutes

export const useNotifications = (mealCycle: MealCycle | null, mode: string) => {
  const { toast } = useToast();
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertTitle, setAlertTitle] = useState('');
  const [hasNotificationPermission, setHasNotificationPermission] = useState(false);
  const [lastNotified, setLastNotified] = useState<Record<number, boolean>>({});

  // Request notification permission on mount
  useEffect(() => {
    const checkPermission = async () => {
      const hasPermission = await requestNotificationPermission();
      setHasNotificationPermission(hasPermission);
    };
    checkPermission();
  }, []);

  const showNotification = useCallback((title: string, description: string, isCritical = false, type: 'readingDue' | 'readingOverdue' | 'critical' = 'readingDue') => {
    if (isCritical) {
      // Play sound for critical notifications
      playNotificationSound();
      
      // Show browser notification if permission granted
      if (hasNotificationPermission) {
        showBrowserNotification(title, {
          body: description,
          tag: 'glucose-reading',
          renotify: true,
          type
        });
      }
      
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
  }, [toast, hasNotificationPermission]);

  const getNotificationStatus = useCallback((minutesMark: number) => {
    if (!mealCycle?.startTime) {
      return { due: false, overdue: false, timeUntil: null };
    }

    const now = Date.now();
    const scheduledTime = mealCycle.startTime + (minutesMark * 60 * 1000);
    const timeUntil = scheduledTime - now;
    const timeout = getCurrentTimeout() * 60 * 1000; // Convert to milliseconds

    // Check if reading is due (within timeout window)
    const isDue = timeUntil <= 0 && timeUntil > -timeout;
    
    // Check if reading is overdue (past timeout window)
    const isOverdue = timeUntil <= -timeout;

    // If the reading is already completed, it's neither due nor overdue
    if (mealCycle.postprandialReadings[minutesMark]) {
      return { due: false, overdue: false, timeUntil: null };
    }

    return {
      due: isDue,
      overdue: isOverdue,
      timeUntil: timeUntil > 0 ? timeUntil : null
    };
  }, [mealCycle?.startTime, mealCycle?.postprandialReadings]);

  useEffect(() => {
    if (!mealCycle?.startTime) return;

    const checkReadings = () => {
      // Use getCurrentIntervals to dynamically get the correct intervals
      const intervals = getCurrentIntervals(mode).readings;
      
      for (const minutesMark of intervals) {
        // Skip if reading is already completed
        if (mealCycle.postprandialReadings[minutesMark]) {
          continue;
        }

        const status = getNotificationStatus(minutesMark);
        
        // Play sound only once when reading becomes due
        if (status.due && !lastNotified[minutesMark]) {
          playNotificationSound();
          setLastNotified(prev => ({ ...prev, [minutesMark]: true }));
        }
      }
    };

    const interval = setInterval(checkReadings, 1000);
    return () => clearInterval(interval);
  }, [mealCycle, getNotificationStatus, lastNotified, mode]);

  return {
    showNotification,
    getNotificationStatus,
    alertState: {
      isOpen: showAlert,
      onClose: () => setShowAlert(false),
      title: alertTitle,
      description: alertMessage
    }
  };
};
