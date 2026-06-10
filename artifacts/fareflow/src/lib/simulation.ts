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

export interface FareHistoryPoint {
  time: string;       // e.g. "10:32"
  minutesAgo: number;
  Uber: number;
  Ola: number;
  Rapido: number;
  "Namma Yatri": number;
}

export function generateFareHistory(distance: number, currentSurgeMultiplier: number): FareHistoryPoint[] {
  const now = new Date();
  const points: FareHistoryPoint[] = [];

  // Noise seeds per provider so curves diverge naturally
  const noiseSeeds = { Uber: 0.07, Ola: 0.09, Rapido: 0.06, "Namma Yatri": 0.08 };

  for (let i = 60; i >= 0; i -= 5) {
    const t = new Date(now.getTime() - i * 60 * 1000);
    const h = t.getHours();

    let timeMult = 1.0;
    if (h >= 8 && h < 10) timeMult = 1.3;
    else if (h >= 18 && h < 21) timeMult = 1.4;
    else if (h >= 23 || h < 5) timeMult = 1.2;

    // Blend historical multiplier toward the current one as we approach "now"
    const weight = i / 60; // 1 at 60 min ago, 0 at now
    const blendedMult = timeMult * weight + currentSurgeMultiplier * (1 - weight);

    const point: FareHistoryPoint = {
      time: `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`,
      minutesAgo: i,
      Uber: 0,
      Ola: 0,
      Rapido: 0,
      "Namma Yatri": 0,
    };

    PROVIDERS.forEach((p) => {
      const noise = 1 + (Math.random() - 0.5) * noiseSeeds[p.name as keyof typeof noiseSeeds];
      point[p.name as keyof Pick<FareHistoryPoint, "Uber" | "Ola" | "Rapido" | "Namma Yatri">] =
        Math.round(p.base + distance * p.perKm * blendedMult * noise);
    });

    points.push(point);
  }

  return points;
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
