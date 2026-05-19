import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { trpc } from '@/lib/trpc';
import { adminDB } from '@/lib/admin-database';
import { adsDB } from '@/lib/ads-database';

export function MigrationManager() {
  const [migrating, setMigrating] = useState(false);
  const [status, setStatus] = useState("");
  const [failMsg, setFailMsg] = useState("");
  const [showManual, setShowManual] = useState(false);
  
  const utils = trpc.useUtils();
  
  // Queries
  const { data: dbServices = [], isLoading: loadingS } = trpc.services.list.useQuery();
  const { data: dbAds = [], isLoading: loadingA } = trpc.featuredAds.list.useQuery();
  
  // Mutations
  const createService = trpc.services.create.useMutation();
  const createAd = trpc.featuredAds.create.useMutation();

  const runMigration = async () => {
    const localServices = await adminDB.getAllServices();
    const localAds = await adsDB.getAll();
    
    if (localServices.length === 0 && localAds.length === 0) {
      setStatus("Nenhum dado local encontrado.");
      setTimeout(() => setMigrating(false), 2000);
      return;
    }

    setMigrating(true);
    setStatus("Sincronizando...");
    let successCount = 0;
    let failCount = 0;
    
    try {
      // Migrar Serviços
      for (const s of localServices) {
        try {
          if (!dbServices.find(dbS => dbS.name === s.name)) {
            await createService.mutateAsync({
              name: s.name,
              category: s.category,
              categoryId: s.categoryId,
              subcategoryId: s.subcategoryId,
              subcategoryName: s.subcategoryName,
              description: s.description,
              icon: s.icon,
              imageUri: s.imageUri,
              whatsapp: s.whatsapp,
              address: s.address,
              gallery: s.gallery,
              showOnHome: s.showOnHome,
            });
            successCount++;
          }
        } catch (err: any) {
          console.warn("Falha ao migrar serviço:", s.name, err);
          if (!failMsg) setFailMsg(err.message || "Erro desconhecido");
          failCount++;
        }
      }

      // Migrar Anúncios
      for (const ad of localAds) {
        try {
          if (!dbAds.find(dbA => dbA.providerName === ad.providerName)) {
            await createAd.mutateAsync({
              providerId: ad.providerId || "manual-" + Date.now(),
              providerName: ad.providerName,
              providerAvatar: ad.imageUrl,
              categoryName: ad.title,
              customDescription: ad.description,
              isFeatured: ad.isActive,
            });
            successCount++;
          }
        } catch (err: any) {
          console.warn("Falha ao migrar anúncio:", ad.providerName, err);
          if (!failMsg) setFailMsg(err.message || "Erro desconhecido");
          failCount++;
        }
      }

      await utils.services.list.invalidate();
      await utils.featuredAds.list.invalidate();
      
      if (failCount > 0) {
        setStatus(`Erro: ${failMsg || 'Falha em ' + failCount + ' itens'}`);
      } else {
        setStatus("Tudo pronto! Seus dados voltaram.");
      }
      
      setTimeout(() => setMigrating(false), 3000);
      
    } catch (e: any) {
      console.error("[Migration] Erro crítico:", e);
      setStatus("Erro Crítico: " + (e.message || "Falha no servidor"));
      setTimeout(() => setMigrating(false), 6000);
    }
  };

  useEffect(() => {
    const timer = setTimeout(async () => {
      const localServices = await adminDB.getAllServices();
      const localAds = await adsDB.getAll();
      if ((dbServices.length === 0 && localServices.length > 0) || (dbAds.length === 0 && localAds.length > 0)) {
        setShowManual(true);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [dbServices.length, dbAds.length]);

  if (migrating) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color="#25D366" />
        <Text style={[styles.text, status.includes("Erro") && { color: '#DC2626' }]}>{status}</Text>
      </View>
    );
  }

  if (showManual) {
    return (
      <Pressable 
        style={({ pressed }) => [styles.manualBtn, pressed && { opacity: 0.8 }]} 
        onPress={runMigration}
      >
        <MaterialIcons name="cloud-upload" size={18} color="#FFFFFF" />
        <Text style={styles.manualBtnText}>Restaurar meus dados locais</Text>
      </Pressable>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#F0FDF4',
    borderBottomWidth: 1,
    borderBottomColor: '#DCFCE7',
    gap: 10,
  },
  text: {
    fontSize: 13,
    color: '#15803D',
    fontWeight: '700',
  },
  manualBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    backgroundColor: '#2563EB',
    gap: 10,
    margin: 10,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  manualBtnText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '800',
    textTransform: 'uppercase',
  },
});
