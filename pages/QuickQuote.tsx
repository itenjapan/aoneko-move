import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { VEHICLES } from '../constants';
import { PricingService } from '../services/pricingService';
import { QuoteRequest, Delivery, LatLng } from '../types';
import { mockStore } from '../services/mockDb';
import { useAuth } from '../contexts/AuthContext';
import { Clock, Truck, Box, CheckCircle, AlertCircle, ChevronRight, Calendar, Briefcase, Zap, Star, ArrowRight, Trash2, Copy, MapPin, RefreshCw, Loader2, Navigation, Route } from 'lucide-react';
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
  const [nearestDriver, setNearestDriver] = useState<LatLng | undefined>(undefined);

  // Helper to set default time
  const setSmartDefaultTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1); 
    
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

  useEffect(() => {
    window.scrollTo(0, 0);
    const state = location.state as { selectedVehicle?: string } | null;

    if (state?.selectedVehicle) {
        setSelectedVehicle(state.selectedVehicle);
        setSmartDefaultTime();
        setPickup('');
        setDelivery('');
        setPickupLatLng(null);
        setDeliveryLatLng(null);
        setQuote(null);
        sessionStorage.removeItem('quoteDraft');
        return; 
    }

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

  useEffect(() => {
    if (bookingSuccess) return;
    const stateToSave = {
      pickup, delivery, pickupLatLng, deliveryLatLng, selectedVehicle, date, time,
      boxes, suitcases, useHighway, helperService, quote
    };
    sessionStorage.setItem('quoteDraft', JSON.stringify(stateToSave));
  }, [pickup, delivery, pickupLatLng, deliveryLatLng, selectedVehicle, date, time, boxes, suitcases, useHighway, helperService, quote, bookingSuccess]);

  useEffect(() => {
    if (quote && resultRef.current) {
        setTimeout(() => {
            const headerOffset = 100;
            const elementPosition = resultRef.current?.getBoundingClientRect().top ?? 0;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            window.scrollTo({ top: offsetPosition, behavior: "smooth" });
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
      setNearestDriver(undefined);
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
          const latLng = { lat: position.coords.latitude, lng: position.coords.longitude };
          const address = await GoogleMapsService.reverseGeocode(latLng);
          setPickup(address);
          setPickupLatLng(latLng);
          setIsLocating(false);
        } catch (error) {
          console.error('Error getting location', error);
          setIsLocating(false);
        }
      },
      (error) => {
        setIsLocating(false);
        alert('現在地を取得できませんでした。');
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

      if (pickupLatLng) {
        setNearestDriver({
          lat: pickupLatLng.lat + (Math.random() - 0.5) * 0.02,
          lng: pickupLatLng.lng + (Math.random() - 0.5) * 0.02
        });
      }
    } catch (error) {
      alert('見積もりの計算中にエラーが発生しました。');
    } finally {
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
            <div className="max-w-xl w-full bg-white rounded-[2.5rem] shadow-xl p-8 md:p-12 text-center border border-slate-100 animate-fade-in-up">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600 shadow-sm ring-8 ring-green-50">
                    <CheckCircle size={40} strokeWidth={3} />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-2">予約が完了しました</h2>
                <p className="text-slate-500 mb-8 text-lg font-light">プロのドライバーが間もなく決定します。</p>

                <div className="bg-slate-50 rounded-3xl p-8 mb-8 border border-slate-200 shadow-inner">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">お問い合わせ番号</p>
                    <div className="flex items-center justify-center gap-4">
                         <p className="text-4xl font-mono font-bold text-slate-800 tracking-wider select-all">{bookingSuccess.trackingNumber}</p>
                         <button onClick={() => navigator.clipboard.writeText(bookingSuccess.trackingNumber)} className="text-brand-500 hover:text-brand-600 transition-colors p-2 bg-white rounded-xl shadow-sm border border-slate-200" title="コピー">
                             <Copy size={20} />
                         </button>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <button 
                        onClick={() => navigate(`/tracking?id=${bookingSuccess.trackingNumber}`)}
                        className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold shadow-xl hover:bg-brand-600 transition-all flex items-center justify-center gap-2 transform active:scale-95"
                    >
                        配送状況をリアルタイムで追跡 <ArrowRight size={20} />
                    </button>
                    <button onClick={() => navigate('/dashboard')} className="w-full bg-white text-slate-600 border border-slate-200 py-4 rounded-2xl font-bold hover:bg-slate-50 transition-colors">
                        マイページで詳細を見る
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
          <div className="inline-block p-4 bg-brand-50 rounded-3xl mb-4 shadow-soft border border-brand-100 animate-pulse">
             <Route className="text-brand-500" size={28} />
          </div>
          <h1 className="text-4xl font-bold mb-3 text-slate-900 tracking-tight">スピードお見積もり</h1>
          <p className="text-slate-500 font-light text-lg">AIが最短ルートと最適なプランをご提案します</p>
          {(pickup || delivery || quote) && (
              <button onClick={handleClearForm} className="absolute top-0 right-0 text-slate-400 hover:text-rose-500 text-xs font-bold flex items-center gap-1.5 transition-all bg-white px-3 py-1.5 rounded-full border border-slate-100 shadow-sm">
                  <Trash2 size={14} /> フォームをクリア
              </button>
          )}
        </div>
        
        <div className="grid gap-8">
          {/* Addresses Section */}
          <div className="bg-white rounded-[2.5rem] shadow-sm p-8 md:p-10 border border-slate-100/60 hover:border-brand-200 transition-all duration-500">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-xl font-bold flex items-center text-slate-800">
                 <span className="flex items-center justify-center w-10 h-10 rounded-2xl bg-brand-50 text-brand-600 mr-4 ring-4 ring-brand-50/50 shadow-sm">
                   <MapPin size={22} />
                 </span>
                 配送ルートの設定
              </h2>
            </div>
            <div className="space-y-10 relative">
               <div className="absolute left-[1.5rem] top-12 bottom-12 w-0.5 bg-gradient-to-b from-brand-400 via-brand-200 to-orange-400 z-0 opacity-40"></div>
              <AddressAutocompleteInput label="集荷先 (Pickup Origin)" value={pickup} onChange={setPickup} onSelectLatLng={setPickupLatLng} placeholder="建物名・駅名・住所を入力" markerLabel="A" />
              <AddressAutocompleteInput label="配送先 (Destination)" value={delivery} onChange={setDelivery} onSelectLatLng={setDeliveryLatLng} placeholder="お届け先の住所を入力" markerLabel="B" />
            </div>
          </div>

          {/* Date & Time Section */}
          <div className="bg-white rounded-[2.5rem] shadow-sm p-8 md:p-10 border border-slate-100/60">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                 <h2 className="text-xl font-bold flex items-center text-slate-800">
                    <span className="flex items-center justify-center w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 mr-4 ring-4 ring-indigo-50/50 shadow-sm">
                       <Calendar size={22} />
                    </span>
                    集荷日時の指定
                 </h2>
                 <div className="flex gap-2">
                     <button onClick={() => handleQuickDateSelect('today')} className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-50 text-slate-600 hover:bg-brand-500 hover:text-white transition-all border border-slate-200 active:scale-95">今日</button>
                     <button onClick={() => handleQuickDateSelect('tomorrow')} className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-50 text-slate-600 hover:bg-brand-500 hover:text-white transition-all border border-slate-200 active:scale-95">明日</button>
                     <button onClick={() => handleQuickDateSelect('weekend')} className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-50 text-slate-600 hover:bg-brand-500 hover:text-white transition-all border border-slate-200 active:scale-95">週末</button>
                 </div>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                   <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest pl-1">配送日</label>
                   <input type="date" value={date} onChange={(e) => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-brand-50 transition-all font-medium" />
                </div>
                <div>
                   <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest pl-1">集荷時間</label>
                   <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-brand-50 transition-all font-medium" />
                </div>
             </div>
          </div>

          {/* Vehicles Section */}
          <div className="bg-white rounded-[2.5rem] shadow-sm p-8 md:p-10 border border-slate-100/60">
            <h2 className="text-xl font-bold mb-8 flex items-center text-slate-800">
               <span className="flex items-center justify-center w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 mr-4 ring-4 ring-emerald-50/50 shadow-sm">
                 <Truck size={22} />
               </span>
               車両タイプの選択
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {VEHICLES.map((vehicle) => (
                <div 
                    key={vehicle.id} 
                    className={`rounded-3xl p-6 cursor-pointer transition-all duration-500 relative overflow-hidden group border-2 ${selectedVehicle === vehicle.id ? 'bg-brand-50/40 border-brand-400 shadow-soft scale-[1.02]' : 'bg-white border-slate-100 hover:border-brand-200'}`} 
                    onClick={() => setSelectedVehicle(vehicle.id)}
                >
                   {selectedVehicle === vehicle.id && <div className="absolute top-0 right-0 bg-brand-400 text-white p-2 rounded-bl-3xl z-20 animate-fade-in"><CheckCircle size={20} /></div>}
                  <div className="flex items-start justify-between mb-4 relative z-10">
                     <div className="w-28 h-20 mr-2 flex-shrink-0 transition-transform group-hover:scale-110 duration-500"><img src={vehicle.image} alt={vehicle.name} className="w-full h-full object-contain" /></div>
                     <div className="text-right">
                        <p className={`font-bold text-2xl tracking-tighter ${selectedVehicle === vehicle.id ? 'text-brand-700' : 'text-slate-700'}`}>¥{vehicle.basePrice.toLocaleString()}<span className="text-sm font-normal">〜</span></p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Base Fare</p>
                     </div>
                  </div>
                  <h3 className="font-bold text-slate-800 text-lg">{vehicle.displayName}</h3>
                  <div className="pt-3 border-t border-slate-200/50 text-xs text-slate-500 mt-2 flex items-center gap-2">
                      <Box size={14} className="text-brand-400" /> {vehicle.capacity}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cargo Section */}
          <div className="bg-white rounded-[2.5rem] shadow-sm p-8 md:p-10 border border-slate-100/60">
            <h2 className="text-xl font-bold mb-8 flex items-center text-slate-800">
               <span className="flex items-center justify-center w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 mr-4 ring-4 ring-orange-50/50 shadow-sm">
                  <Briefcase size={22} />
               </span>
               荷物の詳細とオプション
            </h2>
            <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 hover:bg-white transition-colors group">
                        <label className="block text-[10px] font-bold text-slate-400 mb-3 uppercase tracking-[0.2em]">段ボール箱数 (60x30cm)</label>
                        <div className="flex items-center gap-4">
                            <button onClick={() => setBoxes(Math.max(0, boxes - 1))} className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 font-bold">-</button>
                            <input type="number" min="0" value={boxes} onChange={(e) => setBoxes(Number(e.target.value))} className="flex-1 bg-transparent border-b-2 border-slate-200 focus:border-brand-400 outline-none text-center font-bold text-xl py-1" />
                            <button onClick={() => setBoxes(boxes + 1)} className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center hover:bg-brand-600 font-bold shadow-sm">+</button>
                        </div>
                    </div>
                    <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 hover:bg-white transition-colors group">
                        <label className="block text-[10px] font-bold text-slate-400 mb-3 uppercase tracking-[0.2em]">スーツケース数</label>
                        <div className="flex items-center gap-4">
                            <button onClick={() => setSuitcases(Math.max(0, suitcases - 1))} className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 font-bold">-</button>
                            <input type="number" min="0" value={suitcases} onChange={(e) => setSuitcases(Number(e.target.value))} className="flex-1 bg-transparent border-b-2 border-slate-200 focus:border-brand-400 outline-none text-center font-bold text-xl py-1" />
                            <button onClick={() => setSuitcases(suitcases + 1)} className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center hover:bg-brand-600 font-bold shadow-sm">+</button>
                        </div>
                    </div>
                </div>
                <div className="grid gap-4">
                    <label className="flex items-center p-6 border-2 border-slate-100 rounded-3xl cursor-pointer hover:bg-brand-50 hover:border-brand-200 transition-all group">
                        <div className="relative flex items-center justify-center w-6 h-6 mr-4">
                            <input type="checkbox" checked={useHighway} onChange={(e) => setUseHighway(e.target.checked)} className="peer appearance-none w-6 h-6 border-2 border-slate-300 rounded-lg checked:bg-brand-500 checked:border-brand-500 transition-all" />
                            <CheckCircle size={14} className="absolute text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                        </div>
                        <div className="flex-1">
                            <span className="block font-bold text-slate-800">高速道路を使用する</span>
                            <span className="block text-xs text-slate-500 mt-0.5">お急ぎの場合や長距離配送におすすめです</span>
                        </div>
                    </label>
                    <label className="flex items-center p-6 border-2 border-slate-100 rounded-3xl cursor-pointer hover:bg-brand-50 hover:border-brand-200 transition-all group">
                        <div className="relative flex items-center justify-center w-6 h-6 mr-4">
                            <input type="checkbox" checked={helperService} onChange={(e) => setHelperService(e.target.checked)} className="peer appearance-none w-6 h-6 border-2 border-slate-300 rounded-lg checked:bg-brand-500 checked:border-brand-500 transition-all" />
                            <CheckCircle size={14} className="absolute text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                        </div>
                        <div className="flex-1">
                            <span className="block font-bold text-slate-800">荷物積み込みアシスト <span className="text-brand-600 ml-1">(+¥1,000)</span></span>
                            <span className="block text-xs text-slate-500 mt-0.5">ドライバーが建物の搬入出をお手伝いします</span>
                        </div>
                    </label>
                </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleCalculateQuote}
            disabled={loading || !pickup || !delivery || !selectedVehicle || !date || !time}
            className="w-full bg-slate-900 text-white py-6 rounded-3xl font-bold text-xl shadow-2xl shadow-slate-400 hover:bg-brand-600 transition-all transform active:scale-[0.98] flex items-center justify-center gap-3 disabled:bg-slate-300 disabled:shadow-none disabled:transform-none"
          >
            {loading ? <Loader2 className="animate-spin" size={24} /> : (quote ? '料金を再計算する' : '見積もりを確認する')} 
            {!loading && <ChevronRight size={24} />}
          </button>

          {/* Quote Results Section */}
          {quote && (
            <div ref={resultRef} className="bg-slate-950 text-white rounded-[3rem] p-8 md:p-12 shadow-glow animate-fade-in-up border border-white/5 overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                    <div>
                        <h3 className="text-3xl font-bold tracking-tight mb-2">お見積もり結果</h3>
                        <p className="text-slate-400 text-sm font-medium">最適なルートと最短のドライバーが見つかりました</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <span className="text-sm bg-white/10 px-5 py-2.5 rounded-2xl flex items-center gap-2 border border-white/5 font-bold"><Clock size={16} className="text-brand-400" /> 約{quote.estimatedTime}分</span>
                        <span className="text-sm bg-white/10 px-5 py-2.5 rounded-2xl flex items-center gap-2 border border-white/5 font-bold"><Route size={16} className="text-orange-400" /> {quote.estimatedDistance}km</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="space-y-6">
                        {pickupLatLng && deliveryLatLng && (
                          <div className="rounded-[2rem] overflow-hidden shadow-inner border border-white/10 opacity-90 hover:opacity-100 transition-all duration-500 transform hover:scale-[1.01]">
                              <DeliveryMap 
                                pickupLatLng={pickupLatLng} 
                                deliveryLatLng={deliveryLatLng} 
                                driverLatLng={nearestDriver}
                                currentStatus="pending"
                                estimatedRoute={generateRoute(pickupLatLng, deliveryLatLng)}
                                focusOnDelivery={false}
                              />
                          </div>
                        )}
                        {nearestDriver && (
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-3 animate-pulse">
                                <div className="w-2 h-2 rounded-full bg-brand-400"></div>
                                <span className="text-[10px] font-bold text-brand-300 uppercase tracking-widest">Nearby drivers detected in your area</span>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col h-full">
                        <div className="space-y-4 mb-10 flex-1">
                            <div className="flex justify-between py-3 border-b border-white/10 group">
                                <span className="text-slate-400 font-medium group-hover:text-white transition-colors">基本料金</span>
                                <span className="font-mono text-lg font-bold">¥{quote.basePrice.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between py-3 border-b border-white/10 group">
                                <span className="text-slate-400 font-medium group-hover:text-white transition-colors">距離料金 ({quote.estimatedDistance}km)</span>
                                <span className="font-mono text-lg font-bold">¥{quote.distancePrice.toLocaleString()}</span>
                            </div>
                            {quote.timeSurchargeFee > 0 && (
                                <div className="flex justify-between py-3 border-b border-white/10 group text-brand-300">
                                    <span className="font-bold">{quote.timeSurchargeLabel}</span>
                                    <span className="font-mono text-lg font-bold">¥{quote.timeSurchargeFee.toLocaleString()}</span>
                                </div>
                            )}
                            {(quote.cargoSurcharge > 0 || quote.helperFee > 0) && (
                                <div className="flex justify-between py-3 border-b border-white/10 group">
                                    <span className="text-slate-400 font-medium group-hover:text-white transition-colors">各種オプション / 追加荷物</span>
                                    <span className="font-mono text-lg font-bold">¥{(quote.cargoSurcharge + quote.helperFee).toLocaleString()}</span>
                                </div>
                            )}
                        </div>

                        <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 mb-8 transform transition-transform hover:scale-[1.02]">
                            <div className="flex justify-between items-end">
                                <span className="text-lg font-bold text-slate-400 uppercase tracking-widest">Total <span className="text-[10px]">(Inc. Tax)</span></span>
                                <span className="text-6xl font-black text-brand-400 tracking-tighter">¥{quote.totalPrice.toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                           <button 
                                onClick={() => { setQuote(null); setNearestDriver(undefined); window.scrollTo({top: 0, behavior: 'smooth'}); }} 
                                className="sm:col-span-1 bg-white/5 py-4 rounded-2xl font-bold border border-white/10 flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
                           >
                               <RefreshCw size={18} /> <span className="sm:hidden">リセット</span>
                           </button>
                           <button 
                                onClick={handleBooking} 
                                disabled={bookingProcessing} 
                                className="sm:col-span-2 bg-brand-500 text-white py-5 rounded-2xl font-black text-lg hover:bg-brand-400 shadow-xl shadow-brand-500/20 flex items-center justify-center gap-2 transform active:scale-95 transition-all"
                           >
                              {bookingProcessing ? '処理中...' : (user ? 'この内容で配車を依頼' : 'ログインして予約へ')} 
                              <ArrowRight size={22} />
                           </button>
                        </div>
                    </div>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuickQuote;