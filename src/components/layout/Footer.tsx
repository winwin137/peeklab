
import React from 'react';
import { CloudOff } from 'lucide-react';

// This version number should be updated whenever significant changes are made
const APP_VERSION = '1.5.0';

const Footer: React.FC = () => {
  const [isOffline, setIsOffline] = React.useState(!navigator.onLine);
  
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

  return (
    <footer className="border-t py-4 mt-auto">
      <div className="container flex justify-between items-center text-xs text-muted-foreground">
        <div>
          <span>© 2025 PeekDiet</span>
        </div>
        <div className="flex items-center gap-2">
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
