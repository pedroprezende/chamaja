import axios from "axios";

/**
 * Geocodes an address to latitude and longitude using OpenStreetMap's Nominatim API.
 * Follows usage policies by setting a custom User-Agent and using proper timeouts.
 */
export async function geocodeAddress(
  address: string | null | undefined,
  neighborhood?: string | null,
  city?: string | null
): Promise<{ latitude: number; longitude: number } | null> {
  if (!address || address.trim() === "") {
    // If no address is provided, try to geocode the neighborhood and city
    if (!neighborhood && !city) return null;
    return geocodeBackup(neighborhood, city);
  }

  // Check if address looks like a web link (Google Maps etc.)
  if (address.startsWith("http://") || address.startsWith("https://")) {
    return geocodeBackup(neighborhood, city);
  }

  // Construct full search query
  const parts: string[] = [address];
  if (neighborhood) parts.push(neighborhood);
  if (city) parts.push(city);
  parts.push("Brasil");

  const queryStr = parts.join(", ");

  try {
    const response = await axios.get("https://nominatim.openstreetmap.org/search", {
      params: {
        q: queryStr,
        format: "json",
        limit: 1,
      },
      headers: {
        "User-Agent": "ChamaJaGeolocation/1.0 (pedro@example.com)",
      },
      timeout: 5000,
    });

    if (response.data && Array.isArray(response.data) && response.data.length > 0) {
      const lat = parseFloat(response.data[0].lat);
      const lon = parseFloat(response.data[0].lon);
      if (!isNaN(lat) && !isNaN(lon)) {
        return { latitude: lat, longitude: lon };
      }
    }
  } catch (error: any) {
    console.warn(`[Geocoding] Full address geocoding failed for "${queryStr}":`, error.message);
  }

  // If full address geocoding fails, fallback to geocoding neighborhood and city
  return geocodeBackup(neighborhood, city);
}

async function geocodeBackup(
  neighborhood?: string | null,
  city?: string | null
): Promise<{ latitude: number; longitude: number } | null> {
  const parts: string[] = [];
  if (neighborhood) parts.push(neighborhood);
  if (city) parts.push(city);
  
  if (parts.length === 0) return null;
  parts.push("Brasil");

  const queryStr = parts.join(", ");

  try {
    const response = await axios.get("https://nominatim.openstreetmap.org/search", {
      params: {
        q: queryStr,
        format: "json",
        limit: 1,
      },
      headers: {
        "User-Agent": "ChamaJaGeolocation/1.0 (pedro@example.com)",
      },
      timeout: 4000,
    });

    if (response.data && Array.isArray(response.data) && response.data.length > 0) {
      const lat = parseFloat(response.data[0].lat);
      const lon = parseFloat(response.data[0].lon);
      if (!isNaN(lat) && !isNaN(lon)) {
        return { latitude: lat, longitude: lon };
      }
    }
  } catch (error: any) {
    console.warn(`[Geocoding] Backup geocoding failed for "${queryStr}":`, error.message);
  }

  return null;
}
