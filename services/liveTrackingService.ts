// services/liveTrackingService.ts
import { DeliveryStatus, LatLng } from '../types/Order';
import { mockStore } from './mockDb';

export type TrafficCondition = 'clear' | 'moderate' | 'heavy';

export interface TrackingUpdate {
  lat: number;
  lng: number;
  status: DeliveryStatus;
  remainingMinutes?: number;
  trafficCondition?: TrafficCondition;
}

type OnMessageCallback = (update: TrackingUpdate) => void;
type OnCloseCallback = () => void;

interface ActiveTracking {
  intervalId: number;
  route: LatLng[];
  currentIndex: number;
  totalSteps: number;
  trafficCongestion: TrafficCondition; // Simulated traffic for this session
}

const activeTrackings = new Map<string, ActiveTracking>();

// Simple function to generate a route between two points
export function generateRoute(start: LatLng, end: LatLng, steps: number = 20): LatLng[] {
  const route: LatLng[] = [];
  for (let i = 0; i <= steps; i++) {
    const factor = i / steps;
    route.push({
      lat: start.lat + (end.lat - start.lat) * factor,
      lng: start.lng + (end.lng - start.lng) * factor,
    });
  }
  return route;
}

export function connectTracking(
  trackingNumber: string,
  onMessage: OnMessageCallback,
  onClose: OnCloseCallback
) {
  if (activeTrackings.has(trackingNumber)) {
    return;
  }

  const delivery = mockStore.getDelivery(trackingNumber);
  if (!delivery) {
    console.error(`Delivery ${trackingNumber} not found.`);
    onClose();
    return;
  }

  // Use a route from the stored pickup to delivery for fallback simulation
  const route = generateRoute(delivery.pickup.latLng, delivery.delivery.latLng, 120);

  // Simulate a random traffic condition for this session
  const rand = Math.random();
  const trafficCongestion: TrafficCondition = rand > 0.8 ? 'heavy' : rand > 0.5 ? 'moderate' : 'clear';

  const pollStatusAndLocation = () => {
    // 1. Fetch fresh data from the store to check for status updates from DriverApp
    const currentDelivery = mockStore.getDelivery(trackingNumber);

    if (!currentDelivery) {
      disconnectTracking(trackingNumber);
      onClose();
      return;
    }

    const actualStatus: DeliveryStatus = currentDelivery.status;

    // 2. Check if there is a "Real" live location set by the DriverApp
    const driverLiveLoc = mockStore.getDriverLiveLocation(trackingNumber);

    let currentLatLng: LatLng;
    let tracker = activeTrackings.get(trackingNumber);

    // Initialize tracker state if missing
    if (!tracker) {
      tracker = {
        intervalId: 0,
        route,
        currentIndex: 0,
        totalSteps: route.length,
        trafficCongestion
      };
      activeTrackings.set(trackingNumber, tracker);
    }

    // 3. Determine which location to send
    if (driverLiveLoc && (actualStatus === 'pickup_in_progress' || actualStatus === 'in_transit' || actualStatus === 'accepted')) {
      currentLatLng = driverLiveLoc;

      // Sync simulation index to real location
      if (tracker && actualStatus === 'in_transit') {
        let minDesc = Infinity;
        let bestIndex = tracker.currentIndex;

        tracker.route.forEach((pt, idx) => {
          const d = Math.pow(pt.lat - driverLiveLoc.lat, 2) + Math.pow(pt.lng - driverLiveLoc.lng, 2);
          if (d < minDesc) {
            minDesc = d;
            bestIndex = idx;
          }
        });
        tracker.currentIndex = bestIndex;
      }

    } else if (actualStatus === 'delivered') {
      currentLatLng = currentDelivery.delivery.latLng;
      tracker.currentIndex = tracker.totalSteps;
    } else {
      // FALLBACK: Simulate movement
      if (actualStatus === 'in_transit') {
        if (tracker.currentIndex < tracker.route.length - 1) {
          tracker.currentIndex++;
        }
        currentLatLng = tracker.route[tracker.currentIndex];
      } else if (actualStatus === 'pickup_in_progress') {
        currentLatLng = delivery.pickup.latLng;
      } else {
        currentLatLng = driverLiveLoc || delivery.pickup.latLng;
      }
    }

    // 4. Calculate Dynamic ETA based on distance remaining and traffic
    let remainingMinutes = 0;
    if (actualStatus === 'in_transit') {
      const remainingSteps = tracker.totalSteps - tracker.currentIndex;
      const baseMinutesPerStep = 0.5; // Roughly 30 seconds per step in simulation

      let trafficMultiplier = 1;
      if (trafficCongestion === 'moderate') trafficMultiplier = 1.3;
      if (trafficCongestion === 'heavy') trafficMultiplier = 1.8;

      remainingMinutes = Math.ceil(remainingSteps * baseMinutesPerStep * trafficMultiplier);
    } else if (actualStatus === 'pickup_in_progress') {
      remainingMinutes = currentDelivery.estimatedTime; // Fallback to initial estimate
    }

    // 5. Send Update
    onMessage({
      lat: currentLatLng.lat,
      lng: currentLatLng.lng,
      status: actualStatus,
      remainingMinutes,
      trafficCondition: trafficCongestion
    });

    // 6. Auto-disconnect if finished
    if (actualStatus === 'delivered' || actualStatus === 'cancelled') {
      if (activeTrackings.has(trackingNumber)) {
        // Keep connected briefly
      }
    }
  };

  // Poll every 2 seconds
  const intervalId = window.setInterval(pollStatusAndLocation, 2000);

  activeTrackings.set(trackingNumber, {
    intervalId,
    route,
    currentIndex: 0,
    totalSteps: route.length,
    trafficCongestion
  });

  pollStatusAndLocation();
}

export function disconnectTracking(trackingNumber: string) {
  const active = activeTrackings.get(trackingNumber);
  if (active) {
    window.clearInterval(active.intervalId);
    activeTrackings.delete(trackingNumber);
  }
}

export function getEstimatedRoute(trackingNumber: string): LatLng[] | undefined {
  const delivery = mockStore.getDelivery(trackingNumber);
  if (delivery) {
    return generateRoute(delivery.pickup.latLng, delivery.delivery.latLng);
  }
  return undefined;
}