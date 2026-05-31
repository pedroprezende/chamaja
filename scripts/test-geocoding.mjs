import axios from "axios";

async function test(queryStr) {
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
    console.log(`Busca por "${queryStr}":`);
    if (response.data && response.data.length > 0) {
      console.log(`- Sucesso! Lat: ${response.data[0].lat}, Lon: ${response.data[0].lon}`);
      console.log(`- Nome retornado: ${response.data[0].display_name}`);
    } else {
      console.log("- Nenhum resultado encontrado.");
    }
  } catch (err) {
    console.error(`- Erro na busca por "${queryStr}":`, err.message);
  }
}

async function run() {
  await test("vicente sabella 997, jd das laranjeiras, Bragança Paulista, Brasil");
  await test("vicente sabella 997, Jardim das Laranjeiras, Bragança Paulista, Brasil");
  await test("vicente sabella, Bragança Paulista, Brasil");
  await test("Jardim das Laranjeiras, Bragança Paulista, Brasil");
  await test("Bragança Paulista, Brasil");
}
run();
