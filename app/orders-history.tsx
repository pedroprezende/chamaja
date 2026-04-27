import { View, Text, StyleSheet, FlatList, Pressable, Image, Linking, Alert } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useFavorites } from "@/lib/favorites-context";

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  contacted: { bg: "#DBEAFE", text: "#1D4ED8", label: "Contactado" },
  in_progress: { bg: "#FEF3C7", text: "#D97706", label: "Em andamento" },
  completed: { bg: "#DCFCE7", text: "#16A34A", label: "Concluído" },
};

export default function OrdersHistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { orders, clearOrders } = useFavorites();

  const handleWhatsApp = (phone: string, name: string) => {
    const cleaned = phone.replace(/\D/g, "");
    const number = cleaned.startsWith("55") ? cleaned : `55${cleaned}`;
    const msg = encodeURIComponent(`Olá ${name}, gostaria de retomar o contato sobre o serviço.`);
    Linking.openURL(`https://wa.me/${number}?text=${msg}`).catch(() =>
      Alert.alert("Erro", "Não foi possível abrir o WhatsApp.")
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#111827" />
        </Pressable>
        <Text style={styles.headerTitle}>Meus Pedidos</Text>
        {orders.length > 0 ? (
          <Pressable
            style={({ pressed }) => [styles.clearBtn, pressed && { opacity: 0.7 }]}
            onPress={() =>
              Alert.alert("Limpar histórico", "Remover todos os pedidos?", [
                { text: "Cancelar", style: "cancel" },
                { text: "Limpar", style: "destructive", onPress: clearOrders },
              ])
            }
          >
            <Text style={styles.clearBtnText}>Limpar</Text>
          </Pressable>
        ) : (
          <View style={{ width: 60 }} />
        )}
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const statusInfo = STATUS_COLORS[item.status] ?? STATUS_COLORS.contacted;
          const date = new Date(item.contactedAt).toLocaleDateString("pt-BR", {
            day: "2-digit", month: "short", year: "numeric",
          });
          return (
            <Pressable
              style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
              onPress={() => router.push(`/professional/${item.professionalId}` as any)}
            >
              <Image source={{ uri: item.avatar }} style={styles.avatar} />
              <View style={styles.info}>
                <Text style={styles.name}>{item.professionalName}</Text>
                <Text style={styles.service}>{item.category}</Text>
                <Text style={styles.date}>{date}</Text>
              </View>
              <View style={styles.right}>
                <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
                  <Text style={[styles.statusText, { color: statusInfo.text }]}>{statusInfo.label}</Text>
                </View>
                <Pressable
                  style={({ pressed }) => [styles.whatsappBtn, pressed && { opacity: 0.8 }]}
                  onPress={() => handleWhatsApp(item.phone, item.professionalName)}
                >
                  <MaterialIcons name="chat" size={14} color="#fff" />
                </Pressable>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialIcons name="shopping-bag" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>Nenhum pedido ainda</Text>
            <Text style={styles.emptySubtitle}>
              Quando você entrar em contato com um profissional, o pedido aparecerá aqui
            </Text>
            <Pressable style={styles.ctaBtn} onPress={() => router.push("/(tabs)/search" as any)}>
              <Text style={styles.ctaBtnText}>Explorar serviços</Text>
            </Pressable>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "#FFFFFF", paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: "#F3F4F6",
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#111827" },
  clearBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: "#FEF2F2", borderRadius: 8 },
  clearBtnText: { fontSize: 13, fontWeight: "600", color: "#EF4444" },
  listContent: { padding: 16, paddingBottom: 24, flexGrow: 1 },
  card: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF",
    borderRadius: 14, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: "#F3F4F6",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    gap: 12,
  },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: "#E5E7EB" },
  info: { flex: 1, gap: 2 },
  name: { fontSize: 15, fontWeight: "700", color: "#111827" },
  service: { fontSize: 13, color: "#6B7280" },
  date: { fontSize: 12, color: "#9CA3AF" },
  right: { alignItems: "flex-end", gap: 6 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: "600" },
  whatsappBtn: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: "#25D366",
    alignItems: "center", justifyContent: "center",
  },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#374151", marginTop: 8 },
  emptySubtitle: { fontSize: 14, color: "#9CA3AF", textAlign: "center", paddingHorizontal: 32, lineHeight: 20 },
  ctaBtn: {
    marginTop: 16, backgroundColor: "#25D366", borderRadius: 12,
    paddingHorizontal: 24, paddingVertical: 12,
  },
  ctaBtnText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
});
