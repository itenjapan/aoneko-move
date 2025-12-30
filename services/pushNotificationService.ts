export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  actions?: NotificationAction[];
}

export class PushNotificationService {
  private static VAPID_PUBLIC_KEY = 'YOUR_VAPID_PUBLIC_KEY_HERE';

  static async initialize(): Promise<boolean> {
    if (!('serviceWorker' in navigator) || !('PushManager' in (window as any))) {
      console.warn('Push notifications not supported');
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.log('Notification permission denied');
        return false;
      }

      // In a real app, you would subscribe to push service here
      // const subscription = await registration.pushManager.subscribe({
      //   userVisibleOnly: true,
      //   applicationServerKey: this.VAPID_PUBLIC_KEY
      // });
      
      return true;
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return false;
    }
  }

  static async showLocalNotification(payload: NotificationPayload): Promise<void> {
    if (!await this.hasPermission()) return;

    try {
      // Use Service Worker for notifications if available (mobile support)
      const registration = await navigator.serviceWorker.ready;
      
      // Fallback or desktop direct notification
      const options: any = {
        body: payload.body,
        icon: payload.icon || 'https://cdn-icons-png.flaticon.com/512/754/754854.png',
        badge: payload.badge || 'https://cdn-icons-png.flaticon.com/512/754/754854.png',
        tag: payload.tag,
        data: payload.data,
        actions: payload.actions,
        requireInteraction: true
      };

      if (registration && registration.showNotification) {
        await registration.showNotification(payload.title, options);
      } else {
        new Notification(payload.title, options);
      }

    } catch (e) {
      console.error("Error showing notification:", e);
    }
  }

  // Domain specific notifications
  static async notifyDriverAssigned(deliveryId: string, driverName: string, pickupAddress: string) {
    await this.showLocalNotification({
      title: '🚚 ドライバーが決定しました',
      body: `${driverName}さんが${pickupAddress}に向かっています`,
      tag: `driver-assigned-${deliveryId}`,
      data: {
        url: `/tracking?id=${deliveryId}`,
        deliveryId,
        type: 'driver_assigned'
      }
    });
  }

  static async notifyDeliveryStatusUpdate(deliveryId: string, status: string, estimatedTime?: string) {
    const statusMessages: { [key: string]: string } = {
      'accepted': '配達が承諾されました',
      'pickup_in_progress': '荷物の受け取り中',
      'in_transit': '配達中です',
      'delivered': '配達完了しました'
    };

    await this.showLocalNotification({
      title: '📦 配達状況が更新されました',
      body: `${statusMessages[status] || status}${estimatedTime ? ` - 推定: ${estimatedTime}` : ''}`,
      tag: `delivery-update-${deliveryId}`,
      data: {
        url: `/tracking?id=${deliveryId}`,
        deliveryId,
        type: 'status_update'
      }
    });
  }

  static async notifyNewDeliveryRequest(pickupAddress: string, price: number, deliveryId: string) {
    await this.showLocalNotification({
      title: '💰 新しい配達リクエスト',
      body: `${pickupAddress} - ¥${price.toLocaleString()}`,
      tag: `new-request-${deliveryId}`,
      data: {
        url: `/driver`,
        deliveryId,
        type: 'new_request'
      }
    });
  }

  private static async hasPermission(): Promise<boolean> {
    return Notification.permission === 'granted';
  }
}