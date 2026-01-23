// ============================================
// GEOCODING - Google Maps Geocoding API
// ============================================

export interface GeocodingResult {
  success: boolean;
  latitude?: number;
  longitude?: number;
  formattedAddress?: string;
  error?: string;
}

export interface AddressComponents {
  address?: string;
  addressNumber?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

// Verificar se Google Maps API está configurada
export function isGoogleMapsConfigured(): boolean {
  return !!process.env.GOOGLE_MAPS_API_KEY;
}

// Montar endereço completo a partir dos componentes
export function buildFullAddress(components: AddressComponents): string {
  const parts: string[] = [];

  if (components.address) {
    let streetPart = components.address;
    if (components.addressNumber) {
      streetPart += `, ${components.addressNumber}`;
    }
    parts.push(streetPart);
  }

  if (components.complement) {
    parts.push(components.complement);
  }

  if (components.neighborhood) {
    parts.push(components.neighborhood);
  }

  if (components.city) {
    let cityPart = components.city;
    if (components.state) {
      cityPart += ` - ${components.state}`;
    }
    parts.push(cityPart);
  }

  if (components.zipCode) {
    parts.push(components.zipCode);
  }

  parts.push('Brasil'); // Sempre adicionar país para melhor precisão

  return parts.join(', ');
}

// Geocodificar endereço usando Google Maps Geocoding API
export async function geocodeAddress(address: string): Promise<GeocodingResult> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      error: 'Google Maps API key não configurada',
    };
  }

  if (!address || address.trim().length < 5) {
    return {
      success: false,
      error: 'Endereço muito curto ou inválido',
    };
  }

  try {
    const encodedAddress = encodeURIComponent(address.trim());
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}&language=pt-BR&region=br`;

    const response = await fetch(url);

    if (!response.ok) {
      return {
        success: false,
        error: `Erro na requisição: ${response.status}`,
      };
    }

    const data = await response.json();

    if (data.status === 'ZERO_RESULTS') {
      return {
        success: false,
        error: 'Endereço não encontrado',
      };
    }

    if (data.status !== 'OK') {
      return {
        success: false,
        error: `Erro do Google Maps: ${data.status}`,
      };
    }

    const result = data.results[0];
    const location = result.geometry.location;

    return {
      success: true,
      latitude: location.lat,
      longitude: location.lng,
      formattedAddress: result.formatted_address,
    };
  } catch (error) {
    console.error('[Geocoding] Erro ao geocodificar:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao geocodificar endereço',
    };
  }
}

// Geocodificar a partir de componentes de endereço
export async function geocodeAddressComponents(
  components: AddressComponents
): Promise<GeocodingResult> {
  const fullAddress = buildFullAddress(components);
  return geocodeAddress(fullAddress);
}

// Geocodificação reversa (coordenadas para endereço)
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<{
  success: boolean;
  address?: AddressComponents;
  formattedAddress?: string;
  error?: string;
}> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      error: 'Google Maps API key não configurada',
    };
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}&language=pt-BR`;

    const response = await fetch(url);

    if (!response.ok) {
      return {
        success: false,
        error: `Erro na requisição: ${response.status}`,
      };
    }

    const data = await response.json();

    if (data.status !== 'OK') {
      return {
        success: false,
        error: `Erro do Google Maps: ${data.status}`,
      };
    }

    const result = data.results[0];
    const addressComponents: AddressComponents = {};

    // Extrair componentes do endereço
    for (const component of result.address_components) {
      const types = component.types;

      if (types.includes('route')) {
        addressComponents.address = component.long_name;
      } else if (types.includes('street_number')) {
        addressComponents.addressNumber = component.long_name;
      } else if (types.includes('sublocality_level_1') || types.includes('neighborhood')) {
        addressComponents.neighborhood = component.long_name;
      } else if (types.includes('administrative_area_level_2')) {
        addressComponents.city = component.long_name;
      } else if (types.includes('administrative_area_level_1')) {
        addressComponents.state = component.short_name;
      } else if (types.includes('postal_code')) {
        addressComponents.zipCode = component.long_name;
      } else if (types.includes('country')) {
        addressComponents.country = component.long_name;
      }
    }

    return {
      success: true,
      address: addressComponents,
      formattedAddress: result.formatted_address,
    };
  } catch (error) {
    console.error('[Geocoding] Erro na geocodificação reversa:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro na geocodificação reversa',
    };
  }
}

// Validar coordenadas (dentro do Brasil aproximadamente)
export function isValidBrazilCoordinates(lat: number, lng: number): boolean {
  // Brasil: lat de -33 a 5, lng de -74 a -32 (aproximadamente)
  return lat >= -34 && lat <= 6 && lng >= -75 && lng <= -30;
}

// Calcular distância entre dois pontos (usando Haversine)
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
