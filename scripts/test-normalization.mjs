import axios from "axios";

function normalizeAddress(str) {
  if (!str) return "";
  return str
    .replace(/\bjd\b/gi, "Jardim")
    .replace(/\bav\b/gi, "Avenida")
    .replace(/\br\b/gi, "Rua")
    .replace(/\bpto\b/gi, "Porto")
    .replace(/\bsto\b/gi, "Santo")
    .replace(/\bsta\b/gi, "Santa")
    .trim();
}

async function test() {
  const ua =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
  const queries = [
    "vicente sabella 997, jd das laranjeiras, Bragança Paulista, Brasil",
    "vicente sabella 997, Jardim das Laranjeiras, Bragança Paulista, Brasil",
    "Jardim das Laranjeiras, Bragança Paulista, Brasil",
    "jd das laranjeiras, Bragança Paulista, Brasil",
  ];

  for (const q of queries) {
    const normalized = normalizeAddress(q);
    try {
      console.log(`Query: "${q}" | Normalized: "${normalized}"`);
      const response = await axios.get(
        "https://nominatim.openstreetmap.org/search",
        {
          params: {
            q: normalized,
            format: "json",
            limit: 1,
          },
          headers: {
            "User-Agent": ua,
          },
          timeout: 5000,
        },
      );
      console.log(
        `Result:`,
        response.data.length > 0
          ? { lat: response.data[0].lat, lon: response.data[0].lon }
          : "Not found",
      );
    } catch (err) {
      console.log(`Error: ${err.message}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

test();
