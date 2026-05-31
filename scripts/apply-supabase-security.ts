import "dotenv/config";
import postgres from "postgres";

const SQL_SCRIPT = `
-- ============================================================================
-- 1. EXTENSÕES E FUNÇÕES DE SEGURANÇA
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Criar ou atualizar a função auxiliar is_admin com SECURITY DEFINER e search_path seguro
-- Isso corrige de vez a vulnerabilidade "Function Search Path Mutable"
CREATE OR REPLACE FUNCTION public.is_admin() 
RETURNS BOOLEAN 
SET search_path = public 
SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE open_id = auth.uid()::text AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql;

-- Garantir explicitamente que a função existente tenha o search_path corrigido
ALTER FUNCTION public.is_admin() SET search_path = public;

-- ============================================================================
-- 2. HABILITAR ROW LEVEL SECURITY (RLS) EM TODAS AS TABELAS
-- ============================================================================
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.featured_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;



-- ============================================================================
-- 3. LIMPEZA DE POLÍTICAS EXISTENTES (Garantir idempotência e evitar conflitos)
-- ============================================================================
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' 
          AND tablename IN (
            'categories', 'services', 'users', 'sub_services', 
            'providers', 'reviews', 'featured_ads', 'whatsapp_clicks', 
            'search_queries', 'service_views', 'regions', 'system_logs',
            'favorites', 'app_events', 'pagamentos'
          )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
    END LOOP;
END
$$;

-- ============================================================================
-- 4. CRIAÇÃO DAS POLÍTICAS DE ACESSO SEGURO
-- ============================================================================

-- ── 4.1. Tabelas de Catálogo (Leitura Pública, Escrita Admin) ───────────────

-- categories
CREATE POLICY "Public SELECT categories" ON public.categories FOR SELECT TO public USING (true);
CREATE POLICY "Admin ALL categories" ON public.categories FOR ALL TO authenticated USING (public.is_admin());

-- sub_services
CREATE POLICY "Public SELECT sub_services" ON public.sub_services FOR SELECT TO public USING (true);
CREATE POLICY "Admin ALL sub_services" ON public.sub_services FOR ALL TO authenticated USING (public.is_admin());

-- services
CREATE POLICY "Public SELECT services" ON public.services FOR SELECT TO public USING (true);
CREATE POLICY "Admin ALL services" ON public.services FOR ALL TO authenticated USING (public.is_admin());

-- regions
CREATE POLICY "Public SELECT regions" ON public.regions FOR SELECT TO public USING (true);
CREATE POLICY "Admin ALL regions" ON public.regions FOR ALL TO authenticated USING (public.is_admin());

-- featured_ads (Leitura pública apenas de anúncios ativos/destacados)
CREATE POLICY "Public SELECT featured_ads" ON public.featured_ads FOR SELECT TO public USING (is_featured = true);
CREATE POLICY "Admin ALL featured_ads" ON public.featured_ads FOR ALL TO authenticated USING (public.is_admin());

-- ── 4.2. Usuários e Prestadores (Acesso ao Próprio Recurso + Admin) ──────────

-- users
CREATE POLICY "User/Admin SELECT users" ON public.users FOR SELECT TO authenticated USING (open_id = auth.uid()::text OR public.is_admin());
CREATE POLICY "User/Admin INSERT users" ON public.users FOR INSERT TO authenticated WITH CHECK (open_id = auth.uid()::text OR public.is_admin());
CREATE POLICY "User/Admin UPDATE users" ON public.users FOR UPDATE TO authenticated USING (open_id = auth.uid()::text OR public.is_admin()) WITH CHECK (open_id = auth.uid()::text OR public.is_admin());
CREATE POLICY "Admin DELETE users" ON public.users FOR DELETE TO authenticated USING (public.is_admin());

-- providers
CREATE POLICY "Public/Own SELECT providers" ON public.providers FOR SELECT TO public USING (is_active = true OR user_id = auth.uid()::text OR public.is_admin());
CREATE POLICY "User/Admin INSERT providers" ON public.providers FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid()::text OR public.is_admin());
CREATE POLICY "User/Admin UPDATE providers" ON public.providers FOR UPDATE TO authenticated USING (user_id = auth.uid()::text OR public.is_admin()) WITH CHECK (user_id = auth.uid()::text OR public.is_admin());
CREATE POLICY "Admin DELETE providers" ON public.providers FOR DELETE TO authenticated USING (public.is_admin());

-- favorites
CREATE POLICY "User/Admin SELECT favorites" ON public.favorites FOR SELECT TO authenticated USING (user_id = auth.uid()::text OR public.is_admin());
CREATE POLICY "User/Admin INSERT favorites" ON public.favorites FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid()::text OR public.is_admin());
CREATE POLICY "User/Admin DELETE favorites" ON public.favorites FOR DELETE TO authenticated USING (user_id = auth.uid()::text OR public.is_admin());

-- ── 4.3. Avaliações (reviews - Escrita Autenticada, Leitura Pública, Moderada por Admin) ──

-- reviews
CREATE POLICY "Public SELECT reviews" ON public.reviews FOR SELECT TO public USING (true);
CREATE POLICY "Auth INSERT reviews" ON public.reviews FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin ALL reviews" ON public.reviews FOR ALL TO authenticated USING (public.is_admin());

-- ── 4.4. Analytics & Logs (Acesso Exclusivo Admin/Backend) ───────────────────
-- O backend ignora RLS via connection string direta. Pela API web, apenas admins acessam.

CREATE POLICY "Admin ALL whatsapp_clicks" ON public.whatsapp_clicks FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admin ALL search_queries" ON public.search_queries FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admin ALL service_views" ON public.service_views FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admin ALL system_logs" ON public.system_logs FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admin ALL app_events" ON public.app_events FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admin ALL pagamentos" ON public.pagamentos FOR ALL TO authenticated USING (public.is_admin());



-- ============================================================================
-- 5. POLÍTICAS DE SEGURANÇA DO STORAGE BUCKETS (storage.objects)
-- ============================================================================

-- Limpar quaisquer políticas existentes no storage.objects relacionadas ao chamaja-images
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' 
          AND tablename = 'objects'
          AND policyname IN (
            'Public Access Objects', 'Auth Upload Objects', 
            'Update Own Objects', 'Delete Own Objects or Admin',
            'Public Select Objects', 'Owner Update Objects', 
            'Owner or Admin Delete Objects'
          )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
    END LOOP;
END
$$;

-- Criar políticas restritivas e extremamente seguras para o bucket chamaja-images
CREATE POLICY "Public Select Objects" ON storage.objects FOR SELECT TO public USING (bucket_id = 'chamaja-images');
CREATE POLICY "Auth Upload Objects" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'chamaja-images' AND auth.role() = 'authenticated');
CREATE POLICY "Owner Update Objects" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'chamaja-images' AND auth.uid() = owner) WITH CHECK (bucket_id = 'chamaja-images');
CREATE POLICY "Owner or Admin Delete Objects" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'chamaja-images' AND (auth.uid() = owner OR public.is_admin()));
`;

async function applySecurity() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("Erro: DATABASE_URL não encontrada no arquivo .env");
    process.exit(1);
  }

  console.log("Iniciando conexão com o banco de dados Supabase...");
  const sql = postgres(dbUrl, { max: 1 });

  try {
    console.log("Executando transação de endurecimento de segurança no Supabase...");
    await sql.unsafe(SQL_SCRIPT);
    console.log("🎉 SUCESSO! Row Level Security, Políticas de Acesso, Search Path de Funções e Políticas de Buckets aplicados perfeitamente!");
  } catch (error) {
    console.error("❌ ERRO crítico ao aplicar segurança:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

applySecurity();
