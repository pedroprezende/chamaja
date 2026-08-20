import { View, Text, Pressable, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TABS = [
  { key: "inicio", label: "Início", icon: "home", route: "/" },
  {
    key: "dashboard",
    label: "Dashboard",
    icon: "dashboard",
    route: "/admin/dashboard-admin",
  },
  {
    key: "regioes",
    label: "Regiões",
    icon: "location-on",
    route: "/admin/regioes",
  },
  {
    key: "servicos",
    label: "Serviços",
    icon: "build",
    route: "/admin/servicos-admin",
  },
  {
    key: "prestadores",
    label: "Prestadores",
    icon: "people",
    route: "/admin/prestadores-admin",
  },
  {
    key: "mais",
    label: "Mais",
    icon: "more-horiz",
    route: "/admin/destaques-admin",
  },
] as const;

export function AdminTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const getActive = () => {
    if (pathname === "/" || pathname === "") return "inicio";
    if (pathname.includes("dashboard")) return "dashboard";
    if (pathname.includes("regioes")) return "regioes";
    if (pathname.includes("servicos-admin")) return "servicos";
    if (pathname.includes("prestadores-admin")) return "prestadores";
    if (pathname.includes("destaques-admin")) return "mais";
    return "dashboard";
  };

  const active = getActive();

  return (
    <View
      style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}
    >
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
              color={isActive ? "#25D366" : "#9CA3AF"}
            />
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  label: {
    fontSize: 10,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  labelActive: {
    color: "#25D366",
    fontWeight: "700",
  },
});
