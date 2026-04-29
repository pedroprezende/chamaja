import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
} from "react-native";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

import { ScreenContainer } from "@/components/screen-container";
import { services, categories, professionals, getProfessionalsByRanking } from "@/data/mock";
import { adminDB } from "@/lib/admin-database";
import { providersDB } from "@/lib/providers-database";

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
  type: "service" | "admin-service" | "professional" | "category";
  name: string;
  subtitle?: string;
  avatar?: string;
  categoryId?: string;
  icon?: string;
};

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const [adminServices, setAdminServices] = useState<SearchResult[]>([]);
  const [realProviders, setRealProviders] = useState<SearchResult[]>([]);
  const router = useRouter();

  // Carregar serviços admin e prestadores reais
  useEffect(() => {
    const load = async () => {
      try {
        const aServices = await adminDB.getAllServices();
        setAdminServices(
          aServices
            .filter((s) => s.isActive)
            .map((s) => ({
              id: s.id,
              type: "admin-service" as const,
              name: s.name,
              subtitle: s.category,
              categoryId: s.categoryId || s.category.toLowerCase().replace(/\s+/g, "-"),
            }))
        );
      } catch {}

      try {
        const providers = await providersDB.getAllActive();
        setRealProviders(
          providers.map((p) => ({
            id: p.userId,
            type: "professional" as const,
            name: p.name,
            subtitle: `${p.category} • ${p.city}`,
            avatar: p.avatar,
          }))
        );
      } catch {}
    };
    load();
  }, []);

  // Todos os serviços mock
  const mockServiceResults: SearchResult[] = useMemo(
    () =>
      services.map((s) => ({
        id: s.id,
        type: "service" as const,
        name: s.name,
        subtitle: s.categoryId,
        categoryId: s.id,
      })),
    []
  );

  // Todos os profissionais mock
  const mockProfessionalResults: SearchResult[] = useMemo(
    () =>
      professionals.map((p) => ({
        id: p.id,
        type: "professional" as const,
        name: p.name,
        subtitle: `${p.category} • ${p.neighborhood}`,
        avatar: p.avatar,
      })),
    []
  );

  // Resultados filtrados
  const filtered = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();

    const allResults: SearchResult[] = [
      ...mockServiceResults,
      ...adminServices,
      ...mockProfessionalResults,
      ...realProviders,
    ];

    // Deduplicar por ID
    const seen = new Set<string>();
    const unique = allResults.filter((r) => {
      const key = `${r.type}-${r.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return unique.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.subtitle?.toLowerCase().includes(q)
    );
  }, [query, mockServiceResults, adminServices, mockProfessionalResults, realProviders]);

  const handleResultPress = (item: SearchResult) => {
    if (item.type === "professional") {
      router.push(`/professional/${item.id}` as any);
    } else if (item.type === "admin-service") {
      // Serviço criado no painel admin → vai para a tela de detalhe do serviço
      router.push({
        pathname: "/admin-services/[serviceId]",
        params: { serviceId: item.id, title: item.name },
      } as any);
    } else {
      // service mock ou category → vai para a listagem de profissionais
      const catId = item.categoryId || item.id;
      router.push({
        pathname: "/professionals/[category]",
        params: { category: catId, title: item.name },
      } as any);
    }
  };

  return (
    <ScreenContainer containerClassName="bg-[#F5F5F5]" className="">
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Buscar</Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchBox}>
          <MaterialIcons name="search" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="O que você precisa?"
            placeholderTextColor="#9CA3AF"
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery("")}>
              <MaterialIcons name="close" size={18} color="#9CA3AF" />
            </Pressable>
          )}
        </View>
      </View>

      {query.trim() ? (
        /* Search Results */
        <FlatList
          data={filtered}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          contentContainerStyle={styles.resultsList}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [styles.resultItem, pressed && { opacity: 0.7 }]}
              onPress={() => handleResultPress(item)}
            >
              {item.type === "professional" && item.avatar ? (
                <Image source={{ uri: item.avatar }} style={styles.resultAvatar} />
              ) : (
                <View style={styles.resultIcon}>
                  <MaterialIcons
                    name={item.type === "professional" ? "person" : "build"}
                    size={20}
                    color="#6B7280"
                  />
                </View>
              )}
              <View style={styles.resultTextGroup}>
                <Text style={styles.resultName}>{item.name}</Text>
                {item.subtitle ? (
                  <Text style={styles.resultSubtitle} numberOfLines={1}>
                    {item.subtitle}
                  </Text>
                ) : null}
              </View>
              <View style={[
                styles.resultTypeBadge,
                item.type === "admin-service" && styles.resultTypeBadgeAdmin,
              ]}>
                <Text style={[
                  styles.resultTypeText,
                  item.type === "admin-service" && styles.resultTypeTextAdmin,
                ]}>
                  {item.type === "professional" ? "Profissional" : item.type === "admin-service" ? "Serviço" : "Serviço"}
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#D1D5DB" />
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialIcons name="search-off" size={56} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>Nenhum resultado</Text>
              <Text style={styles.emptySubtitle}>
                Tente buscar por outro serviço ou profissional
              </Text>
            </View>
          }
        />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Popular Services */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Serviços populares</Text>
            <View style={styles.popularGrid}>
              {POPULAR.map((item) => (
                <Pressable
                  key={item.id}
                  style={({ pressed }) => [
                    styles.popularItem,
                    pressed && { opacity: 0.75 },
                  ]}
                  onPress={() =>
                    router.push({
                      pathname: "/professionals/[category]",
                      params: { category: item.id, title: item.name },
                    } as any)
                  }
                >
                  <View style={styles.popularIcon}>
                    <MaterialIcons
                      name={item.icon as any}
                      size={24}
                      color="#374151"
                    />
                  </View>
                  <Text style={styles.popularName}>{item.name}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* All Categories */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Todas as categorias</Text>
            {categories.map((cat) => (
              <Pressable
                key={cat.id}
                style={({ pressed }) => [
                  styles.categoryRow,
                  pressed && { opacity: 0.7 },
                ]}
                onPress={() =>
                  router.push(`/categories/${cat.id}` as any)
                }
              >
                <Text style={styles.categoryRowName}>
                  {cat.name.replace("\n", " ")}
                </Text>
                <MaterialIcons name="chevron-right" size={20} color="#D1D5DB" />
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
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },
  searchWrapper: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 8,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
    padding: 0,
  },
  resultsList: {
    padding: 16,
    paddingBottom: 24,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  resultAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E5E7EB",
  },
  resultIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  resultTextGroup: {
    flex: 1,
    gap: 2,
  },
  resultName: {
    fontSize: 15,
    color: "#111827",
    fontWeight: "600",
  },
  resultSubtitle: {
    fontSize: 12,
    color: "#6B7280",
  },
  resultTypeBadge: {
    backgroundColor: "#F0FDF4",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  resultTypeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#25D366",
  },
  resultTypeBadgeAdmin: {
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
  },
  resultTypeTextAdmin: {
    color: "#2563EB",
  },
  empty: {
    alignItems: "center",
    paddingTop: 60,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#374151",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
  },
  section: {
    padding: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 14,
  },
  popularGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  popularItem: {
    width: "47%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  popularIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  popularName: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
    color: "#374151",
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  categoryRowName: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
    fontWeight: "500",
  },
});
