export interface Vehicle {
    id: string;
    name: string;
    displayName: string;
    basePrice: number;
    perKmPrice: number;
    capacity: string;
    dimensions: string;
    maxWeight: number;
    description: string;
    icon: string;
    image: string;
    hasNoHeightLimit?: boolean;
}

export interface Plan {
    id: string;
    name: string;
    price: string;
    description: string;
    features: string[];
    recommended?: boolean;
}
