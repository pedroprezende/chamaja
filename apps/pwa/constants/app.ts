/**
 * Constants compartilhadas do app XamaJá
 * Evita duplicação de valores hardcoded em todo o codebase
 */

export const DEFAULT_CITY = "Bragança Paulista";

export const DEFAULT_COORDINATES = {
  latitude: -22.9519,
  longitude: -46.5419,
} as const;

export const MAP_CARD_OVERLAY_OFFSET = -0.002;

/** Nominatim User-Agent para geocoding */
export const GEOCODING_USER_AGENT = "XamaJa/1.0 (contato@xamaja.com.br)";

/** Tempo de espera do loading inicial (ms) */
export const INITIAL_LOADING_TIMEOUT = 8000;

/** Timeout para operações de auth (ms) */
export const AUTH_TIMEOUT = 15000;

// ── Social Media Networks ──────────────────────────────────────────────────────
export const SOCIAL_NETWORKS = [
  { key: "instagram", label: "Instagram", imageFile: "instagram.png", placeholder: "instagram.com/seuusuario", pattern: /instagram\.com\// },
  { key: "facebook", label: "Facebook", imageFile: "facebook.png", placeholder: "facebook.com/seuusuario", pattern: /facebook\.com\// },
  { key: "youtube", label: "YouTube", imageFile: "youtube.png", placeholder: "youtube.com/@seucanal", pattern: /youtube\.com\// },
  { key: "tiktok", label: "TikTok", imageFile: "tiktok.png", placeholder: "tiktok.com/@seuusuario", pattern: /tiktok\.com\// },
] as const;

export const SOCIAL_PNG_ASSETS: Record<string, any> = {
  instagram: require("../assets/socials/instagram.png"),
  facebook: require("../assets/socials/facebook.png"),
  youtube: require("../assets/socials/youtube.png"),
  tiktok: require("../assets/socials/tiktok.png"),
};

export const SOCIAL_WEB_PATHS: Record<string, string> = {
  instagram: "/socials/instagram.png",
  facebook: "/socials/facebook.png",
  youtube: "/socials/youtube.png",
  tiktok: "/socials/tiktok.png",
};

export type SocialNetworkKey = (typeof SOCIAL_NETWORKS)[number]["key"];

/** Normaliza URL de rede social: adiciona https:// se ausente e valida domínio */
export function normalizeSocialUrl(url: string, networkKey: string): string {
  if (!url) return "";
  let trimmed = url.trim();
  if (trimmed && !trimmed.startsWith("http")) {
    trimmed = `https://${trimmed}`;
  }
  const network = SOCIAL_NETWORKS.find((n) => n.key === networkKey);
  if (network && trimmed && !network.pattern.test(trimmed)) {
    return trimmed; // Return anyway, don't block save
  }
  return trimmed;
}

/** Retorna a quantidade máxima de links sociais permitida pelo plano */
export function getMaxSocialLinks(benefitKeys: string[]): number {
  if (!benefitKeys.includes("social_links")) return 0;
  if (benefitKeys.includes("social_links_unlimited")) return -1;
  return 5;
}
