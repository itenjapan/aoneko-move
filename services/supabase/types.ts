export interface DBVehicle {
    id: number;
    name_es: string;
    name_jp: string;
    base_price: number;
    price_per_km: number;
}

export interface DBOrder {
    id?: number;
    vehicle_id: number;
    pickup_address: string;
    delivery_address: string;
    distance_km: number;
    base_fare: number;
    highway_toll: number;
    loading_fee: number;
    waiting_fee?: number;
    net_price: number;
    tax_amount: number;
    total_customer_price: number;
    company_revenue: number;
    driver_revenue: number;
    status: 'quote' | 'confirmed';
    customer_name?: string;
    customer_email?: string;
    pickup_lat?: number;
    pickup_lng?: number;
    delivery_lat?: number;
    delivery_lng?: number;
    user_id?: string | null;
}
