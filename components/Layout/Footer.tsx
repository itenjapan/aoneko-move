import React from 'react';
import { Truck, Shield, Clock, Heart, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Footer: React.FC = () => {
    const { t } = useTranslation();

    return (
        <footer className="bg-slate-950 text-slate-500 py-24 border-t border-white/5 relative overflow-hidden">
            {/* Subtle light effect */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-500/5 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-16 mb-20">

                    {/* Brand Section */}
                    <div className="md:col-span-5">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="bg-brand-500 text-white p-2.5 rounded-2xl shadow-lg shadow-brand-500/20">
                                <Truck size={22} />
                            </div>
                            <span className="text-white font-black text-3xl tracking-tighter">Aoneko Move</span>
                        </div>
                        <p className="text-sm leading-relaxed max-w-sm mb-10 text-slate-400 font-medium">
                            {t('footer.desc')}
                            <span className="block mt-2 opacity-60 font-normal italic">
                                {t('footer.tagline')}
                            </span>
                        </p>
                        <div className="flex gap-3">
                            <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-brand-500 hover:text-white hover:border-brand-500 transition-all duration-500 cursor-pointer group">
                                <Shield size={20} className="opacity-70 group-hover:opacity-100" />
                            </div>
                            <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-brand-500 hover:text-white hover:border-brand-500 transition-all duration-500 cursor-pointer group">
                                <Clock size={20} className="opacity-70 group-hover:opacity-100" />
                            </div>
                        </div>
                    </div>

                    {/* Navigation Section */}
                    <div className="md:col-span-3">
                        <h4 className="text-white font-bold mb-8 uppercase tracking-[0.3em] text-[10px] opacity-50">{t('footer.menu_title')}</h4>
                        <ul className="space-y-5 text-sm">
                            <li><a href="/quote" className="hover:text-brand-400 transition-all hover:translate-x-1 inline-block">{t('footer.quote', { defaultValue: t('nav.quote') })}</a></li>
                            <li><a href="/tracking" className="hover:text-brand-400 transition-all hover:translate-x-1 inline-block">{t('footer.tracking', { defaultValue: t('nav.tracking') })}</a></li>
                            <li><a href="/partner/register" className="hover:text-brand-400 transition-all hover:translate-x-1 inline-block text-slate-400 font-bold">{t('footer.partner_register', { defaultValue: t('nav.partner_register') })}</a></li>
                        </ul>
                    </div>

                    {/* Concierge/Contact Section */}
                    <div className="md:col-span-4 bg-white/5 p-8 rounded-[2.5rem] border border-white/10 backdrop-blur-sm self-start">
                        <h4 className="text-brand-400 font-bold mb-6 uppercase tracking-[0.3em] text-[10px]">{t('footer.contact_title')}</h4>
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">{t('footer.toll_free')}</span>
                            <a
                                href="tel:0120502622"
                                className="text-3xl font-black text-white hover:text-brand-400 transition-colors flex items-center gap-3 group"
                            >
                                <Phone size={24} className="text-brand-500 group-hover:scale-110 transition-transform" />
                                0120-502-622
                            </a>
                            <p className="text-[10px] text-slate-500 mt-4 leading-relaxed font-bold uppercase tracking-tighter">
                                {t('footer.hours')}<br />
                                {t('footer.help_text')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="flex flex-col gap-2">
                        <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-slate-600">
                            {t('footer.copyright')}
                        </p>
                    </div>

                    <div className="flex flex-col items-center md:items-end gap-3">
                        <div className="flex items-center gap-3 px-5 py-2 rounded-full bg-white/5 border border-white/5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            {t('footer.made_with')} <Heart size={12} className="text-rose-500 fill-rose-500 animate-pulse" /> {t('footer.in_japan')}
                        </div>
                        <div className="text-[10px] font-mono text-slate-700 opacity-40 hover:opacity-100 transition-opacity tracking-widest cursor-default">
                            Memoria del Puente
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

