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
import { useState, useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { ActivityIndicator } from "react-native";
import { AdminTabBar } from "@/components/admin/AdminTabBar";
import Svg, {
  Path,
  Circle,
  Text as SvgText,
  Defs,
  LinearGradient,
  Stop,
  Line,
  G,
} from "react-native-svg";

const REGIONS = ["Bragança Paulista", "Atibaia", "Extrema", "Itatiba", "Camanducaia"];

export default function DashboardAdmin() {
  const { user, isAdmin, signOut, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedRegion, setSelectedRegion] = useState("Bragança Paulista");
  const [showRegionPicker, setShowRegionPicker] = useState(false);

  // Dynamic width state for custom SVG chart
  const [chartWidth, setChartWidth] = useState(300);

  // Route protection
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.replace("/" as any);
    }
  }, [isAdmin, authLoading]);

  const { data: dashboardData, isLoading } = trpc.dashboard.getAdminStats.useQuery(undefined, {
    enabled: isAdmin,
  });

  // Memoized SVG path math for line chart
  const chartData = dashboardData?.stats.monthlyRevenueEvolution || [];
  const chartHeight = 180;
  const chartPadding = 30;

  const { chartPoints, chartLinePath, chartFillPath, chartGridPoints } = useMemo(() => {
    if (chartData.length === 0) {
      return { chartPoints: [], chartLinePath: "", chartFillPath: "", chartGridPoints: [] };
    }

    const maxVal = Math.max(...chartData.map((d) => d.revenue), 100);

    const points = chartData.map((d, index) => {
      // Scale X evenly across the width minus padding
      const x = chartPadding + (index * (chartWidth - 2 * chartPadding - 10)) / 5;
      // Scale Y inversely (higher value = lower Y coordinate in SVG space)
      const y = chartHeight - chartPadding - (d.revenue / maxVal) * (chartHeight - 2 * chartPadding);
      return { x, y, label: d.month, value: d.revenue };
    });

    const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
    const fillPath = points.length > 0
      ? `${linePath} L ${points[points.length - 1].x} ${chartHeight - chartPadding} L ${points[0].x} ${chartHeight - chartPadding} Z`
      : "";

    // Dotted grid lines at 0%, 50%, and 100% of height scale
    const gridY = [
      chartHeight - chartPadding,
      chartHeight - chartPadding - (chartHeight - 2 * chartPadding) / 2,
      chartPadding
    ];
    const gridPoints = gridY.map((yVal) => ({ y: yVal }));

    return { chartPoints: points, chartLinePath: linePath, chartFillPath: fillPath, chartGridPoints: gridPoints };
  }, [chartData, chartWidth]);

  if (authLoading || !isAdmin) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F5F5F5" }}>
        <ActivityIndicator size="large" color="#25D366" />
        <Text style={{ marginTop: 12, color: "#6B7280" }}>Carregando painel...</Text>
      </View>
    );
  }

  const firstName = (user?.name || "Admin").split(" ")[0];

  const handleSignOut = async () => {
    try { await signOut(); } catch (e) { console.error(e); }
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
            style={({ pressed }) => [styles.backBtn, { marginRight: 8 }, pressed && { opacity: 0.7 }]}
            onPress={() => router.push("/admin/logs" as any)}
          >
            <MaterialIcons name="bug-report" size={16} color="#25D366" />
            <Text style={styles.backBtnText}>Logs</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
            onPress={() => router.replace("/" as any)}
          >
            <MaterialIcons name="arrow-back" size={16} color="#25D366" />
            <Text style={styles.backBtnText}>Sair</Text>
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

        {isLoading ? (
          <ActivityIndicator size="large" color="#25D366" style={{ marginVertical: 40 }} />
        ) : (
          <>
            {/* --- VISÃO GERAL HOJE --- */}
            <Text style={styles.sectionTitle}>Visão geral de hoje</Text>
            <View style={styles.statsGrid}>
              {[
                { label: "Prestadores\nativos", value: dashboardData?.stats.activeProviders || 0, sub: "Total", icon: "people", color: "#EFF6FF", iconColor: "#2563EB" },
                { label: "Cliques no\nWhatsApp", value: dashboardData?.stats.whatsappClicks || 0, sub: "Hoje", icon: "chat", color: "#F0FDF4", iconColor: "#16A34A" },
                { label: "Visualizações\nde serviços", value: dashboardData?.stats.serviceViews || 0, sub: "Hoje", icon: "bar-chart", color: "#FFF7ED", iconColor: "#EA580C" },
                {
                  label: "Anúncios\nativos",
                  value: dashboardData?.stats.activeAds || 0,
                  sub: "Gerenciar",
                  icon: "star",
                  color: "#FEFCE8",
                  iconColor: "#CA8A04",
                  onPress: () => router.push("/admin/destaques-admin" as any)
                },
              ].map((stat) => (
                <Pressable
                  key={stat.label}
                  style={({ pressed }) => [styles.statCard, pressed && stat.onPress && { opacity: 0.85 }]}
                  onPress={stat.onPress}
                  disabled={!stat.onPress}
                >
                  <View style={[styles.statIconBox, { backgroundColor: stat.color }]}>
                    <MaterialIcons name={stat.icon as any} size={22} color={stat.iconColor} />
                  </View>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                  <Text style={styles.statSub}>{stat.sub}</Text>
                </Pressable>
              ))}
            </View>

            {/* --- ASSINATURAS E FATURAMENTO (NEW SECTION) --- */}
            <Text style={styles.sectionTitle}>Assinaturas & Faturamento</Text>
            
            {/* MRR Card (Highlight) */}
            <Pressable
              style={({ pressed }) => [styles.mrrCard, pressed && { opacity: 0.9 }]}
              onPress={() => router.push("/admin/payments" as any)}
            >
              <View style={styles.mrrHeader}>
                <View style={styles.mrrIconBox}>
                  <MaterialIcons name="monetization-on" size={24} color="#059669" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.mrrLabel}>Receita Bruta Mensalizada (MRR)</Text>
                  <Text style={styles.mrrValue}>
                    R$ {dashboardData?.stats.monthlyRecurringRevenue?.toFixed(2).replace(".", ",") || "0,00"}
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
              </View>
              <Text style={styles.mrrSub}>
                Baseado em planos ativos • Clique para gerenciar pagamentos
              </Text>
            </Pressable>

            {/* Subscriptions Grid */}
            <View style={styles.statsGrid}>
              {[
                { 
                  label: "Plano Mensal\nAtivos", 
                  value: dashboardData?.stats.activeMonthlyCount || 0, 
                  sub: "R$ 10,00/mês", 
                  icon: "calendar-today", 
                  color: "#ECFDF5", 
                  iconColor: "#059669" 
                },
                { 
                  label: "Plano Anual\nAtivos", 
                  value: dashboardData?.stats.activeAnnualCount || 0, 
                  sub: "R$ 149,90/ano", 
                  icon: "workspace-premium", 
                  color: "#EEF2F6", 
                  iconColor: "#1E3A8A" 
                },
                { 
                  label: "Plaquinhas NFC\npendentes", 
                  value: dashboardData?.stats.pendingNfcCount || 0, 
                  sub: "Ver pendências", 
                  icon: "local-shipping", 
                  color: "#FFFBEB", 
                  iconColor: "#D97706",
                  onPress: () => router.push("/admin/payments" as any)
                },
                { 
                  label: "Captados via\ntráfego", 
                  value: dashboardData?.stats.trafficAcquiredCount || 0, 
                  sub: "Cadastros com UTM", 
                  icon: "traffic", 
                  color: "#FDF2F8", 
                  iconColor: "#DB2777",
                  onPress: () => router.push("/admin/utm" as any)
                },
              ].map((stat) => (
                <Pressable
                  key={stat.label}
                  style={({ pressed }) => [styles.statCard, pressed && stat.onPress && { opacity: 0.85 }]}
                  onPress={stat.onPress}
                  disabled={!stat.onPress}
                >
                  <View style={[styles.statIconBox, { backgroundColor: stat.color }]}>
                    <MaterialIcons name={stat.icon as any} size={22} color={stat.iconColor} />
                  </View>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                  <Text style={styles.statSub}>{stat.sub}</Text>
                </Pressable>
              ))}
            </View>

            {/* --- LINE CHART (EVOLUÇÃO DA RECEITA) --- */}
            <Text style={styles.sectionTitle}>Evolução da Receita (últimos 6 meses)</Text>
            <View 
              style={styles.chartCard} 
              onLayout={(event) => {
                const { width } = event.nativeEvent.layout;
                setChartWidth(width - 32); // account for padding
              }}
            >
              {chartData.length > 0 ? (
                <View style={styles.chartContainer}>
                  <Svg width={chartWidth} height={chartHeight}>
                    <Defs>
                      <LinearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                        <Stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                      </LinearGradient>
                    </Defs>
                    
                    {/* Dotted Grid Lines */}
                    {chartGridPoints.map((g, index) => (
                      <Line
                        key={index}
                        x1={30}
                        y1={g.y}
                        x2={chartWidth - 10}
                        y2={g.y}
                        stroke="#E5E7EB"
                        strokeWidth="1"
                        strokeDasharray="4 4"
                      />
                    ))}

                    {/* Gradient Fill Under Curve */}
                    {chartFillPath ? <Path d={chartFillPath} fill="url(#chartGrad)" /> : null}

                    {/* Bezier Line Stroke */}
                    {chartLinePath ? <Path d={chartLinePath} fill="none" stroke="#10B981" strokeWidth="3" /> : null}

                    {/* Data Points (Dots and labels) */}
                    {chartPoints.map((p, index) => (
                      <G key={index}>
                        <Circle cx={p.x} cy={p.y} r="4" fill="#FFFFFF" stroke="#10B981" strokeWidth="2" />
                        
                        {/* Value text tag above point */}
                        <SvgText
                          x={p.x}
                          y={p.y - 10}
                          fill="#059669"
                          fontSize="9"
                          fontWeight="800"
                          textAnchor="middle"
                        >
                          {`R$ ${p.value.toFixed(0)}`}
                        </SvgText>

                        {/* Month name at the bottom */}
                        <SvgText
                          x={p.x}
                          y={170}
                          fill="#6B7280"
                          fontSize="9"
                          fontWeight="600"
                          textAnchor="middle"
                        >
                          {p.label}
                        </SvgText>
                      </G>
                    ))}
                  </Svg>
                </View>
              ) : (
                <View style={styles.emptyChart}>
                  <Text style={styles.emptyChartText}>Dados de evolução indisponíveis</Text>
                </View>
              )}
            </View>

            {/* --- MAIS BUSCADOS E ATIVIDADE --- */}
            <Text style={styles.sectionTitle}>Serviço mais buscado</Text>
            <View style={styles.topServiceCard}>
              <View style={styles.topServiceIcon}>
                <MaterialIcons name={dashboardData?.topService.icon as any || "electrical-services"} size={26} color="#25D366" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.topServiceName}>{dashboardData?.topService.name || "-"}</Text>
                <Text style={styles.topServicePct}>{dashboardData?.topService.percentage || 0}% das buscas de hoje</Text>
              </View>
              <View style={styles.topServiceBadge}>
                <Text style={styles.topServiceBadgeText}>#1</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Últimas buscas dos usuários</Text>
            <View style={styles.activityList}>
              {(dashboardData?.recentSearches || []).map((item, i) => {
                const queryFormatted = item.query.charAt(0).toUpperCase() + item.query.slice(1);
                const isSuggestion = item.query.startsWith("[sugestão]:") || item.query.startsWith("[SUGESTÃO]:");
                const cleanQuery = isSuggestion 
                  ? item.query.replace(/\[SUGESTÃO\]:\s*/i, "Ideia: ") 
                  : queryFormatted;

                return (
                  <View
                    key={item.id}
                    style={[styles.activityItem, i < (dashboardData?.recentSearches?.length || 0) - 1 && styles.activityBorder]}
                  >
                    <View style={[styles.activityIconBox, { backgroundColor: isSuggestion ? "#FEF3C7" : "#E0F2FE" }]}>
                      <MaterialIcons 
                        name={isSuggestion ? "lightbulb" : "search"} 
                        size={18} 
                        color={isSuggestion ? "#D97706" : "#0284C7"} 
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.activityTitle, { fontWeight: "700" }, isSuggestion && { color: "#B45309" }]}>{cleanQuery}</Text>
                      <Text style={styles.activityName}>
                        {isSuggestion ? "Enviada via formulário" : "Pesquisada no aplicativo"}
                      </Text>
                    </View>
                    <Text style={styles.activityTime}>
                      {new Date(item.time).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </Text>
                  </View>
                );
              })}
              {(!dashboardData?.recentSearches || dashboardData?.recentSearches.length === 0) && (
                <View style={[styles.activityItem, { justifyContent: "center" }]}>
                  <Text style={{ color: "#6B7280" }}>Nenhuma busca recente registrada.</Text>
                </View>
              )}
            </View>

            <View style={styles.activityHeader}>
              <Text style={styles.sectionTitle}>Atividade recente</Text>
              <Pressable onPress={() => router.push("/admin/prestadores-admin" as any)}><Text style={styles.verTudo}>Ver prestadores</Text></Pressable>
            </View>

            <View style={styles.activityList}>
              {(dashboardData?.recentActivity || []).map((item, i) => (
                <View
                  key={item.id}
                  style={[styles.activityItem, i < (dashboardData?.recentActivity?.length || 0) - 1 && styles.activityBorder]}
                >
                  <View style={styles.activityIconBox}>
                    <MaterialIcons name={item.icon as any} size={18} color="#25D366" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.activityTitle}>{item.title}</Text>
                    <Text style={styles.activityName}>{item.name}</Text>
                  </View>
                  <Text style={styles.activityTime}>{new Date(item.time).toLocaleDateString("pt-BR")}</Text>
                </View>
              ))}
              {(!dashboardData?.recentActivity || dashboardData?.recentActivity.length === 0) && (
                 <View style={[styles.activityItem, { justifyContent: "center" }]}>
                   <Text style={{ color: "#6B7280" }}>Nenhuma atividade recente.</Text>
                 </View>
              )}
            </View>
          </>
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
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#111827", marginTop: 20, marginBottom: 10 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: {
    width: "47.5%", backgroundColor: "#FFFFFF", borderRadius: 14,
    padding: 14, borderWidth: 1, borderColor: "#F3F4F6",
  },
  statIconBox: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  statValue: { fontSize: 26, fontWeight: "800", color: "#111827" },
  statLabel: { fontSize: 12, color: "#6B7280", marginTop: 2, lineHeight: 16 },
  statSub: { fontSize: 11, color: "#9CA3AF", marginTop: 4, fontWeight: "500" },
  
  // MRR Card Styles
  mrrCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
    marginBottom: 12,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  mrrHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  mrrIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
  },
  mrrLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
  },
  mrrValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#059669",
    marginTop: 2,
  },
  mrrSub: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 10,
    fontWeight: "500",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 8,
  },
  
  // Custom Chart Styles
  chartCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
  },
  chartContainer: {
    width: "100%",
    height: 180,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyChart: {
    height: 180,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyChartText: {
    color: "#9CA3AF",
    fontSize: 12,
  },

  topServiceCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  topServiceIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
  },
  topServiceName: { fontSize: 15, fontWeight: "700", color: "#111827" },
  topServicePct: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  topServiceBadge: { backgroundColor: "#DCFCE7", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  topServiceBadgeText: { fontSize: 13, fontWeight: "800", color: "#15803D" },
  activityHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    marginBottom: 10,
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
