import React, { ForwardedRef } from 'react';
import { QuoteResponse } from '../../types/PricingResult';
import { Clock, Route, RefreshCw, ArrowRight } from 'lucide-react';
import { DeliveryMap } from '../Route';
import { generateRoute } from '../../services/liveTrackingService';
import { useTranslation } from 'react-i18next';

interface PriceBreakdownProps {
    quote: QuoteResponse;
    pickupLatLng: { lat: number; lng: number } | null;
    deliveryLatLng: { lat: number; lng: number } | null;
    nearestDriver: { lat: number; lng: number } | undefined;
    bookingProcessing: boolean;
    onReset: () => void;
    onConfirm: () => void;
    user: any;
    resultRef?: ForwardedRef<HTMLDivElement>;
}

const PriceBreakdown: React.FC<PriceBreakdownProps> = ({
    quote, pickupLatLng, deliveryLatLng, nearestDriver,
    bookingProcessing, onReset, onConfirm, user, resultRef
}) => {
    const { t } = useTranslation();

    return (
        <div ref={resultRef} className="bg-slate-900 text-white rounded-[3rem] p-8 md:p-12 shadow-2xl animate-fade-in-up border border-white/5 overflow-hidden mt-12 relative sacred-glow">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-[100px] pointer-events-none"></div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6 relative z-10">
                <div>
                    <h3 className="text-3xl font-black tracking-tight mb-2">{t('quote.result.title')}</h3>
                    <p className="text-slate-400 text-sm font-medium">{t('quote.result.subtitle')}</p>
                </div>
                <div className="flex flex-wrap gap-3 relative z-10">
                    <span className="text-xs bg-white/5 px-4 py-2 rounded-xl flex items-center gap-2 border border-white/10 font-bold">
                        <Clock size={14} className="text-brand-400" /> {t('quote.result.time', { time: quote.estimatedTime })}
                    </span>
                    <span className="text-xs bg-white/5 px-4 py-2 rounded-xl flex items-center gap-2 border border-white/10 font-bold">
                        <Route size={14} className="text-blue-400" /> {t('quote.result.distance', { dist: quote.estimatedDistance })}
                    </span>
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
                            <div className="w-2 hidden md:block h-2 rounded-full bg-brand-400"></div>
                            <span className="text-[10px] font-bold text-brand-300 uppercase tracking-widest whitespace-nowrap">{t('quote.result.nearby_drivers')}</span>
                        </div>
                    )}
                </div>

                <div className="flex flex-col h-full">
                    <div className="space-y-4 mb-10 flex-1 relative z-10">
                        <div className="flex justify-between py-3 border-b border-white/5 group">
                            <span className="text-slate-400 font-medium group-hover:text-white transition-colors">{t('quote.result.service_fee')}</span>
                            <span className="font-mono text-xl font-bold">¥{(quote.startingPrice + quote.distancePrice).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between py-3 border-b border-white/5 group">
                            <span className="text-slate-400 font-medium group-hover:text-white transition-colors">+ {t('quote.result.toll_fee')}</span>
                            <span className="font-mono text-xl font-bold">¥{quote.tollFee.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between py-3 border-b border-white/5 group">
                            <span className="text-slate-400 font-medium group-hover:text-white transition-colors">+ {t('quote.result.cargo_fee')}</span>
                            <span className="font-mono text-xl font-bold">¥{(quote.helperFee + quote.cargoSurcharge + quote.timeSurchargeFee).toLocaleString()}</span>
                        </div>

                        <div className="pt-4 border-t border-white/20 mt-6">
                            <div className="flex justify-between py-2 text-slate-300">
                                <span className="font-bold">{t('quote.result.subtotal')}</span>
                                <span className="font-mono text-xl font-bold">¥{quote.subTotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between py-2 text-slate-400 italic">
                                <span>+ {t('quote.result.tax')}</span>
                                <span className="font-mono text-lg">¥{quote.tax.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mb-10 p-7 rounded-[2.5rem] bg-brand-500/10 border border-brand-500/20 backdrop-blur-md relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-r from-brand-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <h4 className="text-[10px] font-black text-brand-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                            {t('quote.result.for_driver')}
                        </h4>
                        <div className="grid grid-cols-2 gap-6 relative z-10">
                            <div>
                                <p className="text-[9px] text-slate-500 font-bold uppercase mb-2 tracking-widest">{t('quote.result.company_profit')}</p>
                                <p className="text-2xl font-black text-slate-300">¥{quote.companyRevenue.toLocaleString()}</p>
                            </div>
                            <div className="border-l border-white/10 pl-6">
                                <p className="text-[9px] text-brand-400 font-bold uppercase mb-2 tracking-widest">{t('quote.result.driver_fee')}</p>
                                <p className="text-2xl font-black text-white">¥{quote.driverRevenue.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/5 p-10 rounded-[2.5rem] border border-white/10 mb-10 shadow-inner">
                        <div className="flex justify-between items-baseline">
                            <span className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">{t('quote.result.total')}</span>
                            <span className="text-6xl font-black text-brand-500 tracking-tighter">¥{quote.totalCustomerPrice.toLocaleString()}</span>
                        </div>
                        <p className="text-[10px] text-right text-slate-500 mt-2 font-bold uppercase tracking-widest">{t('quote.result.tax_inc')}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <button onClick={onReset} className="sm:col-span-1 bg-white/5 py-4 rounded-2xl font-bold border border-white/10 flex items-center justify-center gap-2 hover:bg-white/10 transition-colors">
                            <RefreshCw size={18} /> <span className="sm:hidden lg:inline">{t('quote.result.reset')}</span>
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={bookingProcessing}
                            className="sm:col-span-2 bg-brand-500 text-white py-5 rounded-2xl font-black text-lg hover:bg-brand-400 shadow-xl shadow-brand-500/20 flex items-center justify-center gap-2 transform active:scale-[0.98] transition-all"
                        >
                            {bookingProcessing ? t('quote.result.processing') : (user ? t('quote.result.confirm') : t('quote.result.login_to_book'))}
                            <ArrowRight size={22} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PriceBreakdown;
