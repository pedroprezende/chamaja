import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Image,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import { useRouter } from "expo-router";
import { AdminTabBar } from "@/components/admin/AdminTabBar";
import { trpc } from "@/lib/trpc";
import { ActivityIndicator } from "react-native";

type FilterTab = "todos" | "ativos" | "inativos";

export default function PrestadoresAdmin() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterTab>("todos");

  const { data: dbProviders = [], isLoading } = trpc.providers.all.useQuery();

  const filtered = dbProviders.filter((p) => {
    const matchSearch =
      (p.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.category || "").toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "todos" ||
      (filter === "ativos" && p.isActive) ||
      (filter === "inativos" && !p.isActive);
    return matchSearch && matchFilter;
  });

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable
          style={styles.backBtn}
          onPress={() => router.push("/admin/dashboard-admin" as any)}
        >
          <MaterialIcons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text style={styles.headerTitle}>Prestadores</Text>
        <Pressable
          style={styles.addBtn}
          onPress={() => router.push("/admin/editar-prestador" as any)}
        >
          <MaterialIcons name="add" size={22} color="#FFF" />
        </Pressable>
      </View>

      <View style={styles.searchBox}>
        <MaterialIcons name="search" size={18} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar prestador..."
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")}>
            <MaterialIcons name="close" size={18} color="#9CA3AF" />
          </Pressable>
        )}
      </View>

      <View style={styles.filterRow}>
        {(["todos", "ativos", "inativos"] as FilterTab[]).map((tab) => (
          <Pressable
            key={tab}
            style={[styles.filterBtn, filter === tab && styles.filterBtnActive]}
            onPress={() => setFilter(tab)}
          >
            <Text
              style={[
                styles.filterText,
                filter === tab && styles.filterTextActive,
              ]}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
      >
        {isLoading ? (
          <ActivityIndicator
            size="large"
            color="#25D366"
            style={{ marginVertical: 20 }}
          />
        ) : filtered.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 40 }}>
            <Text style={{ color: "#9CA3AF" }}>
              Nenhum prestador encontrado.
            </Text>
          </View>
        ) : (
          filtered.map((prov) => (
            <View key={prov.id} style={styles.provCard}>
              <Pressable
                style={styles.provMain}
                onPress={() =>
                  router.push({
                    pathname: "/admin/editar-prestador",
                    params: { id: prov.id },
                  } as any)
                }
              >
                <Image
                  source={{
                    uri:
                      prov.avatarUri ||
                      "https://ui-avatars.com/api/?name=" +
                        encodeURIComponent(prov.name),
                  }}
                  style={styles.avatar}
                />
                <View style={{ flex: 1 }}>
                  <View style={styles.provNameRow}>
                    <Text style={styles.provName} numberOfLines={1}>
                      {prov.name}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        !prov.isActive && styles.statusInactive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          !prov.isActive && styles.statusTextInactive,
                        ]}
                      >
                        {prov.isActive ? "Ativo" : "Inativo"}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.ratingRow}>
                    <MaterialIcons name="star" size={13} color="#FBBF24" />
                    <Text style={styles.rating}>
                      {(prov as any).rating || 5.0}
                    </Text>
                    <Text style={styles.reviews}>
                      ({(prov as any).ratingCount || 0})
                    </Text>
                    <Text style={styles.category}>
                      {prov.category || "Sem categoria"}
                    </Text>
                  </View>
                  <View style={styles.locationRow}>
                    <MaterialIcons
                      name="location-on"
                      size={12}
                      color="#9CA3AF"
                    />
                    <Text style={styles.locationText}>
                      {prov.address || "Endereço não informado"}
                    </Text>
                  </View>
                </View>
                <View style={styles.provActions}>
                  {!!prov.whatsapp && (
                    <Pressable
                      style={styles.waBtn}
                      onPress={(e) => {
                        e.stopPropagation?.();
                      }}
                    >
                      <MaterialIcons name="chat" size={18} color="#25D366" />
                    </Pressable>
                  )}
                  <Pressable
                    style={styles.menuBtn}
                    onPress={() =>
                      router.push({
                        pathname: "/admin/editar-prestador",
                        params: { id: prov.id },
                      } as any)
                    }
                  >
                    <MaterialIcons name="more-vert" size={20} color="#9CA3AF" />
                  </Pressable>
                </View>
              </Pressable>
            </View>
          ))
        )}
        <View style={{ height: 20 }} />
      </ScrollView>

      <AdminTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F5F5F5" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backBtn: { padding: 4, marginRight: 8 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "800", color: "#111827" },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#25D366",
    alignItems: "center",
    justifyContent: "center",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
    outlineStyle: "none",
  } as any,
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginTop: 10,
    marginBottom: 4,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
  },
  filterBtnActive: { backgroundColor: "#25D366" },
  filterText: { fontSize: 13, fontWeight: "600", color: "#6B7280" },
  filterTextActive: { color: "#FFF" },
  list: { padding: 16, gap: 8 },
  provCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    overflow: "hidden",
  },
  provMain: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F3F4F6",
  },
  provNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 3,
  },
  provName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    maxWidth: 130,
  },
  statusBadge: {
    backgroundColor: "#DCFCE7",
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  statusInactive: { backgroundColor: "#FEE2E2" },
  statusText: { fontSize: 10, fontWeight: "700", color: "#15803D" },
  statusTextInactive: { color: "#DC2626" },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginBottom: 2,
  },
  rating: { fontSize: 12, fontWeight: "700", color: "#111827" },
  reviews: { fontSize: 12, color: "#9CA3AF" },
  category: { fontSize: 12, color: "#6B7280", marginLeft: 4 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  locationText: { fontSize: 11, color: "#9CA3AF" },
  provActions: { flexDirection: "column", alignItems: "center", gap: 6 },
  waBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
  },
  menuBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
  },
});
