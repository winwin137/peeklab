
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { MealCycle } from '@/types';

const NOTIFICATION_INTERVALS = [20, 40, 60, 90, 120, 180]; // minutes

export function useNotifications(activeMealCycle: MealCycle | null) {
  const [notifications, setNotifications] = useState<{
    [minute: number]: {
      id: string;
      scheduled: boolean;
      sent: boolean;
      timerId?: number;
    }
  }>({});
  const { toast } = useToast();

  // Schedule all notifications when a meal cycle starts
  useEffect(() => {
    if (!activeMealCycle || !activeMealCycle.startTime) return;
    
    // Clear any existing timers
    Object.values(notifications).forEach(notification => {
      if (notification.timerId) {
        window.clearTimeout(notification.timerId);
      }
    });
    
    // Create new notification schedules
    const newNotifications: typeof notifications = {};
    
    NOTIFICATION_INTERVALS.forEach(minutes => {
      const notificationTime = activeMealCycle.startTime + (minutes * 60 * 1000);
      const now = Date.now();
      
      // Only schedule notifications that are in the future
      if (notificationTime > now) {
        const timerId = window.setTimeout(() => {
          sendNotification(minutes);
        }, notificationTime - now);
        
        newNotifications[minutes] = {
          id: `${activeMealCycle.id}_${minutes}`,
          scheduled: true,
          sent: false,
          timerId: timerId as unknown as number
        };
      } else {
        // For time intervals that have already passed
        newNotifications[minutes] = {
          id: `${activeMealCycle.id}_${minutes}`,
          scheduled: false,
          sent: false
        };
      }
    });
    
    setNotifications(newNotifications);
    
    // Clear timers on cleanup
    return () => {
      Object.values(newNotifications).forEach(notification => {
        if (notification.timerId) {
          window.clearTimeout(notification.timerId);
        }
      });
    };
  }, [activeMealCycle?.id, activeMealCycle?.startTime]);

  // Send a notification for a specific minute mark
  const sendNotification = useCallback((minutesMark: number) => {
    // In a real app, this would trigger a real push notification
    // For now, we'll just show a toast
    toast({
      title: "Time to check your glucose!",
      description: `It's been ${minutesMark} minutes since your first bite. Please record your blood glucose reading now.`,
    });
    
    // Update notification status
    setNotifications(prev => ({
      ...prev,
      [minutesMark]: {
        ...prev[minutesMark],
        sent: true
      }
    }));
    
    // Simulate sounds by logging to console
    console.log(`🔔 Notification sound played for ${minutesMark}-minute mark`);
  }, [toast]);

  // Check if a notification is due/overdue
  const getNotificationStatus = useCallback((minutesMark: number) => {
    if (!activeMealCycle || !activeMealCycle.startTime) {
      return { due: false, overdue: false };
    }
    
    const notificationTime = activeMealCycle.startTime + (minutesMark * 60 * 1000);
    const now = Date.now();
    const lateThreshold = notificationTime + (7 * 60 * 1000); // 7 minutes late
    
    return {
      due: now >= notificationTime,
      overdue: now >= lateThreshold,
      timeUntil: notificationTime > now ? notificationTime - now : 0
    };
  }, [activeMealCycle?.startTime]);

  // Mark a notification as responded
  const markNotificationResponded = useCallback((minutesMark: number) => {
    setNotifications(prev => ({
      ...prev,
      [minutesMark]: {
        ...prev[minutesMark],
        responded: true
      }
    }));
  }, []);

  return {
    notifications,
    sendNotification,
    getNotificationStatus,
    markNotificationResponded
  };
}
