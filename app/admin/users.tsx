import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  FlatList,
  TextInput,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenContainer } from "@/components/screen-container";

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
  status: "active" | "blocked" | "inactive";
}

export default function AdminUsersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "blocked"
  >("all");

  // Mock data
  const [users, setUsers] = useState<User[]>([
    {
      id: "1",
      name: "João Silva",
      email: "joao@example.com",
      phone: "11999999999",
      createdAt: "2024-01-15",
      status: "active",
    },
    {
      id: "2",
      name: "Maria Santos",
      email: "maria@example.com",
      phone: "11988888888",
      createdAt: "2024-02-20",
      status: "active",
    },
    {
      id: "3",
      name: "Pedro Costa",
      email: "pedro@example.com",
      phone: "11977777777",
      createdAt: "2024-03-10",
      status: "blocked",
    },
  ]);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || user.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleBlockUser = (userId: string) => {
    Alert.alert(
      "Bloquear Usuário",
      "Tem certeza que deseja bloquear este usuário?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Bloquear",
          style: "destructive",
          onPress: () => {
            setUsers(
              users.map((u) =>
                u.id === userId ? { ...u, status: "blocked" as const } : u,
              ),
            );
          },
        },
      ],
    );
  };

  const handleDeleteUser = (userId: string) => {
    Alert.alert("Deletar Usuário", "Esta ação é irreversível!", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Deletar",
        style: "destructive",
        onPress: () => {
          setUsers(users.filter((u) => u.id !== userId));
        },
      },
    ]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "#25D366";
      case "blocked":
        return "#EF4444";
      default:
        return "#9CA3AF";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Ativo";
      case "blocked":
        return "Bloqueado";
      default:
        return "Inativo";
    }
  };

  return (
    <ScreenContainer containerClassName="bg-[#111827]">
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#E5E7EB" />
        </Pressable>
        <Text style={styles.headerTitle}>Gerenciar Usuários</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search and Filter */}
      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <MaterialIcons name="search" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nome ou e-mail..."
            placeholderTextColor="#6B7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterTabs}>
          {(["all", "active", "blocked"] as const).map((status) => (
            <Pressable
              key={status}
              style={[
                styles.filterTab,
                filterStatus === status && styles.filterTabActive,
              ]}
              onPress={() => setFilterStatus(status)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  filterStatus === status && styles.filterTabTextActive,
                ]}
              >
                {status === "all"
                  ? "Todos"
                  : status === "active"
                    ? "Ativos"
                    : "Bloqueados"}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Users List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.listContainer}
      >
        {filteredUsers.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="person-off" size={48} color="#6B7280" />
            <Text style={styles.emptyText}>Nenhum usuário encontrado</Text>
          </View>
        ) : (
          <View style={styles.usersList}>
            {filteredUsers.map((user) => (
              <View key={user.id} style={styles.userCard}>
                <View style={styles.userInfo}>
                  <View style={styles.userAvatar}>
                    <Text style={styles.avatarText}>
                      {user.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.userDetails}>
                    <Text style={styles.userName}>{user.name}</Text>
                    <Text style={styles.userEmail}>{user.email}</Text>
                    <Text style={styles.userPhone}>{user.phone}</Text>
                  </View>
                </View>

                <View style={styles.userStatus}>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: `${getStatusColor(user.status)}20` },
                    ]}
                  >
                    <MaterialIcons
                      name={user.status === "active" ? "check-circle" : "block"}
                      size={14}
                      color={getStatusColor(user.status)}
                    />
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusColor(user.status) },
                      ]}
                    >
                      {getStatusLabel(user.status)}
                    </Text>
                  </View>
                </View>

                {/* Actions */}
                <View style={styles.actions}>
                  {user.status === "active" && (
                    <Pressable
                      style={({ pressed }) => [
                        styles.actionBtn,
                        pressed && { opacity: 0.7 },
                      ]}
                      onPress={() => handleBlockUser(user.id)}
                    >
                      <MaterialIcons name="block" size={20} color="#EF4444" />
                    </Pressable>
                  )}
                  <Pressable
                    style={({ pressed }) => [
                      styles.actionBtn,
                      pressed && { opacity: 0.7 },
                    ]}
                    onPress={() => handleDeleteUser(user.id)}
                  >
                    <MaterialIcons name="delete" size={20} color="#EF4444" />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Stats Footer */}
      <View style={styles.footer}>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Total de usuários:</Text>
          <Text style={styles.statValue}>{users.length}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Ativos:</Text>
          <Text style={[styles.statValue, { color: "#25D366" }]}>
            {users.filter((u) => u.status === "active").length}
          </Text>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1F2937",
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#374151",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: "#FFFFFF",
  },
  filterTabs: {
    flexDirection: "row",
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#1F2937",
    borderWidth: 1,
    borderColor: "#374151",
  },
  filterTabActive: {
    backgroundColor: "#25D366",
    borderColor: "#25D366",
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#9CA3AF",
  },
  filterTabTextActive: {
    color: "#111827",
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  usersList: {
    gap: 12,
    paddingVertical: 16,
  },
  userCard: {
    backgroundColor: "#1F2937",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#374151",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  userInfo: {
    flex: 1,
    flexDirection: "row",
    gap: 12,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#25D366",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#E5E7EB",
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  userStatus: {
    marginRight: 8,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    padding: 8,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 12,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#374151",
    backgroundColor: "#1F2937",
    gap: 8,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statLabel: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  statValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#E5E7EB",
  },
});
