const mockCats = [
  { id: "reformas-reparos", name: "Reformas e Reparos" },
  { id: "assistencia-tecnica", name: "Assistência Técnica" },
  { id: "servicos-domesticos", name: "Serviços Domésticos" },
  { id: "servicos-externos", name: "Serviços Externos" },
  { id: "automotivo", name: "Automotivo" },
  { id: "beleza-estetica", name: "Beleza e Estética" }
];

const mockSubs = [
  { id: "reformas-reparos-eletricista", categoryId: "reformas-reparos", name: "Eletricista" },
  { id: "reformas-reparos-encanador", categoryId: "reformas-reparos", name: "Encanador" },
  { id: "reformas-reparos-pedreiro", categoryId: "reformas-reparos", name: "Pedreiro" },
  { id: "reformas-reparos-pintor", categoryId: "reformas-reparos", name: "Pintor" },
  { id: "reformas-reparos-chaveiro", categoryId: "reformas-reparos", name: "Chaveiro" },
  { id: "servicos-domesticos-diarista", categoryId: "servicos-domesticos", name: "Diarista" },
  { id: "servicos-domesticos-faxineira", categoryId: "servicos-domesticos", name: "Faxineira" },
  { id: "servicos-externos-jardineiro", categoryId: "servicos-externos", name: "Jardinagem" },
  { id: "automotivo-mecanico", categoryId: "automotivo", name: "Mecânico" },
];

const testPhrases = [
  "meu chuveiro queimou e preciso de ajuda",
  "cano entupido ou torneira vazando na cozinha",
  "queria pintar a parede da minha sala",
  "preciso de uma diarista para fazer faxina hoje",
  "chave emperrou na porta de entrada",
  "corte de cabelo masculino ou barba", // should map to beleza-estetica/barbeiro
  "limpeza e cloro de piscina", // should map to servicos-externos/piscineiro
  "preciso de um mecanico para consertar meu carro",
  "uma coisa aleatoria que nao deve mapear para nada"
];

function runTest() {
  console.log("=== Testando Algoritmo de Busca Inteligente (JS) ===");

  const normalize = (str) => 
    str.toLowerCase()
       .normalize("NFD")
       .replace(/[\u0300-\u036f]/g, "")
       .replace(/[^a-z0-9\s]/g, "")
       .trim();

  const keywordMap = {
    "eletricista": { categoryId: "reformas-reparos", label: "Eletricista", scoreMultiplier: 2.0 },
    "eletrica": { categoryId: "reformas-reparos", label: "Eletricista" },
    "fiação": { categoryId: "reformas-reparos", label: "Eletricista" },
    "fiacao": { categoryId: "reformas-reparos", label: "Eletricista" },
    "chuveiro": { categoryId: "reformas-reparos", label: "Eletricista" },
    "tomada": { categoryId: "reformas-reparos", label: "Eletricista" },
    "lampada": { categoryId: "reformas-reparos", label: "Eletricista" },
    "curto": { categoryId: "reformas-reparos", label: "Eletricista" },
    "disjuntor": { categoryId: "reformas-reparos", label: "Eletricista" },
    "ventilador": { categoryId: "reformas-reparos", label: "Eletricista" },

    "encanador": { categoryId: "reformas-reparos", label: "Encanador", scoreMultiplier: 2.0 },
    "encanamento": { categoryId: "reformas-reparos", label: "Encanador" },
    "cano": { categoryId: "reformas-reparos", label: "Encanador" },
    "vazamento": { categoryId: "reformas-reparos", label: "Encanador" },
    "infiltracao": { categoryId: "reformas-reparos", label: "Encanador" },
    "torneira": { categoryId: "reformas-reparos", label: "Encanador" },
    "pia": { categoryId: "reformas-reparos", label: "Encanador" },
    "desentupir": { categoryId: "reformas-reparos", label: "Encanador" },
    "esgoto": { categoryId: "reformas-reparos", label: "Encanador" },

    "pintor": { categoryId: "reformas-reparos", label: "Pintor", scoreMultiplier: 2.0 },
    "pintura": { categoryId: "reformas-reparos", label: "Pintor" },
    "pintar": { categoryId: "reformas-reparos", label: "Pintor" },
    "massa corrida": { categoryId: "reformas-reparos", label: "Pintor" },
    "verniz": { categoryId: "reformas-reparos", label: "Pintor" },
    "portao": { categoryId: "reformas-reparos", label: "Pintor" },
    "parede": { categoryId: "reformas-reparos", label: "Pintor" },

    "pedreiro": { categoryId: "reformas-reparos", label: "Pedreiro", scoreMultiplier: 2.0 },
    "reforma": { categoryId: "reformas-reparos", label: "Pedreiro" },
    "construir": { categoryId: "reformas-reparos", label: "Pedreiro" },
    "tijolo": { categoryId: "reformas-reparos", label: "Pedreiro" },
    "cimento": { categoryId: "reformas-reparos", label: "Pedreiro" },
    "azulejo": { categoryId: "reformas-reparos", label: "Pedreiro" },
    "piso": { categoryId: "reformas-reparos", label: "Pedreiro" },
    "reboco": { categoryId: "reformas-reparos", label: "Pedreiro" },

    "marceneiro": { categoryId: "reformas-reparos", label: "Montagem de Móveis" },
    "marcenaria": { categoryId: "reformas-reparos", label: "Montagem de Móveis" },
    "moveis": { categoryId: "reformas-reparos", label: "Montagem de Móveis" },
    "armario": { categoryId: "reformas-reparos", label: "Montagem de Móveis" },
    "guarda-roupa": { categoryId: "reformas-reparos", label: "Montagem de Móveis" },
    "madeira": { categoryId: "reformas-reparos", label: "Montagem de Móveis" },
    "montagem": { categoryId: "reformas-reparos", label: "Montagem de Móveis" },
    "montar": { categoryId: "reformas-reparos", label: "Montagem de Móveis" },
    "desmontar": { categoryId: "reformas-reparos", label: "Montagem de Móveis" },

    "chaveiro": { categoryId: "reformas-reparos", label: "Chaveiro", scoreMultiplier: 2.0 },
    "chave": { categoryId: "reformas-reparos", label: "Chaveiro" },
    "fechadura": { categoryId: "reformas-reparos", label: "Chaveiro" },
    "cadeado": { categoryId: "reformas-reparos", label: "Chaveiro" },
    "abrir porta": { categoryId: "reformas-reparos", label: "Chaveiro" },

    "diarista": { categoryId: "servicos-domesticos", label: "Diarista", scoreMultiplier: 2.0 },
    "faxina": { categoryId: "servicos-domesticos", label: "Faxineira" },
    "faxineira": { categoryId: "servicos-domesticos", label: "Faxineira" },
    "limpeza": { categoryId: "servicos-domesticos", label: "Diarista" },
    "passadeira": { categoryId: "servicos-domesticos", label: "Passadeira" },
    "passar roupa": { categoryId: "servicos-domesticos", label: "Passadeira" },
    "baba": { categoryId: "servicos-domesticos", label: "Babá" },
    "crianca": { categoryId: "servicos-domesticos", label: "Babá" },

    "jardineiro": { categoryId: "servicos-externos", label: "Jardinagem", scoreMultiplier: 2.0 },
    "jardim": { categoryId: "servicos-externos", label: "Jardinagem" },
    "grama": { categoryId: "servicos-externos", label: "Jardinagem" },
    "podar": { categoryId: "servicos-externos", label: "Jardinagem" },
    "plantas": { categoryId: "servicos-externos", label: "Jardinagem" },

    "piscineiro": { categoryId: "servicos-externos", label: "Piscineiro" },
    "piscina": { categoryId: "servicos-externos", label: "Piscineiro" },
    "limpar piscina": { categoryId: "servicos-externos", label: "Piscineiro" },

    "tecnico": { categoryId: "assistencia-tecnica", label: "Assistência Técnica" },
    "conserto": { categoryId: "assistencia-tecnica", label: "Assistência Técnica" },
    "celular": { categoryId: "assistencia-tecnica", label: "Conserto de Celular" },
    "tela quebrada": { categoryId: "assistencia-tecnica", label: "Conserto de Celular" },
    "notebook": { categoryId: "assistencia-tecnica", label: "Técnico de Notebook" },
    "computador": { categoryId: "assistencia-tecnica", label: "Técnico de Notebook" },
    "ar-condicionado": { categoryId: "assistencia-tecnica", label: "Ar-condicionado" },
    "ar condicionado": { categoryId: "assistencia-tecnica", label: "Ar-condicionado" },
    "geladeira": { categoryId: "assistencia-tecnica", label: "Conserto de Geladeira" },
    "maquina de lavar": { categoryId: "assistencia-tecnica", label: "Conserto de Máquina" },

    "mecanico": { categoryId: "automotivo", label: "Mecânico" },
    "oficina": { categoryId: "automotivo", label: "Mecânico" },
    "carro": { categoryId: "automotivo", label: "Mecânico" },
    "pneu": { categoryId: "automotivo", label: "Mecânico" },
    "motor": { categoryId: "automotivo", label: "Mecânico" },
    "freio": { categoryId: "automotivo", label: "Mecânico" },
    "lava rapido": { categoryId: "automotivo", label: "Lava Rápido" },
    "lavar carro": { categoryId: "automotivo", label: "Lava Rápido" },

    "barbeiro": { categoryId: "beleza-estetica", label: "Barbeiro" },
    "barba": { categoryId: "beleza-estetica", label: "Barbeiro" },
    "cabelo": { categoryId: "beleza-estetica", label: "Barbeiro" },
    "cabeleireiro": { categoryId: "beleza-estetica", label: "Barbeiro" },
    "manicure": { categoryId: "beleza-estetica", label: "Manicure" },
    "unha": { categoryId: "beleza-estetica", label: "Manicure" },
    "sobrancelha": { categoryId: "beleza-estetica", label: "Sobrancelhas" },
    "cilios": { categoryId: "beleza-estetica", label: "Sobrancelhas" },
  };

  for (const phrase of testPhrases) {
    const queryNorm = normalize(phrase);
    const matchScores = {};
    const words = queryNorm.split(/\s+/).filter(w => w.length > 2);

    for (const [kw, mapInfo] of Object.entries(keywordMap)) {
      const kwNorm = normalize(kw);
      if (queryNorm.includes(kwNorm)) {
        const multiplier = mapInfo.scoreMultiplier || 1.0;
        const points = 10 * multiplier;
        
        if (mapInfo.categoryId) {
          const matchedSub = mockSubs.find(s => normalize(s.name).includes(normalize(mapInfo.label)) && s.categoryId === mapInfo.categoryId);
          if (matchedSub) {
            const key = `sub-${matchedSub.id}`;
            matchScores[key] = {
              type: "subcategory",
              id: matchedSub.id,
              name: matchedSub.name,
              score: (matchScores[key]?.score || 0) + points
            };
          } else {
            const key = `cat-${mapInfo.categoryId}`;
            matchScores[key] = {
              type: "category",
              id: mapInfo.categoryId,
              name: mockCats.find(c => c.id === mapInfo.categoryId)?.name || mapInfo.categoryId,
              score: (matchScores[key]?.score || 0) + points
            };
          }
        }
      }
    }

    mockCats.forEach(c => {
      const catNorm = normalize(c.name);
      let score = 0;
      
      if (queryNorm === catNorm) score += 50;
      else if (queryNorm.includes(catNorm)) score += 30;
      else {
        words.forEach(w => {
          if (catNorm.includes(w)) score += 5;
        });
      }

      if (score > 0) {
        const key = `cat-${c.id}`;
        matchScores[key] = {
          type: "category",
          id: c.id,
          name: c.name,
          score: (matchScores[key]?.score || 0) + score
        };
      }
    });

    mockSubs.forEach(s => {
      const subNorm = normalize(s.name);
      let score = 0;

      if (queryNorm === subNorm) score += 50;
      else if (queryNorm.includes(subNorm)) score += 40;
      else {
        words.forEach(w => {
          if (subNorm.includes(w)) score += 8;
        });
      }

      if (score > 0) {
        const key = `sub-${s.id}`;
        matchScores[key] = {
          type: "subcategory",
          id: s.id,
          name: s.name,
          score: (matchScores[key]?.score || 0) + score
        };
      }
    });

    let bestMatch = null;
    for (const item of Object.values(matchScores)) {
      if (!bestMatch || item.score > bestMatch.score) {
        bestMatch = item;
      }
    }

    const THRESHOLD = 8;
    if (bestMatch && bestMatch.score >= THRESHOLD) {
      console.log(`Frase: "${phrase}"`);
      console.log(` -> Mapeado para: [${bestMatch.type.toUpperCase()}] "${bestMatch.name}" (Score: ${bestMatch.score})`);
    } else {
      console.log(`Frase: "${phrase}"`);
      console.log(` -> Ambiguidade detectada (Confidence baixa). Abriria o assistente Xará.`);
    }
    console.log("-".repeat(40));
  }
}

runTest();
