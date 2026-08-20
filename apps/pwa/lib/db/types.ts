/**
 * Tipos do banco de dados do ChamaJá
 * Compatível com Supabase — cada interface corresponde a uma tabela
 * Para integrar com Supabase: trocar o adaptador em lib/db/index.ts
 */

export interface DbCategory {
  id: string;
  name: string;
  icon: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbSubService {
  id: string;
  category_id: string;
  name: string;
  icon: string;
  image_url: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface DbRegion {
  id: string;
  name: string;
  state: string;
  providers_count: number;
  ads_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbProvider {
  id: string;
  user_id: string | null;
  name: string;
  category_id: string;
  category_name: string;
  description: string;
  city: string;
  neighborhood: string;
  phone: string;
  avatar_url: string | null;
  rating: number;
  review_count: number;
  distance_km: number | null;
  show_distance: boolean;
  is_active: boolean;
  plan: "free" | "monthly" | "annual" | null;
  plan_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbFeaturedAd {
  id: string;
  provider_id: string;
  provider_name: string;
  provider_avatar: string | null;
  category_name: string;
  views: number;
  is_featured: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

/** Tipo genérico para resultado de operações do banco */
export interface DbResult<T> {
  data: T | null;
  error: string | null;
}

export interface DbListResult<T> {
  data: T[];
  error: string | null;
}
