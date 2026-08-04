import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert, Linking } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/lib/auth-context";

export default function ProviderAgendaScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const { data: appointments, isLoading, refetch } = trpc.appointments.getByProvider.useQuery(
    {}, 
    { enabled: !!user }
  );
  
  const updateStatus = trpc.appointments.updateStatus.useMutation({
    onSuccess: () => refetch(),
    onError: (err) => Alert.alert("Erro", "Não foi possível atualizar o agendamento.")
  });

  if (!user) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Você precisa fazer login.</Text>
      </View>
    );
  }

  const handleStatusChange = (id: string, newStatus: "confirmed" | "completed" | "canceled") => {
    let actionText = "";
    if (newStatus === "confirmed") actionText = "aprovar";
    if (newStatus === "completed") actionText = "concluir";
    if (newStatus === "canceled") actionText = "cancelar";

    Alert.alert(`Confirmar Ação`, `Deseja realmente ${actionText} este agendamento?`, [
      { text: "Não", style: "cancel" },
      { 
        text: "Sim", 
        onPress: () => updateStatus.mutate({ id, status: newStatus }),
        style: newStatus === "canceled" ? "destructive" : "default"
      }
    ]);
  };

  const openWhatsApp = (phone: string, name: string) => {
    if (!phone) return;
    const cleaned = phone.replace(/\D/g, "");
    const num = cleaned.startsWith("55") ? cleaned : `55${cleaned}`;
    Linking.openURL(`https://wa.me/${num}?text=Olá ${name}, sobre o seu agendamento...`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "#EAB308";
      case "confirmed": return "#10B981";
      case "completed": return "#3B82F6";
      case "canceled": return "#EF4444";
      default: return colors.muted;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending": return "Pendente";
      case "confirmed": return "Confirmado";
      case "completed": return "Concluído";
      case "canceled": return "Cancelado";
      default: return status;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Gestão de Agenda</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {(!appointments || appointments.length === 0) ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="event-available" size={48} color={colors.muted} />
              <Text style={[styles.emptyText, { color: colors.text }]}>Nenhum agendamento encontrado.</Text>
            </View>
          ) : (
            appointments.map((appt: any) => {
              const dateObj = new Date(appt.date);
              const formattedDate = `${String(dateObj.getDate()).padStart(2, "0")}/${String(dateObj.getMonth() + 1).padStart(2, "0")}/${dateObj.getFullYear()}`;
              
              return (
                <View key={appt.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.cardHeader}>
                    <Text style={[styles.clientName, { color: colors.text }]} numberOfLines={1}>{appt.clientName || "Cliente"}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appt.status) + "20" }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(appt.status) }]}>{getStatusText(appt.status)}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.cardBody}>
                    <View style={styles.infoRow}>
                      <MaterialIcons name="event" size={16} color={colors.muted} />
                      <Text style={[styles.infoText, { color: colors.text }]}>{formattedDate}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <MaterialIcons name="schedule" size={16} color={colors.muted} />
                      <Text style={[styles.infoText, { color: colors.text }]}>{appt.startTime} às {appt.endTime}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <MaterialIcons name="assignment" size={16} color={colors.muted} />
                      <Text style={[styles.infoText, { color: colors.text }]} numberOfLines={1}>{appt.serviceName}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.actions}>
                    {appt.clientPhone ? (
                      <Pressable 
                        style={styles.iconBtn} 
                        onPress={() => openWhatsApp(appt.clientPhone, appt.clientName)}
                      >
                        <MaterialIcons name="chat" size={20} color="#25D366" />
                      </Pressable>
                    ) : (
                      <View style={{ flex: 1 }} />
                    )}

                    <View style={{ flexDirection: "row", gap: 8, flex: 1, justifyContent: "flex-end" }}>
                      {appt.status === "pending" && (
                        <>
                          <Pressable 
                            style={[styles.actionBtn, { borderColor: "#EF4444" }]} 
                            onPress={() => handleStatusChange(appt.id, "canceled")}
                          >
                            <Text style={{ color: "#EF4444", fontSize: 13, fontWeight: "600" }}>Recusar</Text>
                          </Pressable>
                          <Pressable 
                            style={[styles.actionBtn, { backgroundColor: "#10B981", borderColor: "#10B981" }]} 
                            onPress={() => handleStatusChange(appt.id, "confirmed")}
                          >
                            <Text style={{ color: "#FFF", fontSize: 13, fontWeight: "600" }}>Aprovar</Text>
                          </Pressable>
                        </>
                      )}

                      {appt.status === "confirmed" && (
                        <>
                          <Pressable 
                            style={[styles.actionBtn, { borderColor: "#EF4444" }]} 
                            onPress={() => handleStatusChange(appt.id, "canceled")}
                          >
                            <Text style={{ color: "#EF4444", fontSize: 13, fontWeight: "600" }}>Cancelar</Text>
                          </Pressable>
                          <Pressable 
                            style={[styles.actionBtn, { backgroundColor: "#3B82F6", borderColor: "#3B82F6" }]} 
                            onPress={() => handleStatusChange(appt.id, "completed")}
                          >
                            <Text style={{ color: "#FFF", fontSize: 13, fontWeight: "600" }}>Concluir</Text>
                          </Pressable>
                        </>
                      )}
                    </View>
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
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "bold" },
  content: { padding: 16 },
  emptyState: { alignItems: "center", justifyContent: "center", paddingTop: 60 },
  emptyText: { marginTop: 16, fontSize: 16 },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  clientName: {
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  cardBody: {
    gap: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoText: {
    fontSize: 14,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#00000015",
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#25D36615",
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
});
