export interface Location {
  address: string;
  lat: number;
  lng: number;
}

export interface ProviderResult {
  name: string;
  fare: number;
  eta: number; // minutes
}

export interface SimulationResult {
  distance: number;
  weather: string;
  traffic: string;
  surgeMultiplier: number;
  surgeLevel: "Low" | "Medium" | "High" | "Very High";
  providers: ProviderResult[];
  cheapestProvider: string;
  highestFare: number;
  cheapestFare: number;
  savings: number;
  futureSurgeMultiplier: number;
  futureTrend: "Increasing" | "Decreasing" | "Stable";
  futureConfidence: number;
  recommendation: "Book Now" | "Wait 15 Minutes";
  expectedSavings?: number;
}

export const PROVIDERS = [
  { name: "Uber", base: 50, perKm: 12 },
  { name: "Ola", base: 45, perKm: 13 },
  { name: "Rapido", base: 35, perKm: 11 },
  { name: "Namma Yatri", base: 40, perKm: 10 },
];

export const WEATHER_CONDITIONS = [
  { name: "Sunny", multiplier: 1.0 },
  { name: "Cloudy", multiplier: 1.1 },
  { name: "Rain", multiplier: 1.4 },
  { name: "HeavyRain", multiplier: 1.7 },
];

export const TRAFFIC_CONDITIONS = [
  { name: "Low", multiplier: 1.0 },
  { name: "Medium", multiplier: 1.2 },
  { name: "High", multiplier: 1.5 },
];

// Haversine formula
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export async function geocode(address: string): Promise<Location | null> {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`);
    const data = await res.json();
    if (data && data.length > 0) {
      return {
        address,
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    }
  } catch (error) {
    console.error("Geocoding error", error);
  }
  return null;
}

export function runSimulation(distance: number): SimulationResult {
  const currentHour = new Date().getHours();
  let timeMultiplier = 1.0;
  if (currentHour >= 8 && currentHour < 10) timeMultiplier = 1.3;
  else if (currentHour >= 18 && currentHour < 21) timeMultiplier = 1.4;
  else if (currentHour >= 23 || currentHour < 5) timeMultiplier = 1.2;

  const weather = WEATHER_CONDITIONS[Math.floor(Math.random() * WEATHER_CONDITIONS.length)];
  const traffic = TRAFFIC_CONDITIONS[Math.floor(Math.random() * TRAFFIC_CONDITIONS.length)];

  const surgeMultiplier = timeMultiplier * weather.multiplier * traffic.multiplier;

  let surgeLevel: "Low" | "Medium" | "High" | "Very High" = "Low";
  if (surgeMultiplier < 1.1) surgeLevel = "Low";
  else if (surgeMultiplier < 1.3) surgeLevel = "Medium";
  else if (surgeMultiplier < 1.5) surgeLevel = "High";
  else surgeLevel = "Very High";

  const providers = PROVIDERS.map(p => {
    const fare = Math.round(p.base + (distance * p.perKm * surgeMultiplier));
    const eta = Math.floor(Math.random() * 9) + 2; // 2-10 mins
    return { name: p.name, fare, eta };
  });

  const sortedProviders = [...providers].sort((a, b) => a.fare - b.fare);
  const cheapestFare = sortedProviders[0].fare;
  const highestFare = sortedProviders[sortedProviders.length - 1].fare;
  const cheapestProvider = sortedProviders[0].name;
  const savings = highestFare - cheapestFare;

  // Future Prediction
  const variation = (Math.random() * 0.3) - 0.15; // ±15%
  const futureSurgeMultiplier = surgeMultiplier * (1 + variation);
  
  let futureTrend: "Increasing" | "Decreasing" | "Stable" = "Stable";
  let futureConfidence = 0;
  
  if (futureSurgeMultiplier < surgeMultiplier * 0.98) {
    futureTrend = "Decreasing";
    futureConfidence = Math.floor(Math.random() * 16) + 75; // 75-90%
  } else if (futureSurgeMultiplier > surgeMultiplier * 1.02) {
    futureTrend = "Increasing";
    futureConfidence = Math.floor(Math.random() * 19) + 70; // 70-88%
  } else {
    futureTrend = "Stable";
    futureConfidence = Math.floor(Math.random() * 16) + 80; // 80-95%
  }

  const recommendation = futureTrend === "Decreasing" ? "Wait 15 Minutes" : "Book Now";
  const expectedSavings = recommendation === "Wait 15 Minutes" 
    ? Math.round((surgeMultiplier - futureSurgeMultiplier) * distance * 12) 
    : undefined;

  return {
    distance,
    weather: weather.name,
    traffic: traffic.name,
    surgeMultiplier,
    surgeLevel,
    providers,
    cheapestProvider,
    cheapestFare,
    highestFare,
    savings,
    futureSurgeMultiplier,
    futureTrend,
    futureConfidence,
    recommendation,
    expectedSavings
  };
}
