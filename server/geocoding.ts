import axios from "axios";

/**
 * Geocodes an address to latitude and longitude using OpenStreetMap's Nominatim API.
 * Follows usage policies by setting a custom User-Agent and using proper timeouts.
 */
export async function geocodeAddress(
  address: string | null | undefined,
  neighborhood?: string | null,
  city?: string | null,
  cep?: string | null,
  strict: boolean = false
): Promise<{ latitude: number; longitude: number } | null> {
  if (!address || address.trim() === "") {
    if (strict) return null;
    if (!neighborhood && !city) return null;
    return geocodeBackup(neighborhood, city);
  }

  if (address.startsWith("http://") || address.startsWith("https://")) {
    if (strict) return null;
    return geocodeBackup(neighborhood, city);
  }

  // Construct full search query
  const parts: string[] = [address];
  if (neighborhood) parts.push(neighborhood);
  if (city) parts.push(city);
  if (cep) parts.push(cep);
  parts.push("Brasil");

  const queryStr = parts.join(", ");

  try {
    const response = await axios.get(
      "https://nominatim.openstreetmap.org/search",
      {
        params: {
          q: queryStr,
          format: "json",
          limit: 1,
        },
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        timeout: 5000,
      },
    );

    if (
      response.data &&
      Array.isArray(response.data) &&
      response.data.length > 0
    ) {
      const lat = parseFloat(response.data[0].lat);
      const lon = parseFloat(response.data[0].lon);
      if (!isNaN(lat) && !isNaN(lon)) {
        return { latitude: lat, longitude: lon };
      }
    }
  } catch (error: any) {
    console.warn(
      `[Geocoding] Full address geocoding failed for "${queryStr}":`,
      error.message,
    );
  }

  // Fallback 1 for strict: try without CEP as it sometimes causes misses in Nominatim
  if (strict && cep) {
    const queryStrNoCep = [address, neighborhood, city, "Brasil"]
      .filter(Boolean)
      .join(", ");
    try {
      const response = await axios.get(
        "https://nominatim.openstreetmap.org/search",
        {
          params: { q: queryStrNoCep, format: "json", limit: 1 },
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
          timeout: 4000,
        },
      );
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        const lat = parseFloat(response.data[0].lat);
        const lon = parseFloat(response.data[0].lon);
        if (!isNaN(lat) && !isNaN(lon)) {
          return { latitude: lat, longitude: lon };
        }
      }
    } catch (e: any) {}
  }

  if (strict) {
    return null; // Don't use generic fallback if strict
  }

  // If full address geocoding fails, fallback to geocoding neighborhood and city
  return geocodeBackup(neighborhood, city);
}

async function geocodeBackup(
  neighborhood?: string | null,
  city?: string | null,
): Promise<{ latitude: number; longitude: number } | null> {
  // Try 1: neighborhood + city
  if (neighborhood && city) {
    const queryStr = `${neighborhood}, ${city}, Brasil`;
    try {
      const response = await axios.get(
        "https://nominatim.openstreetmap.org/search",
        {
          params: {
            q: queryStr,
            format: "json",
            limit: 1,
          },
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
          timeout: 4000,
        },
      );

      if (
        response.data &&
        Array.isArray(response.data) &&
        response.data.length > 0
      ) {
        const lat = parseFloat(response.data[0].lat);
        const lon = parseFloat(response.data[0].lon);
        if (!isNaN(lat) && !isNaN(lon)) {
          return { latitude: lat, longitude: lon };
        }
      }
    } catch (error: any) {
      console.warn(
        `[Geocoding] Backup geocoding failed for "${queryStr}":`,
        error.message,
      );
    }
  }

  // Try 2: city only
  if (city) {
    const queryStr = `${city}, Brasil`;
    try {
      const response = await axios.get(
        "https://nominatim.openstreetmap.org/search",
        {
          params: {
            q: queryStr,
            format: "json",
            limit: 1,
          },
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
          timeout: 4000,
        },
      );

      if (
        response.data &&
        Array.isArray(response.data) &&
        response.data.length > 0
      ) {
        const lat = parseFloat(response.data[0].lat);
        const lon = parseFloat(response.data[0].lon);
        if (!isNaN(lat) && !isNaN(lon)) {
          return { latitude: lat, longitude: lon };
        }
      }
    } catch (error: any) {
      console.warn(
        `[Geocoding] City backup geocoding failed for "${queryStr}":`,
        error.message,
      );
    }
  }

  return null;
}
