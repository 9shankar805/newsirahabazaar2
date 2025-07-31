import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Loader2, Map, Navigation, Crosshair } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { TestMap } from './TestMap';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LocationPickerProps {
  address: string;
  latitude?: string;
  longitude?: string;
  onLocationChange: (data: {
    address: string;
    latitude: string;
    longitude: string;
    googleMapsLink: string;
  }) => void;
}

// Component to handle map clicks
function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function LocationPicker({
  address,
  latitude,
  longitude,
  onLocationChange,
}: LocationPickerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [mapLoading, setMapLoading] = useState(false);
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(null);
  const { toast } = useToast();

  // Default location - Siraha, Nepal
  const defaultLocation: [number, number] = [26.6615, 86.2348];

  // Set marker position when coordinates are available
  useEffect(() => {
    if (latitude && longitude) {
      setMarkerPosition([parseFloat(latitude), parseFloat(longitude)]);
    }
  }, [latitude, longitude]);

  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    console.log('Map clicked at:', lat, lng); // Debug log
    setMarkerPosition([lat, lng]);
    setMapLoading(true);
    
    try {
      // Get address for the clicked location
      const newAddress = await reverseGeocode(lat, lng);
      const googleMapsLink = `https://maps.google.com/?q=${lat},${lng}`;

      // Update form data
      onLocationChange({
        address: newAddress,
        latitude: lat.toString(),
        longitude: lng.toString(),
        googleMapsLink,
      });

      toast({
        title: "📍 Location Selected",
        description: `Location set: ${newAddress}`,
      });
    } catch (error) {
      console.error('Error processing map click:', error);
      toast({
        title: "Error",
        description: "Failed to get address for selected location",
        variant: "destructive",
      });
    } finally {
      setMapLoading(false);
    }
  }, [onLocationChange, toast]);

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location not supported",
        description: "Your browser doesn't support location services",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const { latitude: lat, longitude: lng } = position.coords;
      
      // Get address from coordinates using reverse geocoding
      const address = await reverseGeocode(lat, lng);
      const googleMapsLink = `https://maps.google.com/?q=${lat},${lng}`;
      
      onLocationChange({
        address,
        latitude: lat.toString(),
        longitude: lng.toString(),
        googleMapsLink,
      });

      toast({
        title: "Location found",
        description: "Your location has been automatically filled",
      });
    } catch (error) {
      console.error('Error getting location:', error);
      toast({
        title: "Location error",
        description: "Could not get your location. Please enter manually.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      // Using OpenStreetMap Nominatim for reverse geocoding (free service)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      
      if (!response.ok) {
        throw new Error('Geocoding failed');
      }
      
      const data = await response.json();
      
      if (data.display_name) {
        return data.display_name;
      } else {
        throw new Error('No address found');
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return `${lat}, ${lng}`; // Fallback to coordinates
    }
  };

  const handleAddressChange = (newAddress: string) => {
    onLocationChange({
      address: newAddress,
      latitude: latitude || "",
      longitude: longitude || "",
      googleMapsLink: latitude && longitude ? `https://maps.google.com/?q=${latitude},${longitude}` : "",
    });
  };

  const generateGoogleMapsLink = () => {
    if (latitude && longitude) {
      const link = `https://maps.google.com/?q=${latitude},${longitude}`;
      window.open(link, '_blank');
    } else {
      toast({
        title: "No coordinates",
        description: "Please get your location first to generate Google Maps link",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="address">Store Address</Label>
        <div className="flex gap-2 mt-1">
          <Textarea
            id="address"
            placeholder="Complete store address"
            value={address}
            onChange={(e) => handleAddressChange(e.target.value)}
            className="flex-1"
          />
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={getCurrentLocation}
              disabled={isLoading}
              className="whitespace-nowrap"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Navigation className="h-4 w-4" />
              )}
              {isLoading ? "Getting..." : "Get My Location"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowMap(!showMap)}
              className="whitespace-nowrap"
            >
              <Map className="h-4 w-4" />
              {showMap ? "Hide Map" : "Pick on Map"}
            </Button>
          </div>
        </div>
      </div>

      {/* Interactive Map Section */}
      {showMap && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crosshair className="h-5 w-5" />
              Pick Location on Map
            </CardTitle>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Click anywhere on the map to set your store location. Use mouse wheel to zoom in/out for precise selection.
              </p>
              <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                💡 Tip: Zoom in closer (zoom level 16-18) for street-level precision in Siraha or any area
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="w-full h-[600px] rounded-lg border border-border overflow-hidden relative">
              {mapLoading && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-sm">Getting location details...</span>
                  </div>
                </div>
              )}
              <TestMap onLocationSelect={handleMapClick} />
            </div>
          </CardContent>
        </Card>
      )}

      {latitude && longitude && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="latitude">Latitude</Label>
            <Input
              id="latitude"
              value={latitude}
              readOnly
              className="bg-muted"
            />
          </div>
          <div>
            <Label htmlFor="longitude">Longitude</Label>
            <Input
              id="longitude"
              value={longitude}
              readOnly
              className="bg-muted"
            />
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              variant="outline"
              onClick={generateGoogleMapsLink}
              className="w-full"
            >
              View on Google Maps
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}