import React, { useEffect, useRef, useState } from 'react';
import { MapPin, X, Navigation, Loader2, Search, History, Star } from 'lucide-react';
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
  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<{ address: string, latLng?: LatLng }[]>([]);

  // Load recent searches on mount
  useEffect(() => {
    const saved = localStorage.getItem('jpmove_recent_addresses');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved).slice(0, 3));
      } catch (e) {
        console.error("Failed to parse recent addresses");
      }
    }
  }, []);

  const saveToRecent = (address: string, latLng?: LatLng) => {
    if (!address) return;
    const newRecent = [{ address, latLng }, ...recentSearches.filter(r => r.address !== address)].slice(0, 5);
    setRecentSearches(newRecent.slice(0, 3));
    localStorage.setItem('jpmove_recent_addresses', JSON.stringify(newRecent));
  };

  // Initialize Google Maps Autocomplete
  useEffect(() => {
    const initAutocomplete = () => {
      if ((window as any).google?.maps?.places && inputRef.current && !autoCompleteRef.current) {
        setIsApiLoaded(true);
        autoCompleteRef.current = new (window as any).google.maps.places.Autocomplete(inputRef.current, {
          componentRestrictions: { country: 'jp' },
          fields: ['formatted_address', 'geometry'],
          types: ['geocode', 'establishment']
        });

        autoCompleteRef.current?.addListener('place_changed', () => {
          const place = autoCompleteRef.current?.getPlace();
          if (place && place.formatted_address) {
            const addr = place.formatted_address;
            const ll = place.geometry?.location ? {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng()
            } : undefined;

            onChange(addr);
            if (ll && onSelectLatLng) {
              onSelectLatLng(ll);
            }
            saveToRecent(addr, ll);
          }
        });
      }
    };

    const checkInterval = setInterval(() => {
      if ((window as any).google?.maps?.places) {
        initAutocomplete();
        clearInterval(checkInterval);
      }
    }, 500);

    return () => clearInterval(checkInterval);
  }, [onChange, onSelectLatLng, recentSearches]);

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      alert('お使いのブラウザは位置情報をサポートしていません');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latlng = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        try {
          if ((window as any).google?.maps?.Geocoder) {
            const geocoder = new (window as any).google.maps.Geocoder();
            geocoder.geocode({ location: latlng }, (results: any, status: any) => {
              if (status === 'OK' && results[0]) {
                const addr = results[0].formatted_address;
                onChange(addr);
                if (onSelectLatLng) onSelectLatLng(latlng);
                saveToRecent(addr, latlng);
              }
              setIsLocating(false);
            });
          } else {
            const addr = `${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}`;
            onChange(addr);
            if (onSelectLatLng) onSelectLatLng(latlng);
            setIsLocating(false);
          }
        } catch (error) {
          console.error('Geolocation error', error);
          setIsLocating(false);
        }
      },
      (error) => {
        console.error('Geolocation error', error);
        alert('現在地を取得できませんでした。');
        setIsLocating(false);
      }
    );
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    if (inputRef.current) {
      inputRef.current.value = '';
      inputRef.current.focus();
    }
  };

  const handleRecentClick = (item: { address: string, latLng?: LatLng }) => {
    onChange(item.address);
    if (item.latLng && onSelectLatLng) {
      onSelectLatLng(item.latLng);
    }
    setIsFocused(false);
  };

  return (
    <div className="relative group w-full">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-2xl border shadow-soft flex-shrink-0 flex items-center justify-center font-bold z-10 transition-all duration-300 transform group-hover:scale-110 ${iconBgColor} ${iconColor} border-white ring-4 ring-slate-50`}>
          {markerLabel || <MapPin size={20} />}
        </div>

        <div className="flex-1 relative">
          <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-[0.15em] pl-1 flex justify-between items-center">
            <span>{label}</span>
            {isApiLoaded && (
              <button
                onClick={handleGeolocation}
                disabled={isLocating}
                className="flex items-center gap-1.5 text-brand-600 hover:text-brand-700 transition-all active:scale-95 text-[10px] bg-brand-50 px-2.5 py-1 rounded-full border border-brand-100 font-bold"
              >
                {isLocating ? <Loader2 size={10} className="animate-spin" /> : <Navigation size={10} />}
                現在地
              </button>
            )}
          </label>

          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={value}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck="false"
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 200)}
              onChange={(e) => {
                const newVal = e.target.value;
                onChange(newVal);
              }}
              placeholder={placeholder || "住所を入力..."}
              className="w-full pl-11 pr-10 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-brand-100 focus:border-brand-400 outline-none transition-all text-slate-700 placeholder-slate-400 text-sm shadow-sm group-hover:bg-white group-hover:border-slate-300"
            />

            <div className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-300 pointer-events-none group-focus-within:text-brand-500 transition-colors">
              <Search size={18} />
            </div>

            {value && (
              <button
                onClick={handleClear}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all"
              >
                <X size={16} />
              </button>
            )}

            {/* Recent Searches Dropdown */}
            {isFocused && !value && recentSearches.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-[60] animate-fade-in-up">
                <div className="p-3 bg-slate-50/50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <History size={12} /> 最近の検索
                </div>
                {recentSearches.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleRecentClick(item)}
                    className="w-full text-left px-4 py-3.5 hover:bg-brand-50 transition-colors flex items-center gap-3 border-b border-slate-50 last:border-0"
                  >
                    <div className="p-1.5 bg-slate-100 rounded-lg text-slate-400">
                      <MapPin size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700 truncate font-medium">{item.address}</p>
                    </div>
                  </button>
                ))}
                <button className="w-full text-center py-2 text-[10px] text-brand-600 font-bold hover:bg-brand-50">
                  すべて表示
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddressAutocompleteInput;