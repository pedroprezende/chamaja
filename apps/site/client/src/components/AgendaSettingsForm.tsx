import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Calendar, Clock, Lock, Plus, X } from "lucide-react";
import { getSessionToken } from "@/lib/supabase";

export interface WorkingDay {
  day: number; // 0=Sun, 1=Mon...
  isOpen: boolean;
  open: string;
  close: string;
  lunchStart?: string;
  lunchEnd?: string;
}

export interface ScheduleSettings {
  workingDays: WorkingDay[];
  slotInterval: number;
  maxSimultaneous: number;
  unavailableDates: string[];
  vacationStart?: string;
  vacationEnd?: string;
}

const DAYS_OF_WEEK = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

const defaultWorkingDays: WorkingDay[] = DAYS_OF_WEEK.map((_, i) => ({
  day: i,
  isOpen: i > 0 && i < 6, // Mon-Fri default
  open: "09:00",
  close: "18:00",
  lunchStart: "12:00",
  lunchEnd: "13:00",
}));

export function AgendaSettingsForm({
  providerId,
  initialSettings,
  onSaved,
}: {
  providerId: string;
  initialSettings?: any;
  onSaved?: () => void;
}) {
  // Parse initial settings safely
  const [settings, setSettings] = useState<ScheduleSettings>(() => {
    try {
      const parsed = typeof initialSettings === "string" ? JSON.parse(initialSettings) : initialSettings;
      if (parsed && typeof parsed === "object") {
        return {
          workingDays: parsed.workingDays || defaultWorkingDays,
          slotInterval: parsed.slotInterval || 30,
          maxSimultaneous: parsed.maxSimultaneous || 1,
          unavailableDates: parsed.unavailableDates || [],
          vacationStart: parsed.vacationStart || "",
          vacationEnd: parsed.vacationEnd || "",
        };
      }
    } catch (e) {
      console.warn("Failed to parse scheduleSettings", e);
    }
    return {
      workingDays: defaultWorkingDays,
      slotInterval: 30,
      maxSimultaneous: 1,
      unavailableDates: [],
    };
  });

  const [newUnavailDate, setNewUnavailDate] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [blockDate, setBlockDate] = useState("");
  const [blockStart, setBlockStart] = useState("");
  const [blockEnd, setBlockEnd] = useState("");
  const [isBlocking, setIsBlocking] = useState(false);

  const handleDayChange = (dayIndex: number, field: keyof WorkingDay, value: any) => {
    setSettings((prev) => ({
      ...prev,
      workingDays: prev.workingDays.map((d) =>
        d.day === dayIndex ? { ...d, [field]: value } : d
      ),
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = await getSessionToken();
      const res = await fetch("/api/business-partner/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          scheduleSettings: settings,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Configurações de agenda salvas com sucesso!");
        onSaved?.();
      } else {
        toast.error(data.error || "Erro ao salvar as configurações");
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar as configurações");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBlockSlot = async () => {
    if (!blockDate || !blockStart || !blockEnd) {
      toast.error("Preencha data, início e fim para bloquear o horário.");
      return;
    }
    setIsBlocking(true);
    try {
      const token = await getSessionToken();
      const res = await fetch("/api/trpc/appointments.blockSlot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          providerId,
          date: blockDate,
          startTime: blockStart,
          endTime: blockEnd,
          reason: "Bloqueio Manual",
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Horário bloqueado com sucesso!");
        setBlockDate("");
        setBlockStart("");
        setBlockEnd("");
      } else {
        toast.error(data.error?.message || "Erro ao bloquear horário");
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao bloquear horário");
    } finally {
      setIsBlocking(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Horários de Funcionamento */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold text-white">Horários de Funcionamento</h3>
        </div>
        
        <div className="space-y-4">
          {settings.workingDays.map((day) => (
            <div key={day.day} className="flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
              <div className="w-32 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={day.isOpen}
                  onChange={(e) => handleDayChange(day.day, "isOpen", e.target.checked)}
                  className="w-4 h-4 rounded bg-zinc-950 border-zinc-700 text-primary focus:ring-primary"
                />
                <span className="text-sm font-bold text-white">{DAYS_OF_WEEK[day.day]}</span>
              </div>
              
              {day.isOpen ? (
                <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase font-bold mb-1 block">Abertura</label>
                    <Input type="time" value={day.open} onChange={(e) => handleDayChange(day.day, "open", e.target.value)} className="h-9 bg-zinc-950 border-zinc-800 text-sm text-white" />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase font-bold mb-1 block">Fechamento</label>
                    <Input type="time" value={day.close} onChange={(e) => handleDayChange(day.day, "close", e.target.value)} className="h-9 bg-zinc-950 border-zinc-800 text-sm text-white" />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase font-bold mb-1 block">Início Almoço</label>
                    <Input type="time" value={day.lunchStart || ""} onChange={(e) => handleDayChange(day.day, "lunchStart", e.target.value)} className="h-9 bg-zinc-950 border-zinc-800 text-sm text-white" />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase font-bold mb-1 block">Fim Almoço</label>
                    <Input type="time" value={day.lunchEnd || ""} onChange={(e) => handleDayChange(day.day, "lunchEnd", e.target.value)} className="h-9 bg-zinc-950 border-zinc-800 text-sm text-white" />
                  </div>
                </div>
              ) : (
                <div className="flex-1 text-sm text-zinc-500 italic px-2">Fechado</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Regras Globais */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold text-white">Regras de Atendimento</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-white uppercase tracking-wider block mb-1">
                Intervalo Padrão (minutos)
              </label>
              <Input
                type="number"
                min={5}
                value={settings.slotInterval}
                onChange={(e) => setSettings(s => ({ ...s, slotInterval: parseInt(e.target.value) || 30 }))}
                className="bg-zinc-900 border-zinc-800 h-11 text-white"
              />
              <p className="text-[11px] text-zinc-500 mt-1">Tempo padrão dos atendimentos (se o serviço não tiver duração específica).</p>
            </div>
            <div>
              <label className="text-xs font-bold text-white uppercase tracking-wider block mb-1">
                Atendimentos Simultâneos
              </label>
              <Input
                type="number"
                min={1}
                value={settings.maxSimultaneous}
                onChange={(e) => setSettings(s => ({ ...s, maxSimultaneous: parseInt(e.target.value) || 1 }))}
                className="bg-zinc-900 border-zinc-800 h-11 text-white"
              />
              <p className="text-[11px] text-zinc-500 mt-1">Quantos clientes podem agendar exatamente o mesmo horário.</p>
            </div>
          </div>
        </div>

        {/* Férias e Bloqueios */}
        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold text-white">Férias e Feriados</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-xs font-bold text-white uppercase tracking-wider block mb-1">Início Férias</label>
              <Input type="date" value={settings.vacationStart || ""} onChange={(e) => setSettings(s => ({ ...s, vacationStart: e.target.value }))} className="bg-zinc-900 border-zinc-800 h-11 text-white" />
            </div>
            <div>
              <label className="text-xs font-bold text-white uppercase tracking-wider block mb-1">Fim Férias</label>
              <Input type="date" value={settings.vacationEnd || ""} onChange={(e) => setSettings(s => ({ ...s, vacationEnd: e.target.value }))} className="bg-zinc-900 border-zinc-800 h-11 text-white" />
            </div>
          </div>

          <div className="border-t border-zinc-800 pt-4">
            <label className="text-xs font-bold text-white uppercase tracking-wider block mb-2">Dias Bloqueados (Feriados)</label>
            <div className="flex gap-2 mb-3">
              <Input
                type="date"
                value={newUnavailDate}
                onChange={(e) => setNewUnavailDate(e.target.value)}
                className="bg-zinc-900 border-zinc-800 h-11 text-white"
              />
              <Button type="button" onClick={() => {
                if (newUnavailDate && !settings.unavailableDates.includes(newUnavailDate)) {
                  setSettings(s => ({ ...s, unavailableDates: [...s.unavailableDates, newUnavailDate] }));
                  setNewUnavailDate("");
                }
              }} className="h-11 px-4 bg-zinc-800 hover:bg-zinc-700 text-white">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {settings.unavailableDates.map((date) => (
                <div key={date} className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg text-sm text-zinc-300">
                  {date.split("-").reverse().join("/")}
                  <button type="button" onClick={() => setSettings(s => ({ ...s, unavailableDates: s.unavailableDates.filter(d => d !== date) }))} className="text-red-400 hover:text-red-300">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {settings.unavailableDates.length === 0 && (
                <p className="text-xs text-zinc-600">Nenhum dia bloqueado.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-b border-zinc-800 pb-8">
        <Button onClick={handleSave} disabled={isSaving} className="h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-wider rounded-xl">
          {isSaving ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </div>

      {/* Bloqueio Manual Específico */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-5 h-5 text-red-500" />
          <h3 className="text-lg font-bold text-white">Bloqueio Manual de Horário</h3>
        </div>
        <p className="text-xs text-zinc-400 mb-4">
          Utilize esta opção para bloquear horários específicos da sua agenda (ex: ida ao médico das 14h às 15h). 
          Isso criará um agendamento falso bloqueando o slot.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="text-xs font-bold text-white uppercase tracking-wider block mb-1">Data</label>
            <Input type="date" value={blockDate} onChange={(e) => setBlockDate(e.target.value)} className="bg-zinc-900 border-zinc-800 h-11 text-white" />
          </div>
          <div>
            <label className="text-xs font-bold text-white uppercase tracking-wider block mb-1">Início</label>
            <Input type="time" value={blockStart} onChange={(e) => setBlockStart(e.target.value)} className="bg-zinc-900 border-zinc-800 h-11 text-white" />
          </div>
          <div>
            <label className="text-xs font-bold text-white uppercase tracking-wider block mb-1">Fim</label>
            <Input type="time" value={blockEnd} onChange={(e) => setBlockEnd(e.target.value)} className="bg-zinc-900 border-zinc-800 h-11 text-white" />
          </div>
          <div className="flex items-end">
            <Button onClick={handleBlockSlot} disabled={isBlocking} className="h-11 w-full bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl">
              {isBlocking ? "Bloqueando..." : "Bloquear Horário"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
