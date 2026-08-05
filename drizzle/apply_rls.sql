-- 1. Helper Function de Segurança (Definer para não sofrer recursão infinita)
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE open_id = auth.uid()::text AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Ativar RLS (Row Level Security) em todas as tabelas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.featured_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.utm_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;



-- (Opcional) Limpar políticas caso já existam para recriar de forma limpa.
-- Geralmente é bom apenas criar com nomes únicos.

-- 3. Tabela: users
CREATE POLICY "Public read users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Insert own user" ON public.users FOR INSERT WITH CHECK (auth.uid()::text = open_id);
CREATE POLICY "Update own user or Admin" ON public.users FOR UPDATE USING (auth.uid()::text = open_id OR public.is_admin());
CREATE POLICY "Admin delete users" ON public.users FOR DELETE USING (public.is_admin());

-- 4. Tabela: providers
CREATE POLICY "Public read providers" ON public.providers FOR SELECT USING (true);
CREATE POLICY "Insert own provider or Admin" ON public.providers FOR INSERT WITH CHECK (auth.uid()::text = user_id OR public.is_admin());
CREATE POLICY "Update own provider or Admin" ON public.providers FOR UPDATE USING (auth.uid()::text = user_id OR public.is_admin());
CREATE POLICY "Admin delete providers" ON public.providers FOR DELETE USING (public.is_admin());

-- 5. Tabelas de Catálogo (Leitura Pública, Modificação Apenas Admin)
-- categories
CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admin write categories" ON public.categories FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admin update categories" ON public.categories FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admin delete categories" ON public.categories FOR DELETE USING (public.is_admin());

-- sub_services
CREATE POLICY "Public read sub_services" ON public.sub_services FOR SELECT USING (true);
CREATE POLICY "Admin write sub_services" ON public.sub_services FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admin update sub_services" ON public.sub_services FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admin delete sub_services" ON public.sub_services FOR DELETE USING (public.is_admin());

-- services
CREATE POLICY "Public read services" ON public.services FOR SELECT USING (true);
CREATE POLICY "Admin write services" ON public.services FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admin update services" ON public.services FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admin delete services" ON public.services FOR DELETE USING (public.is_admin());

-- featured_ads
CREATE POLICY "Public read featured_ads" ON public.featured_ads FOR SELECT USING (true);
CREATE POLICY "Admin write featured_ads" ON public.featured_ads FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admin update featured_ads" ON public.featured_ads FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admin delete featured_ads" ON public.featured_ads FOR DELETE USING (public.is_admin());

-- regions
CREATE POLICY "Public read regions" ON public.regions FOR SELECT USING (true);
CREATE POLICY "Admin write regions" ON public.regions FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admin update regions" ON public.regions FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admin delete regions" ON public.regions FOR DELETE USING (public.is_admin());

-- plans
CREATE POLICY "Public read plans" ON public.plans FOR SELECT USING (true);
CREATE POLICY "Admin write plans" ON public.plans FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admin update plans" ON public.plans FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admin delete plans" ON public.plans FOR DELETE USING (public.is_admin());

-- plan_price_history
CREATE POLICY "Public read plan_price_history" ON public.plan_price_history FOR SELECT USING (true);
CREATE POLICY "Admin write plan_price_history" ON public.plan_price_history FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admin update plan_price_history" ON public.plan_price_history FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admin delete plan_price_history" ON public.plan_price_history FOR DELETE USING (public.is_admin());

-- plan_benefits
CREATE POLICY "Public read plan_benefits" ON public.plan_benefits FOR SELECT USING (true);
CREATE POLICY "Admin write plan_benefits" ON public.plan_benefits FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admin update plan_benefits" ON public.plan_benefits FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admin delete plan_benefits" ON public.plan_benefits FOR DELETE USING (public.is_admin());

-- 6. Tabelas Sensíveis (Somente Backend ou Admin têm acesso a leitura/escrita)
-- Como o backend se conecta via connection_string (Postgres role), ele ignora o RLS.
-- O Frontend não conseguirá nem inserir nem ler.
CREATE POLICY "Admin full access whatsapp_clicks" ON public.whatsapp_clicks FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access search_queries" ON public.search_queries FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access service_views" ON public.service_views FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access system_logs" ON public.system_logs FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access app_events" ON public.app_events FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access pagamentos" ON public.pagamentos FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access utm_links" ON public.utm_links FOR ALL USING (public.is_admin());

-- appointments
CREATE POLICY "Read own appointments" ON public.appointments FOR SELECT USING (auth.uid()::text = user_id OR EXISTS (SELECT 1 FROM public.providers WHERE id = provider_id AND user_id = auth.uid()::text) OR public.is_admin());
CREATE POLICY "Insert own appointment" ON public.appointments FOR INSERT WITH CHECK (auth.uid()::text = user_id OR EXISTS (SELECT 1 FROM public.providers WHERE id = provider_id AND user_id = auth.uid()::text) OR public.is_admin());
CREATE POLICY "Update own appointment" ON public.appointments FOR UPDATE USING (auth.uid()::text = user_id OR EXISTS (SELECT 1 FROM public.providers WHERE id = provider_id AND user_id = auth.uid()::text) OR public.is_admin());



-- 7. Storage Buckets (Restringindo acesso de imagens do Supabase)
CREATE POLICY "Public Access Objects" ON storage.objects FOR SELECT USING ( bucket_id = 'chamaja-images' );
CREATE POLICY "Auth Upload Objects" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'chamaja-images' AND auth.role() = 'authenticated' );
CREATE POLICY "Update Own Objects" ON storage.objects FOR UPDATE USING ( auth.uid() = owner ) WITH CHECK ( bucket_id = 'chamaja-images' );
CREATE POLICY "Delete Own Objects or Admin" ON storage.objects FOR DELETE USING ( auth.uid() = owner OR public.is_admin() );
