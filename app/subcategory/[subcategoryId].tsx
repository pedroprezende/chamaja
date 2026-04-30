/**
 * Tela de Subcategoria — lista os SERVIÇOS de uma subcategoria específica.
 * Nível 3 da hierarquia: Categoria → Subcategoria → Serviços
 *
 * Combina:
 *  - Serviços do adminDB com subcategoryId correspondente
 *  - Profissionais do providersDB com categoryId correspondente
 */
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Linking,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getSubcategoryById } from "@/data/mock";
import { adminDB, type Service as AdminService } from "@/lib/admin-database";
import { providersDB, type StoredProvider } from "@/lib/providers-database";

// ─── Tipo unificado ───────────────────────────────────────────────────────────
type DisplayItem = {
  id: string;
  name: string;
  image?: string;
  whatsapp?: string;
  address?: string;
  description?: string;
  isAdmin: boolean;
  isProvider: boolean;
};

function adminToDisplay(s: AdminService): DisplayItem {
  return {
    id: s.id,
    name: s.name,
    image: s.imageUri,
    whatsapp: s.whatsapp,
    address: s.address,
    description: s.description,
    isAdmin: true,
    isProvider: false,
  };
}

function providerToDisplay(p: StoredProvider): DisplayItem {
  return {
    id: p.userId,
    name: p.name,
    image: p.avatar,
    whatsapp: p.phone,
    address: p.neighborhood ? `${p.neighborhood}, ${p.city}` : p.city,
    description: p.description,
    isAdmin: false,
    isProvider: true,
  };
}

function openWhatsApp(phone: string, name: string) {
  let number = phone.replace(/\D/g, "");
  if (!number.startsWith("55")) number = "55" + number;
  const msg = encodeURIComponent(
    `Olá! Vi o serviço "${name}" no ChamaJá e gostaria de mais informações. 😊`
  );
  Linking.openURL(`https://wa.me/${number}?text=${msg}`).catch(() =>
    Alert.alert("WhatsApp não encontrado", "Verifique se o WhatsApp está instalado.")
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function SubcategoryScreen() {
  const { subcategoryId, title, categoryId } = useLocalSearchParams<{
    subcategoryId: string;
    title: string;
    categoryId: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const subcategoryTitle =
    title ||
    getSubcategoryById(subcategoryId)?.name ||
    "Subcategoria";

  const [items, setItems] = useState<DisplayItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      adminDB.resetCache();

      // 1. Serviços admin com subcategoryId correspondente
      const allAdmin = await adminDB.getAllServices();
      const adminItems = allAdmin
        .filter((s) => s.isActive && s.subcategoryId === subcategoryId)
        .map(adminToDisplay);

      // 2. Prestadores reais com categoryId correspondente (subcategoryId ou categoryId)
      let providerItems: DisplayItem[] = [];
      try {
        const providers = await providersDB.getByCategory(subcategoryId);
        providerItems = providers.map(providerToDisplay);
      } catch {
        // providersDB pode estar vazio
      }

      // Combinar: admin primeiro, depois prestadores (sem duplicatas por ID)
      const adminIds = new Set(adminItems.map((i) => i.id));
      const merged = [
        ...adminItems,
        ...providerItems.filter((p) => !adminIds.has(p.id)),
      ];

      setItems(merged);
    } catch (e) {
      console.error("Erro ao carregar serviços da subcategoria:", e);
    } finally {
      setLoading(false);
    }
  }, [subcategoryId]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // ── Render item ──
  const renderItem = ({ item }: { item: DisplayItem }) => (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        item.isAdmin && styles.cardAdmin,
        pressed && { opacity: 0.85 },
      ]}
      onPress={() => {
        if (item.isAdmin) {
          router.push({
            pathname: "/admin-services/[serviceId]" as any,
            params: { serviceId: item.id, title: item.name },
          });
        } else {
          router.push(`/professional/${item.id}` as any);
        }
      }}
    >
      {/* Imagem */}
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.cardImage} resizeMode="cover" />
      ) : (
        <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
          <MaterialIcons name="person" size={28} color="#9CA3AF" />
        </View>
      )}

      {/* Nome */}
      <Text style={styles.cardName} numberOfLines={2}>
        {item.name}
      </Text>

      {/* Endereço */}
      {!!item.address && (
        <View style={styles.cardAddressRow}>
          <MaterialIcons name="place" size={10} color="#9CA3AF" />
          <Text style={styles.cardAddress} numberOfLines={1}>{item.address}</Text>
        </View>
      )}

      {/* Badge admin */}
      {item.isAdmin && (
        <View style={styles.adminBadge}>
          <MaterialIcons name="verified" size={10} color="#FFFFFF" />
        </View>
      )}

      {/* Botão WhatsApp */}
      {!!item.whatsapp && (
        <Pressable
          style={({ pressed }) => [styles.whatsappBtn, pressed && { opacity: 0.7 }]}
          onPress={(e) => {
            e.stopPropagation?.();
            openWhatsApp(item.whatsapp!, item.name);
          }}
        >
          <MaterialIcons name="chat" size={12} color="#FFFFFF" />
        </Pressable>
      )}
    </Pressable>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#111827" />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {subcategoryTitle}
        </Text>
        <View style={styles.backBtn} />
      </View>

      {/* Contador */}
      {!loading && (
        <View style={styles.countRow}>
          <Text style={styles.countText}>
            {items.length} profissional{items.length !== 1 ? "is" : ""} encontrado{items.length !== 1 ? "s" : ""}
          </Text>
        </View>
      )}

      {/* Lista */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#25D366" />
          <Text style={styles.loadingText}>Carregando profissionais...</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          numColumns={3}
          contentContainerStyle={styles.gridContent}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={styles.row}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialIcons name="search-off" size={48} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>Em breve</Text>
              <Text style={styles.emptyText}>
                Ainda não há profissionais cadastrados para "{subcategoryTitle}".
              </Text>
              <Text style={styles.emptyHint}>
                Seja o primeiro a oferecer este serviço!
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },
  countRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  countText: {
    fontSize: 13,
    color: "#6B7280",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  gridContent: {
    padding: 12,
    paddingBottom: 24,
  },
  row: {
    gap: 10,
    marginBottom: 10,
  },
  card: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardAdmin: {
    borderColor: "#BBF7D0",
    borderWidth: 1.5,
  },
  cardImage: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#F3F4F6",
  },
  cardImagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  cardName: {
    fontSize: 12,
    fontWeight: "500",
    color: "#111827",
    padding: 8,
    paddingTop: 6,
    paddingBottom: 2,
    lineHeight: 16,
    textAlign: "center",
  },
  cardAddressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 8,
    paddingBottom: 6,
    justifyContent: "center",
  },
  cardAddress: {
    fontSize: 10,
    color: "#9CA3AF",
    flex: 1,
    textAlign: "center",
  },
  adminBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "#25D366",
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  whatsappBtn: {
    position: "absolute",
    bottom: 30,
    right: 6,
    backgroundColor: "#25D366",
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: {
    alignItems: "center",
    paddingTop: 60,
    gap: 10,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#374151",
  },
  emptyText: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 20,
  },
  emptyHint: {
    fontSize: 13,
    color: "#25D366",
    fontWeight: "600",
    textAlign: "center",
  },
});
