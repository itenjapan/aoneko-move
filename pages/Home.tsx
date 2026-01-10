import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, MapPin, CreditCard, ArrowRight, Box, Maximize2, Check, Star, Truck } from 'lucide-react';
import { VEHICLES, PLANS } from '../constants';

const Home: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-hero-glow z-0 opacity-60"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-24 lg:py-40 text-center">
          <div className="max-w-5xl mx-auto flex flex-col items-center">
            <div className="inline-block px-6 py-2 rounded-full glass border border-brand-100 shadow-sm mb-10 animate-fade-in-up">
              <span className="text-brand-600 font-bold text-sm tracking-widest uppercase">次世代の配送体験へ</span>
            </div>
            <h1 className="text-6xl lg:text-8xl font-bold leading-tight mb-6 text-slate-900 tracking-tight">
              想いを運ぶ、<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-brand-600">もっと自由に。</span>
            </h1>
            <div className="text-5xl lg:text-7xl font-extrabold mb-10 tracking-wider">
              <span className="text-slate-900">Aoneko</span> <span className="text-brand-500">Move</span>
            </div>
            <p className="text-xl text-slate-600 mb-12 leading-relaxed font-light max-w-2xl mx-auto">
              24時間365日、アプリひとつで即時手配。<br className="hidden md:block" />
              洗練されたUIと確かな品質で、あなたの大切な荷物をお届けします。
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link to="/quote" className="bg-slate-900 text-white px-12 py-5 rounded-2xl font-bold text-lg hover:bg-brand-600 transition-all flex items-center justify-center group shadow-lg shadow-slate-900/20">
                料金を確認・依頼 <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/tracking" className="bg-white text-slate-700 border border-slate-200 px-12 py-5 rounded-2xl font-bold text-lg hover:bg-slate-50 transition-all flex items-center justify-center shadow-sm">
                荷物を追跡
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">Aoneko Quality</h2>
            <p className="text-slate-500 max-w-2xl mx-auto font-light text-lg">スピード、透明性、そして信頼。すべてをシンプルに。</p>
          </div>
          <div className="grid md:grid-cols-3 gap-10">
            {[
              { icon: Clock, title: "即時マッチング", text: "AIが最適なドライバーを瞬時に選定。急な配送依頼にもスマートに対応します。", color: "text-brand-500" },
              { icon: CreditCard, title: "クリアな料金体系", text: "距離と車両タイプに基づいた透明性の高い料金。隠れたコストはありません。", color: "text-emerald-500" },
              { icon: MapPin, title: "リアルタイム追跡", text: "GPS追跡により、荷物の現在地を可視化。到着予測も正確にお知らせします。", color: "text-violet-500" }
            ].map((f, i) => (
              <div key={i} className="bg-slate-50 p-10 rounded-[2.5rem] hover:bg-white hover:shadow-soft transition-all duration-300 border border-transparent hover:border-slate-100">
                <div className={`bg-white w-16 h-16 rounded-2xl flex items-center justify-center ${f.color} mb-8 shadow-sm`}>
                  <f.icon size={32} />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-slate-800">{f.title}</h3>
                <p className="text-slate-500 leading-relaxed font-light">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section className="py-24 bg-slate-50 border-y border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">人気の配送プラン</h2>
            <p className="text-slate-500 max-w-2xl mx-auto font-light text-lg">用途に合わせて選べる、お得な定額パッケージ</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {PLANS.map((plan) => (
              <div key={plan.id} className={`bg-white rounded-[2rem] p-8 shadow-sm border transition-all duration-300 flex flex-col relative ${plan.recommended ? 'border-brand-500 ring-4 ring-brand-50 shadow-xl scale-105 z-10' : 'border-slate-100 hover:border-brand-200'}`}>
                {plan.recommended && <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-brand-500 text-white px-5 py-1.5 rounded-full text-sm font-bold shadow-lg flex items-center gap-1.5"><Star size={14} fill="white" /> おすすめ</div>}
                <div className="mb-6"><h3 className="text-xl font-bold text-slate-800 mb-2">{plan.name}</h3><div className="flex items-baseline gap-1"><span className="text-3xl font-bold text-slate-900">{plan.price}</span><span className="text-slate-500 text-sm">目安</span></div></div>
                <p className="text-slate-500 text-sm mb-8 leading-relaxed flex-grow">{plan.description}</p>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-sm text-slate-700"><Check size={14} className="text-brand-500" />{feature}</li>
                  ))}
                </ul>
                <Link to="/quote" state={{ selectedVehicle: plan.id === 'furniture' ? 'keitruck' : 'keivan' }} className={`w-full py-4 rounded-xl font-bold text-center transition-all ${plan.recommended ? 'bg-brand-500 text-white hover:bg-brand-600 shadow-lg' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>プランを選択</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vehicle Types */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-16">
            <div><h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">選べる車両タイプ</h2><p className="text-slate-500 font-light text-lg">用途に合わせて最適な一台を。</p></div>
            <Link to="/quote" className="hidden md:flex text-brand-600 font-bold hover:underline items-center gap-1">すべての料金を見る <ArrowRight size={18} /></Link>
          </div>
          <div className="grid md:grid-cols-2 gap-10">
            {VEHICLES.map(vehicle => (
              <div key={vehicle.id} className="bg-slate-50 rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-200 hover:border-brand-300 hover:shadow-soft transition-all duration-500 group flex flex-col">
                <div className="p-10 flex justify-between items-start bg-white">
                  <div><h3 className="text-2xl font-bold text-slate-800">{vehicle.displayName.split('(')[0]}</h3><p className="text-slate-400 text-sm mt-1 font-bold">{vehicle.displayName.match(/\(([^)]+)\)/)?.[1] || vehicle.name}</p></div>
                  <div className="text-right"><span className="block text-4xl font-bold text-slate-800">¥{vehicle.basePrice.toLocaleString()}<span className="text-lg text-slate-400">~</span></span><span className="text-xs text-brand-700 font-bold bg-brand-100 px-3 py-1 rounded-full inline-block mt-2">基本料金</span></div>
                </div>
                <div className="flex-1 flex items-center justify-center py-10 bg-gradient-to-b from-white to-slate-50">
                  <img src={vehicle.image} alt={vehicle.name} className="w-64 h-44 object-contain transform group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-10 bg-white border-t border-slate-100">
                  <p className="text-slate-500 mb-8 leading-relaxed font-light text-sm">{vehicle.description}</p>
                  <Link to="/quote" state={{ selectedVehicle: vehicle.id }} className="block w-full py-4 rounded-xl border-2 border-slate-100 text-slate-600 font-bold text-center hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all duration-300">この車両で見積もり</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;