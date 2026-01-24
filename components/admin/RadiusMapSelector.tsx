'use client';

import { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from 'react-leaflet';
import { TargetRadiusConfig } from '@/types';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface RadiusMapSelectorProps {
  value: TargetRadiusConfig | null;
  onChange: (config: TargetRadiusConfig | null) => void;
}

// Fix for default marker icon
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Component to handle map clicks
function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Component to recenter map
function MapCenterUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function RadiusMapSelector({ value, onChange }: RadiusMapSelectorProps) {
  const [searchAddress, setSearchAddress] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [radiusKm, setRadiusKm] = useState(value?.radiusKm || 10);
  const [center, setCenter] = useState<[number, number]>(
    value ? [value.centerLat, value.centerLng] : [-23.5505, -46.6333] // Default: São Paulo
  );
  const [centerName, setCenterName] = useState(value?.centerName || '');

  // Update parent when values change
  useEffect(() => {
    if (center) {
      onChange({
        centerLat: center[0],
        centerLng: center[1],
        radiusKm,
        centerName: centerName || undefined,
      });
    }
  }, [center, radiusKm, centerName, onChange]);

  // Handle map click
  const handleMapClick = useCallback((lat: number, lng: number) => {
    setCenter([lat, lng]);
    setCenterName('');
  }, []);

  // Search address using Nominatim
  const searchLocation = async () => {
    if (!searchAddress.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchAddress)}&limit=1`
      );
      const data = await response.json();

      if (data.length > 0) {
        const { lat, lon, display_name } = data[0];
        setCenter([parseFloat(lat), parseFloat(lon)]);
        setCenterName(display_name.split(',')[0]); // Use first part of address
      } else {
        alert('Endereço não encontrado. Tente ser mais específico.');
      }
    } catch (error) {
      console.error('Error searching address:', error);
      alert('Erro ao buscar endereço. Tente novamente.');
    } finally {
      setIsSearching(false);
    }
  };

  // Get current location
  const useCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCenter([position.coords.latitude, position.coords.longitude]);
          setCenterName('Minha localização');
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Não foi possível obter sua localização.');
        }
      );
    } else {
      alert('Geolocalização não suportada pelo navegador.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="flex gap-2">
        <input
          type="text"
          value={searchAddress}
          onChange={(e) => setSearchAddress(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && searchLocation()}
          placeholder="Buscar endereço (ex: Rua Augusta, São Paulo)"
          className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-900 text-sm"
        />
        <button
          type="button"
          onClick={searchLocation}
          disabled={isSearching}
          className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-medium text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {isSearching ? 'Buscando...' : 'Buscar'}
        </button>
        <button
          type="button"
          onClick={useCurrentLocation}
          className="px-3 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          title="Usar minha localização"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      {/* Map */}
      <div className="w-full h-[300px] rounded-xl overflow-hidden border border-gray-200">
        <MapContainer
          center={center}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onMapClick={handleMapClick} />
          <MapCenterUpdater center={center} />

          {/* Center marker */}
          <Marker position={center} icon={defaultIcon} />

          {/* Radius circle */}
          <Circle
            center={center}
            radius={radiusKm * 1000} // km to meters
            pathOptions={{
              color: '#6366F1',
              fillColor: '#6366F1',
              fillOpacity: 0.15,
              weight: 2,
            }}
          />
        </MapContainer>
      </div>

      {/* Instructions */}
      <p className="text-xs text-gray-500 text-center">
        Clique no mapa para definir o ponto central ou busque um endereço
      </p>

      {/* Radius slider */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">Raio de alcance</label>
          <span className="text-sm font-bold text-indigo-600">{radiusKm} km</span>
        </div>
        <input
          type="range"
          min="1"
          max="100"
          value={radiusKm}
          onChange={(e) => setRadiusKm(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>1 km</span>
          <span>50 km</span>
          <span>100 km</span>
        </div>
      </div>

      {/* Center name input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nome do ponto central (opcional)
        </label>
        <input
          type="text"
          value={centerName}
          onChange={(e) => setCenterName(e.target.value)}
          placeholder="Ex: Sede da empresa, Loja principal"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-900 text-sm"
        />
      </div>

      {/* Current coordinates display */}
      <div className="bg-gray-50 rounded-lg p-3">
        <p className="text-xs text-gray-500">
          Coordenadas: <span className="font-mono text-gray-700">{center[0].toFixed(6)}, {center[1].toFixed(6)}</span>
        </p>
      </div>
    </div>
  );
}
