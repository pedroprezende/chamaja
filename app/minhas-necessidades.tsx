import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Dimensions,
  Modal,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { vanillaTrpc } from "@/lib/trpc";
import { useAuth } from "@/lib/auth-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

function formatTimeAgo(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "recentemente";
  const date = new Date(dateInput);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 2) return "agora mesmo";
  if (diffInMinutes < 60) return `há ${diffInMinutes} min`;
  if (diffInHours === 1) return "há 1 hora";
  if (diffInHours < 24) return `há ${diffInHours} horas`;
  if (diffInDays === 1) return "ontem";
  if (diffInDays < 7) return `há ${diffInDays} dias`;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export default function MinhasNecessidadesScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const auth = useAuth();

  const [needsList, setNeedsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("todas");

  // Edit Modal
  const [editingNeed, setEditingNeed] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editBudget, setEditBudget] = useState("");
  const [editPaymentType, setEditPaymentType] = useState<"total" | "diaria" | "hora" | "a_combinar">("total");
  const [editStartDate, setEditStartDate] = useState("");
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");
  const [editRequirements, setEditRequirements] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Cancel Confirmation Modal
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancellingLoading, setCancellingLoading] = useState(false);

  const triggerHaptic = (style = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(style);
    }
  };

  const fetchMyNeeds = async (isPull = false) => {
    if (isPull) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      if (!auth.user) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const res = await vanillaTrpc.needs.myPublishedNeeds.query({ status: "todas" });
      if (Array.isArray(res)) {
        setNeedsList(res);
      } else {
        setNeedsList([]);
      }
    } catch (err: any) {
      console.error("Erro ao buscar minhas necessidades:", err);
      setError(err.message || "Não foi possível carregar suas necessidades.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMyNeeds();
  }, [auth.user]);

  const handleTogglePause = async (item: any) => {
    triggerHaptic();
    const isPaused = item.status === "pausada";
    const newStatus = isPaused ? "ativa" : "pausada";

    try {
      await vanillaTrpc.needs.update.mutate({
        id: item.id,
        status: newStatus,
      });

      setNeedsList((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, status: newStatus } : n))
      );
    } catch (err: any) {
      console.error("Erro ao pausar/reativar:", err);
      Alert.alert("Erro", err.message || "Não foi possível alterar o status.");
    }
  };

  const handleOpenEdit = (item: any) => {
    triggerHaptic();
    setEditingNeed(item);
    setEditTitle(item.title || "");
    setEditDesc(item.description || "");
    setEditBudget(item.budget ? String(item.budget) : "");
    setEditPaymentType(item.paymentType || "total");
    setEditStartDate(item.startDate || "");
    setEditStartTime(item.startTime || "");
    setEditEndTime(item.endTime || "");
    setEditRequirements(item.requirements || "");
    setEditNotes(item.notes || "");
  };

  const handleSaveEdit = async () => {
    if (!editingNeed) return;
    if (!editTitle.trim()) {
      Alert.alert("Atenção", "Título é obrigatório.");
      return;
    }

    triggerHaptic();
    setSavingEdit(true);
    try {
      const numericBudget = editBudget ? parseFloat(editBudget.replace(",", ".")) : undefined;

      await vanillaTrpc.needs.update.mutate({
        id: editingNeed.id,
        title: editTitle.trim(),
        description: editDesc.trim(),
        budget: numericBudget && !isNaN(numericBudget) ? numericBudget : undefined,
        paymentType: editPaymentType,
        startDate: editStartDate,
        startTime: editStartTime || null,
        endTime: editEndTime || null,
        requirements: editRequirements.trim() || null,
        notes: editNotes.trim() || null,
      });

      setEditingNeed(null);
      fetchMyNeeds();
    } catch (err: any) {
      console.error("Erro ao salvar edição:", err);
      Alert.alert("Erro", err.message || "Não foi possível salvar as alterações.");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancellingId) return;

    triggerHaptic();
    setCancellingLoading(true);
    try {
      await vanillaTrpc.needs.cancel.mutate({ id: cancellingId });
      setNeedsList((prev) =>
        prev.map((n) => (n.id === cancellingId ? { ...n, status: "cancelada" } : n))
      );
      setCancellingId(null);
    } catch (err: any) {
      console.error("Erro ao cancelar:", err);
      Alert.alert("Erro", err.message || "Não foi possível cancelar a necessidade.");
    } finally {
      setCancellingLoading(false);
    }
  };

  const paymentLabels: Record<string, string> = {
    total: "Total",
    diaria: "Diária",
    hora: "Hora",
    a_combinar: "A Combinar",
  };

  const filteredNeeds = needsList.filter((item) => {
    const required = item.requiredProfessionals || 1;
    const filled = item.filledSpots || 0;
    const isClosed = item.status === "encerrada" || filled >= required;
    const isPartial = item.status === "ativa" && filled > 0 && filled < required;
    const isOpen = item.status === "ativa" && filled === 0;
    const isPausedOrCancelled = item.status === "pausada" || item.status === "cancelada";

    if (statusFilter === "ativas") return isOpen;
    if (statusFilter === "parciais") return isPartial;
    if (statusFilter === "encerradas") return isClosed;
    if (statusFilter === "pausadas_canceladas") return isPausedOrCancelled;
    return true;
  });

  return (
    <ScreenContainer
      style={{ backgroundColor: colors.background }}
      edges={["top", "left", "right"]}
    >
      <StatusBar style="light" />

      {/* ── Header ── */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Pressable
          onPress={() => {
            triggerHaptic();
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/(tabs)" as any);
            }
          }}
          style={({ pressed }) => [
            styles.backBtn,
            { backgroundColor: colors.surface, borderColor: colors.border },
            pressed && { opacity: 0.7 },
          ]}
        >
          <MaterialIcons name="arrow-back" size={22} color={colors.foreground} />
        </Pressable>

        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            Minhas Publicações
          </Text>
          <Text style={[styles.headerSubtitle, { color: "#25D366" }]}>
            {needsList.length} {needsList.length === 1 ? "pedido publicado" : "pedidos publicados"}
          </Text>
        </View>

        <Pressable
          onPress={() => {
            triggerHaptic();
            router.push("/preciso-de-alguem" as any);
          }}
          style={({ pressed }) => [
            styles.publishBtn,
            pressed && { opacity: 0.8 },
          ]}
        >
          <MaterialIcons name="add" size={18} color="#000000" />
          <Text style={styles.publishBtnText}>Publicar</Text>
        </Pressable>
      </View>

      {/* ── Filter Tabs ── */}
      <View style={[styles.tabsSection, { borderBottomColor: colors.border }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsRow}
        >
          {[
            { key: "todas", label: "Todas", count: needsList.length },
            {
              key: "ativas",
              label: "🟢 Abertas",
              count: needsList.filter((n) => n.status === "ativa" && (n.filledSpots || 0) === 0).length,
            },
            {
              key: "parciais",
              label: "🟡 Parciais",
              count: needsList.filter(
                (n) => n.status === "ativa" && (n.filledSpots || 0) > 0 && (n.filledSpots || 0) < (n.requiredProfessionals || 1)
              ).length,
            },
            {
              key: "encerradas",
              label: "🔴 Encerradas",
              count: needsList.filter(
                (n) => n.status === "encerrada" || (n.filledSpots || 0) >= (n.requiredProfessionals || 1)
              ).length,
            },
            {
              key: "pausadas_canceladas",
              label: "⚪ Pausadas / Canceladas",
              count: needsList.filter((n) => n.status === "pausada" || n.status === "cancelada").length,
            },
          ].map((tab) => {
            const isSelected = statusFilter === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => {
                  triggerHaptic();
                  setStatusFilter(tab.key);
                }}
                style={[
                  styles.tabPill,
                  isSelected
                    ? { backgroundColor: "#25D366", borderColor: "#25D366" }
                    : { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <Text
                  style={[
                    styles.tabPillText,
                    {
                      color: isSelected ? "#000000" : colors.muted,
                      fontWeight: isSelected ? "800" : "600",
                    },
                  ]}
                >
                  {tab.label} ({tab.count})
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Needs List ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContainer,
          { paddingBottom: Math.max(insets.bottom, 24) + 40 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchMyNeeds(true)}
            tintColor="#25D366"
            colors={["#25D366"]}
          />
        }
      >
        {loading && !refreshing ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#25D366" />
            <Text style={[styles.loadingText, { color: colors.muted }]}>
              Carregando suas necessidades...
            </Text>
          </View>
        ) : !auth.user ? (
          <View style={styles.emptyBox}>
            <MaterialIcons name="lock-outline" size={44} color={colors.primary} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              Faça login para ver suas publicações
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.muted }]}>
              Conecte-se para gerenciar seus pedidos de profissionais no XamaJá.
            </Text>
            <Pressable
              onPress={() => router.push("/profile" as any)}
              style={[styles.actionCtaBtn, { backgroundColor: "#25D366" }]}
            >
              <Text style={styles.actionCtaBtnText}>Fazer Login</Text>
            </Pressable>
          </View>
        ) : error ? (
          <View style={styles.emptyBox}>
            <MaterialIcons name="error-outline" size={44} color="#EF4444" />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              Erro ao carregar publicações
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.muted }]}>{error}</Text>
            <Pressable
              onPress={() => fetchMyNeeds()}
              style={[styles.actionCtaBtn, { backgroundColor: "#25D366" }]}
            >
              <Text style={styles.actionCtaBtnText}>Tentar Novamente</Text>
            </Pressable>
          </View>
        ) : filteredNeeds.length === 0 ? (
          <View style={styles.emptyBox}>
            <View
              style={[
                styles.emptyIconCircle,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <MaterialIcons name="assignment-late" size={36} color={colors.muted} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              Nenhuma publicação encontrada
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.muted }]}>
              {statusFilter === "todas"
                ? "Você ainda não publicou nenhuma necessidade. Publique agora para receber propostas de profissionais."
                : "Não há publicações correspondentes ao filtro selecionado."}
            </Text>
            <Pressable
              onPress={() => router.push("/preciso-de-alguem" as any)}
              style={[styles.actionCtaBtn, { backgroundColor: "#25D366" }]}
            >
              <Text style={styles.actionCtaBtnText}>Publicar Nova Necessidade</Text>
            </Pressable>
          </View>
        ) : (
          filteredNeeds.map((item) => {
            const required = item.requiredProfessionals || 1;
            const filled = item.filledSpots || 0;
            const spotsLeft = Math.max(0, required - filled);
            const isClosed = item.status === "encerrada" || filled >= required;
            const isPartial = item.status === "ativa" && filled > 0 && filled < required;
            const isCancelled = item.status === "cancelada";
            const isPaused = item.status === "pausada";

            const stateBadge = isCancelled
              ? { label: "CANCELADA", dot: "⚪", bg: "rgba(113, 113, 122, 0.15)", text: "#A1A1AA" }
              : isPaused
              ? { label: "PAUSADA", dot: "⚪", bg: "rgba(245, 158, 11, 0.15)", text: "#F59E0B" }
              : isClosed
              ? { label: "ENCERRADA", dot: "🔴", bg: "rgba(239, 68, 68, 0.15)", text: "#EF4444" }
              : isPartial
              ? { label: "PARCIALMENTE PREENCHIDA", dot: "🟡", bg: "rgba(245, 158, 11, 0.15)", text: "#F59E0B" }
              : { label: "ABERTA", dot: "🟢", bg: "rgba(37, 211, 102, 0.15)", text: "#25D366" };

            return (
              <View
                key={item.id}
                style={[
                  styles.needCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                {/* Top Row: Category & Status */}
                <View style={styles.cardTopRow}>
                  <View style={styles.categoryRow}>
                    {item.category && (
                      <View style={styles.catBadge}>
                        <Text style={styles.catBadgeText}>{item.category}</Text>
                      </View>
                    )}
                    <View style={[styles.statusBadge, { backgroundColor: stateBadge.bg }]}>
                      <Text style={[styles.statusBadgeText, { color: stateBadge.text }]}>
                        {stateBadge.dot} {stateBadge.label}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.timeAgoText, { color: colors.muted }]}>
                    {formatTimeAgo(item.createdAt)}
                  </Text>
                </View>

                {/* Title & Description */}
                <Text style={[styles.needTitle, { color: colors.foreground }]} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={[styles.needDesc, { color: colors.muted }]} numberOfLines={2}>
                  {item.description}
                </Text>

                {/* Meta details */}
                <View style={styles.metaRowGrid}>
                  <View style={styles.metaItem}>
                    <MaterialIcons name="place" size={13} color="#25D366" />
                    <Text style={[styles.metaItemText, { color: colors.foreground }]} numberOfLines={1}>
                      {item.city}
                    </Text>
                  </View>

                  <View style={styles.metaItem}>
                    <MaterialIcons name="event" size={13} color="#60A5FA" />
                    <Text style={[styles.metaItemText, { color: colors.foreground }]}>
                      {item.startDate}
                    </Text>
                  </View>

                  {(item.startTime || item.endTime) && (
                    <View style={styles.metaItem}>
                      <MaterialIcons name="schedule" size={13} color="#F59E0B" />
                      <Text style={[styles.metaItemText, { color: colors.foreground }]}>
                        {item.startTime || "--:--"} às {item.endTime || "--:--"}
                      </Text>
                    </View>
                  )}

                  <View style={styles.metaItem}>
                    <MaterialIcons name="people" size={13} color="#A78BFA" />
                    <Text style={[styles.metaItemText, { color: colors.foreground }]}>
                      {filled} de {required} vagas
                    </Text>
                  </View>
                </View>

                {/* Candidates banner */}
                <Pressable
                  onPress={() => {
                    triggerHaptic();
                    router.push(`/needs/${item.id}` as any);
                  }}
                  style={styles.candidatesBanner}
                >
                  <View style={styles.candidatesLeft}>
                    <MaterialIcons name="people-alt" size={18} color="#25D366" />
                    <Text style={styles.candidatesBannerTitle}>
                      {item.totalApplications} {item.totalApplications === 1 ? "interessado" : "interessados"}
                    </Text>
                    {item.pendingApplications > 0 && (
                      <View style={styles.pendingDotBadge}>
                        <Text style={styles.pendingDotText}>
                          {item.pendingApplications} pendente{item.pendingApplications === 1 ? "" : "s"}
                        </Text>
                      </View>
                    )}
                  </View>
                  <MaterialIcons name="chevron-right" size={18} color="#25D366" />
                </Pressable>

                {/* Financial Offer */}
                <View style={styles.budgetRow}>
                  <Text style={[styles.budgetLabel, { color: colors.muted }]}>Valor oferecido:</Text>
                  <Text style={styles.budgetValue}>
                    {item.budget ? `R$ ${Number(item.budget).toFixed(2).replace(".", ",")}` : "A Combinar"}
                    <Text style={[styles.budgetUnit, { color: colors.muted }]}>
                      {" "}({paymentLabels[item.paymentType] || item.paymentType})
                    </Text>
                  </Text>
                </View>

                {/* Bottom Actions Bar */}
                <View style={styles.cardActionsRow}>
                  <Pressable
                    onPress={() => {
                      triggerHaptic();
                      router.push(`/needs/${item.id}` as any);
                    }}
                    style={[styles.actionBtnPrimary, { backgroundColor: "#25D366" }]}
                  >
                    <MaterialIcons name="visibility" size={16} color="#000000" />
                    <Text style={styles.actionBtnPrimaryText}>Ver Detalhes</Text>
                  </Pressable>

                  {!isCancelled && !isClosed && (
                    <Pressable
                      onPress={() => handleOpenEdit(item)}
                      style={[styles.actionBtnSecondary, { backgroundColor: colors.background, borderColor: colors.border }]}
                    >
                      <MaterialIcons name="edit" size={15} color={colors.foreground} />
                    </Pressable>
                  )}

                  {!isCancelled && !isClosed && (
                    <Pressable
                      onPress={() => handleTogglePause(item)}
                      style={[
                        styles.actionBtnSecondary,
                        { backgroundColor: colors.background, borderColor: isPaused ? "#25D366" : colors.border },
                      ]}
                    >
                      <MaterialIcons
                        name={isPaused ? "play-arrow" : "pause"}
                        size={16}
                        color={isPaused ? "#25D366" : colors.foreground}
                      />
                    </Pressable>
                  )}

                  {!isCancelled && (
                    <Pressable
                      onPress={() => {
                        triggerHaptic();
                        setCancellingId(item.id);
                      }}
                      style={[styles.actionBtnSecondary, { backgroundColor: colors.background, borderColor: colors.border }]}
                    >
                      <MaterialIcons name="close" size={16} color="#EF4444" />
                    </Pressable>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* ── Edit Modal ── */}
      {editingNeed && (
        <Modal
          visible={!!editingNeed}
          transparent
          animationType="slide"
          onRequestClose={() => setEditingNeed(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>Editar Publicação</Text>
                <Pressable onPress={() => setEditingNeed(null)} hitSlop={8}>
                  <MaterialIcons name="close" size={20} color={colors.muted} />
                </Pressable>
              </View>

              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: colors.muted }]}>Título do Pedido</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                    value={editTitle}
                    onChangeText={setEditTitle}
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: colors.muted }]}>Descrição Detalhada</Text>
                  <TextInput
                    style={[styles.input, styles.textArea, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                    value={editDesc}
                    onChangeText={setEditDesc}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <View style={styles.rowFields}>
                  <View style={[styles.fieldGroup, { flex: 1 }]}>
                    <Text style={[styles.fieldLabel, { color: colors.muted }]}>Valor (R$)</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                      value={editBudget}
                      onChangeText={setEditBudget}
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={[styles.fieldGroup, { flex: 1 }]}>
                    <Text style={[styles.fieldLabel, { color: colors.muted }]}>Data Início</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                      value={editStartDate}
                      onChangeText={setEditStartDate}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#71717A"
                    />
                  </View>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: colors.muted }]}>Requisitos</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                    value={editRequirements}
                    onChangeText={setEditRequirements}
                    placeholder="Ex: Ferramentas próprias"
                    placeholderTextColor="#71717A"
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: colors.muted }]}>Observações</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                    value={editNotes}
                    onChangeText={setEditNotes}
                    placeholder="Ex: Portão lateral"
                    placeholderTextColor="#71717A"
                  />
                </View>
              </ScrollView>

              <View style={styles.modalActions}>
                <Pressable
                  onPress={() => setEditingNeed(null)}
                  style={[styles.modalCancelBtn, { borderColor: colors.border }]}
                >
                  <Text style={[styles.modalCancelBtnText, { color: colors.muted }]}>Cancelar</Text>
                </Pressable>

                <Pressable
                  onPress={handleSaveEdit}
                  disabled={savingEdit}
                  style={[styles.modalSubmitBtn, { backgroundColor: "#25D366" }]}
                >
                  {savingEdit ? (
                    <ActivityIndicator size="small" color="#000000" />
                  ) : (
                    <Text style={styles.modalSubmitBtnText}>Salvar Alterações</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* ── Cancel Confirmation Modal ── */}
      {cancellingId && (
        <Modal
          visible={!!cancellingId}
          transparent
          animationType="fade"
          onRequestClose={() => setCancellingId(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.cancelIconCircle}>
                <MaterialIcons name="close" size={32} color="#EF4444" />
              </View>

              <Text style={[styles.cancelModalTitle, { color: colors.foreground }]}>
                Deseja cancelar esta publicação?
              </Text>
              <Text style={[styles.cancelModalDesc, { color: colors.muted }]}>
                Ela sairá do mural de oportunidades e não receberá mais candidaturas.
              </Text>

              <View style={styles.modalActions}>
                <Pressable
                  onPress={() => setCancellingId(null)}
                  style={[styles.modalCancelBtn, { borderColor: colors.border }]}
                >
                  <Text style={[styles.modalCancelBtnText, { color: colors.muted }]}>Voltar</Text>
                </Pressable>

                <Pressable
                  onPress={handleConfirmCancel}
                  disabled={cancellingLoading}
                  style={[styles.modalSubmitBtn, { backgroundColor: "#EF4444" }]}
                >
                  {cancellingLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={[styles.modalSubmitBtnText, { color: "#FFFFFF" }]}>
                      Confirmar Cancelamento
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleWrap: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: "700",
  },
  publishBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#25D366",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  publishBtnText: {
    color: "#000000",
    fontSize: 12,
    fontWeight: "800",
  },
  tabsSection: {
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  tabsRow: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tabPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  tabPillText: {
    fontSize: 11,
  },
  listContainer: {
    padding: 16,
    gap: 14,
  },
  loadingBox: {
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
  },
  emptyBox: {
    paddingVertical: 60,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "800",
    textAlign: "center",
  },
  emptyDesc: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 280,
  },
  actionCtaBtn: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionCtaBtnText: {
    color: "#000000",
    fontSize: 13,
    fontWeight: "800",
  },
  needCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  catBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  catBadgeText: {
    color: "#D4D4D8",
    fontSize: 10,
    fontWeight: "700",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "800",
  },
  timeAgoText: {
    fontSize: 11,
  },
  needTitle: {
    fontSize: 15,
    fontWeight: "800",
  },
  needDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  metaRowGrid: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
    paddingVertical: 2,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaItemText: {
    fontSize: 11,
    fontWeight: "600",
  },
  candidatesBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(37, 211, 102, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(37, 211, 102, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  candidatesLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  candidatesBannerTitle: {
    color: "#25D366",
    fontSize: 12,
    fontWeight: "800",
  },
  pendingDotBadge: {
    backgroundColor: "#F59E0B",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 4,
  },
  pendingDotText: {
    color: "#000000",
    fontSize: 9,
    fontWeight: "900",
  },
  budgetRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
    paddingTop: 6,
  },
  budgetLabel: {
    fontSize: 11,
  },
  budgetValue: {
    color: "#25D366",
    fontSize: 13,
    fontWeight: "900",
  },
  budgetUnit: {
    fontSize: 10,
    fontWeight: "normal",
  },
  cardActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 4,
  },
  actionBtnPrimary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 38,
    borderRadius: 10,
  },
  actionBtnPrimaryText: {
    color: "#000000",
    fontSize: 12,
    fontWeight: "800",
  },
  actionBtnSecondary: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 400,
    maxHeight: "85%",
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 14,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  modalScroll: {
    maxHeight: 350,
  },
  fieldGroup: {
    gap: 4,
    marginBottom: 10,
  },
  rowFields: {
    flexDirection: "row",
    gap: 10,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
  },
  input: {
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 12,
  },
  textArea: {
    height: 70,
    textAlignVertical: "top",
    paddingTop: 8,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    paddingTop: 6,
  },
  modalCancelBtn: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelBtnText: {
    fontSize: 12,
    fontWeight: "700",
  },
  modalSubmitBtn: {
    flex: 1.5,
    height: 42,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  modalSubmitBtnText: {
    color: "#000000",
    fontSize: 12,
    fontWeight: "800",
  },
  cancelIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  cancelModalTitle: {
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },
  cancelModalDesc: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 16,
  },
});
