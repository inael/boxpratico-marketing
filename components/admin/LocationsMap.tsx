'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Condominium, Monitor } from '@/types';

// Dynamic import to avoid SSR issues with Leaflet
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);
const Circle = dynamic(
  () => import('react-leaflet').then((mod) => mod.Circle),
  { ssr: false }
);

interface LocationsMapProps {
  locations: Condominium[];
  monitors: Monitor[];
  selectedLocationId?: string;
  onLocationSelect?: (locationId: string) => void;
  radiusKm?: number; // Raio em km para mostrar alcance
  centerLat?: number;
  centerLng?: number;
}

export default function LocationsMap({
  locations,
  monitors,
  selectedLocationId,
  onLocationSelect,
  radiusKm,
  centerLat,
  centerLng,
}: LocationsMapProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [L, setL] = useState<typeof import('leaflet') | null>(null);

  useEffect(() => {
    setIsMounted(true);
    // Import Leaflet dynamically
    import('leaflet').then((leaflet) => {
      setL(leaflet.default);
    });
  }, []);

  // Filtrar locais com coordenadas
  const locationsWithCoords = locations.filter(
    (loc) => loc.latitude && loc.longitude
  );

  // Calcular centro do mapa
  const getMapCenter = (): [number, number] => {
    if (centerLat && centerLng) {
      return [centerLat, centerLng];
    }
    if (locationsWithCoords.length === 0) {
      // Centro do Brasil
      return [-15.7801, -47.9292];
    }
    // Média das coordenadas
    const avgLat =
      locationsWithCoords.reduce((sum, loc) => sum + (loc.latitude || 0), 0) /
      locationsWithCoords.length;
    const avgLng =
      locationsWithCoords.reduce((sum, loc) => sum + (loc.longitude || 0), 0) /
      locationsWithCoords.length;
    return [avgLat, avgLng];
  };

  // Contar monitores por local
  const getMonitorCount = (locationId: string): number => {
    return monitors.filter((m) => m.condominiumId === locationId && m.isActive).length;
  };

  // Contar monitores online por local
  const getOnlineMonitorCount = (locationId: string): number => {
    return monitors.filter(
      (m) => m.condominiumId === locationId && m.isActive && m.isOnline
    ).length;
  };

  if (!isMounted || !L) {
    return (
      <div className="w-full h-[400px] bg-gray-100 rounded-xl flex items-center justify-center">
        <div className="text-gray-500">Carregando mapa...</div>
      </div>
    );
  }

  // Criar ícone customizado
  const createIcon = (isSelected: boolean, isOnline: boolean) => {
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div class="relative">
          <div class="w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${
            isSelected
              ? 'bg-indigo-600 ring-4 ring-indigo-500/30'
              : isOnline
              ? 'bg-green-500'
              : 'bg-gray-400'
          }">
            <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          ${isOnline ? '<div class="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse border-2 border-white"></div>' : ''}
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });
  };

  return (
    <div className="relative w-full h-[400px] rounded-xl overflow-hidden border border-gray-200">
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />
      <style jsx global>{`
        .custom-marker {
          background: transparent;
          border: none;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 12px;
        }
        .leaflet-popup-content {
          margin: 12px 16px;
        }
      `}</style>
      <MapContainer
        center={getMapCenter()}
        zoom={locationsWithCoords.length > 0 ? 12 : 4}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Círculo de raio se configurado */}
        {radiusKm && centerLat && centerLng && (
          <Circle
            center={[centerLat, centerLng]}
            radius={radiusKm * 1000} // Converter km para metros
            pathOptions={{
              color: '#6366F1',
              fillColor: '#6366F1',
              fillOpacity: 0.1,
              weight: 2,
            }}
          />
        )}

        {/* Marcadores dos locais */}
        {locationsWithCoords.map((location) => {
          const monitorCount = getMonitorCount(location.id);
          const onlineCount = getOnlineMonitorCount(location.id);
          const isSelected = location.id === selectedLocationId;
          const hasOnline = onlineCount > 0;

          return (
            <Marker
              key={location.id}
              position={[location.latitude!, location.longitude!]}
              icon={createIcon(isSelected, hasOnline)}
              eventHandlers={{
                click: () => onLocationSelect?.(location.id),
              }}
            >
              <Popup>
                <div className="min-w-[200px]">
                  <h3 className="font-bold text-gray-900 text-base mb-1">
                    {location.name}
                  </h3>
                  {location.address && (
                    <p className="text-xs text-gray-500 mb-2">{location.address}</p>
                  )}
                  {location.city && location.state && (
                    <p className="text-xs text-gray-500 mb-2">
                      {location.city}, {location.state}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        hasOnline
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {onlineCount}/{monitorCount} tela{monitorCount !== 1 ? 's' : ''}{' '}
                      online
                    </span>
                  </div>
                  {onLocationSelect && (
                    <button
                      onClick={() => onLocationSelect(location.id)}
                      className="mt-3 w-full px-3 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Selecionar Local
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Legenda */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 z-[1000]">
        <div className="text-xs font-semibold text-gray-700 mb-2">Legenda</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-xs text-gray-600">Online</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-400"></div>
            <span className="text-xs text-gray-600">Offline</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
            <span className="text-xs text-gray-600">Selecionado</span>
          </div>
        </div>
      </div>

      {locationsWithCoords.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100/80 z-[1000]">
          <div className="text-center p-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <p className="text-gray-600 font-medium">Nenhum local com coordenadas</p>
            <p className="text-gray-500 text-sm mt-1">
              Configure a latitude e longitude dos locais para visualizar no mapa
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
