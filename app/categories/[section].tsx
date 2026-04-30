/**
 * Tela de Categoria — exibe as SUBCATEGORIAS de uma categoria.
 * Nível 2 da hierarquia: Categoria → Subcategoria → Serviços
 *
 * Cards com imagem grande (2 colunas), nome abaixo e badge de quantidade.
 * Admin pode sobrescrever a imagem de cada subcategoria pelo painel.
 */
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Image,
  Dimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  categories,
  getSubcategories,
  type Subcategory,
} from "@/data/mock";
import { adminDB } from "@/lib/admin-database";
import { subcategoryImagesDB } from "@/lib/subcategory-images-db";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CARD_GAP = 12;
const CARD_PADDING = 16;
const CARD_WIDTH = (SCREEN_WIDTH - CARD_PADDING * 2 - CARD_GAP) / 2;
const CARD_IMAGE_HEIGHT = CARD_WIDTH * 0.65;

// ─── Componente principal ─────────────────────────────────────────────────────
export default function CategoryScreen() {
  const { section, title } = useLocalSearchParams<{
    section: string;
    title: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const categoryTitle =
    title ||
    categories.find((c) => c.id === section)?.name.replace("\n", " ") ||
    "Categoria";

  const subcategories: Subcategory[] = section ? getSubcategories(section) : [];

  const [adminCountBySubcat, setAdminCountBySubcat] = useState<Record<string, number>>({});
  const [imageOverrides, setImageOverrides] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      adminDB.resetCache();
      subcategoryImagesDB.resetCache();

      // Carregar contagens de serviços admin por subcategoria
      const all = await adminDB.getAllServices();
      const active = all.filter((s) => s.isActive);
      const counts: Record<string, number> = {};
      for (const svc of active) {
        if (svc.subcategoryId) {
          counts[svc.subcategoryId] = (counts[svc.subcategoryId] || 0) + 1;
        }
        if (!svc.subcategoryId && svc.categoryId === section) {
          counts["_root"] = (counts["_root"] || 0) + 1;
        }
      }
      setAdminCountBySubcat(counts);

      // Carregar overrides de imagem do admin
      const overrides = await subcategoryImagesDB.getAll();
      const overrideMap: Record<string, string> = {};
      for (const o of overrides) {
        overrideMap[o.subcategoryId] = o.imageUrl;
      }
      setImageOverrides(overrideMap);
    } catch (e) {
      console.error("Erro ao carregar dados da categoria:", e);
    } finally {
      setLoading(false);
    }
  }, [section]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalAdminServices = Object.values(adminCountBySubcat).reduce((a, b) => a + b, 0);

  // ── Render subcategoria como card com imagem grande ──
  const renderSubcategory = ({ item }: { item: Subcategory }) => {
    const count = adminCountBySubcat[item.id] || 0;
    // Prioridade: override admin > imageUrl do mock > null (ícone)
    const imageUrl = imageOverrides[item.id] || item.imageUrl;

    return (
      <Pressable
        style={({ pressed }) => [styles.card, pressed && { opacity: 0.88 }]}
        onPress={() =>
          router.push({
            pathname: "/subcategory/[subcategoryId]" as any,
            params: { subcategoryId: item.id, title: item.name, categoryId: section },
          })
        }
      >
        {/* Imagem */}
        <View style={styles.cardImageContainer}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.cardImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.cardImageFallback}>
              <MaterialIcons
                name={(item.icon || "label") as any}
                size={36}
                color="#25D366"
              />
            </View>
          )}
          {/* Gradiente escuro no rodapé da imagem */}
          <View style={styles.cardImageOverlay} />
          {/* Badge de quantidade */}
          {count > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{count}</Text>
            </View>
          )}
        </View>

        {/* Nome */}
        <View style={styles.cardBody}>
          <Text style={styles.cardName} numberOfLines={2}>
            {item.name}
          </Text>
          <MaterialIcons name="chevron-right" size={16} color="#9CA3AF" />
        </View>
      </Pressable>
    );
  };

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

      {/* Subtítulo */}
      {!loading && (
        <View style={styles.subtitleRow}>
          <Text style={styles.subtitleText}>
            {subcategories.length} especialidade{subcategories.length !== 1 ? "s" : ""}
            {totalAdminServices > 0
              ? ` · ${totalAdminServices} serviço${totalAdminServices !== 1 ? "s" : ""} disponível${totalAdminServices !== 1 ? "s" : ""}`
              : ""}
          </Text>
        </View>
      )}

      {/* Grid de subcategorias */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#25D366" />
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      ) : subcategories.length === 0 ? (
        <View style={styles.empty}>
          <MaterialIcons name="category" size={48} color="#D1D5DB" />
          <Text style={styles.emptyText}>Nenhuma subcategoria encontrada</Text>
        </View>
      ) : (
        <FlatList
          data={subcategories}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.gridContent}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={styles.row}
          renderItem={renderSubcategory}
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
  subtitleRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  subtitleText: {
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
    padding: CARD_PADDING,
    paddingBottom: 32,
  },
  row: {
    gap: CARD_GAP,
    marginBottom: CARD_GAP,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  cardImageContainer: {
    width: "100%",
    height: CARD_IMAGE_HEIGHT,
    backgroundColor: "#F3F4F6",
    position: "relative",
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  cardImageFallback: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0FDF4",
  },
  cardImageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 30,
    backgroundColor: "rgba(0,0,0,0.12)",
  },
  countBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#25D366",
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    minWidth: 22,
    alignItems: "center",
  },
  countBadgeText: {
    fontSize: 11,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  cardBody: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  cardName: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
    lineHeight: 18,
    marginRight: 4,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 15,
    color: "#9CA3AF",
    fontWeight: "600",
    textAlign: "center",
  },
});
