/**
 * Tela de Categoria — exibe as SUBCATEGORIAS de uma categoria.
 * Nível 2 da hierarquia: Categoria → Subcategoria → Serviços
 *
 * Ao tocar numa subcategoria, navega para /subcategory/[subcategoryId]
 * que lista os serviços daquela subcategoria.
 */
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  ActivityIndicator,
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

// ─── Componente principal ─────────────────────────────────────────────────────
export default function CategoryScreen() {
  const { section, title } = useLocalSearchParams<{
    section: string;
    title: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Título da categoria
  const categoryTitle =
    title ||
    categories.find((c) => c.id === section)?.name.replace("\n", " ") ||
    "Categoria";

  // Subcategorias do mock
  const subcategories: Subcategory[] = section ? getSubcategories(section) : [];

  // Contar serviços admin por subcategoria (para mostrar badge de quantidade)
  const [adminCountBySubcat, setAdminCountBySubcat] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const loadAdminCounts = useCallback(async () => {
    try {
      setLoading(true);
      adminDB.resetCache();
      const all = await adminDB.getAllServices();
      const active = all.filter((s) => s.isActive);

      // Contar por subcategoryId
      const counts: Record<string, number> = {};
      for (const svc of active) {
        if (svc.subcategoryId) {
          counts[svc.subcategoryId] = (counts[svc.subcategoryId] || 0) + 1;
        }
        // Fallback: se categoryId corresponde à seção e não tem subcategoria, conta em "_root"
        if (!svc.subcategoryId && svc.categoryId === section) {
          counts["_root"] = (counts["_root"] || 0) + 1;
        }
      }
      setAdminCountBySubcat(counts);
    } catch (e) {
      console.error("Erro ao carregar contagens admin:", e);
    } finally {
      setLoading(false);
    }
  }, [section]);

  useEffect(() => {
    loadAdminCounts();
  }, [loadAdminCounts]);

  const totalAdminServices = Object.values(adminCountBySubcat).reduce((a, b) => a + b, 0);

  // ── Render subcategoria ──
  const renderSubcategory = ({ item }: { item: Subcategory }) => {
    const count = adminCountBySubcat[item.id] || 0;
    return (
      <Pressable
        style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
        onPress={() =>
          router.push({
            pathname: "/subcategory/[subcategoryId]" as any,
            params: { subcategoryId: item.id, title: item.name, categoryId: section },
          })
        }
      >
        <View style={styles.cardIconBg}>
          <MaterialIcons
            name={(item.icon || "label") as any}
            size={28}
            color="#25D366"
          />
        </View>
        <Text style={styles.cardName} numberOfLines={2}>
          {item.name}
        </Text>
        {count > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{count}</Text>
          </View>
        )}
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
            {subcategories.length} subcategoria{subcategories.length !== 1 ? "s" : ""}
            {totalAdminServices > 0 ? ` · ${totalAdminServices} serviço${totalAdminServices !== 1 ? "s" : ""} disponível${totalAdminServices !== 1 ? "s" : ""}` : ""}
          </Text>
        </View>
      )}

      {/* Lista de subcategorias */}
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
          numColumns={3}
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
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  cardName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111827",
    textAlign: "center",
    lineHeight: 16,
  },
  countBadge: {
    marginTop: 6,
    backgroundColor: "#25D366",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countBadgeText: {
    fontSize: 11,
    color: "#FFFFFF",
    fontWeight: "700",
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
