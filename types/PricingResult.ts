export interface PricingResult {
    id: string;
    startingPrice: number; // For detailed breakdown
    basePrice: number;
    distancePrice: number;
    timeSurchargeFee: number;
    timeSurchargeLabel: string;
    helperFee: number;
    cargoSurcharge: number;
    tollFee: number;
    totalPrice: number;
    totalCustomerPrice: number; // For radical transparency
    tax: number;
    subTotal: number;
    companyRevenue: number;
    driverRevenue: number;
    estimatedDistance: number;
    estimatedTime: number;
}

export type QuoteResponse = PricingResult; // Alias for compatibility
