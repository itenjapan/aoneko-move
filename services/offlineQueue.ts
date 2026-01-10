
import { mockStore } from './mockDb';
import { DeliveryStatus } from '../types/Order';

export interface QueuedAction {
  id: string;
  type: 'UPDATE_STATUS' | 'COMPLETE_JOB' | 'ACCEPT_JOB';
  payload: any;
  timestamp: number;
}

const STORAGE_KEY = 'jpmove_offline_queue';

export const OfflineQueue = {
  getQueue: (): QueuedAction[] => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  },

  add: (type: QueuedAction['type'], payload: any) => {
    const queue = OfflineQueue.getQueue();
    const action: QueuedAction = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      payload,
      timestamp: Date.now(),
    };
    queue.push(action);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    return action;
  },

  clear: () => {
    localStorage.removeItem(STORAGE_KEY);
  },

  process: async () => {
    const queue = OfflineQueue.getQueue();
    if (queue.length === 0) return 0;

    console.log(`Syncing ${queue.length} offline actions...`);

    // Process all actions sequentially
    for (const action of queue) {
      try {
        // Simulate network latency for sync
        await new Promise(resolve => setTimeout(resolve, 300));

        switch (action.type) {
          case 'UPDATE_STATUS':
            mockStore.updateDeliveryStatus(action.payload.trackingNumber, action.payload.status);
            break;
          case 'COMPLETE_JOB':
            mockStore.completeJob(action.payload.deliveryId);
            break;
          case 'ACCEPT_JOB':
            mockStore.acceptJob(action.payload.deliveryId, action.payload.driverId);
            break;
        }
      } catch (error) {
        console.error('Error processing offline action:', error);
        // In a real app, we might want to keep failed actions in the queue or move to a dead-letter queue
      }
    }

    // Clear queue after processing
    OfflineQueue.clear();
    return queue.length;
  }
};
