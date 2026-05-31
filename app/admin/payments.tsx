import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  TextInput,
  Alert,
  Modal,
  Switch,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";

// Date formatter helpers
function formatDate(dateInput: any) {
  if (!dateInput) return "-";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "-";
  
  if (typeof dateInput === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    const [year, month, day] = dateInput.split("-");
    return `${day}/${month}/${year}`;
  }
  
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export default function AdminPaymentsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const utils = trpc.useUtils();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "ativo" | "pendente" | "inativo">("all");
  
  // Collapse state for provider payments history
  const [expandedProviderId, setExpandedProviderId] = useState<string | null>(null);

  // Modal Registration Form state
  const [showModal, setShowModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<{ id: string; name: string } | null>(null);
  const [plano, setPlano] = useState<"mensal" | "anual">("mensal");
  const [valor, setValor] = useState("10.00");
  const [dataPagamento, setDataPagamento] = useState(new Date().toISOString().split("T")[0]);
  const [metodo, setMetodo] = useState("Pix");
  const [nfcEnviada, setNfcEnviada] = useState(false);
  const [dataEnvioNfc, setDataEnvioNfc] = useState(new Date().toISOString().split("T")[0]);

  // Fetch data
  const { data: dbProviders = [], isLoading: loadingProviders } = trpc.providers.all.useQuery();
  const { data: dbPayments = [], isLoading: loadingPayments } = trpc.payments.listAll.useQuery();

  // Mutation
  const registerMutation = trpc.payments.register.useMutation({
    onSuccess: () => {
      Alert.alert("Sucesso", "Pagamento registrado com sucesso!");
      utils.providers.all.invalidate();
      utils.payments.listAll.invalidate();
      setShowModal(false);
      // Reset form states
      setSelectedProvider(null);
      setPlano("mensal");
      setValor("10.00");
      setDataPagamento(new Date().toISOString().split("T")[0]);
      setMetodo("Pix");
      setNfcEnviada(false);
      setDataEnvioNfc(new Date().toISOString().split("T")[0]);
    },
    onError: (err) => {
      Alert.alert("Erro", err.message || "Erro ao registrar pagamento.");
    }
  });

  // Calculate stats & status for each provider
  const now = new Date();
  const providersWithStatus = useMemo(() => {
    return dbProviders.map((prov) => {
      let status: "ativo" | "pendente" | "inativo" = "inativo";
      let daysDiff = 0;
      let isExpired = false;

      if (prov.planExpiresAt) {
        const expiryDate = new Date(prov.planExpiresAt);
        isExpired = expiryDate.getTime() < now.getTime();
        
        const diffTime = Math.abs(now.getTime() - expiryDate.getTime());
        daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        status = isExpired ? "pendente" : "ativo";
      }

      // Latest payment record for this provider
      const providerPayments = dbPayments.filter(p => p.prestadorId === prov.id);
      const latestPayment = providerPayments[0] || null;

      return {
        ...prov,
        paymentStatus: status,
        isExpired,
        daysDiff,
        latestPayment,
        paymentsCount: providerPayments.length,
      };
    });
  }, [dbProviders, dbPayments]);

  // Statistics counters
  const stats = useMemo(() => {
    const total = providersWithStatus.length;
    const ativo = providersWithStatus.filter(p => p.paymentStatus === "ativo").length;
    const pendente = providersWithStatus.filter(p => p.paymentStatus === "pendente").length;
    const inativo = providersWithStatus.filter(p => p.paymentStatus === "inativo").length;
    const totalRevenue = dbPayments.reduce((sum, p) => sum + (p.valor || 0), 0);

    return { total, ativo, pendente, inativo, totalRevenue };
  }, [providersWithStatus, dbPayments]);

  // Filtered providers list
  const filteredProviders = useMemo(() => {
    return providersWithStatus.filter((prov) => {
      const matchesSearch =
        (prov.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (prov.category || "").toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesFilter = filterStatus === "all" || prov.paymentStatus === filterStatus;
      
      return matchesSearch && matchesFilter;
    });
  }, [providersWithStatus, searchQuery, filterStatus]);

  // Handling Plan selection change (update values automatically)
  const handlePlanoChange = (newPlan: "mensal" | "anual") => {
    setPlano(newPlan);
    if (newPlan === "mensal") {
      setValor("10.00");
    } else {
      setValor("149.90");
    }
  };

  const handleRegisterPayment = () => {
    if (!selectedProvider) return;
    
    // Validate value
    const parsedValor = parseFloat(valor);
    if (isNaN(parsedValor) || parsedValor <= 0) {
      Alert.alert("Erro", "Por favor, digite um valor válido.");
      return;
    }

    // Validate payment date format YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dataPagamento)) {
      Alert.alert("Erro", "Formato de data de pagamento inválido. Use AAAA-MM-DD.");
      return;
    }

    if (plano === "anual" && nfcEnviada && !dateRegex.test(dataEnvioNfc)) {
      Alert.alert("Erro", "Formato de data de envio da NFC inválido. Use AAAA-MM-DD.");
      return;
    }

    registerMutation.mutate({
      prestadorId: selectedProvider.id,
      plano,
      valor: parsedValor,
      dataPagamento,
      metodo,
      nfcEnviada: plano === "anual" ? nfcEnviada : false,
      dataEnvioNfc: plano === "anual" && nfcEnviada ? dataEnvioNfc : null,
    });
  };

  const setDateToday = (field: "pagamento" | "nfc") => {
    const todayStr = new Date().toISOString().split("T")[0];
    if (field === "pagamento") {
      setDataPagamento(todayStr);
    } else {
      setDataEnvioNfc(todayStr);
    }
  };

  const setDateYesterday = (field: "pagamento" | "nfc") => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];
    if (field === "pagamento") {
      setDataPagamento(yesterdayStr);
    } else {
      setDataEnvioNfc(yesterdayStr);
    }
  };

  const getStatusBadge = (status: "ativo" | "pendente" | "inativo") => {
    switch (status) {
      case "ativo":
        return (
          <View style={[styles.statusBadge, { backgroundColor: "rgba(16, 185, 129, 0.15)" }]}>
            <MaterialIcons name="check-circle" size={14} color="#10B981" />
            <Text style={[styles.statusText, { color: "#10B981" }]}>Ativo</Text>
          </View>
        );
      case "pendente":
        return (
          <View style={[styles.statusBadge, { backgroundColor: "rgba(239, 68, 68, 0.15)" }]}>
            <MaterialIcons name="warning" size={14} color="#EF4444" />
            <Text style={[styles.statusText, { color: "#EF4444" }]}>Pendente</Text>
          </View>
        );
      case "inativo":
        return (
          <View style={[styles.statusBadge, { backgroundColor: "rgba(156, 163, 175, 0.15)" }]}>
            <MaterialIcons name="remove-circle" size={14} color="#9CA3AF" />
            <Text style={[styles.statusText, { color: "#9CA3AF" }]}>Inativo</Text>
          </View>
        );
    }
  };

  const isLoading = loadingProviders || loadingPayments;

  return (
    <ScreenContainer containerClassName="bg-[#111827]">
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
          onPress={() => router.push("/admin/dashboard-admin" as any)}
        >
          <MaterialIcons name="arrow-back" size={24} color="#E5E7EB" />
        </Pressable>
        <Text style={styles.headerTitle}>Gestão de Pagamentos</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Revenue and Quick Stats Card */}
      <View style={styles.revenueCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.revenueLabel}>Receita Recebida</Text>
          <Text style={styles.revenueValue}>
            R$ {stats.totalRevenue.toFixed(2).replace(".", ",")}
          </Text>
          <Text style={styles.providersCountLabel}>
            Total: {stats.total} prestadores cadastrados
          </Text>
        </View>
        <View style={styles.revenueIcon}>
          <MaterialIcons name="monetization-on" size={32} color="#25D366" />
        </View>
      </View>

      {/* Search and Filters */}
      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <MaterialIcons name="search" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar prestador por nome ou categoria..."
            placeholderTextColor="#6B7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")}>
              <MaterialIcons name="close" size={18} color="#9CA3AF" />
            </Pressable>
          )}
        </View>

        {/* Filter Tabs with Dynamic Counts */}
        <View style={styles.filterTabs}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterTabsContent}>
            <Pressable
              style={[styles.filterTab, filterStatus === "all" && styles.filterTabActive]}
              onPress={() => setFilterStatus("all")}
            >
              <Text style={[styles.filterTabText, filterStatus === "all" && styles.filterTabTextActive]}>
                Todos ({stats.total})
              </Text>
            </Pressable>
            <Pressable
              style={[styles.filterTab, filterStatus === "ativo" && styles.filterTabActive]}
              onPress={() => setFilterStatus("ativo")}
            >
              <Text style={[styles.filterTabText, filterStatus === "ativo" && styles.filterTabTextActive]}>
                Ativos ({stats.ativo})
              </Text>
            </Pressable>
            <Pressable
              style={[styles.filterTab, filterStatus === "pendente" && styles.filterTabActive]}
              onPress={() => setFilterStatus("pendente")}
            >
              <Text style={[styles.filterTabText, filterStatus === "pendente" && styles.filterTabTextActive]}>
                Pendentes ({stats.pendente})
              </Text>
            </Pressable>
            <Pressable
              style={[styles.filterTab, filterStatus === "inativo" && styles.filterTabActive]}
              onPress={() => setFilterStatus("inativo")}
            >
              <Text style={[styles.filterTabText, filterStatus === "inativo" && styles.filterTabTextActive]}>
                Inativos ({stats.inativo})
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>

      {/* Main List */}
      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#25D366" />
          <Text style={styles.loaderText}>Carregando dados financeiros...</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} style={styles.listContainer}>
          {filteredProviders.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="receipt-long" size={56} color="#4B5563" />
              <Text style={styles.emptyText}>Nenhum prestador encontrado</Text>
            </View>
          ) : (
            <View style={styles.paymentsList}>
              {filteredProviders.map((prov) => {
                const isExpanded = expandedProviderId === prov.id;
                const provPayments = dbPayments.filter((p) => p.prestadorId === prov.id);

                return (
                  <View key={prov.id} style={styles.providerCard}>
                    {/* Upper row: Avatar, Info, Status */}
                    <View style={styles.providerHeader}>
                      <View style={styles.providerMainInfo}>
                        <View style={styles.avatarPlaceholder}>
                          <Text style={styles.avatarText}>
                            {(prov.name || "P").substring(0, 1).toUpperCase()}
                          </Text>
                        </View>
                        <View style={{ flex: 1, marginRight: 8 }}>
                          <Text style={styles.providerName}>{prov.name}</Text>
                          <Text style={styles.providerCategory}>
                            {prov.category || "Sem categoria"} • {prov.city || "Cidade não informada"}
                          </Text>
                        </View>
                      </View>
                      {getStatusBadge(prov.paymentStatus)}
                    </View>

                    {/* Active Subscription Details */}
                    {prov.paymentStatus !== "inativo" && (
                      <View style={styles.subscriptionDetails}>
                        <View style={styles.subDetailRow}>
                          <Text style={styles.detailLabel}>Plano atual:</Text>
                          <Text style={styles.detailValue}>
                            {prov.plan === "annual" ? "Anual" : "Mensal"}
                          </Text>
                        </View>
                        <View style={styles.subDetailRow}>
                          <Text style={styles.detailLabel}>Vence em:</Text>
                          <Text style={[
                            styles.detailValue,
                            prov.isExpired ? styles.textDanger : styles.textSuccess
                          ]}>
                            {formatDate(prov.planExpiresAt)}
                          </Text>
                        </View>

                        {/* Expired visual alert */}
                        {prov.isExpired && (
                          <View style={styles.expiryAlertContainer}>
                            <MaterialIcons name="error-outline" size={16} color="#F87171" />
                            <Text style={styles.expiryAlertText}>
                              Pagamento vencido há {prov.daysDiff} {prov.daysDiff === 1 ? "dia" : "dias"}!
                            </Text>
                          </View>
                        )}

                        {/* Remaining active days */}
                        {!prov.isExpired && prov.planExpiresAt && (
                          <Text style={styles.remainingDaysText}>
                            Assinatura ativa. Restam {prov.daysDiff} {prov.daysDiff === 1 ? "dia" : "dias"}.
                          </Text>
                        )}

                        {/* NFC plaque status if annual plan */}
                        {prov.plan === "annual" && prov.latestPayment && (
                          <View style={styles.nfcStatusRow}>
                            <MaterialIcons 
                              name={prov.latestPayment.nfcEnviada ? "local-shipping" : "hourglass-empty"} 
                              size={14} 
                              color={prov.latestPayment.nfcEnviada ? "#10B981" : "#FBBF24"} 
                            />
                            <Text style={[
                              styles.nfcStatusText,
                              { color: prov.latestPayment.nfcEnviada ? "#10B981" : "#FBBF24" }
                            ]}>
                              Plaquinha NFC: {prov.latestPayment.nfcEnviada 
                                ? `Enviada em ${formatDate(prov.latestPayment.dataEnvioNfc)}`
                                : "Pendente de Envio"}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}

                    {prov.paymentStatus === "inativo" && (
                      <View style={styles.inactiveStateContainer}>
                        <Text style={styles.inactiveStateText}>
                          Nenhum pagamento registrado. Sem assinatura ativa.
                        </Text>
                      </View>
                    )}

                    {/* Action buttons */}
                    <View style={styles.cardActions}>
                      <Pressable
                        style={[styles.actionBtn, styles.registerBtn]}
                        onPress={() => {
                          setSelectedProvider({ id: prov.id, name: prov.name });
                          setPlano("mensal");
                          setValor("10.00");
                          setDataPagamento(new Date().toISOString().split("T")[0]);
                          setNfcEnviada(false);
                          setDataEnvioNfc(new Date().toISOString().split("T")[0]);
                          setShowModal(true);
                        }}
                      >
                        <MaterialIcons name="add-card" size={16} color="#111827" />
                        <Text style={styles.registerBtnText}>Registrar Pago</Text>
                      </Pressable>

                      <Pressable
                        style={[styles.actionBtn, styles.historyBtn]}
                        onPress={() => setExpandedProviderId(isExpanded ? null : prov.id)}
                      >
                        <MaterialIcons 
                          name={isExpanded ? "expand-less" : "expand-more"} 
                          size={16} 
                          color="#E5E7EB" 
                        />
                        <Text style={styles.historyBtnText}>
                          Histórico ({prov.paymentsCount})
                        </Text>
                      </Pressable>
                    </View>

                    {/* Expandable Payment History list */}
                    {isExpanded && (
                      <View style={styles.historySection}>
                        <Text style={styles.historyTitle}>Histórico de Transações</Text>
                        {provPayments.length === 0 ? (
                          <Text style={styles.noHistoryText}>Nenhum histórico encontrado para este prestador.</Text>
                        ) : (
                          <View style={styles.historyList}>
                            {provPayments.map((payment) => (
                              <View key={payment.id} style={styles.historyItem}>
                                <View style={{ flex: 1 }}>
                                  <View style={styles.historyItemHeader}>
                                    <Text style={styles.historyItemPlan}>
                                      Plano {payment.plano === "anual" ? "Anual" : "Mensal"}
                                    </Text>
                                    <Text style={styles.historyItemValue}>
                                      R$ {payment.valor ? payment.valor.toFixed(2).replace(".", ",") : "0,00"}
                                    </Text>
                                  </View>
                                  <View style={styles.historyItemMeta}>
                                    <Text style={styles.historyItemDetail}>
                                      Pago em: {formatDate(payment.dataPagamento)} • Método: {payment.metodo}
                                    </Text>
                                  </View>

                                  {/* NFC status inside history item if annual */}
                                  {payment.plano === "anual" && (
                                    <View style={styles.historyItemNfcRow}>
                                      <MaterialIcons 
                                        name={payment.nfcEnviada ? "check" : "close"} 
                                        size={12} 
                                        color={payment.nfcEnviada ? "#10B981" : "#EF4444"} 
                                      />
                                      <Text style={[
                                        styles.historyItemNfcText,
                                        { color: payment.nfcEnviada ? "#10B981" : "#EF4444" }
                                      ]}>
                                        Plaquinha NFC: {payment.nfcEnviada 
                                          ? `Enviada em ${formatDate(payment.dataEnvioNfc)}`
                                          : "Não enviada"}
                                      </Text>
                                    </View>
                                  )}
                                </View>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Register Payment Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showModal}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Registrar Pagamento</Text>
              <Pressable onPress={() => setShowModal(false)} style={styles.closeModalBtn}>
                <MaterialIcons name="close" size={24} color="#E5E7EB" />
              </Pressable>
            </View>

            {selectedProvider && (
              <View style={styles.modalProviderBanner}>
                <Text style={styles.modalProviderLabel}>Prestador:</Text>
                <Text style={styles.modalProviderName}>{selectedProvider.name}</Text>
              </View>
            )}

            <ScrollView contentContainerStyle={styles.modalForm} showsVerticalScrollIndicator={false}>
              {/* Plano selection */}
              <Text style={styles.inputLabel}>Plano Adquirido</Text>
              <View style={styles.planSelectorRow}>
                <Pressable
                  style={[
                    styles.planSelectBtn,
                    plano === "mensal" && styles.planSelectBtnActive
                  ]}
                  onPress={() => handlePlanoChange("mensal")}
                >
                  <Text style={[
                    styles.planSelectBtnText,
                    plano === "mensal" && styles.planSelectBtnTextActive
                  ]}>
                    Mensal
                  </Text>
                  <Text style={[
                    styles.planSelectPrice,
                    plano === "mensal" && styles.planSelectPriceActive
                  ]}>
                    R$ 10,00
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.planSelectBtn,
                    plano === "anual" && styles.planSelectBtnActive
                  ]}
                  onPress={() => handlePlanoChange("anual")}
                >
                  <Text style={[
                    styles.planSelectBtnText,
                    plano === "anual" && styles.planSelectBtnTextActive
                  ]}>
                    Anual
                  </Text>
                  <Text style={[
                    styles.planSelectPrice,
                    plano === "anual" && styles.planSelectPriceActive
                  ]}>
                    R$ 149,90
                  </Text>
                </Pressable>
              </View>

              {/* Valor input */}
              <Text style={styles.inputLabel}>Valor Recebido (R$)</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="numeric"
                value={valor}
                onChangeText={setValor}
                placeholder="Ex: 10.00"
                placeholderTextColor="#4B5563"
              />

              {/* Data do Pagamento input */}
              <View style={styles.inputLabelWithButtons}>
                <Text style={styles.inputLabel}>Data do Pagamento (AAAA-MM-DD)</Text>
                <View style={styles.quickDateButtons}>
                  <Pressable onPress={() => setDateToday("pagamento")} style={styles.quickDateBtn}>
                    <Text style={styles.quickDateText}>Hoje</Text>
                  </Pressable>
                  <Pressable onPress={() => setDateYesterday("pagamento")} style={styles.quickDateBtn}>
                    <Text style={styles.quickDateText}>Ontem</Text>
                  </Pressable>
                </View>
              </View>
              <TextInput
                style={styles.modalInput}
                value={dataPagamento}
                onChangeText={setDataPagamento}
                placeholder="AAAA-MM-DD"
                placeholderTextColor="#4B5563"
                maxLength={10}
              />

              {/* Método do Pagamento input */}
              <Text style={styles.inputLabel}>Método de Pagamento</Text>
              <TextInput
                style={styles.modalInput}
                value={metodo}
                onChangeText={setMetodo}
                placeholder="Ex: Pix, Cartão"
                placeholderTextColor="#4B5563"
              />

              {/* NFC Plaqueta Option (Only shown if Anual) */}
              {plano === "anual" && (
                <View style={styles.nfcFormContainer}>
                  <View style={styles.nfcSwitchRow}>
                    <Text style={styles.nfcSwitchLabel}>Plaquinha NFC já foi enviada?</Text>
                    <Switch
                      value={nfcEnviada}
                      onValueChange={setNfcEnviada}
                      trackColor={{ false: "#374151", true: "#059669" }}
                      thumbColor={nfcEnviada ? "#10B981" : "#9CA3AF"}
                    />
                  </View>

                  {nfcEnviada && (
                    <View style={{ marginTop: 12 }}>
                      <View style={styles.inputLabelWithButtons}>
                        <Text style={styles.inputLabel}>Data de Envio da NFC (AAAA-MM-DD)</Text>
                        <View style={styles.quickDateButtons}>
                          <Pressable onPress={() => setDateToday("nfc")} style={styles.quickDateBtn}>
                            <Text style={styles.quickDateText}>Hoje</Text>
                          </Pressable>
                          <Pressable onPress={() => setDateYesterday("nfc")} style={styles.quickDateBtn}>
                            <Text style={styles.quickDateText}>Ontem</Text>
                          </Pressable>
                        </View>
                      </View>
                      <TextInput
                        style={styles.modalInput}
                        value={dataEnvioNfc}
                        onChangeText={setDataEnvioNfc}
                        placeholder="AAAA-MM-DD"
                        placeholderTextColor="#4B5563"
                        maxLength={10}
                      />
                    </View>
                  )}
                </View>
              )}

              {/* Submit / Cancel Buttons */}
              <View style={styles.modalActionRow}>
                <Pressable
                  style={[styles.modalActionBtn, styles.modalCancelBtn]}
                  onPress={() => setShowModal(false)}
                  disabled={registerMutation.isPending}
                >
                  <Text style={styles.modalCancelBtnText}>Cancelar</Text>
                </Pressable>

                <Pressable
                  style={[styles.modalActionBtn, styles.modalSubmitBtn]}
                  onPress={handleRegisterPayment}
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? (
                    <ActivityIndicator size="small" color="#111827" />
                  ) : (
                    <Text style={styles.modalSubmitBtnText}>Registrar</Text>
                  )}
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    borderBottomColor: "#1F2937",
  },
  backBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#1F2937",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  revenueCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: "#1F2937",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#374151",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  revenueLabel: {
    fontSize: 13,
    color: "#9CA3AF",
    marginBottom: 4,
    fontWeight: "500",
  },
  revenueValue: {
    fontSize: 26,
    fontWeight: "800",
    color: "#25D366",
  },
  providersCountLabel: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 4,
  },
  revenueIcon: {
    width: 60,
    height: 60,
    borderRadius: 14,
    backgroundColor: "rgba(37, 211, 102, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
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
    // Fix outline on web
    ...({ outlineStyle: "none" } as any),
  },
  filterTabs: {
    flexDirection: "row",
    marginTop: 4,
  },
  filterTabsContent: {
    gap: 8,
    paddingRight: 16,
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
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
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 80,
    gap: 12,
  },
  loaderText: {
    color: "#9CA3AF",
    fontSize: 14,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  paymentsList: {
    gap: 12,
    paddingBottom: 24,
  },
  providerCard: {
    backgroundColor: "#1F2937",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#374151",
  },
  providerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  providerMainInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#374151",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#E5E7EB",
    fontWeight: "700",
    fontSize: 18,
  },
  providerName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  providerCategory: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  subscriptionDetails: {
    marginTop: 14,
    backgroundColor: "#111827",
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  subDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  textSuccess: {
    color: "#10B981",
  },
  textDanger: {
    color: "#EF4444",
  },
  expiryAlertContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderRadius: 8,
    padding: 8,
    marginTop: 4,
  },
  expiryAlertText: {
    fontSize: 12,
    color: "#F87171",
    fontWeight: "600",
  },
  remainingDaysText: {
    fontSize: 11,
    color: "#10B981",
    fontWeight: "500",
    marginTop: 2,
  },
  nfcStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: "#1F2937",
    paddingTop: 8,
    marginTop: 2,
  },
  nfcStatusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  inactiveStateContainer: {
    marginTop: 14,
    backgroundColor: "#111827",
    borderRadius: 12,
    padding: 12,
  },
  inactiveStateText: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    fontStyle: "italic",
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  registerBtn: {
    backgroundColor: "#25D366",
  },
  registerBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },
  historyBtn: {
    backgroundColor: "#374151",
    borderWidth: 1,
    borderColor: "#4B5563",
  },
  historyBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#E5E7EB",
  },
  historySection: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#374151",
    paddingTop: 14,
  },
  historyTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#E5E7EB",
    marginBottom: 8,
  },
  noHistoryText: {
    fontSize: 12,
    color: "#6B7280",
    fontStyle: "italic",
  },
  historyList: {
    gap: 8,
  },
  historyItem: {
    backgroundColor: "#111827",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#1F2937",
  },
  historyItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  historyItemPlan: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  historyItemValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#25D366",
  },
  historyItemMeta: {
    marginTop: 4,
  },
  historyItemDetail: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  historyItemNfcRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#1F2937",
  },
  historyItemNfcText: {
    fontSize: 11,
    fontWeight: "500",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 15,
    color: "#6B7280",
    marginTop: 12,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#1F2937",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#374151",
    padding: 20,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
    paddingBottom: 12,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  closeModalBtn: {
    padding: 4,
  },
  modalProviderBanner: {
    backgroundColor: "#111827",
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
  },
  modalProviderLabel: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  modalProviderName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#25D366",
    marginTop: 2,
  },
  modalForm: {
    gap: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#9CA3AF",
    marginBottom: 4,
  },
  inputLabelWithButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  quickDateButtons: {
    flexDirection: "row",
    gap: 6,
  },
  quickDateBtn: {
    backgroundColor: "#374151",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  quickDateText: {
    fontSize: 11,
    color: "#E5E7EB",
    fontWeight: "500",
  },
  planSelectorRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 4,
  },
  planSelectBtn: {
    flex: 1,
    backgroundColor: "#111827",
    borderWidth: 2,
    borderColor: "#374151",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    gap: 4,
  },
  planSelectBtnActive: {
    borderColor: "#25D366",
    backgroundColor: "rgba(37, 211, 102, 0.05)",
  },
  planSelectBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#9CA3AF",
  },
  planSelectBtnTextActive: {
    color: "#25D366",
  },
  planSelectPrice: {
    fontSize: 15,
    fontWeight: "700",
    color: "#E5E7EB",
  },
  planSelectPriceActive: {
    color: "#FFFFFF",
  },
  modalInput: {
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#374151",
    borderRadius: 10,
    padding: 12,
    color: "#FFFFFF",
    fontSize: 14,
    // Fix outline on web
    ...({ outlineStyle: "none" } as any),
  },
  nfcFormContainer: {
    backgroundColor: "#111827",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#374151",
    marginTop: 4,
  },
  nfcSwitchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  nfcSwitchLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#E5E7EB",
    flex: 1,
    marginRight: 12,
  },
  modalActionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
    marginBottom: 10,
  },
  modalActionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelBtn: {
    backgroundColor: "#374151",
  },
  modalCancelBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#E5E7EB",
  },
  modalSubmitBtn: {
    backgroundColor: "#25D366",
  },
  modalSubmitBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
});
