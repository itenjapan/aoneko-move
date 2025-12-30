import React, { useEffect, useRef, useState } from 'react';
import { LatLng, DeliveryStatus } from '../types';
import { Map as MapIcon } from 'lucide-react';

interface DeliveryMapProps {
  pickupLatLng: LatLng;
  deliveryLatLng: LatLng;
  driverLatLng?: LatLng;
  currentStatus: DeliveryStatus;
  estimatedRoute?: LatLng[];
  focusOnDelivery?: boolean;
}

const DeliveryMap: React.FC<DeliveryMapProps> = ({
  pickupLatLng,
  deliveryLatLng,
  driverLatLng,
  currentStatus,
  estimatedRoute,
  focusOnDelivery = false,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMap = useRef<any | null>(null);
  const pickupMarker = useRef<any | null>(null);
  const deliveryMarker = useRef<any | null>(null);
  const driverMarker = useRef<any | null>(null);
  const routePolyline = useRef<any | null>(null);

  const [isGoogleMapsReady, setIsGoogleMapsReady] = useState(false);
  const [mapError, setMapError] = useState(false);

  // Check for Google Maps API availability
  useEffect(() => {
    if ((window as any).google?.maps) {
      setIsGoogleMapsReady(true);
      return;
    }

    let attempts = 0;
    const intervalId = setInterval(() => {
      attempts++;
      if ((window as any).google?.maps) {
        setIsGoogleMapsReady(true);
        clearInterval(intervalId);
      } else if (attempts > 30) {
        clearInterval(intervalId);
        setMapError(true);
      }
    }, 100);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!isGoogleMapsReady || !mapRef.current) return;
    
    try {
        const maps = (window as any).google.maps;

        // Initialize map
        if (!googleMap.current) {
            googleMap.current = new maps.Map(mapRef.current, {
                center: focusOnDelivery ? deliveryLatLng : pickupLatLng,
                zoom: focusOnDelivery ? 15 : 13,
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: false,
                zoomControl: true,
                styles: [
                    {
                        featureType: "poi",
                        elementType: "labels",
                        stylers: [{ visibility: "off" }]
                    }
                ]
            });
        }

        // Update Pickup Marker
        if (!pickupMarker.current) {
            pickupMarker.current = new maps.Marker({
                position: pickupLatLng,
                map: googleMap.current,
                title: 'Pickup Location',
                icon: {
                    url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                    scaledSize: new maps.Size(40, 40),
                },
                label: { text: 'A', color: 'white', fontSize: '12px', fontWeight: 'bold' },
            });
        } else {
             pickupMarker.current.setPosition(pickupLatLng);
        }

        // Update Delivery Marker
        if (!deliveryMarker.current) {
            deliveryMarker.current = new maps.Marker({
                position: deliveryLatLng,
                map: googleMap.current,
                title: 'Delivery Location',
                icon: {
                    url: 'https://maps.google.com/mapfiles/ms/icons/orange-dot.png',
                    scaledSize: new maps.Size(40, 40),
                },
                label: { text: 'B', color: 'white', fontSize: '12px', fontWeight: 'bold' },
            });
        } else {
             deliveryMarker.current.setPosition(deliveryLatLng);
        }

        // Update Driver Marker
        if (driverLatLng) {
             if (!driverMarker.current) {
                driverMarker.current = new maps.Marker({
                    position: driverLatLng,
                    map: googleMap.current,
                    title: 'Driver Location',
                    icon: {
                        url: 'https://cdn-icons-png.flaticon.com/32/2556/2556515.png',
                        scaledSize: new maps.Size(32, 32),
                        anchor: new maps.Point(16, 16),
                    },
                    zIndex: 999,
                });
             } else {
                 driverMarker.current.setPosition(driverLatLng);
             }
        } else if (driverMarker.current) {
            driverMarker.current.setMap(null);
            driverMarker.current = null;
        }

        // Update Estimated Route Polyline
        if (estimatedRoute && estimatedRoute.length > 1) {
            if (!routePolyline.current) {
                routePolyline.current = new maps.Polyline({
                    path: estimatedRoute,
                    geodesic: true,
                    strokeColor: '#38bdf8',
                    strokeOpacity: 0.8,
                    strokeWeight: 5,
                    map: googleMap.current,
                });
            } else {
                routePolyline.current.setPath(estimatedRoute);
                routePolyline.current.setMap(googleMap.current);
            }
        } else if (routePolyline.current) {
            routePolyline.current.setMap(null);
        }

        // Initial bounds fit or focus
        if (!(googleMap.current as any).hasFitBounds) {
             if (focusOnDelivery) {
                googleMap.current.setCenter(deliveryLatLng);
                googleMap.current.setZoom(15);
             } else {
                const bounds = new maps.LatLngBounds();
                bounds.extend(pickupLatLng);
                bounds.extend(deliveryLatLng);
                if (driverLatLng) bounds.extend(driverLatLng);
                googleMap.current.fitBounds(bounds);
             }
             (googleMap.current as any).hasFitBounds = true;
        }
        
    } catch (e) {
        console.error("Error initializing map components", e);
        setMapError(true);
    }
  }, [isGoogleMapsReady, pickupLatLng, deliveryLatLng, driverLatLng, estimatedRoute, focusOnDelivery]);

  if (mapError) {
      return (
        <div className="w-full h-full min-h-[250px] bg-slate-100 rounded-xl flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200">
             <MapIcon size={32} className="mb-2 opacity-50" />
             <p className="font-bold text-sm">マップを読み込めませんでした</p>
        </div>
      );
  }

  if (!isGoogleMapsReady) {
      return (
          <div className="w-full h-full min-h-[250px] bg-slate-50 rounded-xl flex items-center justify-center animate-pulse">
              <span className="text-slate-400 font-medium text-sm flex items-center">
                  Loading Map...
              </span>
          </div>
      );
  }

  return (
    <div className="relative w-full h-64 md:h-80 rounded-xl overflow-hidden shadow-inner border border-slate-200">
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
};

export default DeliveryMap;