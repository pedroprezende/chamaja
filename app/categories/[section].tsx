import React, { useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Image as RNImage,
  Dimensions,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";

import { useWindowDimensions } from "react-native";

const CARD_GAP = 12;
const CARD_PADDING = 16;

export default function CategoryScreen() {
  const { width: WINDOW_WIDTH } = useWindowDimensions();
  const SCREEN_WIDTH = Platform.OS === "web" ? Math.min(WINDOW_WIDTH, 500) : WINDOW_WIDTH;
  const CARD_WIDTH = (SCREEN_WIDTH - CARD_PADDING * 2 - CARD_GAP) / 2;
  const CARD_IMAGE_HEIGHT = CARD_WIDTH * 0.75;

  const colors = useColors();
  const { section, title } = useLocalSearchParams<{
    section: string;
    title: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: dbSubcats = [], isLoading: loadingSubs } = trpc.categories.subServices.list.useQuery(
    { categoryId: section || "" },
    { enabled: !!section }
  );

  const { data: dbServices = [], isLoading: loadingServices } = trpc.services.getByCategory.useQuery(
    { categoryId: section || "" },
    { enabled: !!section }
  );

  const { data: dbProviders = [], isLoading: loadingProviders } = trpc.providers.getByCategory.useQuery(
    section || "",
    { enabled: !!section }
  );

  const subcatCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    
    // Contar Serviços
    dbServices.filter(s => s.isActive).forEach(s => {
      if (s.subcategoryId) {
        counts[s.subcategoryId] = (counts[s.subcategoryId] || 0) + 1;
      }
    });

    // Contar Prestadores
    dbProviders.filter(p => p.isActive).forEach(p => {
      if (p.subcategoryId) {
        // Pode ser "id1, id2"
        const ids = p.subcategoryId.split(",").map(id => id.trim());
        ids.forEach(id => {
          if (id) counts[id] = (counts[id] || 0) + 1;
        });
      }
    });

    return counts;
  }, [dbServices, dbProviders]);

  const renderSubcategory = ({ item }: { item: any }) => {
    const count = subcatCounts[item.id] || 0;
    const imageUrl = item.imageUrl;

    return (
      <Pressable
        style={({ pressed }) => [
          styles.card, 
          { width: CARD_WIDTH, backgroundColor: colors.surface, borderColor: colors.border },
          pressed && { opacity: 0.88, transform: [{ scale: 0.97 }] }
        ]}
        onPress={() => {
          router.push({
            pathname: "/subcategory/[subcategoryId]" as any,
            params: { subcategoryId: item.id, title: item.name, categoryId: section },
          });
        }}
      >
        <View style={[styles.cardImageContainer, { height: CARD_IMAGE_HEIGHT, backgroundColor: colors.background }]}>
          {imageUrl ? (
            <Image 
              source={{ uri: imageUrl }} 
              style={styles.cardImage} 
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={[styles.cardImageFallback, { backgroundColor: colors.background }]}>
              <MaterialIcons name={(item.icon || "label") as any} size={40} color={colors.primary} />
            </View>
          )}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.1)"]}
            style={styles.cardImageOverlay}
          />
          {count > 0 && (
            <View style={[styles.countBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.countBadgeText}>{count}</Text>
            </View>
          )}
        </View>

        <View style={styles.cardBody}>
          <Text style={[styles.cardName, { color: colors.foreground }]} numberOfLines={2}>{item.name}</Text>
          <MaterialIcons name="chevron-right" size={18} color={colors.muted} />
        </View>
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <LinearGradient
        colors={colors.background === "#F8F9FA" ? ["#FFFFFF", "#F8F9FA"] : ["#1E293B", "#0F172A"]}
        style={[styles.header, { borderBottomColor: colors.border }]}
      >
        <Pressable 
          onPress={() => router.back()} 
          style={({ pressed }) => [styles.backBtn, { backgroundColor: colors.background }, pressed && { opacity: 0.7 }]}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>{title || "Categoria"}</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      {loadingSubs || loadingProviders || loadingServices ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : dbSubcats.length === 0 ? (
        <View style={styles.empty}>
          <View style={[styles.emptyIconBg, { backgroundColor: colors.surface }]}>
            <MaterialIcons name="category" size={48} color={colors.muted} />
          </View>
          <Text style={[styles.emptyText, { color: colors.muted }]}>Nenhuma subcategoria encontrada</Text>
        </View>
      ) : (
        <FlatList
          data={dbSubcats}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.gridContent}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={styles.row}
          renderItem={renderSubcategory}
          windowSize={10}
          initialNumToRender={6}
          maxToRenderPerBatch={4}
          removeClippedSubviews={true}
          ListHeaderComponent={
            (loadingSubs || loadingProviders || loadingServices) ? (
              <View style={styles.gridContent}>
                <View style={styles.row}>
                  <Skeleton width={CARD_WIDTH} height={CARD_IMAGE_HEIGHT + 60} borderRadius={20} />
                  <Skeleton width={CARD_WIDTH} height={CARD_IMAGE_HEIGHT + 60} borderRadius={20} />
                </View>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    flexDirection: "row", 
    alignItems: "center", 
    paddingHorizontal: 16, 
    paddingVertical: 16, 
    borderBottomWidth: 1,
  },
  backBtn: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "800", textAlign: "center", letterSpacing: -0.5 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  gridContent: { padding: CARD_PADDING, paddingBottom: 40 },
  row: { gap: CARD_GAP, marginBottom: CARD_GAP },
  card: { 
    borderRadius: 20, 
    overflow: "hidden", 
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardImageContainer: { width: "100%" },
  cardImage: { width: "100%", height: "100%" },
  cardImageFallback: { width: "100%", height: "100%", alignItems: "center", justifyContent: "center" },
  cardImageOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, height: 40 },
  countBadge: { position: "absolute", top: 10, right: 10, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, minWidth: 24, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 },
  countBadgeText: { fontSize: 11, color: "#FFFFFF", fontWeight: "800" },
  cardBody: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingVertical: 12 },
  cardName: { flex: 1, fontSize: 14, fontWeight: "700", lineHeight: 18, marginRight: 4 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 },
  emptyIconBg: { width: 100, height: 100, borderRadius: 50, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  emptyText: { fontSize: 15, fontWeight: "600", textAlign: "center", lineHeight: 22 },
});

