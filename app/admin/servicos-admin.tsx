import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import { useRouter } from "expo-router";
import { AdminTabBar } from "@/components/admin/AdminTabBar";

interface ServiceCategory {
  id: string;
  name: string;
  icon: string;
  count: number;
}

const CATEGORIES: ServiceCategory[] = [
  { id: "reformas-reparos", name: "Reformas e Reparos", icon: "build", count: 8 },
  { id: "assistencia-tecnica", name: "Assistência Técnica", icon: "settings", count: 6 },
  { id: "servicos-domesticos", name: "Serviços Domésticos", icon: "home", count: 7 },
  { id: "beleza-estetica", name: "Beleza e Estética", icon: "content-cut", count: 6 },
  { id: "automotivo", name: "Automotivo", icon: "directions-car", count: 5 },
  { id: "educacao", name: "Aulas e Cursos", icon: "school", count: 4 },
  { id: "eventos", name: "Eventos", icon: "celebration", count: 4 },
  { id: "servicos-profissionais", name: "Serviços Profissionais", icon: "business-center", count: 5 },
  { id: "saude", name: "Saúde", icon: "local-hospital", count: 4 },
  { id: "logistica", name: "Logística", icon: "local-shipping", count: 3 },
  { id: "comercios", name: "Comércios", icon: "storefront", count: 3 },
  { id: "mobilidade", name: "Mobilidade", icon: "commute", count: 2 },
];

type Tab = "categorias" | "ordem";

export default function ServicosAdmin() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("categorias");
  const [homeOrder, setHomeOrder] = useState<string[]>([
    "reformas-reparos",
    "assistencia-tecnica",
    "servicos-domesticos",
    "automotivo",
    "beleza-estetica",
  ]);

  const moveUp = (id: string) => {
    setHomeOrder((prev) => {
      const idx = prev.indexOf(id);
      if (idx <= 0) return prev;
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  };

  const moveDown = (id: string) => {
    setHomeOrder((prev) => {
      const idx = prev.indexOf(id);
      if (idx < 0 || idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.push("/admin/dashboard-admin" as any)}>
          <MaterialIcons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text style={styles.headerTitle}>Serviços</Text>
        <Pressable style={styles.addBtn}>
          <MaterialIcons name="add" size={22} color="#FFF" />
        </Pressable>
      </View>

      <View style={styles.tabs}>
        {(["categorias", "ordem"] as Tab[]).map((tab) => (
          <Pressable
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === "categorias" ? "Categorias" : "Ordem da Home"}
            </Text>
          </Pressable>
        ))}
      </View>

      {activeTab === "categorias" ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
          <Text style={styles.listHint}>
            Gerencie as categorias e os serviços exibidos no aplicativo desta região.
          </Text>
          {CATEGORIES.map((cat, i) => (
            <View key={cat.id} style={[styles.catCard, i < CATEGORIES.length - 1 && styles.catBorder]}>
              <View style={styles.catIconBox}>
                <MaterialIcons name={cat.icon as any} size={22} color="#25D366" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.catName}>{cat.name}</Text>
                <Text style={styles.catCount}>{cat.count} serviços cadastrados</Text>
              </View>
              <Pressable
                style={({ pressed }) => [styles.editBtn, pressed && { opacity: 0.7 }]}
                onPress={() => router.push(`/admin/services` as any)}
              >
                <Text style={styles.editBtnText}>Editar</Text>
              </Pressable>
              <Pressable style={styles.dragHandle}>
                <MaterialIcons name="drag-handle" size={20} color="#D1D5DB" />
              </Pressable>
            </View>
          ))}
          <View style={{ height: 20 }} />
        </ScrollView>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
          <Text style={styles.listHint}>
            Defina a ordem em que as categorias aparecem na tela inicial do app.
          </Text>
          {homeOrder.map((id, idx) => {
            const cat = CATEGORIES.find((c) => c.id === id);
            if (!cat) return null;
            return (
              <View key={id} style={[styles.catCard, idx < homeOrder.length - 1 && styles.catBorder]}>
                <Text style={styles.orderNum}>{idx + 1}</Text>
                <View style={styles.catIconBox}>
                  <MaterialIcons name={cat.icon as any} size={22} color="#25D366" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.catName}>{cat.name}</Text>
                </View>
                <View style={styles.orderBtns}>
                  <Pressable onPress={() => moveUp(id)} style={({ pressed }) => [styles.orderBtn, pressed && { opacity: 0.6 }]}>
                    <MaterialIcons name="keyboard-arrow-up" size={20} color={idx === 0 ? "#D1D5DB" : "#374151"} />
                  </Pressable>
                  <Pressable onPress={() => moveDown(id)} style={({ pressed }) => [styles.orderBtn, pressed && { opacity: 0.6 }]}>
                    <MaterialIcons name="keyboard-arrow-down" size={20} color={idx === homeOrder.length - 1 ? "#D1D5DB" : "#374151"} />
                  </Pressable>
                </View>
              </View>
            );
          })}
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
  tabText: { fontSize: 14, fontWeight: "600", color: "#9CA3AF" },
  tabTextActive: { color: "#25D366" },
  list: { padding: 16 },
  listHint: { fontSize: 13, color: "#6B7280", marginBottom: 12, lineHeight: 18 },
  catCard: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF",
    paddingHorizontal: 14, paddingVertical: 14, gap: 12,
  },
  catBorder: { borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  catIconBox: {
    width: 42, height: 42, borderRadius: 10, backgroundColor: "#F0FDF4",
    alignItems: "center", justifyContent: "center",
  },
  catName: { fontSize: 14, fontWeight: "700", color: "#111827" },
  catCount: { fontSize: 12, color: "#6B7280", marginTop: 1 },
  editBtn: {
    backgroundColor: "#F0FDF4", borderRadius: 8, paddingHorizontal: 12,
    paddingVertical: 6, borderWidth: 1, borderColor: "#BBF7D0",
  },
  editBtnText: { fontSize: 13, fontWeight: "700", color: "#15803D" },
  dragHandle: { padding: 4 },
  orderNum: { fontSize: 16, fontWeight: "800", color: "#25D366", width: 24, textAlign: "center" },
  orderBtns: { flexDirection: "row" },
  orderBtn: { padding: 4 },
});
