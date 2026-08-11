import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert, Linking } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/lib/auth-context";

export default function AppointmentsScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const { data: appointments, isLoading, refetch } = trpc.appointments.getByUser.useQuery(undefined, {
    enabled: !!user,
  });
  
  const updateStatus = trpc.appointments.updateStatus.useMutation({
    onSuccess: () => refetch()
  });

  if (!user) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Você precisa fazer login para ver seus agendamentos.</Text>
      </View>
    );
  }

  const handleCancel = (id: string) => {
    Alert.alert("Cancelar Agendamento", "Tem certeza que deseja cancelar este agendamento?", [
      { text: "Não", style: "cancel" },
      { 
        text: "Sim, Cancelar", 
        style: "destructive", 
        onPress: () => updateStatus.mutate({ id, status: "canceled" })
      }
    ]);
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Meus Agendamentos</Text>
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
              <MaterialIcons name="event-busy" size={48} color={colors.muted} />
              <Text style={[styles.emptyText, { color: colors.text }]}>Nenhum agendamento encontrado.</Text>
            </View>
          ) : (
            appointments.map((item: any) => {
              const appt = item.appointment;
              const prov = item.provider;
              const [y, m, d] = appt.date.split("-");
              const formattedDate = `${d}/${m}/${y}`;
              
              const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const isPast = dateObj < today;
              
              return (
                <View key={appt.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.cardHeader}>
                    <Text style={[styles.provName, { color: colors.text }]} numberOfLines={1}>{prov?.name || "Prestador"}</Text>
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
                  
                  {(appt.status === "pending" || appt.status === "confirmed") && !isPast && (
                    <View style={styles.actions}>
                      <Pressable 
                        style={[styles.cancelBtn, { borderColor: "#EF4444" }]} 
                        onPress={() => handleCancel(appt.id)}
                      >
                        <Text style={{ color: "#EF4444", fontSize: 13, fontWeight: "600" }}>Cancelar</Text>
                      </Pressable>
                      <Pressable 
                        style={[styles.msgBtn, { backgroundColor: colors.primary }]} 
                        onPress={() => router.push(`/professional/${prov?.id}` as any)}
                      >
                        <Text style={{ color: "#FFF", fontSize: 13, fontWeight: "600" }}>Ver Perfil</Text>
                      </Pressable>
                    </View>
                  )}
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
  provName: {
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
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#00000015",
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  msgBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
});
