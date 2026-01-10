import { useState, useEffect } from 'react';
import { VehiclesService } from '../services/supabase/vehicles';
import { OrdersService } from '../services/supabase/orders';
import { DBVehicle, DBOrder } from '../services/supabase/types';

export const useSupabaseData = () => {
    const [vehicles, setVehicles] = useState<DBVehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const data = await VehiclesService.getAll();
                setVehicles(data);
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, []);

    const createOrder = async (order: DBOrder) => {
        return await OrdersService.create(order);
    };

    return { vehicles, loading, error, createOrder };
};
