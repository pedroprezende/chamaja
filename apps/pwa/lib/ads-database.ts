import AsyncStorage from "@react-native-async-storage/async-storage";

export type Ad = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  providerId: string;
  providerName: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateAdInput = {
  title: string;
  description: string;
  imageUrl: string;
  providerId: string;
  providerName: string;
  isActive: boolean;
  displayOrder: number;
};

const STORAGE_KEY = "@chamaja_ads";

// Dados mockados para demonstração
const MOCK_ADS: Ad[] = [
  {
    id: "ad-1",
    title: "Elétrica do Zé — 20 anos de experiência",
    description:
      "Serviços elétricos residenciais e comerciais. Orçamento grátis!",
    imageUrl:
      "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&q=80",
    providerId: "eletrica-ze",
    providerName: "Elétrica do Zé",
    isActive: true,
    displayOrder: 1,
    createdAt: "2024-04-01",
    updatedAt: "2024-04-01",
  },
  {
    id: "ad-2",
    title: "Barbearia do João — Cortes modernos",
    description: "Barba, cabelo e bigode com navalha. Agende já!",
    imageUrl:
      "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&q=80",
    providerId: "barbeiro-1",
    providerName: "Barbearia do João",
    isActive: true,
    displayOrder: 2,
    createdAt: "2024-04-02",
    updatedAt: "2024-04-02",
  },
  {
    id: "ad-3",
    title: "Foto & Arte — Fotografia profissional",
    description: "Casamentos, eventos e ensaios. Imagens que contam histórias.",
    imageUrl:
      "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800&q=80",
    providerId: "fotografo-1",
    providerName: "Foto & Arte",
    isActive: true,
    displayOrder: 3,
    createdAt: "2024-04-03",
    updatedAt: "2024-04-03",
  },
];

let _initialized = false;
let _ads: Ad[] = [];

async function ensureInitialized(): Promise<void> {
  if (_initialized) return;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      _ads = JSON.parse(raw);
    } else {
      _ads = [...MOCK_ADS];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(_ads));
    }
  } catch {
    _ads = [...MOCK_ADS];
  }
  _initialized = true;
}

async function persist(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(_ads));
  } catch {
    // silently ignore
  }
}

export const adsDB = {
  async getAll(): Promise<Ad[]> {
    await ensureInitialized();
    return [..._ads].sort((a, b) => a.displayOrder - b.displayOrder);
  },

  async getActive(): Promise<Ad[]> {
    await ensureInitialized();
    return _ads
      .filter((a) => a.isActive)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  },

  async getById(id: string): Promise<Ad | undefined> {
    await ensureInitialized();
    return _ads.find((a) => a.id === id);
  },

  async create(input: CreateAdInput): Promise<Ad> {
    await ensureInitialized();
    const now = new Date().toISOString().split("T")[0];
    const ad: Ad = {
      id: `ad-${Date.now()}`,
      ...input,
      createdAt: now,
      updatedAt: now,
    };
    _ads.push(ad);
    await persist();
    return ad;
  },

  async update(
    id: string,
    input: Partial<CreateAdInput>,
  ): Promise<Ad | undefined> {
    await ensureInitialized();
    const idx = _ads.findIndex((a) => a.id === id);
    if (idx === -1) return undefined;
    _ads[idx] = {
      ..._ads[idx],
      ...input,
      updatedAt: new Date().toISOString().split("T")[0],
    };
    await persist();
    return _ads[idx];
  },

  async delete(id: string): Promise<boolean> {
    await ensureInitialized();
    const before = _ads.length;
    _ads = _ads.filter((a) => a.id !== id);
    if (_ads.length < before) {
      await persist();
      return true;
    }
    return false;
  },

  async toggleActive(id: string): Promise<Ad | undefined> {
    await ensureInitialized();
    const ad = _ads.find((a) => a.id === id);
    if (!ad) return undefined;
    ad.isActive = !ad.isActive;
    ad.updatedAt = new Date().toISOString().split("T")[0];
    await persist();
    return ad;
  },
};
