import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { VEHICLES } from '../constants';
import { QuoteRequest, Delivery, LatLng } from '../types/Order';
import { QuoteResponse } from '../types/PricingResult';
import { mockStore } from '../services/mockDb';
import { useAuth } from '../contexts/AuthContext';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { getDistance } from '../services/googleMaps/distance';
import { calculateCompleteBreakdown } from '../utils/pricingFormulas';
import { CheckCircle, Loader2, Trash2, ArrowRight, User, Mail, Phone, ShieldCheck } from 'lucide-react';

import { OrderForm } from '../components/OrderForm';
import { VehicleSelector } from '../components/VehicleSelector';
import { PriceBreakdown } from '../components/PriceBreakdown';
import { useTranslation } from 'react-i18next';

const QuickQuote: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { vehicles: dbVehicles, createOrder } = useSupabaseData();
  const resultRef = useRef<HTMLDivElement>(null);

  // --- States ---
  const [pickup, setPickup] = useState('');
  const [delivery, setDelivery] = useState('');
  const [pickupLatLng, setPickupLatLng] = useState<LatLng | null>(null);
  const [deliveryLatLng, setDeliveryLatLng] = useState<LatLng | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState('keivan');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [boxes, setBoxes] = useState(0);
  const [suitcases, setSuitcases] = useState(0);
  const [useHighway, setUseHighway] = useState(false);
  const [helperService, setHelperService] = useState(false);

  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [bookingProcessing, setBookingProcessing] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<Delivery | null>(null);
  const [nearestDriver, setNearestDriver] = useState<LatLng | undefined>(undefined);

  // Customer Lead Info
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [customerPhone, setCustomerPhone] = useState('');

  const setSmartDefaultTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    now.setMinutes(now.getMinutes() < 30 ? 30 : 0);
    if (now.getMinutes() === 0) now.setHours(now.getHours() + 1);
    setDate(now.toISOString().split('T')[0]);
    setTime(now.toTimeString().slice(0, 5));
  };

  // --- Initial Setup ---
  useEffect(() => {
    window.scrollTo(0, 0);
    setSmartDefaultTime();
    const state = location.state as { selectedVehicle?: string } | null;
    if (state?.selectedVehicle) setSelectedVehicle(state.selectedVehicle);
  }, [location.state]);

  // --- Real-time Calculation ---
  useEffect(() => {
    const calculateDistance = async () => {
      if (pickup && delivery && selectedVehicle && dbVehicles.length > 0) {
        try {
          const selectedDbVehicle = dbVehicles.find(v => (v.id === 1 && selectedVehicle === 'keitruck') || (v.id === 2 && selectedVehicle === 'keivan'));

          if (!selectedDbVehicle) return;

          // Get distance from the new Google Maps service
          const { distanceKm, durationMin } = await getDistance(pickup, delivery);

          // Calculate fees
          const helperFee = helperService ? 1000 : 0;
          const STANDARD_BOX_LIMIT = 6;
          const BOX_SURCHARGE = 500;
          const STANDARD_SUITCASE_LIMIT = 6;
          const SUITCASE_SURCHARGE = 800;

          let cargoSurcharge = 0;
          if (boxes > STANDARD_BOX_LIMIT) cargoSurcharge += (boxes - STANDARD_BOX_LIMIT) * BOX_SURCHARGE;
          if (suitcases > STANDARD_SUITCASE_LIMIT) cargoSurcharge += (suitcases - STANDARD_SUITCASE_LIMIT) * SUITCASE_SURCHARGE;

          let tollFee = 0;
          if (useHighway) tollFee = 500 + Math.ceil(distanceKm * 25);

          const now = new Date();
          const pickupTime = new Date(`${date}T${time}`);
          const diffInHours = (pickupTime.getTime() - now.getTime()) / (1000 * 60 * 60);

          let timeSurchargeFee = 0;
          let timeSurchargeLabel = '通常予約';
          if (diffInHours < 2) {
            timeSurchargeFee = 2000;
            timeSurchargeLabel = '特急料金 (2時間以内)';
          } else if (diffInHours < 24) {
            timeSurchargeFee = 1000;
            timeSurchargeLabel = 'お急ぎ料金 (24時間以内)';
          }

          const breakdown = calculateCompleteBreakdown(
            { base_price: selectedDbVehicle.base_price },
            distanceKm,
            tollFee,
            helperFee + cargoSurcharge + timeSurchargeFee,
            0
          );

          setQuote({
            id: Math.random().toString(36).substring(7),
            startingPrice: selectedDbVehicle.base_price,
            basePrice: breakdown.base_fare,
            distancePrice: Math.round(distanceKm * 400),
            timeSurchargeFee,
            timeSurchargeLabel,
            helperFee,
            cargoSurcharge,
            tollFee,
            totalPrice: breakdown.total_customer_price,
            totalCustomerPrice: breakdown.total_customer_price,
            tax: breakdown.tax_amount,
            subTotal: breakdown.net_price,
            companyRevenue: breakdown.company_revenue,
            driverRevenue: breakdown.driver_revenue,
            estimatedDistance: parseFloat(distanceKm.toFixed(1)),
            estimatedTime: durationMin
          });

          if (!nearestDriver && pickupLatLng) {
            setNearestDriver({
              lat: pickupLatLng.lat + (Math.random() - 0.5) * 0.02,
              lng: pickupLatLng.lng + (Math.random() - 0.5) * 0.02
            });
          }
        } catch (e) {
          console.error("Auto calculation failed", e);
        }
      }
    };

    const debounceTimer = setTimeout(calculateDistance, 800);
    return () => clearTimeout(debounceTimer);
  }, [pickup, delivery, pickupLatLng, selectedVehicle, helperService, boxes, suitcases, useHighway, date, time, dbVehicles]);

  const handleBooking = async () => {
    if (!quote) return;
    if (!customerEmail) {
      alert('メールアドレスを入力してください / Please enter your email.');
      return;
    }

    setBookingProcessing(true);
    try {
      // 1. Save to Supabase
      const orderData = {
        pickup_address: pickup,
        delivery_address: delivery,
        distance_km: quote.estimatedDistance,
        vehicle_id: selectedVehicle === 'keivan' ? 2 : 1,
        base_fare: quote.basePrice,
        highway_toll: quote.tollFee,
        loading_fee: quote.helperFee + quote.cargoSurcharge,
        net_price: quote.subTotal,
        tax_amount: quote.tax,
        total_customer_price: quote.totalCustomerPrice,
        company_revenue: quote.companyRevenue,
        driver_revenue: quote.driverRevenue,
        status: 'confirmed' as const,
        customer_name: customerName,
        customer_email: customerEmail,
        pickup_lat: pickupLatLng?.lat,
        pickup_lng: pickupLatLng?.lng,
        delivery_lat: deliveryLatLng?.lat,
        delivery_lng: deliveryLatLng?.lng,
        user_id: user?.id || null
      };

      await createOrder(orderData);

      // 2. Create local mock success
      const newDelivery = mockStore.createDelivery({
        customerId: user?.id || 'guest',
        pickup: {
          address: pickup,
          scheduledTime: new Date(`${date}T${time}`).toISOString()
        },
        delivery: {
          address: delivery
        },
        vehicle: {
          type: selectedVehicle,
          displayName: VEHICLES.find(v => v.id === selectedVehicle)?.displayName || ''
        },
        price: {
          total: quote.totalCustomerPrice,
          breakdown: {
            base: quote.basePrice,
            distance: quote.distancePrice,
            surcharges: quote.helperFee + quote.cargoSurcharge + quote.timeSurchargeFee,
            tolls: quote.tollFee
          }
        },
        estimatedTime: quote.estimatedTime
      });

      setBookingSuccess(newDelivery);
      window.scrollTo(0, 0);

    } catch (e: any) {
      console.error("Booking failed", e);
      alert(`予約エラー: ${e.message}`);
    } finally {
      setBookingProcessing(false);
    }
  };

  if (bookingSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 py-20 px-4 flex items-center justify-center">
        <div className="max-w-xl w-full bg-white rounded-[3rem] shadow-2xl p-10 md:p-14 text-center border border-slate-100 animate-fade-in-up">
          <div className="w-24 h-24 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-8 text-brand-500 shadow-sm ring-8 ring-brand-50/50">
            <CheckCircle size={48} strokeWidth={2.5} />
          </div>
          <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">予約が完了しました！</h2>
          <p className="text-slate-500 mb-10 text-lg font-light leading-relaxed">
            プロのドライバーが間もなく決定します。<br />
            お問い合わせ番号を控えておいてください。
          </p>

          <div className="bg-slate-950 text-white rounded-[2rem] p-8 mb-10 border border-white/5 shadow-inner relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
            <p className="text-[10px] font-bold text-brand-400 uppercase tracking-[0.2em] mb-3">Booking Reference</p>
            <p className="text-5xl font-mono font-black tracking-widest text-white selection:bg-brand-500">{bookingSuccess.trackingNumber}</p>
          </div>

          <div className="flex flex-col gap-4">
            <button
              onClick={() => navigate(`/tracking?id=${bookingSuccess.trackingNumber}`)}
              className="w-full bg-brand-500 text-white py-5 rounded-2xl font-black text-xl shadow-xl shadow-brand-500/20 hover:bg-brand-600 transition-all flex items-center justify-center gap-3 transform active:scale-95"
            >
              リアルタイムで追跡する <ArrowRight size={24} />
            </button>
            <button onClick={() => navigate('/')} className="w-full text-slate-400 font-bold hover:text-slate-600 transition-colors py-3">
              トップページに戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 pt-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16 relative">
          <div className="inline-block p-4 bg-brand-50 rounded-3xl mb-6 shadow-soft border border-brand-100">
            <ShieldCheck size={32} className="text-brand-500" />
          </div>
          <h1 className="text-5xl font-black mb-4 text-slate-900 tracking-tight">
            スピードお見積もり
          </h1>
          <p className="text-slate-500 font-light text-xl max-w-xl mx-auto leading-relaxed">
            AIが最適なルート、正確な料金、そして信頼できるドライバーを瞬時に提案します。
          </p>
        </div>

        <div className="space-y-10">
          <VehicleSelector selectedVehicle={selectedVehicle} onSelect={setSelectedVehicle} dbVehicles={dbVehicles} />

          {selectedVehicle && (
            <div className="animate-fade-in-up space-y-10">
              <OrderForm
                pickup={pickup} setPickup={setPickup} delivery={delivery} setDelivery={setDelivery}
                setPickupLatLng={setPickupLatLng} setDeliveryLatLng={setDeliveryLatLng}
                date={date} setDate={setDate} time={time} setTime={setTime}
                boxes={boxes} setBoxes={setBoxes} suitcases={suitcases} setSuitcases={setSuitcases}
                useHighway={useHighway} setUseHighway={setUseHighway}
                helperService={helperService} setHelperService={setHelperService}
                handleQuickDateSelect={(type) => {
                  const now = new Date();
                  if (type === 'today') setSmartDefaultTime();
                  else if (type === 'tomorrow') {
                    now.setDate(now.getDate() + 1);
                    now.setHours(10, 0);
                    setDate(now.toISOString().split('T')[0]);
                    setTime("10:00");
                  } else if (type === 'weekend') {
                    const day = now.getDay();
                    const diff = (day === 0) ? 6 : (6 - day);
                    now.setDate(now.getDate() + diff);
                    now.setHours(10, 0);
                    setDate(now.toISOString().split('T')[0]);
                    setTime("10:00");
                  }
                }}
              />

              <div className="bg-white rounded-[2.5rem] shadow-sm p-8 md:p-10 border border-slate-100/60 transition-all hover:border-brand-200">
                <h2 className="text-xl font-bold mb-8 flex items-center text-slate-800">
                  <span className="flex items-center justify-center w-10 h-10 rounded-2xl bg-blue-50 text-brand-600 mr-4 ring-4 ring-blue-50/50">
                    <User size={22} />
                  </span>
                  お客様情報 (Customer Info)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest pl-1">お名前 (Name)</label>
                    <div className="relative">
                      <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                      <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="山田 太郎" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-brand-50 focus:border-brand-400 transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest pl-1">メールアドレス (Email) *</label>
                    <div className="relative">
                      <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                      <input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="example@mail.com" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-brand-50 focus:border-brand-400 transition-all shadow-sm" required />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest pl-1">電話番号 (Phone)</label>
                    <div className="relative">
                      <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                      <input type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="090-1234-5678" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-brand-50 focus:border-brand-400 transition-all" />
                    </div>
                  </div>
                </div>
              </div>

              {!quote && (pickup && delivery) && (
                <div className="flex justify-center p-4">
                  <div className="flex items-center gap-2 text-slate-400 animate-pulse">
                    <Loader2 size={16} className="animate-spin" />
                    <span className="text-sm font-bold">料金を計算中...</span>
                  </div>
                </div>
              )}

              {quote && (
                <PriceBreakdown
                  quote={quote} pickupLatLng={pickupLatLng} deliveryLatLng={deliveryLatLng}
                  nearestDriver={nearestDriver} bookingProcessing={bookingProcessing}
                  onReset={() => { setQuote(null); setPickup(''); setDelivery(''); setPickupLatLng(null); setDeliveryLatLng(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  onConfirm={handleBooking} user={user} resultRef={resultRef}
                />
              )}
            </div>
          )}

          {(pickup || delivery || quote) && (
            <div className="flex justify-center pt-8">
              <button
                onClick={() => { setPickup(''); setDelivery(''); setQuote(null); setPickupLatLng(null); setDeliveryLatLng(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="flex items-center gap-2 text-slate-400 hover:text-rose-500 transition-colors text-sm font-bold"
              >
                <Trash2 size={16} /> 入力内容をすべてクリア
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuickQuote;