import postgres from 'postgres';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("ERRO: DATABASE_URL não encontrada no arquivo .env!");
  process.exit(1);
}

const sql = postgres(databaseUrl, { max: 1 });

async function geocodeAddress(address, neighborhood, city) {
  const parts = [];
  if (address && !address.startsWith('http://') && !address.startsWith('https://')) {
    parts.push(address);
  }
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
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
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
  } catch (error) {
    console.warn(`[Geocoding] Full address failed for "${queryStr}":`, error.message);
  }

  // Backup 1: Neighborhood + City
  const backupParts = [];
  if (neighborhood) backupParts.push(neighborhood);
  if (city) backupParts.push(city);
  if (backupParts.length > 0) {
    backupParts.push("Brasil");
    const backupQuery = backupParts.join(", ");
    try {
      const response = await axios.get("https://nominatim.openstreetmap.org/search", {
        params: {
          q: backupQuery,
          format: "json",
          limit: 1,
        },
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
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
    } catch (error) {
      console.warn(`[Geocoding] Backup failed for "${backupQuery}":`, error.message);
    }
  }

  // Backup 2: City only
  if (city) {
    const cityQuery = `${city}, Brasil`;
    try {
      const response = await axios.get("https://nominatim.openstreetmap.org/search", {
        params: {
          q: cityQuery,
          format: "json",
          limit: 1,
        },
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
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
    } catch (error) {
      console.warn(`[Geocoding] City-only backup failed for "${cityQuery}":`, error.message);
    }
  }

  return null;
}

async function run() {
  try {
    console.log("Conectando ao banco de dados...");
    const providers = await sql`
      SELECT id, name, address, neighborhood, city, latitude, longitude
      FROM providers
    `;

    console.log(`Verificando geolocalização para ${providers.length} prestadores...`);
    
    for (const p of providers) {
      if (p.latitude === null || p.longitude === null) {
        console.log(`Prestador "${p.name}" está sem coordenadas. Tentando geocodificar...`);
        const coords = await geocodeAddress(p.address, p.neighborhood, p.city);
        if (coords) {
          console.log(`Sucesso para "${p.name}": Lat: ${coords.latitude}, Lon: ${coords.longitude}`);
          await sql`
            UPDATE providers
            SET latitude = ${coords.latitude}, longitude = ${coords.longitude}
            WHERE id = ${p.id}
          `;
        } else {
          console.log(`Não foi possível obter coordenadas para "${p.name}".`);
        }
        // Evitar rate limiting do Nominatim
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        console.log(`Prestador "${p.name}" já possui coordenadas: ${p.latitude}, ${p.longitude}`);
      }
    }

    console.log("Processo concluído!");
  } catch (error) {
    console.error("Erro durante a execução do script:", error);
  } finally {
    await sql.end();
    process.exit(0);
  }
}

run();
