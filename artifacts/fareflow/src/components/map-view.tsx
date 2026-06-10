import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Location } from '@/lib/simulation';

import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconShadowUrl from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({ 
  iconUrl, 
  shadowUrl: iconShadowUrl, 
  iconAnchor: [12, 41] 
});
L.Marker.prototype.options.icon = DefaultIcon;

interface MapViewProps {
  pickup: Location;
  destination: Location;
}

export function MapView({ pickup, destination }: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if (!mapRef.current) {
      mapRef.current = L.map(containerRef.current).setView([pickup.lat, pickup.lng], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapRef.current);
    }

    const map = mapRef.current;
    
    // Clear existing layers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline) {
        map.removeLayer(layer);
      }
    });

    // Custom icons could be used here, but we'll stick to default with colored markers if possible, 
    // or just use default marker.
    
    const pickupMarker = L.marker([pickup.lat, pickup.lng]).addTo(map).bindPopup("Pickup");
    const destMarker = L.marker([destination.lat, destination.lng]).addTo(map).bindPopup("Destination");

    const latlngs: L.LatLngExpression[] = [
      [pickup.lat, pickup.lng],
      [destination.lat, destination.lng]
    ];

    const polyline = L.polyline(latlngs, { color: '#3b82f6', dashArray: '5, 10', weight: 4 }).addTo(map);

    const bounds = L.latLngBounds([pickup.lat, pickup.lng], [destination.lat, destination.lng]);
    map.fitBounds(bounds, { padding: [50, 50] });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [pickup, destination]);

  return <div ref={containerRef} className="w-full h-full min-h-[300px] rounded-lg overflow-hidden border border-border shadow-sm z-0" />;
}
