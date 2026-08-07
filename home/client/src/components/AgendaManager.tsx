import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ChevronLeft, ChevronRight, Check, X, Calendar as CalendarIcon, 
  Clock, MessageCircle, Search, Filter, Plus, CalendarDays, ArrowUpDown,
  Phone, User, CheckCircle2, AlertCircle, Clock4, CalendarCheck, CalendarRange, Eye
} from "lucide-react";
import { toast } from "sonner";
import { AgendaSettingsForm } from "./AgendaSettingsForm";
import { getSessionToken } from "@/lib/supabase";

function formatYMD(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const statusColors: any = {
  pending: "bg-amber-500",
  confirmed: "bg-emerald-500",
  completed: "bg-blue-500",
  canceled: "bg-red-500",
  rescheduled: "bg-purple-500",
  blocked: "bg-zinc-600",
};

const statusLabels: any = {
  pending: "Pendente",
  confirmed: "Confirmado",
  completed: "Concluído",
  canceled: "Cancelado",
  rescheduled: "Reagendado",
  blocked: "Bloqueado",
};

export function AgendaManager({ providerId, initialSettings, onSaved }: { providerId: string, initialSettings: any, onSaved: () => void }) {
  const [activeTab, setActiveTab] = useState<"calendar" | "settings">("calendar");
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("month");
  
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Data & Loading
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Calendar Day Selection State for List Synchronization
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<Date | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState<"todos" | "hoje" | "amanha" | "semana" | "mes">("todos");
  const [selectedStatus, setSelectedStatus] = useState<string>("todos");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Modals
  const [selectedAppt, setSelectedAppt] = useState<any>(null);
  const [notesText, setNotesText] = useState("");
  
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockData, setBlockData] = useState({ date: formatYMD(new Date()), startTime: "12:00", endTime: "13:00", reason: "" });

  // Range calculation based on viewMode & upcoming window
  const { dateStart, dateEnd } = useMemo(() => {
    // We fetch a wide window around current date to populate both the calendar and upcoming list
    const start = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 3, 0);
    return { dateStart: formatYMD(start), dateEnd: formatYMD(end) };
  }, [currentDate]);

  // Fetch appointments via API endpoint
  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      const token = await getSessionToken();
      const input: any = {
        dateStart,
        dateEnd,
      };

      const url = `/api/trpc/appointments.getByProvider?input=${encodeURIComponent(JSON.stringify(input))}`;
      const res = await fetch(url, {
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const json = await res.json();
        if (json?.result?.data) {
          setAppointments(json.result.data);
        }
      }
    } catch (e) {
      console.error("Error fetching appointments:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [dateStart, dateEnd]);

  // Counters calculation
  const metrics = useMemo(() => {
    const todayStr = formatYMD(new Date());
    let hoje = 0;
    let pendentes = 0;
    let confirmados = 0;
    let concluidos = 0;

    appointments.forEach((a) => {
      const apptDateStr = formatYMD(new Date(a.date));
      if (apptDateStr === todayStr && a.status !== "canceled") {
        hoje++;
      }
      if (a.status === "pending") pendentes++;
      if (a.status === "confirmed") confirmados++;
      if (a.status === "completed") concluidos++;
    });

    return { hoje, pendentes, confirmados, concluidos, total: appointments.length };
  }, [appointments]);

  // Filtered and Sorted Appointments for the "Próximos Agendamentos" list
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

    return appointments
      .filter((appt) => {
        const apptDate = new Date(appt.date);
        apptDate.setHours(0, 0, 0, 0);

        // 1. Filter by specific calendar day selection (if user clicked a day on the calendar)
        if (selectedCalendarDay) {
          if (formatYMD(apptDate) !== formatYMD(selectedCalendarDay)) {
            return false;
          }
        } else {
          // 2. Period Filter
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

        // 3. Status Filter
        if (selectedStatus !== "todos" && appt.status !== selectedStatus) {
          return false;
        }

        // 4. Search Filter
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const nameMatch = (appt.clientName || "").toLowerCase().includes(term);
          const serviceMatch = (appt.serviceName || "").toLowerCase().includes(term);
          const phoneMatch = (appt.clientPhone || "").toLowerCase().includes(term);
          if (!nameMatch && !serviceMatch && !phoneMatch) return false;
        }

        return true;
      })
      .sort((a, b) => {
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

  // Mutations via Fetch
  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const token = await getSessionToken();
      const res = await fetch("/api/trpc/appointments.updateStatus", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ id, status })
      });
      if (res.ok) {
        toast.success("Status atualizado!");
        setSelectedAppt(null);
        fetchAppointments();
      } else {
        toast.error("Erro ao atualizar status.");
      }
    } catch (e) {
      toast.error("Erro de conexão.");
    }
  };

  const handleUpdateNotes = async (id: string, notes: string) => {
    try {
      const token = await getSessionToken();
      const res = await fetch("/api/trpc/appointments.updateNotes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ id, notes })
      });
      if (res.ok) {
        toast.success("Observações salvas!");
        fetchAppointments();
      } else {
        toast.error("Erro ao salvar observações.");
      }
    } catch (e) {
      toast.error("Erro de conexão.");
    }
  };

  const handleBlockSlot = async () => {
    try {
      const token = await getSessionToken();
      const res = await fetch("/api/trpc/appointments.blockSlot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ providerId, ...blockData })
      });
      if (res.ok) {
        toast.success("Horário bloqueado!");
        setShowBlockModal(false);
        fetchAppointments();
      } else {
        toast.error("Erro ao bloquear horário.");
      }
    } catch (e) {
      toast.error("Erro de conexão.");
    }
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

  const getAppointmentsForDay = (d: Date) => {
    if (!appointments) return [];
    const ymd = formatYMD(d);
    return appointments.filter(a => formatYMD(new Date(a.date)) === ymd);
  };

  const openWhatsapp = (phone: string, clientName: string) => {
    if (!phone || phone === "-") {
      toast.error("Telefone não informado para este cliente.");
      return;
    }
    const cleaned = String(phone).replace(/\D/g, "");
    const num = cleaned.startsWith("55") ? cleaned : `55${cleaned}`;
    window.open(`https://wa.me/${num}?text=Olá ${clientName}, falo sobre seu agendamento no XamaJá...`, "_blank");
  };

  const hours = Array.from({ length: 15 }).map((_, i) => `${String(i + 7).padStart(2, "0")}:00`); // 07:00 to 21:00

  // ----------------------------------------------------
  // RENDER VIEWS
  // ----------------------------------------------------

  const renderMonthView = () => {
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const startOffset = firstDay.getDay();
    let d = new Date(firstDay);
    d.setDate(d.getDate() - startOffset);
    const days = [];
    for (let i = 0; i < 42; i++) {
      days.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }

    return (
      <div className="grid grid-cols-7 gap-[1px] bg-zinc-800 rounded-2xl overflow-hidden border border-zinc-800 shadow-xl">
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d, i) => (
          <div key={i} className="bg-zinc-900 text-center text-[11px] font-extrabold text-zinc-400 uppercase tracking-wider py-3">
            {d}
          </div>
        ))}
        {days.map((d, i) => {
          const isCurrentMonth = d.getMonth() === currentDate.getMonth();
          const dayAppts = getAppointmentsForDay(d);
          const isToday = formatYMD(d) === formatYMD(new Date());
          const isSelected = selectedCalendarDay && formatYMD(d) === formatYMD(selectedCalendarDay);

          return (
            <div 
              key={i} 
              onClick={() => {
                // Clicking day filters the side list to that day
                if (isSelected) {
                  setSelectedCalendarDay(null);
                } else {
                  setSelectedCalendarDay(d);
                }
              }}
              className={`bg-zinc-950 p-2 min-h-[96px] flex flex-col gap-1 transition cursor-pointer relative group ${
                !isCurrentMonth ? "opacity-35" : "hover:bg-zinc-900/60"
              } ${isSelected ? "ring-2 ring-primary bg-primary/5" : ""}`}
            >
              <div className="flex items-center justify-between">
                <div className={`text-xs font-black w-6 h-6 flex items-center justify-center rounded-full transition ${
                  isToday 
                    ? "bg-primary text-black font-black" 
                    : isSelected 
                    ? "bg-white text-black font-bold" 
                    : "text-zinc-400 group-hover:text-white"
                }`}>
                  {d.getDate()}
                </div>
                {dayAppts.length > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-zinc-900 border border-white/10 text-zinc-300">
                    {dayAppts.length}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1 mt-1 overflow-y-auto max-h-[68px] custom-scrollbar">
                {dayAppts.map(appt => (
                  <button 
                    key={appt.id} 
                    onClick={(e) => { 
                      e.stopPropagation();
                      setSelectedAppt(appt); 
                      setNotesText(appt.notes || ""); 
                    }}
                    className={`text-[10px] truncate px-1.5 py-1 rounded-md text-left w-full ${statusColors[appt.status]} bg-opacity-20 border border-white/10 text-white font-medium hover:opacity-90 hover:scale-[1.02] transition shadow-sm`}
                  >
                    <span className="font-bold opacity-80">{appt.startTime}</span> {appt.clientName}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    const days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      return d;
    });

    return (
      <div className="flex border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-950 shadow-xl">
        <div className="w-16 flex flex-col border-r border-zinc-800 bg-zinc-900">
          <div className="h-12 border-b border-zinc-800" />
          {hours.map(h => (
            <div key={h} className="h-16 border-b border-zinc-800 text-xs text-zinc-500 flex justify-center pt-2 font-mono">{h}</div>
          ))}
        </div>
        <div className="flex-1 grid grid-cols-7">
          {days.map((d, i) => {
            const dayAppts = getAppointmentsForDay(d);
            const isToday = formatYMD(d) === formatYMD(new Date());
            const isSelected = selectedCalendarDay && formatYMD(d) === formatYMD(selectedCalendarDay);
            return (
              <div 
                key={i} 
                onClick={() => setSelectedCalendarDay(isSelected ? null : d)}
                className={`flex flex-col border-r border-zinc-800 last:border-0 relative min-w-[90px] cursor-pointer ${
                  isSelected ? "bg-primary/5" : ""
                }`}
              >
                <div className={`h-12 border-b border-zinc-800 flex flex-col items-center justify-center ${isToday ? "bg-primary/10" : ""}`}>
                  <span className="text-[10px] uppercase text-zinc-500 font-bold">{["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][d.getDay()]}</span>
                  <span className={`text-sm font-black ${isToday ? "text-primary" : "text-white"}`}>{d.getDate()}</span>
                </div>
                <div className="relative flex-1 min-h-[400px]">
                  {hours.map(h => <div key={h} className="h-16 border-b border-zinc-800/50" />)}
                  {dayAppts.map(appt => {
                    const [h, m] = appt.startTime.split(":").map(Number);
                    const top = (h - 7) * 64 + (m / 60) * 64;
                    return (
                      <div 
                        key={appt.id} 
                        onClick={(e) => { 
                          e.stopPropagation();
                          setSelectedAppt(appt); 
                          setNotesText(appt.notes || ""); 
                        }}
                        className={`absolute left-1 right-1 p-1.5 rounded-lg text-[10px] leading-tight overflow-hidden cursor-pointer shadow-md hover:z-20 hover:scale-[1.02] transition ${statusColors[appt.status]} border border-black/20 text-white`}
                        style={{ top: `${top}px`, height: '56px', opacity: appt.status === "blocked" ? 0.7 : 1 }}
                      >
                        <div className="font-bold truncate">{appt.startTime} - {appt.clientName}</div>
                        <div className="truncate opacity-85 text-[9px]">{appt.serviceName}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const dayAppts = getAppointmentsForDay(currentDate);
    
    return (
      <div className="border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-950 flex max-h-[700px] overflow-y-auto custom-scrollbar relative shadow-xl">
        <div className="w-16 flex flex-col border-r border-zinc-800 bg-zinc-900 shrink-0">
          {hours.map(h => (
            <div key={h} className="h-20 border-b border-zinc-800 text-xs text-zinc-500 flex justify-center pt-2 font-mono">{h}</div>
          ))}
        </div>
        <div className="flex-1 relative min-w-[280px]">
          {hours.map(h => <div key={h} className="h-20 border-b border-zinc-800/50" />)}
          {dayAppts.map(appt => {
            const [h, m] = appt.startTime.split(":").map(Number);
            const top = (h - 7) * 80 + (m / 60) * 80;
            return (
              <div 
                key={appt.id} 
                onClick={() => { setSelectedAppt(appt); setNotesText(appt.notes || ""); }}
                className={`absolute left-4 right-4 p-3.5 rounded-2xl cursor-pointer shadow-lg hover:-translate-y-0.5 transition flex gap-3 ${statusColors[appt.status]} border-l-4 border-black/30 text-white`}
                style={{ top: `${top}px`, height: '74px', opacity: appt.status === "blocked" ? 0.8 : 1 }}
              >
                <div className="flex-1 overflow-hidden">
                  <div className="flex justify-between items-center">
                    <span className="font-black text-sm truncate">{appt.clientName}</span>
                    <span className="text-xs font-mono font-bold bg-black/20 px-2 py-0.5 rounded-full">{appt.startTime} - {appt.endTime}</span>
                  </div>
                  <div className="text-xs opacity-90 truncate mt-0.5">{appt.serviceName}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ----------------------------------------------------
  // RETURN MAIN UI
  // ----------------------------------------------------

  return (
    <div className="bg-zinc-950 border border-zinc-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
      {/* TABS */}
      <div className="flex border-b border-zinc-900 shrink-0 bg-zinc-950/80 backdrop-blur-md">
        <button
          onClick={() => setActiveTab("calendar")}
          className={`flex-1 py-4 text-sm font-extrabold border-b-2 transition flex items-center justify-center gap-2 ${
            activeTab === "calendar" ? "border-primary text-white bg-zinc-900/50" : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <CalendarIcon className="w-4 h-4 text-primary" /> Gestão da Agenda
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`flex-1 py-4 text-sm font-extrabold border-b-2 transition flex items-center justify-center gap-2 ${
            activeTab === "settings" ? "border-primary text-white bg-zinc-900/50" : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Clock className="w-4 h-4 text-primary" /> Configurar Regras e Horários
        </button>
      </div>

      <div className="p-4 md:p-6 flex-1 flex flex-col">
        {activeTab === "settings" && (
          <AgendaSettingsForm providerId={providerId} initialSettings={initialSettings} onSaved={onSaved} />
        )}

        {activeTab === "calendar" && (
          <div className="space-y-6">
            {/* COUNTER METRICS BAR */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-zinc-900/70 border border-zinc-800/80 p-3.5 rounded-2xl flex items-center gap-3 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl font-black text-white leading-none">{metrics.hoje}</div>
                  <div className="text-[11px] font-extrabold text-zinc-400 uppercase tracking-wider mt-1">Hoje</div>
                </div>
              </div>

              <div className="bg-zinc-900/70 border border-zinc-800/80 p-3.5 rounded-2xl flex items-center gap-3 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Clock4 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl font-black text-amber-400 leading-none">{metrics.pendentes}</div>
                  <div className="text-[11px] font-extrabold text-zinc-400 uppercase tracking-wider mt-1">Pendentes</div>
                </div>
              </div>

              <div className="bg-zinc-900/70 border border-zinc-800/80 p-3.5 rounded-2xl flex items-center gap-3 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl font-black text-emerald-400 leading-none">{metrics.confirmados}</div>
                  <div className="text-[11px] font-extrabold text-zinc-400 uppercase tracking-wider mt-1">Confirmados</div>
                </div>
              </div>

              <div className="bg-zinc-900/70 border border-zinc-800/80 p-3.5 rounded-2xl flex items-center gap-3 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <CalendarCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl font-black text-blue-400 leading-none">{metrics.concluidos}</div>
                  <div className="text-[11px] font-extrabold text-zinc-400 uppercase tracking-wider mt-1">Concluídos</div>
                </div>
              </div>
            </div>

            {/* MAIN TWO-COLUMN WORKSPACE: CALENDAR (LEFT) & UPCOMING APPOINTMENTS LIST (RIGHT) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* LEFT COLUMN: INTERACTIVE CALENDAR & CONTROLS */}
              <div className="lg:col-span-7 xl:col-span-7 space-y-4">
                {/* CALENDAR CONTROLS */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-900/40 p-3 rounded-2xl border border-zinc-800/80">
                  <div className="flex items-center gap-1.5 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
                    <Button variant="ghost" size="sm" onClick={() => setViewMode("day")} className={`px-3 py-1 rounded-lg h-7 text-xs font-bold ${viewMode === "day" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-white"}`}>Dia</Button>
                    <Button variant="ghost" size="sm" onClick={() => setViewMode("week")} className={`px-3 py-1 rounded-lg h-7 text-xs font-bold ${viewMode === "week" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-white"}`}>Semana</Button>
                    <Button variant="ghost" size="sm" onClick={() => setViewMode("month")} className={`px-3 py-1 rounded-lg h-7 text-xs font-bold ${viewMode === "month" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-white"}`}>Mês</Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={handlePrev} className="h-8 w-8 bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800 rounded-lg"><ChevronLeft className="w-4 h-4" /></Button>
                    <h2 className="text-xs sm:text-sm font-black text-white min-w-[130px] text-center capitalize tracking-wide">
                      {viewMode === "month" 
                        ? currentDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }) 
                        : currentDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
                      }
                    </h2>
                    <Button variant="outline" size="icon" onClick={handleNext} className="h-8 w-8 bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800 rounded-lg"><ChevronRight className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => { setCurrentDate(new Date()); setSelectedCalendarDay(null); }} className="text-xs font-bold text-primary hover:bg-primary/10 h-8 px-2.5 rounded-lg">Hoje</Button>
                  </div>

                  <Button onClick={() => setShowBlockModal(true)} size="sm" variant="outline" className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-white text-xs font-bold h-8 rounded-xl">
                    <Plus className="w-3.5 h-3.5 mr-1 text-primary" /> Bloquear
                  </Button>
                </div>

                {/* LOADER */}
                {isLoading && (
                  <div className="h-1 bg-zinc-900 w-full overflow-hidden rounded-full">
                    <div className="h-full bg-primary/50 w-1/3 animate-[slide_1.5s_infinite]" />
                  </div>
                )}

                {/* ACTIVE CALENDAR VIEW */}
                <div className="w-full">
                  {viewMode === "month" && renderMonthView()}
                  {viewMode === "week" && renderWeekView()}
                  {viewMode === "day" && renderDayView()}
                </div>
              </div>

              {/* RIGHT COLUMN: PRÓXIMOS AGENDAMENTOS (FIXED & SMART LIST) */}
              <div className="lg:col-span-5 xl:col-span-5 bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-4 md:p-5 flex flex-col space-y-4 shadow-xl">
                
                {/* PANEL HEADER */}
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                    <h3 className="font-black text-base text-white tracking-wide">Próximos Agendamentos</h3>
                  </div>
                  <span className="text-xs font-bold bg-zinc-800 border border-white/5 text-zinc-300 px-2.5 py-0.5 rounded-full">
                    {filteredAppointments.length} item(s)
                  </span>
                </div>

                {/* SEARCH INPUT */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <Input 
                    placeholder="Pesquisar por cliente, telefone ou serviço..." 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)}
                    className="h-10 pl-9 bg-zinc-950 border-zinc-800 text-xs focus-visible:ring-1 focus-visible:ring-primary rounded-xl"
                  />
                  {searchTerm && (
                    <button 
                      onClick={() => setSearchTerm("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* PERIOD & STATUS FILTERS */}
                <div className="space-y-2">
                  {/* Period Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                    {[
                      { key: "todos", label: "Todos" },
                      { key: "hoje", label: "Hoje" },
                      { key: "amanha", label: "Amanhã" },
                      { key: "semana", label: "Esta Semana" },
                      { key: "mes", label: "Este Mês" },
                    ].map((period) => (
                      <button
                        key={period.key}
                        onClick={() => {
                          setSelectedPeriod(period.key as any);
                          setSelectedCalendarDay(null);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition ${
                          selectedPeriod === period.key && !selectedCalendarDay
                            ? "bg-primary text-black shadow-md shadow-primary/20 scale-[1.02]"
                            : "bg-zinc-950 border border-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-900"
                        }`}
                      >
                        {period.label}
                      </button>
                    ))}
                  </div>

                  {/* Status & Sort Row */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    {/* Status Dropdown/Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                      {["todos", "pending", "confirmed", "completed", "canceled"].map((status) => (
                        <button
                          key={status}
                          onClick={() => setSelectedStatus(status)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition ${
                            selectedStatus === status
                              ? "bg-zinc-800 text-white border border-zinc-700 shadow-sm"
                              : "text-zinc-500 hover:text-zinc-300"
                          }`}
                        >
                          {status === "todos" ? "Todos Status" : statusLabels[status]}
                        </button>
                      ))}
                    </div>

                    {/* Sort Order Toggle */}
                    <button
                      onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
                      className="p-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white transition shrink-0"
                      title={sortOrder === "asc" ? "Mais próximos primeiro" : "Mais distantes primeiro"}
                    >
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* DAY FILTER ACTIVE INDICATOR */}
                {selectedCalendarDay && (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-primary/10 border border-primary/30 text-primary text-xs">
                    <div className="flex items-center gap-2 font-bold">
                      <CalendarDays className="w-4 h-4" />
                      <span>Filtrando por: {selectedCalendarDay.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })}</span>
                    </div>
                    <button 
                      onClick={() => setSelectedCalendarDay(null)}
                      className="px-2 py-0.5 rounded-md bg-primary text-black font-black text-[10px] hover:opacity-90"
                    >
                      Ver Todos
                    </button>
                  </div>
                )}

                {/* CHRONOLOGICAL APPOINTMENTS LIST */}
                <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1 custom-scrollbar">
                  {filteredAppointments.length === 0 ? (
                    <div className="p-8 text-center bg-zinc-950/60 border border-zinc-800/80 rounded-2xl space-y-2">
                      <CalendarDays className="w-8 h-8 text-zinc-600 mx-auto" />
                      <p className="text-sm font-bold text-white">Nenhum agendamento encontrado</p>
                      <p className="text-xs text-zinc-500">
                        {selectedCalendarDay 
                          ? "Não há agendamentos para o dia selecionado no calendário."
                          : "Tente alterar os filtros ou pesquisar por outro termo."}
                      </p>
                      {selectedCalendarDay && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => setSelectedCalendarDay(null)}
                          className="mt-2 text-xs bg-zinc-900 border-zinc-800 text-white"
                        >
                          Limpar filtro de dia
                        </Button>
                      )}
                    </div>
                  ) : (
                    filteredAppointments.map((appt) => {
                      const apptDate = new Date(appt.date);
                      const isToday = formatYMD(apptDate) === formatYMD(new Date());
                      const isTomorrow = formatYMD(apptDate) === formatYMD(new Date(Date.now() + 86400000));
                      const dateDisplay = isToday 
                        ? "Hoje" 
                        : isTomorrow 
                        ? "Amanhã" 
                        : apptDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

                      return (
                        <div
                          key={appt.id}
                          onClick={() => {
                            // Focus date on calendar & open details modal
                            setCurrentDate(new Date(appt.date));
                            setSelectedAppt(appt);
                            setNotesText(appt.notes || "");
                          }}
                          className="bg-zinc-950 border border-zinc-800/90 hover:border-zinc-700 p-4 rounded-2xl space-y-3 transition-all duration-150 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer group"
                        >
                          {/* Header: Client & Status */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2.5 flex-1 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 font-bold text-xs shrink-0">
                                {appt.clientName ? appt.clientName.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-extrabold text-sm text-white truncate group-hover:text-primary transition">
                                  {appt.clientName}
                                </h4>
                                <p className="text-xs text-zinc-400 truncate">
                                  {appt.serviceName}
                                </p>
                              </div>
                            </div>

                            {/* Status Badge */}
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${statusColors[appt.status]} bg-opacity-20 text-white border border-white/10 shrink-0`}>
                              {statusLabels[appt.status]}
                            </span>
                          </div>

                          {/* Info row: Date, Time & Phone */}
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1 border-t border-zinc-900">
                            <div className="flex items-center gap-3 text-zinc-300 font-medium">
                              <div className="flex items-center gap-1.5">
                                <CalendarIcon className="w-3.5 h-3.5 text-primary" />
                                <span className={`font-bold ${isToday ? "text-primary" : ""}`}>{dateDisplay}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                                <span className="font-mono">{appt.startTime} - {appt.endTime}</span>
                              </div>
                            </div>

                            {appt.clientPhone && appt.clientPhone !== "-" && (
                              <span className="text-[11px] text-zinc-500 font-mono">
                                {appt.clientPhone}
                              </span>
                            )}
                          </div>

                          {/* Action Buttons: WhatsApp & Ver Detalhes */}
                          <div className="flex items-center gap-2 pt-1">
                            {appt.clientPhone && appt.clientPhone !== "-" && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openWhatsapp(appt.clientPhone, appt.clientName);
                                }}
                                className="flex-1 py-2 px-3 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#25D366] text-xs font-bold flex items-center justify-center gap-1.5 transition"
                              >
                                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCurrentDate(new Date(appt.date));
                                setSelectedAppt(appt);
                                setNotesText(appt.notes || "");
                              }}
                              className="flex-1 py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition"
                            >
                              <Eye className="w-3.5 h-3.5 text-zinc-400" /> Ver detalhes
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

              </div>

            </div>
          </div>
        )}
      </div>

      {/* MODAL DETALHES AGENDAMENTO */}
      {selectedAppt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className={`h-2 w-full ${statusColors[selectedAppt.status]}`} />
            
            <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-black text-white">{selectedAppt.clientName}</h2>
                  <p className="text-sm text-zinc-400 font-mono mt-1">{selectedAppt.clientPhone}</p>
                </div>
                <div className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${statusColors[selectedAppt.status]} bg-opacity-20 text-white border border-white/10`}>
                  {statusLabels[selectedAppt.status]}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800">
                  <div className="text-[10px] uppercase text-zinc-500 font-bold mb-1">Serviço</div>
                  <div className="text-sm text-white font-semibold truncate">{selectedAppt.serviceName}</div>
                </div>
                <div className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800">
                  <div className="text-[10px] uppercase text-zinc-500 font-bold mb-1">Data e Hora</div>
                  <div className="text-sm text-white font-semibold">
                    {new Date(selectedAppt.date).toLocaleDateString("pt-BR")} • {selectedAppt.startTime}
                  </div>
                </div>
              </div>

              {/* Notas do Prestador */}
              <div className="mb-6">
                <div className="text-[10px] uppercase text-zinc-500 font-bold mb-2 flex justify-between items-center">
                  <span>Observações Internas (Só você vê)</span>
                  {selectedAppt.notes !== notesText && (
                    <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] bg-primary/20 text-primary hover:bg-primary/30" onClick={() => handleUpdateNotes(selectedAppt.id, notesText)}>Salvar Notas</Button>
                  )}
                </div>
                <textarea 
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                  placeholder="Ex: Cliente pediu para chegar 10 minutos antes..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-primary min-h-[80px] resize-none"
                />
              </div>

              {/* Ações */}
              {selectedAppt.status !== "blocked" && (
                <div>
                  <div className="text-[10px] uppercase text-zinc-500 font-bold mb-3">Ações do Agendamento</div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    {selectedAppt.status === "pending" && (
                      <Button onClick={() => handleUpdateStatus(selectedAppt.id, "confirmed")} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold h-12 shadow-lg shadow-emerald-500/20">
                        <Check className="w-5 h-5 mr-2" /> Aprovar
                      </Button>
                    )}
                    {(selectedAppt.status === "pending" || selectedAppt.status === "confirmed") && (
                      <Button onClick={() => handleUpdateStatus(selectedAppt.id, "canceled")} variant="outline" className="bg-transparent border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500 h-12 font-bold">
                        <X className="w-5 h-5 mr-2" /> {selectedAppt.status === "pending" ? "Rejeitar" : "Cancelar"}
                      </Button>
                    )}
                    {selectedAppt.status === "confirmed" && (
                      <Button onClick={() => handleUpdateStatus(selectedAppt.id, "completed")} className="bg-blue-500 hover:bg-blue-600 text-white font-bold h-12 col-span-2 shadow-lg shadow-blue-500/20">
                        <Check className="w-5 h-5 mr-2" /> Marcar como Concluído
                      </Button>
                    )}
                  </div>

                  {selectedAppt.clientPhone && selectedAppt.clientPhone !== "-" && (
                    <Button onClick={() => openWhatsapp(selectedAppt.clientPhone, selectedAppt.clientName)} variant="outline" className="w-full bg-[#25D366]/10 border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/20 h-12 font-bold mt-2">
                      <MessageCircle className="w-5 h-5 mr-2" /> Chamar no WhatsApp
                    </Button>
                  )}
                </div>
              )}

              {selectedAppt.status === "blocked" && (
                <Button onClick={() => handleUpdateStatus(selectedAppt.id, "canceled")} variant="outline" className="w-full bg-zinc-900 border-red-500/30 text-red-400 hover:bg-red-500/10 h-12 font-bold">
                  Remover Bloqueio
                </Button>
              )}
            </div>

            <div className="p-4 border-t border-zinc-900 bg-zinc-900/30 flex justify-end">
              <Button onClick={() => setSelectedAppt(null)} variant="ghost" className="text-zinc-400 hover:text-white">Fechar</Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL BLOQUEIO MANUAL */}
      {showBlockModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6">
              <h2 className="text-xl font-black text-white mb-2">Bloquear Horário</h2>
              <p className="text-xs text-zinc-400 mb-6">Bloqueie horários manualmente para evitar agendamentos nesses períodos.</p>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-zinc-500 mb-1 block">Data</label>
                  <Input type="date" value={blockData.date} onChange={e => setBlockData(prev => ({...prev, date: e.target.value}))} className="bg-zinc-900 border-zinc-800 text-white h-11" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-zinc-500 mb-1 block">Início</label>
                    <Input type="time" value={blockData.startTime} onChange={e => setBlockData(prev => ({...prev, startTime: e.target.value}))} className="bg-zinc-900 border-zinc-800 text-white h-11" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-500 mb-1 block">Fim</label>
                    <Input type="time" value={blockData.endTime} onChange={e => setBlockData(prev => ({...prev, endTime: e.target.value}))} className="bg-zinc-900 border-zinc-800 text-white h-11" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-500 mb-1 block">Motivo (Opcional)</label>
                  <Input placeholder="Ex: Consulta médica, Manutenção..." value={blockData.reason} onChange={e => setBlockData(prev => ({...prev, reason: e.target.value}))} className="bg-zinc-900 border-zinc-800 text-white h-11" />
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-zinc-900 bg-zinc-900/30 flex justify-end gap-3">
              <Button onClick={() => setShowBlockModal(false)} variant="ghost" className="text-zinc-400 hover:text-white">Cancelar</Button>
              <Button 
                onClick={handleBlockSlot}
                className="bg-primary text-black font-bold hover:bg-primary/90"
              >
                Bloquear
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
