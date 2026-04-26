import { useState, useEffect, useCallback } from "react";
import { adminDB, type Service } from "@/lib/admin-database";

/**
 * Hook que carrega os serviços criados pelo admin e permite recarregar.
 * Usado na Home e em outras telas para exibir os serviços do painel admin.
 */
export function useAdminServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      const all = await adminDB.getAllServices();
      setServices(all.filter((s) => s.isActive));
    } catch (err) {
      console.error("Erro ao carregar serviços admin:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { services, isLoading, reload: load };
}
