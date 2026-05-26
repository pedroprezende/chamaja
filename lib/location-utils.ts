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

/**
 * Estimates driving time based on distance in kilometers.
 * Assumes average driving speed of 50 km/h (1.2 minutes per km) + baseline traffic.
 */
export function estimateDrivingTimeMinutes(distanceKm: number): number {
  if (distanceKm < 0.1) return 1; // Less than 100m is ~1 min
  const minutes = Math.round(distanceKm * 1.2);
  return Math.max(1, minutes);
}

/**
 * Returns driving time text in Portuguese.
 * Example: "aproximadamente 5min de carro"
 */
export function formatDrivingTimePtBr(minutes: number): string {
  return `aproximadamente ${minutes}min de carro`;
}

/**
 * Formats distance with "está a ..." prefix.
 * Example: "está a 5,2km de você"
 */
export function formatDistanceWithPreposition(distanceKm: number): string {
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    if (meters < 50) {
      return "está bem próximo de você";
    }
    return `está a ${meters}m de você`;
  }
  const roundedKm = Math.round(distanceKm * 10) / 10;
  const kmStr = roundedKm % 1 === 0 
    ? `${Math.round(roundedKm)}km` 
    : `${roundedKm.toFixed(1).replace(".", ",")}km`;
  return `está a ${kmStr} de você`;
}

