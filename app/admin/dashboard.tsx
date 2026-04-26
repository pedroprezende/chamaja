import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAdmin } from "@/lib/admin-context";
import { ScreenContainer } from "@/components/screen-container";

interface StatCard {
  id: string;
  title: string;
  value: string;
  icon: string;
  color: string;
  bgColor: string;
}

interface MenuItem {
  id: string;
  title: string;
  icon: string;
  route: string;
  color: string;
}

export default function AdminDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { adminUser, logout } = useAdmin();

  const stats: StatCard[] = [
    {
      id: "users",
      title: "Usuários",
      value: "1,234",
      icon: "people",
      color: "#3B82F6",
      bgColor: "rgba(59, 130, 246, 0.1)",
    },
    {
      id: "professionals",
      title: "Prestadores",
      value: "456",
      icon: "work",
      color: "#8B5CF6",
      bgColor: "rgba(139, 92, 246, 0.1)",
    },
    {
      id: "payments",
      title: "Pagamentos",
      value: "R$ 12.5k",
      icon: "attach-money",
      color: "#25D366",
      bgColor: "rgba(37, 211, 102, 0.1)",
    },
    {
      id: "pending",
      title: "Pendentes",
      value: "23",
      icon: "pending-actions",
      color: "#F59E0B",
      bgColor: "rgba(245, 158, 11, 0.1)",
    },
  ];

  const menuItems: MenuItem[] = [
    {
      id: "users",
      title: "Gerenciar Usuários",
      icon: "people",
      route: "/admin/users",
      color: "#3B82F6",
    },
    {
      id: "professionals",
      title: "Aprovar Prestadores",
      icon: "verified-user",
      route: "/admin/professionals",
      color: "#8B5CF6",
    },
    {
      id: "locations",
      title: "Gerenciar Locais",
      icon: "location-on",
      route: "/admin/locations",
      color: "#EC4899",
    },
    {
      id: "payments",
      title: "Pagamentos",
      icon: "payment",
      route: "/admin/payments",
      color: "#25D366",
    },
    {
      id: "reports",
      title: "Relatórios",
      icon: "bar-chart",
      route: "/admin/reports",
      color: "#F59E0B",
    },
  ];

  const handleLogout = async () => {
    await logout();
    router.replace("/admin/login" as any);
  };

  return (
    <ScreenContainer containerClassName="bg-[#111827]">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <View>
            <Text style={styles.greeting}>Bem-vindo!</Text>
            <Text style={styles.adminName}>{adminUser?.name}</Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.7 }]}
            onPress={handleLogout}
          >
            <MaterialIcons name="logout" size={24} color="#EF4444" />
          </Pressable>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsContainer}>
          {stats.map((stat) => (
            <View key={stat.id} style={styles.statCard}>
              <View
                style={[
                  styles.statIconBox,
                  { backgroundColor: stat.bgColor },
                ]}
              >
                <MaterialIcons name={stat.icon as any} size={28} color={stat.color} />
              </View>
              <Text style={styles.statTitle}>{stat.title}</Text>
              <Text style={styles.statValue}>{stat.value}</Text>
            </View>
          ))}
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <Text style={styles.menuTitle}>Gerenciamento</Text>
          <View style={styles.menuGrid}>
            {menuItems.map((item) => (
              <Pressable
                key={item.id}
                style={({ pressed }) => [
                  styles.menuItem,
                  pressed && { opacity: 0.8 },
                ]}
                onPress={() => router.push(item.route as any)}
              >
                <View
                  style={[
                    styles.menuIconBox,
                    { backgroundColor: `${item.color}20` },
                  ]}
                >
                  <MaterialIcons name={item.icon as any} size={32} color={item.color} />
                </View>
                <Text style={styles.menuItemTitle}>{item.title}</Text>
                <MaterialIcons name="arrow-forward" size={20} color="#9CA3AF" />
              </Pressable>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.activitySection}>
          <View style={styles.activityHeader}>
            <Text style={styles.activityTitle}>Atividade Recente</Text>
            <Pressable>
              <Text style={styles.viewAll}>Ver tudo</Text>
            </Pressable>
          </View>

          <View style={styles.activityList}>
            {[
              {
                id: 1,
                action: "Novo usuário registrado",
                time: "há 2 horas",
                icon: "person-add",
              },
              {
                id: 2,
                action: "Pagamento aprovado",
                time: "há 4 horas",
                icon: "check-circle",
              },
              {
                id: 3,
                action: "Prestador pendente de aprovação",
                time: "há 6 horas",
                icon: "pending-actions",
              },
            ].map((activity) => (
              <View key={activity.id} style={styles.activityItem}>
                <View style={styles.activityIconBox}>
                  <MaterialIcons name={activity.icon as any} size={20} color="#25D366" />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityAction}>{activity.action}</Text>
                  <Text style={styles.activityTime}>{activity.time}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  greeting: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  adminName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  logoutBtn: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: "48%",
    backgroundColor: "#1F2937",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#374151",
  },
  statIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  statTitle: {
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  menuSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  menuGrid: {
    gap: 12,
  },
  menuItem: {
    backgroundColor: "#1F2937",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#374151",
  },
  menuIconBox: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  menuItemTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  activitySection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  activityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  viewAll: {
    fontSize: 12,
    color: "#25D366",
    fontWeight: "600",
  },
  activityList: {
    backgroundColor: "#1F2937",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#374151",
    overflow: "hidden",
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
  },
  activityIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(37, 211, 102, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  activityContent: {
    flex: 1,
  },
  activityAction: {
    fontSize: 13,
    fontWeight: "600",
    color: "#E5E7EB",
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: "#9CA3AF",
  },
});
