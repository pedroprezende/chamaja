import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  TextInput,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenContainer } from "@/components/screen-container";

interface Payment {
  id: string;
  professionalName: string;
  amount: number;
  plan: string;
  method: string;
  status: "pending" | "approved" | "failed";
  date: string;
}

export default function AdminPaymentsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved">(
    "all"
  );

  // Mock data
  const [payments, setPayments] = useState<Payment[]>([
    {
      id: "1",
      professionalName: "Carlos Eletricista",
      amount: 19.9,
      plan: "Premium Mensal",
      method: "PIX",
      status: "approved",
      date: "2024-04-20",
    },
    {
      id: "2",
      professionalName: "Ana Limpeza",
      amount: 99,
      plan: "Premium Anual",
      method: "Cartão",
      status: "approved",
      date: "2024-04-19",
    },
    {
      id: "3",
      professionalName: "Roberto Pintor",
      amount: 19.9,
      plan: "Premium Mensal",
      method: "Boleto",
      status: "pending",
      date: "2024-04-18",
    },
  ]);

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch = payment.professionalName
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || payment.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalRevenue = payments
    .filter((p) => p.status === "approved")
    .reduce((sum, p) => sum + p.amount, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "#25D366";
      case "pending":
        return "#F59E0B";
      case "failed":
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
      case "failed":
        return "Falhou";
      default:
        return "Desconhecido";
    }
  };

  const handleExportPayments = () => {
    Alert.alert("Exportar", "Pagamentos exportados como CSV");
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
        <Text style={styles.headerTitle}>Pagamentos</Text>
        <Pressable
          style={({ pressed }) => [styles.exportBtn, pressed && { opacity: 0.6 }]}
          onPress={handleExportPayments}
        >
          <MaterialIcons name="download" size={24} color="#25D366" />
        </Pressable>
      </View>

      {/* Revenue Card */}
      <View style={styles.revenueCard}>
        <View>
          <Text style={styles.revenueLabel}>Receita Total</Text>
          <Text style={styles.revenueValue}>
            R$ {totalRevenue.toFixed(2).replace(".", ",")}
          </Text>
        </View>
        <View style={styles.revenueIcon}>
          <MaterialIcons name="trending-up" size={32} color="#25D366" />
        </View>
      </View>

      {/* Search and Filter */}
      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <MaterialIcons name="search" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nome..."
            placeholderTextColor="#6B7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterTabs}>
          {(["all", "pending", "approved"] as const).map((status) => (
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
                  : status === "pending"
                    ? "Pendentes"
                    : "Aprovados"}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Payments List */}
      <ScrollView showsVerticalScrollIndicator={false} style={styles.listContainer}>
        {filteredPayments.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="receipt" size={48} color="#6B7280" />
            <Text style={styles.emptyText}>Nenhum pagamento encontrado</Text>
          </View>
        ) : (
          <View style={styles.paymentsList}>
            {filteredPayments.map((payment) => (
              <View key={payment.id} style={styles.paymentCard}>
                <View style={styles.paymentInfo}>
                  <View style={styles.paymentHeader}>
                    <Text style={styles.paymentName}>{payment.professionalName}</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: `${getStatusColor(payment.status)}20` },
                      ]}
                    >
                      <MaterialIcons
                        name={
                          payment.status === "approved"
                            ? "check-circle"
                            : payment.status === "pending"
                              ? "pending"
                              : "cancel"
                        }
                        size={12}
                        color={getStatusColor(payment.status)}
                      />
                      <Text
                        style={[
                          styles.statusText,
                          { color: getStatusColor(payment.status) },
                        ]}
                      >
                        {getStatusLabel(payment.status)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.paymentDetails}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Plano:</Text>
                      <Text style={styles.detailValue}>{payment.plan}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Método:</Text>
                      <Text style={styles.detailValue}>{payment.method}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Data:</Text>
                      <Text style={styles.detailValue}>{payment.date}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.paymentAmount}>
                  <Text style={styles.amountLabel}>Valor</Text>
                  <Text style={styles.amountValue}>
                    R$ {payment.amount.toFixed(2).replace(".", ",")}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Stats Footer */}
      <View style={styles.footer}>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Total de pagamentos:</Text>
          <Text style={styles.statValue}>{payments.length}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Pendentes:</Text>
          <Text style={[styles.statValue, { color: "#F59E0B" }]}>
            {payments.filter((p) => p.status === "pending").length}
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
  exportBtn: {
    padding: 8,
  },
  revenueCard: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    backgroundColor: "#1F2937",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#374151",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  revenueLabel: {
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 4,
  },
  revenueValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#25D366",
  },
  revenueIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: "rgba(37, 211, 102, 0.1)",
    alignItems: "center",
    justifyContent: "center",
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
  paymentsList: {
    gap: 12,
    paddingVertical: 16,
  },
  paymentCard: {
    backgroundColor: "#1F2937",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#374151",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  paymentInfo: {
    flex: 1,
    gap: 8,
  },
  paymentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  paymentName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#E5E7EB",
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
  paymentDetails: {
    gap: 4,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detailLabel: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  detailValue: {
    fontSize: 12,
    color: "#E5E7EB",
    fontWeight: "500",
  },
  paymentAmount: {
    alignItems: "flex-end",
    marginLeft: 12,
  },
  amountLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    marginBottom: 2,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#25D366",
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
