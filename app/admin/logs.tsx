import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/lib/auth-context";
import { useState } from "react";

export default function LogsMonitorScreen() {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<"ALL" | "error" | "warn" | "info">("ALL");

  const { data: logs, isLoading } = trpc.logs.list.useQuery(undefined, {
    enabled: isAdmin,
    refetchInterval: 10000, // atualiza a cada 10 segundos
  });

  if (!isAdmin) return null;

  const filteredLogs = logs?.filter((l) => filter === "ALL" || l.level === filter) || [];

  const getLevelColor = (level: string) => {
    switch (level) {
      case "error": return "#EF4444";
      case "warn": return "#F59E0B";
      default: return "#3B82F6";
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "error": return "error-outline";
      case "warn": return "warning-amber";
      default: return "info-outline";
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#111827" />
        </Pressable>
        <Text style={styles.headerTitle}>Monitor de Logs</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.filters}>
        {(["ALL", "error", "warn", "info"] as const).map((f) => (
          <Pressable
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === "ALL" ? "Todos" : f.toUpperCase()}
            </Text>
          </Pressable>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#25D366" />
      ) : (
        <FlatList
          data={filteredLogs}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => (
            <View style={styles.logCard}>
              <View style={styles.logHeader}>
                <View style={[styles.badge, { backgroundColor: getLevelColor(item.level) + "20" }]}>
                  <MaterialIcons name={getLevelIcon(item.level) as any} size={14} color={getLevelColor(item.level)} />
                  <Text style={[styles.badgeText, { color: getLevelColor(item.level) }]}>
                    {item.level.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.timestamp}>{new Date(item.createdAt).toLocaleString("pt-BR")}</Text>
              </View>

              <Text style={styles.category}>[{item.category}]</Text>
              <Text style={styles.message}>{item.message}</Text>

              {item.details && (
                <View style={styles.detailsBox}>
                  <Text style={styles.detailsText} numberOfLines={4}>
                    {item.details}
                  </Text>
                </View>
              )}

              <View style={styles.metaRow}>
                {item.platform && (
                  <View style={styles.metaItem}>
                    <MaterialIcons name="smartphone" size={12} color="#6B7280" />
                    <Text style={styles.metaText}>{item.platform}</Text>
                  </View>
                )}
                {item.userId && (
                  <View style={styles.metaItem}>
                    <MaterialIcons name="person" size={12} color="#6B7280" />
                    <Text style={styles.metaText}>{item.userId.substring(0, 8)}...</Text>
                  </View>
                )}
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialIcons name="check-circle-outline" size={48} color="#10B981" />
              <Text style={styles.emptyText}>Nenhum log encontrado para este filtro.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "700", textAlign: "center" },
  filters: {
    flexDirection: "row",
    padding: 16,
    gap: 8,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "transparent",
  },
  filterChipActive: {
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
  },
  filterText: { fontSize: 12, fontWeight: "600", color: "#6B7280" },
  filterTextActive: { color: "#2563EB" },
  logCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  logHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  badge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: "800" },
  timestamp: { fontSize: 11, color: "#9CA3AF", fontWeight: "500" },
  category: { fontSize: 11, fontWeight: "700", color: "#6B7280", marginBottom: 2 },
  message: { fontSize: 14, color: "#111827", fontWeight: "600", marginBottom: 8 },
  detailsBox: { backgroundColor: "#F3F4F6", padding: 10, borderRadius: 8, marginBottom: 10 },
  detailsText: { fontSize: 11, color: "#4B5563", fontFamily: "monospace" },
  metaRow: { flexDirection: "row", gap: 12, marginTop: 4 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 11, color: "#6B7280" },
  empty: { alignItems: "center", marginTop: 60, gap: 8 },
  emptyText: { color: "#6B7280", fontSize: 14, fontWeight: "500" },
});
