import React, { useState, useEffect, useRef } from 'react';
import { supabase, Vehicle } from '../services/supabase';
import { googleMapsLoader, calculateRouteDistance } from '../services/googleMaps';
import { usePricingCalculator } from '../hooks/usePricingCalculator';
import PriceBreakdown from './PriceBreakdown';

const OrderForm: React.FC = () => {
    // --- Estados ---
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [calculating, setCalculating] = useState<boolean>(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

    // Inputs del usuario
    const [selectedVehicleId, setSelectedVehicleId] = useState<number | ''>('');
    const [pickupAddress, setPickupAddress] = useState<string>('');
    const [deliveryAddress, setDeliveryAddress] = useState<string>('');
    const [highwayToll, setHighwayToll] = useState<number>(0);
    const [loadingFee, setLoadingFee] = useState<0 | 1000 | 1500>(0);
    const [waitingFee, setWaitingFee] = useState<number>(0);
    const [waitingTimeMinutes, setWaitingTimeMinutes] = useState<number>(0); // Auxiliar para input

    // Datos calculados
    const [distanceKm, setDistanceKm] = useState<number>(0);

    // Refs para Google Maps Autocomplete
    const pickupInputRef = useRef<HTMLInputElement>(null);
    const deliveryInputRef = useRef<HTMLInputElement>(null);

    // --- Carga Inicial de Datos ---
    useEffect(() => {
        const fetchVehicles = async () => {
            const { data, error } = await supabase.from('vehicles').select('*');
            if (error) console.error('Error cargando vehículos:', error);
            else setVehicles(data || []);
            setLoading(false);
        };
        fetchVehicles();
    }, []);

    // --- Inicialización de Google Maps Autocomplete ---
    useEffect(() => {
        googleMapsLoader.load().then((google) => {
            if (!pickupInputRef.current || !deliveryInputRef.current) return;

            const options = {
                componentRestrictions: { country: 'jp' },
                fields: ['formatted_address', 'geometry'],
            };

            // Autocomplete Recogida
            const pickupAutocomplete = new google.maps.places.Autocomplete(pickupInputRef.current, options);
            pickupAutocomplete.addListener('place_changed', () => {
                const place = pickupAutocomplete.getPlace();
                if (place.formatted_address) {
                    setPickupAddress(place.formatted_address);
                    checkAndCalculateDistance(place.formatted_address, deliveryAddress);
                }
            });

            // Autocomplete Entrega
            const deliveryAutocomplete = new google.maps.places.Autocomplete(deliveryInputRef.current, options);
            deliveryAutocomplete.addListener('place_changed', () => {
                const place = deliveryAutocomplete.getPlace();
                if (place.formatted_address) {
                    setDeliveryAddress(place.formatted_address);
                    checkAndCalculateDistance(pickupAddress, place.formatted_address);
                }
            });
        });
    }, [pickupAddress, deliveryAddress]); // Dependencias para tener el valor actualizado del otro campo

    // --- Lógica de Distancia ---
    const checkAndCalculateDistance = async (origin: string, dest: string) => {
        if (origin && dest && origin.length > 5 && dest.length > 5) {
            setCalculating(true);
            const km = await calculateRouteDistance(origin, dest);
            setDistanceKm(km || 0);
            setCalculating(false);
        }
    };

    // --- Lógica de Tiempo de Espera ---
    // 1000 JPY por cada 15 min extra (primeros 30 min gratis)
    useEffect(() => {
        if (waitingTimeMinutes <= 30) {
            setWaitingFee(0);
        } else {
            const extraMinutes = waitingTimeMinutes - 30;
            const blocksOf15 = Math.ceil(extraMinutes / 15);
            setWaitingFee(blocksOf15 * 1000);
        }
    }, [waitingTimeMinutes]);

    // --- Uso del Hook de Precios ---
    const selectedVehicle = vehicles.find(v => v.id === Number(selectedVehicleId)) || null;

    const pricing = usePricingCalculator({
        vehicle: selectedVehicle,
        distance_km: distanceKm,
        highway_toll: highwayToll,
        loading_fee: loadingFee,
        waiting_fee: waitingFee,
    });

    // --- Guardar en Base de Datos ---
    const handleSaveQuote = async () => {
        if (!pricing.isValid || !selectedVehicle) return;

        setSaveStatus('saving');
        const { error } = await supabase.from('orders').insert({
            vehicle_id: selectedVehicle.id,
            pickup_address: pickupAddress,
            delivery_address: deliveryAddress,
            distance_km: distanceKm,
            base_fare: pricing.base_fare,
            highway_toll: highwayToll,
            loading_fee: loadingFee,
            waiting_fee: waitingFee,
            net_price: pricing.net_price,
            tax_amount: pricing.tax_amount,
            total_customer_price: pricing.total_customer_price,
            company_revenue: pricing.company_revenue,
            driver_revenue: pricing.driver_revenue,
            status: 'quote',
        });

        if (error) {
            console.error(error);
            setSaveStatus('error');
        } else {
            setSaveStatus('success');
            alert('¡Cotización guardada exitosamente! / 見積もりが保存されました');
        }
    };

    // --- Render ---
    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', fontFamily: '"Noto Sans JP", sans-serif' }}>
            {/* AONEKO LOGO PLACEHOLDER 
        Recuerdo que mencionaste el logo de Aoneko. Aquí iría idealmente:
        <img src="/aoneko-logo.png" alt="Aonekomove" style={{ width: '120px', margin: '0 auto' }} />
      */}
            <h2 style={{ textAlign: 'center', color: '#0056b3' }}>AONEKOMOVE Logistics</h2>

            {loading ? <p>Cargando sistema...</p> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>

                    {/* 1. Selección de Vehículo */}
                    <div>
                        <label style={labelStyle}>Vehículo / 車両タイプ</label>
                        <select
                            style={inputStyle}
                            value={selectedVehicleId}
                            onChange={(e) => setSelectedVehicleId(Number(e.target.value))}
                        >
                            <option value="">Seleccione un vehículo...</option>
                            {vehicles.map(v => (
                                <option key={v.id} value={v.id}>
                                    {v.name_jp} ({v.name_es})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* 2. Direcciones */}
                    <div>
                        <label style={labelStyle}>Recogida / 積込地</label>
                        <input
                            ref={pickupInputRef}
                            style={inputStyle}
                            type="text"
                            placeholder="Escribe la dirección..."
                            onChange={(e) => setPickupAddress(e.target.value)}
                        />
                    </div>

                    <div>
                        <label style={labelStyle}>Entrega / 納品地</label>
                        <input
                            ref={deliveryInputRef}
                            style={inputStyle}
                            type="text"
                            placeholder="Escribe la dirección..."
                            onChange={(e) => setDeliveryAddress(e.target.value)}
                        />
                    </div>

                    {/* Indicador de Distancia */}
                    {calculating && <p style={{ color: '#666', fontSize: '0.9rem' }}>🔄 Calculando ruta...</p>}
                    {distanceKm > 0 && (
                        <div style={{ backgroundColor: '#e3f2fd', padding: '10px', borderRadius: '6px' }}>
                            <strong>Distancia calculada:</strong> {distanceKm} km
                        </div>
                    )}

                    {/* 3. Extras */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div>
                            <label style={labelStyle}>Peajes (JPY) / 高速料金</label>
                            <input
                                style={inputStyle}
                                type="number"
                                min="0"
                                value={highwayToll}
                                onChange={(e) => setHighwayToll(Number(e.target.value))}
                            />
                        </div>

                        <div>
                            <label style={labelStyle}>Ayuda Carga / 積込補助</label>
                            <select
                                style={inputStyle}
                                value={loadingFee}
                                onChange={(e) => setLoadingFee(Number(e.target.value) as 0 | 1000 | 1500)}
                            >
                                <option value={0}>Ninguna (0円)</option>
                                <option value={1000}>Básica (1000円)</option>
                                <option value={1500}>Completa (1500円)</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label style={labelStyle}>Tiempo Total de Espera (min) / 待機時間</label>
                        <input
                            style={inputStyle}
                            type="number"
                            min="0"
                            placeholder="Ej. 45 minutos"
                            value={waitingTimeMinutes}
                            onChange={(e) => setWaitingTimeMinutes(Number(e.target.value))}
                        />
                        <small style={{ color: '#666' }}>30 min gratis. +1000円/15min extra.</small>
                    </div>

                    {/* 4. Resultados y Botón */}
                    <PriceBreakdown pricing={pricing} debugMode={true} />

                    <button
                        onClick={handleSaveQuote}
                        disabled={!pricing.isValid || saveStatus === 'saving'}
                        style={{
                            padding: '15px',
                            backgroundColor: '#0056b3',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '1.1rem',
                            fontWeight: 'bold',
                            cursor: pricing.isValid ? 'pointer' : 'not-allowed',
                            opacity: pricing.isValid ? 1 : 0.6,
                            marginTop: '10px'
                        }}
                    >
                        {saveStatus === 'saving' ? 'Guardando...' : 'Guardar Cotización / 見積もり保存'}
                    </button>

                    {saveStatus === 'error' && <p style={{ color: 'red' }}>Error al guardar. Intente de nuevo.</p>}
                </div>
            )}
        </div>
    );
};

// Estilos rápidos para inputs
const inputStyle = {
    width: '100%',
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #ccc',
    fontSize: '1rem',
    marginTop: '5px'
};

const labelStyle = {
    fontWeight: 'bold',
    fontSize: '0.9rem',
    color: '#333'
};

export default OrderForm;
