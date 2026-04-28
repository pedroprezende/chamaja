import { useState, useEffect, useCallback, useRef } from "react";
import { adminDB, type Service } from "@/lib/admin-database";

/**
 * Hook que carrega os serviços criados pelo admin e permite recarregar.
 * Na primeira montagem invalida o cache para garantir dados frescos do AsyncStorage.
 * Usado na Home e em outras telas para exibir os serviços do painel admin.
 */
export function useAdminServices(onlyHome = false) {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const firstLoad = useRef(true);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      // Na primeira carga, invalida o cache para ler do AsyncStorage
      if (firstLoad.current) {
        adminDB.resetCache();
        firstLoad.current = false;
      }
      const all = await adminDB.getAllServices();
      const active = all.filter((s) => s.isActive);
      setServices(onlyHome ? active.filter((s) => s.showOnHome) : active);
    } catch (err) {
      console.error("Erro ao carregar serviços admin:", err);
    } finally {
      setIsLoading(false);
    }
  }, [onlyHome]);

  useEffect(() => {
    load();
  }, [load]);

  return { services, isLoading, reload: load };
}
