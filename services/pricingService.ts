import { QuoteRequest, QuoteResponse } from '../types';
import { VEHICLES } from '../constants';
import { GoogleMapsService } from './googleMapsService';

export class PricingService {
  static async calculateQuote(request: QuoteRequest): Promise<QuoteResponse> {
    // 1. Obtener distancia y tiempo reales por carretera
    const { distanceKm, durationMin } = await GoogleMapsService.getDistance(
      request.pickupAddress,
      request.deliveryAddress
    );

    const vehicle = VEHICLES.find(v => v.id === request.vehicleType);
    if (!vehicle) throw new Error('Vehicle not found');

    // 2. Cálculo Base
    const basePrice = vehicle.basePrice;
    const distancePrice = Math.round(distanceKm * vehicle.perKmPrice);
    const helperFee = request.helperService ? 1000 : 0;

    // 3. Recargos por Carga Extra
    const STANDARD_BOX_LIMIT = 6;
    const BOX_SURCHARGE = 500;
    const STANDARD_SUITCASE_LIMIT = 6;
    const SUITCASE_SURCHARGE = 800;

    let cargoSurcharge = 0;
    if (request.boxes > STANDARD_BOX_LIMIT) {
      cargoSurcharge += (request.boxes - STANDARD_BOX_LIMIT) * BOX_SURCHARGE;
    }
    if (request.suitcases > STANDARD_SUITCASE_LIMIT) {
      cargoSurcharge += (request.suitcases - STANDARD_SUITCASE_LIMIT) * SUITCASE_SURCHARGE;
    }

    // 4. Peajes (Simulado basado en distancia y preferencia)
    let tollFee = 0;
    if (request.useHighway) {
      tollFee = 500 + Math.ceil(distanceKm * 25);
    }

    // 5. Recargos por Tiempo/Urgencia
    const now = new Date();
    const pickupTime = new Date(request.pickupTime);
    const diffInHours = (pickupTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    let timeSurchargeFee = 0;
    let timeSurchargeLabel = '通常予約';

    if (diffInHours < 2) {
      timeSurchargeFee = 2000;
      timeSurchargeLabel = '特急料金 (2時間以内)';
    } else if (diffInHours < 24) {
      timeSurchargeFee = 1000;
      timeSurchargeLabel = 'お急ぎ料金 (24時間以内)';
    }

    const subTotal = basePrice + distancePrice + timeSurchargeFee + helperFee + cargoSurcharge + tollFee;
    const tax = Math.floor(subTotal * 0.10); // 10% Consumer Tax
    const totalPrice = subTotal + tax;

    return {
      id: Math.random().toString(36).substring(7),
      basePrice,
      distancePrice,
      timeSurchargeFee,
      timeSurchargeLabel,
      helperFee,
      cargoSurcharge,
      tollFee,
      totalPrice, // Now includes tax
      tax,        // Return tax amount for potential display
      subTotal,   // Return subtotal
      estimatedDistance: parseFloat(distanceKm.toFixed(1)),
      estimatedTime: durationMin
    };
  }
}