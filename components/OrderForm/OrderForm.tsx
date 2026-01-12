import React from 'react';
import { MapPin, Calendar, Briefcase, CheckCircle } from 'lucide-react';
import AddressAutocompleteInput from './AddressAutocompleteInput';
import { LatLng } from '../../types/Order';
import { useTranslation } from 'react-i18next';

interface OrderFormProps {
    pickup: string;
    setPickup: (val: string) => void;
    delivery: string;
    setDelivery: (val: string) => void;
    setPickupLatLng: (latLng: LatLng | null) => void;
    setDeliveryLatLng: (latLng: LatLng | null) => void;
    date: string;
    setDate: (val: string) => void;
    time: string;
    setTime: (val: string) => void;
    boxes: number;
    setBoxes: (val: number) => void;
    suitcases: number;
    setSuitcases: (val: number) => void;
    useHighway: boolean;
    setUseHighway: (val: boolean) => void;
    helperService: boolean;
    setHelperService: (val: boolean) => void;
    handleQuickDateSelect: (type: 'today' | 'tomorrow' | 'weekend') => void;
}

const OrderForm: React.FC<OrderFormProps> = ({
    pickup, setPickup, delivery, setDelivery, setPickupLatLng, setDeliveryLatLng,
    date, setDate, time, setTime, boxes, setBoxes, suitcases, setSuitcases,
    useHighway, setUseHighway, helperService, setHelperService, handleQuickDateSelect
}) => {
    const { t } = useTranslation();

    return (
        <div className="space-y-8 animate-fade-in-up">
            {/* Addresses Section */}
            <div className="bg-white rounded-[2.5rem] shadow-sm p-8 md:p-10 border border-slate-100/60 hover:border-brand-200 transition-all duration-500">
                <h2 className="text-xl font-bold mb-10 flex items-center text-slate-800">
                    <span className="flex items-center justify-center w-10 h-10 rounded-2xl bg-brand-50 text-brand-600 mr-4 ring-4 ring-brand-50/50 shadow-sm">
                        <MapPin size={22} />
                    </span>
                    {t('quote.route.title')}
                </h2>
                <div className="space-y-10 relative">
                    <div className="absolute left-[1.5rem] top-12 bottom-12 w-0.5 bg-brand-100 z-0"></div>
                    <AddressAutocompleteInput label={t('quote.route.pickup')} value={pickup} onChange={setPickup} onSelectLatLng={setPickupLatLng} placeholder={t('quote.route.pickup_placeholder')} markerLabel="A" />
                    <AddressAutocompleteInput label={t('quote.route.destination')} value={delivery} onChange={setDelivery} onSelectLatLng={setDeliveryLatLng} placeholder={t('quote.route.destination_placeholder')} markerLabel="B" />
                </div>
            </div>

            {/* Date & Time Section */}
            <div className="bg-white rounded-[2.5rem] shadow-sm p-8 md:p-10 border border-slate-100/60 transition-all duration-500 hover:border-indigo-100">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <h2 className="text-xl font-bold flex items-center text-slate-800">
                        <span className="flex items-center justify-center w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 mr-4 ring-4 ring-indigo-50/50 shadow-sm">
                            <Calendar size={22} />
                        </span>
                        {t('quote.schedule.title')}
                    </h2>
                    <div className="flex gap-2">
                        <button onClick={() => handleQuickDateSelect('today')} className="px-4 py-2 rounded-xl text-[10px] font-black bg-slate-50 text-slate-500 hover:bg-brand-500 hover:text-white transition-all border border-slate-100 active:scale-95 uppercase tracking-widest">{t('quote.schedule.today')}</button>
                        <button onClick={() => handleQuickDateSelect('tomorrow')} className="px-4 py-2 rounded-xl text-[10px] font-black bg-slate-50 text-slate-500 hover:bg-brand-500 hover:text-white transition-all border border-slate-100 active:scale-95 uppercase tracking-widest">{t('quote.schedule.tomorrow')}</button>
                        <button onClick={() => handleQuickDateSelect('weekend')} className="px-4 py-2 rounded-xl text-[10px] font-black bg-slate-50 text-slate-500 hover:bg-brand-500 hover:text-white transition-all border border-slate-100 active:scale-95 uppercase tracking-widest">{t('quote.schedule.weekend')}</button>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest pl-1">{t('quote.schedule.date')}</label>
                        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-brand-50 transition-all font-medium" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest pl-1">{t('quote.schedule.time')}</label>
                        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-brand-50 transition-all font-medium" />
                    </div>
                </div>
            </div>

            {/* Cargo & Options Section */}
            <div className="bg-white rounded-[2.5rem] shadow-sm p-8 md:p-10 border border-slate-100/60 transition-all duration-500 hover:border-orange-100">
                <h2 className="text-xl font-bold mb-8 flex items-center text-slate-800">
                    <span className="flex items-center justify-center w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 mr-4 ring-4 ring-orange-50/50 shadow-sm">
                        <Briefcase size={22} />
                    </span>
                    {t('quote.cargo.title')}
                </h2>
                <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 hover:bg-white transition-colors group">
                            <label className="block text-[10px] font-bold text-slate-400 mb-3 uppercase tracking-[0.2em]">{t('quote.cargo.boxes')}</label>
                            <div className="flex items-center gap-4">
                                <button onClick={() => setBoxes(Math.max(0, boxes - 1))} className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 font-bold">-</button>
                                <input type="number" min="0" value={boxes} onChange={(e) => setBoxes(Number(e.target.value))} className="flex-1 bg-transparent border-b-2 border-slate-200 focus:border-brand-400 outline-none text-center font-bold text-xl py-1" />
                                <button onClick={() => setBoxes(boxes + 1)} className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center hover:bg-brand-600 font-bold shadow-sm">+</button>
                            </div>
                        </div>
                        <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 hover:bg-white transition-colors group">
                            <label className="block text-[10px] font-bold text-slate-400 mb-3 uppercase tracking-[0.2em]">{t('quote.cargo.suitcases')}</label>
                            <div className="flex items-center gap-4">
                                <button onClick={() => setSuitcases(Math.max(0, suitcases - 1))} className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-100 font-bold">-</button>
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
                                <span className="block font-bold text-slate-800">{t('quote.cargo.highway')}</span>
                                <span className="block text-xs text-slate-500 mt-0.5">{t('quote.cargo.highway_desc')}</span>
                            </div>
                        </label>
                        <label className="flex items-center p-6 border-2 border-slate-100 rounded-3xl cursor-pointer hover:bg-brand-50 hover:border-brand-200 transition-all group">
                            <div className="relative flex items-center justify-center w-6 h-6 mr-4">
                                <input type="checkbox" checked={helperService} onChange={(e) => setHelperService(e.target.checked)} className="peer appearance-none w-6 h-6 border-2 border-slate-300 rounded-lg checked:bg-brand-500 checked:border-brand-500 transition-all" />
                                <CheckCircle size={14} className="absolute text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                            </div>
                            <div className="flex-1">
                                <span className="block font-bold text-slate-800">{t('quote.cargo.helper')} <span className="text-brand-600 ml-1">(+¥1,000)</span></span>
                                <span className="block text-xs text-slate-500 mt-0.5">{t('quote.cargo.helper_desc')}</span>
                            </div>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderForm;
