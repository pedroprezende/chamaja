import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Image,
  Switch,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "expo-router";
import { AdminTabBar } from "@/components/admin/AdminTabBar";
import { featuredAdsDB, type DbFeaturedAd } from "@/lib/db";

type TabType = "em-destaque" | "todos";

export default function DestaquesAdmin() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("em-destaque");
  const [ads, setAds] = useState<DbFeaturedAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const result = await featuredAdsDB.list();
    setAds(result.data);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleToggle = async (ad: DbFeaturedAd) => {
    setToggling(ad.id);
    const result = await featuredAdsDB.toggleFeatured(ad.id);
    if (result.data) {
      setAds((prev) => prev.map((a) => a.id === ad.id ? { ...a, is_featured: result.data!.is_featured } : a));
    }
    setToggling(null);
  };

  const displayAds = activeTab === "em-destaque"
    ? ads.filter((a) => a.is_featured)
    : ads;

  const featuredCount = ads.filter((a) => a.is_featured).length;

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.push("/admin/dashboard-admin" as any)}>
          <MaterialIcons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text style={styles.headerTitle}>Destaques</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{featuredCount}</Text>
        </View>
      </View>

      <View style={styles.tabs}>
        {([["em-destaque", "Em destaque"], ["todos", "Todos os anúncios"]] as [TabType, string][]).map(([key, label]) => (
          <Pressable
            key={key}
            style={[styles.tab, activeTab === key && styles.tabActive]}
            onPress={() => setActiveTab(key)}
          >
            <Text style={[styles.tabText, activeTab === key && styles.tabTextActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#25D366" size="large" />
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
          <Text style={styles.listHint}>
            {activeTab === "em-destaque"
              ? `${featuredCount} anúncio${featuredCount !== 1 ? "s" : ""} em destaque no topo do app.`
              : "Ative o destaque para exibir no topo do aplicativo."}
          </Text>

          <View style={styles.adList}>
            {displayAds.map((ad, idx) => (
              <View key={ad.id} style={[styles.adCard, idx < displayAds.length - 1 && styles.adBorder]}>
                {activeTab === "em-destaque" && (
                  <View style={styles.posNum}>
                    <Text style={styles.posNumText}>{idx + 1}</Text>
                  </View>
                )}
                {ad.provider_avatar ? (
                  <Image source={{ uri: ad.provider_avatar }} style={styles.adImage} />
                ) : (
                  <View style={[styles.adImage, styles.adImagePlaceholder]}>
                    <MaterialIcons name="person" size={22} color="#D1D5DB" />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.adName} numberOfLines={1}>{ad.provider_name}</Text>
                  <Text style={styles.adCategory}>{ad.category_name}</Text>
                  <View style={styles.viewsRow}>
                    <MaterialIcons name="visibility" size={12} color="#9CA3AF" />
                    <Text style={styles.viewsText}>{ad.views.toLocaleString("pt-BR")} visualizações</Text>
                  </View>
                </View>
                <View style={styles.adRight}>
                  {toggling === ad.id ? (
                    <ActivityIndicator size="small" color="#25D366" />
                  ) : (
                    <Switch
                      value={ad.is_featured}
                      onValueChange={() => handleToggle(ad)}
                      trackColor={{ false: "#E5E7EB", true: "#BBF7D0" }}
                      thumbColor={ad.is_featured ? "#25D366" : "#D1D5DB"}
                      style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
                    />
                  )}
                  <Pressable style={styles.dragHandle}>
                    <MaterialIcons name="drag-handle" size={20} color="#D1D5DB" />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>

          {displayAds.length === 0 && (
            <View style={styles.emptyState}>
              <MaterialIcons name="star-border" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>
                {activeTab === "em-destaque" ? "Nenhum destaque ativo" : "Nenhum anúncio"}
              </Text>
              {activeTab === "em-destaque" && (
                <Pressable onPress={() => setActiveTab("todos")}>
                  <Text style={styles.emptyAction}>Ver todos os anúncios →</Text>
                </Pressable>
              )}
            </View>
          )}
          <View style={{ height: 20 }} />
        </ScrollView>
      )}

      <AdminTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F5F5F5" },
  header: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF",
    paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#F3F4F6",
  },
  backBtn: { padding: 4, marginRight: 8 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "800", color: "#111827" },
  countBadge: { backgroundColor: "#DCFCE7", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  countBadgeText: { fontSize: 13, fontWeight: "800", color: "#15803D" },
  tabs: { flexDirection: "row", backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  tab: { flex: 1, paddingVertical: 12, alignItems: "center", borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabActive: { borderBottomColor: "#25D366" },
  tabText: { fontSize: 13, fontWeight: "600", color: "#9CA3AF" },
  tabTextActive: { color: "#25D366" },
  loadingBox: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { color: "#6B7280", fontSize: 14 },
  list: { padding: 16 },
  listHint: { fontSize: 13, color: "#6B7280", marginBottom: 12, lineHeight: 18 },
  adList: { backgroundColor: "#FFFFFF", borderRadius: 14, borderWidth: 1, borderColor: "#F3F4F6", overflow: "hidden" },
  adCard: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 13, gap: 10 },
  adBorder: { borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  posNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: "#25D366", alignItems: "center", justifyContent: "center" },
  posNumText: { fontSize: 12, fontWeight: "800", color: "#FFF" },
  adImage: { width: 46, height: 46, borderRadius: 10 },
  adImagePlaceholder: { backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" },
  adName: { fontSize: 14, fontWeight: "700", color: "#111827" },
  adCategory: { fontSize: 12, color: "#6B7280", marginTop: 1 },
  viewsRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 3 },
  viewsText: { fontSize: 11, color: "#9CA3AF" },
  adRight: { flexDirection: "row", alignItems: "center" },
  dragHandle: { padding: 4 },
  emptyState: { alignItems: "center", paddingVertical: 48, gap: 10 },
  emptyText: { fontSize: 16, fontWeight: "700", color: "#9CA3AF" },
  emptyAction: { fontSize: 14, fontWeight: "600", color: "#25D366" },
});
