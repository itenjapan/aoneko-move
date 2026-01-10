export const ensureMapsLoaded = async (): Promise<void> => {
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
};
