import React, { useEffect, useRef, useState } from 'react';
import { MapPin, X, Navigation, Loader2, Search } from 'lucide-react';
import { LatLng } from '../types';

interface AddressAutocompleteInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onSelectLatLng?: (latlng: LatLng) => void;
  placeholder?: string;
  iconColor?: string;
  iconBgColor?: string;
  markerLabel?: string;
}

const AddressAutocompleteInput: React.FC<AddressAutocompleteInputProps> = ({
  label,
  value,
  onChange,
  onSelectLatLng,
  placeholder,
  iconColor = "text-brand-600",
  iconBgColor = "bg-brand-50",
  markerLabel
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autoCompleteRef = useRef<any | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isApiLoaded, setIsApiLoaded] = useState(false);

  // Initialize Google Maps Autocomplete
  useEffect(() => {
    const checkGoogle = () => {
      if ((window as any).google && (window as any).google.maps && (window as any).google.maps.places) {
        setIsApiLoaded(true);
        if (inputRef.current && !autoCompleteRef.current) {
          autoCompleteRef.current = new (window as any).google.maps.places.Autocomplete(inputRef.current, {
            componentRestrictions: { country: 'jp' },
            fields: ['formatted_address', 'geometry'],
            types: ['geocode', 'establishment']
          });

          autoCompleteRef.current?.addListener('place_changed', () => {
            const place = autoCompleteRef.current?.getPlace();
            if (place && place.formatted_address) {
              onChange(place.formatted_address);
              if (place.geometry && place.geometry.location && onSelectLatLng) {
                onSelectLatLng({
                  lat: place.geometry.location.lat(),
                  lng: place.geometry.location.lng()
                });
              }
            }
          });
        }
      }
    };

    checkGoogle();
    const interval = setInterval(checkGoogle, 500);
    setTimeout(() => clearInterval(interval), 3000);

    return () => clearInterval(interval);
  }, [onChange, onSelectLatLng]);

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      alert('お使いのブラウザは位置情報をサポートしていません');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          if ((window as any).google && (window as any).google.maps) {
            const geocoder = new (window as any).google.maps.Geocoder();
            const latlng = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            
            geocoder.geocode({ location: latlng }, (results: any, status: any) => {
              if (status === 'OK' && results[0]) {
                onChange(results[0].formatted_address);
                if (onSelectLatLng) {
                  onSelectLatLng(latlng);
                }
              } else {
                console.error('Geocoder failed due to: ' + status);
              }
              setIsLocating(false);
            });
          } else {
            const latlng = { lat: position.coords.latitude, lng: position.coords.longitude };
            onChange(`${latlng.lat}, ${latlng.lng}`);
            if (onSelectLatLng) onSelectLatLng(latlng);
            setIsLocating(false);
          }
        } catch (error) {
          console.error('Error getting location', error);
          setIsLocating(false);
        }
      },
      (error) => {
        console.error('Geolocation error', error);
        alert('現在地を取得できませんでした。位置情報の許可を確認してください。');
        setIsLocating(false);
      }
    );
  };

  const handleClear = () => {
    onChange('');
    if (inputRef.current) {
        inputRef.current.value = '';
        inputRef.current.focus();
    }
  };

  return (
    <div className="relative group">
      <div className="flex items-center gap-5">
         <div className={`w-12 h-12 rounded-2xl border shadow-soft flex-shrink-0 flex items-center justify-center font-bold z-10 transition-transform group-hover:scale-105 duration-300 ${iconBgColor} ${iconColor} border-white ring-4 ring-slate-50`}>
            {markerLabel || <MapPin size={20} />}
         </div>
         
         <div className="flex-1 relative">
           <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider pl-1 flex justify-between">
              <span>{label}</span>
              {isApiLoaded && (
                  <button 
                    onClick={handleGeolocation}
                    disabled={isLocating}
                    className="flex items-center gap-1 text-brand-600 hover:text-brand-700 transition-colors text-[10px] bg-brand-50 px-2 py-0.5 rounded-full"
                  >
                    {isLocating ? <Loader2 size={10} className="animate-spin" /> : <Navigation size={10} />}
                    現在地を使用
                  </button>
              )}
           </label>
           
           <div className="relative">
             <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder || "住所を入力..."}
              className="w-full pl-11 pr-10 py-4 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-200 focus:border-brand-400 outline-none transition-all text-slate-700 placeholder-slate-400 text-base shadow-sm group-hover:bg-white"
            />
            
            <div className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none">
                <Search size={18} />
            </div>

            {value && (
                <button 
                    onClick={handleClear}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-slate-300 hover:text-slate-500 hover:bg-slate-100 rounded-full transition-all"
                >
                    <X size={16} />
                </button>
            )}
           </div>
         </div>
      </div>
    </div>
  );
};

export default AddressAutocompleteInput;