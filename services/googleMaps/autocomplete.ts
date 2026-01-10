import { LatLng } from '../../types/Order';
import { ensureMapsLoaded } from './client';

export const geocode = async (address: string): Promise<LatLng> => {
    await ensureMapsLoaded();

    return new Promise((resolve, reject) => {
        const maps = (window as any).google.maps;
        const geocoder = new maps.Geocoder();

        geocoder.geocode({ address }, (results: any, status: string) => {
            if (status === 'OK' && results[0]) {
                const loc = results[0].geometry.location;
                resolve({ lat: loc.lat(), lng: loc.lng() });
            } else {
                reject(new Error(`Geocoding failed: ${status}`));
            }
        });
    });
};

export const reverseGeocode = async (latLng: LatLng): Promise<string> => {
    await ensureMapsLoaded();

    return new Promise((resolve, reject) => {
        const maps = (window as any).google.maps;
        const geocoder = new maps.Geocoder();

        geocoder.geocode({ location: latLng }, (results: any, status: string) => {
            if (status === 'OK' && results[0]) {
                resolve(results[0].formatted_address);
            } else {
                reject(new Error(`Reverse geocoding failed: ${status}`));
            }
        });
    });
};
