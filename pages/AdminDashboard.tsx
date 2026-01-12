import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase/client';
import { 
    LayoutDashboard, 
    Users, 
    Wallet, 
    TrendingUp, 
    Truck, 
    Shield, 
    Activity,
    DollarSign,
    Calendar
} from 'lucide-react';

interface Order {
    id: string;
    created_at: string;
    status: string;
    total_customer_price: number;
    company_revenue: number;
    driver_revenue: number;
    customer_email: string;
    pickup_address: string;
    delivery_address: string;
}

interface Profile {
    id: string;
    email: string;
    role: string;
    created_at: string;
    full_name?: string;
    phone?: string;
}

const AdminDashboard: React.FC = () => {
    const { user, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();
    
    // State
    const [stats, setStats] = useState({
        totalRevenue: 0,
        companyRevenue: 0,
        driverRevenue: 0,
        totalOrders: 0,
        activeDrivers: 0,
        totalUsers: 0
    });
    
    const [recentOrders, setRecentOrders] = useState<Order[]>([]);
    const [users, setUsers] = useState<Profile[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Security Check
    useEffect(() => {
        if (!authLoading) {
            if (!user || user.email !== 'aoneko.move@gmail.com') {
                navigate('/');
            }
        }
    }, [user, authLoading, navigate]);

    // Data Fetching
    const fetchData = async () => {
        try {
            setIsLoading(true);

            // 1. Fetch Orders (for Revenue & List)
            const { data: ordersData, error: ordersError } = await supabase
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false });

            if (ordersError) throw ordersError;

            // Calculate Financials
            const orders = ordersData || [];
            const totalRev = orders.reduce((sum, order) => sum + (order.total_customer_price || 0), 0);
            const compRev = orders.reduce((sum, order) => sum + (order.company_revenue || 0), 0);
            const drivRev = orders.reduce((sum, order) => sum + (order.driver_revenue || 0), 0);

            setRecentOrders(orders.slice(0, 10)); // Top 10 recent

            // 2. Fetch Profiles (God Mode)
            const { data: profilesData, error: profilesError } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (profilesError) throw profilesError;

            const allUsers = profilesData || [];
            const driverCount = allUsers.filter(u => u.role === 'driver').length;

            setUsers(allUsers);
            setStats({
                totalRevenue: totalRev,
                companyRevenue: compRev,
                driverRevenue: drivRev,
                totalOrders: orders.length,
                activeDrivers: driverCount,
                totalUsers: allUsers.length
            });

        } catch (error) {
            console.error('Error fetching admin data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user?.email === 'aoneko.move@gmail.com') {
            fetchData();
        }
    }, [user]);

    // Format Currency (JPY)
    const formatJPY = (amount: number) => {
        return new Intl.NumberFormat('ja-JP', {
            style: 'currency',
            currency: 'JPY',
            maximumFractionDigits: 0
        }).format(amount);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Activity className="w-10 h-10 text-blue-500 animate-pulse" />
                    <p className="text-slate-400 font-mono">Loading Admin Control Bridge...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 pb-20 font-sans">
            {/* Navbar / Header */}
            <div className="bg-slate-900 border-b border-slate-800 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-900/40">
                            <LayoutDashboard className="text-white" size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight text-white">Admin Control Bridge</h1>
                            <p className="text-xs text-slate-400">Página de Control & Finanzas</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-xs font-mono">
                            GOD MODE ACTIVE
                        </span>
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                            <span className="text-xs font-bold">AD</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                
                {/* 1. FINANCIAL CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Total Volume */}
                    <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <DollarSign size={64} />
                        </div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-slate-800 rounded-lg text-slate-400">
                                <Activity size={20} />
                            </div>
                            <span className="text-sm font-medium text-slate-400">Volumen Total</span>
                        </div>
                        <h2 className="text-3xl font-bold text-white">{formatJPY(stats.totalRevenue)}</h2>
                        <p className="text-xs text-slate-500 mt-1">Total Procesado (GMV)</p>
                    </div>

                    {/* Company Revenue (20%) */}
                    <div className="p-6 bg-slate-900 rounded-2xl border border-blue-900/30 shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <TrendingUp size={64} className="text-blue-500" />
                        </div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                                <Wallet size={20} />
                            </div>
                            <span className="text-sm font-medium text-blue-400">Company Net (20%)</span>
                        </div>
                        <h2 className="text-3xl font-bold text-white">{formatJPY(stats.companyRevenue)}</h2>
                        <p className="text-xs text-blue-400/60 mt-1">Ganancia Neta Plataforma</p>
                    </div>

                    {/* Driver Revenue (80%) */}
                    <div className="p-6 bg-slate-900 rounded-2xl border border-emerald-900/30 shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Truck size={64} className="text-emerald-500" />
                        </div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                                <Users size={20} />
                            </div>
                            <span className="text-sm font-medium text-emerald-400">Driver Payouts (80%)</span>
                        </div>
                        <h2 className="text-3xl font-bold text-white">{formatJPY(stats.driverRevenue)}</h2>
                        <p className="text-xs text-emerald-400/60 mt-1">Pagos a Conductores</p>
                    </div>

                    {/* Active Drivers */}
                    <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 shadow-xl">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                                <Truck size={20} />
                            </div>
                            <span className="text-sm font-medium text-purple-400">Fleet Status</span>
                        </div>
                        <h2 className="text-3xl font-bold text-white">{stats.activeDrivers}</h2>
                        <div className="flex justify-between items-center mt-1">
                            <p className="text-xs text-slate-500">Conductores Activos</p>
                            <span className="text-xs bg-purple-500/10 text-purple-300 px-2 py-0.5 rounded-full">
                                {stats.totalOrders} Orders
                            </span>
                        </div>
                    </div>
                </div>

                {/* 2. RECENT ORDERS TABLE */}
                <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                    <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                        <h3 className="font-bold text-lg text-white flex items-center gap-2">
                            <Calendar size={18} className="text-slate-400" />    
                            Últimas Órdenes
                        </h3>
                        <button 
                            onClick={fetchData} 
                            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg transition-colors"
                        >
                            Refrescar
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-950/50 text-slate-400 text-xs uppercase tracking-wider">
                                    <th className="p-4 font-medium border-b border-slate-800">Order ID</th>
                                    <th className="p-4 font-medium border-b border-slate-800">Status</th>
                                    <th className="p-4 font-medium border-b border-slate-800">Amount</th>
                                    <th className="p-4 font-medium border-b border-slate-800">Split (80/20)</th>
                                    <th className="p-4 font-medium border-b border-slate-800">Date</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm text-slate-300 divide-y divide-slate-800">
                                {recentOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-slate-500">
                                            No active orders found.
                                        </td>
                                    </tr>
                                ) : (
                                    recentOrders.map((order) => (
                                        <tr key={order.id} className="hover:bg-slate-800/50 transition-colors">
                                            <td className="p-4 font-mono text-xs text-slate-500">
                                                {order.id.slice(0, 8)}...
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase border ${
                                                    order.status === 'completed' 
                                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                                        : order.status === 'pending'
                                                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                            : 'bg-slate-800 text-slate-400 border-slate-700'
                                                }`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="p-4 font-medium text-white">
                                                {formatJPY(order.total_customer_price || 0)}
                                            </td>
                                            <td className="p-4 text-xs">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-emerald-400">Dr: {formatJPY(order.driver_revenue || 0)}</span>
                                                    <span className="text-blue-400">Co: {formatJPY(order.company_revenue || 0)}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-slate-500 text-xs">
                                                {new Date(order.created_at).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 3. USERS TABLE (GOD MODE) */}
                <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                    <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                        <h3 className="font-bold text-lg text-white flex items-center gap-2">
                            <Users size={18} className="text-slate-400" />
                            Usuarios Registrados
                        </h3>
                        <span className="text-xs font-mono text-slate-500">public.profiles</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-950/50 text-slate-400 text-xs uppercase tracking-wider">
                                    <th className="p-4 font-medium border-b border-slate-800">User</th>
                                    <th className="p-4 font-medium border-b border-slate-800">Role</th>
                                    <th className="p-4 font-medium border-b border-slate-800">ID</th>
                                    <th className="p-4 font-medium border-b border-slate-800">Joined</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm text-slate-300 divide-y divide-slate-800">
                                {users.map((profile) => (
                                    <tr key={profile.id} className="hover:bg-slate-800/50 transition-colors">
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-white">{profile.full_name || 'No Name'}</span>
                                                <span className="text-xs text-slate-500">{profile.email}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase border ${
                                                profile.role === 'admin' 
                                                    ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                                                    : profile.role === 'driver'
                                                        ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                                        : 'bg-slate-800 text-slate-400 border-slate-700'
                                            }`}>
                                                {profile.role || 'customer'}
                                            </span>
                                        </td>
                                        <td className="p-4 font-mono text-xs text-slate-600">
                                            {profile.id.substring(0, 8)}...
                                        </td>
                                        <td className="p-4 text-slate-500 text-xs">
                                            {new Date(profile.created_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AdminDashboard;

