import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { mockStore } from '../services/mockDb';
import { Driver, Delivery } from '../types';
import { Users, Truck, Star, Search, Filter, ShieldAlert, Circle, ArrowUp, ArrowDown, ArrowUpDown, X, Phone, Mail, MapPin, Calendar, Clock, CreditCard, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const AdminDriverPanel: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  
  // Filter States
  const [statusFilter, setStatusFilter] = useState('all');
  const [vehicleFilter, setVehicleFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Sort State
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ 
    key: 'name', 
    direction: 'asc' 
  });

  // NOTE: Auth/Role check is now handled by ProtectedRoute in App.tsx

  useEffect(() => {
    // Load drivers
    const allDrivers = mockStore.getAllDrivers();
    setDrivers(allDrivers);
    
    // Poll for status updates
    const interval = setInterval(() => {
       setDrivers(mockStore.getAllDrivers());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const processedDrivers = useMemo(() => {
      let result = [...drivers];

      // 1. Filter
      result = result.filter(driver => {
          const matchesSearch = driver.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                driver.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                driver.licensePlate.toLowerCase().includes(searchTerm.toLowerCase());
          
          const matchesStatus = statusFilter === 'all' 
              ? true 
              : statusFilter === 'online' 
                  ? driver.isOnline 
                  : !driver.isOnline;

          const matchesVehicle = vehicleFilter === 'all'
              ? true
              : driver.vehicleType === vehicleFilter;
          
          return matchesSearch && matchesStatus && matchesVehicle;
      });

      // 2. Sort
      result.sort((a, b) => {
          let aValue: any = a[sortConfig.key as keyof Driver];
          let bValue: any = b[sortConfig.key as keyof Driver];

          // Custom getters for computed/nested values
          if (sortConfig.key === 'earnings') {
              aValue = mockStore.getDriverEarnings(a.id);
              bValue = mockStore.getDriverEarnings(b.id);
          } else if (sortConfig.key === 'status') {
              // Sort online first (1) vs offline (0) or vice versa
              aValue = a.isOnline ? 1 : 0;
              bValue = b.isOnline ? 1 : 0;
          }

          if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
          if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
          return 0;
      });

      return result;
  }, [drivers, searchTerm, statusFilter, vehicleFilter, sortConfig]);

  // Fetch history for selected driver
  const selectedDriverHistory = useMemo(() => {
      if (!selectedDriver) return [];
      return mockStore.deliveries
        .filter(d => d.driverId === selectedDriver.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [selectedDriver]);

  const onlineCount = drivers.filter(d => d.isOnline).length;
  const totalEarnings = drivers.reduce((acc, d) => acc + mockStore.getDriverEarnings(d.id), 0);

  // Fallback if accessed directly without auth wrapper context (should not happen in production)
  if (!user || user.userType !== 'admin') return null;

  const SortHeader = ({ label, sortKey }: { label: string, sortKey: string }) => (
      <th 
        className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors select-none group"
        onClick={() => handleSort(sortKey)}
      >
          <div className="flex items-center gap-1">
              {label}
              <span className="text-slate-300 group-hover:text-slate-400">
                  {sortConfig.key === sortKey ? (
                      sortConfig.direction === 'asc' ? <ArrowUp size={14} className="text-brand-500" /> : <ArrowDown size={14} className="text-brand-500" />
                  ) : (
                      <ArrowUpDown size={14} />
                  )}
              </span>
          </div>
      </th>
  );

  const getStatusBadge = (status: string) => {
      switch(status) {
          case 'delivered': return <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold border border-green-200">完了</span>;
          case 'cancelled': return <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded text-[10px] font-bold border border-rose-200">キャンセル</span>;
          case 'in_transit': return <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold border border-blue-200">配送中</span>;
          case 'pickup_in_progress': return <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-bold border border-indigo-200">集荷中</span>;
          default: return <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-bold border border-gray-200">{status}</span>;
      }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 sm:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">ドライバー管理パネル</h1>
                <p className="text-slate-500 mt-1">登録ドライバーの状況確認・管理</p>
            </div>
            <div className="bg-white px-4 py-2 rounded-full border border-slate-200 text-sm font-medium text-slate-600 flex items-center gap-2">
                <ShieldAlert size={16} className="text-brand-500" />
                管理者モード: {user.name}
            </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-slate-500 text-sm font-bold uppercase tracking-wider">総ドライバー数</h3>
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <Users size={20} />
                    </div>
                </div>
                <p className="text-3xl font-bold text-slate-900">{drivers.length}<span className="text-sm text-slate-400 font-normal ml-1">名</span></p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-slate-500 text-sm font-bold uppercase tracking-wider">現在オンライン</h3>
                    <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                        <Circle size={20} fill="currentColor" />
                    </div>
                </div>
                <p className="text-3xl font-bold text-slate-900">{onlineCount}<span className="text-sm text-slate-400 font-normal ml-1">名</span></p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-slate-500 text-sm font-bold uppercase tracking-wider">累計ドライバー売上</h3>
                    <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                        <Star size={20} />
                    </div>
                </div>
                <p className="text-3xl font-bold text-slate-900">¥{totalEarnings.toLocaleString()}</p>
            </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-t-3xl border-b border-slate-100 p-6 space-y-4">
            {/* Search Bar */}
            <div className="relative w-full">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="名前、メール、ナンバーで検索..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-200"
                />
            </div>
            
            {/* Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
                    <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                        <button 
                            onClick={() => setStatusFilter('all')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${statusFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            すべて
                        </button>
                        <button 
                            onClick={() => setStatusFilter('online')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${statusFilter === 'online' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            オンライン
                        </button>
                        <button 
                            onClick={() => setStatusFilter('offline')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${statusFilter === 'offline' ? 'bg-white text-slate-400 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            オフライン
                        </button>
                    </div>

                    <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                        <button 
                            onClick={() => setVehicleFilter('all')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${vehicleFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            全車種
                        </button>
                        <button 
                            onClick={() => setVehicleFilter('keivan')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${vehicleFilter === 'keivan' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            軽バン
                        </button>
                        <button 
                            onClick={() => setVehicleFilter('keitruck')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${vehicleFilter === 'keitruck' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            軽トラ
                        </button>
                    </div>
                </div>
                
                <div className="text-sm text-slate-400 font-medium">
                    {processedDrivers.length} 件表示
                </div>
            </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-b-3xl shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                            <SortHeader label="ステータス" sortKey="status" />
                            <SortHeader label="ドライバー名 / 連絡先" sortKey="name" />
                            <SortHeader label="車両情報" sortKey="vehicleType" />
                            <SortHeader label="実績 (評価)" sortKey="rating" />
                            <SortHeader label="実績 (配送数)" sortKey="totalRides" />
                            <SortHeader label="売上" sortKey="earnings" />
                            <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">アクション</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {processedDrivers.length > 0 ? (
                            processedDrivers.map((driver) => {
                                const earnings = mockStore.getDriverEarnings(driver.id);
                                return (
                                    <tr 
                                      key={driver.id} 
                                      className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                                      onClick={() => setSelectedDriver(driver)}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {driver.isOnline ? (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                                                    <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                                                    Online
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">
                                                    <span className="w-2 h-2 rounded-full bg-slate-400 mr-2"></span>
                                                    Offline
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-900">{driver.name}</div>
                                            <div className="text-xs text-slate-500 mt-0.5">{driver.email}</div>
                                            <div className="text-xs text-slate-500">{driver.phone || 'N/A'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="p-2 bg-slate-100 rounded-lg text-slate-600 mr-3 group-hover:bg-white group-hover:shadow-sm transition-all">
                                                    <Truck size={16} />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-slate-800">
                                                        {driver.vehicleType === 'keivan' ? '軽バン' : '軽トラック'}
                                                    </div>
                                                    <div className="text-xs text-slate-500 font-mono">
                                                        {driver.licensePlate}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center mb-1">
                                                <Star size={14} className="text-amber-400 fill-current mr-1" />
                                                <span className="font-bold text-slate-700">{driver.rating.toFixed(1)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-slate-700">{driver.totalRides} <span className="text-xs text-slate-400">回</span></div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-mono font-bold text-slate-700">¥{earnings.toLocaleString()}</div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button 
                                              onClick={(e) => { e.stopPropagation(); setSelectedDriver(driver); }}
                                              className="text-brand-600 hover:text-brand-800 text-sm font-bold hover:underline bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg transition-colors"
                                            >
                                                詳細
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                                    <div className="flex flex-col items-center justify-center">
                                        <Search size={32} className="text-slate-200 mb-2" />
                                        <p>該当するドライバーが見つかりません</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Driver Detail Modal */}
        {selectedDriver && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                <div className="bg-white rounded-3xl w-full max-w-4xl h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-fade-in-up">
                    
                    {/* Modal Header */}
                    <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm text-slate-400">
                                <Users size={32} />
                            </div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h2 className="text-2xl font-bold text-slate-900">{selectedDriver.name}</h2>
                                    {selectedDriver.isOnline ? (
                                        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold border border-green-200 flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Online
                                        </span>
                                    ) : (
                                        <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded text-xs font-bold border border-slate-300">
                                            Offline
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                                    <span className="font-mono">ID: {selectedDriver.id}</span>
                                    {/* Star rating moved to grid for clearer display, but can keep small indicator here too */}
                                </div>
                            </div>
                        </div>
                        <button 
                            onClick={() => setSelectedDriver(null)}
                            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 md:p-8">
                        {/* Info Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            {/* Contact Info */}
                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Users size={16} /> 連絡先情報
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <Mail size={18} className="text-brand-500 mt-0.5" />
                                        <div>
                                            <p className="text-xs text-slate-400 font-bold">メールアドレス</p>
                                            <p className="text-slate-800 font-medium">{selectedDriver.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Phone size={18} className="text-brand-500 mt-0.5" />
                                        <div>
                                            <p className="text-xs text-slate-400 font-bold">電話番号</p>
                                            <p className="text-slate-800 font-medium">{selectedDriver.phone || '登録なし'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Vehicle & Stats */}
                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Truck size={16} /> 車両・実績
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    <div className="sm:col-span-1">
                                        <p className="text-xs text-slate-400 font-bold mb-1">評価</p>
                                        <p className="text-xl font-bold text-slate-900 flex items-center">
                                            <Star size={18} className="text-amber-400 fill-amber-400 mr-1" />
                                            {selectedDriver.rating.toFixed(1)}
                                        </p>
                                    </div>
                                    <div className="sm:col-span-1">
                                        <p className="text-xs text-slate-400 font-bold mb-1">総配送回数</p>
                                        <p className="text-xl font-bold text-slate-900">{selectedDriver.totalRides}回</p>
                                    </div>
                                    <div className="sm:col-span-1">
                                        <p className="text-xs text-slate-400 font-bold mb-1">累計売上</p>
                                        <p className="text-xl font-bold text-brand-600">¥{mockStore.getDriverEarnings(selectedDriver.id).toLocaleString()}</p>
                                    </div>
                                    <div className="sm:col-span-1">
                                        <p className="text-xs text-slate-400 font-bold mb-1">車両タイプ</p>
                                        <p className="text-slate-800 font-medium flex items-center gap-2">
                                            {selectedDriver.vehicleType === 'keivan' ? '軽バン (Box)' : '軽トラック (Pick-up)'}
                                        </p>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <p className="text-xs text-slate-400 font-bold mb-1">ナンバープレート</p>
                                        <p className="text-slate-800 font-mono font-medium">{selectedDriver.licensePlate}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* History Table */}
                        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                            <div className="bg-white p-4 border-b border-slate-200 flex justify-between items-center">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <Clock size={18} className="text-slate-400" /> 配送履歴
                                </h3>
                                <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded">{selectedDriverHistory.length}件</span>
                            </div>
                            
                            <div className="overflow-x-auto">
                                {selectedDriverHistory.length > 0 ? (
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50 border-b border-slate-100 text-slate-500">
                                            <tr>
                                                <th className="px-4 py-3 text-left font-bold">日時</th>
                                                <th className="px-4 py-3 text-left font-bold">ルート (Pickup → Drop)</th>
                                                <th className="px-4 py-3 text-left font-bold">料金</th>
                                                <th className="px-4 py-3 text-right font-bold">ステータス</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {selectedDriverHistory.map(history => (
                                                <tr key={history.id} className="hover:bg-slate-50/50">
                                                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                                                        <div className="font-bold">{new Date(history.createdAt).toLocaleDateString()}</div>
                                                        <div className="text-xs text-slate-400">{new Date(history.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex flex-col gap-1 max-w-xs">
                                                            <div className="flex items-center gap-2 text-xs truncate">
                                                                <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></span>
                                                                {history.pickup.address}
                                                            </div>
                                                            <div className="flex items-center gap-2 text-xs truncate">
                                                                <span className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0"></span>
                                                                {history.delivery.address}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 font-mono font-bold text-slate-700">
                                                        ¥{history.price.total.toLocaleString()}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        {getStatusBadge(history.status)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="p-8 text-center text-slate-400">
                                        <AlertCircle size={24} className="mx-auto mb-2 opacity-50" />
                                        <p>配送履歴はありません</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default AdminDriverPanel;