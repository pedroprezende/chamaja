import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/lib/auth-context";
import { useProvider } from "@/lib/provider-context";
import { useFavorites } from "@/lib/favorites-context";

const ADMIN_EMAIL = "pedroprezende33@gmail.com";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { isProvider, provider } = useProvider();
  const { favorites, orders } = useFavorites();

  const isAdmin = user?.email === ADMIN_EMAIL;

  const handleLogout = () => {
    Alert.alert("Sair", "Tem certeza que deseja sair?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          try { await signOut(); } catch {}
          router.replace("/auth/login" as any);
        },
      },
    ]);
  };

  const MENU_ITEMS = [
    { id: "orders", label: "Meus pedidos", icon: "shopping-bag", badge: orders.length > 0 ? String(orders.length) : undefined },
    { id: "favorites", label: "Favoritos", icon: "favorite-border", badge: favorites.length > 0 ? String(favorites.length) : undefined },
    { id: "notifications", label: "Notificações", icon: "notifications-none" },
    { id: "provider", label: isProvider ? "Minha área de prestador" : "Seja um prestador", icon: isProvider ? "work" : "add-business", highlight: !isProvider },
    { id: "help", label: "Ajuda e suporte", icon: "help-outline" },
    { id: "about", label: "Sobre o ChamaJá", icon: "info-outline" },
    ...(isAdmin ? [{ id: "admin", label: "Painel Admin", icon: "admin-panel-settings", isAdmin: true }] : []),
  ] as const;

  const handleMenuPress = (itemId: string) => {
    switch (itemId) {
      case "orders": router.push("/orders-history" as any); break;
      case "favorites": router.push("/favorites" as any); break;
      case "notifications": router.push("/notifications" as any); break;
      case "provider": router.push(isProvider ? "/provider-dashboard" : "/become-provider" as any); break;
      case "admin": router.push("/admin" as any); break;
      case "help": Alert.alert("Ajuda", "Entre em contato: suporte@chamaja.com.br"); break;
      case "about": Alert.alert("ChamaJá", "Versão 1.0.0\nConecte-se com os melhores profissionais da sua região."); break;
    }
  };

  const displayAvatar = user?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=80";

  return (
    <ScreenContainer containerClassName="bg-[#F5F5F5]" className="">
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Perfil</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarWrapper}>
            <Image source={{ uri: displayAvatar }} style={styles.avatar} />
            {isProvider && (
              <View style={styles.providerBadge}>
                <MaterialIcons name="work" size={10} color="#FFFFFF" />
              </View>
            )}
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || "Usuário"}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            {isProvider && provider && (
              <View style={styles.providerTag}>
                <MaterialIcons name="workspace-premium" size={11} color="#25D366" />
                <Text style={styles.providerTagText}>Prestador • {provider.category}</Text>
              </View>
            )}
            {isAdmin && (
              <View style={[styles.providerTag, { backgroundColor: "#EFF6FF" }]}>
                <MaterialIcons name="admin-panel-settings" size={11} color="#2563EB" />
                <Text style={[styles.providerTagText, { color: "#2563EB" }]}>Administrador</Text>
              </View>
            )}
          </View>
          <Pressable
            style={({ pressed }) => [styles.editBtn, pressed && { opacity: 0.6 }]}
            onPress={() => router.push("/edit-profile" as any)}
          >
            <MaterialIcons name="edit" size={18} color="#25D366" />
          </Pressable>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <Pressable style={styles.statItem} onPress={() => router.push("/orders-history" as any)}>
            <Text style={styles.statValue}>{orders.length}</Text>
            <Text style={styles.statLabel}>Pedidos</Text>
          </Pressable>
          <View style={styles.statDivider} />
          <Pressable style={styles.statItem} onPress={() => router.push("/favorites" as any)}>
            <Text style={styles.statValue}>{favorites.length}</Text>
            <Text style={styles.statLabel}>Favoritos</Text>
          </Pressable>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{isProvider ? provider?.services.length ?? 0 : "—"}</Text>
            <Text style={styles.statLabel}>{isProvider ? "Serviços" : "Avaliações"}</Text>
          </View>
        </View>

        {/* Menu */}
        <View style={styles.menuSection}>
          {MENU_ITEMS.map((item, index) => {
            const isLast = index === MENU_ITEMS.length - 1;
            const isAdminItem = "isAdmin" in item && item.isAdmin;
            const isHighlight = "highlight" in item && item.highlight;
            return (
              <Pressable
                key={item.id}
                style={({ pressed }) => [
                  styles.menuItem,
                  !isLast && styles.menuItemBorder,
                  pressed && { backgroundColor: "#F9FAFB" },
                  isAdminItem && styles.adminMenuItem,
                  isHighlight && styles.highlightMenuItem,
                ]}
                onPress={() => handleMenuPress(item.id)}
              >
                <View style={[
                  styles.menuIcon,
                  isAdminItem && styles.adminMenuIcon,
                  isHighlight && styles.highlightMenuIcon,
                ]}>
                  <MaterialIcons
                    name={item.icon as any}
                    size={20}
                    color={isAdminItem ? "#2563EB" : isHighlight ? "#25D366" : "#6B7280"}
                  />
                </View>
                <Text style={[
                  styles.menuLabel,
                  isAdminItem && styles.adminMenuLabel,
                  isHighlight && styles.highlightMenuLabel,
                ]}>
                  {item.label}
                </Text>
                {"badge" in item && item.badge && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.badge}</Text>
                  </View>
                )}
                <MaterialIcons name="chevron-right" size={20} color="#D1D5DB" />
              </Pressable>
            );
          })}
        </View>

        {/* Logout */}
        <Pressable
          style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.8 }]}
          onPress={handleLogout}
        >
          <MaterialIcons name="logout" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Sair da conta</Text>
        </Pressable>

        <View style={{ height: 24 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerTitle: { fontSize: 22, fontWeight: "700", color: "#111827" },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    margin: 16,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarWrapper: { position: "relative" },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#E5E7EB" },
  providerBadge: {
    position: "absolute", bottom: 0, right: 0,
    width: 20, height: 20, borderRadius: 10, backgroundColor: "#25D366",
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "#FFFFFF",
  },
  userInfo: { flex: 1, gap: 4 },
  userName: { fontSize: 17, fontWeight: "700", color: "#111827" },
  userEmail: { fontSize: 13, color: "#6B7280" },
  providerTag: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#F0FDF4", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3,
    alignSelf: "flex-start",
  },
  providerTagText: { fontSize: 11, fontWeight: "600", color: "#25D366" },
  editBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: "#F0FDF4",
    alignItems: "center", justifyContent: "center",
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statItem: { flex: 1, alignItems: "center", gap: 4 },
  statValue: { fontSize: 20, fontWeight: "700", color: "#111827" },
  statLabel: { fontSize: 12, color: "#6B7280" },
  statDivider: { width: 1, backgroundColor: "#E5E7EB", marginVertical: 4 },
  menuSection: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  menuIcon: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: "#F3F4F6",
    alignItems: "center", justifyContent: "center",
  },
  menuLabel: { flex: 1, fontSize: 15, color: "#111827", fontWeight: "500" },
  badge: {
    backgroundColor: "#25D366", borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2,
    marginRight: 4,
  },
  badgeText: { fontSize: 11, fontWeight: "700", color: "#FFFFFF" },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    backgroundColor: "#FEF2F2",
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  logoutText: { fontSize: 15, fontWeight: "600", color: "#EF4444" },
  adminMenuItem: { backgroundColor: "#EFF6FF" },
  adminMenuIcon: { backgroundColor: "#DBEAFE" },
  adminMenuLabel: { color: "#2563EB", fontWeight: "600" },
  highlightMenuItem: { backgroundColor: "#F0FDF4" },
  highlightMenuIcon: { backgroundColor: "#DCFCE7" },
  highlightMenuLabel: { color: "#16A34A", fontWeight: "600" },
});
