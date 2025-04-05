import React from 'react';
import { useOfflineSync } from '../hooks/useOfflineSync';

export const SyncStatus: React.FC = () => {
  const { isOnline, status, pendingOperations } = useOfflineSync();

  const getStatusColor = () => {
    if (!isOnline) return 'bg-yellow-500';
    if (status === 'synced') return 'bg-green-500';
    if (status === 'syncing') return 'bg-blue-500';
    return 'bg-yellow-500';
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (status === 'synced') return 'Synced';
    if (status === 'syncing') return 'Syncing...';
    return `Pending (${pendingOperations})`;
  };

  return (
    <div className="fixed bottom-4 right-4 flex items-center space-x-2 bg-white p-2 rounded-lg shadow">
      <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
      <span className="text-sm text-gray-700">{getStatusText()}</span>
    </div>
  );
}; 