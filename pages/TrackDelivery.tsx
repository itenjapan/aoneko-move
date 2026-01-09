import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { mockStore } from '../services/mockDb';
import { Search, Phone, User, Truck, MapPin, Clock, Loader2, CheckCircle, WifiOff, MessageCircle, AlertTriangle, Activity } from 'lucide-react';
import { Delivery, DeliveryStatus, LatLng, Driver } from '../types';
import DeliveryMap from '../components/DeliveryMap';
import { connectTracking, disconnectTracking, getEstimatedRoute, TrackingUpdate, TrafficCondition } from '../services/liveTrackingService';
import { useAuth } from '../contexts/AuthContext';
import ChatInterface from '../components/ChatInterface';

import { supabase } from '../services/supabase';

const TrackDelivery: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [trackingNumber, setTrackingNumber] = useState(searchParams.get('id') || '');
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [error, setError] = useState('');
  const [driverLocation, setDriverLocation] = useState<LatLng | undefined>(undefined);
  const [realtimeStatus, setRealtimeStatus] = useState<DeliveryStatus | undefined>(undefined);
  const [estimatedRoute, setEstimatedRoute] = useState<LatLng[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [assignedDriver, setAssignedDriver] = useState<Driver | undefined>(undefined);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Traffic & Dynamic ETA States
  const [trafficCondition, setTrafficCondition] = useState<TrafficCondition>('clear');
  const [dynamicEta, setDynamicEta] = useState<number | null>(null);

  // Chat State
  const [showChat, setShowChat] = useState(false);
  const { user } = useAuth();

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadDeliveryData = (id: string) => {
    const foundDelivery = mockStore.getDelivery(id);
    if (foundDelivery) {
      setDelivery(foundDelivery);
      setRealtimeStatus(foundDelivery.status);
      setDynamicEta(foundDelivery.estimatedTime); // Initial fallback

      if (foundDelivery.driverId) {
        // If we have a driver, get the initial live location or fallback to pickup
        const liveLoc = mockStore.getDriverLiveLocation(foundDelivery.trackingNumber);
        setDriverLocation(liveLoc || foundDelivery.pickup.latLng);
        setEstimatedRoute(getEstimatedRoute(foundDelivery.trackingNumber));

        const driverUser = mockStore.getUserById(foundDelivery.driverId);
        if (driverUser && driverUser.userType === 'driver') {
          setAssignedDriver(driverUser as unknown as Driver);
        }
      } else {
        setDriverLocation(undefined);
        setEstimatedRoute(undefined);
        setAssignedDriver(undefined);
      }
      return true;
    }
    return false;
  };


  // ... existing imports

  // ... (inside component)

  const handleTrack = useCallback(async (idToTrack: string) => {
    if (!idToTrack.trim()) return;

    setError('');
    setDelivery(null);
    setAssignedDriver(undefined);
    setIsLoading(true);

    // Simulate network lookup delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // 1. Try Mock Store First (Legacy/Demo IDs)
    let found = loadDeliveryData(idToTrack);

    // 2. If not found, try Supabase (Real Orders)
    if (!found) {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('id', idToTrack)
          .single();

        if (data && !error) {
          // Map Supabase Order to Delivery Interface
          const sbDelivery: Delivery = {
            id: data.id,
            customerId: data.user_id || 'guest',
            status: (data.status === 'confirmed' ? 'pending' : data.status) as DeliveryStatus,
            pickup: {
              address: data.pickup_address,
              latLng: (data.pickup_lat && data.pickup_lng)
                ? { lat: data.pickup_lat, lng: data.pickup_lng }
                : undefined,
              scheduledTime: data.created_at
            },
            delivery: {
              address: data.delivery_address,
              latLng: (data.delivery_lat && data.delivery_lng)
                ? { lat: data.delivery_lat, lng: data.delivery_lng }
                : undefined
            },
            vehicle: {
              type: data.vehicle_id === 1 ? 'keitruck' : 'keivan',
              displayName: data.vehicle_id === 1 ? '軽トラック' : '軽バン'
            },
            price: {
              total: data.total_customer_price,
              breakdown: {
                base: data.base_fare,
                distance: 0, // Not stored separately but net_price roughly
                surcharges: data.loading_fee,
                tolls: data.highway_toll
              }
            },
            estimatedTime: 0, // Dynamic
            trackingNumber: data.id,
            timeline: [
              { status: 'pending', time: new Date(data.created_at).toLocaleString('ja-JP'), description: '注文を受け付けました' }
            ],
            createdAt: data.created_at || new Date().toISOString()
          };

          setDelivery(sbDelivery);
          setRealtimeStatus(sbDelivery.status);
          // Initialize map with fetched location
          if (sbDelivery.pickup.latLng) {
            setDriverLocation(sbDelivery.pickup.latLng);
            // If we had a driver assigned in DB, we'd fetch it here too (future)
          }
          found = true;
        }
      } catch (err) {
        console.error(err);
      }
    }

    if (!found) {
      setDelivery(null);
      setDriverLocation(undefined);
      setRealtimeStatus(undefined);
      setEstimatedRoute(undefined);
      setError('指定された追跡番号の荷物が見つかりません。');
    }
    setIsLoading(false);
  }, []);

  // Initial load from URL (Unchanged)
  useEffect(() => {
    const idFromUrl = searchParams.get('id');
    if (idFromUrl) {
      handleTrack(idFromUrl);
    }
  }, [searchParams, handleTrack]);

  // Real-time connection
  useEffect(() => {
    // Only connect if we have a valid delivery loaded and we are online
    if (delivery && !isOffline) {
      console.log(`Starting connection for ${delivery.trackingNumber}`);

      const onMessage = (update: TrackingUpdate) => {
        setDriverLocation({ lat: update.lat, lng: update.lng });

        // Update Traffic & ETA
        if (update.trafficCondition) setTrafficCondition(update.trafficCondition);
        if (update.remainingMinutes !== undefined) setDynamicEta(update.remainingMinutes);

        // If status changes, update local status AND refresh full delivery data
        if (update.status !== realtimeStatus) {
          setRealtimeStatus(update.status);

          // Reload the delivery object from store to get the updated Timeline & Driver ID
          const updatedDelivery = mockStore.getDelivery(delivery.trackingNumber);
          if (updatedDelivery) {
            setDelivery(updatedDelivery);

            // Check if driver was just assigned
            if (updatedDelivery.driverId && !assignedDriver) {
              const driverUser = mockStore.getUserById(updatedDelivery.driverId);
              if (driverUser && driverUser.userType === 'driver') {
                setAssignedDriver(driverUser as unknown as Driver);
                setEstimatedRoute(getEstimatedRoute(updatedDelivery.trackingNumber));
              }
            }
          }
        }
      };

      const onClose = () => {
        console.log('Tracking connection closed.');
      };

      connectTracking(delivery.trackingNumber, onMessage, onClose);

      return () => {
        disconnectTracking(delivery.trackingNumber);
      };
    }
  }, [delivery?.trackingNumber, realtimeStatus, isOffline, assignedDriver]);

  const getStatusColor = (status: DeliveryStatus | undefined) => {
    switch (status) {
      case 'delivered': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      case 'pending': return 'bg-gray-400';
      case 'searching_driver': return 'bg-yellow-500';
      default: return 'bg-brand-500';
    }
  };

  const getTrafficBadge = (condition: TrafficCondition) => {
    switch (condition) {
      case 'heavy':
        return (
          <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 border border-red-200">
            <AlertTriangle size={12} /> 渋滞中 (+遅延)
          </span>
        );
      case 'moderate':
        return (
          <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 border border-amber-200">
            <Activity size={12} /> 交通量多
          </span>
        );
      default:
        return (
          <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 border border-green-200">
            <CheckCircle size={12} /> 順調
          </span>
        );
    }
  };

  const displayStatus = realtimeStatus || delivery?.status || 'Unknown';

  // Can the current user chat? 
  // User must be logged in AND (be the customer who made the order OR be an admin)
  const canChat = user && delivery && assignedDriver && (user.id === delivery.customerId || user.userType === 'admin');

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      {/* Chat Modal */}
      {showChat && delivery && canChat && (
        <ChatInterface
          deliveryId={delivery.id}
          currentUser={user}
          recipientName={assignedDriver?.name || 'ドライバー'}
          onClose={() => setShowChat(false)}
        />
      )}

      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">荷物追跡</h1>
          {isOffline && (
            <span className="bg-gray-800 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-2 animate-pulse">
              <WifiOff size={12} /> オフライン（最終更新データを表示中）
            </span>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={20} className="text-gray-400" />
              </div>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="追跡番号を入力 (例: JP123456)"
                className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none disabled:bg-gray-100 disabled:text-gray-500 transition-colors"
                disabled={isLoading}
                onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleTrack(trackingNumber)}
              />
            </div>
            <button
              onClick={() => handleTrack(trackingNumber)}
              disabled={isLoading || !trackingNumber}
              className="bg-brand-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-brand-700 transition-colors disabled:bg-brand-300 disabled:cursor-not-allowed min-w-[100px] flex justify-center items-center shadow-sm"
            >
              {isLoading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                '検索'
              )}
            </button>
          </div>
          {error && <p className="text-rose-500 mt-2 text-sm animate-fade-in">{error}</p>}
        </div>

        {delivery && (
          <div className="space-y-6 animate-fade-in">
            {/* Map Section */}
            {delivery.pickup.latLng && delivery.delivery.latLng && (
              <div className="relative">
                <DeliveryMap
                  pickupLatLng={delivery.pickup.latLng}
                  deliveryLatLng={delivery.delivery.latLng}
                  driverLatLng={driverLocation}
                  currentStatus={displayStatus}
                  estimatedRoute={estimatedRoute}
                />
                {/* Live Indicator */}
                {!isOffline && displayStatus !== 'delivered' && displayStatus !== 'cancelled' && (
                  <div className="absolute top-4 right-14 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-xs font-bold text-red-500 shadow-md border border-red-100 flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    LIVE TRACKING
                  </div>
                )}
                {isOffline && (
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg text-xs font-bold text-gray-500 shadow-sm border border-gray-200">
                    地図データは古い可能性があります
                  </div>
                )}

                {/* Chat Floating Button (Only if canChat is true) */}
                {canChat && (
                  <button
                    onClick={() => setShowChat(true)}
                    className="absolute bottom-6 right-4 bg-slate-900 text-white p-3.5 rounded-full shadow-lg shadow-slate-900/30 hover:bg-brand-600 transition-all transform hover:scale-105 flex items-center gap-2 font-bold z-10"
                  >
                    <MessageCircle size={24} />
                    <span className="hidden sm:inline">ドライバーとチャット</span>
                  </button>
                )}
              </div>
            )}

            {/* Status Card */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
              <div className={`${getStatusColor(displayStatus)} px-6 py-4 flex justify-between items-center text-white transition-colors duration-500`}>
                <div>
                  <p className="text-sm opacity-90 font-medium">現在のステータス</p>
                  <p className="text-xl font-bold capitalize tracking-wide">{displayStatus === 'searching_driver' ? 'ドライバー検索中' : displayStatus.replace(/_/g, ' ')}</p>
                </div>
                {displayStatus === 'delivered' ? <CheckCircle size={32} /> : <Truck size={32} className="opacity-80" />}
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="text-gray-500 text-sm">追跡番号</p>
                    <p className="text-xl font-mono font-bold text-gray-900">{delivery.trackingNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-500 text-sm mb-1">到着予定</p>
                    <div className="flex flex-col items-end">
                      <p className="text-lg font-bold text-gray-900">
                        {displayStatus === 'delivered' ? '到着済み' : `${dynamicEta ?? delivery.estimatedTime}分後`}
                      </p>
                      {displayStatus === 'in_transit' && (
                        <div className="mt-1">
                          {getTrafficBadge(trafficCondition)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Driver Info - Dynamically updates */}
                {assignedDriver ? (
                  <div className="bg-gray-50 rounded-lg p-4 flex items-center gap-4 mb-6 border border-gray-100 animate-fade-in">
                    <div className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center text-blue-600 shadow-sm">
                      <User size={24} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900">{assignedDriver.name}</h4>
                      <p className="text-sm text-gray-500 flex items-center gap-2">
                        <Truck size={12} />
                        {(assignedDriver as any).vehicleType === 'keivan' ? '軽バン' : '軽トラック'} • {(assignedDriver as any).licensePlate || '番号なし'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {canChat && (
                        <button
                          onClick={() => setShowChat(true)}
                          className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 hover:bg-brand-200 transition-colors"
                          title="ドライバーとチャット"
                        >
                          <MessageCircle size={20} />
                        </button>
                      )}
                      <button className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 hover:bg-green-200 transition-colors">
                        <Phone size={20} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 rounded-lg p-4 mb-6 text-sm text-yellow-800 border border-yellow-100 flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" /> ドライバーを検索中です...
                  </div>
                )}

                {/* Timeline - Dynamically updates via connectTracking effect */}
                <div className="relative pl-4 border-l-2 border-gray-100 space-y-8 my-4">
                  {delivery.timeline.slice().reverse().map((event, index) => (
                    <div key={index} className="relative pl-6 animate-fade-in-up">
                      <div className={`absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ${index === 0 ? 'bg-brand-600 ring-4 ring-brand-50' : 'bg-gray-300'}`}></div>
                      <p className={`text-sm ${index === 0 ? 'font-bold text-gray-900' : 'font-medium text-gray-500'}`}>{event.description}</p>
                      <p className="text-xs text-gray-400 flex items-center mt-1">
                        <Clock size={12} className="mr-1" /> {event.time}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Locations */}
                <div className="border-t border-gray-100 pt-6 mt-4 space-y-4">
                  <div className="flex items-start">
                    <div className="min-w-[24px] pt-1"><div className="w-3 h-3 rounded-full bg-blue-500 ring-4 ring-blue-50"></div></div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Pickup</p>
                      <p className="text-gray-900 font-medium">{delivery.pickup.address}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="min-w-[24px] pt-1"><div className="w-3 h-3 rounded-full bg-orange-500 ring-4 ring-orange-50"></div></div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Drop-off</p>
                      <p className="text-gray-900 font-medium">{delivery.delivery.address}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackDelivery;