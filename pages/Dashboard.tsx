import React, { useState, useEffect } from 'react';
import { mockStore } from '../services/mockDb';
import { Package, Truck, User, PlusCircle, MapPin, Search, CheckCircle, Loader2, Clock, ChevronRight, ArrowRight, AlertCircle, XCircle, MessageCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Delivery } from '../types/Order';
import { User as UserType } from '../types/User';
import { ChatInterface } from '../components/Chat';

const getStatusConfig = (status: string) => {
    switch (status) {
        case 'delivered':
            return { color: 'bg-green-100 text-green-700 border-green-200', icon: <CheckCircle size={14} />, label: '配送完了' };
        case 'cancelled':
            return { color: 'bg-rose-100 text-rose-700 border-rose-200', icon: <XCircle size={14} />, label: 'キャンセル' };
        case 'pending':
            return { color: 'bg-slate-100 text-slate-600 border-slate-200', icon: <Clock size={14} />, label: '受付済み' };
        case 'searching_driver':
            return { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: <Loader2 size={14} className="animate-spin" />, label: 'ドライバー検索中' };
        case 'accepted':
            return { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: <CheckCircle size={14} />, label: 'ドライバー決定' };
        case 'pickup_in_progress':
            return { color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: <Truck size={14} />, label: '集荷へ移動中' };
        case 'in_transit':
            return { color: 'bg-brand-100 text-brand-700 border-brand-200', icon: <Truck size={14} className="animate-pulse" />, label: '配送中' };
        default:
            return { color: 'bg-gray-100 text-gray-600 border-gray-200', icon: <AlertCircle size={14} />, label: status };
    }
};

interface DeliveryCardProps {
    delivery: Delivery;
    isActive: boolean;
    onChatClick?: (deliveryId: string, driverName: string) => void;
}

// Reusable Card Component for List Items
const DeliveryCard: React.FC<DeliveryCardProps> = ({ delivery, isActive, onChatClick }) => {
    const statusConfig = getStatusConfig(delivery.status);
    const dateObj = new Date(delivery.createdAt);
    const dateStr = dateObj.toLocaleDateString('ja-JP');
    const timeStr = dateObj.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
            {/* Header Row */}
            <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold border capitalize flex items-center gap-1.5 ${statusConfig.color}`}>
                            {statusConfig.icon}
                            <span className="tracking-wide">{statusConfig.label}</span>
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                            #{delivery.trackingNumber}
                        </span>
                    </div>
                    <span className="text-xs text-slate-400 pl-1">
                        {dateStr} <span className="opacity-50">|</span> {timeStr}
                    </span>
                </div>
                <div className="text-right flex flex-col items-end">
                    <p className="text-xl font-bold text-slate-900 tracking-tight">
                        ¥{delivery.price.total.toLocaleString()}
                    </p>
                    <p className="text-xs font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded inline-block">
                        {delivery.vehicle.displayName.split('(')[0]}
                    </p>
                </div>
            </div>

            {/* Route Visualization */}
            <div className="relative pl-4 mb-6">
                {/* Vertical Connector Line */}
                <div className="absolute left-[1.2rem] top-3 bottom-4 w-0.5 bg-slate-100 group-hover:bg-slate-200 transition-colors"></div>

                {/* Pickup */}
                <div className="flex items-start mb-5 relative z-10 group/pickup">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 border-2 border-white shadow-sm flex items-center justify-center mr-4 flex-shrink-0 group-hover/pickup:scale-110 transition-transform">
                        <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
                    </div>
                    <div className="pt-1 min-w-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Pickup (集荷)</p>
                        <p className="text-slate-800 font-bold text-sm sm:text-base leading-tight break-words">{delivery.pickup.address}</p>
                        {delivery.pickup.scheduledTime && (
                            <p className="text-xs text-slate-500 mt-1 flex items-center bg-slate-50 inline-flex px-2 py-0.5 rounded">
                                <Clock size={10} className="mr-1.5" />
                                {new Date(delivery.pickup.scheduledTime).toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                        )}
                    </div>
                </div>

                {/* Drop-off */}
                <div className="flex items-start relative z-10 group/drop">
                    <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 border-2 border-white shadow-sm flex items-center justify-center mr-4 flex-shrink-0 group-hover/drop:scale-110 transition-transform">
                        <div className="w-2.5 h-2.5 bg-orange-500 rounded-full"></div>
                    </div>
                    <div className="pt-1 min-w-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Drop-off (配送)</p>
                        <p className="text-slate-800 font-bold text-sm sm:text-base leading-tight break-words">{delivery.delivery.address}</p>
                    </div>
                </div>
            </div>

            {/* Action Footer */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-50">
                {isActive && delivery.driverId && onChatClick && (
                    <button
                        onClick={() => {
                            const driver = mockStore.getUserById(delivery.driverId!);
                            onChatClick(delivery.id, driver?.name || 'ドライバー');
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm bg-brand-50 text-brand-600 hover:bg-brand-100 transition-all active:scale-95"
                    >
                        <MessageCircle size={18} />
                        チャット
                    </button>
                )}
                <Link
                    to={`/tracking?id=${delivery.trackingNumber}`}
                    className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all transform active:scale-95 ${isActive
                        ? 'bg-slate-900 text-white hover:bg-brand-600 shadow-lg shadow-brand-500/20 hover:-translate-y-0.5'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                >
                    {isActive ? (
                        <>配送状況を確認 <ArrowRight size={16} /></>
                    ) : (
                        <>詳細を見る <ChevronRight size={16} /></>
                    )}
                </Link>
            </div>
        </div>
    );
};

const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const [deliveries, setDeliveries] = useState<Delivery[]>([]);
    const [loading, setLoading] = useState(true);

    // Chat state
    const [chatConfig, setChatConfig] = useState<{ deliveryId: string, recipientName: string } | null>(null);

    // Poll for updates to keep dashboard fresh
    useEffect(() => {
        if (!user) return;

        const loadData = () => {
            // Sort deliveries by date descending (newest first)
            const userDeliveries = mockStore.getDeliveriesForUser(user.id)
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setDeliveries(userDeliveries);
            setLoading(false);
        };

        loadData();
        const interval = setInterval(loadData, 5000);
        return () => clearInterval(interval);
    }, [user]);

    if (!user) return null;

    // Categorize deliveries
    const activeStatuses = ['pending', 'searching_driver', 'accepted', 'pickup_in_progress', 'in_transit'];
    const currentDeliveries = deliveries.filter(d => activeStatuses.includes(d.status));
    const pastDeliveries = deliveries.filter(d => !activeStatuses.includes(d.status));
    const completedDeliveries = deliveries.filter(d => d.status === 'delivered');

    const handleChatRequest = (deliveryId: string, recipientName: string) => {
        setChatConfig({ deliveryId, recipientName });
    };

    return (
        <div className="max-w-6xl mx-auto p-4 sm:p-8 min-h-screen bg-slate-50">
            {/* Chat Interface Modal */}
            {chatConfig && user && (
                <ChatInterface
                    deliveryId={chatConfig.deliveryId}
                    currentUser={user}
                    recipientName={chatConfig.recipientName}
                    onClose={() => setChatConfig(null)}
                />
            )}

            {/* Header Panel */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">マイページ</h1>
                    <p className="text-slate-500 mt-1 text-sm">配送状況の確認と履歴</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right hidden md:block">
                        <p className="font-bold text-slate-800">{user.name}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-brand-50 to-brand-100 text-brand-600 rounded-full flex items-center justify-center shadow-inner">
                        <User size={24} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                {/* Left Column: Stats & Actions */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Quick Actions */}
                    <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl shadow-slate-900/20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 pointer-events-none group-hover:scale-150 transition-transform duration-700"></div>

                        <h3 className="font-bold text-lg mb-6 relative z-10">クイックアクション</h3>
                        <Link to="/quote" className="block w-full bg-white text-slate-900 py-3.5 rounded-xl font-bold text-center hover:bg-brand-50 transition-colors mb-3 flex items-center justify-center gap-2 shadow-sm relative z-10">
                            <PlusCircle size={18} /> 新規配送依頼
                        </Link>
                        <p className="text-xs text-slate-400 text-center relative z-10">お見積りは無料です</p>
                    </div>

                    {/* Stats Overview */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="font-bold text-slate-600 text-xs uppercase tracking-wider">利用状況サマリー</h3>
                        </div>
                        <div className="p-4 space-y-3">
                            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                                <div>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase">総件数</p>
                                    <p className="text-2xl font-bold text-slate-900">{deliveries.length}</p>
                                </div>
                                <Package size={20} className="text-slate-300" />
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 border border-blue-100">
                                <div>
                                    <p className="text-[10px] text-blue-600 font-bold uppercase">進行中 (Active)</p>
                                    <p className="text-2xl font-bold text-blue-700">{currentDeliveries.length}</p>
                                </div>
                                <Truck size={20} className="text-blue-300" />
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-xl bg-green-50 border border-green-100">
                                <div>
                                    <p className="text-[10px] text-green-600 font-bold uppercase">完了 (Completed)</p>
                                    <p className="text-2xl font-bold text-green-700">{completedDeliveries.length}</p>
                                </div>
                                <CheckCircle size={20} className="text-green-300" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: History & Status */}
                <div className="lg:col-span-3 space-y-10">

                    {/* Active Deliveries Section */}
                    {currentDeliveries.length > 0 && (
                        <div className="animate-fade-in-up">
                            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <div className="w-2 h-2 bg-brand-500 rounded-full animate-pulse"></div>
                                進行中のオーダー
                                <span className="bg-brand-100 text-brand-700 text-xs px-2 py-0.5 rounded-full">{currentDeliveries.length}</span>
                            </h2>
                            <div className="space-y-4">
                                {currentDeliveries.map(delivery => (
                                    <DeliveryCard
                                        key={delivery.id}
                                        delivery={delivery}
                                        isActive={true}
                                        onChatClick={handleChatRequest}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Past Deliveries Section */}
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Package size={18} className="text-slate-400" />
                            配送履歴
                        </h2>

                        {loading ? (
                            <div className="flex justify-center py-12">
                                <Loader2 size={32} className="animate-spin text-slate-300" />
                            </div>
                        ) : pastDeliveries.length === 0 && currentDeliveries.length === 0 ? (
                            <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-sm">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                                    <Package size={32} strokeWidth={1.5} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 mb-2">まだ配送履歴はありません</h3>
                                <p className="text-slate-500 mb-8">初めての配送を依頼してみましょう。</p>
                                <Link to="/quote" className="inline-block bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-brand-600 transition-colors shadow-lg">
                                    配送を依頼する
                                </Link>
                            </div>
                        ) : pastDeliveries.length === 0 ? (
                            <div className="text-center py-8 text-slate-400 text-sm">
                                完了した配送はまだありません。
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {pastDeliveries.map(delivery => (
                                    <DeliveryCard key={delivery.id} delivery={delivery} isActive={false} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;