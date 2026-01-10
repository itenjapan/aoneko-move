import React from 'react';
import { Truck, Shield, Clock, Heart } from 'lucide-react';

const Footer: React.FC = () => {
    return (
        <footer className="bg-slate-950 text-slate-400 py-20 border-t border-white/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-brand-500 text-white p-2 rounded-xl">
                                <Truck size={20} />
                            </div>
                            <span className="text-white font-black text-2xl tracking-tighter">Aoneko Move</span>
                        </div>
                        <p className="text-sm leading-relaxed max-w-sm mb-8">
                            愛知・岐阜・三重エリアを中心に、24時間365日常に最適な配送ソリューションを提供します。
                            デジタルの力で、物流をより透明に、より身近に。
                        </p>
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-brand-500 hover:text-white transition-all cursor-pointer">
                                <Shield size={18} />
                            </div>
                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-brand-500 hover:text-white transition-all cursor-pointer">
                                <Clock size={18} />
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-white font-bold mb-6 uppercase tracking-widest text-xs">サービス</h4>
                        <ul className="space-y-4 text-sm">
                            <li><a href="/quote" className="hover:text-brand-400 transition-colors">即時見積もり</a></li>
                            <li><a href="/tracking" className="hover:text-brand-400 transition-colors">荷物追跡</a></li>
                            <li><a href="/partner/register" className="hover:text-brand-400 transition-colors">ドライバー募集</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-bold mb-6 uppercase tracking-widest text-xs">会社情報</h4>
                        <ul className="space-y-4 text-sm">
                            <li><a href="#" className="hover:text-brand-400 transition-colors">利用規約</a></li>
                            <li><a href="#" className="hover:text-brand-400 transition-colors">プライバシーポリシー</a></li>
                            <li><a href="#" className="hover:text-brand-400 transition-colors">特定商取引法に基づく表記</a></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-xs uppercase tracking-widest font-bold">
                        © 2026 Aoneko Move. All rights reserved.
                    </p>
                    <div className="flex flex-col items-center md:items-end gap-2">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-tighter text-slate-500">
                            Made with <Heart size={10} className="text-rose-500 fill-rose-500" /> in Japan
                        </div>
                        <div className="text-[9px] font-mono text-slate-600 opacity-50 hover:opacity-100 transition-opacity">
                            Pacheco × Deep × Antigravity | Memoria del Puente
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
