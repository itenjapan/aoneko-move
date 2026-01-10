import { PricingResult } from './PricingResult';
import { UserType } from './User';

export interface LatLng {
    lat: number;
    lng: number;
}

export interface QuoteRequest {
    pickupAddress: string;
    deliveryAddress: string;
    vehicleType: string;
    pickupTime: string; // ISO string date
    helperService?: boolean;
    boxes: number;
    suitcases: number;
    useHighway: boolean;
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
    customerId: string;
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
