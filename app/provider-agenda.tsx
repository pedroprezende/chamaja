import React, { useState, useMemo } from "react";
import { 
  View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, 
  Alert, Linking, Dimensions, Modal, TextInput 
} from "react-native";
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

  // Synchronization with Calendar day click
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<Date | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<"todos" | "hoje" | "amanha" | "semana" | "mes">("todos");
  const [selectedStatus, setSelectedStatus] = useState<string>("todos");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Modals
  const [selectedAppt, setSelectedAppt] = useState<any>(null);
  const [notesText, setNotesText] = useState("");
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockData, setBlockData] = useState({ date: formatYMD(new Date()), startTime: "12:00", endTime: "13:00", reason: "" });

  const { dateStart, dateEnd } = useMemo(() => {
    const start = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 3, 0);
    return { dateStart: formatYMD(start), dateEnd: formatYMD(end) };
  }, [currentDate]);

  const { data: appointments = [], isLoading, refetch } = trpc.appointments.getByProvider.useQuery(
    { dateStart, dateEnd }, 
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

  // Metrics counters calculation
  const metrics = useMemo(() => {
    const todayStr = formatYMD(new Date());
    let hoje = 0;
    let pendentes = 0;
    let confirmados = 0;

    (appointments || []).forEach((a: any) => {
      const apptDateStr = formatYMD(new Date(a.date));
      if (apptDateStr === todayStr && a.status !== "canceled") hoje++;
      if (a.status === "pending") pendentes++;
      if (a.status === "confirmed") confirmados++;
    });

    return { hoje, pendentes, confirmados };
  }, [appointments]);

  // Filtered & Sorted list of appointments for "Próximos Agendamentos"
  const filteredAppointments = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return (appointments || [])
      .filter((appt: any) => {
        const apptDate = new Date(appt.date);
        apptDate.setHours(0, 0, 0, 0);

        // 1. Day selection from calendar
        if (selectedCalendarDay) {
          if (formatYMD(apptDate) !== formatYMD(selectedCalendarDay)) return false;
        } else {
          // 2. Period filter
          if (selectedPeriod === "hoje") {
            if (formatYMD(apptDate) !== formatYMD(today)) return false;
          } else if (selectedPeriod === "amanha") {
            if (formatYMD(apptDate) !== formatYMD(tomorrow)) return false;
          } else if (selectedPeriod === "semana") {
            if (apptDate < startOfWeek || apptDate > endOfWeek) return false;
          } else if (selectedPeriod === "mes") {
            if (
              apptDate.getMonth() !== currentDate.getMonth() ||
              apptDate.getFullYear() !== currentDate.getFullYear()
            ) {
              return false;
            }
          }
        }

        // 3. Status filter
        if (selectedStatus !== "todos" && appt.status !== selectedStatus) {
          return false;
        }

        // 4. Search term
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const nameMatch = (appt.clientName || "").toLowerCase().includes(term);
          const serviceMatch = (appt.serviceName || "").toLowerCase().includes(term);
          const phoneMatch = (appt.clientPhone || "").toLowerCase().includes(term);
          if (!nameMatch && !serviceMatch && !phoneMatch) return false;
        }

        return true;
      })
      .sort((a: any, b: any) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (dateA !== dateB) {
          return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
        }
        return sortOrder === "asc"
          ? a.startTime.localeCompare(b.startTime)
          : b.startTime.localeCompare(a.startTime);
      });
  }, [appointments, selectedCalendarDay, selectedPeriod, selectedStatus, searchTerm, sortOrder, currentDate]);

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
    if (!phone || phone === "-") {
      Alert.alert("Aviso", "Telefone não informado para este cliente.");
      return;
    }
    const cleaned = phone.replace(/\D/g, "");
    const num = cleaned.startsWith("55") ? cleaned : `55${cleaned}`;
    Linking.openURL(`https://wa.me/${num}?text=Olá ${name}, falo sobre seu agendamento no XamaJá...`);
  };

  const hours = Array.from({ length: 15 }).map((_, i) => `${String(i + 7).padStart(2, "0")}:00`);

  // --- RENDERS ---

  const renderMonthView = () => (
    <View style={[styles.calendarCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.calendarHeader}>
        {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
          <Text key={i} style={[styles.dayLabel, { color: colors.muted }]}>{d}</Text>
        ))}
      </View>
      <View style={styles.calendarGrid}>
        {calendarDays.map((d, i) => {
          const isCurrentMonth = d.getMonth() === currentDate.getMonth();
          const isToday = formatYMD(d) === formatYMD(new Date());
          const isSelected = selectedCalendarDay && formatYMD(d) === formatYMD(selectedCalendarDay);
          const dayAppts = getAppointmentsForDay(d);
          
          return (
            <Pressable
              key={i}
              onPress={() => {
                if (isSelected) {
                  setSelectedCalendarDay(null);
                } else {
                  setSelectedCalendarDay(d);
                }
              }}
              style={[
                styles.dayCell, 
                !isCurrentMonth && { opacity: 0.25 },
                isToday && { borderColor: colors.primary, borderWidth: 1.5 },
                isSelected && { backgroundColor: colors.primary, borderRadius: 12 }
              ]}
            >
              <Text style={[
                styles.dayText, 
                { color: isSelected ? "#000" : isToday ? colors.primary : colors.text },
                isSelected && { fontWeight: "900" }
              ]}>
                {d.getDate()}
              </Text>
              <View style={styles.dotsRow}>
                {dayAppts.slice(0, 3).map((a: any, idx: number) => (
                  <View key={idx} style={[styles.dot, { backgroundColor: isSelected ? "#000" : statusColors[a.status] }]} />
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
            <Text style={[styles.timelineHour, { color: colors.muted }]}>{h}</Text>
            <View style={[styles.timelineLine, { borderTopColor: colors.border }]} />
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
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
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
              <MaterialIcons name="block" size={22} color={colors.primary} />
            </Pressable>
          </View>
        </View>

        {showSearch && (
          <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <MaterialIcons name="search" size={20} color={colors.muted} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Buscar cliente, serviço..."
              placeholderTextColor={colors.muted}
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
            {searchTerm ? (
              <Pressable onPress={() => setSearchTerm("")}>
                <MaterialIcons name="close" size={18} color={colors.muted} />
              </Pressable>
            ) : null}
          </View>
        )}

        {/* METRICS COUNTER BAR */}
        <View style={styles.metricsRow}>
          <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.metricNumber, { color: colors.primary }]}>{metrics.hoje}</Text>
            <Text style={[styles.metricLabel, { color: colors.muted }]}>Hoje</Text>
          </View>
          <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.metricNumber, { color: "#EAB308" }]}>{metrics.pendentes}</Text>
            <Text style={[styles.metricLabel, { color: colors.muted }]}>Pendentes</Text>
          </View>
          <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.metricNumber, { color: "#10B981" }]}>{metrics.confirmados}</Text>
            <Text style={[styles.metricLabel, { color: colors.muted }]}>Confirmados</Text>
          </View>
        </View>

        <View style={styles.viewToggles}>
          {(["day", "week", "month"] as const).map(mode => (
            <Pressable 
              key={mode} 
              onPress={() => setViewMode(mode)}
              style={[styles.toggleBtn, viewMode === mode && { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.toggleText, viewMode === mode && { color: "#000", fontWeight: "900" }]}>
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

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {isLoading && <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />}
        
        {!isLoading && viewMode === "month" && renderMonthView()}
        {!isLoading && viewMode !== "month" && renderDayView()}

        {/* PRÓXIMOS AGENDAMENTOS LIST SECTION */}
        <View style={styles.listSection}>
          <View style={styles.listSectionHeader}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View style={[styles.pulseDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.listSectionTitle, { color: colors.text }]}>Próximos Agendamentos</Text>
            </View>
            <Text style={[styles.listBadge, { color: colors.muted }]}>{filteredAppointments.length} item(s)</Text>
          </View>

          {/* PERIOD FILTERS ROW */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.periodPillScroll}>
            {[
              { key: "todos", label: "Todos" },
              { key: "hoje", label: "Hoje" },
              { key: "amanha", label: "Amanhã" },
              { key: "semana", label: "Esta Semana" },
              { key: "mes", label: "Este Mês" },
            ].map(p => (
              <Pressable
                key={p.key}
                onPress={() => {
                  setSelectedPeriod(p.key as any);
                  setSelectedCalendarDay(null);
                }}
                style={[
                  styles.periodPill,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  selectedPeriod === p.key && !selectedCalendarDay && { backgroundColor: colors.primary, borderColor: colors.primary }
                ]}
              >
                <Text style={[
                  styles.periodPillText,
                  { color: selectedPeriod === p.key && !selectedCalendarDay ? "#000" : colors.text }
                ]}>
                  {p.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* DAY FILTER BADGE INDICATOR */}
          {selectedCalendarDay && (
            <View style={[styles.dayFilterBanner, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "40" }]}>
              <Text style={[styles.dayFilterBannerText, { color: colors.primary }]}>
                Filtrando por: {selectedCalendarDay.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
              </Text>
              <Pressable onPress={() => setSelectedCalendarDay(null)} style={[styles.clearDayBtn, { backgroundColor: colors.primary }]}>
                <Text style={styles.clearDayBtnText}>Ver Todos</Text>
              </Pressable>
            </View>
          )}

          {/* STATUS FILTER PILLS & SORT */}
          <View style={styles.filterControlRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
              {["todos", "pending", "confirmed", "completed", "canceled"].map(s => (
                <Pressable
                  key={s}
                  onPress={() => setSelectedStatus(s)}
                  style={[
                    styles.statusPill,
                    selectedStatus === s && { backgroundColor: colors.surface, borderColor: colors.border }
                  ]}
                >
                  <Text style={[styles.statusPillText, { color: selectedStatus === s ? colors.text : colors.muted }]}>
                    {s === "todos" ? "Todos Status" : statusLabels[s]}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <Pressable 
              onPress={() => setSortOrder(p => p === "asc" ? "desc" : "asc")}
              style={[styles.sortBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <MaterialIcons name="sort" size={18} color={colors.text} />
            </Pressable>
          </View>

          {/* APPOINTMENTS CARDS */}
          {filteredAppointments.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <MaterialIcons name="event-busy" size={36} color={colors.muted} />
              <Text style={[styles.emptyCardTitle, { color: colors.text }]}>Nenhum agendamento encontrado</Text>
              <Text style={[styles.emptyCardDesc, { color: colors.muted }]}>
                {selectedCalendarDay ? "Não há agendamentos para este dia." : "Altere os filtros acima para ver mais."}
              </Text>
            </View>
          ) : (
            filteredAppointments.map((appt: any) => {
              const apptDate = new Date(appt.date);
              const isToday = formatYMD(apptDate) === formatYMD(new Date());
              const isTomorrow = formatYMD(apptDate) === formatYMD(new Date(Date.now() + 86400000));
              const dateStr = isToday ? "Hoje" : isTomorrow ? "Amanhã" : apptDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

              return (
                <Pressable
                  key={appt.id}
                  onPress={() => {
                    setCurrentDate(new Date(appt.date));
                    setSelectedAppt(appt);
                    setNotesText(appt.notes || "");
                  }}
                  style={[styles.appointmentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  {/* Top Row: Client & Status */}
                  <View style={styles.cardTopRow}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={[styles.cardClientName, { color: colors.text }]} numberOfLines={1}>{appt.clientName}</Text>
                      <Text style={[styles.cardServiceName, { color: colors.muted }]} numberOfLines={1}>{appt.serviceName}</Text>
                    </View>
                    <View style={[styles.statusBadgePill, { backgroundColor: statusColors[appt.status] + "20" }]}>
                      <Text style={{ color: statusColors[appt.status], fontSize: 11, fontWeight: "bold" }}>{statusLabels[appt.status]}</Text>
                    </View>
                  </View>

                  {/* Info Row: Date, Time & Phone */}
                  <View style={styles.cardInfoRow}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <MaterialIcons name="event" size={14} color={colors.primary} />
                      <Text style={[styles.cardInfoText, { color: isToday ? colors.primary : colors.text, fontWeight: "bold" }]}>{dateStr}</Text>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <MaterialIcons name="schedule" size={14} color={colors.muted} />
                      <Text style={[styles.cardInfoText, { color: colors.text }]}>{appt.startTime} - {appt.endTime}</Text>
                    </View>
                  </View>

                  {/* Actions: WhatsApp & Details */}
                  <View style={styles.cardActionsRow}>
                    {appt.clientPhone && appt.clientPhone !== "-" && (
                      <Pressable 
                        onPress={() => openWhatsApp(appt.clientPhone, appt.clientName)}
                        style={[styles.whatsappBtn, { backgroundColor: "#25D36620", borderColor: "#25D36640" }]}
                      >
                        <MaterialIcons name="chat" size={16} color="#25D366" />
                        <Text style={{ color: "#25D366", fontSize: 12, fontWeight: "bold", marginLeft: 4 }}>WhatsApp</Text>
                      </Pressable>
                    )}
                    <Pressable
                      onPress={() => {
                        setCurrentDate(new Date(appt.date));
                        setSelectedAppt(appt);
                        setNotesText(appt.notes || "");
                      }}
                      style={[styles.detailsBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
                    >
                      <MaterialIcons name="visibility" size={16} color={colors.text} />
                      <Text style={{ color: colors.text, fontSize: 12, fontWeight: "bold", marginLeft: 4 }}>Ver detalhes</Text>
                    </Pressable>
                  </View>
                </Pressable>
              );
            })
          )}
        </View>
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
                      {selectedAppt.clientPhone && selectedAppt.clientPhone !== "-" && (
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
  header: { padding: 16, borderBottomWidth: 1 },
  headerTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 20, fontWeight: "900" },
  iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  
  searchBar: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, marginTop: 12 },
  searchInput: { flex: 1, height: 40, marginLeft: 8 },

  metricsRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  metricCard: { flex: 1, padding: 10, borderRadius: 14, borderWidth: 1, alignItems: "center" },
  metricNumber: { fontSize: 18, fontWeight: "900" },
  metricLabel: { fontSize: 10, fontWeight: "bold", textTransform: "uppercase", marginTop: 2 },
  
  viewToggles: { flexDirection: "row", marginTop: 12, backgroundColor: "#ffffff10", borderRadius: 10, padding: 3 },
  toggleBtn: { flex: 1, alignItems: "center", paddingVertical: 6, borderRadius: 8 },
  toggleText: { fontSize: 13, fontWeight: "bold", color: "#888" },
  
  dateNav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12 },
  dateText: { fontSize: 15, fontWeight: "bold", textTransform: "capitalize" },
  navBtn: { padding: 4 },

  calendarCard: { margin: 16, padding: 12, borderRadius: 20, borderWidth: 1 },
  calendarHeader: { flexDirection: "row" },
  dayLabel: { width: DAY_SIZE - 4, textAlign: "center", fontSize: 11, fontWeight: "bold", marginBottom: 8 },
  calendarGrid: { flexDirection: "row", flexWrap: "wrap" },
  dayCell: { width: DAY_SIZE - 4, height: DAY_SIZE - 4, alignItems: "center", justifyContent: "center", borderRadius: 12, marginVertical: 2 },
  dayText: { fontSize: 13, fontWeight: "bold" },
  dotsRow: { flexDirection: "row", gap: 2, marginTop: 3 },
  dot: { width: 4, height: 4, borderRadius: 2 },

  timelineContainer: { paddingHorizontal: 16, paddingTop: 16 },
  timelineRow: { flexDirection: "row", height: 60 },
  timelineHour: { width: 40, fontSize: 12, fontWeight: "bold", marginTop: -8 },
  timelineLine: { flex: 1, borderTopWidth: 1 },
  timelineEvent: { position: "absolute", left: 60, right: 16, backgroundColor: "#27272a", borderRadius: 8, borderLeftWidth: 4, padding: 8, justifyContent: "center" },
  timelineEventInner: { flex: 1 },
  timelineEventTitle: { fontSize: 14, fontWeight: "bold", color: "#fff", marginBottom: 2 },
  timelineEventTime: { fontSize: 11, color: "#aaa", fontWeight: "600" },

  listSection: { marginHorizontal: 16, marginTop: 8, gap: 12 },
  listSectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  listSectionTitle: { fontSize: 16, fontWeight: "900" },
  pulseDot: { width: 8, height: 8, borderRadius: 4 },
  listBadge: { fontSize: 12, fontWeight: "bold" },

  periodPillScroll: { flexDirection: "row", marginVertical: 4 },
  periodPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, marginRight: 8 },
  periodPillText: { fontSize: 12, fontWeight: "bold" },

  dayFilterBanner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 10, borderRadius: 12, borderWidth: 1 },
  dayFilterBannerText: { fontSize: 12, fontWeight: "bold" },
  clearDayBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  clearDayBtnText: { fontSize: 10, fontWeight: "bold", color: "#000" },

  filterControlRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: "transparent", marginRight: 6 },
  statusPillText: { fontSize: 11, fontWeight: "bold" },
  sortBtn: { width: 32, height: 32, borderRadius: 8, borderWidth: 1, alignItems: "center", justifyContent: "center" },

  emptyCard: { padding: 32, borderRadius: 20, borderWidth: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  emptyCardTitle: { fontSize: 14, fontWeight: "bold" },
  emptyCardDesc: { fontSize: 12, textAlign: "center" },

  appointmentCard: { padding: 14, borderRadius: 18, borderWidth: 1, gap: 10 },
  cardTopRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  cardClientName: { fontSize: 15, fontWeight: "bold" },
  cardServiceName: { fontSize: 12, marginTop: 2 },
  statusBadgePill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },

  cardInfoRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 6, borderTopWidth: 1, borderTopColor: "#ffffff10" },
  cardInfoText: { fontSize: 12 },

  cardActionsRow: { flexDirection: "row", gap: 8, paddingTop: 4 },
  whatsappBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  detailsBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 8, borderRadius: 10, borderWidth: 1 },

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
