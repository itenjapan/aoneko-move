import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[60] animate-fade-in-up">
      <div className="glass-dark px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-amber-500/30">
        <div className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
        </div>
        <WifiOff size={18} className="text-amber-400" />
        <span className="text-white text-sm font-bold tracking-tight">
          オフラインモード - 地域データを表示中
        </span>
      </div>
    </div>
  );
};

export default OfflineIndicator;