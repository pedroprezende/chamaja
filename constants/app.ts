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
