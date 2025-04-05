import { 
  Firestore, 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  writeBatch,
  onSnapshot,
  QuerySnapshot,
  DocumentData
} from 'firebase/firestore';
import { db } from './firebase';

interface PendingOperation {
  type: 'create' | 'update' | 'delete';
  collection: string;
  docId: string;
  data?: any;
  timestamp: number;
}

class OfflineManager {
  private static instance: OfflineManager;
  private pendingOperations: PendingOperation[] = [];
  private isOnline: boolean = navigator.onLine;
  private syncStatus: 'synced' | 'syncing' | 'pending' = 'synced';
  private syncInterval: NodeJS.Timeout | null = null;

  private constructor() {
    // Initialize event listeners
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
    
    // Start sync interval
    this.startSyncInterval();
  }

  public static getInstance(): OfflineManager {
    if (!OfflineManager.instance) {
      OfflineManager.instance = new OfflineManager();
    }
    return OfflineManager.instance;
  }

  private handleOnline = () => {
    this.isOnline = true;
    this.syncPendingOperations();
  };

  private handleOffline = () => {
    this.isOnline = false;
  };

  private startSyncInterval() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    this.syncInterval = setInterval(() => {
      if (this.isOnline && this.pendingOperations.length > 0) {
        this.syncPendingOperations();
      }
    }, 5000); // Check every 5 seconds
  }

  public async queueOperation(operation: Omit<PendingOperation, 'timestamp'>) {
    const pendingOp: PendingOperation = {
      ...operation,
      timestamp: Date.now()
    };
    
    this.pendingOperations.push(pendingOp);
    this.syncStatus = 'pending';
    
    // Store in localStorage for persistence
    localStorage.setItem('pendingOperations', JSON.stringify(this.pendingOperations));
    
    if (this.isOnline) {
      await this.syncPendingOperations();
    }
  }

  private async syncPendingOperations() {
    if (this.syncStatus === 'syncing' || !this.isOnline) return;
    
    this.syncStatus = 'syncing';
    const batch = writeBatch(db);
    const successfulOps: number[] = [];
    
    try {
      for (let i = 0; i < this.pendingOperations.length; i++) {
        const op = this.pendingOperations[i];
        const docRef = doc(db, op.collection, op.docId);
        
        switch (op.type) {
          case 'create':
            batch.set(docRef, op.data);
            break;
          case 'update':
            batch.update(docRef, op.data);
            break;
          case 'delete':
            batch.delete(docRef);
            break;
        }
      }
      
      await batch.commit();
      successfulOps.push(...this.pendingOperations.map((_, i) => i));
      
    } catch (error) {
      console.error('Error syncing operations:', error);
    } finally {
      // Remove successful operations
      this.pendingOperations = this.pendingOperations.filter((_, i) => !successfulOps.includes(i));
      localStorage.setItem('pendingOperations', JSON.stringify(this.pendingOperations));
      
      this.syncStatus = this.pendingOperations.length > 0 ? 'pending' : 'synced';
    }
  }

  public getSyncStatus() {
    return {
      isOnline: this.isOnline,
      status: this.syncStatus,
      pendingOperations: this.pendingOperations.length
    };
  }

  public async getDocument(collection: string, docId: string) {
    const docRef = doc(db, collection, docId);
    return getDoc(docRef);
  }

  public async setDocument(collection: string, docId: string, data: any) {
    if (this.isOnline) {
      try {
        const docRef = doc(db, collection, docId);
        await setDoc(docRef, data);
        return true;
      } catch (error) {
        console.error('Error setting document:', error);
        return false;
      }
    } else {
      await this.queueOperation({
        type: 'create',
        collection,
        docId,
        data
      });
      return true;
    }
  }

  public async updateDocument(collection: string, docId: string, data: any) {
    if (this.isOnline) {
      try {
        const docRef = doc(db, collection, docId);
        await updateDoc(docRef, data);
        return true;
      } catch (error) {
        console.error('Error updating document:', error);
        return false;
      }
    } else {
      await this.queueOperation({
        type: 'update',
        collection,
        docId,
        data
      });
      return true;
    }
  }

  public async deleteDocument(collection: string, docId: string) {
    if (this.isOnline) {
      try {
        const docRef = doc(db, collection, docId);
        await deleteDoc(docRef);
        return true;
      } catch (error) {
        console.error('Error deleting document:', error);
        return false;
      }
    } else {
      await this.queueOperation({
        type: 'delete',
        collection,
        docId
      });
      return true;
    }
  }
}

export const offlineManager = OfflineManager.getInstance(); 