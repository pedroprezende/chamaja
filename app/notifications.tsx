import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Notification {
  id: string;
  type: "info" | "promo" | "order" | "review";
  title: string;
  body: string;
  time: string;
  read: boolean;
}

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    type: "promo",
    title: "Bem-vindo ao ChamaJá!",
    body: "Encontre os melhores profissionais da sua região com facilidade.",
    time: "Agora",
    read: false,
  },
  {
    id: "2",
    type: "info",
    title: "Dica: Use o WhatsApp",
    body: "Toque em 'Chamar no WhatsApp' no perfil de qualquer profissional para entrar em contato direto.",
    time: "Hoje",
    read: false,
  },
  {
    id: "3",
    type: "promo",
    title: "Seja um prestador!",
    body: "Cadastre-se como prestador por apenas R$10/mês e comece a receber clientes.",
    time: "Ontem",
    read: true,
  },
];

const ICON_MAP: Record<string, { icon: string; color: string; bg: string }> = {
  info: { icon: "info-outline", color: "#3B82F6", bg: "#EFF6FF" },
  promo: { icon: "local-offer", color: "#F59E0B", bg: "#FFFBEB" },
  order: { icon: "shopping-bag", color: "#25D366", bg: "#F0FDF4" },
  review: { icon: "star-outline", color: "#F59E0B", bg: "#FFFBEB" },
};

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
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
        <Text style={styles.headerTitle}>Notificações</Text>
        {unreadCount > 0 ? (
          <Pressable
            style={({ pressed }) => [styles.markAllBtn, pressed && { opacity: 0.7 }]}
            onPress={markAllRead}
          >
            <Text style={styles.markAllText}>Marcar todas</Text>
          </Pressable>
        ) : (
          <View style={{ width: 80 }} />
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const iconInfo = ICON_MAP[item.type] ?? ICON_MAP.info;
          return (
            <Pressable
              style={({ pressed }) => [
                styles.card,
                !item.read && styles.cardUnread,
                pressed && { opacity: 0.85 },
              ]}
              onPress={() => markRead(item.id)}
            >
              <View style={[styles.iconWrapper, { backgroundColor: iconInfo.bg }]}>
                <MaterialIcons name={iconInfo.icon as any} size={22} color={iconInfo.color} />
              </View>
              <View style={styles.content}>
                <View style={styles.titleRow}>
                  <Text style={styles.title}>{item.title}</Text>
                  {!item.read && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.body}>{item.body}</Text>
                <Text style={styles.time}>{item.time}</Text>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialIcons name="notifications-none" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>Nenhuma notificação</Text>
            <Text style={styles.emptySubtitle}>Você está em dia com tudo!</Text>
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
  markAllBtn: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: "#F0FDF4", borderRadius: 8 },
  markAllText: { fontSize: 12, fontWeight: "600", color: "#25D366" },
  listContent: { padding: 16, paddingBottom: 32, flexGrow: 1 },
  card: {
    flexDirection: "row", alignItems: "flex-start", backgroundColor: "#FFFFFF",
    borderRadius: 14, padding: 14, marginBottom: 10, gap: 12,
    borderWidth: 1, borderColor: "#F3F4F6",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  cardUnread: { borderColor: "#BBF7D0", backgroundColor: "#F0FDF4" },
  iconWrapper: {
    width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center",
  },
  content: { flex: 1, gap: 4 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  title: { flex: 1, fontSize: 14, fontWeight: "700", color: "#111827" },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#25D366" },
  body: { fontSize: 13, color: "#6B7280", lineHeight: 18 },
  time: { fontSize: 11, color: "#9CA3AF" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#374151", marginTop: 8 },
  emptySubtitle: { fontSize: 14, color: "#9CA3AF" },
});
