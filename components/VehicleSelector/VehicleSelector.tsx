import React from 'react';
import { VEHICLES } from '../../constants';
import { CheckCircle, Box, Truck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface VehicleSelectorProps {
    selectedVehicle: string;
    onSelect: (id: string) => void;
    dbVehicles?: any[];
}

const VehicleSelector: React.FC<VehicleSelectorProps> = ({ selectedVehicle, onSelect, dbVehicles }) => {
    const { t } = useTranslation();

    return (
        <div className="bg-white rounded-[2.5rem] shadow-sm p-8 md:p-10 border border-slate-100/60 hover:border-brand-200 transition-all duration-500">
            <h2 className="text-xl font-bold mb-8 flex items-center text-slate-800">
                <span className="flex items-center justify-center w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 mr-4 ring-4 ring-emerald-50/50 shadow-sm">
                    <Truck size={22} />
                </span>
                {t('quote.vehicle.title')}
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
                {VEHICLES.map((vehicle) => {
                    const dbPrice = dbVehicles?.find(v => (v.id === 1 && vehicle.id === 'keitruck') || (v.id === 2 && vehicle.id === 'keivan'))?.base_price;
                    const displayPrice = dbPrice !== undefined ? dbPrice : vehicle.basePrice;

                    return (
                        <div
                            key={vehicle.id}
                            className={`rounded-3xl p-6 cursor-pointer transition-all duration-500 relative overflow-hidden group border-2 ${selectedVehicle === vehicle.id
                                ? 'bg-brand-50/40 border-brand-400 shadow-soft scale-[1.02]'
                                : 'bg-white border-slate-100 hover:border-brand-200'
                                }`}
                            onClick={() => onSelect(vehicle.id)}
                        >
                            {selectedVehicle === vehicle.id && (
                                <div className="absolute top-0 right-0 bg-brand-400 text-white p-2 rounded-bl-3xl z-20 animate-fade-in">
                                    <CheckCircle size={20} />
                                </div>
                            )}
                            <div className="flex items-start justify-between mb-4 relative z-10">
                                <div className="w-28 h-20 mr-2 flex-shrink-0 transition-transform group-hover:scale-110 duration-500">
                                    <img src={vehicle.image} alt={vehicle.name} className="w-full h-full object-contain" />
                                </div>
                                <div className="text-right">
                                    <p className={`font-black text-2xl tracking-tighter ${selectedVehicle === vehicle.id ? 'text-brand-600' : 'text-slate-900'}`}>
                                        ¥{displayPrice.toLocaleString()}
                                        <span className="text-sm font-normal">〜</span>
                                    </p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('quote.vehicle.base_fare')}</p>
                                </div>
                            </div>
                            <div className="mb-1">
                                <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-0.5">{t(`constants.vehicles.${vehicle.id}.name`)}</span>
                                <h3 className="font-bold text-slate-800 text-2xl tracking-tight">{t(`constants.vehicles.${vehicle.id}.displayName`)}</h3>
                            </div>
                            <div className="pt-3 border-t border-slate-200/50 text-xs text-slate-500 mt-2 flex items-center gap-2">
                                <Box size={14} className="text-brand-400" /> {t(`constants.vehicles.${vehicle.id}.description`)}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default VehicleSelector;
