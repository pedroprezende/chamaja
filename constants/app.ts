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
  { key: "instagram", label: "Instagram", icon: "camera-alt" as const, color: "#E4405F", placeholder: "instagram.com/seuusuario", pattern: /instagram\.com\// },
  { key: "facebook", label: "Facebook", icon: "facebook" as const, color: "#1877F2", placeholder: "facebook.com/seuusuario", pattern: /facebook\.com\// },
  { key: "youtube", label: "YouTube", icon: "play-circle" as const, color: "#FF0000", placeholder: "youtube.com/@seucanal", pattern: /youtube\.com\// },
  { key: "tiktok", label: "TikTok", icon: "music-note" as const, color: "#000000", placeholder: "tiktok.com/@seuusuario", pattern: /tiktok\.com\// },
  { key: "website", label: "Site Oficial", icon: "language" as const, color: "#2563EB", placeholder: "https://seusite.com.br", pattern: /https?:\/\// },
  { key: "linkedin", label: "LinkedIn", icon: "work" as const, color: "#0A66C2", placeholder: "linkedin.com/in/seuperfil", pattern: /linkedin\.com\// },
  { key: "telegram", label: "Telegram", icon: "send" as const, color: "#26A5E4", placeholder: "t.me/seucanal", pattern: /t\.me\// },
  { key: "whatsapp_channel", label: "Canal WhatsApp", icon: "chat" as const, color: "#25D366", placeholder: "whatsapp.com/channel/...", pattern: /whatsapp\.com\/channel/ },
] as const;

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
