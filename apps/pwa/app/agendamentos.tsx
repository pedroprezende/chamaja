import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/lib/auth-context";

type StatusFilter = "all" | "pending" | "confirmed" | "completed" | "canceled";

export default function AgendamentosScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const {
    data: appointments,
    isLoading,
    isRefetching,
    refetch,
  } = trpc.appointments.getByUser.useQuery(undefined, {
    enabled: !!user,
  });

  const updateStatus = trpc.appointments.updateStatus.useMutation({
    onSuccess: () => refetch(),
    onError: (err) => {
      Alert.alert("Erro", err.message || "Não foi possível atualizar o agendamento.");
    },
  });

  const handleCancel = (id: string, serviceName?: string) => {
    Alert.alert(
      "Cancelar Agendamento",
      `Tem certeza que deseja cancelar o agendamento${serviceName ? ` de "${serviceName}"` : ""}?`,
      [
        { text: "Voltar", style: "cancel" },
        {
          text: "Sim, Cancelar",
          style: "destructive",
          onPress: () => updateStatus.mutate({ id, status: "canceled" }),
        },
      ]
    );
  };

  const handleOpenWhatsApp = (provider: any, appt: any) => {
    const rawPhone = provider?.whatsapp || provider?.phone || "";
    const cleanPhone = rawPhone.replace(/\D/g, "");
    if (!cleanPhone) {
      Alert.alert("Aviso", "O profissional não possui telefone cadastrado para WhatsApp.");
      return;
    }
    const fullNumber = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;

    const [y, m, d] = (appt.date || "").split("-");
    const formattedDate = d && m && y ? `${d}/${m}/${y}` : appt.date;
    const msg = `Olá ${provider?.name || ""}! Gostaria de falar sobre meu agendamento pelo XamaJá:\n\n📅 Data: ${formattedDate}\n⏰ Horário: ${appt.startTime} às ${appt.endTime}\n💼 Serviço: ${appt.serviceName || "Atendimento"}`;

    const url = `https://wa.me/${fullNumber}?text=${encodeURIComponent(msg)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert("Erro", "Não foi possível abrir o WhatsApp.");
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return {
          label: "Pendente",
          color: "#EAB308",
          bg: "#FEF08A25",
          border: "#CA8A0450",
          icon: "hourglass-empty" as const,
        };
      case "confirmed":
        return {
          label: "Confirmado",
          color: "#10B981",
          bg: "#A7F3D025",
          border: "#05966950",
          icon: "check-circle" as const,
        };
      case "completed":
        return {
          label: "Concluído",
          color: "#3B82F6",
          bg: "#BFDBFE25",
          border: "#2563EB50",
          icon: "task-alt" as const,
        };
      case "canceled":
        return {
          label: "Cancelado",
          color: "#EF4444",
          bg: "#FECACA25",
          border: "#DC262650",
          icon: "cancel" as const,
        };
      default:
        return {
          label: status,
          color: colors.muted,
          bg: colors.surface,
          border: colors.border,
          icon: "info" as const,
        };
    }
  };

  const filteredAppointments = useMemo(() => {
    if (!appointments) return [];
    if (statusFilter === "all") return appointments;
    return appointments.filter((item: any) => item.appointment?.status === statusFilter);
  }, [appointments, statusFilter]);

  if (!user) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
          },
        ]}
      >
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace("/(tabs)/profile" as any);
              }
            }}
            style={styles.backBtn}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Meus Agendamentos
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.authEmpty}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <MaterialIcons name="event" size={48} color={colors.primary} />
          </View>
          <Text style={[styles.authTitle, { color: colors.text }]}>
            Acesse seus Agendamentos
          </Text>
          <Text style={[styles.authSubtitle, { color: colors.muted }]}>
            Faça login na sua conta para visualizar, acompanhar e gerenciar seus horários marcados com os profissionais.
          </Text>

          <Pressable
            onPress={() => router.push("/auth/login" as any)}
            style={[styles.loginBtn, { backgroundColor: colors.primary }]}
          >
            <MaterialIcons name="login" size={20} color="#FFFFFF" />
            <Text style={styles.loginBtnText}>Fazer Login</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      {/* HEADER */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/(tabs)/profile" as any);
            }
          }}
          style={styles.backBtn}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Meus Agendamentos
        </Text>
        <Pressable onPress={() => refetch()} style={styles.backBtn}>
          <MaterialIcons name="refresh" size={22} color={colors.text} />
        </Pressable>
      </View>

      {/* FILTER CHIPS */}
      <View style={[styles.filterBar, { borderBottomColor: colors.border }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          {[
            { id: "all", label: "Todos" },
            { id: "pending", label: "Pendentes" },
            { id: "confirmed", label: "Confirmados" },
            { id: "completed", label: "Concluídos" },
            { id: "canceled", label: "Cancelados" },
          ].map((tab) => {
            const isSelected = statusFilter === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => setStatusFilter(tab.id as StatusFilter)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    {
                      color: isSelected ? "#FFFFFF" : colors.text,
                      fontWeight: isSelected ? "700" : "500",
                    },
                  ]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* LIST OR EMPTY */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.muted }]}>
            Carregando seus agendamentos...
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          {filteredAppointments.length === 0 ? (
            <View style={styles.emptyState}>
              <View
                style={[
                  styles.emptyIconCircle,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <MaterialIcons name="event-busy" size={44} color={colors.muted} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {statusFilter === "all"
                  ? "Nenhum agendamento encontrado"
                  : `Nenhum agendamento com status "${statusFilter}"`}
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
                Você ainda não possui horários marcados com profissionais nesta categoria.
              </Text>
              <Pressable
                onPress={() => router.push("/(tabs)/search" as any)}
                style={[styles.findProBtn, { backgroundColor: colors.primary }]}
              >
                <MaterialIcons name="search" size={18} color="#FFFFFF" />
                <Text style={styles.findProBtnText}>Buscar Profissionais</Text>
              </Pressable>
            </View>
          ) : (
            filteredAppointments.map((item: any) => {
              const appt = item.appointment;
              const prov = item.provider;

              const [y, m, d] = (appt.date || "").split("-");
              const formattedDate = d && m && y ? `${d}/${m}/${y}` : appt.date;

              const badge = getStatusBadge(appt.status);
              const canCancel =
                appt.status === "pending" || appt.status === "confirmed";

              return (
                <View
                  key={appt.id}
                  style={[
                    styles.card,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  {/* CARD TOP: PROVIDER INFO & STATUS BADGE */}
                  <View style={styles.cardHeader}>
                    <Pressable
                      onPress={() => {
                        if (prov?.id) {
                          router.push(`/professional/${prov.id}` as any);
                        }
                      }}
                      style={styles.providerInfo}
                    >
                      {prov?.avatarUri ? (
                        <Image
                          source={{ uri: prov.avatarUri }}
                          style={styles.avatar}
                        />
                      ) : (
                        <View
                          style={[
                            styles.avatarPlaceholder,
                            { backgroundColor: colors.primary + "20" },
                          ]}
                        >
                          <MaterialIcons
                            name="person"
                            size={22}
                            color={colors.primary}
                          />
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[styles.provName, { color: colors.text }]}
                          numberOfLines={1}
                        >
                          {prov?.name || "Prestador de Serviços"}
                        </Text>
                        <Text
                          style={[styles.provCategory, { color: colors.muted }]}
                          numberOfLines={1}
                        >
                          {prov?.category || "Serviço Profissional"}
                        </Text>
                      </View>
                    </Pressable>

                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor: badge.bg,
                          borderColor: badge.border,
                        },
                      ]}
                    >
                      <MaterialIcons
                        name={badge.icon}
                        size={13}
                        color={badge.color}
                      />
                      <Text style={[styles.statusText, { color: badge.color }]}>
                        {badge.label}
                      </Text>
                    </View>
                  </View>

                  {/* CARD BODY: APPOINTMENT DETAILS */}
                  <View style={styles.cardBody}>
                    <View
                      style={[
                        styles.detailsBox,
                        {
                          backgroundColor: colors.background,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <View style={styles.detailRow}>
                        <MaterialIcons
                          name="assignment"
                          size={16}
                          color={colors.primary}
                        />
                        <Text
                          style={[styles.detailLabel, { color: colors.muted }]}
                        >
                          Serviço:
                        </Text>
                        <Text
                          style={[styles.detailValue, { color: colors.text }]}
                          numberOfLines={1}
                        >
                          {appt.serviceName || "Atendimento / Consulta"}
                        </Text>
                      </View>

                      <View style={styles.detailRow}>
                        <MaterialIcons
                          name="event"
                          size={16}
                          color={colors.primary}
                        />
                        <Text
                          style={[styles.detailLabel, { color: colors.muted }]}
                        >
                          Data:
                        </Text>
                        <Text
                          style={[styles.detailValue, { color: colors.text }]}
                        >
                          {formattedDate}
                        </Text>
                      </View>

                      <View style={styles.detailRow}>
                        <MaterialIcons
                          name="schedule"
                          size={16}
                          color={colors.primary}
                        />
                        <Text
                          style={[styles.detailLabel, { color: colors.muted }]}
                        >
                          Horário:
                        </Text>
                        <Text
                          style={[styles.detailValue, { color: colors.text }]}
                        >
                          {appt.startTime} às {appt.endTime}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* CARD ACTIONS: WHATSAPP / CANCEL / PROFILE */}
                  <View
                    style={[
                      styles.cardActions,
                      { borderTopColor: colors.border },
                    ]}
                  >
                    <Pressable
                      onPress={() => handleOpenWhatsApp(prov, appt)}
                      style={[
                        styles.whatsappBtn,
                        { backgroundColor: "#25D366" },
                      ]}
                    >
                      <MaterialIcons name="chat" size={16} color="#FFFFFF" />
                      <Text style={styles.whatsappBtnText}>WhatsApp</Text>
                    </Pressable>

                    {prov?.id && (
                      <Pressable
                        onPress={() =>
                          router.push(`/professional/${prov.id}` as any)
                        }
                        style={[
                          styles.profileBtn,
                          {
                            backgroundColor: colors.background,
                            borderColor: colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={[styles.profileBtnText, { color: colors.text }]}
                        >
                          Ver Perfil
                        </Text>
                      </Pressable>
                    )}

                    {canCancel && (
                      <Pressable
                        onPress={() => handleCancel(appt.id, appt.serviceName)}
                        style={styles.cancelBtn}
                        disabled={updateStatus.isPending}
                      >
                        <Text style={styles.cancelBtnText}>Cancelar</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  filterBar: {
    borderBottomWidth: 1,
  },
  filterContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 13,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  content: {
    padding: 16,
    gap: 14,
  },
  authEmpty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  authTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 8,
    textAlign: "center",
  },
  authSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 24,
  },
  loginBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
  },
  loginBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 6,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
    marginBottom: 20,
  },
  findProBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  findProBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  providerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  avatarPlaceholder: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  provName: {
    fontSize: 15,
    fontWeight: "700",
  },
  provCategory: {
    fontSize: 12,
    marginTop: 1,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  cardBody: {
    marginBottom: 12,
  },
  detailsBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  whatsappBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  whatsappBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  profileBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  profileBtnText: {
    fontSize: 12,
    fontWeight: "600",
  },
  cancelBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  cancelBtnText: {
    color: "#EF4444",
    fontSize: 12,
    fontWeight: "600",
  },
});
