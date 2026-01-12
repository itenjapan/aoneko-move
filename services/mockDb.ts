import { Delivery, DeliveryStatus, LatLng, ChatMessage } from '../types/Order';
import { User, Driver } from '../types/User';

// In-memory store for the session with localStorage persistence
class MockStore {
  deliveries: Delivery[] = [];
  users: (User | Driver)[] = []; // Store users for auth
  messages: ChatMessage[] = []; // Store chat messages

  // Mock driver (Initial/Default driver data)
  defaultDriver: Driver = {
    id: 'driver-1',
    name: '鈴木 一郎 (Driver)',
    email: 'suzuki@driver.com',
    phone: '080-9876-5432',
    userType: 'driver',
    vehicleType: 'keivan',
    licensePlate: '名古屋 580 あ 12-34',
    isOnline: true,
    rating: 4.8,
    totalRides: 152
  };

  // Mock Admin
  defaultAdmin: User = {
    id: 'admin-1',
    name: 'システム管理者 (Admin)',
    email: 'aoneko.move@gmail.com',
    userType: 'admin',
    phone: '000-0000-0000'
  };

  // Mock Customer
  defaultCustomer: User = {
    id: 'user-1',
    name: '田中 太郎 (Customer)',
    email: 'tanaka@demo.com',
    userType: 'customer',
    phone: '090-1111-2222'
  };

  private driverLiveLocation: Map<string, LatLng> = new Map();
  private driverEarnings: Map<string, number> = new Map();

  constructor() {
    this.loadData();
    this.initializeDefaultUsers();
    this.seedSampleHistory();
  }

  private loadData() {
    if (typeof window !== 'undefined') {
      const savedDeliveries = localStorage.getItem('jpmove_deliveries');
      if (savedDeliveries) {
        try {
          this.deliveries = JSON.parse(savedDeliveries);
        } catch (e) {
          console.error('Failed to load deliveries', e);
        }
      }
      const savedEarnings = localStorage.getItem('jpmove_driver_earnings');
      if (savedEarnings) {
        try {
          this.driverEarnings = new Map(JSON.parse(savedEarnings));
        } catch (e) {
          console.error('Failed to load driver earnings', e);
        }
      }
      const savedUsers = localStorage.getItem('jpmove_users');
      if (savedUsers) {
        try {
          this.users = JSON.parse(savedUsers);
        } catch (e) {
          console.error('Failed to load users', e);
        }
      }
      const savedLocations = localStorage.getItem('jpmove_driver_locations');
      if (savedLocations) {
        try {
          this.driverLiveLocation = new Map(JSON.parse(savedLocations));
        } catch (e) {
          console.error('Failed to load driver locations', e);
        }
      }
      const savedMessages = localStorage.getItem('jpmove_messages');
      if (savedMessages) {
        try {
          this.messages = JSON.parse(savedMessages);
        } catch (e) {
          console.error('Failed to load messages', e);
        }
      }
    }
  }

  private seedSampleHistory() {
    if (this.deliveries.length === 0) {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const sampleJobs: Delivery[] = [
        {
          id: 'job-h1',
          trackingNumber: 'JP882910',
          customerId: 'user-1',
          driverId: 'driver-1',
          status: 'delivered',
          pickup: { address: '名古屋市中村区名駅1-1-4', latLng: { lat: 35.1709, lng: 136.8815 } },
          delivery: { address: '愛知県常滑市セントレア1-1', latLng: { lat: 34.8584, lng: 136.8124 } },
          vehicle: { type: 'keivan', displayName: 'Light Van (軽バン)' },
          price: {
            total: 8250,
            breakdown: { base: 1580, distance: 4170, surcharges: 1500, tolls: 1000 }
          },
          estimatedTime: 45,
          createdAt: yesterday.toISOString(),
          timeline: []
        },
        {
          id: 'job-h2',
          trackingNumber: 'JP112044',
          customerId: 'user-1',
          driverId: 'driver-1',
          status: 'delivered',
          pickup: { address: '岐阜県岐阜市橋本町1-10', latLng: { lat: 35.4095, lng: 136.7566 } },
          delivery: { address: '名古屋市中区栄3-5-1', latLng: { lat: 35.1681, lng: 136.9064 } },
          vehicle: { type: 'keitruck', displayName: 'Pick-up (軽トラック)' },
          price: {
            total: 6800,
            breakdown: { base: 1780, distance: 3520, surcharges: 1500, tolls: 0 }
          },
          estimatedTime: 55,
          createdAt: today.toISOString(),
          timeline: []
        }
      ];
      this.deliveries = sampleJobs;

      // Update cumulative earnings
      const total = sampleJobs.reduce((acc, job) => acc + Math.floor(job.price.total * 0.80), 0);
      this.driverEarnings.set('driver-1', total);

      this.saveData();
    }
  }

  private saveData() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('jpmove_deliveries', JSON.stringify(this.deliveries));
      localStorage.setItem('jpmove_driver_earnings', JSON.stringify(Array.from(this.driverEarnings.entries())));
      localStorage.setItem('jpmove_users', JSON.stringify(this.users));
      localStorage.setItem('jpmove_driver_locations', JSON.stringify(Array.from(this.driverLiveLocation.entries())));
      localStorage.setItem('jpmove_messages', JSON.stringify(this.messages));
    }
  }

  private initializeDefaultUsers() {
    if (!this.users.find(u => u.email === this.defaultDriver.email)) {
      const driverUser: User = { ...this.defaultDriver, password: 'password' };
      this.users.push(driverUser);
    }
    if (!this.users.find(u => u.email === this.defaultAdmin.email)) {
      const adminUser: User = { ...this.defaultAdmin, password: 'admin' };
      this.users.push(adminUser);
    }
    if (!this.users.find(u => u.email === this.defaultCustomer.email)) {
      const customerUser: User = { ...this.defaultCustomer, password: 'password' };
      this.users.push(customerUser);
    }
    this.saveData();
  }

  authenticate(email: string, password: string): User | null {
    const user = this.users.find(u => u.email === email && u.password === password);
    return user || null;
  }

  register(name: string, email: string, password: string, userType: 'customer' | 'driver' = 'customer', additionalData?: any): User {
    if (this.users.find(u => u.email === email)) {
      throw new Error('このメールアドレスは既に登録されています。');
    }
    let newUser: User | Driver;
    if (userType === 'driver' && additionalData) {
      newUser = {
        id: 'driver-' + Math.random().toString(36).substr(2, 9),
        name, email, password, userType: 'driver',
        phone: additionalData.phone || '',
        vehicleType: additionalData.vehicleType || 'keivan',
        licensePlate: additionalData.licensePlate || '',
        isOnline: false, rating: 5.0, totalRides: 0
      } as Driver;
    } else {
      newUser = {
        id: 'user-' + Math.random().toString(36).substr(2, 9),
        name,
        email,
        password,
        userType,
        phone: additionalData?.phone || '',
        aonekoId: this.generateAonekoId()
      };
    }
    this.users.push(newUser);
    this.saveData();
    return newUser;
  }

  private generateAonekoId(): string {
    const year = new Date().getFullYear();
    const seq = (this.users.length + 1).toString().padStart(3, '0');
    return `AONEKO-${year}-${seq}`;
  }

  getAllUsers(): (User | Driver)[] {
    return this.users;
  }

  updateUser(updatedUser: Partial<User | Driver> & { id: string }) {
    const index = this.users.findIndex(u => u.id === updatedUser.id);
    if (index !== -1) {
      this.users[index] = { ...this.users[index], ...updatedUser };
      this.saveData();
    }
  }

  getUserById(id: string): User | undefined {
    return this.users.find(u => u.id === id);
  }

  getAllDrivers(): Driver[] {
    return this.users.filter(u => u.userType === 'driver') as Driver[];
  }

  private generateMockLatLng(): LatLng {
    const baseLat = 35.1815;
    const baseLng = 136.9064;
    const latOffset = (Math.random() - 0.5) * 0.2;
    const lngOffset = (Math.random() - 0.5) * 0.2;
    return { lat: baseLat + latOffset, lng: baseLng + lngOffset };
  }

  createDelivery(delivery: Omit<Delivery, 'id' | 'createdAt' | 'timeline' | 'status' | 'trackingNumber' | 'pickup' | 'delivery'> & { pickup: { address: string; scheduledTime?: string }; delivery: { address: string } }): Delivery {
    const trackingNumber = 'JP' + Math.floor(100000 + Math.random() * 900000);
    const newDelivery: Delivery = {
      ...delivery,
      id: Math.random().toString(36).substring(2, 9),
      trackingNumber,
      status: 'searching_driver',
      createdAt: new Date().toISOString(),
      pickup: { address: delivery.pickup.address, latLng: this.generateMockLatLng(), scheduledTime: delivery.pickup.scheduledTime },
      delivery: { address: delivery.delivery.address, latLng: this.generateMockLatLng() },
      timeline: [
        { status: 'pending', description: '注文を受け付けました', time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) },
        { status: 'searching_driver', description: 'ドライバーを探しています', time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) }
      ]
    };
    this.deliveries.unshift(newDelivery);
    this.saveData();
    return newDelivery;
  }

  getDelivery(trackingNumber: string): Delivery | undefined {
    return this.deliveries.find(d => d.trackingNumber === trackingNumber);
  }

  getDeliveriesForUser(userId: string): Delivery[] {
    return this.deliveries.filter(d => d.customerId === userId);
  }

  getAvailableJobs(): Delivery[] {
    return this.deliveries.filter(d => d.status === 'searching_driver');
  }

  acceptJob(deliveryId: string, driverId: string): Delivery | undefined {
    const delivery = this.deliveries.find(d => d.id === deliveryId);
    if (delivery) {
      delivery.driverId = driverId;
      delivery.status = 'accepted';
      if (!delivery.timeline.some(t => t.status === 'accepted')) {
        delivery.timeline.push({
          status: 'accepted',
          description: 'ドライバーが決定しました',
          time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
        });
      }
      this.saveData();
    }
    return delivery;
  }

  completeJob(deliveryId: string): Delivery | undefined {
    const delivery = this.deliveries.find(d => d.id === deliveryId);
    if (delivery && delivery.driverId) {
      delivery.status = 'delivered';
      if (!delivery.timeline.some(t => t.status === 'delivered')) {
        delivery.timeline.push({
          status: 'delivered',
          description: '配送完了',
          time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
        });
        const earningsAmount = Math.floor(delivery.price.total * 0.80);
        this.addDriverEarnings(delivery.driverId, earningsAmount);
        const driver = this.getUserById(delivery.driverId) as Driver;
        if (driver) {
          driver.totalRides = (driver.totalRides || 0) + 1;
          this.updateUser(driver);
        }
        this.driverLiveLocation.delete(delivery.trackingNumber);
      }
      this.saveData();
    }
    return delivery;
  }

  setDriverLiveLocation(trackingNumber: string, latLng: LatLng) {
    this.driverLiveLocation.set(trackingNumber, latLng);
    this.saveData();
  }

  getDriverLiveLocation(trackingNumber: string): LatLng | undefined {
    return this.driverLiveLocation.get(trackingNumber);
  }

  getDriverLocationById(driverId: string): LatLng | undefined {
    return { lat: 35.1815, lng: 136.9064 };
  }

  updateDeliveryStatus(trackingNumber: string, newStatus: DeliveryStatus) {
    const delivery = this.deliveries.find(d => d.trackingNumber === trackingNumber);
    if (delivery && delivery.status !== newStatus) {
      delivery.status = newStatus;
      let description = '';
      switch (newStatus) {
        case 'accepted': description = 'ドライバーが決定しました'; break;
        case 'pickup_in_progress': description = '集荷に向かっています'; break;
        case 'in_transit': description = '荷物を輸送中です'; break;
        case 'delivered': description = '配送完了しました'; break;
        case 'cancelled': description = '配送がキャンセルされました'; break;
        case 'searching_driver': description = 'ドライバーを探しています'; break;
        case 'pending': description = '注文を受け付けました'; break;
      }
      delivery.timeline.push({
        status: newStatus,
        description: description,
        time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
      });
      this.saveData();
    }
  }

  getDriverEarnings(driverId: string): number {
    return this.driverEarnings.get(driverId) || 0;
  }

  addDriverEarnings(driverId: string, amount: number) {
    const currentEarnings = this.getDriverEarnings(driverId);
    this.driverEarnings.set(driverId, currentEarnings + amount);
    this.saveData();
  }

  getMessages(deliveryId: string): ChatMessage[] {
    return this.messages
      .filter(m => m.deliveryId === deliveryId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  sendMessage(deliveryId: string, senderId: string, text: string): ChatMessage {
    const sender = this.getUserById(senderId);
    if (!sender) throw new Error('User not found');
    const newMessage: ChatMessage = {
      id: Math.random().toString(36).substring(2, 9),
      deliveryId, senderId, senderName: sender.name, senderRole: sender.userType,
      text, timestamp: new Date().toISOString(), isRead: false
    };
    this.messages.push(newMessage);
    this.saveData();
    return newMessage;
  }
}

export const mockStore = new MockStore();