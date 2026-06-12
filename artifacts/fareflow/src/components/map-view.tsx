import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Location } from "@/lib/simulation";

import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconShadowUrl from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl,
  shadowUrl: iconShadowUrl,
  iconAnchor: [12, 41],
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

    const map = L.map(containerRef.current, { zoomAnimation: false }).setView(
      [pickup.lat, pickup.lng],
      13
    );

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    mapRef.current = map;

    return () => {
      try {
        map.remove();
      } catch {
      }
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    map.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline) {
        map.removeLayer(layer);
      }
    });

    L.marker([pickup.lat, pickup.lng]).addTo(map).bindPopup("Pickup");
    L.marker([destination.lat, destination.lng]).addTo(map).bindPopup("Destination");

    L.polyline(
      [
        [pickup.lat, pickup.lng],
        [destination.lat, destination.lng],
      ],
      { color: "#3b82f6", dashArray: "5, 10", weight: 4 }
    ).addTo(map);

    map.fitBounds(
      L.latLngBounds(
        [pickup.lat, pickup.lng],
        [destination.lat, destination.lng]
      ),
      { padding: [50, 50], animate: false }
    );
  }, [pickup, destination]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[300px] rounded-lg overflow-hidden border border-border shadow-sm z-0"
    />
  );
}
