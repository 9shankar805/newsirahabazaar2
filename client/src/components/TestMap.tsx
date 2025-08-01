
import { useState, useCallback, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
const createCustomIcon = (color: string, isSelected: boolean = false) => {
  const size = isSelected ? [35, 55] : [25, 41];
  const anchor = isSelected ? [17, 55] : [12, 41];
  
  return L.divIcon({
    html: `
      <div style="
        width: ${size[0]}px; 
        height: ${size[1]}px; 
        background: ${color}; 
        border: 3px solid white;
        border-radius: 50% 50% 50% 0;
        box-shadow: 0 3px 10px rgba(0,0,0,0.3);
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
      ">
        <div style="
          color: white; 
          font-size: ${isSelected ? '16px' : '12px'}; 
          font-weight: bold;
          transform: rotate(45deg);
        ">📍</div>
        ${isSelected ? `
          <div style="
            position: absolute;
            top: -8px;
            right: -8px;
            width: 20px;
            height: 20px;
            background: #10b981;
            border: 2px solid white;
            border-radius: 50%;
            transform: rotate(45deg);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <span style="transform: rotate(-45deg); color: white; font-size: 10px;">✓</span>
          </div>
        ` : ''}
      </div>
    `,
    className: 'custom-marker',
    iconSize: size,
    iconAnchor: anchor,
    popupAnchor: [0, -size[1]],
  });
};

interface TestMapProps {
  onLocationSelect?: (lat: number, lng: number) => void;
  selectedLat?: number;
  selectedLng?: number;
}

type MapLayer = 'osm' | 'satellite' | 'terrain';

interface MapLayerConfig {
  name: string;
  url: string;
  attribution: string;
  icon: string;
}

const mapLayers: Record<MapLayer, MapLayerConfig> = {
  osm: {
    name: 'Street Map',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    icon: '🗺️'
  },
  satellite: {
    name: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
    icon: '🛰️'
  },
  terrain: {
    name: 'Terrain',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://opentopomap.org/">OpenTopoMap</a>',
    icon: '🏔️'
  }
};

// Component to handle map clicks
function MapClickHandler({ onLocationSelect }: { onLocationSelect?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      console.log('🎯 Map clicked:', e.latlng);
      if (onLocationSelect) {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

// Component to center map on selected location
function MapCenterController({ lat, lng }: { lat?: number; lng?: number }) {
  const map = useMap();
  
  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], 16, { animate: true, duration: 1 });
    }
  }, [lat, lng, map]);
  
  return null;
}

// Layer control component
function LayerControl({ currentLayer, onLayerChange }: { currentLayer: MapLayer; onLayerChange: (layer: MapLayer) => void }) {
  return (
    <div className="absolute top-4 right-4 z-[1000] bg-white/95 backdrop-blur-sm rounded-lg p-2 shadow-lg border">
      <div className="text-xs font-semibold text-gray-700 mb-2 px-1">Map Style</div>
      <div className="space-y-1">
        {Object.entries(mapLayers).map(([key, layer]) => (
          <button
            key={key}
            onClick={() => onLayerChange(key as MapLayer)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded text-xs transition-all ${
              currentLayer === key
                ? 'bg-blue-500 text-white shadow-md'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <span>{layer.icon}</span>
            <span className="font-medium">{layer.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Zoom control component
function ZoomControl() {
  const map = useMap();
  const [currentZoom, setCurrentZoom] = useState(15);

  useEffect(() => {
    const updateZoom = () => setCurrentZoom(map.getZoom());
    map.on('zoomend', updateZoom);
    return () => { map.off('zoomend', updateZoom); };
  }, [map]);

  const zoomTo = (level: number) => {
    map.setZoom(level, { animate: true });
  };

  return (
    <div className="absolute bottom-4 right-4 z-[1000] bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border">
      <div className="text-xs font-semibold text-gray-700 mb-2">Quick Zoom</div>
      <div className="space-y-2">
        <div className="text-xs text-center text-gray-600">
          Current: Level {currentZoom}
        </div>
        <div className="grid grid-cols-2 gap-1">
          <button
            onClick={() => zoomTo(13)}
            className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
          >
            City (13)
          </button>
          <button
            onClick={() => zoomTo(15)}
            className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
          >
            Area (15)
          </button>
          <button
            onClick={() => zoomTo(17)}
            className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 rounded transition-colors text-blue-700"
          >
            Street (17)
          </button>
          <button
            onClick={() => zoomTo(19)}
            className="px-2 py-1 text-xs bg-green-100 hover:bg-green-200 rounded transition-colors text-green-700"
          >
            Building (19)
          </button>
        </div>
      </div>
    </div>
  );
}

export function TestMap({ onLocationSelect, selectedLat, selectedLng }: TestMapProps) {
  const [clickedPosition, setClickedPosition] = useState<[number, number] | null>(null);
  const [currentLayer, setCurrentLayer] = useState<MapLayer>('osm');
  const [isLoading, setIsLoading] = useState(false);
  const defaultPosition: [number, number] = [26.6615, 86.2348]; // Siraha, Nepal

  // Update clicked position when external coordinates change
  useEffect(() => {
    if (selectedLat && selectedLng) {
      setClickedPosition([selectedLat, selectedLng]);
    }
  }, [selectedLat, selectedLng]);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setIsLoading(true);
    setClickedPosition([lat, lng]);
    
    // Add a small delay to show loading state
    setTimeout(() => {
      if (onLocationSelect) {
        onLocationSelect(lat, lng);
      }
      setIsLoading(false);
    }, 300);
  }, [onLocationSelect]);

  const currentMapLayer = mapLayers[currentLayer];

  return (
    <div className="relative w-full h-full">
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-[2000]">
          <div className="bg-white p-4 rounded-lg shadow-lg border flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-medium">Setting location...</span>
          </div>
        </div>
      )}

      {/* Instructions overlay */}
      <div className="absolute top-4 left-4 z-[1000] max-w-sm">
        <div className="bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🎯</span>
            <span className="text-sm font-semibold text-gray-800">Location Picker</span>
          </div>
          <div className="text-xs text-gray-600 space-y-1">
            <div>• Click anywhere to select location</div>
            <div>• Scroll to zoom in/out</div>
            <div>• Double-click to zoom to area</div>
            <div className="pt-1 text-blue-600 font-medium">
              {clickedPosition ? '✓ Location selected!' : 'No location selected yet'}
            </div>
          </div>
        </div>
      </div>

      {/* Layer Control */}
      <LayerControl currentLayer={currentLayer} onLayerChange={setCurrentLayer} />

      {/* Zoom Control */}
      <ZoomControl />

      {/* Coordinates display */}
      {clickedPosition && (
        <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border">
          <div className="text-xs font-semibold text-gray-700 mb-1">Selected Coordinates</div>
          <div className="text-xs font-mono text-gray-600">
            <div>Lat: {clickedPosition[0].toFixed(6)}</div>
            <div>Lng: {clickedPosition[1].toFixed(6)}</div>
          </div>
        </div>
      )}
      
      <MapContainer
        center={clickedPosition || defaultPosition}
        zoom={15}
        style={{ height: '100%', width: '100%', cursor: 'crosshair' }}
        scrollWheelZoom={true}
        doubleClickZoom={true}
        dragging={true}
        attributionControl={true}
        zoomControl={false} // We have custom zoom control
      >
        <TileLayer
          attribution={currentMapLayer.attribution}
          url={currentMapLayer.url}
          maxZoom={20}
        />
        
        {/* Default Siraha marker (only show if no location selected) */}
        {!clickedPosition && (
          <Marker 
            position={defaultPosition}
            icon={createCustomIcon('#6b7280')}
          >
            <Popup>
              <div className="text-center p-2">
                <div className="font-semibold text-gray-800">📍 Siraha, Nepal</div>
                <div className="text-xs text-gray-600 mt-1">
                  Default location - Click anywhere to select your precise location
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Selected location marker */}
        {clickedPosition && (
          <Marker 
            position={clickedPosition}
            icon={createCustomIcon('#3b82f6', true)}
          >
            <Popup>
              <div className="text-center p-2">
                <div className="flex items-center gap-1 justify-center mb-2">
                  <span className="text-green-500">✅</span>
                  <span className="font-semibold text-green-700">Selected Location</span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="font-mono text-gray-600">
                    <div>Lat: {clickedPosition[0].toFixed(6)}</div>
                    <div>Lng: {clickedPosition[1].toFixed(6)}</div>
                  </div>
                  <div className="text-blue-600 font-medium">
                    🎯 Precise location set!
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Map click handler */}
        <MapClickHandler onLocationSelect={handleMapClick} />
        
        {/* Center controller */}
        <MapCenterController lat={selectedLat} lng={selectedLng} />
      </MapContainer>
    </div>
  );
}
