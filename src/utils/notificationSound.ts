import { toast } from '@/components/ui/use-toast';

// Keep track of the current audio context and oscillator
let currentAudioContext: AudioContext | null = null;
let currentOscillator: OscillatorNode | null = null;

// Notification utility for sound and browser notifications
export const playNotificationSound = () => {
  // Stop any existing sound
  if (currentOscillator) {
    currentOscillator.stop();
    currentOscillator = null;
  }
  if (currentAudioContext) {
    currentAudioContext.close();
    currentAudioContext = null;
  }

  try {
    // Create new audio context
    currentAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    currentOscillator = currentAudioContext.createOscillator();
    const gainNode = currentAudioContext.createGain();

    // Configure sound
    currentOscillator.type = 'sine';
    currentOscillator.frequency.setValueAtTime(800, currentAudioContext.currentTime);
    gainNode.gain.setValueAtTime(0.5, currentAudioContext.currentTime);

    // Connect nodes
    currentOscillator.connect(gainNode);
    gainNode.connect(currentAudioContext.destination);

    // Play sound once
    currentOscillator.start();
    currentOscillator.stop(currentAudioContext.currentTime + 0.5);

    // Clean up after sound finishes
    currentOscillator.onended = () => {
      if (currentAudioContext) {
        currentAudioContext.close();
        currentAudioContext = null;
      }
      currentOscillator = null;
    };
  } catch (error) {
    console.error('Error playing notification sound:', error);
    // Clean up on error
    if (currentOscillator) {
      currentOscillator.stop();
      currentOscillator = null;
    }
    if (currentAudioContext) {
      currentAudioContext.close();
      currentAudioContext = null;
    }
  }
};

// Function to manually stop the sound
export const stopNotificationSound = () => {
  if (currentOscillator) {
    currentOscillator.stop();
    currentOscillator = null;
  }
  if (currentAudioContext) {
    currentAudioContext.close();
    currentAudioContext = null;
  }
};

// Check if the browser supports notifications
const isNotificationSupported = () => {
  return 'Notification' in window;
};

// Check if the browser is iOS Safari
const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
};

// Check if the browser is Safari
const isSafari = () => {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!isNotificationSupported()) {
    console.log('Notifications not supported in this browser');
    return false;
  }

  // Check if we're on iOS Safari
  if (isIOS() && isSafari()) {
    // iOS Safari requires user interaction to request permissions
    // We'll show a toast message explaining how to enable notifications
    toast({
      title: 'Enable Notifications',
      description: 'To receive alerts, please enable notifications in your Safari settings. Go to Settings > Safari > Notifications and allow notifications for this website.',
      duration: 10000,
      variant: 'default',
    });
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

// Vibration patterns for different notification types
const VIBRATION_PATTERNS = {
  readingDue: [200, 100, 200], // Short bursts for due readings
  readingOverdue: [300, 100, 300, 100, 300], // Longer pattern for overdue readings
  critical: [500, 100, 500, 100, 500] // Most urgent pattern
};

// Show browser notification
export const showBrowserNotification = (
  title: string,
  options: NotificationOptions & { type?: 'readingDue' | 'readingOverdue' | 'critical' }
) => {
  if (!isNotificationSupported()) return;

  const notificationOptions: NotificationOptions = {
    ...options,
    icon: '/favicon.ico',
    badge: '/badge.png',
    vibrate: options.type === 'readingDue' ? [200, 100, 200] : 
             options.type === 'readingOverdue' ? [200, 100, 200, 100, 200] : 
             [200, 100, 200, 100, 200, 100, 200],
  };

  // Remove the custom type property before creating the notification
  const { type, ...cleanOptions } = notificationOptions;

  if (Notification.permission === 'granted') {
    new Notification(title, cleanOptions);
  }
}; 