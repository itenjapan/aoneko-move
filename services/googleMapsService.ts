import { LatLng } from '../types';

export class GoogleMapsService {
  /**
   * Helper to ensure the Google Maps API is available.
   */
  private static async ensureMapsLoaded(): Promise<void> {
    if ((window as any).google?.maps) return;

    return new Promise((resolve, reject) => {
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if ((window as any).google?.maps) {
          clearInterval(interval);
          resolve();
        } else if (attempts > 50) {
          clearInterval(interval);
          reject(new Error('Google Maps API failed to load or key is invalid.'));
        }
      }, 100);
    });
  }

  /**
   * Calcula la distancia real por carretera entre dos puntos usando Distance Matrix.
   */
  static async getDistance(origin: string | LatLng, destination: string | LatLng): Promise<{ distanceKm: number; durationMin: number }> {
    await this.ensureMapsLoaded();

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
            reject(new Error(`Distance Matrix failed: ${status}. Check if Distance Matrix API is enabled for your key.`));
            return;
          }

          const element = response.rows[0].elements[0];
          if (element.status === 'ZERO_RESULTS' || element.status === 'NOT_FOUND') {
            reject(new Error('配送ルートが見つかりませんでした。住所を正確に入力してください。'));
            return;
          }

          resolve({
            distanceKm: element.distance.value / 1000,
            durationMin: Math.ceil(element.duration.value / 60),
          });
        }
      );
    });
  }

  /**
   * Geocodifica una dirección de texto a coordenadas LatLng.
   */
  static async geocode(address: string): Promise<LatLng> {
    await this.ensureMapsLoaded();

    return new Promise((resolve, reject) => {
      const maps = (window as any).google.maps;
      const geocoder = new maps.Geocoder();
      
      geocoder.geocode({ address }, (results: any, status: string) => {
        if (status === 'OK' && results[0]) {
          const loc = results[0].geometry.location;
          resolve({ lat: loc.lat(), lng: loc.lng() });
        } else {
          reject(new Error(`Geocoding failed: ${status}. Check if Geocoding API is enabled for your key.`));
        }
      });
    });
  }

  /**
   * Geocodifica coordenadas LatLng a una dirección de texto.
   */
  static async reverseGeocode(latLng: LatLng): Promise<string> {
    await this.ensureMapsLoaded();

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
  }
}