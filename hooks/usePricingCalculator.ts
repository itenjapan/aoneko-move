import { useMemo } from 'react';

export interface PricingInput {
    vehicle: { base_price: number; price_per_km: number } | null;
    distance_km: number;
    highway_toll: number;
    loading_fee: number; // 0, 1000, 1500
    waiting_fee: number;
}

export interface PricingOutput {
    base_fare: number;
    net_price: number;
    tax_amount: number;
    total_customer_price: number;
    company_revenue: number;
    driver_revenue: number;
    isValid: boolean;
}

export const usePricingCalculator = (input: PricingInput): PricingOutput => {
    return useMemo(() => {
        // Si no hay vehículo o distancia, retornamos ceros
        if (!input.vehicle || input.distance_km <= 0) {
            return {
                base_fare: 0,
                net_price: 0,
                tax_amount: 0,
                total_customer_price: 0,
                company_revenue: 0,
                driver_revenue: 0,
                isValid: false,
            };
        }

        // 1. Tarifa Base: vehicle.base_price + (distance_km * 400)
        // Redondeamos la parte de distancia para asegurar enteros en JPY
        const distanceCost = Math.round(input.distance_km * input.vehicle.price_per_km);
        const base_fare = input.vehicle.base_price + distanceCost;

        // 2. Precio Neto
        const net_price = base_fare + input.highway_toll + input.loading_fee + input.waiting_fee;

        // 3. Impuesto (10%)
        const tax_amount = Math.round(net_price * 0.10);

        // 4. Precio Total al Cliente
        const total_customer_price = net_price + tax_amount;

        // 5. Ingreso Empresa (20% del NETO)
        const company_revenue = Math.round(net_price * 0.20);

        // 6. Ingreso Conductor (80% del NETO)
        const driver_revenue = net_price - company_revenue;

        return {
            base_fare,
            net_price,
            tax_amount,
            total_customer_price,
            company_revenue,
            driver_revenue,
            isValid: true,
        };
    }, [input.vehicle, input.distance_km, input.highway_toll, input.loading_fee, input.waiting_fee]);
};
