import { LatLng } from '../../types/Order';
import { ensureMapsLoaded } from './client';

export const getDistance = async (origin: string | LatLng, destination: string | LatLng): Promise<{ distanceKm: number; durationMin: number }> => {
    await ensureMapsLoaded();

    return new Promise((resolve, reject) => {
        const maps = (window as any).google.maps;
        const service = new maps.DistanceMatrixService();

        const originParam = typeof origin === 'string'
            ? origin
            : new maps.LatLng(origin.lat, origin.lng);

        const destParam = typeof destination === 'string'
            ? destination
            : new maps.LatLng(destination.lat, destination.lng);

        service.getDistanceMatrix(
            {
                origins: [originParam],
                destinations: [destParam],
                travelMode: maps.TravelMode.DRIVING,
                unitSystem: maps.UnitSystem.METRIC,
                avoidHighways: false,
                avoidTolls: false,
            },
            (response: any, status: string) => {
                if (status !== 'OK') {
                    reject(new Error(`Distance Matrix failed: ${status}`));
                    return;
                }

                const element = response.rows[0].elements[0];
                if (element.status === 'ZERO_RESULTS' || element.status === 'NOT_FOUND') {
                    reject(new Error('配送ルートが見つかりませんでした。'));
                    return;
                }

                resolve({
                    distanceKm: element.distance.value / 1000,
                    durationMin: Math.ceil(element.duration.value / 60),
                });
            }
        );
    });
};
