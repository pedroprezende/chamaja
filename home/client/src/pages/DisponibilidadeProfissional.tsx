import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  Briefcase,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  SlidersHorizontal,
  Plus,
  X,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Building2,
  Layers,
  Save,
  Check,
  Compass,
  Sun,
  Sunset,
  Moon,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { categories, subcategoriesByCategory, type Category } from "../../../../data/mock";
import { toast } from "sonner";
import { supabase, getSessionToken } from "@/lib/supabase";

const ALL_DAYS = [
  { key: "seg", label: "Seg", full: "Segunda-feira" },
  { key: "ter", label: "Ter", full: "Terça-feira" },
  { key: "qua", label: "Qua", full: "Quarta-feira" },
  { key: "qui", label: "Qui", full: "Quinta-feira" },
  { key: "sex", label: "Sex", full: "Sexta-feira" },
  { key: "sab", label: "Sáb", full: "Sábado" },
  { key: "dom", label: "Dom", full: "Domingo" },
];

const ALL_SHIFTS = [
  { key: "manha", label: "Manhã", sub: "Até 12h", icon: Sun },
  { key: "tarde", label: "Tarde", sub: "12h às 18h", icon: Sunset },
  { key: "noite", label: "Noite", sub: "Após 18h", icon: Moon },
];

const DEFAULT_CITIES = [
  "Bragança Paulista",
  "Atibaia",
  "Extrema",
  "Itatiba",
  "Campinas",
  "São Paulo",
  "Piracaia",
  "Jarinu",
];

const DISTANCE_PRESETS = [10, 20, 30, 50, 100];

export default function DisponibilidadeProfissional() {
  const [, setLocation] = useLocation();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);

  // Form State
  const [isAvailable, setIsAvailable] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>(["Bragança Paulista"]);
  const [customCityInput, setCustomCityInput] = useState("");
  const [maxDistanceKm, setMaxDistanceKm] = useState(30);
  const [availableDays, setAvailableDays] = useState<string[]>(["seg", "ter", "qua", "qui", "sex"]);
  const [selectedShifts, setSelectedShifts] = useState<string[]>(["manha", "tarde"]);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("18:00");
  const [notes, setNotes] = useState("");

  const [providerInfo, setProviderInfo] = useState<{
    hasProviderProfile: boolean;
    providerName: string;
    providerCategory: string;
    providerCity: string;
  } | null>(null);

  // Auth check and load data
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      const token = await getSessionToken();
      setSessionToken(token);

      const { data: userData } = await supabase.auth.getUser();
      setUser(userData?.user || null);

      if (token) {
        try {
          const res = await fetch("/api/trpc/providers.getOpportunityAvailability", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (res.ok) {
            const json = await res.json();
            const data = json.result?.data;
            if (data) {
              setIsAvailable(data.isAvailable ?? true);
              setSelectedCategories(data.categories || []);
              setSelectedSubcategories(data.subcategories || []);
              setSelectedCities(
                data.cities && data.cities.length > 0 ? data.cities : ["Bragança Paulista"]
              );
              setMaxDistanceKm(data.maxDistanceKm || 30);
              setAvailableDays(
                data.availableDays && data.availableDays.length > 0
                  ? data.availableDays
                  : ["seg", "ter", "qua", "qui", "sex"]
              );
              setSelectedShifts(
                data.shifts && data.shifts.length > 0 ? data.shifts : ["manha", "tarde"]
              );
              setStartTime(data.startTime || "08:00");
              setEndTime(data.endTime || "18:00");
              setNotes(data.notes || "");

              setProviderInfo({
                hasProviderProfile: data.hasProviderProfile,
                providerName: data.providerName || userData?.user?.user_metadata?.name || "",
                providerCategory: data.providerCategory || "",
                providerCity: data.providerCity || "",
              });
            }
          }
        } catch (e) {
          console.error("Erro ao buscar disponibilidade:", e);
        }
      }
      setIsLoading(false);
    };

    init();
  }, []);

  const toggleCategory = (catName: string) => {
    setSelectedCategories((prev) =>
      prev.includes(catName) ? prev.filter((c) => c !== catName) : [...prev, catName]
    );
  };

  const toggleCity = (city: string) => {
    setSelectedCities((prev) =>
      prev.includes(city)
        ? prev.length > 1
          ? prev.filter((c) => c !== city)
          : prev
        : [...prev, city]
    );
  };

  const addCustomCity = () => {
    const trimmed = customCityInput.trim();
    if (!trimmed) return;
    if (!selectedCities.includes(trimmed)) {
      setSelectedCities((prev) => [...prev, trimmed]);
    }
    setCustomCityInput("");
  };

  const toggleDay = (dayKey: string) => {
    setAvailableDays((prev) =>
      prev.includes(dayKey)
        ? prev.length > 1
          ? prev.filter((d) => d !== dayKey)
          : prev
        : [...prev, dayKey]
    );
  };

  const selectPresetDays = (type: "weekdays" | "all" | "weekend") => {
    if (type === "weekdays") {
      setAvailableDays(["seg", "ter", "qua", "qui", "sex"]);
    } else if (type === "weekend") {
      setAvailableDays(["sab", "dom"]);
    } else {
      setAvailableDays(["seg", "ter", "qua", "qui", "sex", "sab", "dom"]);
    }
  };

  const toggleShift = (shiftKey: string) => {
    setSelectedShifts((prev) =>
      prev.includes(shiftKey)
        ? prev.length > 1
          ? prev.filter((s) => s !== shiftKey)
          : prev
        : [...prev, shiftKey]
    );
  };

  const handleSave = async () => {
    if (!sessionToken) {
      toast.error("Você precisa estar logado para salvar sua disponibilidade.");
      return;
    }

    if (selectedCategories.length === 0) {
      toast.warning("Selecione ao menos uma categoria de serviço.");
      return;
    }

    if (selectedCities.length === 0) {
      toast.warning("Selecione ao menos uma cidade de atendimento.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/trpc/providers.updateOpportunityAvailability", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          isAvailable,
          categories: selectedCategories,
          subcategories: selectedSubcategories,
          cities: selectedCities,
          maxDistanceKm,
          availableDays,
          shifts: selectedShifts,
          startTime,
          endTime,
          notes: notes.trim(),
        }),
      });

      if (res.ok) {
        toast.success("Disponibilidade salva com sucesso!");
      } else {
        const json = await res.json();
        toast.error(json.error?.message || "Erro ao salvar disponibilidade.");
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Falha na conexão ao salvar.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070708] text-foreground flex flex-col font-sans selection:bg-primary/30 selection:text-white">
      {/* ── Top Header ── */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-zinc-900">
        <div className="container mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <img
                src="/assets/images/logo-xamaja.png"
                alt="XamaJá"
                className="h-8 w-auto object-contain"
              />
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-sm font-semibold">
              <Link
                href="/oportunidades"
                className="text-zinc-400 hover:text-white transition flex items-center gap-1.5"
              >
                <Briefcase className="h-4 w-4" />
                <span>Oportunidades</span>
              </Link>
              <Link
                href="/minhas-necessidades"
                className="text-zinc-400 hover:text-white transition"
              >
                Minhas Publicações
              </Link>
              <Link
                href="/disponibilidade"
                className="text-primary font-bold transition flex items-center gap-1.5"
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span>Disponibilidade</span>
              </Link>
              <Link
                href="/parceiro"
                className="text-zinc-400 hover:text-white transition"
              >
                Painel do Parceiro
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleSave}
              disabled={isSaving || isLoading}
              className="bg-primary hover:bg-primary/90 text-black font-black text-xs md:text-sm px-6 h-10 rounded-xl shadow-lg shadow-primary/10 flex items-center gap-2"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>Salvar Alterações</span>
            </Button>
          </div>
        </div>
      </header>

      {/* ── Hero Banner ── */}
      <section className="bg-gradient-to-b from-zinc-950 to-[#070708] border-b border-zinc-900 py-10 md:py-12">
        <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span className="text-primary text-xs font-bold uppercase tracking-wider">
                  Configuração de Trabalho
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                Minha Disponibilidade para Oportunidades
              </h1>
              <p className="text-zinc-400 text-sm md:text-base leading-relaxed">
                Configure suas categorias de atuação, cidades de atendimento, raio máximo de deslocamento e horários para receber e aceitar serviços compatíveis.
              </p>
            </div>

            {/* Availability Master Toggle Card */}
            <div
              onClick={() => setIsAvailable(!isAvailable)}
              className={`cursor-pointer border rounded-2xl p-5 transition duration-200 flex items-center gap-4 ${
                isAvailable
                  ? "bg-primary/10 border-primary/40 shadow-lg shadow-primary/5"
                  : "bg-zinc-950 border-zinc-800"
              }`}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold ${
                  isAvailable
                    ? "bg-primary text-black"
                    : "bg-zinc-900 text-zinc-500 border border-zinc-800"
                }`}
              >
                <Check className="h-6 w-6" />
              </div>
              <div>
                <span
                  className={`text-sm font-black block ${
                    isAvailable ? "text-primary" : "text-zinc-400"
                  }`}
                >
                  {isAvailable
                    ? "Estou disponível para oportunidades"
                    : "Pausado temporariamente"}
                </span>
                <span className="text-xs text-zinc-500 font-medium">
                  {isAvailable ? "Clique para pausar" : "Clique para ativar"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Form Body ── */}
      <main className="flex-1 py-10">
        <div className="container mx-auto px-4 lg:px-8 max-w-5xl space-y-8">
          {isLoading ? (
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-16 flex flex-col items-center justify-center gap-4 text-center">
              <div className="w-10 h-10 border-3 border-zinc-800 border-t-primary rounded-full animate-spin"></div>
              <p className="text-zinc-400 font-semibold text-sm">
                Carregando suas preferências de disponibilidade...
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* ── Card 1: Categorias & Especialidades ── */}
              <div className="bg-zinc-950 border border-zinc-800/90 rounded-3xl p-6 shadow-xl space-y-4 md:col-span-2">
                <div className="flex items-center gap-2.5 border-b border-zinc-900 pb-3">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <Layers className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">
                      Categorias & Serviços que realiza
                    </h2>
                    <p className="text-xs text-zinc-400">
                      Selecione todas as áreas onde você tem interesse e capacidade de atender.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {categories.map((cat: Category) => {
                    const isSelected =
                      selectedCategories.includes(cat.name) ||
                      selectedCategories.includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleCategory(cat.name)}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
                          isSelected
                            ? "bg-primary text-black border-primary font-black shadow-md shadow-primary/10"
                            : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700"
                        }`}
                      >
                        <span>{cat.name}</span>
                        {isSelected && <Check className="h-3.5 w-3.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── Card 2: Cidades e Regiões de Atendimento ── */}
              <div className="bg-zinc-950 border border-zinc-800/90 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-2.5 border-b border-zinc-900 pb-3">
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">
                      Cidades & Regiões atendidas
                    </h2>
                    <p className="text-xs text-zinc-400">
                      Municípios onde você aceita prestar serviços.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {DEFAULT_CITIES.map((city) => {
                    const isSelected = selectedCities.includes(city);
                    return (
                      <button
                        key={city}
                        type="button"
                        onClick={() => toggleCity(city)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                          isSelected
                            ? "bg-blue-500 text-white border-blue-500 font-black shadow-md shadow-blue-500/10"
                            : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white"
                        }`}
                      >
                        <span>{city}</span>
                        {isSelected && <Check className="h-3 w-3" />}
                      </button>
                    );
                  })}
                </div>

                {/* Add custom city */}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="Adicionar outra cidade..."
                    value={customCityInput}
                    onChange={(e) => setCustomCityInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addCustomCity()}
                    className="flex-1 bg-zinc-900 border border-zinc-800 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none"
                  />
                  <Button
                    type="button"
                    onClick={addCustomCity}
                    className="bg-zinc-900 hover:bg-zinc-800 text-blue-400 border border-zinc-800 h-9 px-3 rounded-xl"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* ── Card 3: Raio Máximo de Deslocamento ── */}
              <div className="bg-zinc-950 border border-zinc-800/90 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                      <Compass className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white">
                        Raio Máximo de Deslocamento
                      </h2>
                      <p className="text-xs text-zinc-400">
                        Distância limite a partir da sua base.
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-black text-amber-400 font-mono bg-amber-500/10 px-2.5 py-1 rounded-lg">
                    {maxDistanceKm} km
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-2 pt-2">
                  {DISTANCE_PRESETS.map((km) => {
                    const isSelected = maxDistanceKm === km;
                    return (
                      <button
                        key={km}
                        type="button"
                        onClick={() => setMaxDistanceKm(km)}
                        className={`py-2.5 rounded-xl text-xs font-bold border transition text-center ${
                          isSelected
                            ? "bg-amber-500 text-black border-amber-500 font-black shadow-md shadow-amber-500/10"
                            : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                        }`}
                      >
                        {km} km
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2">
                  <input
                    type="range"
                    min="5"
                    max="150"
                    step="5"
                    value={maxDistanceKm}
                    onChange={(e) => setMaxDistanceKm(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-500 font-bold pt-1">
                    <span>5 km (Local)</span>
                    <span>150 km (Regional)</span>
                  </div>
                </div>
              </div>

              {/* ── Card 4: Dias Disponíveis na Semana ── */}
              <div className="bg-zinc-950 border border-zinc-800/90 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white">
                        Dias Disponíveis
                      </h2>
                      <p className="text-xs text-zinc-400">
                        Dias em que você tem agenda livre.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => selectPresetDays("weekdays")}
                      className="text-[10px] bg-zinc-900 border border-zinc-800 hover:border-zinc-700 px-2 py-1 rounded-md text-zinc-400 hover:text-white"
                    >
                      Seg-Sex
                    </button>
                    <button
                      type="button"
                      onClick={() => selectPresetDays("all")}
                      className="text-[10px] bg-zinc-900 border border-zinc-800 hover:border-zinc-700 px-2 py-1 rounded-md text-zinc-400 hover:text-white"
                    >
                      Todos
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1.5 pt-2">
                  {ALL_DAYS.map((day) => {
                    const isSelected = availableDays.includes(day.key);
                    return (
                      <button
                        key={day.key}
                        type="button"
                        onClick={() => toggleDay(day.key)}
                        className={`h-11 rounded-xl text-xs font-black border transition flex items-center justify-center ${
                          isSelected
                            ? "bg-purple-500 text-white border-purple-500 shadow-md shadow-purple-500/10"
                            : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                        }`}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── Card 5: Turnos & Horários ── */}
              <div className="bg-zinc-950 border border-zinc-800/90 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-2.5 border-b border-zinc-900 pb-3">
                  <div className="p-2 rounded-xl bg-pink-500/10 text-pink-400">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">
                      Turnos & Horários
                    </h2>
                    <p className="text-xs text-zinc-400">
                      Períodos preferenciais para execução de serviços.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  {ALL_SHIFTS.map((shift) => {
                    const Icon = shift.icon;
                    const isSelected = selectedShifts.includes(shift.key);
                    return (
                      <button
                        key={shift.key}
                        type="button"
                        onClick={() => toggleShift(shift.key)}
                        className={`p-3 rounded-2xl border transition text-center space-y-1 ${
                          isSelected
                            ? "bg-pink-500/15 border-pink-500 text-pink-400 font-bold"
                            : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                        }`}
                      >
                        <Icon className="h-4 w-4 mx-auto" />
                        <span className="text-xs block font-bold">{shift.label}</span>
                        <span className="text-[10px] text-zinc-500 block">{shift.sub}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <div className="flex-1 flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2">
                    <span className="text-xs text-zinc-500 font-bold">Das:</span>
                    <input
                      type="text"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      placeholder="08:00"
                      className="w-full bg-transparent text-xs text-white font-bold focus:outline-none"
                    />
                  </div>
                  <span className="text-xs text-zinc-500 font-bold">até</span>
                  <div className="flex-1 flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2">
                    <span className="text-xs text-zinc-500 font-bold">Às:</span>
                    <input
                      type="text"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      placeholder="18:00"
                      className="w-full bg-transparent text-xs text-white font-bold focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* ── Card 6: Observações & Detalhes ── */}
              <div className="bg-zinc-950 border border-zinc-800/90 rounded-3xl p-6 shadow-xl space-y-3 md:col-span-2">
                <div className="flex items-center gap-2.5 border-b border-zinc-900 pb-3">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">
                      Observações & Informações Adicionais
                    </h2>
                    <p className="text-xs text-zinc-400">
                      Informações importantes sobre equipamentos próprios, equipe ou condições de atendimento.
                    </p>
                  </div>
                </div>

                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Possuo ferramentas completas, veículo utilitário próprio e disponibilidade para início imediato..."
                  rows={3}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-primary rounded-2xl p-4 text-xs text-white placeholder-zinc-500 focus:outline-none transition leading-relaxed resize-none"
                />
              </div>
            </div>
          )}

          {/* Bottom Save Action */}
          <div className="flex justify-end pt-4">
            <Button
              onClick={handleSave}
              disabled={isSaving || isLoading}
              className="bg-primary hover:bg-primary/90 text-black font-black text-sm px-8 h-12 rounded-xl shadow-xl shadow-primary/10 flex items-center gap-2"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>Salvar Configurações de Disponibilidade</span>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
