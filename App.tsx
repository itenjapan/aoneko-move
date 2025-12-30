import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import QuickQuote from './pages/QuickQuote';
import TrackDelivery from './pages/TrackDelivery';
import DriverApp from './pages/DriverApp';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import DriverRegistration from './pages/DriverRegistration';
import AdminDriverPanel from './pages/AdminDriverPanel';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import OfflineIndicator from './components/OfflineIndicator';
import CakeTrackLogo from './components/CakeTrackLogo';
import ProtectedRoute from './components/ProtectedRoute';
import Onboarding from './components/Onboarding';
import { PushNotificationService } from './services/pushNotificationService';
import { PWAChecker } from './utils/pwaChecker';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Load Google Maps JavaScript API script
    const loadGoogleMaps = () => {
      const scriptId = 'google-maps-script';
      // Use the API key provided by the environment
      const apiKey = process.env.API_KEY;

      // Ensure we have a valid key format before attempting to load
      const isInvalidKey = !apiKey || 
                          apiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE' || 
                          apiKey === '' || 
                          apiKey.length < 20 || 
                          apiKey.includes('YOUR_');

      if (isInvalidKey) {
        console.warn('Google Maps API key is missing or invalid in process.env.API_KEY. Map-based features will be disabled.');
        return;
      }

      if (!(window as any).google && !document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        // The script URL is correct. If InvalidKeyMapError persists, the key itself
        // in process.env.API_KEY is likely not authorized for the Maps JS API.
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initMap`;
        script.async = true;
        script.defer = true;
        
        // Add error handling for the script load itself
        script.onerror = () => {
          console.error('Failed to load the Google Maps script. Check your API key and network connection.');
        };

        // Define a global callback to handle initialization if needed
        (window as any).initMap = () => {
          console.log('Google Maps API loaded successfully.');
        };

        document.head.appendChild(script);
      }
    };

    // Initialize PWA
    const initializePWA = async () => {
      // Register service worker
      if ('serviceWorker' in navigator) {
        try {
          // Skip registration if running in a blob/data URL (common in previews)
          if (window.location.protocol === 'blob:' || window.location.protocol === 'data:') {
            console.log('Skipping Service Worker registration in unsupported protocol/environment');
            return;
          }

          await navigator.serviceWorker.register('./sw.js');
          console.log('Service Worker registered successfully');
        } catch (error) {
          console.error('Error registering Service Worker:', error);
        }
      }

      // Initialize notifications on user interaction
      const handleUserInteraction = () => {
        PushNotificationService.initialize();
        document.removeEventListener('click', handleUserInteraction);
      };

      document.addEventListener('click', handleUserInteraction);
      
      // Check PWA status in console
      PWAChecker.displayPWAStatus();
    };

    // Network status handlers
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    loadGoogleMaps();
    initializePWA();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans relative">
          <OfflineIndicator />
          <CakeTrackLogo />
          {/* Global Onboarding Modal - Checks localStorage internally */}
          <Onboarding />
          
          <Routes>
             {/* Standalone Pages - Driver App */}
             <Route 
               path="/driver" 
               element={
                 <ProtectedRoute allowedRoles={['driver']}>
                   <DriverApp />
                 </ProtectedRoute>
               } 
             />
             
             {/* Main Layout Pages */}
             <Route path="*" element={
                <>
                  <Header />
                  <main className="pb-20">
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/quote" element={<QuickQuote />} />
                      <Route path="/tracking" element={<TrackDelivery />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/signup" element={<Signup />} />
                      <Route path="/partner/register" element={<DriverRegistration />} />
                      
                      {/* Protected Customer Route */}
                      <Route 
                        path="/dashboard" 
                        element={
                          <ProtectedRoute allowedRoles={['customer', 'driver']}>
                             <Dashboard />
                          </ProtectedRoute>
                        } 
                      />
                      
                      {/* Protected Admin Route */}
                      <Route 
                        path="/admin/drivers" 
                        element={
                          <ProtectedRoute allowedRoles={['admin']}>
                            <AdminDriverPanel />
                          </ProtectedRoute>
                        } 
                      />
                    </Routes>
                  </main>
                  <footer className="bg-white border-t border-gray-200 py-8 mt-auto">
                    <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
                      <p className="mb-2 text-slate-800 font-bold">お問い合わせ・お見積り</p>
                      <p className="text-xl font-bold text-brand-600 mb-4">0120-502-622</p>
                      <p className="text-slate-600 mb-1">愛知県・岐阜県・三重県</p>
                      <p className="text-xs text-slate-400">&copy; 2025 aoneko.move. All rights reserved.</p>
                    </div>
                  </footer>
                </>
             } />
          </Routes>
          <PWAInstallPrompt />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;