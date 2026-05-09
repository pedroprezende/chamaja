import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Platform,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import { AdminTabBar } from "@/components/admin/AdminTabBar";

const REGIONS = ["Bragança Paulista", "Atibaia", "Extrema", "Itatiba", "Camanducaia"];

const STATS = [
  { label: "Prestadores\nativos", value: "128", sub: "+5 hoje", icon: "people", color: "#EFF6FF", iconColor: "#2563EB" },
  { label: "Cliques no\nWhatsApp", value: "47", sub: "Hoje", icon: "chat", color: "#F0FDF4", iconColor: "#16A34A" },
  { label: "Visualizações\nde serviços", value: "1.320", sub: "Hoje", icon: "bar-chart", color: "#FFF7ED", iconColor: "#EA580C" },
  { label: "Anúncios\nativos", value: "12", sub: "Em destaque", icon: "star", color: "#FEFCE8", iconColor: "#CA8A04" },
];

const RECENT_ACTIVITY = [
  { id: "1", title: "Novo prestador cadastrado", name: "Elétrica Forte Serviços", time: "há 25 min", icon: "person-add" },
  { id: "2", title: "Novo clique no WhatsApp", name: "Eletricista do Zé", time: "há 40 min", icon: "chat" },
  { id: "3", title: "Nova avaliação recebida", name: "Encanador Rápido", time: "há 1h", icon: "star" },
  { id: "4", title: "Prestador ativou plano", name: "Top Barber", time: "há 2h", icon: "workspace-premium" },
];

export default function DashboardAdmin() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedRegion, setSelectedRegion] = useState("Bragança Paulista");
  const [showRegionPicker, setShowRegionPicker] = useState(false);

  const firstName = (user?.name || "Admin").split(" ")[0];

  const handleSignOut = async () => {
    const confirmed =
      Platform.OS === "web"
        ? window.confirm("Sair do painel administrativo?")
        : true;
    if (!confirmed) return;
    try { await signOut(); } catch {}
    router.replace("/auth/login" as any);
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerLeft}>
          <MaterialIcons name="local-fire-department" size={22} color="#25D366" />
          <Text style={styles.headerTitle}>ChamaJá</Text>
          <View style={styles.adminBadge}>
            <Text style={styles.adminBadgeText}>Admin</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Pressable
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
            onPress={() => router.replace("/" as any)}
          >
            <MaterialIcons name="arrow-back" size={16} color="#25D366" />
            <Text style={styles.backBtnText}>Voltar ao App</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.greetingRow}>
          <Text style={styles.greeting}>Olá, {firstName}! 👋</Text>
          <Text style={styles.greetingSub}>Painel Administrativo</Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.regionSelector, pressed && { opacity: 0.8 }]}
          onPress={() => setShowRegionPicker(!showRegionPicker)}
        >
          <MaterialIcons name="location-on" size={16} color="#25D366" />
          <Text style={styles.regionText}>{selectedRegion}</Text>
          <MaterialIcons
            name={showRegionPicker ? "keyboard-arrow-up" : "keyboard-arrow-down"}
            size={18}
            color="#6B7280"
          />
        </Pressable>

        {showRegionPicker && (
          <View style={styles.regionDropdown}>
            {REGIONS.map((r) => (
              <Pressable
                key={r}
                style={({ pressed }) => [
                  styles.regionOption,
                  pressed && { backgroundColor: "#F0FDF4" },
                  r === selectedRegion && styles.regionOptionActive,
                ]}
                onPress={() => { setSelectedRegion(r); setShowRegionPicker(false); }}
              >
                <Text style={[styles.regionOptionText, r === selectedRegion && { color: "#25D366", fontWeight: "700" }]}>
                  {r}
                </Text>
                {r === selectedRegion && <MaterialIcons name="check" size={16} color="#25D366" />}
              </Pressable>
            ))}
          </View>
        )}

        <Text style={styles.sectionTitle}>Visão geral de hoje</Text>

        <View style={styles.statsGrid}>
          {STATS.map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <View style={[styles.statIconBox, { backgroundColor: stat.color }]}>
                <MaterialIcons name={stat.icon as any} size={22} color={stat.iconColor} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
              <Text style={styles.statSub}>{stat.sub}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Serviço mais buscado</Text>
        <View style={styles.topServiceCard}>
          <View style={styles.topServiceIcon}>
            <MaterialIcons name="electrical-services" size={26} color="#25D366" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.topServiceName}>Eletricista</Text>
            <Text style={styles.topServicePct}>23% das buscas de hoje</Text>
          </View>
          <View style={styles.topServiceBadge}>
            <Text style={styles.topServiceBadgeText}>#1</Text>
          </View>
        </View>

        <View style={styles.activityHeader}>
          <Text style={styles.sectionTitle}>Atividade recente</Text>
          <Pressable><Text style={styles.verTudo}>Ver tudo</Text></Pressable>
        </View>

        <View style={styles.activityList}>
          {RECENT_ACTIVITY.map((item, i) => (
            <View
              key={item.id}
              style={[styles.activityItem, i < RECENT_ACTIVITY.length - 1 && styles.activityBorder]}
            >
              <View style={styles.activityIconBox}>
                <MaterialIcons name={item.icon as any} size={18} color="#25D366" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.activityTitle}>{item.title}</Text>
                <Text style={styles.activityName}>{item.name}</Text>
              </View>
              <Text style={styles.activityTime}>{item.time}</Text>
            </View>
          ))}
        </View>

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
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#111827" },
  adminBadge: { backgroundColor: "#DCFCE7", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  adminBadgeText: { fontSize: 11, fontWeight: "700", color: "#15803D" },
  headerRight: { flexDirection: "row", gap: 8, alignItems: "center" },
  backBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#F0FDF4", borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: "#BBF7D0",
  },
  backBtnText: { fontSize: 13, fontWeight: "600", color: "#25D366" },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: "#F9FAFB",
    alignItems: "center", justifyContent: "center",
  },
  notifDot: {
    position: "absolute", top: 6, right: 6,
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: "#EF4444", borderWidth: 1.5, borderColor: "#FFF",
  },
  content: { padding: 16 },
  greetingRow: { marginBottom: 16 },
  greeting: { fontSize: 22, fontWeight: "800", color: "#111827" },
  greetingSub: { fontSize: 13, color: "#6B7280", marginTop: 2 },
  regionSelector: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF",
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, gap: 8,
    borderWidth: 1, borderColor: "#E5E7EB", marginBottom: 4,
  },
  regionText: { flex: 1, fontSize: 14, fontWeight: "600", color: "#111827" },
  regionDropdown: {
    backgroundColor: "#FFFFFF", borderRadius: 12, borderWidth: 1,
    borderColor: "#E5E7EB", marginBottom: 4, overflow: "hidden",
  },
  regionOption: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: "#F3F4F6",
  },
  regionOptionActive: { backgroundColor: "#F0FDF4" },
  regionOptionText: { fontSize: 14, color: "#374151" },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#111827", marginTop: 16, marginBottom: 10 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: {
    width: "47.5%", backgroundColor: "#FFFFFF", borderRadius: 14,
    padding: 14, borderWidth: 1, borderColor: "#F3F4F6",
  },
  statIconBox: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  statValue: { fontSize: 26, fontWeight: "800", color: "#111827" },
  statLabel: { fontSize: 12, color: "#6B7280", marginTop: 2, lineHeight: 16 },
  statSub: { fontSize: 11, color: "#9CA3AF", marginTop: 4, fontWeight: "500" },
  topServiceCard: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF",
    borderRadius: 14, padding: 14, gap: 12, borderWidth: 1, borderColor: "#F3F4F6",
  },
  topServiceIcon: {
    width: 50, height: 50, borderRadius: 12, backgroundColor: "#F0FDF4",
    alignItems: "center", justifyContent: "center",
  },
  topServiceName: { fontSize: 15, fontWeight: "700", color: "#111827" },
  topServicePct: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  topServiceBadge: { backgroundColor: "#DCFCE7", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  topServiceBadgeText: { fontSize: 13, fontWeight: "800", color: "#15803D" },
  activityHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginTop: 16, marginBottom: 10,
  },
  verTudo: { fontSize: 13, fontWeight: "600", color: "#25D366" },
  activityList: { backgroundColor: "#FFFFFF", borderRadius: 14, borderWidth: 1, borderColor: "#F3F4F6", overflow: "hidden" },
  activityItem: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 13, gap: 12 },
  activityBorder: { borderBottomWidth: 1, borderBottomColor: "#F9FAFB" },
  activityIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#F0FDF4", alignItems: "center", justifyContent: "center" },
  activityTitle: { fontSize: 13, color: "#374151", fontWeight: "600" },
  activityName: { fontSize: 12, color: "#6B7280", marginTop: 1 },
  activityTime: { fontSize: 11, color: "#9CA3AF" },
});
