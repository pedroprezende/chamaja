import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Image,
  Switch,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import { useRouter } from "expo-router";
import { AdminTabBar } from "@/components/admin/AdminTabBar";

interface FeaturedAd {
  id: string;
  name: string;
  category: string;
  views: number;
  image: string;
  isFeatured: boolean;
}

const ALL_ADS: FeaturedAd[] = [
  { id: "1", name: "Elétrica do Zé", category: "Eletricista", views: 1256, image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=80&q=70", isFeatured: true },
  { id: "2", name: "Marmitaria Fit", category: "Alimentação", views: 965, image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=80&q=70", isFeatured: true },
  { id: "3", name: "Top Barber", category: "Barbearia", views: 789, image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=80&q=70", isFeatured: true },
  { id: "4", name: "Bragança Limpeza", category: "Limpeza", views: 650, image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=80&q=70", isFeatured: true },
  { id: "5", name: "Studio Ink Tattoo", category: "Tatuador", views: 542, image: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=80&q=70", isFeatured: true },
  { id: "6", name: "Encanador Rápido", category: "Encanador", views: 430, image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=80&q=70", isFeatured: false },
  { id: "7", name: "Mestre da Elétrica", category: "Eletricista", views: 380, image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=80&q=70", isFeatured: false },
  { id: "8", name: "Vila Pinturas", category: "Pintor", views: 290, image: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=80&q=70", isFeatured: false },
];

type TabType = "em-destaque" | "todos";

export default function DestaquesAdmin() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("em-destaque");
  const [ads, setAds] = useState<FeaturedAd[]>(ALL_ADS);

  const toggleFeatured = (id: string) => {
    setAds((prev) => prev.map((a) => (a.id === id ? { ...a, isFeatured: !a.isFeatured } : a)));
  };

  const displayAds = activeTab === "em-destaque" ? ads.filter((a) => a.isFeatured) : ads;

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.push("/admin/dashboard-admin" as any)}>
          <MaterialIcons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text style={styles.headerTitle}>Destaques</Text>
        <Pressable style={styles.addBtn}>
          <MaterialIcons name="add" size={22} color="#FFF" />
        </Pressable>
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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        <Text style={styles.listHint}>
          {activeTab === "em-destaque"
            ? "Gerencie os anúncios que aparecem em destaque no topo do aplicativo."
            : "Todos os anúncios cadastrados. Ative o destaque para exibir no topo."}
        </Text>

        {displayAds.map((ad, idx) => (
          <View key={ad.id} style={[styles.adCard, idx < displayAds.length - 1 && styles.adBorder]}>
            {activeTab === "em-destaque" && (
              <View style={styles.posNum}>
                <Text style={styles.posNumText}>{idx + 1}</Text>
              </View>
            )}
            <Image source={{ uri: ad.image }} style={styles.adImage} />
            <View style={{ flex: 1 }}>
              <Text style={styles.adName} numberOfLines={1}>{ad.name}</Text>
              <Text style={styles.adCategory}>{ad.category}</Text>
              <View style={styles.viewsRow}>
                <MaterialIcons name="visibility" size={13} color="#9CA3AF" />
                <Text style={styles.viewsText}>{ad.views.toLocaleString("pt-BR")} visualizações</Text>
              </View>
            </View>
            <View style={styles.adRight}>
              <Switch
                value={ad.isFeatured}
                onValueChange={() => toggleFeatured(ad.id)}
                trackColor={{ false: "#E5E7EB", true: "#BBF7D0" }}
                thumbColor={ad.isFeatured ? "#25D366" : "#D1D5DB"}
                style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
              />
              <Pressable style={styles.dragHandle}>
                <MaterialIcons name="drag-handle" size={20} color="#D1D5DB" />
              </Pressable>
            </View>
          </View>
        ))}

        {displayAds.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialIcons name="star-border" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>Nenhum destaque ativo</Text>
            <Text style={styles.emptyHint}>Vá para "Todos os anúncios" e ative o destaque</Text>
          </View>
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
    flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF",
    paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#F3F4F6",
  },
  backBtn: { padding: 4, marginRight: 8 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "800", color: "#111827" },
  addBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: "#25D366",
    alignItems: "center", justifyContent: "center",
  },
  tabs: {
    flexDirection: "row", backgroundColor: "#FFFFFF",
    borderBottomWidth: 1, borderBottomColor: "#F3F4F6",
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: "center", borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabActive: { borderBottomColor: "#25D366" },
  tabText: { fontSize: 13, fontWeight: "600", color: "#9CA3AF" },
  tabTextActive: { color: "#25D366" },
  list: { padding: 16 },
  listHint: { fontSize: 13, color: "#6B7280", marginBottom: 12, lineHeight: 18 },
  adCard: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF",
    paddingHorizontal: 14, paddingVertical: 13, gap: 10,
  },
  adBorder: { borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  posNum: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: "#25D366",
    alignItems: "center", justifyContent: "center",
  },
  posNumText: { fontSize: 12, fontWeight: "800", color: "#FFF" },
  adImage: { width: 46, height: 46, borderRadius: 10, backgroundColor: "#F3F4F6" },
  adName: { fontSize: 14, fontWeight: "700", color: "#111827" },
  adCategory: { fontSize: 12, color: "#6B7280", marginTop: 1 },
  viewsRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 3 },
  viewsText: { fontSize: 11, color: "#9CA3AF" },
  adRight: { flexDirection: "row", alignItems: "center" },
  dragHandle: { padding: 4 },
  emptyState: { alignItems: "center", paddingVertical: 48, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: "700", color: "#9CA3AF" },
  emptyHint: { fontSize: 13, color: "#D1D5DB", textAlign: "center" },
});
