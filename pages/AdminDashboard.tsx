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
    const { user, updateAuth, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalUsers: 0,
        onlineUsers: 0,
        totalOrders: 0
    });
    const [users, setUsers] = useState<(User | Driver)[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<(User | Driver)[]>([]);
    const [orders, setOrders] = useState<Delivery[]>([]);
    const [filterType, setFilterType] = useState<'all' | 'customer' | 'driver'>('all');

    const [isAdminSettingsOpen, setIsAdminSettingsOpen] = useState(false);
    const [newEmail, setNewEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');

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
            const onlineUsers = allUsers.filter(u => u.userType === 'driver' && (u as Driver).isOnline).length + 1; // +1 for current admin
            const totalOrders = allOrders.length;

            setStats({ totalUsers, onlineUsers, totalOrders });
            setUsers(allUsers);
            setOrders(allOrders);
        };

        if (user?.email === 'aoneko.move@gmail.com') {
            loadData();
            const interval = setInterval(loadData, 5000);
            return () => clearInterval(interval);
        }
    }, [user]);

    useEffect(() => {
        if (filterType === 'all') {
            setFilteredUsers(users);
        } else {
            setFilteredUsers(users.filter(u => u.userType === filterType));
        }
    }, [filterType, users]);

    const handleUpdateAdmin = async () => {
        if (!newEmail && !newPassword) return;
        const confirmUpdate = window.confirm('管理者情報を更新しますか？\nAre you sure you want to update admin credentials?');
        if (!confirmUpdate) return;

        try {
            await updateAuth({
                email: newEmail || undefined,
                password: newPassword || undefined
            });
            alert('管理者情報を更新しました。\nAdmin credentials updated successfully.');
            setNewEmail('');
            setNewPassword('');
            setIsAdminSettingsOpen(false);
        } catch (error) {
            alert('更新に失敗しました。');
        }
    };

    if (authLoading || !user) return <div className="min-h-screen flex items-center justify-center">Loading Admin Panel...</div>;

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <div className="bg-slate-900 text-white pt-20 pb-24 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
                                <Activity size={24} className="text-brand-400" />
                            </div>
                            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                        </div>
                        <p className="text-slate-400 max-w-2xl text-lg">
                            Aoneko Move 統合管理システム
                        </p>
                    </div>
                    <button
                        onClick={() => setIsAdminSettingsOpen(!isAdminSettingsOpen)}
                        className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 rounded-xl font-bold transition-colors flex items-center gap-2"
                    >
                        Admin Settings
                    </button>
                </div>
            </div>

            {isAdminSettingsOpen && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 mb-12 relative z-10">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 animate-fade-in-up">
                        <h3 className="text-xl font-bold mb-6 text-slate-800 border-b border-slate-100 pb-4">管理者設定 (Admin Profile)</h3>
                        <div className="grid md:grid-cols-2 gap-8">
                            <div>
                                <label className="block text-sm font-bold text-slate-500 mb-2">新しいメールアドレス (New Email)</label>
                                <input
                                    type="email"
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3"
                                    placeholder={user.email}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-500 mb-2">新しいパスワード (New Password)</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3"
                                    placeholder="********"
                                />
                            </div>
                        </div>
                        <div className="mt-8 flex justify-end">
                            <button
                                onClick={handleUpdateAdmin}
                                disabled={!newEmail && !newPassword}
                                className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50"
                            >
                                変更を保存
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 space-y-8">
                {/* Metric Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatsCard
                        title="登録ユーザー総数 (Total Users)"
                        value={stats.totalUsers}
                        icon={<Users size={24} className="text-brand-600" />}
                        color="bg-brand-50"
                    />
                    <StatsCard
                        title="オンライン / 稼働中 (Online)"
                        value={stats.onlineUsers}
                        icon={<Activity size={24} className="text-emerald-600" />}
                        color="bg-emerald-50"
                    />
                    <StatsCard
                        title="総オーダー数 (Total Orders)"
                        value={stats.totalOrders}
                        icon={<Package size={24} className="text-violet-600" />}
                        color="bg-violet-50"
                    />
                </div>

                {/* Users Table Section */}
                <div className="space-y-4">
                    <div className="flex gap-2">
                        <button onClick={() => setFilterType('all')} className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${filterType === 'all' ? 'bg-slate-800 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>すべて (All)</button>
                        <button onClick={() => setFilterType('customer')} className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${filterType === 'customer' ? 'bg-emerald-500 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>お客様 (Customers)</button>
                        <button onClick={() => setFilterType('driver')} className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${filterType === 'driver' ? 'bg-indigo-500 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>ドライバー (Drivers)</button>
                    </div>
                    <UsersTable users={filteredUsers} />
                </div>

                {/* Logistics Viewer */}
                <LogisticsViewer orders={orders} />
            </div>
        </div>
    );
};

export default AdminDashboard;
