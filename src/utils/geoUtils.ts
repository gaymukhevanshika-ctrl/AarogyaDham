/**
 * Geolocation and Haversine Distance Calculation Utilities
 */

export interface GeoCoordinate {
  lat: number;
  lng: number;
  accuracy?: number;
}

/**
 * Calculates distance in kilometers between two geo-coordinates using the Haversine formula.
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10;
}

/**
 * Default fallback location for demo purposes (Gadchiroli District Headquarters)
 * used if browser geolocation is disabled or permissions denied in iframe.
 */
export const DEFAULT_DEMO_LOCATION: GeoCoordinate = {
  lat: 20.1809,
  lng: 79.9934,
  accuracy: 15,
};
