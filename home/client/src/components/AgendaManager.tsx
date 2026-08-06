import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ChevronLeft, ChevronRight, Check, X, Calendar as CalendarIcon, 
  Clock, MessageCircle, Search, Filter, Plus, CalendarDays, CalendarRange, List
} from "lucide-react";
import { toast } from "sonner";
import { AgendaSettingsForm } from "./AgendaSettingsForm";

function formatYMD(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const statusColors: any = {
  pending: "bg-yellow-500",
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

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Modals
  const [selectedAppt, setSelectedAppt] = useState<any>(null);
  const [notesText, setNotesText] = useState("");
  
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockData, setBlockData] = useState({ date: formatYMD(new Date()), startTime: "12:00", endTime: "13:00", reason: "" });

  // Range calculation based on viewMode
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

  // Fetch appointments via API endpoint
  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("bp_session_token");
      const input: any = {
        dateStart,
        dateEnd,
      };
      if (searchTerm) input.search = searchTerm;
      if (activeFilters.length > 0) input.statusFilter = activeFilters;

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
  }, [dateStart, dateEnd, searchTerm, activeFilters]);

  // Mutations via Fetch
  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const token = localStorage.getItem("bp_session_token");
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
      const token = localStorage.getItem("bp_session_token");
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
      const token = localStorage.getItem("bp_session_token");
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

  const toggleFilter = (status: string) => {
    setActiveFilters(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]);
  };

  const getAppointmentsForDay = (d: Date) => {
    if (!appointments) return [];
    const ymd = formatYMD(d);
    return appointments.filter(a => formatYMD(new Date(a.date)) === ymd);
  };

  const openWhatsapp = (phone: string, clientName: string) => {
    if (!phone) return;
    const cleaned = String(phone).replace(/\D/g, "");
    const num = cleaned.startsWith("55") ? cleaned : `55${cleaned}`;
    window.open(`https://wa.me/${num}?text=Olá ${clientName}, sobre o seu agendamento...`, "_blank");
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
      <div className="grid grid-cols-7 gap-[1px] bg-zinc-800 rounded-xl overflow-hidden border border-zinc-800">
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d, i) => (
          <div key={i} className="bg-zinc-900 text-center text-xs font-bold text-zinc-400 py-3">{d}</div>
        ))}
        {days.map((d, i) => {
          const isCurrentMonth = d.getMonth() === currentDate.getMonth();
          const dayAppts = getAppointmentsForDay(d);
          const isToday = formatYMD(d) === formatYMD(new Date());

          return (
            <div key={i} className={`bg-zinc-950 p-2 min-h-[100px] flex flex-col gap-1 transition ${!isCurrentMonth ? "opacity-40" : "hover:bg-zinc-900/50"}`}>
              <div className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? "bg-primary text-black" : "text-zinc-500"}`}>
                {d.getDate()}
              </div>
              <div className="flex flex-col gap-1 mt-1 overflow-y-auto max-h-[70px] custom-scrollbar">
                {dayAppts.map(appt => (
                  <button 
                    key={appt.id} 
                    onClick={() => { setSelectedAppt(appt); setNotesText(appt.notes || ""); }}
                    className={`text-[10px] truncate px-1.5 py-0.5 rounded text-left w-full ${statusColors[appt.status]} bg-opacity-20 border border-white/5 text-white/90 hover:opacity-80`}
                  >
                    {appt.startTime} - {appt.clientName}
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
      <div className="flex border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950">
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
            return (
              <div key={i} className="flex flex-col border-r border-zinc-800 last:border-0 relative min-w-[100px]">
                <div className={`h-12 border-b border-zinc-800 flex flex-col items-center justify-center ${isToday ? "bg-primary/10" : ""}`}>
                  <span className="text-[10px] uppercase text-zinc-500 font-bold">{["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][d.getDay()]}</span>
                  <span className={`text-sm font-black ${isToday ? "text-primary" : "text-white"}`}>{d.getDate()}</span>
                </div>
                <div className="relative">
                  {hours.map(h => <div key={h} className="h-16 border-b border-zinc-800/50" />)}
                  {dayAppts.map(appt => {
                    const [h, m] = appt.startTime.split(":").map(Number);
                    const top = (h - 7) * 64 + (m / 60) * 64;
                    return (
                      <div 
                        key={appt.id} 
                        onClick={() => { setSelectedAppt(appt); setNotesText(appt.notes || ""); }}
                        className={`absolute left-1 right-1 p-1 rounded-md text-[10px] leading-tight overflow-hidden cursor-pointer shadow-sm hover:z-10 transition ${statusColors[appt.status]} border border-black/20 text-white`}
                        style={{ top: `${top}px`, height: '60px', opacity: appt.status === "blocked" ? 0.7 : 1 }}
                      >
                        <div className="font-bold truncate">{appt.startTime} - {appt.clientName}</div>
                        <div className="truncate opacity-80">{appt.serviceName}</div>
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
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Timeline */}
        <div className="flex-1 border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950 flex max-h-[700px] overflow-y-auto custom-scrollbar relative">
          <div className="w-16 flex flex-col border-r border-zinc-800 bg-zinc-900 shrink-0">
            {hours.map(h => (
              <div key={h} className="h-20 border-b border-zinc-800 text-xs text-zinc-500 flex justify-center pt-2 font-mono">{h}</div>
            ))}
          </div>
          <div className="flex-1 relative min-w-[300px]">
            {hours.map(h => <div key={h} className="h-20 border-b border-zinc-800/50" />)}
            {dayAppts.map(appt => {
              const [h, m] = appt.startTime.split(":").map(Number);
              const top = (h - 7) * 80 + (m / 60) * 80;
              return (
                <div 
                  key={appt.id} 
                  onClick={() => { setSelectedAppt(appt); setNotesText(appt.notes || ""); }}
                  className={`absolute left-4 right-4 p-3 rounded-xl cursor-pointer shadow-md hover:-translate-y-0.5 transition flex gap-3 ${statusColors[appt.status]} border-l-4 border-black/20 text-white`}
                  style={{ top: `${top}px`, height: '76px', opacity: appt.status === "blocked" ? 0.8 : 1 }}
                >
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between">
                      <span className="font-bold text-sm truncate">{appt.clientName}</span>
                      <span className="text-xs font-mono font-bold">{appt.startTime} - {appt.endTime}</span>
                    </div>
                    <div className="text-xs opacity-90 truncate">{appt.serviceName}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Day Summary */}
        <div className="w-full lg:w-[350px] space-y-4">
          <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800">
            <h3 className="font-bold text-white mb-4">Resumo do Dia</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 text-center">
                <div className="text-2xl font-black text-white">{dayAppts.length}</div>
                <div className="text-[10px] text-zinc-500 uppercase font-bold">Total</div>
              </div>
              <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 text-center">
                <div className="text-2xl font-black text-emerald-500">{dayAppts.filter(a => a.status === 'confirmed').length}</div>
                <div className="text-[10px] text-zinc-500 uppercase font-bold">Confirmados</div>
              </div>
            </div>
            
            <Button onClick={() => setShowBlockModal(true)} variant="outline" className="w-full mt-4 bg-zinc-950 border-zinc-800 hover:bg-zinc-800 text-white">
              <Plus className="w-4 h-4 mr-2" /> Bloquear Horário
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // ----------------------------------------------------
  // RETURN MAIN UI
  // ----------------------------------------------------

  return (
    <div className="bg-zinc-950 border border-zinc-900 rounded-2xl overflow-hidden shadow-lg flex flex-col">
      {/* TABS */}
      <div className="flex border-b border-zinc-900 shrink-0">
        <button
          onClick={() => setActiveTab("calendar")}
          className={`flex-1 py-4 text-sm font-bold border-b-2 transition ${
            activeTab === "calendar" ? "border-primary text-white bg-zinc-900/50" : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <CalendarIcon className="w-4 h-4" /> Gestão da Agenda
          </div>
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`flex-1 py-4 text-sm font-bold border-b-2 transition ${
            activeTab === "settings" ? "border-primary text-white bg-zinc-900/50" : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Clock className="w-4 h-4" /> Configurar Regras e Horários
          </div>
        </button>
      </div>

      <div className="p-4 md:p-6 min-h-[500px] flex-1 flex flex-col">
        {activeTab === "settings" && (
          <AgendaSettingsForm providerId={providerId} initialSettings={initialSettings} onSaved={onSaved} />
        )}

        {activeTab === "calendar" && (
          <>
            {/* TOP BAR: Controls & Search */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
              
              <div className="flex items-center gap-2 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
                <Button variant="ghost" size="sm" onClick={() => setViewMode("day")} className={`px-3 py-1.5 rounded-lg h-auto text-xs font-bold ${viewMode === "day" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"}`}>Dia</Button>
                <Button variant="ghost" size="sm" onClick={() => setViewMode("week")} className={`px-3 py-1.5 rounded-lg h-auto text-xs font-bold ${viewMode === "week" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"}`}>Semana</Button>
                <Button variant="ghost" size="sm" onClick={() => setViewMode("month")} className={`px-3 py-1.5 rounded-lg h-auto text-xs font-bold ${viewMode === "month" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"}`}>Mês</Button>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={handlePrev} className="h-9 w-9 bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800"><ChevronLeft className="w-4 h-4" /></Button>
                  <h2 className="text-sm font-bold text-white min-w-[140px] text-center capitalize">
                    {viewMode === "month" 
                      ? currentDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }) 
                      : currentDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
                    }
                  </h2>
                  <Button variant="outline" size="icon" onClick={handleNext} className="h-9 w-9 bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800"><ChevronRight className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date())} className="text-xs font-bold text-primary hover:bg-primary/10 ml-2">Hoje</Button>
                </div>
              </div>

              <div className="flex items-center gap-2 relative">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <Input 
                    placeholder="Pesquisar..." 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)}
                    className="h-9 w-48 pl-9 bg-zinc-900 border-zinc-800 text-xs focus-visible:ring-1 focus-visible:ring-primary"
                  />
                </div>
                <Button variant="outline" size="icon" onClick={() => setShowFilters(!showFilters)} className={`h-9 w-9 bg-zinc-900 border-zinc-800 ${activeFilters.length > 0 ? "text-primary border-primary/50" : "text-white"}`}>
                  <Filter className="w-4 h-4" />
                </Button>
                
                {/* Filters Dropdown */}
                {showFilters && (
                  <div className="absolute top-12 right-0 bg-zinc-900 border border-zinc-800 p-3 rounded-xl shadow-2xl z-20 w-48">
                    <p className="text-xs font-bold text-zinc-400 mb-2">Filtrar por Status</p>
                    <div className="space-y-1">
                      {["pending", "confirmed", "completed", "canceled", "blocked"].map(status => (
                        <label key={status} className="flex items-center gap-2 text-xs text-white hover:bg-zinc-800 p-1.5 rounded cursor-pointer">
                          <input type="checkbox" checked={activeFilters.includes(status)} onChange={() => toggleFilter(status)} className="accent-primary" />
                          <span className={`w-2 h-2 rounded-full ${statusColors[status]}`} />
                          {statusLabels[status]}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* LOADER */}
            {isLoading && (
              <div className="h-1 bg-zinc-900 w-full overflow-hidden rounded-full mb-4">
                <div className="h-full bg-primary/50 w-1/3 animate-[slide_1.5s_infinite]" />
              </div>
            )}

            {/* MAIN CONTENT */}
            <div className="flex-1">
              {viewMode === "month" && renderMonthView()}
              {viewMode === "week" && renderWeekView()}
              {viewMode === "day" && renderDayView()}
            </div>
          </>
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

                  {selectedAppt.clientPhone && (
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
