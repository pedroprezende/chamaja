import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  TextInput,
  Alert,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenContainer } from "@/components/screen-container";

interface Professional {
  id: string;
  name: string;
  category: string;
  city: string;
  avatar: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
}

export default function AdminProfessionalsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "pending" | "approved"
  >("pending");

  // Mock data
  const [professionals, setProfessionals] = useState<Professional[]>([
    {
      id: "1",
      name: "Carlos Eletricista",
      category: "Eletricista",
      city: "São Paulo",
      avatar: "https://i.pravatar.cc/150?img=1",
      status: "pending",
      submittedAt: "2024-04-20",
    },
    {
      id: "2",
      name: "Ana Limpeza",
      category: "Limpeza",
      city: "São Paulo",
      avatar: "https://i.pravatar.cc/150?img=2",
      status: "pending",
      submittedAt: "2024-04-19",
    },
    {
      id: "3",
      name: "Roberto Pintor",
      category: "Pintor",
      city: "São Paulo",
      avatar: "https://i.pravatar.cc/150?img=3",
      status: "approved",
      submittedAt: "2024-04-10",
    },
  ]);

  const filteredProfessionals = professionals.filter((prof) => {
    const matchesSearch =
      prof.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prof.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || prof.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleApproveProfessional = (profId: string) => {
    Alert.alert("Aprovar Prestador", "Deseja aprovar este prestador?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Aprovar",
        style: "default",
        onPress: () => {
          setProfessionals(
            professionals.map((p) =>
              p.id === profId ? { ...p, status: "approved" as const } : p,
            ),
          );
        },
      },
    ]);
  };

  const handleRejectProfessional = (profId: string) => {
    Alert.alert("Rejeitar Prestador", "Deseja rejeitar este prestador?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Rejeitar",
        style: "destructive",
        onPress: () => {
          setProfessionals(
            professionals.map((p) =>
              p.id === profId ? { ...p, status: "rejected" as const } : p,
            ),
          );
        },
      },
    ]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "#25D366";
      case "pending":
        return "#F59E0B";
      case "rejected":
        return "#EF4444";
      default:
        return "#9CA3AF";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "approved":
        return "Aprovado";
      case "pending":
        return "Pendente";
      case "rejected":
        return "Rejeitado";
      default:
        return "Desconhecido";
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
        <Text style={styles.headerTitle}>Aprovar Prestadores</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search and Filter */}
      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <MaterialIcons name="search" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nome ou categoria..."
            placeholderTextColor="#6B7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterTabs}>
          {(["pending", "approved", "all"] as const).map((status) => (
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
                {status === "pending"
                  ? "Pendentes"
                  : status === "approved"
                    ? "Aprovados"
                    : "Todos"}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Professionals List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.listContainer}
      >
        {filteredProfessionals.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="person-off" size={48} color="#6B7280" />
            <Text style={styles.emptyText}>Nenhum prestador encontrado</Text>
          </View>
        ) : (
          <View style={styles.profList}>
            {filteredProfessionals.map((prof) => (
              <View key={prof.id} style={styles.profCard}>
                <Image
                  source={{ uri: prof.avatar }}
                  style={styles.profAvatar}
                />

                <View style={styles.profInfo}>
                  <Text style={styles.profName}>{prof.name}</Text>
                  <Text style={styles.profCategory}>{prof.category}</Text>
                  <Text style={styles.profCity}>{prof.city}</Text>
                  <Text style={styles.profDate}>
                    Enviado: {prof.submittedAt}
                  </Text>
                </View>

                <View style={styles.profStatus}>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: `${getStatusColor(prof.status)}20` },
                    ]}
                  >
                    <MaterialIcons
                      name={
                        prof.status === "approved"
                          ? "check-circle"
                          : prof.status === "pending"
                            ? "pending"
                            : "cancel"
                      }
                      size={14}
                      color={getStatusColor(prof.status)}
                    />
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusColor(prof.status) },
                      ]}
                    >
                      {getStatusLabel(prof.status)}
                    </Text>
                  </View>
                </View>

                {/* Actions */}
                {prof.status === "pending" && (
                  <View style={styles.actions}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.approveBtn,
                        pressed && { opacity: 0.8 },
                      ]}
                      onPress={() => handleApproveProfessional(prof.id)}
                    >
                      <MaterialIcons name="check" size={18} color="#FFFFFF" />
                      <Text style={styles.approveBtnText}>Aprovar</Text>
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [
                        styles.rejectBtn,
                        pressed && { opacity: 0.8 },
                      ]}
                      onPress={() => handleRejectProfessional(prof.id)}
                    >
                      <MaterialIcons name="close" size={18} color="#FFFFFF" />
                      <Text style={styles.rejectBtnText}>Rejeitar</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Stats Footer */}
      <View style={styles.footer}>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Pendentes:</Text>
          <Text style={[styles.statValue, { color: "#F59E0B" }]}>
            {professionals.filter((p) => p.status === "pending").length}
          </Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Aprovados:</Text>
          <Text style={[styles.statValue, { color: "#25D366" }]}>
            {professionals.filter((p) => p.status === "approved").length}
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
  profList: {
    gap: 12,
    paddingVertical: 16,
  },
  profCard: {
    backgroundColor: "#1F2937",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#374151",
    gap: 12,
  },
  profAvatar: {
    width: "100%",
    height: 150,
    borderRadius: 12,
    backgroundColor: "#374151",
  },
  profInfo: {
    gap: 4,
  },
  profName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#E5E7EB",
  },
  profCategory: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  profCity: {
    fontSize: 13,
    color: "#9CA3AF",
  },
  profDate: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  profStatus: {
    alignItems: "flex-start",
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
    gap: 12,
  },
  approveBtn: {
    flex: 1,
    backgroundColor: "#25D366",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  approveBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  rejectBtn: {
    flex: 1,
    backgroundColor: "#EF4444",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  rejectBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
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
