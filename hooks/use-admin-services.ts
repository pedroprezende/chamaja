import { useState, useEffect, useCallback, useRef } from "react";
import { adminDB, type Service } from "@/lib/admin-database";
import { useAuth } from "@/lib/auth-context";
import { trpc } from "@/lib/trpc";

/**
 * Hook que carrega os serviços criados pelo admin e permite recarregar.
 * Na primeira montagem invalida o cache para garantir dados frescos do AsyncStorage.
 * Usado na Home e em outras telas para exibir os serviços do painel admin.
 * Realiza sincronização bidirecional em tempo real com o banco de dados remoto caso o usuário logado seja admin.
 */
export function useAdminServices(onlyHome = false) {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const firstLoad = useRef(true);

  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  // tRPC Queries and Mutations (enabled only for admins)
  const { data: serverServices, refetch: refetchServer } =
    trpc.services.all.useQuery(undefined, {
      enabled: isAdmin,
    });

  const syncMutationCreate = trpc.services.create.useMutation();
  const syncMutationUpdate = trpc.services.update.useMutation();
  const syncMutationDelete = trpc.services.delete.useMutation();

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

  // Sincronização em segundo plano baseada em updatedAt
  useEffect(() => {
    const performSync = async () => {
      if (!isAdmin || !serverServices) return;

      try {
        const local = await adminDB.getAllServices();

        // 1. Excluir no servidor os serviços que foram deletados localmente
        const deletedIds = await adminDB.getDeletedServiceIds();
        for (const delId of deletedIds) {
          if (serverServices.some((s) => s.id === delId)) {
            console.log(`[Sync] Deletando serviço ${delId} no servidor`);
            await syncMutationDelete.mutateAsync({ id: delId });
          }
        }
        await adminDB.clearDeletedServiceIds();

        // 2. Enviar criações/atualizações locais ao servidor
        for (const localSvc of local) {
          const serverSvc = serverServices.find((s) => s.id === localSvc.id);
          if (!serverSvc) {
            console.log(`[Sync] Criando serviço ${localSvc.name} no servidor`);
            await syncMutationCreate.mutateAsync({
              name: localSvc.name,
              category: localSvc.category,
              categoryId: localSvc.categoryId || undefined,
              subcategoryId: localSvc.subcategoryId || undefined,
              subcategoryName: localSvc.subcategoryName || undefined,
              description: localSvc.description || undefined,
              icon: localSvc.icon || undefined,
              imageUri: localSvc.imageUri || undefined,
              whatsapp: localSvc.whatsapp || undefined,
              address: localSvc.address || undefined,
              gallery: localSvc.gallery || undefined,
              showOnHome: localSvc.showOnHome,
            });
          } else {
            const localTime = new Date(localSvc.updatedAt).getTime();
            const serverTime = new Date(serverSvc.updatedAt).getTime();

            if (localTime > serverTime) {
              console.log(
                `[Sync] Atualizando serviço ${localSvc.name} no servidor`,
              );
              await syncMutationUpdate.mutateAsync({
                id: localSvc.id,
                name: localSvc.name,
                category: localSvc.category,
                categoryId: localSvc.categoryId || undefined,
                subcategoryId: localSvc.subcategoryId || undefined,
                subcategoryName: localSvc.subcategoryName || undefined,
                description: localSvc.description || undefined,
                icon: localSvc.icon || undefined,
                imageUri: localSvc.imageUri || undefined,
                whatsapp: localSvc.whatsapp || undefined,
                address: localSvc.address || undefined,
                gallery: localSvc.gallery || undefined,
                showOnHome: localSvc.showOnHome,
                isActive: localSvc.isActive,
                displayOrder: localSvc.displayOrder,
              });
            } else if (serverTime > localTime) {
              console.log(
                `[Sync] Atualizando serviço ${localSvc.name} localmente`,
              );
              await adminDB.updateService(localSvc.id, {
                name: serverSvc.name,
                category: serverSvc.category,
                categoryId: serverSvc.categoryId || "",
                subcategoryId: serverSvc.subcategoryId || undefined,
                subcategoryName: serverSvc.subcategoryName || undefined,
                description: serverSvc.description || "",
                icon: serverSvc.icon || undefined,
                imageUri: serverSvc.imageUri || undefined,
                whatsapp: serverSvc.whatsapp || undefined,
                address: serverSvc.address || undefined,
                gallery: serverSvc.gallery || undefined,
                showOnHome: serverSvc.showOnHome,
                isActive: serverSvc.isActive,
                displayOrder: serverSvc.displayOrder,
                updatedAt: serverSvc.updatedAt,
              });
            }
          }
        }

        // 3. Trazer novidades do servidor para o local
        for (const serverSvc of serverServices) {
          if (deletedIds.includes(serverSvc.id)) continue;

          const localSvc = local.find((s) => s.id === serverSvc.id);
          if (!localSvc) {
            console.log(
              `[Sync] Baixando serviço ${serverSvc.name} para o local`,
            );
            await adminDB.upsertServiceWithId(
              serverSvc.id,
              serverSvc.adminId,
              serverSvc.name,
              serverSvc.category,
              serverSvc.description || "",
              serverSvc.icon || undefined,
              serverSvc.imageUri || undefined,
              serverSvc.categoryId || undefined,
              serverSvc.showOnHome,
              serverSvc.whatsapp || undefined,
            );
            await adminDB.updateService(serverSvc.id, {
              subcategoryId: serverSvc.subcategoryId || undefined,
              subcategoryName: serverSvc.subcategoryName || undefined,
              address: serverSvc.address || undefined,
              gallery: serverSvc.gallery || undefined,
              displayOrder: serverSvc.displayOrder,
              isActive: serverSvc.isActive,
              updatedAt: serverSvc.updatedAt,
            });
          }
        }

        // Recarregar estado
        const all = await adminDB.getAllServices();
        const active = all.filter((s) => s.isActive);
        setServices(onlyHome ? active.filter((s) => s.showOnHome) : active);
      } catch (err) {
        console.error("Erro na sincronização de serviços:", err);
      }
    };

    performSync();
  }, [
    serverServices,
    isAdmin,
    syncMutationCreate,
    syncMutationUpdate,
    syncMutationDelete,
    onlyHome,
  ]);

  useEffect(() => {
    load();
  }, [load]);

  const reloadWithServer = useCallback(async () => {
    await load();
    if (isAdmin) {
      refetchServer();
    }
  }, [load, isAdmin, refetchServer]);

  return { services, isLoading, reload: reloadWithServer };
}
