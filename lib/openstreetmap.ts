import type { Coordinates } from "@/lib/types";

interface RouteResponse {
  distance: number; // in meters
  duration: number; // in seconds
  coordinates: Coordinates[];
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  importance: number;
}

// Geocoding: Convert city name to coordinates
export async function geocodeCity(
  city: string,
  country: string
): Promise<Coordinates | null> {
  try {
    const query = encodeURIComponent(`${city}, ${country}`);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1&addressdetails=1`,
      {
        headers: {
          "User-Agent": "TransportBookingApp/1.0",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Geocoding failed");
    }

    const data: NominatimResult[] = await response.json();

    if (data.length === 0) {
      return null;
    }

    return {
      lat: Number.parseFloat(data[0].lat),
      lng: Number.parseFloat(data[0].lon),
    };
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}

// Calculate route using OSRM (Open Source Routing Machine)
export async function calculateRoute(
  departureCity: string,
  arrivalCity: string,
  departureCountry: string,
  arrivalCountry: string
): Promise<RouteResponse | null> {
  try {
    // Get coordinates for both cities
    const [departureCoords, arrivalCoords] = await Promise.all([
      geocodeCity(departureCity, departureCountry),
      geocodeCity(arrivalCity, arrivalCountry),
    ]);

    if (!departureCoords || !arrivalCoords) {
      throw new Error("Could not geocode one or both cities");
    }

    // Use OSRM for routing
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${departureCoords.lng},${departureCoords.lat};${arrivalCoords.lng},${arrivalCoords.lat}?overview=full&geometries=geojson`;

    const response = await fetch(osrmUrl, {
      headers: {
        "User-Agent": "TransportBookingApp/1.0",
      },
    });

    if (!response.ok) {
      throw new Error("Routing failed");
    }

    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      throw new Error("No route found");
    }

    const route = data.routes[0];

    return {
      distance: Math.round(route.distance), // meters
      duration: Math.round(route.duration), // seconds
      coordinates: route.geometry.coordinates.map(
        ([lng, lat]: [number, number]) => ({ lat, lng })
      ),
    };
  } catch (error) {
    console.error("Route calculation error:", error);
    return null;
  }
}

// Calculate estimated price based on distance and base rate
export function calculateEstimatedPrice(
  distanceKm: number,
  baseRatePerKm = 25
): number {
  // Base rate of 25 FCFA per km, with minimum of 1000 FCFA
  const basePrice = distanceKm * baseRatePerKm;
  return Math.max(basePrice, 1000);
}

// Calculate estimated duration with traffic factors
export function calculateEstimatedDuration(
  durationSeconds: number,
  isInternational = false
): number {
  let adjustedDuration = durationSeconds;

  // Add buffer for international routes (border crossings, etc.)
  if (isInternational) {
    adjustedDuration += 3600; // Add 1 hour for border crossing
  }

  // Add 20% buffer for traffic and stops
  adjustedDuration *= 1.2;

  // Convert to minutes and round
  return Math.round(adjustedDuration / 60);
}

// Format distance for display
export function formatDistance(meters: number): string {
  const km = meters / 1000;
  if (km < 1) {
    return `${meters} m`;
  }
  return `${km.toFixed(1)} km`;
}

// Format duration for display
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins} min`;
  }

  return `${hours}h ${mins}min`;
}
