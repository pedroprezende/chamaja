/**
 * Banco de imagens de subcategorias editável pelo admin.
 * Permite sobrescrever a imageUrl padrão do mock por uma URL personalizada.
 * Persiste no AsyncStorage.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@chamaja_subcategory_images";

export type SubcategoryImageOverride = {
  subcategoryId: string;
  imageUrl: string;
  updatedAt: string;
};

type ImageOverrideMap = Record<string, SubcategoryImageOverride>;

let cache: ImageOverrideMap | null = null;

async function load(): Promise<ImageOverrideMap> {
  if (cache) return cache;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    cache = raw ? JSON.parse(raw) : {};
  } catch {
    cache = {};
  }
  return cache!;
}

async function save(map: ImageOverrideMap): Promise<void> {
  cache = map;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export const subcategoryImagesDB = {
  resetCache() {
    cache = null;
  },

  /** Retorna a URL de imagem personalizada para uma subcategoria, ou null se não houver override */
  async getOverride(subcategoryId: string): Promise<string | null> {
    const map = await load();
    return map[subcategoryId]?.imageUrl ?? null;
  },

  /** Retorna todas as overrides */
  async getAll(): Promise<SubcategoryImageOverride[]> {
    const map = await load();
    return Object.values(map);
  },

  /** Salva ou atualiza a imagem de uma subcategoria */
  async setImage(subcategoryId: string, imageUrl: string): Promise<void> {
    const map = await load();
    map[subcategoryId] = {
      subcategoryId,
      imageUrl,
      updatedAt: new Date().toISOString(),
    };
    await save(map);
  },

  /** Remove o override de uma subcategoria (volta para o padrão do mock) */
  async removeOverride(subcategoryId: string): Promise<void> {
    const map = await load();
    delete map[subcategoryId];
    await save(map);
  },
};
