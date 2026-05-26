import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useDebounce } from "@/hooks/use-debounce";

import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";
import { useLocation } from "@/lib/location-context";
import {
  calculateHaversineDistance,
  formatDistancePtBr,
  estimateDrivingTimeMinutes,
  formatDrivingTimePtBr,
} from "@/lib/location-utils";

const POPULAR = [
  { id: "eletricista",       name: "Eletricista",        icon: "bolt" },
  { id: "diarista",          name: "Diarista",            icon: "cleaning-services" },
  { id: "ar-condicionado",   name: "Ar-condicionado",     icon: "ac-unit" },
  { id: "marido-aluguel",    name: "Marido de aluguel",   icon: "build" },
  { id: "cozinheira",        name: "Cozinheira",          icon: "restaurant" },
  { id: "jardineiro",        name: "Jardineiro",          icon: "grass" },
  { id: "conserto-celular",  name: "Conserto de celular", icon: "phone-android" },
  { id: "baba",              name: "Babá",                icon: "child-care" },
  { id: "barbeiro",          name: "Barbeiro",            icon: "content-cut" },
  { id: "mecanico",          name: "Mecânico",            icon: "directions-car" },
  { id: "fotografo",         name: "Fotógrafo",           icon: "camera-alt" },
  { id: "personal-trainer",  name: "Personal trainer",    icon: "fitness-center" },
];

type SearchResult = {
  id: string;
  type: "service" | "admin-service" | "admin-provider" | "professional" | "category";
  name: string;
  subtitle?: string;
  avatar?: string;
  categoryId?: string;
  icon?: string;
};

export default function SearchScreen() {
  const colors = useColors();
  const [query, setQuery] = useState("");
  const router = useRouter();
  const { coords } = useLocation();
  
  // Queries via tRPC
  const { data: dbCategories = [] } = trpc.categories.list.useQuery();
  const { data: dbSubcategories = [] } = trpc.categories.subServices.listAll.useQuery();
  const { data: dbServices = [] } = trpc.services.list.useQuery({ homeOnly: false });
  
  const debouncedQuery = useDebounce(query, 500);

  const { data: dbSearchResults = [], isLoading: searching } = trpc.providers.search.useQuery(
    debouncedQuery, 
    { enabled: debouncedQuery.length > 1 }
  );

  // Resultados filtrados
  const filtered = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();

    // 1. Mapear Serviços Administrativos do Banco
    const svcs: SearchResult[] = dbServices
      .filter(s => s.isActive && (s.name.toLowerCase().includes(q) || (s.category?.toLowerCase() || "").includes(q)))
      .map(s => ({
        id: s.id,
        type: "admin-service",
        name: s.name,
        subtitle: s.category ?? undefined,
        avatar: s.avatarUri || undefined,
        categoryId: s.categoryId || undefined,
      }));

    // 2. Mapear Prestadores da Busca
    const providers: SearchResult[] = dbSearchResults.map(p => {
      let distanceStr = "";
      if (coords && p.latitude !== null && p.latitude !== undefined && p.longitude !== null && p.longitude !== undefined) {
        const lat = Number(p.latitude);
        const lon = Number(p.longitude);
        if (!isNaN(lat) && !isNaN(lon)) {
          const distKm = calculateHaversineDistance(coords.latitude, coords.longitude, lat, lon);
          const distText = formatDistancePtBr(distKm);
          const timeMin = estimateDrivingTimeMinutes(distKm);
          const drivingTime = formatDrivingTimePtBr(timeMin).replace("aproximadamente ", "");
          distanceStr = `${distText} (${drivingTime})`;
        }
      }

      return {
        id: p.id,
        type: "professional",
        name: p.name,
        subtitle: `${p.category || "Profissional"}${distanceStr ? ` • ${distanceStr}` : p.city ? ` • ${p.city}` : ""}`,
        avatar: p.avatarUri || undefined,
      };
    });

    // 3. Mapear Categorias que coincidem
    const cats: SearchResult[] = dbCategories
      .filter(c => c.name.toLowerCase().includes(q))
      .map(c => ({
        id: c.id,
        type: "category",
        name: c.name,
        icon: c.icon,
      }));

    // 4. Mapear Subcategorias que coincidem
    const subs: SearchResult[] = dbSubcategories
      .filter(s => s.name.toLowerCase().includes(q))
      .map(s => ({
        id: s.id,
        type: "category",
        name: s.name,
        categoryId: s.categoryId,
        icon: "label",
      }));

    const allResults = [...svcs, ...providers, ...cats, ...subs];

    // Deduplicar
    const seen = new Set<string>();
    return allResults.filter((r) => {
      const key = `${r.type}-${r.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [query, dbServices, dbSearchResults, dbCategories]);

  const handleResultPress = (item: SearchResult) => {
    if (item.type === "professional" || item.type === "admin-service") {
      router.push(`/professional/${item.id}` as any);
    } else if (item.type === "admin-provider") {
      router.push({
        pathname: "/admin-provider/[providerId]",
        params: { providerId: item.id, title: item.name },
      } as any);
    } else if (item.type === "category") {
      // Se for uma subcategoria (tem categoryId preenchido no nosso mapeamento)
      if (item.categoryId && item.categoryId !== item.id) {
        router.push({
          pathname: "/subcategory/[subcategoryId]",
          params: { subcategoryId: item.id, title: item.name, categoryId: item.categoryId },
        } as any);
      } else {
        // Categoria principal
        router.push({
          pathname: "/professionals/[category]",
          params: { category: item.id, title: item.name },
        } as any);
      }
    }
  };

  return (
    <ScreenContainer edges={["left", "right"]} className="">
      {/* Header */}
      <LinearGradient
        colors={colors.background === "#F8F9FA" ? ["#FFFFFF", "#F8F9FA"] : ["#1E293B", "#0F172A"]}
        style={[styles.header, { borderBottomColor: colors.border }]}
      >
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Buscar</Text>
      </LinearGradient>

      {/* Search Input */}
      <View style={[styles.searchWrapper, { backgroundColor: colors.background }]}>
        <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
          <MaterialIcons name="search" size={20} color={colors.muted} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="O que você precisa?"
            placeholderTextColor={colors.muted}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery("")}>
              <MaterialIcons name="close" size={18} color={colors.muted} />
            </Pressable>
          )}
          {searching && <ActivityIndicator size="small" color={colors.primary} />}
        </View>
      </View>

      {query.trim() ? (
        /* Search Results */
        <FlatList
          data={filtered}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          contentContainerStyle={styles.resultsList}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          windowSize={10}
          initialNumToRender={8}
          maxToRenderPerBatch={4}
          removeClippedSubviews={true}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [
                styles.resultItem, 
                { backgroundColor: colors.surface, borderColor: colors.border },
                pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] }
              ]}
              onPress={() => handleResultPress(item)}
            >
              {item.avatar ? (
                <Image 
                  source={{ uri: item.avatar }} 
                  style={styles.resultAvatar} 
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                <View style={[styles.resultIcon, { backgroundColor: colors.background }]}>
                  <MaterialIcons
                    name={
                      item.type === "professional" || item.type === "admin-provider"
                        ? "person"
                        : "build"
                    }
                    size={20}
                    color={colors.muted}
                  />
                </View>
              )}
              <View style={styles.resultTextGroup}>
                <Text style={[styles.resultName, { color: colors.foreground }]}>{item.name}</Text>
                {item.subtitle ? (
                  <Text style={[styles.resultSubtitle, { color: colors.muted }]} numberOfLines={1}>
                    {item.subtitle}
                  </Text>
                ) : null}
              </View>
              <View style={[
                styles.resultTypeBadge,
                { backgroundColor: colors.background, borderColor: colors.border },
                (item.type === "admin-service" || item.type === "admin-provider") && { backgroundColor: colors.primary + "20", borderColor: colors.primary },
              ]}>
                <Text style={[
                  styles.resultTypeText,
                  { color: colors.muted },
                  (item.type === "admin-service" || item.type === "admin-provider") && { color: colors.primary },
                ]}>
                  {item.type === "professional" ? "Profissional" : item.type === "admin-provider" ? "Prestador" : "Serviço"}
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.muted} />
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialIcons name="search-off" size={64} color={colors.muted} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Nenhum resultado</Text>
              <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
                Tente buscar por outro serviço ou profissional
              </Text>
            </View>
          }
        />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Popular Services */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Serviços populares</Text>
            <View style={styles.popularGrid}>
              {POPULAR.map((item) => (
                <Pressable
                  key={item.id}
                  style={({ pressed }) => [
                    styles.popularItem,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    pressed && { opacity: 0.75, transform: [{ scale: 0.96 }] },
                  ]}
                  onPress={() =>
                    router.push({
                      pathname: "/professionals/[category]",
                      params: { category: item.id, title: item.name },
                    } as any)
                  }
                >
                  <View style={[styles.popularIcon, { backgroundColor: colors.background }]}>
                    <MaterialIcons
                      name={item.icon as any}
                      size={24}
                      color={colors.primary}
                    />
                  </View>
                  <Text style={[styles.popularName, { color: colors.foreground }]}>{item.name}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Todas as Categorias */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Todas as categorias</Text>
            {dbCategories.map((cat) => (
              <Pressable
                key={cat.id}
                style={({ pressed }) => [
                  styles.categoryRow,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] },
                ]}
                onPress={() =>
                  router.push(`/categories/${cat.id}` as any)
                }
              >
                <View style={[styles.categoryIcon, { backgroundColor: colors.background }]}>
                  <MaterialIcons name={cat.icon as any} size={20} color={colors.primary} />
                </View>
                <Text style={[styles.categoryRowName, { color: colors.foreground }]}>
                  {cat.name.replace("\n", " ")}
                </Text>
                <MaterialIcons name="chevron-right" size={20} color={colors.muted} />
              </Pressable>
            ))}
          </View>
        </ScrollView>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 24, fontWeight: "800", letterSpacing: -0.5 },
  searchWrapper: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  resultsList: {
    padding: 16,
    paddingBottom: 40,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    gap: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  resultAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F3F4F6",
  },
  resultIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  resultTextGroup: {
    flex: 1,
    gap: 2,
  },
  resultName: {
    fontSize: 16,
    fontWeight: "700",
  },
  resultSubtitle: {
    fontSize: 13,
  },
  resultTypeBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
  },
  resultTypeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  empty: {
    alignItems: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: "center",
    paddingHorizontal: 40,
    lineHeight: 22,
  },
  section: {
    padding: 20,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  popularGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  popularItem: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  popularIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  popularName: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 10,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  categoryRowName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
});
