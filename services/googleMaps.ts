import { Loader } from '@googlemaps/js-api-loader';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export const googleMapsLoader = new Loader({
    apiKey: GOOGLE_MAPS_API_KEY,
    version: 'weekly',
    libraries: ['places'], // Necesario para Autocomplete
    language: 'ja',        // Japonés para la interfaz de mapas
    region: 'JP',          // Región Japón
});

/**
 * Calcula la distancia entre dos direcciones usando Distance Matrix API
 */
export const calculateRouteDistance = async (
    origin: string,
    destination: string
): Promise<number | null> => {
    try {
        const google = await googleMapsLoader.load();
        const service = new google.maps.DistanceMatrixService();

        const response = await service.getDistanceMatrix({
            origins: [origin],
            destinations: [destination],
            travelMode: google.maps.TravelMode.DRIVING,
            unitSystem: google.maps.UnitSystem.METRIC,
        });

        const element = response.rows[0].elements[0];

        if (element.status === 'OK' && element.distance) {
            // La API devuelve distancia en metros, convertimos a km con 2 decimales
            const distanceInMeters = element.distance.value;
            const distanceInKm = parseFloat((distanceInMeters / 1000).toFixed(2));
            return distanceInKm;
        } else {
            console.error('Error calculando distancia:', element.status);
            return null;
        }
    } catch (error) {
        console.error('Error en servicio Google Maps:', error);
        return null;
    }
};
