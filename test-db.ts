import "dotenv/config";
import { getDb } from "./server/db";
import { providers, services, users } from "./drizzle/schema";
import { sql } from "drizzle-orm";

async function main() {
  const dbInstance = await getDb();
  if (!dbInstance) {
    console.log("No DB connection");
    process.exit(1);
  }

  console.log("Enabling RLS on public.appointments...");
  await dbInstance.execute(sql`ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;`);

  console.log("Creating RLS policies on public.appointments...");
  await dbInstance.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'appointments' AND policyname = 'Read own appointments') THEN
        CREATE POLICY "Read own appointments" ON public.appointments FOR SELECT USING (auth.uid()::text = user_id OR EXISTS (SELECT 1 FROM public.providers WHERE id = provider_id AND user_id = auth.uid()::text) OR public.is_admin());
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'appointments' AND policyname = 'Insert own appointment') THEN
        CREATE POLICY "Insert own appointment" ON public.appointments FOR INSERT WITH CHECK (auth.uid()::text = user_id OR EXISTS (SELECT 1 FROM public.providers WHERE id = provider_id AND user_id = auth.uid()::text) OR public.is_admin());
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'appointments' AND policyname = 'Update own appointment') THEN
        CREATE POLICY "Update own appointment" ON public.appointments FOR UPDATE USING (auth.uid()::text = user_id OR EXISTS (SELECT 1 FROM public.providers WHERE id = provider_id AND user_id = auth.uid()::text) OR public.is_admin());
      END IF;
    END $$;
  `);

  console.log("RLS successfully enabled for public.appointments!");
  process.exit(0);
}

main().catch(console.error);
