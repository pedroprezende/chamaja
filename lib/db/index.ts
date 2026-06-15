/**
 * Ponto de entrada do banco de dados XamaJá
 *
 * ADAPTADOR ATUAL: local (AsyncStorage)
 *
 * PARA MIGRAR PARA SUPABASE:
 * 1. Instalar: pnpm add @supabase/supabase-js
 * 2. Criar lib/db/supabase-adapter.ts implementando as mesmas funções
 * 3. Trocar o import abaixo para "./supabase-adapter"
 * 4. Adicionar SUPABASE_URL e SUPABASE_ANON_KEY nas variáveis de ambiente
 *
 * Os tipos em ./types.ts já seguem a nomenclatura de colunas do Supabase (snake_case).
 */

export * from "./types";
export {
  initDatabase,
  categoriesDB,
  subServicesDB,
  regionsDB,
  featuredAdsDB,
} from "./local-store";
