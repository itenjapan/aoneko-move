export type UserType = 'customer' | 'driver' | 'admin';

export interface User {
    id: string;
    email: string;
    name: string;
    phone?: string;
    aonekoId?: string;
    userType: UserType;
    password?: string;
}

export interface Driver extends User {
    vehicleType: 'keivan' | 'keitruck';
    licensePlate: string;
    isOnline: boolean;
    rating: number;
    totalRides: number;
}
