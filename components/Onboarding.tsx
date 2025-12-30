import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Truck, MapPin, Calculator, ShieldCheck, X, ChevronRight, ChevronLeft } from 'lucide-react';

interface Step {
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

const steps: Step[] = [
  {
    title: "Aoneko Moveへようこそ",
    description: "愛知・岐阜・三重エリアに特化した、新しい即配・引越しサービスです。アプリひとつで、あなたの「運びたい」を叶えます。",
    icon: Truck,
    color: "text-brand-500 bg-brand-50",
  },
  {
    title: "最短1分で即時見積もり",
    description: "距離と荷物量を入力するだけ。AIが最適な車両と料金を瞬時に計算します。電話での長いやり取りはもう必要ありません。",
    icon: Calculator,
    color: "text-indigo-500 bg-indigo-50",
  },
  {
    title: "リアルタイム追跡",
    description: "ドライバーの現在地をマップ上でリアルタイムに確認。集荷から配送完了まで、荷物の状況が手に取るようにわかります。",
    icon: MapPin,
    color: "text-orange-500 bg-orange-50",
  },
  {
    title: "安心・安全なプロ配送",
    description: "厳選されたプロのドライバーが、あなたの大切な荷物を丁寧に運びます。評価システムにより品質も担保されています。",
    icon: ShieldCheck,
    color: "text-emerald-500 bg-emerald-50",
  },
];

const Onboarding: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Check if onboarding has been seen
    const hasSeenOnboarding = localStorage.getItem('jpmove_onboarding_completed');
    
    // Only show on home page to avoid interrupting deep links (e.g. tracking urls)
    if (!hasSeenOnboarding && location.pathname === '/') {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setIsAnimating(true);
      // Fade out content before switching
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        setIsAnimating(false);
      }, 200); 
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(prev => prev - 1);
        setIsAnimating(false);
      }, 200);
    }
  };

  const handleComplete = () => {
    // Manually trigger exit animation style
    const modal = document.getElementById('onboarding-modal');
    if (modal) {
        modal.style.opacity = '0';
        modal.style.transform = 'scale(0.95)';
    }
    
    setTimeout(() => {
        localStorage.setItem('jpmove_onboarding_completed', 'true');
        setIsOpen(false);
    }, 300);
  };

  if (!isOpen) return null;

  const CurrentIcon = steps[currentStep].icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-500 animate-fade-in"
        onClick={handleComplete}
      />

      {/* Modal Card */}
      <div 
        id="onboarding-modal"
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden flex flex-col animate-fade-in-up border border-white/20 transition-all duration-300"
      >
        
        {/* Top Decorative Area */}
        <div className="bg-slate-50 p-8 flex justify-center items-center relative overflow-hidden h-48 transition-colors duration-500">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]"></div>
          
          {/* Animated Icon Circle */}
          <div 
            key={`icon-${currentStep}`}
            className={`w-24 h-24 rounded-full flex items-center justify-center shadow-sm transition-all duration-500 transform scale-100 animate-fade-in ${steps[currentStep].color}`}
          >
            <CurrentIcon size={48} strokeWidth={1.5} className="drop-shadow-sm" />
          </div>
        </div>

        {/* Content Area */}
        <div className="p-8 text-center flex-1 flex flex-col">
          <div className={`transition-opacity duration-200 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
                {steps[currentStep].title}
            </h2>
            <p className="text-slate-500 leading-relaxed text-sm mb-8 min-h-[80px]">
                {steps[currentStep].description}
            </p>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mb-8">
            {steps.map((_, index) => (
              <div 
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentStep ? 'w-8 bg-brand-500' : 'w-2 bg-slate-200'
                }`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="mt-auto flex gap-3">
             {currentStep > 0 ? (
               <button
                 onClick={handleBack}
                 className="px-6 py-3.5 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-colors"
               >
                 <ChevronLeft size={20} />
               </button>
             ) : (
                <button
                 onClick={handleComplete}
                 className="px-6 py-3.5 rounded-xl text-slate-400 font-bold hover:text-slate-600 transition-colors text-sm"
               >
                 スキップ
               </button>
             )}
             
            <button
              onClick={handleNext}
              className="flex-1 py-3.5 rounded-xl bg-slate-900 text-white font-bold shadow-lg shadow-slate-900/20 hover:bg-brand-600 hover:shadow-brand-500/30 transition-all flex items-center justify-center gap-2 group"
            >
              {currentStep === steps.length - 1 ? 'はじめる' : '次へ'}
              {currentStep < steps.length - 1 && <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />}
            </button>
          </div>
        </div>

        {/* Close Button Top Right */}
        <button 
          onClick={handleComplete}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors z-20"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
};

export default Onboarding;