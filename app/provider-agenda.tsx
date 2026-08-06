import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert, Linking, Dimensions, Modal, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/lib/auth-context";

const { width, height } = Dimensions.get("window");
const CALENDAR_WIDTH = width - 32;
const DAY_SIZE = CALENDAR_WIDTH / 7;

function formatYMD(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const statusColors: any = {
  pending: "#EAB308",
  confirmed: "#10B981",
  completed: "#3B82F6",
  canceled: "#EF4444",
  rescheduled: "#8B5CF6",
  blocked: "#52525B",
};

const statusLabels: any = {
  pending: "Pendente",
  confirmed: "Confirmado",
  completed: "Concluído",
  canceled: "Cancelado",
  rescheduled: "Reagendado",
  blocked: "Bloqueado",
};

export default function ProviderAgendaScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  // Modals
  const [selectedAppt, setSelectedAppt] = useState<any>(null);
  const [notesText, setNotesText] = useState("");
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockData, setBlockData] = useState({ date: formatYMD(new Date()), startTime: "12:00", endTime: "13:00", reason: "" });

  const { dateStart, dateEnd } = useMemo(() => {
    let start = new Date(currentDate);
    let end = new Date(currentDate);

    if (viewMode === "day") {
      start.setDate(start.getDate() - 1);
      end.setDate(end.getDate() + 1);
    } else if (viewMode === "week") {
      const day = start.getDay();
      start.setDate(start.getDate() - day);
      end.setDate(end.getDate() + (6 - day));
    } else {
      start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      start.setDate(start.getDate() - 7);
      end.setDate(end.getDate() + 7);
    }
    return { dateStart: formatYMD(start), dateEnd: formatYMD(end) };
  }, [currentDate, viewMode]);

  const { data: appointments, isLoading, refetch } = trpc.appointments.getByProvider.useQuery(
    { dateStart, dateEnd, search: searchTerm || undefined }, 
    { enabled: !!user }
  );
  
  const updateStatus = trpc.appointments.updateStatus.useMutation({
    onSuccess: () => { refetch(); setSelectedAppt(null); },
    onError: () => Alert.alert("Erro", "Não foi possível atualizar.")
  });
  const updateNotes = trpc.appointments.updateNotes.useMutation({
    onSuccess: () => Alert.alert("Sucesso", "Notas salvas com sucesso!"),
    onError: () => Alert.alert("Erro", "Não foi possível salvar notas.")
  });
  const blockSlot = trpc.appointments.blockSlot.useMutation({
    onSuccess: () => { refetch(); setShowBlockModal(false); Alert.alert("Sucesso", "Horário bloqueado!"); },
    onError: () => Alert.alert("Erro", "Falha ao bloquear horário.")
  });

  const calendarDays = useMemo(() => {
    const days = [];
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const startOffset = firstDayOfMonth.getDay();
    let d = new Date(firstDayOfMonth);
    d.setDate(d.getDate() - startOffset);
    for (let i = 0; i < 42; i++) {
      days.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }
    return days;
  }, [currentDate]);

  if (!user) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Faça login para continuar.</Text>
      </View>
    );
  }

  const getAppointmentsForDay = (d: Date) => {
    if (!appointments) return [];
    const ymd = formatYMD(d);
    return appointments.filter((a: any) => formatYMD(new Date(a.date)) === ymd);
  };

  const handlePrev = () => {
    const d = new Date(currentDate);
    if (viewMode === "day") d.setDate(d.getDate() - 1);
    if (viewMode === "week") d.setDate(d.getDate() - 7);
    if (viewMode === "month") d.setMonth(d.getMonth() - 1);
    setCurrentDate(d);
  };
  const handleNext = () => {
    const d = new Date(currentDate);
    if (viewMode === "day") d.setDate(d.getDate() + 1);
    if (viewMode === "week") d.setDate(d.getDate() + 7);
    if (viewMode === "month") d.setMonth(d.getMonth() + 1);
    setCurrentDate(d);
  };

  const openWhatsApp = (phone: string, name: string) => {
    if (!phone) return;
    const cleaned = phone.replace(/\D/g, "");
    const num = cleaned.startsWith("55") ? cleaned : `55${cleaned}`;
    Linking.openURL(`https://wa.me/${num}?text=Olá ${name}, sobre o seu agendamento...`);
  };

  const hours = Array.from({ length: 15 }).map((_, i) => `${String(i + 7).padStart(2, "0")}:00`);

  // --- RENDERS ---

  const renderMonthView = () => (
    <View style={styles.calendarCard}>
      <View style={styles.calendarHeader}>
        {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
          <Text key={i} style={styles.dayLabel}>{d}</Text>
        ))}
      </View>
      <View style={styles.calendarGrid}>
        {calendarDays.map((d, i) => {
          const isCurrentMonth = d.getMonth() === currentDate.getMonth();
          const isToday = formatYMD(d) === formatYMD(new Date());
          const dayAppts = getAppointmentsForDay(d);
          
          return (
            <Pressable
              key={i}
              onPress={() => { setCurrentDate(d); setViewMode("day"); }}
              style={[
                styles.dayCell, 
                !isCurrentMonth && { opacity: 0.3 },
                isToday && { borderColor: colors.primary, borderWidth: 1 }
              ]}
            >
              <Text style={[styles.dayText, isToday && { color: colors.primary }]}>{d.getDate()}</Text>
              <View style={styles.dotsRow}>
                {dayAppts.slice(0, 3).map((a: any, idx: number) => (
                  <View key={idx} style={[styles.dot, { backgroundColor: statusColors[a.status] }]} />
                ))}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  const renderDayView = () => {
    const dayAppts = getAppointmentsForDay(currentDate);
    return (
      <View style={styles.timelineContainer}>
        {hours.map(h => (
          <View key={h} style={styles.timelineRow}>
            <Text style={styles.timelineHour}>{h}</Text>
            <View style={styles.timelineLine} />
          </View>
        ))}
        {dayAppts.map(appt => {
          const [h, m] = appt.startTime.split(":").map(Number);
          const top = (h - 7) * 60 + (m / 60) * 60; // 60px per hour
          
          return (
            <Pressable
              key={appt.id}
              onPress={() => { setSelectedAppt(appt); setNotesText(appt.notes || ""); }}
              style={[
                styles.timelineEvent, 
                { top: top + 10, borderLeftColor: statusColors[appt.status], opacity: appt.status === "blocked" ? 0.7 : 1 }
              ]}
            >
              <View style={styles.timelineEventInner}>
                <Text style={styles.timelineEventTitle} numberOfLines={1}>{appt.clientName}</Text>
                <Text style={styles.timelineEventTime}>{appt.startTime} - {appt.endTime}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Pressable onPress={() => router.back()} style={styles.iconBtn}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.title, { color: colors.text }]}>Minha Agenda</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Pressable onPress={() => setShowSearch(!showSearch)} style={styles.iconBtn}>
              <MaterialIcons name="search" size={24} color={colors.text} />
            </Pressable>
            <Pressable onPress={() => setShowBlockModal(true)} style={styles.iconBtn}>
              <MaterialIcons name="block" size={22} color={colors.text} />
            </Pressable>
          </View>
        </View>

        {showSearch && (
          <View style={styles.searchBar}>
            <MaterialIcons name="search" size={20} color={colors.muted} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Buscar cliente, serviço..."
              placeholderTextColor={colors.muted}
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
          </View>
        )}

        <View style={styles.viewToggles}>
          {(["day", "week", "month"] as const).map(mode => (
            <Pressable 
              key={mode} 
              onPress={() => setViewMode(mode)}
              style={[styles.toggleBtn, viewMode === mode && { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.toggleText, viewMode === mode && { color: "#000" }]}>
                {mode === "day" ? "Dia" : mode === "week" ? "Sem" : "Mês"}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.dateNav}>
          <Pressable onPress={handlePrev} style={styles.navBtn}>
            <MaterialIcons name="chevron-left" size={28} color={colors.text} />
          </Pressable>
          <Text style={[styles.dateText, { color: colors.text }]}>
            {viewMode === "month" 
              ? currentDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }) 
              : currentDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })}
          </Text>
          <Pressable onPress={handleNext} style={styles.navBtn}>
            <MaterialIcons name="chevron-right" size={28} color={colors.text} />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        {isLoading && <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />}
        
        {!isLoading && viewMode === "month" && renderMonthView()}
        {!isLoading && viewMode !== "month" && renderDayView()}
      </ScrollView>

      {/* MODAL: DETALHES DO AGENDAMENTO */}
      <Modal visible={!!selectedAppt} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            {selectedAppt && (
              <>
                <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.sheetTitle, { color: colors.text }]} numberOfLines={1}>{selectedAppt.clientName}</Text>
                  <Pressable onPress={() => setSelectedAppt(null)} style={styles.iconBtn}>
                    <MaterialIcons name="close" size={24} color={colors.text} />
                  </Pressable>
                </View>
                
                <ScrollView contentContainerStyle={styles.sheetContent}>
                  <View style={[styles.statusBadge, { backgroundColor: statusColors[selectedAppt.status] + "20" }]}>
                    <Text style={{ color: statusColors[selectedAppt.status], fontWeight: "bold" }}>{statusLabels[selectedAppt.status]}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <MaterialIcons name="event" size={20} color={colors.muted} />
                    <Text style={[styles.detailText, { color: colors.text }]}>
                      {new Date(selectedAppt.date).toLocaleDateString("pt-BR")} às {selectedAppt.startTime}
                    </Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <MaterialIcons name="assignment" size={20} color={colors.muted} />
                    <Text style={[styles.detailText, { color: colors.text }]}>{selectedAppt.serviceName}</Text>
                  </View>

                  {selectedAppt.clientPhone && (
                    <View style={styles.detailRow}>
                      <MaterialIcons name="phone" size={20} color={colors.muted} />
                      <Text style={[styles.detailText, { color: colors.text }]}>{selectedAppt.clientPhone}</Text>
                    </View>
                  )}

                  {/* Notas Internas */}
                  <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>Observações Internas</Text>
                  <TextInput
                    style={[styles.textArea, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                    multiline
                    value={notesText}
                    onChangeText={setNotesText}
                    placeholder="Ex: Cliente pediu para chegar 10 minutos antes..."
                    placeholderTextColor={colors.muted}
                  />
                  {selectedAppt.notes !== notesText && (
                    <Pressable style={styles.saveNotesBtn} onPress={() => updateNotes.mutate({ id: selectedAppt.id, notes: notesText })}>
                      <Text style={{ color: colors.primary, fontWeight: "bold" }}>Salvar Notas</Text>
                    </Pressable>
                  )}

                  {/* Ações */}
                  {selectedAppt.status !== "blocked" && (
                    <View style={styles.actionsBox}>
                      {selectedAppt.status === "pending" && (
                        <Pressable style={[styles.actionBtn, { backgroundColor: "#10B981" }]} onPress={() => updateStatus.mutate({ id: selectedAppt.id, status: "confirmed" })}>
                          <Text style={styles.actionBtnText}>Aprovar Horário</Text>
                        </Pressable>
                      )}
                      {(selectedAppt.status === "pending" || selectedAppt.status === "confirmed") && (
                        <Pressable style={[styles.actionBtn, { backgroundColor: "transparent", borderColor: "#EF4444", borderWidth: 1 }]} onPress={() => updateStatus.mutate({ id: selectedAppt.id, status: "canceled" })}>
                          <Text style={[styles.actionBtnText, { color: "#EF4444" }]}>Cancelar Agendamento</Text>
                        </Pressable>
                      )}
                      {selectedAppt.status === "confirmed" && (
                        <Pressable style={[styles.actionBtn, { backgroundColor: "#3B82F6" }]} onPress={() => updateStatus.mutate({ id: selectedAppt.id, status: "completed" })}>
                          <Text style={styles.actionBtnText}>Marcar como Concluído</Text>
                        </Pressable>
                      )}
                      {selectedAppt.clientPhone && (
                        <Pressable style={[styles.actionBtn, { backgroundColor: "#25D366" }]} onPress={() => openWhatsApp(selectedAppt.clientPhone, selectedAppt.clientName)}>
                          <Text style={styles.actionBtnText}>Chamar no WhatsApp</Text>
                        </Pressable>
                      )}
                    </View>
                  )}

                  {selectedAppt.status === "blocked" && (
                    <Pressable style={[styles.actionBtn, { backgroundColor: "transparent", borderColor: "#EF4444", borderWidth: 1 }]} onPress={() => updateStatus.mutate({ id: selectedAppt.id, status: "canceled" })}>
                      <Text style={[styles.actionBtnText, { color: "#EF4444" }]}>Remover Bloqueio</Text>
                    </Pressable>
                  )}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* MODAL: BLOQUEIO MANUAL */}
      <Modal visible={showBlockModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>Bloquear Horário</Text>
              <Pressable onPress={() => setShowBlockModal(false)} style={styles.iconBtn}>
                <MaterialIcons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.sheetContent}>
              <Text style={[styles.label, { color: colors.text }]}>Data (YYYY-MM-DD)</Text>
              <TextInput style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]} value={blockData.date} onChangeText={t => setBlockData(p => ({...p, date: t}))} />
              
              <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: colors.text }]}>Início (HH:MM)</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]} value={blockData.startTime} onChangeText={t => setBlockData(p => ({...p, startTime: t}))} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: colors.text }]}>Fim (HH:MM)</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]} value={blockData.endTime} onChangeText={t => setBlockData(p => ({...p, endTime: t}))} />
                </View>
              </View>

              <Text style={[styles.label, { color: colors.text }]}>Motivo (Opcional)</Text>
              <TextInput style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]} value={blockData.reason} onChangeText={t => setBlockData(p => ({...p, reason: t}))} placeholder="Consulta, viagem..." placeholderTextColor={colors.muted} />

              <Pressable style={[styles.actionBtn, { backgroundColor: colors.primary, marginTop: 24 }]} onPress={() => blockSlot.mutate({ providerId: user.id, ...blockData })}>
                <Text style={[styles.actionBtnText, { color: "#000" }]}>Confirmar Bloqueio</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { padding: 16, borderBottomWidth: 1, backgroundColor: "#00000020" },
  headerTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 20, fontWeight: "900" },
  iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  
  searchBar: { flexDirection: "row", alignItems: "center", backgroundColor: "#ffffff10", borderRadius: 12, paddingHorizontal: 12, marginTop: 12 },
  searchInput: { flex: 1, height: 40, marginLeft: 8 },
  
  viewToggles: { flexDirection: "row", marginTop: 16, backgroundColor: "#ffffff10", borderRadius: 8, padding: 2 },
  toggleBtn: { flex: 1, alignItems: "center", paddingVertical: 6, borderRadius: 6 },
  toggleText: { fontSize: 13, fontWeight: "bold", color: "#888" },
  
  dateNav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 16 },
  dateText: { fontSize: 16, fontWeight: "bold", textTransform: "capitalize" },
  navBtn: { padding: 4 },

  calendarCard: { margin: 16, padding: 8, borderRadius: 16, backgroundColor: "#18181b" },
  calendarHeader: { flexDirection: "row" },
  dayLabel: { width: DAY_SIZE - 2, textAlign: "center", fontSize: 12, fontWeight: "bold", color: "#888", marginBottom: 8 },
  calendarGrid: { flexDirection: "row", flexWrap: "wrap" },
  dayCell: { width: DAY_SIZE - 2, height: DAY_SIZE, alignItems: "center", justifyContent: "center", borderRadius: 12 },
  dayText: { fontSize: 14, fontWeight: "bold", color: "#fff" },
  dotsRow: { flexDirection: "row", gap: 2, marginTop: 4 },
  dot: { width: 4, height: 4, borderRadius: 2 },

  timelineContainer: { paddingHorizontal: 16, paddingTop: 16 },
  timelineRow: { flexDirection: "row", height: 60 },
  timelineHour: { width: 40, fontSize: 12, color: "#888", fontWeight: "bold", marginTop: -8 },
  timelineLine: { flex: 1, borderTopWidth: 1, borderTopColor: "#ffffff15" },
  timelineEvent: { position: "absolute", left: 60, right: 16, backgroundColor: "#27272a", borderRadius: 8, borderLeftWidth: 4, padding: 8, justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3 },
  timelineEventInner: { flex: 1 },
  timelineEventTitle: { fontSize: 14, fontWeight: "bold", color: "#fff", marginBottom: 2 },
  timelineEventTime: { fontSize: 11, color: "#aaa", fontWeight: "600" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: height * 0.9 },
  sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 1 },
  sheetTitle: { fontSize: 20, fontWeight: "900", flex: 1, marginRight: 16 },
  sheetContent: { padding: 20, paddingBottom: 40 },
  statusBadge: { alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginBottom: 16 },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  detailText: { fontSize: 15, fontWeight: "500" },
  label: { fontSize: 13, fontWeight: "bold", marginBottom: 8, color: "#888" },
  input: { height: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, marginBottom: 16 },
  textArea: { height: 100, borderRadius: 12, borderWidth: 1, padding: 16, textAlignVertical: "top" },
  saveNotesBtn: { alignSelf: "flex-end", marginTop: 8, paddingVertical: 4, paddingHorizontal: 8 },
  actionsBox: { gap: 12, marginTop: 24 },
  actionBtn: { height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  actionBtnText: { color: "#FFF", fontSize: 15, fontWeight: "bold" },
});
