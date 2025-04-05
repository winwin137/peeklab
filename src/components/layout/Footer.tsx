import React from 'react';
import { CloudOff, Clock } from 'lucide-react';
import { useMealCycles } from '@/hooks/useMealCycles';
import { getCurrentCycleTimeout } from '@/config';

// This version number should be updated whenever significant changes are made
const APP_VERSION = '1.6.0';

const Footer: React.FC = () => {
  const [isOffline, setIsOffline] = React.useState(!navigator.onLine);
  const { activeMealCycle } = useMealCycles();
  const [timeRemaining, setTimeRemaining] = React.useState<number | null>(null);
  
  React.useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update time remaining every second
  React.useEffect(() => {
    if (!activeMealCycle?.startTime) {
      setTimeRemaining(null);
      return;
    }

    const cycleTimeout = getCurrentCycleTimeout() * 60 * 1000; // Convert to milliseconds
    const endTime = activeMealCycle.startTime + cycleTimeout;

    const updateTimeRemaining = () => {
      const now = Date.now();
      const remaining = endTime - now;
      setTimeRemaining(remaining > 0 ? remaining : 0);
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [activeMealCycle?.startTime]);

  const formatTimeRemaining = (ms: number) => {
    const totalSeconds = Math.ceil(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    }
    return `${minutes}m ${seconds}s`;
  };

  return (
    <footer className="border-t py-4 mt-auto">
      <div className="container flex justify-between items-center text-xs text-muted-foreground">
        <div>
          <span>© 2025 PeekDiet</span>
        </div>
        <div className="flex items-center gap-4">
          {timeRemaining !== null && (
            <div className="flex items-center text-amber-500">
              <Clock className="h-3 w-3 mr-1" />
              <span>Cycle ends in {formatTimeRemaining(timeRemaining)}</span>
            </div>
          )}
          {isOffline && (
            <div className="flex items-center text-destructive">
              <CloudOff className="h-3 w-3 mr-1" />
              <span>Offline</span>
            </div>
          )}
          <span>Version {APP_VERSION}</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
