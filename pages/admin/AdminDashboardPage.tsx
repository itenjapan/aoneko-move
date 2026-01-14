import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase/client';

// --- DEFINICIÓN DE TIPOS INTERNA (Para que no dependa de archivos externos) ---
type Profile = {
    id: string;
    email: string;
    role: string;
    created_at: string;
};

type Order = {
    id: string;
    created_at: string;
    total_customer_price?: number;
    driver_revenue?: number; // Ganancia del conductor
    company_revenue?: number; // Ganancia de la empresa
    driver_id?: string;
    profiles?: Profile;
};

export default function AdminDashboardPage() {
    const [customers, setCustomers] = useState<Profile[]>([]);
    const [drivers, setDrivers] = useState<Profile[]>([]);
    const [recentOrders, setRecentOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setIsLoading(true);
            try {
                // 1. Clientes
                const { data: cData } = await supabase
                    .from('profiles').select('*').eq('role', 'customer').order('created_at', { ascending: false });

                // 2. Conductores
                const { data: dData } = await supabase
                    .from('profiles').select('*').eq('role', 'driver').order('created_at', { ascending: false });

                // 3. Pedidos (usando any para evitar peleas con Typescript por ahora)
                const { data: oData } = await supabase
                    .from('orders')
                    .select('*, profiles:driver_id (id, email)')
                    .order('created_at', { ascending: false })
                    .limit(10);

                setCustomers(cData || []);
                setDrivers(dData || []);
                setRecentOrders(oData as any[] || []);
            } catch (err) {
                console.error('Error:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    // Cálculos de dinero
    const totalRevenue = recentOrders.reduce((sum, order) => sum + (Number(order.company_revenue) || 0), 0);
    const driverEarnings = recentOrders.reduce((sum, order) => sum + (Number(order.driver_revenue) || 0), 0);

    if (isLoading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-cyan-400">Cargando...</div>;

    return (
        <div className="p-8 bg-gray-900 min-h-screen text-gray-100">
            <h1 className="text-3xl font-bold text-cyan-400 mb-8">Puente de Control · Superbridge</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <h3>Clientes</h3>
                    <p className="text-4xl font-bold">{customers.length}</p>
                </div>
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <h3>Conductores</h3>
                    <p className="text-4xl font-bold">{drivers.length}</p>
                </div>
                <div className="bg-gray-800 p-6 rounded-xl border border-cyan-900">
                    <h3 className="text-cyan-400">Ingresos (20%)</h3>
                    <p className="text-3xl font-bold">¥ {totalRevenue.toLocaleString()}</p>
                    <p className="text-xs text-gray-400">Drivers: ¥ {driverEarnings.toLocaleString()}</p>
                </div>
            </div>

            <div className="bg-gray-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm text-gray-400">
                    <thead className="bg-gray-700 text-gray-200">
                        <tr><th className="p-4">Email</th><th className="p-4">Rol</th><th className="p-4">Fecha</th></tr>
                    </thead>
                    <tbody>
                        {[...customers, ...drivers].slice(0, 10).map((u, i) => (
                            <tr key={i} className="border-b border-gray-700">
                                <td className="p-4 text-white">{u.email}</td>
                                <td className="p-4">{u.role}</td>
                                <td className="p-4">{new Date(u.created_at).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}