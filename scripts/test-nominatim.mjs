import axios from "axios";

async function test() {
  const queryStr =
    "vicente sabella 997, jd das laranjeiras, Bragança Paulista, Brasil";
  const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "ChamaJaGeolocation/1.0 (pedro@example.com)",
    "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
  ];

  for (const ua of userAgents) {
    try {
      console.log(`Testing UA: ${ua}`);
      const response = await axios.get(
        "https://nominatim.openstreetmap.org/search",
        {
          params: {
            q: queryStr,
            format: "json",
            limit: 1,
          },
          headers: {
            "User-Agent": ua,
          },
          timeout: 5000,
        },
      );
      console.log(`Success! Data:`, response.data);
      break;
    } catch (err) {
      console.log(`Failed: ${err.message}`);
    }
  }
}

test();
