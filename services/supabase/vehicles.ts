import { supabase } from './client';
import { DBVehicle } from './types';

export const VehiclesService = {
    async getAll(): Promise<DBVehicle[]> {
        const { data, error } = await supabase
            .from('vehicles')
            .select('*');

        if (error) throw error;
        return data || [];
    },

    async getById(id: number): Promise<DBVehicle | null> {
        const { data, error } = await supabase
            .from('vehicles')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    }
};
