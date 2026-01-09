import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan las variables de entorno de Supabase');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Interfaces de Base de Datos
export interface Vehicle {
  id: number;
  name_es: string;
  name_jp: string;
  base_price: number;
  price_per_km: number;
}

export interface Order {
  vehicle_id: number;
  pickup_address: string;
  delivery_address: string;
  distance_km: number;
  base_fare: number;
  highway_toll: number;
  loading_fee: number;
  waiting_fee: number;
  net_price: number;
  tax_amount: number;
  total_customer_price: number;
  company_revenue: number;
  driver_revenue: number;
  status: 'quote' | 'confirmed';
}
