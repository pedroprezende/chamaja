import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform, Text, View } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useNotifications } from "@/lib/notifications-context";
import { StyleSheet, Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import { useRouter, usePathname } from "expo-router";

const TABS = [
  { key: "inicio", label: "Início", icon: "home", route: "/" },
  { key: "buscar", label: "Buscar", icon: "search", route: "/search" },
  { key: "favoritos", label: "Favoritos", icon: "favorite-border", route: "/favorites" },
  { key: "perfil", label: "Perfil", icon: "person-outline", route: "/profile" },
] as const;

function DecoupledTabBar({ colors, insets, unreadCount }: { colors: any; insets: any; unreadCount: number }) {
  const router = useRouter();
  const pathname = usePathname();

  const getActive = () => {
    if (pathname === "/" || pathname === "") return "inicio";
    if (pathname.includes("search")) return "buscar";
    if (pathname.includes("favorites")) return "favoritos";
    if (pathname.includes("profile")) return "perfil";
    return "inicio";
  };

  const active = getActive();

  return (
    <View style={[styles.tabBarContainer, { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 8) }]}>
      {TABS.map((tab) => {
        const isActive = active === tab.key;
        return (
          <Pressable
            key={tab.key}
            style={({ pressed }) => [styles.tab, pressed && { opacity: 0.7 }]}
            onPress={() => {
              if (tab.key === "inicio") {
                router.replace(tab.route as any);
              } else {
                router.push(tab.route as any);
              }
            }}
          >
            <MaterialIcons
              name={tab.icon as any}
              size={24}
              color={isActive ? colors.primary : colors.muted}
            />
            <Text style={[styles.label, { color: isActive ? colors.primary : colors.muted }, isActive && styles.labelActive]}>
              {tab.label}
            </Text>
            {tab.key === "perfil" && unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { unreadCount } = useNotifications();

  return (
    <View className="chama-tabs-container" style={{ flex: 1, overflow: 'visible' }}>
      <Tabs
      tabBar={() => null}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Início" }} />
      <Tabs.Screen name="search" options={{ title: "Buscar" }} />
      <Tabs.Screen name="favorites" options={{ title: "Favoritos" }} />
      <Tabs.Screen name="profile" options={{ title: "Perfil" }} />
      </Tabs>
      
      {/* Navbar Desacoplada com a exata mesma estrutura do AdminTabBar */}
      <DecoupledTabBar colors={colors} insets={insets} unreadCount={unreadCount} />
    </View>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: "row",
    borderTopWidth: 1,
    paddingTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 10,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    gap: 2, // Igual ao AdminTabBar
  },
  label: {
    fontSize: 10, // Igual ao AdminTabBar
    fontWeight: "500", // Igual ao AdminTabBar
  },
  labelActive: {
    fontWeight: "700", // Igual ao AdminTabBar
  },
  badge: {
    position: "absolute",
    top: -4,
    right: "15%",
    backgroundColor: "#EF4444",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
  }
});
