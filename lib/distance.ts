/**
 * Helper utilities for geographical distance calculations and formatting.
 */

// Earth's radius in kilometers
const R = 6371;

/**
 * Calculates the Haversine distance between two coordinates in kilometers.
 */
export function getHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Formats a distance in kilometers to a friendly Portuguese string:
 * e.g. "800 m de você", "1,2 km de você", "5,8 km de você".
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    // If rounded to 0 (very close), show at least 10m
    const finalMeters = meters <= 0 ? 10 : meters;
    return `${finalMeters} m de você`;
  } else {
    const formatted = distanceKm.toFixed(1).replace(".", ",");
    return `${formatted} km de você`;
  }
}
