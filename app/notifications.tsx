import React from "react";
import { View, Text, StyleSheet, FlatList, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNotifications, AppNotification } from "@/lib/notifications-context";

const ICON_MAP: Record<string, { icon: string; color: string; bg: string }> = {
  info: { icon: "info-outline", color: "#3B82F6", bg: "#EFF6FF" },
  promo: { icon: "local-offer", color: "#F59E0B", bg: "#FFFBEB" },
  order: { icon: "shopping-bag", color: "#25D366", bg: "#F0FDF4" },
  review: { icon: "star-outline", color: "#F59E0B", bg: "#FFFBEB" },
  welcome: { icon: "celebration", color: "#8B5CF6", bg: "#F5F3FF" },
};

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { notifications, unreadCount, markRead, markAllRead, clearAll } = useNotifications();

  const handleClearAll = () => {
    Alert.alert(
      "Limpar notificações",
      "Deseja remover todas as notificações?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Limpar", style: "destructive", onPress: clearAll },
      ]
    );
  };

  const renderItem = ({ item }: { item: AppNotification }) => {
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
            <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
            {!item.read && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.body}>{item.body}</Text>
          <Text style={styles.time}>{item.time}</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#111827" />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Notificações</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <Pressable
              style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.7 }]}
              onPress={markAllRead}
            >
              <MaterialIcons name="done-all" size={20} color="#25D366" />
            </Pressable>
          )}
          {notifications.length > 0 && (
            <Pressable
              style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.7 }]}
              onPress={handleClearAll}
            >
              <MaterialIcons name="delete-outline" size={20} color="#EF4444" />
            </Pressable>
          )}
        </View>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={renderItem}
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerCenter: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1, justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#111827" },
  badge: {
    backgroundColor: "#EF4444",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  badgeText: { fontSize: 11, fontWeight: "700", color: "#FFFFFF" },
  headerActions: { flexDirection: "row", gap: 4 },
  actionBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  listContent: { padding: 16, paddingBottom: 32, flexGrow: 1 },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    gap: 12,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardUnread: { borderColor: "#BBF7D0", backgroundColor: "#F0FDF4" },
  iconWrapper: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: "center", justifyContent: "center",
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
