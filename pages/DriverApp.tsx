import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { mockStore } from '../services/mockDb';
import { Delivery, LatLng } from '../types/Order';
import { Driver } from '../types/User';
import { MapPin, Package, Navigation, Truck, ArrowLeft, Loader2, CheckCircle, WifiOff, Clock, User as UserIcon, Save, Settings, AlertTriangle, History, CloudOff, RefreshCw, Bell, MessageCircle, DollarSign, TrendingUp, Calendar, Power, Star, ChevronRight, ChevronDown, ChevronUp, Receipt } from 'lucide-react';
import { DeliveryMap } from '../components/Route';
import { generateRoute as createMockRoute } from '../services/liveTrackingService';
import { useAuth } from '../contexts/AuthContext';
import { OfflineQueue } from '../services/offlineQueue';
import { PushNotificationService } from '../services/pushNotificationService';
import { ChatInterface } from '../components/Chat';

type ViewMode = 'dashboard' | 'earnings' | 'history' | 'profile';

const DriverApp: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [isOnline, setIsOnline] = useState(false);
  const [availableJobs, setAvailableJobs] = useState<Delivery[]>([]);
  const [activeJob, setActiveJob] = useState<Delivery | null>(null);
  const [completedJobs, setCompletedJobs] = useState<Delivery[]>([]);
  const [driverCurrentLocation, setDriverCurrentLocation] = useState<LatLng | undefined>(undefined);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
  const watchId = useRef<number | null>(null);

  // Notification State
  const prevAvailableJobIds = useRef<Set<string>>(new Set());
  const isFirstLoad = useRef(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(Notification.permission === 'granted');

  const [isNetworkOnline, setIsNetworkOnline] = useState(navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Confirmation Modal State
  const [confirmAction, setConfirmAction] = useState<{
    type: 'pickup_start' | 'pickup_complete' | 'delivery_complete';
    title: string;
    message: string;
    actionLabel: string;
    isDestructive?: boolean;
  } | null>(null);

  // Chat State
  const [showChat, setShowChat] = useState(false);

  // Profile Edit States
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editVehicleType, setEditVehicleType] = useState('keivan');
  const [editLicensePlate, setEditLicensePlate] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');

  // Authentication handled by ProtectedRoute
  const driver = user as unknown as Driver;

  const driverDisplay = driver ? {
    ...driver,
    vehicleType: (driver as any).vehicleType || 'keivan',
    licensePlate: (driver as any).licensePlate || '登録なし',
  } : null;

  // Initialize local states from user profile
  useEffect(() => {
    if (driverDisplay) {
      setEditName(driverDisplay.name);
      setEditPhone(driverDisplay.phone || '');
      setEditVehicleType(driverDisplay.vehicleType);
      setEditLicensePlate(driverDisplay.licensePlate);

      // Sync online status from profile on load
      if (isFirstLoad.current) {
        setIsOnline(!!driverDisplay.isOnline);
      }
    }
  }, [driverDisplay?.id]);

  // Monitor Network Status & Queue
  useEffect(() => {
    const handleOnline = () => setIsNetworkOnline(true);
    const handleOffline = () => setIsNetworkOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    setPendingSyncCount(OfflineQueue.getQueue().length);
    PushNotificationService.initialize().then(granted => setNotificationsEnabled(granted));

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync when coming back online
  useEffect(() => {
    if (isNetworkOnline && pendingSyncCount > 0 && !isSyncing) {
      const syncData = async () => {
        setIsSyncing(true);
        try {
          await OfflineQueue.process();
          setPendingSyncCount(0);
          if (driver) {
            setTotalEarnings(mockStore.getDriverEarnings(driver.id));
          }
        } catch (e) {
          console.error("Sync failed", e);
        } finally {
          setIsSyncing(false);
        }
      };
      syncData();
    }
  }, [isNetworkOnline, pendingSyncCount, driver, isSyncing]);


  // --- Geolocation setup ---
  const startGeolocationWatch = useCallback(() => {
    if (!driver) return;

    if ('geolocation' in navigator) {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
      watchId.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newLocation = { lat: latitude, lng: longitude };
          setDriverCurrentLocation(newLocation);

          if (activeJob?.trackingNumber && isNetworkOnline) {
            mockStore.setDriverLiveLocation(activeJob.trackingNumber, newLocation);
          }
        },
        (error) => {
          console.warn('Geolocation error:', error);
          if (!driverCurrentLocation) {
            setDriverCurrentLocation(mockStore.getDriverLocationById(driver.id) || { lat: 35.1815, lng: 136.9064 });
          }
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
    } else {
      console.warn('Geolocation is not supported.');
      if (!driverCurrentLocation) {
        setDriverCurrentLocation(mockStore.getDriverLocationById(driver.id) || { lat: 35.1815, lng: 136.9064 });
      }
    }
  }, [activeJob, driverCurrentLocation, driver, isNetworkOnline]);

  const stopGeolocationWatch = useCallback(() => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
  }, []);

  useEffect(() => {
    if (isOnline) {
      startGeolocationWatch();
    } else {
      stopGeolocationWatch();
    }
    return () => {
      stopGeolocationWatch();
    };
  }, [isOnline, startGeolocationWatch, stopGeolocationWatch]);


  // --- Job fetching and earnings update ---
  const fetchDriverData = useCallback(() => {
    if (!driver) return;

    const currentActiveJob = mockStore.deliveries.find(d =>
      d.driverId === driver.id &&
      ['accepted', 'pickup_in_progress', 'in_transit'].includes(d.status)
    );

    setActiveJob(currentActiveJob || null);

    if (currentActiveJob && !isOnline) {
      setIsOnline(true);
    }

    if (currentActiveJob) {
      const lastKnownLoc = mockStore.getDriverLiveLocation(currentActiveJob.trackingNumber);
      if (lastKnownLoc) setDriverCurrentLocation(lastKnownLoc);
    }

    if (!currentActiveJob) {
      const newAvailableJobs = mockStore.getAvailableJobs();
      setAvailableJobs(newAvailableJobs);

      if (!isFirstLoad.current && isOnline) {
        newAvailableJobs.forEach(job => {
          if (!prevAvailableJobIds.current.has(job.id)) {
            PushNotificationService.notifyNewDeliveryRequest(
              job.pickup.address,
              job.price.total,
              job.id
            );
          }
        });
      }
      prevAvailableJobIds.current = new Set(newAvailableJobs.map(j => j.id));
    } else {
      setAvailableJobs([]);
      prevAvailableJobIds.current.clear();
    }

    if (isFirstLoad.current) isFirstLoad.current = false;

    const history = mockStore.deliveries.filter(d =>
      d.driverId === driver.id && d.status === 'delivered'
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setCompletedJobs(history);

    setTotalEarnings(mockStore.getDriverEarnings(driver.id));
  }, [driver, isOnline]);

  useEffect(() => {
    if (!driver) return;
    fetchDriverData();
    const jobPollingInterval = setInterval(() => {
      if (driver && isNetworkOnline) {
        fetchDriverData();
      }
    }, 5000);

    return () => {
      clearInterval(jobPollingInterval);
    };
  }, [driver, isOnline, isNetworkOnline, fetchDriverData]);

  const handleManualRefresh = () => {
    setIsSyncing(true);
    fetchDriverData();
    setTimeout(() => setIsSyncing(false), 500);
  };

  const handleToggleStatus = async () => {
    if (isUpdatingStatus) return;
    setIsUpdatingStatus(true);
    const newStatus = !isOnline;
    setIsOnline(newStatus);
    try {
      await updateProfile({ isOnline: newStatus });
    } catch (e) {
      console.error("Failed to update status", e);
      setIsOnline(!newStatus);
      alert('ステータスの更新に失敗しました。');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleRequestPermissions = async () => {
    const granted = await PushNotificationService.initialize();
    setNotificationsEnabled(granted);
  };

  const handleAcceptJob = (jobId: string) => {
    if (!driver) return;
    const jobToAccept = availableJobs.find(j => j.id === jobId);
    if (jobToAccept) {
      setAvailableJobs(prev => prev.filter(j => j.id !== jobId));
      const optimisticActiveJob: Delivery = { ...jobToAccept, status: 'accepted', driverId: driver.id };
      setActiveJob(optimisticActiveJob);
    }
    if (isNetworkOnline) {
      setTimeout(() => {
        const result = mockStore.acceptJob(jobId, driver.id);
        if (result) {
          setActiveJob(result);
        } else {
          fetchDriverData();
          alert('申し訳ありません、この案件は既に他のドライバーが受注しました。');
        }
      }, 100);
    } else {
      if (jobToAccept) {
        OfflineQueue.add('ACCEPT_JOB', { deliveryId: jobId, driverId: driver.id });
        setPendingSyncCount(prev => prev + 1);
      }
    }
  };

  const handleStartPickup = () => {
    if (activeJob) {
      if (isNetworkOnline) {
        mockStore.updateDeliveryStatus(activeJob.trackingNumber, 'pickup_in_progress');
      } else {
        OfflineQueue.add('UPDATE_STATUS', { trackingNumber: activeJob.trackingNumber, status: 'pickup_in_progress' });
        setPendingSyncCount(prev => prev + 1);
      }
      setActiveJob(prev => prev ? { ...prev, status: 'pickup_in_progress' } : null);
    }
  };

  const handlePickupComplete = () => {
    if (activeJob) {
      if (isNetworkOnline) {
        mockStore.updateDeliveryStatus(activeJob.trackingNumber, 'in_transit');
      } else {
        OfflineQueue.add('UPDATE_STATUS', { trackingNumber: activeJob.trackingNumber, status: 'in_transit' });
        setPendingSyncCount(prev => prev + 1);
      }
      setActiveJob(prev => prev ? { ...prev, status: 'in_transit' } : null);
    }
  };

  const handleDeliveryComplete = () => {
    if (activeJob && driver) {
      const earningsAmount = Math.floor(activeJob.price.total * 0.85);
      if (isNetworkOnline) {
        mockStore.completeJob(activeJob.id);
        setTotalEarnings(prev => prev + earningsAmount);
      } else {
        OfflineQueue.add('COMPLETE_JOB', { deliveryId: activeJob.id });
        setPendingSyncCount(prev => prev + 1);
        setTotalEarnings(prev => prev + earningsAmount);
        setCompletedJobs(prev => [{ ...activeJob, status: 'delivered' }, ...prev]);
      }
      setActiveJob(null);
      stopGeolocationWatch();
      fetchDriverData();
    }
  };

  const handleLaunchNav = () => {
    if (!activeJob) return;
    const destination = activeJob.status === 'in_transit' ? activeJob.delivery.address : activeJob.pickup.address;
    const encodedDest = encodeURIComponent(destination);
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = `geo:0,0?q=${encodedDest}`;
    } else {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodedDest}`, '_blank');
    }
  };

  const promptStartPickup = () => {
    setConfirmAction({
      type: 'pickup_start',
      title: '集荷に向かいますか？',
      message: 'お客様に「ドライバーが集荷に向かっています」と通知されます。',
      actionLabel: '向かう'
    });
  };

  const promptPickupComplete = () => {
    setConfirmAction({
      type: 'pickup_complete',
      title: '集荷を完了しますか？',
      message: '荷物の積載が完了し、配送先へ向かう準備ができましたか？',
      actionLabel: '完了して配送へ'
    });
  };

  const promptDeliveryComplete = () => {
    setConfirmAction({
      type: 'delivery_complete',
      title: '配送を完了しますか？',
      message: 'この操作を行うと配送完了となり、売上が確定します。この操作は取り消せません。',
      actionLabel: '配送完了',
      isDestructive: false
    });
  };

  const executeConfirmAction = () => {
    if (!confirmAction) return;
    switch (confirmAction.type) {
      case 'pickup_start': handleStartPickup(); break;
      case 'pickup_complete': handlePickupComplete(); break;
      case 'delivery_complete': handleDeliveryComplete(); break;
    }
    setConfirmAction(null);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileMessage('');
    try {
      await updateProfile({
        name: editName,
        phone: editPhone,
        vehicleType: editVehicleType as 'keivan' | 'keitruck',
        licensePlate: editLicensePlate
      });
      setProfileMessage('プロフィールを更新しました');
      setTimeout(() => setProfileMessage(''), 3000);
    } catch (error) {
      setProfileMessage('更新に失敗しました');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleExit = () => {
    stopGeolocationWatch();
    setIsOnline(false);
    navigate('/');
  };

  const currentNavigationRoute = useMemo(() => {
    if (!activeJob || !driverCurrentLocation) return undefined;
    const { status, pickup, delivery } = activeJob;
    let startPoint: LatLng | null = null;
    let endPoint: LatLng | null = null;

    if (status === 'accepted' || status === 'pickup_in_progress') {
      startPoint = driverCurrentLocation;
      endPoint = pickup.latLng;
    } else if (status === 'in_transit') {
      startPoint = driverCurrentLocation;
      endPoint = delivery.latLng;
    }

    if (startPoint && endPoint) return createMockRoute(startPoint, endPoint, 30);
    return undefined;
  }, [activeJob, driverCurrentLocation]);

  const todayEarnings = useMemo(() => {
    const today = new Date().toDateString();
    return completedJobs.filter(j => new Date(j.createdAt).toDateString() === today)
      .reduce((acc, job) => acc + Math.floor(job.price.total * 0.85), 0);
  }, [completedJobs]);

  const weekEarnings = useMemo(() => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return completedJobs.filter(j => new Date(j.createdAt) >= oneWeekAgo)
      .reduce((acc, job) => acc + Math.floor(job.price.total * 0.85), 0);
  }, [completedJobs]);


  if (!driverDisplay) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Loader2 size={32} className="animate-spin text-brand-600 mr-2" />
      <span className="text-slate-700">プロファイルを読み込み中...</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 pb-20 relative">
      {showChat && activeJob && (
        <ChatInterface
          deliveryId={activeJob.id}
          currentUser={driver}
          recipientName="お客様"
          onClose={() => setShowChat(false)}
        />
      )}

      {confirmAction && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl transform transition-all scale-100 border border-slate-100">
            <div className="mb-4">
              <div className="w-12 h-12 rounded-full bg-brand-50 text-brand-500 flex items-center justify-center mb-4">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">{confirmAction.title}</h3>
              <p className="text-slate-500 leading-relaxed">{confirmAction.message}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmAction(null)} className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors">キャンセル</button>
              <button onClick={executeConfirmAction} className={`flex-1 py-3 text-white rounded-xl font-bold shadow-lg transition-all transform active:scale-95 ${confirmAction.isDestructive ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/30' : 'bg-brand-600 hover:bg-brand-700 shadow-brand-500/30'}`}>{confirmAction.actionLabel}</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-slate-800 text-white p-4 shadow-md sticky top-0 z-50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button onClick={handleExit} className="p-2 -ml-2 rounded-full hover:bg-slate-700 transition-colors text-slate-300 hover:text-white"><ArrowLeft size={24} /></button>
            <h1 className="font-bold text-lg tracking-wide">ドライバー画面</h1>
          </div>

          <div className="flex bg-slate-700 rounded-lg p-1 overflow-x-auto max-w-full">
            <button onClick={() => setViewMode('dashboard')} className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all whitespace-nowrap ${viewMode === 'dashboard' ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}>配送</button>
            <button onClick={() => setViewMode('history')} className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 whitespace-nowrap ${viewMode === 'history' ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}><History size={10} /> 履歴</button>
            <button onClick={() => setViewMode('earnings')} className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 whitespace-nowrap ${viewMode === 'earnings' ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}><DollarSign size={10} /> 売上</button>
            <button onClick={() => setViewMode('profile')} className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 whitespace-nowrap ${viewMode === 'profile' ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}><Settings size={10} /> 設定</button>
          </div>
        </div>

        <div className="flex justify-between items-end mb-6 relative">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <p className="text-2xl font-bold text-white">{driverDisplay.name}</p>
              <div className="flex items-center bg-slate-700/50 backdrop-blur-md px-2 py-0.5 rounded-lg border border-slate-600/50 shadow-sm">
                <Star size={12} className="text-amber-400 fill-amber-400 mr-1" />
                <span className="text-amber-100 font-bold text-xs">{driverDisplay.rating.toFixed(1)}</span>
              </div>
            </div>
            <p className="text-sm text-slate-400 font-light mt-1 flex items-center gap-2">
              <span>{driverDisplay.vehicleType === 'keivan' ? '軽バン' : '軽トラック'} • {driverDisplay.licensePlate}</span>
              {isOnline ? (
                <span className="flex items-center text-green-400 font-bold text-xs bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 mr-1.5 animate-pulse"></span>稼働中
                </span>
              ) : (
                <span className="flex items-center text-slate-500 font-bold text-xs bg-slate-700 px-2 py-0.5 rounded border border-slate-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500 mr-1.5"></span>停止中
                </span>
              )}
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end gap-2">
              <div className="text-3xl font-bold text-brand-400">¥{totalEarnings.toLocaleString()}</div>
              <button onClick={handleManualRefresh} className={`p-1.5 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white transition-colors ${isSyncing ? 'animate-spin text-brand-400' : ''}`}><RefreshCw size={16} /></button>
            </div>
            <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">累計売上</div>
          </div>
        </div>

        {viewMode === 'dashboard' && (
          <div className="flex items-center justify-between bg-slate-900/40 backdrop-blur-md border border-slate-600/50 p-4 rounded-2xl transition-all shadow-inner">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-full shadow-sm ${isOnline ? 'bg-green-500 text-white' : 'bg-slate-700 text-slate-400'}`}><Power size={20} /></div>
              <div>
                <span className={`block text-base font-bold leading-tight ${isOnline ? 'text-green-400' : 'text-slate-200'}`}>{isOnline ? 'オンライン' : 'オフライン'}</span>
                <span className="text-[11px] text-slate-400 font-medium">{isOnline ? '配車リクエスト受付中' : '稼働を停止しています'}</span>
              </div>
            </div>
            <button onClick={handleToggleStatus} disabled={isUpdatingStatus} className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md active:scale-95 flex items-center gap-2 ${isOnline ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20' : 'bg-green-500 text-white hover:bg-green-600 shadow-green-500/20'} ${isUpdatingStatus ? 'opacity-50 cursor-not-allowed' : ''}`}>{isUpdatingStatus ? <Loader2 size={16} className="animate-spin" /> : (isOnline ? 'Go Offline' : 'Go Online')}</button>
          </div>
        )}
      </div>

      {viewMode === 'dashboard' ? (
        <div className="p-4 max-w-lg mx-auto">
          {!isNetworkOnline && (
            <div className="mb-4 p-3 bg-amber-100 text-amber-800 rounded-xl flex items-center justify-between text-sm border border-amber-200 shadow-sm">
              <div className="flex items-center gap-2"><CloudOff size={18} /><span className="font-bold">オフラインモード</span></div>
              {pendingSyncCount > 0 && <span className="bg-amber-200 px-2 py-1 rounded-md text-xs font-bold">未送信: {pendingSyncCount}件</span>}
            </div>
          )}
          {isNetworkOnline && isSyncing && (
            <div className="mb-4 p-3 bg-blue-100 text-blue-800 rounded-xl flex items-center justify-center text-sm border border-blue-200 shadow-sm animate-pulse">
              <RefreshCw size={18} className="animate-spin mr-2" /><span className="font-bold">データを同期中...</span>
            </div>
          )}

          {activeJob && (
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border-l-4 border-green-500 animate-fade-in-up">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800">配送中</h2>
                <div className="flex items-center gap-2">
                  <button onClick={() => setShowChat(true)} className="bg-brand-50 text-brand-600 p-2 rounded-full hover:bg-brand-100 transition-colors"><MessageCircle size={20} /></button>
                  <span className="bg-green-100 text-green-800 text-xs px-3 py-1.5 rounded-full font-bold uppercase tracking-wide">{activeJob.status.replace(/_/g, ' ')}</span>
                </div>
              </div>

              <div className="mb-6 relative group/map">
                {driverCurrentLocation && activeJob.pickup.latLng && activeJob.delivery.latLng ? (
                  <>
                    <DeliveryMap pickupLatLng={activeJob.pickup.latLng} deliveryLatLng={activeJob.delivery.latLng} driverLatLng={driverCurrentLocation} currentStatus={activeJob.status} estimatedRoute={currentNavigationRoute} />
                    <button onClick={handleLaunchNav} className="absolute top-4 right-4 bg-white/90 backdrop-blur-md p-3 rounded-full shadow-lg border border-slate-200 text-brand-600 hover:bg-brand-500 hover:text-white transition-all transform hover:scale-110 active:scale-95 z-10 flex items-center justify-center" title="Google Mapsで開く"><Navigation size={22} /></button>
                  </>
                ) : (
                  <div className="w-full h-64 bg-slate-50 rounded-xl flex flex-col items-center justify-center border border-slate-200">
                    <Loader2 size={32} className="text-brand-500 animate-spin mb-2" />
                    <p className="text-slate-500 text-sm font-bold">位置情報を取得中...</p>
                  </div>
                )}
              </div>

              <div className="space-y-6 mb-8 relative pl-3">
                <div className="absolute left-[1.05rem] top-3 bottom-8 w-0.5 bg-slate-200"></div>
                <div className="flex items-start relative z-10">
                  <div className="w-9 h-9 rounded-full bg-blue-50 border-2 border-blue-100 flex items-center justify-center text-blue-600 mr-4 flex-shrink-0 shadow-sm"><MapPin size={18} /></div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Pickup</p>
                    <p className="font-bold text-slate-800 text-lg">{activeJob.pickup.address}</p>
                  </div>
                </div>
                <div className="flex items-start relative z-10">
                  <div className="w-9 h-9 rounded-full bg-orange-50 border-2 border-orange-100 flex items-center justify-center text-orange-600 mr-4 flex-shrink-0 shadow-sm"><MapPin size={18} /></div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Drop-off</p>
                    <p className="font-bold text-slate-800 text-lg">{activeJob.delivery.address}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button onClick={handleLaunchNav} className="flex-1 bg-slate-100 text-slate-700 py-4 rounded-xl font-bold flex items-center justify-center hover:bg-slate-200 transition-colors"><Navigation size={20} className="mr-2" /> ナビ起動 (外部アプリ)</button>
                {activeJob.status === 'accepted' && <button onClick={promptStartPickup} className="flex-1 bg-brand-600 text-white py-4 rounded-xl font-bold hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/20"><Truck size={20} className="mr-2" /> 集荷に向かう</button>}
                {activeJob.status === 'pickup_in_progress' && <button onClick={promptPickupComplete} className="flex-1 bg-brand-600 text-white py-4 rounded-xl font-bold hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/20"><CheckCircle size={20} className="mr-2" /> 集荷完了</button>}
                {activeJob.status === 'in_transit' && <button onClick={promptDeliveryComplete} className="flex-1 bg-green-600 text-white py-4 rounded-xl font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-500/20"><CheckCircle size={20} className="mr-2" /> 配送完了</button>}
              </div>
            </div>
          )}

          {!activeJob && isOnline && (
            <>
              <h2 className="text-slate-500 text-sm font-bold mb-4 uppercase tracking-wider flex items-center justify-between"><span>近くの案件</span><span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs">{availableJobs.length}件</span></h2>
              <div className="space-y-4">
                {availableJobs.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-3xl shadow-sm border border-slate-100">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300"><Package size={32} /></div>
                    <p className="text-slate-400 font-medium">現在、近くに案件はありません。</p>
                    <div className="mt-4"><button onClick={handleManualRefresh} className="text-brand-600 text-sm font-bold flex items-center justify-center mx-auto hover:underline"><RefreshCw size={14} className="mr-1" /> 再読み込み</button></div>
                  </div>
                ) : (
                  availableJobs.map(job => (
                    <div key={job.id} className="bg-white rounded-2xl shadow-sm p-6 animate-fade-in-up border border-slate-100 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center bg-brand-50 text-brand-700 px-3 py-1 rounded-lg"><Clock size={16} className="mr-2" /><span className="font-bold text-sm">{job.estimatedTime}分</span></div>
                        <div className="text-xl font-bold text-slate-900">¥{Math.floor(job.price.total * 0.80).toLocaleString()}</div>
                      </div>
                      <div className="space-y-3 mb-6 pl-1">
                        <div className="flex items-center text-sm text-slate-600"><div className="w-2 h-2 rounded-full bg-blue-500 mr-3 ring-2 ring-blue-100"></div><span className="truncate font-medium">{job.pickup.address}</span></div>
                        <div className="flex items-center text-sm text-slate-600"><div className="w-2 h-2 rounded-full bg-orange-500 mr-3 ring-2 ring-orange-100"></div><span className="truncate font-medium">{job.delivery.address}</span></div>
                      </div>
                      <button onClick={() => handleAcceptJob(job.id)} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-brand-600 transition-all shadow-lg hover:shadow-brand-500/25 transform hover:-translate-y-0.5">案件を受ける</button>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {!isOnline && !activeJob && (
            <div className="text-center py-24 px-6">
              <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400 shadow-inner"><Truck size={48} /></div>
              <h3 className="text-2xl font-bold text-slate-700 mb-2">現在、車両は稼働停止中です</h3>
              <p className="text-slate-500 leading-relaxed">上部のボタンをタップして<br />「Go Online」で案件受付を開始してください</p>
              <button onClick={handleToggleStatus} className="mt-8 bg-green-500 text-white px-10 py-4 rounded-2xl font-bold shadow-lg shadow-green-500/20 hover:bg-green-600 transition-all transform active:scale-95">Go Online Now</button>
            </div>
          )}
        </div>
      ) : viewMode === 'history' ? (
        <div className="p-4 max-w-lg mx-auto animate-fade-in-up">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><History size={24} className="text-brand-500" />配送履歴一覧</h2>
          <div className="space-y-4">
            {completedJobs.length > 0 ? completedJobs.map(job => (
              <div
                key={job.id}
                className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100 hover:border-brand-100 transition-all group overflow-hidden cursor-pointer"
                onClick={() => setExpandedHistoryId(expandedHistoryId === job.id ? null : job.id)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded">#{job.trackingNumber}</span>
                    <p className="text-sm font-bold text-slate-800 mt-1">{new Date(job.createdAt).toLocaleDateString('ja-JP')} <span className="ml-2 font-normal text-slate-400">{new Date(job.createdAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-brand-600">¥{Math.floor(job.price.total * 0.80).toLocaleString()}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">報酬 (収益)</p>
                  </div>
                </div>

                <div className="relative pl-3 space-y-4 mb-4">
                  <div className="absolute left-[0.4rem] top-1.5 bottom-1.5 w-0.5 bg-slate-100 group-hover:bg-brand-50 transition-colors"></div>
                  <div className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0 ring-2 ring-blue-50"></div><p className="text-xs text-slate-600 truncate flex-1">{job.pickup.address}</p></div>
                  <div className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0 ring-2 ring-orange-50"></div><p className="text-xs text-slate-600 truncate flex-1">{job.delivery.address}</p></div>
                </div>

                {expandedHistoryId === job.id && job.price.breakdown && (
                  <div className="mt-4 pt-4 border-t border-slate-100 bg-slate-50/80 -mx-6 px-6 pb-4 animate-fade-in-up">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Receipt size={12} className="text-slate-400" /> 配送報酬明細 (税込)</h4>
                    <div className="space-y-2.5 text-xs font-medium">
                      <div className="flex justify-between text-slate-500"><span>基本料金</span><span className="font-mono text-slate-700">¥{job.price.breakdown.base.toLocaleString()}</span></div>
                      <div className="flex justify-between text-slate-500"><span>距離料金</span><span className="font-mono text-slate-700">¥{job.price.breakdown.distance.toLocaleString()}</span></div>
                      {job.price.breakdown.surcharges > 0 && (
                        <div className="flex justify-between text-slate-500"><span>加算料金 (荷物・時間)</span><span className="font-mono text-slate-700">¥{job.price.breakdown.surcharges.toLocaleString()}</span></div>
                      )}
                      {job.price.breakdown.tolls > 0 && (
                        <div className="flex justify-between text-slate-500"><span>高速道路利用料</span><span className="font-mono text-slate-700">¥{job.price.breakdown.tolls.toLocaleString()}</span></div>
                      )}
                      <div className="pt-2.5 border-t border-slate-200 flex justify-between font-bold text-slate-600"><span>合計売上金額</span><span className="font-mono text-slate-800">¥{job.price.total.toLocaleString()}</span></div>
                      <div className="flex justify-between font-bold text-rose-400"><span>プラットフォーム利用料 (20%)</span><span className="font-mono">- ¥{Math.ceil(job.price.total * 0.20).toLocaleString()}</span></div>
                      <div className="pt-2 bg-brand-50 -mx-4 px-4 py-3 rounded-xl flex justify-between font-extrabold text-brand-600 shadow-inner border border-brand-100/50"><span>最終受取報酬</span><span className="font-mono text-xl">¥{Math.floor(job.price.total * 0.80).toLocaleString()}</span></div>
                    </div>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded flex items-center gap-1"><CheckCircle size={10} /> 配送完了</span>
                    <span className="text-[10px] text-slate-400 font-bold">{job.vehicle.displayName.split('(')[0]}</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-400 text-[10px] font-bold group-hover:text-brand-500 transition-colors">
                    {expandedHistoryId === job.id ? '詳細を閉じる' : '内訳を表示'}
                    {expandedHistoryId === job.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300"><History size={32} strokeWidth={1.5} /></div>
                <p className="text-slate-400 font-medium">配送履歴はありません</p>
              </div>
            )}
          </div>
        </div>
      ) : viewMode === 'earnings' ? (
        <div className="p-4 max-w-lg mx-auto animate-fade-in-up">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><DollarSign size={24} className="text-brand-500" />収益サマリー</h2>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
              <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2 flex items-center gap-1"><TrendingUp size={14} className="text-green-500" /> 今日の売上</div>
              <div className="text-2xl font-bold text-slate-900">¥{todayEarnings.toLocaleString()}</div>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
              <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2 flex items-center gap-1"><Calendar size={14} className="text-blue-500" /> 今週の売上</div>
              <div className="text-2xl font-bold text-slate-900">¥{weekEarnings.toLocaleString()}</div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6">
            <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-slate-800">月次目標</h3><span className="text-xs text-brand-600 font-bold">進捗 65%</span></div>
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden mb-4"><div className="bg-brand-500 h-full w-[65%] rounded-full"></div></div>
            <div className="flex justify-between text-xs text-slate-400 font-bold"><span>¥0</span><span>目標: ¥300,000</span></div>
          </div>
          <button onClick={() => setViewMode('history')} className="w-full py-4 bg-slate-100 rounded-xl text-slate-700 font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2"><History size={18} /> 詳細な履歴を見る</button>
        </div>
      ) : (
        <div className="p-4 max-w-lg mx-auto animate-fade-in-up">
          <div className="bg-white rounded-2xl shadow-md p-6 border border-slate-100">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center"><Settings size={20} className="mr-2 text-slate-400" />登録情報の変更</h2>
            {profileMessage && <div className={`p-4 rounded-xl mb-6 text-sm font-bold text-center ${profileMessage.includes('失敗') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>{profileMessage}</div>}
            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div><label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">お名前</label><input type="text" required value={editName} onChange={(e) => setEditName(e.target.value)} className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-100 outline-none transition-all text-slate-800" /></div>
              <div><label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">電話番号</label><input type="tel" required value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-100 outline-none transition-all text-slate-800" /></div>
              <div className="pt-4 border-t border-slate-100 mt-6"><label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">車両タイプ</label><select value={editVehicleType} onChange={(e) => setEditVehicleType(e.target.value)} className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-100 outline-none transition-all text-slate-800 mb-4"><option value="keivan">軽バン (Box Van)</option><option value="keitruck">軽トラック (Pick-up)</option></select></div>
              <div><label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">車両ナンバー</label><input type="text" required value={editLicensePlate} onChange={(e) => setEditLicensePlate(e.target.value)} className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-100 outline-none transition-all text-slate-800" /></div>
              <button type="submit" disabled={isSavingProfile} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-brand-600 transition-colors shadow-lg shadow-brand-500/20 flex items-center justify-center mt-6">{isSavingProfile ? <><Loader2 size={20} className="animate-spin mr-2" /> 保存中...</> : <><Save size={20} className="mr-2" /> 変更を保存</>}</button>
            </form>
          </div>
          <div className="mt-8 bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">アカウント情報</h3>
            <div className="flex justify-between py-2 border-b border-slate-50"><span className="text-slate-600">ID</span><span className="font-mono text-slate-400">{driverDisplay.id}</span></div>
            <div className="flex justify-between py-2 border-b border-slate-50"><span className="text-slate-600">Email</span><span className="text-slate-800">{driverDisplay.email}</span></div>
            <div className="flex justify-between py-2 border-b border-slate-50"><span className="text-slate-600">評価</span><span className="text-amber-500 font-bold">★ {driverDisplay.rating.toFixed(1)}</span></div>
            <div className="flex justify-between py-2 border-b border-slate-50"><span className="text-slate-600">総配送回数</span><span className="text-slate-800 font-bold">{driverDisplay.totalRides}回</span></div>
            <div className="flex justify-between items-center py-4 mt-2"><span className="text-slate-600 flex items-center gap-2"><Bell size={16} /> 通知設定</span>{notificationsEnabled ? <span className="text-green-500 text-xs font-bold bg-green-50 px-2 py-1 rounded">有効</span> : <button onClick={handleRequestPermissions} className="text-xs bg-brand-50 text-brand-600 font-bold px-3 py-1.5 rounded-lg hover:bg-brand-100 transition-colors">許可する</button>}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverApp;