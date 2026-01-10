/**
 * Fórmulas Sagradas de Aoneko Move
 * Centralización del corazón matemático para transparencia radical.
 */

export const REVENUE_SPLIT = {
    DRIVER_PERCENTAGE: 0.80, // El 80% Justo
    COMPANY_PERCENTAGE: 0.20 // El 20% necesario para sostener el puente
};

export const calculateBaseFare = (vehicleBasePrice: number, distanceKm: number) => {
    return vehicleBasePrice + Math.round(distanceKm * 400);
};

export const calculateNetPrice = (baseFare: number, tollFee: number, extraFees: number) => {
    return baseFare + tollFee + extraFees;
};

export const calculateTax = (netPrice: number) => {
    return Math.round(netPrice * 0.10);
};

export const calculateTotalCustomerPrice = (netPrice: number, tax: number) => {
    return netPrice + tax;
};

export const calculateCompanyRevenue = (netPrice: number) => {
    return Math.round(netPrice * 0.20);
};

export const calculateDriverRevenue = (netPrice: number, companyRevenue: number) => {
    return netPrice - companyRevenue;
};

export const calculateCompleteBreakdown = (
    vehicle: { base_price: number },
    distance_km: number,
    highway_toll: number,
    loading_fee: number,
    waiting_fee: number
) => {
    const base_fare = calculateBaseFare(vehicle.base_price, distance_km);
    const net_price = calculateNetPrice(base_fare, highway_toll, loading_fee + waiting_fee);
    const tax_amount = calculateTax(net_price);
    const total_customer_price = calculateTotalCustomerPrice(net_price, tax_amount);
    const company_revenue = calculateCompanyRevenue(net_price);
    const driver_revenue = calculateDriverRevenue(net_price, company_revenue);

    return {
        base_fare,
        net_price,
        tax_amount,
        total_customer_price,
        company_revenue,
        driver_revenue
    };
};
