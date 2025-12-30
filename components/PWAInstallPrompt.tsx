import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsStandalone(true);
      return;
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Delay showing the prompt slightly
      setTimeout(() => {
        const dismissed = localStorage.getItem('pwaPromptDismissed');
        if (!dismissed) {
          setShowPrompt(true);
        }
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt' as any, handler);

    return () => {
      window.removeEventListener('beforeinstallprompt' as any, handler);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
        localStorage.setItem('pwaInstalled', 'true');
      }
      
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setDeferredPrompt(null);
    setShowPrompt(false);
    localStorage.setItem('pwaPromptDismissed', 'true');
    
    // Clear dismissal after 7 days
    setTimeout(() => {
      localStorage.removeItem('pwaPromptDismissed');
    }, 7 * 24 * 60 * 60 * 1000);
  };

  if (isStandalone || !showPrompt) return null;

  return (
    <div className="fixed inset-x-4 bottom-4 bg-white border border-gray-300 rounded-xl shadow-2xl p-4 z-50 max-w-md mx-auto animate-fade-in-up">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
          <span className="text-white text-xl">🚚</span>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 text-sm">JpMoveをインストール</h3>
          <p className="text-xs text-gray-600 mt-1 leading-relaxed">
            より快適にご利用いただけます。ホーム画面に追加してすぐにアクセス！
          </p>
          
          <div className="flex space-x-2 mt-3">
            {isIOS ? (
              <>
                <button
                  onClick={handleDismiss}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors"
                >
                  後で
                </button>
                <div className="flex-1 text-xs text-gray-500 flex items-center justify-center">
                   共有ボタン <span className="text-blue-600 mx-1">⎋</span> から「ホーム画面に追加」
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={handleDismiss}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors"
                >
                  後で
                </button>
                <button
                  onClick={handleInstall}
                  className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors shadow-sm"
                >
                  インストール
                </button>
              </>
            )}
          </div>
        </div>
        
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
        >
          <X size={16} className="text-gray-400" />
        </button>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;