import { useState, useEffect } from 'react';
import { ensureMapsLoaded } from '../services/googleMaps/client';

export const useGoogleMaps = () => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        ensureMapsLoaded()
            .then(() => setIsLoaded(true))
            .catch((err) => setError(err.message));
    }, []);

    return { isLoaded, error };
};
