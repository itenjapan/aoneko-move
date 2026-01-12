import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { mockStore } from '../services/mockDb';
import { StatsCard } from '../components/Admin/StatsCard';
import { UsersTable } from '../components/Admin/UsersTable';
import { LogisticsViewer } from '../components/Admin/LogisticsViewer';
import { Users, Truck, Package, Activity } from 'lucide-react';
import { User, Driver } from '../types/User';
import { Delivery } from '../types/Order';

const AdminDashboard: React.FC = () => {
    const { user, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalUsers: 0,
        onlineUsers: 0,
        totalOrders: 0
    });
    const [users, setUsers] = useState<(User | Driver)[]>([]);
    const [orders, setOrders] = useState<Delivery[]>([]);

    useEffect(() => {
        // Phase 1: Security & Super-Admin Check
        if (!authLoading) {
            if (!user || user.email !== 'aoneko.move@gmail.com') {
                alert('アクセス権限がありません (Access Denied)');
                navigate('/');
            }
        }
    }, [user, authLoading, navigate]);

    useEffect(() => {
        // Phase 2: Load Data
        const loadData = () => {
            const allUsers = mockStore.getAllUsers();
            const allOrders = mockStore.deliveries;

            // Calculate stats
            const totalUsers = allUsers.length;
            // Mocking "online" users roughly 
            const onlineUsers = allUsers.filter(u => u.userType === 'driver' && (u as Driver).isOnline).length + 1; // +1 for current admin
            const totalOrders = allOrders.length;

            setStats({ totalUsers, onlineUsers, totalOrders });
            setUsers(allUsers);
            setOrders(allOrders);
        };

        if (user?.email === 'aoneko.move@gmail.com') {
            loadData();
            // Setup polling for "Real-time" effect
            const interval = setInterval(loadData, 5000);
            return () => clearInterval(interval);
        }
    }, [user]);

    if (authLoading || !user) return <div className="min-h-screen flex items-center justify-center">Loading Admin Panel...</div>;

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <div className="bg-slate-900 text-white pt-20 pb-24 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
                            <Activity size={24} className="text-brand-400" />
                        </div>
                        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                    </div>
                    <p className="text-slate-400 max-w-2xl text-lg">
                        Aoneko Move 統合管理システム
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 space-y-8">
                {/* Phase 2: Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatsCard
                        title="登録ユーザー総数"
                        value={stats.totalUsers}
                        icon={<Users size={24} className="text-brand-600" />}
                        color="bg-brand-50"
                    />
                    <StatsCard
                        title="オンライン / 稼働中"
                        value={stats.onlineUsers}
                        icon={<Activity size={24} className="text-emerald-600" />}
                        color="bg-emerald-50"
                    />
                    <StatsCard
                        title="総オーダー数"
                        value={stats.totalOrders}
                        icon={<Package size={24} className="text-violet-600" />}
                        color="bg-violet-50"
                    />
                </div>

                {/* Phase 2: User Grid */}
                <UsersTable users={users} />

                {/* Phase 2: Logistics Viewer */}
                <LogisticsViewer orders={orders} />
            </div>
        </div>
    );
};

export default AdminDashboard;
