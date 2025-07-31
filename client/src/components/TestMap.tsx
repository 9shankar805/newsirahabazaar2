
<old_str>import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export function TestMap() {
  const position: [number, number] = [26.6615, 86.2348]; // Siraha, Nepal

  return (
    <div style={{ height: '400px', width: '100%' }}>
      <MapContainer
        center={position}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position}>
          <Popup>
            Test location in Siraha, Nepal
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}</old_str>
<new_str>import { useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface TestMapProps {
  onLocationSelect?: (lat: number, lng: number) => void;
}

// Component to handle map clicks
function MapClickHandler({ onLocationSelect }: { onLocationSelect?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      console.log('Map clicked:', e.latlng); // Debug log
      if (onLocationSelect) {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

export function TestMap({ onLocationSelect }: TestMapProps) {
  const [clickedPosition, setClickedPosition] = useState<[number, number] | null>(null);
  const defaultPosition: [number, number] = [26.6615, 86.2348]; // Siraha, Nepal

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setClickedPosition([lat, lng]);
    if (onLocationSelect) {
      onLocationSelect(lat, lng);
    }
  }, [onLocationSelect]);

  return (
    <div style={{ height: '600px', width: '100%', position: 'relative' }}>
      {/* Instructions overlay */}
      <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-lg p-2 z-[1000] shadow-md">
        <div className="text-xs font-medium text-gray-700">
          🎯 Click anywhere to select location
        </div>
      </div>
      
      <MapContainer
        center={defaultPosition}
        zoom={15}
        style={{ height: '100%', width: '100%', cursor: 'crosshair' }}
        scrollWheelZoom={true}
        doubleClickZoom={true}
        dragging={true}
        attributionControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Default Siraha marker */}
        <Marker position={defaultPosition}>
          <Popup>
            <div className="text-center">
              <strong>Siraha, Nepal</strong><br />
              Default location
            </div>
          </Popup>
        </Marker>

        {/* Clicked location marker with custom icon */}
        {clickedPosition && (
          <Marker 
            position={clickedPosition}
            icon={L.icon({
              iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
              shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41],
              className: 'selected-location-marker'
            })}
          >
            <Popup>
              <div className="text-center p-2">
                <strong className="text-green-600">✅ Selected Location</strong><br />
                <span className="text-xs text-gray-600">
                  Lat: {clickedPosition[0].toFixed(6)}<br />
                  Lng: {clickedPosition[1].toFixed(6)}
                </span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Handle map clicks */}
        <MapClickHandler onLocationSelect={handleMapClick} />
      </MapContainer>
    </div>
  );
}</old_str>
