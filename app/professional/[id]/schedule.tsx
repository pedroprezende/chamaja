import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/lib/auth-context";
import { generateWhatsAppMessage } from "@/lib/whatsapp-helper";

const formatDate = (date: Date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const getDayName = (date: Date) => {
  const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  return days[date.getDay()];
};

export default function ScheduleScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end: string } | null>(null);

  const { data: provider, isLoading: isProviderLoading } = trpc.providers.getById.useQuery(id as string, {
    enabled: !!id,
  });

  const { data: slots, isLoading: isSlotsLoading, refetch } = trpc.appointments.getAvailableSlots.useQuery(
    {
      providerId: id as string,
      date: formatDate(selectedDate),
      serviceDuration: 30, // Default duration
    },
    { enabled: !!id && !!selectedDate && !!provider?.supportsScheduling }
  );

  const createAppointment = trpc.appointments.create.useMutation({
    onSuccess: () => {
      // Abre Whatsapp primeiro
      if (provider?.whatsapp || provider?.phone) {
        const num = provider.whatsapp || provider.phone;
        const cleaned = String(num).replace(/\D/g, "");
        const phoneNum = cleaned.startsWith("55") ? cleaned : `55${cleaned}`;
        
        const srv = services.find((s: any) => s.id === selectedServiceId);
        const srvName = srv?.name || "Atendimento";
        const msg = `Olá! Acabei de solicitar um agendamento pelo XamaJá.\n\nServiço:\n${srvName}\n\nData:\n${formatDate(selectedDate)}\n\nHorário:\n${selectedSlot?.start}\n\nAguardo sua confirmação. Obrigado!`;
        
        Linking.openURL(`https://wa.me/${phoneNum}?text=${encodeURIComponent(msg)}`);
      }
      
      // Exibe sucesso
      Alert.alert(
        "✅ Solicitação enviada",
        "Agora aguarde o prestador confirmar seu horário pelo WhatsApp.",
        [
          {
            text: "Entendido",
            onPress: () => router.back(),
          }
        ]
      );
    },
    onError: (err) => {
      Alert.alert("Erro", err.message === "SLOT_UNAVAILABLE" ? "Esse horário já foi reservado. Por favor, escolha outro." : "Não foi possível realizar o agendamento.");
      refetch();
    }
  });

  if (isProviderLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!provider) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Prestador não encontrado.</Text>
      </View>
    );
  }

  const services = Array.isArray(provider.services) ? provider.services : [];
  if (typeof provider.services === "string") {
    try {
      const parsed = JSON.parse(provider.services);
      if (Array.isArray(parsed)) services.push(...parsed);
    } catch (e) {}
  }

  const dates = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  const handleBook = () => {
    if (!user) {
      Alert.alert("Atenção", "Você precisa fazer login para agendar horários.", [
        { text: "Fazer Login", onPress: () => router.push("/(tabs)/profile" as any) },
        { text: "Cancelar", style: "cancel" },
      ]);
      return;
    }
    
    if (!selectedSlot) return;
    
    const srv = services.find((s: any) => s.id === selectedServiceId);
    
    createAppointment.mutate({
      providerId: id as string,
      clientName: user.name,
      clientPhone: "",
      serviceId: srv?.id,
      serviceName: srv?.name || "Atendimento",
      price: srv?.price,
      date: formatDate(selectedDate),
      startTime: selectedSlot.start,
      endTime: selectedSlot.end,
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Agendar Horário</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* Step 1: Services */}
        {services.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>1. Selecione o Serviço</Text>
            {services.map((srv: any) => (
              <Pressable
                key={srv.id}
                style={[
                  styles.serviceCard,
                  { backgroundColor: colors.surface, borderColor: selectedServiceId === srv.id ? colors.primary : colors.border }
                ]}
                onPress={() => setSelectedServiceId(srv.id)}
              >
                <View style={styles.serviceInfo}>
                  <Text style={[styles.serviceName, { color: colors.text }]}>{srv.name}</Text>
                  {srv.description ? <Text style={[styles.serviceDesc, { color: colors.muted }]} numberOfLines={2}>{srv.description}</Text> : null}
                </View>
                <View style={styles.serviceRight}>
                  {srv.price ? <Text style={[styles.servicePrice, { color: colors.primary }]}>R$ {Number(srv.price).toFixed(2).replace(".", ",")}</Text> : null}
                  <View style={[styles.radio, { borderColor: selectedServiceId === srv.id ? colors.primary : colors.muted }]}>
                    {selectedServiceId === srv.id && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* Step 2: Date */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{services.length > 0 ? "2." : "1."} Escolha a Data</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
            {dates.map((d, idx) => {
              const isSelected = formatDate(d) === formatDate(selectedDate);
              return (
                <Pressable
                  key={idx}
                  style={[
                    styles.dateCard,
                    { 
                      backgroundColor: isSelected ? colors.primary : colors.surface,
                      borderColor: isSelected ? colors.primary : colors.border
                    }
                  ]}
                  onPress={() => {
                    setSelectedDate(d);
                    setSelectedSlot(null);
                  }}
                >
                  <Text style={[styles.dateDayName, { color: isSelected ? "#FFF" : colors.muted }]}>{getDayName(d)}</Text>
                  <Text style={[styles.dateDayNum, { color: isSelected ? "#FFF" : colors.text }]}>{d.getDate()}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Step 3: Slots */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{services.length > 0 ? "3." : "2."} Escolha o Horário</Text>
          
          {isSlotsLoading ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 20 }} />
          ) : !slots || slots.length === 0 ? (
            <View style={[styles.noSlots, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <MaterialIcons name="event-busy" size={32} color={colors.muted} />
              <Text style={{ color: colors.text, marginTop: 8, fontWeight: "600" }}>Nenhum horário disponível</Text>
              <Text style={{ color: colors.muted, fontSize: 13, marginTop: 4, textAlign: "center" }}>Este profissional não possui horários livres para a data selecionada.</Text>
            </View>
          ) : (
            <View style={styles.slotsGrid}>
              {slots.map((slot: any, idx: number) => {
                const isSelected = selectedSlot?.start === slot.start;
                return (
                  <Pressable
                    key={idx}
                    style={[
                      styles.slotBtn,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.surface,
                        borderColor: isSelected ? colors.primary : colors.border,
                      }
                    ]}
                    onPress={() => setSelectedSlot(slot)}
                  >
                    <Text style={[styles.slotText, { color: isSelected ? "#FFF" : colors.text }]}>{slot.start}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Footer CTA */}
      <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <View style={styles.footerInfo}>
          <Text style={[styles.footerDate, { color: colors.text }]}>
            {selectedSlot ? `${formatDate(selectedDate).split("-").reverse().join("/")} às ${selectedSlot.start}` : "Selecione um horário"}
          </Text>
          {(services.length === 0 || selectedServiceId) && selectedSlot ? (
            <Text style={[styles.footerService, { color: colors.muted }]}>
              {services.length === 0 ? "Atendimento Padrão" : services.find((s:any) => s.id === selectedServiceId)?.name}
            </Text>
          ) : null}
        </View>
        <Pressable
          style={[
            styles.bookBtn,
            { backgroundColor: colors.primary, opacity: selectedSlot && (services.length === 0 || selectedServiceId) ? 1 : 0.5 }
          ]}
          disabled={!selectedSlot || (services.length > 0 && !selectedServiceId) || createAppointment.isPending}
          onPress={handleBook}
        >
          {createAppointment.isPending ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Text style={styles.bookBtnText}>Confirmar</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
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
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 16,
  },
  serviceCard: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    alignItems: "center",
    justifyContent: "space-between",
  },
  serviceInfo: {
    flex: 1,
    paddingRight: 12,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  serviceDesc: {
    fontSize: 13,
  },
  serviceRight: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  servicePrice: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dateScroll: {
    flexDirection: "row",
  },
  dateCard: {
    width: 64,
    height: 80,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  dateDayName: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  dateDayNum: {
    fontSize: 20,
    fontWeight: "bold",
  },
  noSlots: {
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  slotsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
  },
  slotBtn: {
    width: "23%",
    marginHorizontal: "1%",
    marginBottom: 8,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  slotText: {
    fontSize: 14,
    fontWeight: "600",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    borderTopWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  footerInfo: {
    flex: 1,
    paddingRight: 16,
  },
  footerDate: {
    fontSize: 15,
    fontWeight: "bold",
  },
  footerService: {
    fontSize: 13,
    marginTop: 2,
  },
  bookBtn: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  bookBtnText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 15,
  },
});
