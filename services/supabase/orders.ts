import { supabase } from './client';
import { DBOrder } from './types';

export const OrdersService = {
    async create(order: DBOrder): Promise<DBOrder> {
        const { data, error } = await supabase
            .from('orders')
            .insert(order)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async getByUserId(userId: string): Promise<DBOrder[]> {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('user_id', userId);

        if (error) throw error;
        return data || [];
    }
};
