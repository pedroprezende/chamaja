import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Image,
  Dimensions,
  Platform,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/lib/auth-context";
import { vanillaTrpc } from "@/lib/trpc";

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
  if (diffInMinutes < 60) return `há ${diffInMinutes} minutos`;
  if (diffInHours === 1) return "há 1 hora";
  if (diffInHours < 24) return `há ${diffInHours} horas`;
  if (diffInDays === 1) return "ontem";
  if (diffInDays < 7) return `há ${diffInDays} dias`;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function DetalheNecessidadeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [need, setNeed] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Application Modal States
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyMessage, setApplyMessage] = useState("");
  const [applyPrice, setApplyPrice] = useState("");
  const [applyTime, setApplyTime] = useState("");
  const [submittingApply, setSubmittingApply] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);

  // Applications list for creator
  const [applications, setApplications] = useState<any[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Auth prompt modal state
  const [showAuthModal, setShowAuthModal] = useState(false);

  const triggerHaptic = (
    style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light
  ) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(style);
    }
  };

  const loadApplications = async (needId: string) => {
    setLoadingApps(true);
    try {
      const data = await vanillaTrpc.needs.listApplications.query({ needId });
      setApplications(data || []);
    } catch (err: any) {
      console.warn("Não foi possível carregar candidaturas:", err.message);
    } finally {
      setLoadingApps(false);
    }
  };

  const loadNeed = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await vanillaTrpc.needs.getById.query({ id: String(id) });
      if (data) {
        setNeed(data);
        if (data.isOwner) {
          loadApplications(data.id);
        }
      } else {
        setError("Necessidade não encontrada.");
      }
    } catch (err: any) {
      console.error("Erro ao carregar necessidade:", err);
      setError(err.message || "Falha ao carregar detalhes da necessidade.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNeed();
  }, [id]);

  const handleBack = () => {
    triggerHaptic();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/oportunidades" as any);
    }
  };

  const handleAcceptApp = async (appId: string) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setActionLoadingId(appId);
    try {
      const res = await vanillaTrpc.needs.acceptApplication.mutate({
        applicationId: appId,
      });
      if (res && res.success) {
        triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
        Alert.alert(
          "Candidatura Aceita!",
          "O profissional foi aceito. Você pode combinar os detalhes diretamente via WhatsApp."
        );
        // Update local state immediately
        setApplications((prev) =>
          prev.map((a) => (a.id === appId ? { ...a, status: "aceita" } : a))
        );
        // Refresh need data to update spots
        await loadNeed();
      }
    } catch (err: any) {
      console.error("Erro ao aceitar candidatura:", err);
      Alert.alert(
        "Não foi possível aceitar",
        err.message || "Ocorreu um erro ao aceitar este profissional."
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectApp = async (appId: string) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    setActionLoadingId(appId);
    try {
      const res = await vanillaTrpc.needs.rejectApplication.mutate({
        applicationId: appId,
      });
      if (res && res.success) {
        // Update local state immediately
        setApplications((prev) =>
          prev.map((a) => (a.id === appId ? { ...a, status: "recusada" } : a))
        );
      }
    } catch (err: any) {
      console.error("Erro ao recusar candidatura:", err);
      Alert.alert(
        "Erro ao recusar",
        err.message || "Não foi possível recusar esta proposta."
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleApplyClick = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);

    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (need?.isOwner) {
      Alert.alert(
        "Atenção",
        "Você é o criador desta necessidade e não pode se candidatar à própria publicação."
      );
      return;
    }

    if (need?.myApplication) {
      Alert.alert(
        "Candidatura existente",
        "Você já demonstrou interesse nesta oportunidade."
      );
      return;
    }

    if (need?.status !== "ativa") {
      Alert.alert(
        "Indisponível",
        `Esta oportunidade não está recebendo candidaturas (Status: ${need?.status}).`
      );
      return;
    }

    // Set default suggested price if available
    if (need?.budget) {
      setApplyPrice(String(need.budget));
    }
    setShowApplyModal(true);
  };

  const submitApplication = async () => {
    if (!need) return;
    setSubmittingApply(true);
    try {
      const numericPrice = applyPrice ? parseFloat(applyPrice.replace(",", ".")) : undefined;

      const res = await vanillaTrpc.needs.applyToNeed.mutate({
        needId: need.id,
        message: applyMessage.trim() || undefined,
        proposedPrice: numericPrice && !isNaN(numericPrice) ? numericPrice : undefined,
        estimatedTime: applyTime.trim() || undefined,
      });

      if (res && res.success) {
        triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
        setShowApplyModal(false);
        setApplySuccess(true);
        // Reload details to update myApplication state
        await loadNeed();
      }
    } catch (err: any) {
      console.error("Erro ao enviar candidatura:", err);
      Alert.alert(
        "Erro ao enviar interesse",
        err.message || "Não foi possível enviar sua proposta. Tente novamente."
      );
    } finally {
      setSubmittingApply(false);
    }
  };

  const paymentLabels: Record<string, string> = {
    total: "Valor Total",
    diaria: "Por Diária",
    hora: "Por Hora",
    a_combinar: "A Combinar",
  };

  const required = need?.requiredProfessionals || 1;
  const filled = need?.filledSpots || 0;
  const spotsAvailable = Math.max(0, required - filled);
  const isAvailable = spotsAvailable > 0 && need?.status === "ativa";
  const hasApplied = !!need?.myApplication;
  const isOwner = !!need?.isOwner;

  // Compute Need Visual State
  const isClosed = need?.status === "encerrada" || filled >= required;
  const isPartial = need?.status === "ativa" && filled > 0 && filled < required;
  const isCancelled = need?.status === "cancelada" || need?.status === "pausada";

  const statusState = isCancelled
    ? {
        label: need?.status === "cancelada" ? "CANCELADA" : "PAUSADA",
        bg: "rgba(113, 113, 122, 0.15)",
        text: "#A1A1AA",
        icon: "pause-circle-outline" as const,
        dot: "⚪",
      }
    : isClosed
    ? {
        label: "ENCERRADA",
        bg: "rgba(239, 68, 68, 0.15)",
        text: "#EF4444",
        icon: "cancel" as const,
        dot: "🔴",
      }
    : isPartial
    ? {
        label: "PARCIALMENTE PREENCHIDA",
        bg: "rgba(245, 158, 11, 0.15)",
        text: "#F59E0B",
        icon: "hourglass-top" as const,
        dot: "🟡",
      }
    : {
        label: "ABERTA",
        bg: "rgba(37, 211, 102, 0.15)",
        text: "#25D366",
        icon: "check-circle" as const,
        dot: "🟢",
      };

  // Contractor metrics
  const pendingCount = applications.filter((a) => a.status === "pendente").length;
  const acceptedCount = applications.filter((a) => a.status === "aceita").length;
  const rejectedCount = applications.filter((a) => a.status === "recusada").length;

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
          onPress={handleBack}
          style={({ pressed }) => [
            styles.backBtn,
            { backgroundColor: colors.surface, borderColor: colors.border },
            pressed && { opacity: 0.7 },
          ]}
        >
          <MaterialIcons
            name="arrow-back"
            size={22}
            color={colors.foreground}
          />
        </Pressable>

        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Detalhes da Oportunidade
        </Text>

        <Pressable
          onPress={() => {
            triggerHaptic();
            router.push("/oportunidades" as any);
          }}
          style={({ pressed }) => [
            styles.feedBtn,
            { backgroundColor: colors.surface, borderColor: colors.border },
            pressed && { opacity: 0.7 },
          ]}
        >
          <MaterialIcons name="work-outline" size={20} color={colors.primary} />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#25D366" />
          <Text style={[styles.loadingText, { color: colors.muted }]}>
            Carregando dados da oportunidade...
          </Text>
        </View>
      ) : error || !need ? (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color="#EF4444" />
          <Text style={[styles.errorTitle, { color: colors.foreground }]}>
            Não foi possível exibir a oportunidade
          </Text>
          <Text style={[styles.errorDesc, { color: colors.muted }]}>
            {error || "Registro não encontrado no banco de dados."}
          </Text>
          <Pressable
            onPress={loadNeed}
            style={[styles.retryBtn, { backgroundColor: "#25D366" }]}
          >
            <Text style={styles.retryBtnText}>Tentar Novamente</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 24) + 40 },
          ]}
        >
          {/* ── Status & Vagas Banner ── */}
          <LinearGradient
            colors={["#0d1d12", "#080c09"]}
            style={[styles.heroCard, { borderColor: "#25D36640" }]}
          >
            <View style={styles.badgeRow}>
              {/* Status Indicator (🟢, 🟡, 🔴, ⚪) */}
              <View
                style={[
                  styles.badgePill,
                  { backgroundColor: statusState.bg },
                ]}
              >
                <MaterialIcons
                  name={statusState.icon}
                  size={14}
                  color={statusState.text}
                />
                <Text
                  style={[
                    styles.badgePillText,
                    { color: statusState.text },
                  ]}
                >
                  {statusState.dot} {statusState.label}
                </Text>
              </View>

              {/* Vagas Status */}
              <View
                style={[
                  styles.badgePill,
                  {
                    backgroundColor: isAvailable
                      ? "rgba(59, 130, 246, 0.15)"
                      : "rgba(245, 158, 11, 0.15)",
                  },
                ]}
              >
                <MaterialIcons
                  name={isAvailable ? "people" : "people-outline"}
                  size={14}
                  color={isAvailable ? "#60A5FA" : "#F59E0B"}
                />
                <Text
                  style={[
                    styles.badgePillText,
                    { color: isAvailable ? "#60A5FA" : "#F59E0B" },
                  ]}
                >
                  {filled} de {required} profissionais necessários
                </Text>
              </View>

              {need.category && (
                <View style={styles.categoryPill}>
                  <Text style={styles.categoryPillText}>
                    {need.category}
                    {need.subcategoryName ? ` • ${need.subcategoryName}` : ""}
                  </Text>
                </View>
              )}
            </View>

            <Text style={styles.heroTitle}>{need.title}</Text>

            <View style={styles.heroFooterRow}>
              <Text style={styles.idSub}>
                Código: <Text style={{ fontFamily: "monospace" }}>{need.id}</Text>
              </Text>
              <Text style={styles.idSub}>
                Publicado {formatTimeAgo(need.createdAt)}
              </Text>
            </View>
          </LinearGradient>

          {/* ── CARD: Você já se candidatou / Painel do Criador / Botão Tenho Interesse ── */}
          {hasApplied ? (
            <View
              style={[
                styles.appliedCard,
                {
                  backgroundColor: "rgba(37, 211, 102, 0.1)",
                  borderColor: "#25D366",
                },
              ]}
            >
              <View style={styles.appliedHeader}>
                <MaterialIcons name="check-circle" size={24} color="#25D366" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.appliedTitle}>
                    Interesse Enviado com Sucesso!
                  </Text>
                  <Text style={styles.appliedSub}>
                    Você demonstrou interesse nesta oportunidade{" "}
                    {formatTimeAgo(need.myApplication.createdAt)}.
                  </Text>
                </View>
              </View>

              {need.myApplication.proposedPrice && (
                <View style={styles.appliedRow}>
                  <Text style={styles.appliedLabel}>Sua Proposta:</Text>
                  <Text style={styles.appliedVal}>
                    R$ {Number(need.myApplication.proposedPrice).toFixed(2).replace(".", ",")}
                  </Text>
                </View>
              )}

              {need.myApplication.message && (
                <View style={styles.appliedMessageBox}>
                  <Text style={styles.appliedMessageText}>
                    "{need.myApplication.message}"
                  </Text>
                </View>
              )}

              <View style={styles.appliedStatusBadge}>
                <MaterialIcons name="schedule" size={14} color="#25D366" />
                <Text style={styles.appliedStatusBadgeText}>
                  Aguardando contato do contratante via WhatsApp
                </Text>
              </View>
            </View>
          ) : isOwner ? (
            <View style={{ gap: 12 }}>
              {/* Painel do Contratante (Métricas de Vagas) */}
              <View
                style={[
                  styles.ownerCard,
                  {
                    backgroundColor: "rgba(59, 130, 246, 0.08)",
                    borderColor: "rgba(59, 130, 246, 0.3)",
                  },
                ]}
              >
                <MaterialIcons name="dashboard" size={22} color="#60A5FA" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.ownerTitle}>Painel do Contratante</Text>
                  <Text style={styles.ownerSub}>
                    Controle de vagas e gestão de candidaturas em tempo real.
                  </Text>
                </View>
              </View>

              {/* Grid de Métricas do Contratante */}
              <View style={styles.metricsGrid}>
                <View style={[styles.metricBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.metricLabel, { color: colors.muted }]}>Total de Vagas</Text>
                  <Text style={[styles.metricVal, { color: colors.foreground }]}>{required}</Text>
                </View>

                <View style={[styles.metricBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.metricLabel, { color: colors.muted }]}>Preenchidas</Text>
                  <Text style={[styles.metricVal, { color: "#25D366" }]}>{filled}</Text>
                </View>

                <View style={[styles.metricBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.metricLabel, { color: colors.muted }]}>Vagas Restantes</Text>
                  <Text style={[styles.metricVal, { color: spotsAvailable > 0 ? "#60A5FA" : "#EF4444" }]}>
                    {spotsAvailable}
                  </Text>
                </View>

                <View style={[styles.metricBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.metricLabel, { color: colors.muted }]}>Pendentes</Text>
                  <Text style={[styles.metricVal, { color: "#F59E0B" }]}>{pendingCount}</Text>
                </View>

                <View style={[styles.metricBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.metricLabel, { color: colors.muted }]}>Aceitos</Text>
                  <Text style={[styles.metricVal, { color: "#25D366" }]}>{acceptedCount}</Text>
                </View>

                <View style={[styles.metricBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.metricLabel, { color: colors.muted }]}>Recusados</Text>
                  <Text style={[styles.metricVal, { color: "#EF4444" }]}>{rejectedCount}</Text>
                </View>
              </View>

              {/* ── Seção de Candidaturas Recebidas ── */}
              <View
                style={[
                  styles.card,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <View style={styles.cardHeader}>
                  <MaterialIcons name="group" size={20} color="#25D366" />
                  <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                    Profissionais Interessados ({applications.length})
                  </Text>
                </View>

                {loadingApps ? (
                  <View style={{ paddingVertical: 16, alignItems: "center", gap: 8 }}>
                    <ActivityIndicator size="small" color="#25D366" />
                    <Text style={{ fontSize: 12, color: colors.muted }}>
                      Buscando candidaturas...
                    </Text>
                  </View>
                ) : applications.length === 0 ? (
                  <View style={{ paddingVertical: 14, alignItems: "center", gap: 6 }}>
                    <MaterialIcons name="person-search" size={32} color={colors.muted} />
                    <Text style={{ fontSize: 13, color: colors.muted, textAlign: "center" }}>
                      Nenhum profissional demonstrou interesse ainda.
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.discreto, textAlign: "center" }}>
                      Assim que um profissional se candidatar, ele aparecerá aqui para sua aprovação.
                    </Text>
                  </View>
                ) : (
                  <View style={{ gap: 12 }}>
                    {applications.map((appItem) => {
                      const isPending = appItem.status === "pendente";
                      const isAccepted = appItem.status === "aceita";
                      const isRejected = appItem.status === "recusada";
                      const isActionLoading = actionLoadingId === appItem.id;

                      return (
                        <View
                          key={appItem.id}
                          style={[
                            styles.applicantItemCard,
                            {
                              backgroundColor: colors.background,
                              borderColor: isAccepted
                                ? "#25D366"
                                : isRejected
                                ? "rgba(239, 68, 68, 0.4)"
                                : colors.border,
                            },
                          ]}
                        >
                          {/* Header do Profissional */}
                          <View style={styles.applicantHeaderRow}>
                            {appItem.professionalAvatar ? (
                              <Image
                                source={{ uri: appItem.professionalAvatar }}
                                style={styles.applicantAvatar}
                              />
                            ) : (
                              <View
                                style={[
                                  styles.applicantAvatarPlaceholder,
                                  { backgroundColor: "rgba(37, 211, 102, 0.15)" },
                                ]}
                              >
                                <MaterialIcons name="person" size={22} color="#25D366" />
                              </View>
                            )}

                            <View style={{ flex: 1, gap: 2 }}>
                              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                                <Text
                                  style={[styles.applicantName, { color: colors.foreground }]}
                                  numberOfLines={1}
                                >
                                  {appItem.professionalName}
                                </Text>
                                {appItem.isVerified && (
                                  <MaterialIcons name="verified" size={14} color="#25D366" />
                                )}
                              </View>

                              {appItem.professionalCategory && (
                                <Text style={[styles.applicantCategory, { color: colors.muted }]}>
                                  {appItem.professionalCategory}
                                </Text>
                              )}

                              {appItem.professionalRating && (
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                                  <MaterialIcons name="star" size={12} color="#F59E0B" />
                                  <Text style={{ fontSize: 11, fontWeight: "700", color: "#F59E0B" }}>
                                    {Number(appItem.professionalRating).toFixed(1)}
                                  </Text>
                                  {appItem.professionalRatingCount > 0 && (
                                    <Text style={{ fontSize: 10, color: colors.discreto }}>
                                      ({appItem.professionalRatingCount})
                                    </Text>
                                  )}
                                </View>
                              )}
                            </View>

                            {/* Link / Botão Ver Perfil */}
                            <Pressable
                              onPress={() => {
                                triggerHaptic();
                                router.push(`/professional/${appItem.providerId || appItem.userId}` as any);
                              }}
                              style={[
                                styles.viewProfileBtn,
                                { backgroundColor: colors.surface, borderColor: colors.border },
                              ]}
                            >
                              <Text style={[styles.viewProfileBtnText, { color: colors.foreground }]}>
                                Ver Perfil
                              </Text>
                              <MaterialIcons name="chevron-right" size={14} color={colors.muted} />
                            </Pressable>
                          </View>

                          {/* Mensagem e Proposta */}
                          {appItem.message && (
                            <View style={styles.applicantMessageBox}>
                              <Text style={[styles.applicantMessageText, { color: colors.foreground }]}>
                                "{appItem.message}"
                              </Text>
                            </View>
                          )}

                          <View style={styles.applicantDetailsRow}>
                            {appItem.proposedPrice && (
                              <View style={styles.applicantDetailBadge}>
                                <Text style={styles.applicantDetailLabel}>Proposta:</Text>
                                <Text style={styles.applicantDetailVal}>
                                  R$ {Number(appItem.proposedPrice).toFixed(2).replace(".", ",")}
                                </Text>
                              </View>
                            )}

                            {appItem.estimatedTime && (
                              <View style={styles.applicantDetailBadge}>
                                <Text style={styles.applicantDetailLabel}>Prazo:</Text>
                                <Text style={{ fontSize: 11, color: colors.foreground, fontWeight: "600" }}>
                                  {appItem.estimatedTime}
                                </Text>
                              </View>
                            )}

                            <Text style={[styles.applicantTimeAgo, { color: colors.discreto }]}>
                              {formatTimeAgo(appItem.createdAt)}
                            </Text>
                          </View>

                          {/* Ações: Aceitar / Recusar / Status */}
                          <View style={styles.applicantActionsRow}>
                            {isAccepted ? (
                              <View style={styles.acceptedBadge}>
                                <MaterialIcons name="check-circle" size={16} color="#25D366" />
                                <Text style={styles.acceptedBadgeText}>
                                  Candidatura Aceita
                                </Text>
                              </View>
                            ) : isRejected ? (
                              <View style={styles.rejectedBadge}>
                                <MaterialIcons name="cancel" size={16} color="#EF4444" />
                                <Text style={styles.rejectedBadgeText}>
                                  Candidatura Recusada
                                </Text>
                              </View>
                            ) : isPending ? (
                              <View style={{ flexDirection: "row", gap: 8, flex: 1 }}>
                                <Pressable
                                  onPress={() => handleRejectApp(appItem.id)}
                                  disabled={isActionLoading}
                                  style={[
                                    styles.actionRejectBtn,
                                    { borderColor: "rgba(239, 68, 68, 0.4)" },
                                    isActionLoading && { opacity: 0.5 },
                                  ]}
                                >
                                  <MaterialIcons name="close" size={16} color="#EF4444" />
                                  <Text style={styles.actionRejectBtnText}>Recusar</Text>
                                </Pressable>

                                <Pressable
                                  onPress={() => handleAcceptApp(appItem.id)}
                                  disabled={isActionLoading || spotsAvailable <= 0}
                                  style={[
                                    styles.actionAcceptBtn,
                                    { backgroundColor: spotsAvailable > 0 ? "#25D366" : "#52525B" },
                                    (isActionLoading || spotsAvailable <= 0) && { opacity: 0.7 },
                                  ]}
                                >
                                  {isActionLoading ? (
                                    <ActivityIndicator size="small" color="#000000" />
                                  ) : (
                                    <>
                                      <MaterialIcons name="check" size={16} color="#000000" />
                                      <Text style={styles.actionAcceptBtnText}>
                                        {spotsAvailable > 0 ? "Aceitar" : "Vagas Esgotadas"}
                                      </Text>
                                    </>
                                  )}
                                </Pressable>
                              </View>
                            ) : null}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            </View>
          ) : (
            <View style={styles.applyActionBox}>
              <Pressable
                onPress={handleApplyClick}
                style={({ pressed }) => [
                  styles.tenhoInteresseBtn,
                  pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
                ]}
              >
                <LinearGradient
                  colors={["#25D366", "#1EBE5D"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.tenhoInteresseGradient}
                >
                  <MaterialIcons name="thumb-up" size={20} color="#000000" />
                  <Text style={styles.tenhoInteresseText}>Tenho Interesse</Text>
                  <MaterialIcons name="arrow-forward" size={18} color="#000000" />
                </LinearGradient>
              </Pressable>
            </View>
          )}

          {/* ── Contratante / Criador da Demanda ── */}
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.cardHeader}>
              <MaterialIcons name="person" size={20} color="#25D366" />
              <Text
                style={[styles.cardTitle, { color: colors.foreground }]}
              >
                Solicitante / Contratante
              </Text>
            </View>

            <View style={styles.creatorProfileRow}>
              {need.creatorAvatar ? (
                <Image
                  source={{ uri: need.creatorAvatar }}
                  style={styles.creatorAvatar}
                />
              ) : (
                <View
                  style={[
                    styles.creatorAvatarPlaceholder,
                    { backgroundColor: "rgba(37, 211, 102, 0.15)" },
                  ]}
                >
                  <MaterialIcons name="person" size={26} color="#25D366" />
                </View>
              )}

              <View style={{ flex: 1, gap: 2 }}>
                <Text
                  style={[styles.creatorName, { color: colors.foreground }]}
                  numberOfLines={1}
                >
                  {need.creatorName || "Cliente XamaJá"}
                </Text>
                <Text style={[styles.creatorSub, { color: colors.muted }]}>
                  {need.city} • Cliente na plataforma
                </Text>
              </View>

              <View style={styles.verifiedTag}>
                <MaterialIcons name="verified" size={14} color="#25D366" />
                <Text style={styles.verifiedTagText}>Verificado</Text>
              </View>
            </View>
          </View>

          {/* ── Prazos & Valores ── */}
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.cardHeader}>
              <MaterialIcons name="payments" size={20} color="#25D366" />
              <Text
                style={[styles.cardTitle, { color: colors.foreground }]}
              >
                Prazos & Valores Oferecidos
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.muted }]}>
                Data do Serviço:
              </Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>
                {need.startDate}{" "}
                {need.endDate ? `até ${need.endDate}` : ""}
              </Text>
            </View>

            {(need.startTime || need.endTime) && (
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.muted }]}>
                  Horário:
                </Text>
                <Text style={[styles.infoValue, { color: colors.foreground }]}>
                  {need.startTime || "--:--"} às {need.endTime || "--:--"}
                </Text>
              </View>
            )}

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.muted }]}>
                Forma de Pagamento:
              </Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>
                {paymentLabels[need.paymentType] || need.paymentType}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.muted }]}>
                Valor Oferecido:
              </Text>
              <Text style={[styles.infoValue, { color: "#25D366", fontWeight: "900", fontSize: 16 }]}>
                {need.paymentType === "a_combinar" || !need.budget
                  ? "A combinar diretamente"
                  : `R$ ${Number(need.budget).toFixed(2).replace(".", ",")}`}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.muted }]}>
                Profissionais & Vagas:
              </Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>
                {need.requiredProfessionals} {need.requiredProfessionals === 1 ? "vaga solicitada" : "vagas solicitadas"}
                {filled > 0 ? ` (${filled} preenchida${filled > 1 ? "s" : ""})` : ""}
              </Text>
            </View>
          </View>

          {/* ── Descrição Completa ── */}
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.cardHeader}>
              <MaterialIcons name="description" size={20} color="#25D366" />
              <Text
                style={[styles.cardTitle, { color: colors.foreground }]}
              >
                Descrição Completa
              </Text>
            </View>

            <Text
              style={[styles.descriptionText, { color: colors.foreground }]}
            >
              {need.description}
            </Text>
          </View>

          {/* ── Localização ── */}
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.cardHeader}>
              <MaterialIcons name="place" size={20} color="#25D366" />
              <Text
                style={[styles.cardTitle, { color: colors.foreground }]}
              >
                Local de Atendimento
              </Text>
            </View>

            <Text
              style={[styles.addressMain, { color: colors.foreground }]}
            >
              {need.address ? `${need.address}` : ""}
              {need.neighborhood ? ` - ${need.neighborhood}` : ""}
              {` - ${need.city}`}
            </Text>

            {need.latitude && need.longitude && (
              <View style={styles.coordsBox}>
                <MaterialIcons name="my-location" size={14} color="#25D366" />
                <Text style={[styles.coordsText, { color: colors.muted }]}>
                  Latitude: {Number(need.latitude).toFixed(4)} | Longitude:{" "}
                  {Number(need.longitude).toFixed(4)}
                </Text>
              </View>
            )}
          </View>

          {/* ── Requisitos & Observações ── */}
          {(need.requirements || need.notes) && (
            <View
              style={[
                styles.card,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              {need.requirements && (
                <View style={{ gap: 4, marginBottom: need.notes ? 12 : 0 }}>
                  <Text style={[styles.subCardTitle, { color: colors.muted }]}>
                    REQUISITOS DO PROFISSIONAL
                  </Text>
                  <Text
                    style={[styles.descriptionText, { color: colors.foreground }]}
                  >
                    {need.requirements}
                  </Text>
                </View>
              )}

              {need.notes && (
                <View style={{ gap: 4, borderTopWidth: need.requirements ? 1 : 0, borderTopColor: "rgba(255,255,255,0.06)", paddingTop: need.requirements ? 10 : 0 }}>
                  <Text style={[styles.subCardTitle, { color: colors.muted }]}>
                    OBSERVAÇÕES & INSTRUÇÕES
                  </Text>
                  <Text
                    style={[styles.descriptionText, { color: colors.foreground }]}
                  >
                    {need.notes}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* ── Fotos Anexadas ── */}
          {Array.isArray(need.photos) && need.photos.length > 0 && (
            <View
              style={[
                styles.card,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View style={styles.cardHeader}>
                <MaterialIcons name="photo-library" size={20} color="#25D366" />
                <Text
                  style={[styles.cardTitle, { color: colors.foreground }]}
                >
                  Fotos Anexadas ({need.photos.length})
                </Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 10 }}
              >
                {need.photos.map((url: string, idx: number) => (
                  <Pressable
                    key={idx}
                    onPress={() => setSelectedPhoto(url)}
                    style={({ pressed }) => [
                      styles.photoThumbWrap,
                      pressed && { opacity: 0.8 },
                    ]}
                  >
                    <Image
                      source={{ uri: url }}
                      style={styles.photoThumb}
                    />
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {/* ── Aviso de Pagamento e Negociação Direta ── */}
          <View
            style={[
              styles.noticeBox,
              {
                backgroundColor: "rgba(37, 211, 102, 0.08)",
                borderColor: "rgba(37, 211, 102, 0.25)",
              },
            ]}
          >
            <MaterialIcons name="info-outline" size={22} color="#25D366" />
            <Text style={styles.noticeText}>
              O valor informado é apenas a oferta inicial do contratante. O
              contato, detalhes de execução e forma de pagamento continuam sendo
              combinados diretamente entre as partes via WhatsApp.
            </Text>
          </View>

          {/* ── Botões de Navegação ── */}
          <View style={styles.actionsRow}>
            <Pressable
              onPress={() => {
                triggerHaptic();
                router.push("/oportunidades" as any);
              }}
              style={[
                styles.actionBtnSecondary,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <MaterialIcons
                name="arrow-back"
                size={16}
                color={colors.foreground}
              />
              <Text
                style={[
                  styles.actionBtnSecondaryText,
                  { color: colors.foreground },
                ]}
              >
                Ver Mais Vagas
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                triggerHaptic();
                router.push("/preciso-de-alguem" as any);
              }}
              style={[styles.actionBtnPrimary, { backgroundColor: "#25D366" }]}
            >
              <Text style={styles.actionBtnPrimaryText}>
                Publicar Pedido
              </Text>
              <MaterialIcons name="add" size={18} color="#000000" />
            </Pressable>
          </View>
        </ScrollView>
      )}

      {/* ── Modal de Envio de Interesse (Tenho Interesse) ── */}
      <Modal
        visible={showApplyModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowApplyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.applyModalCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleWrap}>
                <MaterialIcons name="thumb-up" size={22} color="#25D366" />
                <Text
                  style={[styles.modalTitle, { color: colors.foreground }]}
                >
                  Demonstrar Interesse
                </Text>
              </View>
              <Pressable
                onPress={() => setShowApplyModal(false)}
                style={styles.modalCloseBtn}
              >
                <MaterialIcons name="close" size={22} color={colors.muted} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              <View style={{ gap: 14, paddingVertical: 8 }}>
                <Text style={[styles.modalNeedTitle, { color: colors.foreground }]}>
                  {need?.title}
                </Text>

                {/* Mensagem Opcional */}
                <View style={{ gap: 4 }}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>
                    Mensagem de apresentação (opcional):
                  </Text>
                  <TextInput
                    style={[
                      styles.modalTextarea,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                        color: colors.foreground,
                      },
                    ]}
                    placeholder="Ex: Olá, tenho experiência neste serviço e ferramentas próprias. Posso atender com qualidade."
                    placeholderTextColor="#71717A"
                    value={applyMessage}
                    onChangeText={setApplyMessage}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                {/* Valor Proposto Opcional */}
                <View style={{ gap: 4 }}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>
                    Valor Proposto em R$ (opcional):
                  </Text>
                  <TextInput
                    style={[
                      styles.modalInput,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                        color: colors.foreground,
                      },
                    ]}
                    placeholder="Ex: 150.00"
                    placeholderTextColor="#71717A"
                    value={applyPrice}
                    onChangeText={setApplyPrice}
                    keyboardType="numeric"
                  />
                  <Text style={[styles.inputHint, { color: colors.discreto }]}>
                    Valor oferecido pelo cliente: R${" "}
                    {need?.budget ? Number(need.budget).toFixed(2).replace(".", ",") : "A Combinar"}
                  </Text>
                </View>

                {/* Prazo / Disponibilidade Opcional */}
                <View style={{ gap: 4 }}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>
                    Prazo ou disponibilidade (opcional):
                  </Text>
                  <TextInput
                    style={[
                      styles.modalInput,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                        color: colors.foreground,
                      },
                    ]}
                    placeholder="Ex: Disponível para início imediato"
                    placeholderTextColor="#71717A"
                    value={applyTime}
                    onChangeText={setApplyTime}
                  />
                </View>

                {/* Disclaimer */}
                <View
                  style={[
                    styles.modalNotice,
                    { backgroundColor: "rgba(37, 211, 102, 0.08)" },
                  ]}
                >
                  <MaterialIcons name="info-outline" size={16} color="#25D366" />
                  <Text style={styles.modalNoticeText}>
                    O pagamento e o contato serão combinados diretamente entre
                    você e o cliente pelo WhatsApp.
                  </Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalActionsRow}>
              <Pressable
                onPress={() => setShowApplyModal(false)}
                style={[
                  styles.modalBtnCancel,
                  { borderColor: colors.border },
                ]}
              >
                <Text
                  style={[styles.modalBtnCancelText, { color: colors.muted }]}
                >
                  Cancelar
                </Text>
              </Pressable>

              <Pressable
                onPress={submitApplication}
                disabled={submittingApply}
                style={[
                  styles.modalBtnSubmit,
                  { backgroundColor: "#25D366" },
                  submittingApply && { opacity: 0.6 },
                ]}
              >
                {submittingApply ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <>
                    <MaterialIcons name="send" size={16} color="#000000" />
                    <Text style={styles.modalBtnSubmitText}>
                      Enviar Interesse
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Modal de Autenticação Necessária ── */}
      <Modal
        visible={showAuthModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAuthModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.authModalCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.authIconCircle}>
              <MaterialIcons name="lock-outline" size={32} color="#25D366" />
            </View>

            <Text style={[styles.authModalTitle, { color: colors.foreground }]}>
              Faça login para se candidatar
            </Text>

            <Text style={[styles.authModalDesc, { color: colors.muted }]}>
              É necessário estar conectado à sua conta XamaJá para demonstrar
              interesse em oportunidades e enviar propostas a clientes.
            </Text>

            <View style={styles.authModalActions}>
              <Pressable
                onPress={() => {
                  setShowAuthModal(false);
                  router.push("/profile" as any);
                }}
                style={[
                  styles.authLoginBtn,
                  { backgroundColor: "#25D366" },
                ]}
              >
                <Text style={styles.authLoginBtnText}>Fazer Login / Cadastrar</Text>
              </Pressable>

              <Pressable
                onPress={() => setShowAuthModal(false)}
                style={styles.authCancelBtn}
              >
                <Text style={[styles.authCancelBtnText, { color: colors.muted }]}>
                  Voltar
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Modal de Foto em Tela Cheia ── */}
      {selectedPhoto && (
        <Modal
          visible={!!selectedPhoto}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedPhoto(null)}
        >
          <Pressable
            style={styles.lightboxModal}
            onPress={() => setSelectedPhoto(null)}
          >
            <View style={styles.lightboxHeader}>
              <Pressable
                onPress={() => setSelectedPhoto(null)}
                style={styles.lightboxCloseBtn}
              >
                <MaterialIcons name="close" size={24} color="#FFFFFF" />
              </Pressable>
            </View>
            <Image
              source={{ uri: selectedPhoto }}
              style={styles.lightboxImage}
              resizeMode="contain"
            />
          </Pressable>
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
  feedBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
    textAlign: "center",
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  errorDesc: {
    fontSize: 13,
    textAlign: "center",
    maxWidth: 280,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  retryBtnText: {
    color: "#000000",
    fontSize: 14,
    fontWeight: "800",
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  heroCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    gap: 10,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  badgePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgePillText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  categoryPill: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryPillText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 26,
  },
  heroFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    paddingTop: 8,
  },
  idSub: {
    color: "#71717A",
    fontSize: 11,
  },
  appliedCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 16,
    gap: 10,
  },
  appliedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  appliedTitle: {
    color: "#25D366",
    fontSize: 15,
    fontWeight: "900",
  },
  appliedSub: {
    color: "#A1A1AA",
    fontSize: 11,
    marginTop: 2,
  },
  appliedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: "rgba(37, 211, 102, 0.2)",
    paddingTop: 8,
  },
  appliedLabel: {
    color: "#D4D4D8",
    fontSize: 12,
    fontWeight: "600",
  },
  appliedVal: {
    color: "#25D366",
    fontSize: 14,
    fontWeight: "900",
  },
  appliedMessageBox: {
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    padding: 10,
    borderRadius: 10,
  },
  appliedMessageText: {
    color: "#D4D4D8",
    fontSize: 12,
    fontStyle: "italic",
    lineHeight: 16,
  },
  appliedStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 4,
  },
  appliedStatusBadgeText: {
    color: "#25D366",
    fontSize: 11,
    fontWeight: "700",
  },
  ownerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  ownerTitle: {
    color: "#60A5FA",
    fontSize: 13,
    fontWeight: "800",
  },
  ownerSub: {
    color: "#94A3B8",
    fontSize: 11,
    marginTop: 2,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  metricBox: {
    flex: 1,
    minWidth: (SCREEN_WIDTH - 64) / 3,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    textAlign: "center",
  },
  metricVal: {
    fontSize: 16,
    fontWeight: "900",
  },
  applyActionBox: {
    marginVertical: 2,
  },
  tenhoInteresseBtn: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#25D366",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  tenhoInteresseGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  tenhoInteresseText: {
    color: "#000000",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  card: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
    paddingBottom: 8,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  creatorProfileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 4,
  },
  creatorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  creatorAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  creatorName: {
    fontSize: 14,
    fontWeight: "800",
  },
  creatorSub: {
    fontSize: 11,
  },
  verifiedTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(37, 211, 102, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  verifiedTagText: {
    color: "#25D366",
    fontSize: 10,
    fontWeight: "800",
  },
  subCardTitle: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 13,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "600",
  },
  descriptionText: {
    fontSize: 13,
    lineHeight: 19,
  },
  addressMain: {
    fontSize: 14,
    fontWeight: "600",
  },
  coordsBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 4,
  },
  coordsText: {
    fontSize: 11,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  photoThumbWrap: {
    borderRadius: 12,
    overflow: "hidden",
  },
  photoThumb: {
    width: 90,
    height: 90,
    borderRadius: 12,
  },
  noticeBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  noticeText: {
    color: "#A1A1AA",
    fontSize: 12,
    lineHeight: 17,
    flex: 1,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  actionBtnSecondary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  actionBtnSecondaryText: {
    fontSize: 13,
    fontWeight: "700",
  },
  actionBtnPrimary: {
    flex: 1.2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
  },
  actionBtnPrimaryText: {
    color: "#000000",
    fontSize: 13,
    fontWeight: "800",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "flex-end",
  },
  applyModalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 20,
    gap: 12,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
    paddingBottom: 12,
  },
  modalHeaderTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "900",
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalNeedTitle: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 18,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
  },
  modalInput: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  modalTextarea: {
    height: 76,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    textAlignVertical: "top",
  },
  inputHint: {
    fontSize: 11,
  },
  modalNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 10,
  },
  modalNoticeText: {
    color: "#D4D4D8",
    fontSize: 11,
    lineHeight: 15,
    flex: 1,
  },
  modalActionsRow: {
    flexDirection: "row",
    gap: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  modalBtnCancel: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
  },
  modalBtnCancelText: {
    fontSize: 13,
    fontWeight: "700",
  },
  modalBtnSubmit: {
    flex: 1.5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 46,
    borderRadius: 12,
  },
  modalBtnSubmitText: {
    color: "#000000",
    fontSize: 14,
    fontWeight: "900",
  },
  authModalCard: {
    margin: 20,
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    gap: 12,
    alignSelf: "center",
    maxWidth: 360,
  },
  authIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(37, 211, 102, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  authModalTitle: {
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
  },
  authModalDesc: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
  authModalActions: {
    width: "100%",
    gap: 8,
    marginTop: 8,
  },
  authLoginBtn: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    height: 46,
    borderRadius: 12,
  },
  authLoginBtnText: {
    color: "#000000",
    fontSize: 14,
    fontWeight: "800",
  },
  authCancelBtn: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    height: 40,
  },
  authCancelBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
  applicantItemCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  applicantHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  applicantAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  applicantAvatarPlaceholder: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  applicantName: {
    fontSize: 14,
    fontWeight: "800",
  },
  applicantCategory: {
    fontSize: 11,
  },
  viewProfileBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  viewProfileBtnText: {
    fontSize: 11,
    fontWeight: "700",
  },
  applicantMessageBox: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    padding: 10,
    borderRadius: 10,
  },
  applicantMessageText: {
    fontSize: 12,
    fontStyle: "italic",
    lineHeight: 16,
  },
  applicantDetailsRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  applicantDetailBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(37, 211, 102, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  applicantDetailLabel: {
    color: "#D4D4D8",
    fontSize: 11,
  },
  applicantDetailVal: {
    color: "#25D366",
    fontSize: 12,
    fontWeight: "800",
  },
  applicantTimeAgo: {
    fontSize: 11,
    marginLeft: "auto",
  },
  applicantActionsRow: {
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
  },
  acceptedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(37, 211, 102, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  acceptedBadgeText: {
    color: "#25D366",
    fontSize: 12,
    fontWeight: "800",
  },
  rejectedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  rejectedBadgeText: {
    color: "#EF4444",
    fontSize: 12,
    fontWeight: "800",
  },
  actionRejectBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
  },
  actionRejectBtnText: {
    color: "#EF4444",
    fontSize: 12,
    fontWeight: "700",
  },
  actionAcceptBtn: {
    flex: 1.5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    height: 40,
    borderRadius: 10,
  },
  actionAcceptBtnText: {
    color: "#000000",
    fontSize: 12,
    fontWeight: "900",
  },
  lightboxModal: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.92)",
    justifyContent: "center",
    alignItems: "center",
  },
  lightboxHeader: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 10,
  },
  lightboxCloseBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  lightboxImage: {
    width: SCREEN_WIDTH * 0.92,
    height: "75%",
  },
});
