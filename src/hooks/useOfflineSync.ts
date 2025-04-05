import { useState, useEffect } from 'react';
import { offlineManager } from '../lib/offlineManager';

export const useOfflineSync = () => {
  const [syncStatus, setSyncStatus] = useState(offlineManager.getSyncStatus());

  useEffect(() => {
    const updateStatus = () => {
      setSyncStatus(offlineManager.getSyncStatus());
    };

    // Update status when online/offline state changes
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);

    // Update status periodically
    const interval = setInterval(updateStatus, 5000);

    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
      clearInterval(interval);
    };
  }, []);

  return {
    ...syncStatus,
    setDocument: offlineManager.setDocument.bind(offlineManager),
    updateDocument: offlineManager.updateDocument.bind(offlineManager),
    deleteDocument: offlineManager.deleteDocument.bind(offlineManager),
    getDocument: offlineManager.getDocument.bind(offlineManager)
  };
}; 