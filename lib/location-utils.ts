/**
 * Calculates the distance between two points using the Haversine formula.
 * Returns the distance in kilometers.
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Formats a distance in kilometers to a Portuguese user-friendly string.
 * Examples:
 * - 0.85 -> "📍 850 m de você"
 * - 2.34 -> "📍 2,3 km de você"
 * - 12.0 -> "📍 12 km de você"
 */
export function formatDistancePtBr(distanceKm: number): string {
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    if (meters < 50) {
      return "bem próximo";
    }
    return `${meters} m de você`;
  }
  const roundedKm = Math.round(distanceKm * 10) / 10;
  if (roundedKm % 1 === 0) {
    return `${Math.round(roundedKm)} km de você`;
  }
  return `${roundedKm.toFixed(1).replace(".", ",")} km de você`;
}
