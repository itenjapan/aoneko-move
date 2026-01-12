import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase/client';
import { Users, Shield } from 'lucide-react';

const AdminDashboard: React.FC = () => {
    const { user, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalUsers: 0,
    });
    const [profiles, setProfiles] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Phase 1: Security & Super-Admin Check
        if (!authLoading) {
            if (!user || user.email !== 'aoneko.move@gmail.com') {
                alert('アクセス権限がありません (Access Denied)');
                navigate('/');
            }
        }
    }, [user, authLoading, navigate]);

    const fetchProfiles = async () => {
        if (user?.email !== 'aoneko.move@gmail.com') return;
        
        try {
            // "Tabla Sin Filtros: Usa supabase.from('profiles').select('*')"
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;

            if (data) {
                setProfiles(data);
                setStats({ totalUsers: data.length });
            }
        } catch (error: any) {
            console.error('Error fetching profiles:', error);
            // Don't alert on every interval tick if it fails, just log
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user?.email === 'aoneko.move@gmail.com') {
            fetchProfiles();
            const interval = setInterval(fetchProfiles, 5000); // Live updates
            return () => clearInterval(interval);
        }
    }, [user]);

    const makeAdmin = async (userId: string) => {
        // "Lógica del Botón: Al hacer clic, debe ejecutar: supabase.from('profiles').update({ role: 'admin' }).eq('id', userId)."
        if (!window.confirm('このユーザーを管理者にしますか？\nAre you sure you want to promote this user to Admin?')) return;

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ role: 'admin' })
                .eq('id', userId);

            if (error) throw error;

            alert('管理者に変更しました。\nUser promoted to Admin!');
            fetchProfiles(); // Refresh list immediately
        } catch (error: any) {
            alert('Failed to update role: ' + error.message);
        }
    };

    if (authLoading || (isLoading && !profiles.length)) {
        return <div className="min-h-screen flex items-center justify-center font-bold text-slate-500">Loading Admin God Mode...</div>;
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <div className="bg-slate-900 text-white pt-20 pb-24 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto flex items-center gap-4">
                    <div className="p-3 bg-red-600 rounded-2xl shadow-lg shadow-red-900/20">
                        <Shield size={32} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">Admin God Mode</h1>
                        <p className="text-slate-400">Database Direct Access</p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 space-y-8">
                {/* Metric Cards - "Métricas Reales: Una tarjeta arriba que diga Total Usuarios: {users.length}" */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 flex items-center gap-4">
                        <div className="p-4 bg-blue-50 text-blue-600 rounded-xl">
                            <Users size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Usuarios</p>
                            <h1 className="text-4xl font-bold text-slate-800">{stats.totalUsers}</h1>
                        </div>
                    </div>
                </div>

                {/* Users Table Section - "Tabla Sin Filtros" */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="font-bold text-lg text-slate-800">Profiles Table (Raw Data)</h3>
                        <span className="text-xs font-mono text-slate-400">public.profiles</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                                    <th className="p-4 font-bold border-b border-slate-100">Email</th>
                                    <th className="p-4 font-bold border-b border-slate-100">Full Name</th>
                                    <th className="p-4 font-bold border-b border-slate-100">Role</th>
                                    <th className="p-4 font-bold border-b border-slate-100">User ID</th>
                                    <th className="p-4 font-bold border-b border-slate-100">Created At</th>
                                    <th className="p-4 font-bold border-b border-slate-100">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {profiles.map((profile) => (
                                    <tr key={profile.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4 border-b border-slate-100 font-medium text-slate-900">
                                            {profile.email || <span className="text-slate-400 italic">No Email</span>}
                                        </td>
                                        <td className="p-4 border-b border-slate-100 text-slate-600">
                                            {profile.full_name || '-'}
                                        </td>
                                        <td className="p-4 border-b border-slate-100">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                                                profile.role === 'admin' 
                                                    ? 'bg-red-100 text-red-700 border border-red-200' 
                                                    : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                            }`}>
                                                {profile.role || 'customer'}
                                            </span>
                                        </td>
                                        <td className="p-4 border-b border-slate-100 font-mono text-xs text-slate-400">
                                            {profile.id}
                                        </td>
                                        <td className="p-4 border-b border-slate-100 text-slate-500 text-xs">
                                            {new Date(profile.created_at).toLocaleString()}
                                        </td>
                                        <td className="p-4 border-b border-slate-100">
                                            {/* "Columna Acciones: ... agrega un botón ... Hacer Admin" */}
                                            {profile.role !== 'admin' && (
                                                <button
                                                    onClick={() => makeAdmin(profile.id)}
                                                    className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-700 transition-colors flex items-center gap-1 shadow-sm"
                                                >
                                                    <Shield size={12} />
                                                    Hacer Admin
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {profiles.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-slate-400">
                                            No profiles found in 'profiles' table.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
