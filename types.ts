export interface LatLng {
  lat: number;
  lng: number;
}

export interface Vehicle {
  id: string;
  name: string;
  displayName: string;
  basePrice: number;
  perKmPrice: number;
  capacity: string;
  dimensions: string;
  maxWeight: number;
  description: string;
  icon: string;
  image: string;
  hasNoHeightLimit?: boolean;
}

export interface Plan {
  id: string;
  name: string;
  price: string;
  description: string;
  features: string[];
  recommended?: boolean;
}

export interface QuoteRequest {
  pickupAddress: string;
  deliveryAddress: string;
  vehicleType: string;
  pickupTime: string; // ISO string date
  helperService?: boolean;
  boxes: number; // 60x30cm boxes
  suitcases: number; // Travel suitcases
  useHighway: boolean; // Toll road preference
}

export interface QuoteResponse {
  id: string;
  basePrice: number;
  distancePrice: number;
  timeSurchargeFee: number;
  timeSurchargeLabel: string;
  helperFee: number;
  cargoSurcharge: number; // New: Fee for extra boxes/suitcases
  tollFee: number; // New: Highway tolls
  totalPrice: number;
  tax?: number;      // Added tax field
  subTotal?: number; // Added subtotal field
  estimatedDistance: number;
  estimatedTime: number;
}

export type UserType = 'customer' | 'driver' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  userType: UserType;
  password?: string;
}

export interface Driver extends User {
  vehicleType: 'keivan' | 'keitruck';
  licensePlate: string;
  isOnline: boolean;
  rating: number;
  totalRides: number;
}

export type DeliveryStatus =
  | 'pending'
  | 'searching_driver'
  | 'accepted'
  | 'pickup_in_progress'
  | 'in_transit'
  | 'delivered'
  | 'cancelled';

export interface DeliveryTimelineEvent {
  status: DeliveryStatus;
  description: string;
  time: string;
}

export interface Delivery {
  id: string;
  trackingNumber: string;
  customerId: string; // ID of the user who booked
  driverId?: string;
  status: DeliveryStatus;
  pickup: {
    address: string;
    latLng: LatLng;
    scheduledTime?: string;
  };
  delivery: {
    address: string;
    latLng: LatLng;
  };
  vehicle: {
    type: string;
    displayName: string;
  };
  price: {
    total: number;
    breakdown?: {
      base: number;
      distance: number;
      surcharges: number;
      tolls: number;
    };
  };
  estimatedTime: number; // minutes
  timeline: DeliveryTimelineEvent[];
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  deliveryId: string;
  senderId: string;
  senderName: string;
  senderRole: UserType;
  text: string;
  timestamp: string;
  isRead: boolean;
}