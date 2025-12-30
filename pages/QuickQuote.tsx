
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { VEHICLES } from '../constants';
import { PricingService } from '../services/pricingService';
import { QuoteRequest, Delivery, LatLng } from '../types';
import { mockStore } from '../services/mockDb';
import { useAuth } from '../contexts/AuthContext';
import { Clock, Truck, Box, CheckCircle, AlertCircle, ChevronRight, Calendar, Briefcase, Zap, Star, ArrowRight, Trash2, Copy, MapPin, RefreshCw, Loader2, Navigation } from 'lucide-react';
import AddressAutocompleteInput from '../components/AddressAutocompleteInput';
import DeliveryMap from '../components/DeliveryMap';
import { generateRoute } from '../services/liveTrackingService';
import { GoogleMapsService } from '../services/googleMapsService';

const QuickQuote: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Ref for auto-scrolling to results
  const resultRef = useRef<HTMLDivElement>(null);
  
  // State initialization
  const [pickup, setPickup] = useState('');
  const [delivery, setDelivery] = useState('');
  const [pickupLatLng, setPickupLatLng] = useState<LatLng | null>(null);
  const [deliveryLatLng, setDeliveryLatLng] = useState<LatLng | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  
  // Date and Time State
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  
  // Cargo Details
  const [boxes, setBoxes] = useState(0);
  const [suitcases, setSuitcases] = useState(0);
  const [useHighway, setUseHighway] = useState(false);

  const [helperService, setHelperService] = useState(false);
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [bookingProcessing, setBookingProcessing] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<Delivery | null>(null);

  // Helper to set default time
  const setSmartDefaultTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1); // Default to 1 hour from now
    
    // Round to nearest 30 mins
    const minutes = now.getMinutes();
    if (minutes < 30) {
        now.setMinutes(30);
    } else {
        now.setHours(now.getHours() + 1);
        now.setMinutes(0);
    }

    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().slice(0, 5);
    setDate(dateStr);
    setTime(timeStr);
  };

  // Load state logic
  useEffect(() => {
    // 1. Force scroll to top immediately on mount
    window.scrollTo(0, 0);

    // 2. Check if we came from Home with a pre-selected vehicle
    const state = location.state as { selectedVehicle?: string } | null;

    if (state?.selectedVehicle) {
        // Start a FRESH quote with this vehicle
        setSelectedVehicle(state.selectedVehicle);
        setSmartDefaultTime();
        setPickup('');
        setDelivery('');
        setPickupLatLng(null);
        setDeliveryLatLng(null);
        setQuote(null);
        
        // Clear previous session draft to avoid data mismatch
        sessionStorage.removeItem('quoteDraft');
        return; 
    }

    // 3. Otherwise, try to restore draft
    const savedState = sessionStorage.getItem('quoteDraft');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setPickup(parsed.pickup || '');
        setDelivery(parsed.delivery || '');
        setPickupLatLng(parsed.pickupLatLng || null);
        setDeliveryLatLng(parsed.deliveryLatLng || null);
        setSelectedVehicle(parsed.selectedVehicle || '');
        setDate(parsed.date || '');
        setTime(parsed.time || '');
        setBoxes(parsed.boxes || 0);
        setSuitcases(parsed.suitcases || 0);
        setUseHighway(parsed.useHighway || false);
        setHelperService(parsed.helperService || false);
        setQuote(parsed.quote || null);
        return; 
      } catch (e) {
        console.error("Failed to parse saved quote", e);
      }
    }

    setSmartDefaultTime();
  }, [location.state]); 

  // Save state to sessionStorage
  useEffect(() => {
    if (bookingSuccess) return;

    const stateToSave = {
      pickup, delivery, pickupLatLng, deliveryLatLng, selectedVehicle, date, time,
      boxes, suitcases, useHighway, helperService, quote
    };
    sessionStorage.setItem('quoteDraft', JSON.stringify(stateToSave));
  }, [pickup, delivery, pickupLatLng, deliveryLatLng, selectedVehicle, date, time, boxes, suitcases, useHighway, helperService, quote, bookingSuccess]);

  // Auto-scroll to results when quote is generated
  useEffect(() => {
    if (quote && resultRef.current) {
        setTimeout(() => {
            const headerOffset = 100;
            const elementPosition = resultRef.current?.getBoundingClientRect().top ?? 0;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });
        }, 150);
    }
  }, [quote]);

  const handleQuickDateSelect = (type: 'today' | 'tomorrow' | 'weekend') => {
      const target = new Date();
      switch(type) {
          case 'today': setSmartDefaultTime(); return;
          case 'tomorrow':
              target.setDate(target.getDate() + 1);
              target.setHours(10, 0, 0, 0);
              break;
          case 'weekend':
              const day = target.getDay();
              const diff = target.getDate() - day + (day === 6 ? 7 : 6);
              target.setDate(diff);
              target.setHours(10, 0, 0, 0);
              break;
      }
      setDate(target.toISOString().split('T')[0]);
      setTime(target.toTimeString().slice(0, 5));
  };

  const handleClearForm = () => {
      sessionStorage.removeItem('quoteDraft');
      setPickup('');
      setDelivery('');
      setPickupLatLng(null);
      setDeliveryLatLng(null);
      setSelectedVehicle('');
      setQuote(null);
      setBoxes(0);
      setSuitcases(0);
      setSmartDefaultTime();
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('お使いのブラウザは位置情報をサポートしていません');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const latLng = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          
          const address = await GoogleMapsService.reverseGeocode(latLng);
          setPickup(address);
          setPickupLatLng(latLng);
          setIsLocating(false);
        } catch (error) {
          console.error('Error getting location', error);
          alert('現在地を取得できませんでした。');
          setIsLocating(false);
        }
      },
      (error) => {
        console.error('Geolocation error', error);
        alert('位置情報の取得に失敗しました。アクセスを許可してください。');
        setIsLocating(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleCalculateQuote = async () => {
    if (!pickup || !delivery || !selectedVehicle || !date || !time) return;
    
    if (pickup === delivery) {
        alert('集荷先と配送先には異なる住所を指定してください。');
        return;
    }

    const pickupDateTime = new Date(`${date}T${time}`);
    if (pickupDateTime < new Date()) {
        alert('過去の日時は指定できません。未来の日時を選択してください。');
        return;
    }

    setLoading(true);
    try {
      const request: QuoteRequest = {
        pickupAddress: pickup,
        deliveryAddress: delivery,
        vehicleType: selectedVehicle,
        pickupTime: pickupDateTime.toISOString(),
        helperService,
        boxes: Number(boxes),
        suitcases: Number(suitcases),
        useHighway
      };
      
      const result = await PricingService.calculateQuote(request);
      setQuote(result); 
    } catch (error) {
      console.error('Error calculating quote:', error);
      alert('見積もりの計算中にエラーが発生しました。');
    } finally {
      // Corrected from setIsLoading to setLoading
      setLoading(false);
    }
  };

  const handleBooking = async () => {
     if (!user) {
        navigate('/login', { state: { from: '/quote' } });
        return;
     }

     if (!quote) return;

     setBookingProcessing(true);
     await new Promise(resolve => setTimeout(resolve, 1000));
     
     const pickupDateTime = new Date(`${date}T${time}`);

     try {
         const newDelivery = mockStore.createDelivery({
            customerId: user.id,
            pickup: { address: pickup, scheduledTime: pickupDateTime.toISOString() },
            delivery: { address: delivery },
            vehicle: {
               type: selectedVehicle,
               displayName: VEHICLES.find(v => v.id === selectedVehicle)?.displayName || ''
            },
            price: { 
              total: quote.totalPrice,
              breakdown: {
                base: quote.basePrice,
                distance: quote.distancePrice,
                surcharges: quote.timeSurchargeFee + quote.helperFee + quote.cargoSurcharge,
                tolls: quote.tollFee
              }
            },
            estimatedTime: quote.estimatedTime
         });

         sessionStorage.removeItem('quoteDraft');
         setBookingProcessing(false);
         setBookingSuccess(newDelivery);
         window.scrollTo({ top: 0, behavior: 'smooth' });
     } catch (e) {
         setBookingProcessing(false);
         alert('予約処理に失敗しました。');
     }
  };

  if (bookingSuccess) {
    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 flex items-center justify-center">
            <div className="max-w-xl w-full bg-white rounded-3xl shadow-xl p-8 md:p-12 text-center border border-slate-100 animate-fade-in-up">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600 shadow-sm ring-4 ring-green-50">
                    <CheckCircle size={40} strokeWidth={3} />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-2">予約完了</h2>
                <p className="text-slate-500 mb-8 text-lg">配送の手配を受け付けました。</p>

                <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-200">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">追跡番号</p>
                    <div className="flex items-center justify-center gap-2">
                         <p className="text-3xl font-mono font-bold text-slate-800 tracking-wider select-all">{bookingSuccess.trackingNumber}</p>
                         <button onClick={() => navigator.clipboard.writeText(bookingSuccess.trackingNumber)} className="text-slate-400 hover:text-brand-500 transition-colors p-1" title="コピー">
                             <Copy size={18} />
                         </button>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <button 
                        onClick={() => navigate(`/tracking?id=${bookingSuccess.trackingNumber}`)}
                        className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-brand-600 transition-all flex items-center justify-center gap-2"
                    >
                        配送状況を追跡する <ArrowRight size={20} />
                    </button>
                    <button onClick={() => navigate('/dashboard')} className="w-full bg-white text-slate-600 border border-slate-200 py-4 rounded-xl font-bold hover:bg-slate-50">
                        マイページへ戻る
                    </button>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12 relative">
          <div className="inline-block p-3 bg-brand-50 rounded-full mb-4 shadow-sm border border-brand-100">
             <Truck className="text-brand-500" size={24} />
          </div>
          <h1 className="text-3xl font-bold mb-3 text-slate-900">配送料金のお見積もり</h1>
          <p className="text-slate-500 font-light text-lg">最短3ステップで配送を依頼できます</p>
          {(pickup || delivery || quote) && (
              <button onClick={handleClearForm} className="absolute top-0 right-0 text-slate-400 hover:text-rose-500 text-sm flex items-center gap-1 transition-colors">
                  <Trash2 size={14} /> クリア
              </button>
          )}
        </div>
        
        <div className="grid gap-8">
          {/* Addresses */}
          <div className="bg-white rounded-[2rem] shadow-sm p-8 border border-slate-100/60 hover:border-brand-100">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-lg font-bold flex items-center text-slate-800">
                 <span className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-50 text-brand-600 mr-3 ring-4 ring-brand-50/50">
                   <MapPin size={18} />
                 </span>
                 配送ルート
              </h2>
              <button 
                onClick={handleUseCurrentLocation}
                disabled={isLocating}
                className="flex items-center gap-2 bg-brand-50 text-brand-600 px-4 py-2 rounded-full text-xs font-bold hover:bg-brand-100 transition-all shadow-sm active:scale-95 disabled:opacity-50"
              >
                {isLocating ? <Loader2 size={14} className="animate-spin" /> : <Navigation size={14} />}
                現在地を取得
              </button>
            </div>
            <div className="space-y-8 relative pl-3">
               <div className="absolute left-[1.95rem] top-12 bottom-12 w-0.5 bg-gradient-to-b from-brand-300 to-slate-200 z-0"></div>
              <AddressAutocompleteInput label="集荷先 (Pickup)" value={pickup} onChange={setPickup} onSelectLatLng={setPickupLatLng} placeholder="住所を入力 (例: 名古屋駅)" markerLabel="A" />
              <AddressAutocompleteInput label="配送先 (Drop-off)" value={delivery} onChange={setDelivery} onSelectLatLng={setDeliveryLatLng} placeholder="住所を入力 (例: 中部国際空港)" markerLabel="B" />
            </div>
          </div>

          {/* Date & Time */}
          <div className="bg-white rounded-[2rem] shadow-sm p-8 border border-slate-100/60">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                 <h2 className="text-lg font-bold flex items-center text-slate-800">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-50 text-brand-600 mr-3 ring-4 ring-brand-50/50">
                       <Calendar size={18} />
                    </span>
                    集荷日時を選択
                 </h2>
                 <div className="flex gap-2">
                     <button onClick={() => handleQuickDateSelect('today')} className="px-3 py-1.5 rounded-full text-xs font-bold bg-slate-50 text-slate-600 hover:bg-brand-50 hover:text-brand-600 transition-colors border border-slate-100">今日</button>
                     <button onClick={() => handleQuickDateSelect('tomorrow')} className="px-3 py-1.5 rounded-full text-xs font-bold bg-slate-50 text-slate-600 hover:bg-brand-50 hover:text-brand-600 transition-colors border border-slate-100">明日</button>
                     <button onClick={() => handleQuickDateSelect('weekend')} className="px-3 py-1.5 rounded-full text-xs font-bold bg-slate-50 text-slate-600 hover:bg-brand-50 hover:text-brand-600 transition-colors border border-slate-100">週末</button>
                 </div>
             </div>
             <div className="grid grid-cols-2 gap-6">
                <div>
                   <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider pl-1">日付</label>
                   <input type="date" value={date} onChange={(e) => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider pl-1">時間</label>
                   <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
                </div>
             </div>
          </div>

          {/* Vehicles */}
          <div className="bg-white rounded-[2rem] shadow-sm p-8 border border-slate-100/60 hover:border-brand-100 transition-colors">
            <h2 className="text-lg font-bold mb-8 flex items-center text-slate-800">
               <span className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-50 text-brand-600 mr-3 ring-4 ring-brand-50/50">
                 <Truck size={18} />
               </span>
               車両を選択
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {VEHICLES.map((vehicle) => (
                <div key={vehicle.id} className={`rounded-2xl p-6 cursor-pointer transition-all duration-300 relative overflow-hidden group ${selectedVehicle === vehicle.id ? 'bg-brand-50/40 border-2 border-brand-400 shadow-soft' : 'bg-white border-2 border-slate-100 hover:border-brand-200'}`} onClick={() => setSelectedVehicle(vehicle.id)}>
                   {selectedVehicle === vehicle.id && <div className="absolute top-0 right-0 bg-brand-400 text-white p-1.5 rounded-bl-2xl z-20"><CheckCircle size={18} /></div>}
                  <div className="flex items-start justify-between mb-4 relative z-10">
                     <div className="w-24 h-20 mr-2 flex-shrink-0"><img src={vehicle.image} alt={vehicle.name} className="w-full h-full object-contain" /></div>
                     <div className="text-right">
                        <p className={`font-bold text-2xl ${selectedVehicle === vehicle.id ? 'text-brand-700' : 'text-slate-700'}`}>¥{vehicle.basePrice.toLocaleString()}〜</p>
                        <p className="text-xs text-slate-400">基本料金</p>
                     </div>
                  </div>
                  <h3 className="font-bold text-slate-800 text-lg">{vehicle.displayName}</h3>
                  <div className="pt-3 border-t border-slate-200/50 text-xs text-slate-500 mt-2"><Box size={14} className="inline mr-1" /> {vehicle.capacity}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Cargo & Options */}
          <div className="bg-white rounded-[2rem] shadow-sm p-8 border border-slate-100/60">
            <h2 className="text-lg font-bold mb-8 flex items-center text-slate-800"><Briefcase size={18} className="mr-3 text-brand-500" /> 荷物の詳細・オプション</h2>
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                    <div className="bg-slate-50 p-4 rounded-2xl">
                        <label className="block text-xs font-bold text-slate-400 mb-2">段ボール箱</label>
                        <input type="number" min="0" value={boxes} onChange={(e) => setBoxes(Number(e.target.value))} className="w-full p-3 bg-white border border-slate-200 rounded-xl text-center font-bold" />
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl">
                        <label className="block text-xs font-bold text-slate-400 mb-2">スーツケース</label>
                        <input type="number" min="0" value={suitcases} onChange={(e) => setSuitcases(Number(e.target.value))} className="w-full p-3 bg-white border border-slate-200 rounded-xl text-center font-bold" />
                    </div>
                </div>
                <label className="flex items-center p-5 border rounded-2xl cursor-pointer hover:bg-slate-50">
                    <input type="checkbox" checked={useHighway} onChange={(e) => setUseHighway(e.target.checked)} className="w-5 h-5 text-indigo-500 rounded" />
                    <div className="ml-4"><span className="block font-bold">高速道路を使用</span><span className="block text-xs text-slate-500">お急ぎの場合や空港配送におすすめです</span></div>
                </label>
                <label className="flex items-center p-5 border rounded-2xl cursor-pointer hover:bg-slate-50">
                    <input type="checkbox" checked={helperService} onChange={(e) => setHelperService(e.target.checked)} className="w-5 h-5 text-brand-500 rounded" />
                    <div className="ml-4"><span className="block font-bold">荷物積み込みアシスト (+¥1,000)</span><span className="block text-xs text-slate-500">ドライバーが搬入出をお手伝いします</span></div>
                </label>
            </div>
          </div>

          {/* Action Button - Always visible */}
          <button
            onClick={handleCalculateQuote}
            disabled={loading || !pickup || !delivery || !selectedVehicle || !date || !time}
            className="w-full bg-slate-900 text-white py-5 rounded-2xl font-bold text-lg shadow-xl hover:bg-brand-600 transition-all flex items-center justify-center gap-3"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (quote ? '見積もりを再計算' : '料金を見積もる')} <ChevronRight size={20} />
          </button>

          {/* Results */}
          {quote && (
            <div ref={resultRef} className="bg-slate-900 text-white rounded-[2rem] p-8 md:p-10 shadow-glow animate-fade-in-up border border-slate-700 overflow-hidden">
                
                {/* Visual Route Preview */}
                {pickupLatLng && deliveryLatLng && (
                  <div className="mb-8 rounded-xl overflow-hidden shadow-inner border border-white/10 opacity-90 hover:opacity-100 transition-opacity">
                      <DeliveryMap 
                        pickupLatLng={pickupLatLng} 
                        deliveryLatLng={deliveryLatLng} 
                        currentStatus="pending"
                        estimatedRoute={generateRoute(pickupLatLng, deliveryLatLng)}
                        focusOnDelivery={true}
                      />
                  </div>
                )}

                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-2xl font-bold">見積もり結果</h3>
                    <span className="text-sm bg-white/10 px-4 py-2 rounded-full flex items-center gap-2"><Clock size={16} /> 推定: {quote.estimatedTime}分</span>
                </div>
                <div className="space-y-4 mb-10 text-slate-300">
                    <div className="flex justify-between py-2 border-b border-white/10"><span>基本料金</span><span>¥{quote.basePrice.toLocaleString()}</span></div>
                    <div className="flex justify-between py-2 border-b border-white/10"><span>距離料金 ({quote.estimatedDistance}km)</span><span>¥{quote.distancePrice.toLocaleString()}</span></div>
                    {quote.timeSurchargeFee > 0 && <div className="flex justify-between py-2 border-b border-white/10 text-brand-300"><span>{quote.timeSurchargeLabel}</span><span>¥{quote.timeSurchargeFee.toLocaleString()}</span></div>}
                    {quote.cargoSurcharge > 0 && <div className="flex justify-between py-2 border-b border-white/10"><span>追加手荷物料金</span><span>¥{quote.cargoSurcharge.toLocaleString()}</span></div>}
                    <div className="pt-6">
                        <div className="flex justify-between items-end bg-white/5 p-6 rounded-2xl border border-white/10">
                            <span className="text-lg">合計金額 (税込)</span>
                            <span className="text-5xl font-bold text-brand-400">¥{quote.totalPrice.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                   <button onClick={() => { setQuote(null); window.scrollTo({top: 0, behavior: 'smooth'}); }} className="col-span-1 bg-white/5 py-4 rounded-xl font-bold border border-white/10 flex items-center justify-center gap-2"><RefreshCw size={18} /> リセット</button>
                   <button onClick={handleBooking} disabled={bookingProcessing} className="col-span-2 bg-brand-500 text-white py-4 rounded-xl font-bold hover:bg-brand-400 shadow-lg flex items-center justify-center gap-2">
                      {bookingProcessing ? '処理中...' : (user ? 'この内容で配車を依頼' : 'ログインして依頼')} <ArrowRight size={20} />
                   </button>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuickQuote;
