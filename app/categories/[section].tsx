import React, { useState, useEffect, useCallback, useRef } from "react";
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

import { getServicesByCategory, services as mockServices, categories } from "@/data/mock";
import type { Service as MockService } from "@/data/mock";
import { adminDB, type Service as AdminService } from "@/lib/admin-database";

// ─── Tipo unificado para exibição ────────────────────────────────────────────
type DisplayItem = {
  id: string;
  name: string;
  image?: string;
  categoryId: string;
  whatsapp?: string;
  isAdmin: boolean;
};

function mockToDisplay(s: MockService): DisplayItem {
  return {
    id: s.id,
    name: s.name,
    image: s.image,
    categoryId: s.categoryId,
    whatsapp: undefined,
    isAdmin: false,
  };
}

function adminToDisplay(s: AdminService): DisplayItem {
  return {
    id: s.id,
    name: s.name,
    image: s.imageUri,
    categoryId: s.categoryId,
    whatsapp: s.whatsapp,
    isAdmin: true,
  };
}

function openWhatsApp(phone: string, serviceName: string) {
  let number = phone.replace(/\D/g, "");
  if (!number.startsWith("55")) number = "55" + number;
  const msg = encodeURIComponent(
    `Olá! Vi o serviço "${serviceName}" no ChamaJá e gostaria de mais informações. 😊`
  );
  Linking.openURL(`https://wa.me/${number}?text=${msg}`).catch(() =>
    Alert.alert("WhatsApp não encontrado", "Verifique se o WhatsApp está instalado.")
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function CategoriesScreen() {
  const { section, title } = useLocalSearchParams<{
    section: string;
    title: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Título da categoria (parâmetro ou nome do categories array)
  const categoryTitle =
    title ||
    categories.find((c) => c.id === section)?.name.replace("\n", " ") ||
    "Categoria";

  // ── Serviços mock (síncronos) ──
  const mockData: DisplayItem[] = section
    ? getServicesByCategory(section).map(mockToDisplay)
    : mockServices.map(mockToDisplay);

  // ── Serviços admin (assíncronos) ──
  const [adminItems, setAdminItems] = useState<DisplayItem[]>([]);
  const [loading, setLoading] = useState(true);
  const firstLoad = useRef(true);

  const loadAdminServices = useCallback(async () => {
    try {
      setLoading(true);
      if (firstLoad.current) {
        adminDB.resetCache();
        firstLoad.current = false;
      }
      const all = await adminDB.getAllServices();
      const active = all.filter((s) => s.isActive);

      // Filtrar pela categoria atual
      // Comparação robusta: por categoryId OU pelo nome da categoria (fallback)
      const filtered = section
        ? active.filter((s) => {
            const idMatch = s.categoryId === section;
            // Fallback: comparar nome normalizado da categoria
            const catNameNorm = s.category
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "");
            const sectionCat = categories.find((c) => c.id === section);
            const sectionNameNorm = sectionCat
              ? sectionCat.name
                  .toLowerCase()
                  .normalize("NFD")
                  .replace(/[\u0300-\u036f]/g, "")
                  .replace(/\n/g, " ")
              : "";
            const nameMatch =
              sectionNameNorm.length > 0 &&
              (catNameNorm.includes(sectionNameNorm) ||
                sectionNameNorm.includes(catNameNorm));
            return idMatch || nameMatch;
          })
        : active;

      setAdminItems(filtered.map(adminToDisplay));
    } catch (e) {
      console.error("Erro ao carregar serviços admin na categoria:", e);
    } finally {
      setLoading(false);
    }
  }, [section]);

  useEffect(() => {
    loadAdminServices();
  }, [loadAdminServices]);

  // ── Combinar: admin primeiro (mais recentes/relevantes), depois mock ──
  // Remover duplicatas: se um serviço admin tem o mesmo ID que um mock (override), o admin prevalece
  const adminIds = new Set(adminItems.map((i) => i.id));
  const filteredMock = mockData.filter((m) => !adminIds.has(m.id));
  const combined: DisplayItem[] = [...adminItems, ...filteredMock];

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
            pathname: "/admin-services/[serviceId]",
            params: { serviceId: item.id, title: item.name },
          } as any);
        } else {
          router.push(`/professionals/${item.id}` as any);
        }
      }}
    >
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.cardImage} resizeMode="cover" />
      ) : (
        <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
          <MaterialIcons name="build" size={28} color="#9CA3AF" />
        </View>
      )}
      <Text style={styles.cardName} numberOfLines={2}>
        {item.name}
      </Text>

      {/* Badge "Admin" para serviços do painel */}
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
          {categoryTitle}
        </Text>
        <View style={styles.backBtn} />
      </View>

      {/* Contador */}
      {!loading && (
        <View style={styles.countRow}>
          <Text style={styles.countText}>
            {combined.length} serviço{combined.length !== 1 ? "s" : ""} encontrado{combined.length !== 1 ? "s" : ""}
          </Text>
          {adminItems.length > 0 && (
            <View style={styles.adminCountBadge}>
              <MaterialIcons name="verified" size={12} color="#15803D" />
              <Text style={styles.adminCountText}>{adminItems.length} do admin</Text>
            </View>
          )}
        </View>
      )}

      {/* Lista */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#25D366" />
          <Text style={styles.loadingText}>Carregando serviços...</Text>
        </View>
      ) : (
        <FlatList
          data={combined}
          keyExtractor={(item) => item.id}
          numColumns={3}
          contentContainerStyle={styles.gridContent}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={styles.row}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialIcons name="category" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>Nenhum serviço encontrado</Text>
              <Text style={styles.emptySubText}>
                Nenhum serviço cadastrado para esta categoria ainda.
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
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  countText: {
    fontSize: 13,
    color: "#6B7280",
    flex: 1,
  },
  adminCountBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F0FDF4",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  adminCountText: {
    fontSize: 11,
    color: "#15803D",
    fontWeight: "600",
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
    lineHeight: 16,
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
    gap: 12,
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 15,
    color: "#9CA3AF",
    fontWeight: "600",
  },
  emptySubText: {
    fontSize: 13,
    color: "#D1D5DB",
    textAlign: "center",
    lineHeight: 18,
  },
});
