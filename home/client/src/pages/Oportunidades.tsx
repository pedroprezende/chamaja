import { useState, useEffect, useMemo } from "react";
import { Link } from "wouter";
import {
  Briefcase,
  Search,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  Users,
  Filter,
  ArrowRight,
  Sparkles,
  PlusCircle,
  X,
  SlidersHorizontal,
  ChevronDown,
  Building2,
  Tag,
  Compass,
  CheckCircle2,
  Layers,
  Sun,
  Sunset,
  Moon,
  RotateCcw,
  Star,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { categories, subcategoriesByCategory, type Category, type Subcategory } from "../../../../data/mock";
import { supabase, getSessionToken } from "@/lib/supabase";

// Helper to format time ago in Portuguese
function formatTimeAgo(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "recentemente";
  const date = new Date(dateInput);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 2) return "agora mesmo";
  if (diffInMinutes < 60) return `há ${diffInMinutes} min`;
  if (diffInHours === 1) return "há 1 hora";
  if (diffInHours < 24) return `há ${diffInHours} horas`;
  if (diffInDays === 1) return "ontem";
  if (diffInDays < 7) return `há ${diffInDays} dias`;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

// Helper to format start date friendly
function formatFriendlyDate(dateStr: string): string {
  if (!dateStr) return "";
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const todayStr = `${yyyy}-${mm}-${dd}`;

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tY = tomorrow.getFullYear();
  const tM = String(tomorrow.getMonth() + 1).padStart(2, "0");
  const tD = String(tomorrow.getDate()).padStart(2, "0");
  const tomorrowStr = `${tY}-${tM}-${tD}`;

  if (dateStr === todayStr) return "Hoje";
  if (dateStr === tomorrowStr) return "Amanhã";

  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

export default function Oportunidades() {
  // Auth & Session
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [hasCompatibilityProfile, setHasCompatibilityProfile] = useState(false);

  // Data states
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // User Geolocation
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // 7 Filter states + Compatibility Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("todos");
  const [selectedSubcategory, setSelectedSubcategory] = useState("todos");
  const [selectedCity, setSelectedCity] = useState("Todas");
  const [dateFilter, setDateFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState<"qualquer" | "manha" | "tarde" | "noite">("qualquer");
  const [minBudget, setMinBudget] = useState<number | undefined>(undefined);
  const [selectedPaymentType, setSelectedPaymentType] = useState("todos");
  const [maxDistanceKm, setMaxDistanceKm] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState<"recent" | "compatibility" | "budget_desc" | "budget_asc" | "distance" | "date_asc">("recent");
  const [onlyCompatible, setOnlyCompatible] = useState(false);

  // Initialize auth
  useEffect(() => {
    const initAuth = async () => {
      const token = await getSessionToken();
      setSessionToken(token);
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
    };
    initAuth();
  }, []);

  // Get user geolocation on load or manual request
  const requestLocation = () => {
    if (navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
          setIsLocating(false);
        },
        (err) => {
          console.warn("Geolocalização não autorizada no navegador:", err.message);
          setIsLocating(false);
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    }
  };

  useEffect(() => {
    requestLocation();
  }, []);

  // Available subcategories for current category
  const availableSubcategories = useMemo(() => {
    if (selectedCategory === "todos") return [];
    return subcategoriesByCategory[selectedCategory] || [];
  }, [selectedCategory]);

  // Reset subcategory when category changes
  const handleCategoryChange = (catId: string) => {
    setSelectedCategory(catId);
    setSelectedSubcategory("todos");
  };

  const fetchOpportunities = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const inputObj: any = {
        status: "ativa",
        limit: 50,
        sortBy: sortBy,
      };

      if (searchTerm.trim()) inputObj.search = searchTerm.trim();
      if (selectedCategory !== "todos") inputObj.categoryId = selectedCategory;
      if (selectedSubcategory !== "todos") inputObj.subcategoryId = selectedSubcategory;
      if (selectedCity !== "Todas") inputObj.city = selectedCity;
      if (dateFilter !== "all") inputObj.dateFilter = dateFilter;
      if (timeFilter !== "qualquer") inputObj.timeFilter = timeFilter;
      if (selectedPaymentType !== "todos") inputObj.paymentType = selectedPaymentType;
      if (minBudget && minBudget > 0) inputObj.minBudget = minBudget;
      if (onlyCompatible) inputObj.onlyCompatible = true;
      if (user?.id) inputObj.professionalUserId = user.id;

      if (userCoords) {
        inputObj.latitude = userCoords.lat;
        inputObj.longitude = userCoords.lng;
        if (maxDistanceKm && maxDistanceKm > 0) {
          inputObj.maxDistanceKm = maxDistanceKm;
        }
      }

      const headers: Record<string, string> = {};
      if (sessionToken) {
        headers["Authorization"] = `Bearer ${sessionToken}`;
      }

      const url = `/api/trpc/needs.list?input=${encodeURIComponent(JSON.stringify(inputObj))}`;
      const res = await fetch(url, { headers });
      if (res.ok) {
        const json = await res.json();
        const data = Array.isArray(json)
          ? json[0]?.result?.data
          : json?.result?.data;
        if (data && Array.isArray(data.items)) {
          setOpportunities(data.items);
          setHasCompatibilityProfile(!!data.hasCompatibilityProfile);
          setIsLoading(false);
          return;
        }
      }
      setOpportunities([]);
    } catch (e: any) {
      console.error("Erro ao buscar oportunidades:", e);
      setError(e.message || "Erro de conexão ao buscar oportunidades.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, [
    selectedCategory,
    selectedSubcategory,
    selectedCity,
    dateFilter,
    timeFilter,
    selectedPaymentType,
    minBudget,
    maxDistanceKm,
    sortBy,
    onlyCompatible,
    userCoords,
    sessionToken,
    user?.id,
  ]);

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchOpportunities();
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const paymentLabels: Record<string, string> = {
    total: "Valor Total",
    diaria: "Por Diária",
    hora: "Por Hora",
    a_combinar: "A Combinar",
  };

  const citiesList = [
    "Todas",
    "Bragança Paulista",
    "Atibaia",
    "Extrema",
    "Itatiba",
    "Campinas",
    "São Paulo",
  ];

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("todos");
    setSelectedSubcategory("todos");
    setSelectedCity("Todas");
    setDateFilter("all");
    setTimeFilter("qualquer");
    setSelectedPaymentType("todos");
    setMinBudget(undefined);
    setMaxDistanceKm(undefined);
    setSortBy("recent");
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchTerm !== "") count++;
    if (selectedCategory !== "todos") count++;
    if (selectedSubcategory !== "todos") count++;
    if (selectedCity !== "Todas") count++;
    if (dateFilter !== "all") count++;
    if (timeFilter !== "qualquer") count++;
    if (selectedPaymentType !== "todos") count++;
    if (minBudget !== undefined) count++;
    if (maxDistanceKm !== undefined) count++;
    return count;
  }, [
    searchTerm,
    selectedCategory,
    selectedSubcategory,
    selectedCity,
    dateFilter,
    timeFilter,
    selectedPaymentType,
    minBudget,
    maxDistanceKm,
  ]);

  const isFilterActive = activeFiltersCount > 0 || sortBy !== "recent";

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
                className="text-primary font-bold transition flex items-center gap-1.5"
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
                href="/como-funciona"
                className="text-zinc-400 hover:text-white transition"
              >
                Como Funciona
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/publicar-necessidade">
              <Button className="bg-primary hover:bg-primary/90 text-black font-black text-xs md:text-sm px-5 h-10 rounded-xl shadow-lg shadow-primary/10 flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                <span>Publicar Necessidade</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero Banner ── */}
      <section className="bg-gradient-to-b from-zinc-950 to-[#070708] border-b border-zinc-900 py-10 md:py-14">
        <div className="container mx-auto px-4 lg:px-8 max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full">
                <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
                <span className="text-primary text-xs font-bold uppercase tracking-wider">
                  Mural de Oportunidades
                </span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
                Encontre Serviços & Demandas
              </h1>
              <p className="text-zinc-400 text-sm md:text-base leading-relaxed">
                Filtre por categoria, cidade, turno, valor e distância.
                Negocie valores e combine os detalhes diretamente pelo WhatsApp.
              </p>
            </div>

            <div className="flex items-center gap-4 bg-zinc-950 border border-zinc-800 rounded-2xl p-4 md:p-6 shadow-xl">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Briefcase className="h-6 w-6" />
              </div>
              <div>
                <span className="text-2xl font-black text-white font-mono block">
                  {opportunities.length}
                </span>
                <span className="text-xs text-zinc-400 font-semibold">
                  {opportunities.length === 1
                    ? "Demanda ativa disponível"
                    : "Demandas ativas disponíveis"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main Content Grid (Filters Sidebar + Opportunities Feed) ── */}
      <main className="flex-1 py-8 md:py-12">
        <div className="container mx-auto px-4 lg:px-8 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* ── Left Column: Filters Sidebar (4 cols) ── */}
            <aside className="lg:col-span-4 space-y-6">
              <div className="bg-zinc-950 border border-zinc-800/80 rounded-3xl p-6 shadow-xl space-y-6 sticky top-24">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
                  <div className="flex items-center gap-2 text-white font-bold text-base">
                    <SlidersHorizontal className="h-4 w-4 text-primary" />
                    <span>Filtros de Oportunidades</span>
                    {activeFiltersCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-primary text-black text-[11px] font-black">
                        {activeFiltersCount}
                      </span>
                    )}
                  </div>
                  {isFilterActive && (
                    <button
                      onClick={clearFilters}
                      className="text-xs text-zinc-400 hover:text-primary transition font-bold flex items-center gap-1"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Limpar</span>
                    </button>
                  )}
                </div>

                {/* 1. Search Term */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Buscar por palavra-chave
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Ex: Eletricista, pintor, calha..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 focus:border-primary rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none transition"
                    />
                  </div>
                </div>

                {/* 2. Category Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Categoria
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-primary rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none transition cursor-pointer"
                  >
                    <option value="todos">Todas as Categorias</option>
                    {categories.map((cat: Category) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Subcategory Selector (Dynamic based on Category) */}
                {selectedCategory !== "todos" && availableSubcategories.length > 0 && (
                  <div className="space-y-2 animate-in fade-in duration-200">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-primary" />
                      <span>Especialidade / Subcategoria</span>
                    </label>
                    <select
                      value={selectedSubcategory}
                      onChange={(e) => setSelectedSubcategory(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 focus:border-primary rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none transition cursor-pointer"
                    >
                      <option value="todos">Todas as Especialidades</option>
                      {availableSubcategories.map((sub: Subcategory) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* 4. City Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Cidade
                  </label>
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-primary rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none transition cursor-pointer"
                  >
                    {citiesList.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 5. Date Filter Presets */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Data do Serviço
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: "all", label: "Todas as datas" },
                      { key: "today", label: "Hoje" },
                      { key: "tomorrow", label: "Amanhã" },
                      { key: "week", label: "Esta semana" },
                    ].map((d) => (
                      <button
                        key={d.key}
                        onClick={() => setDateFilter(d.key)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition border text-center ${
                          dateFilter === d.key
                            ? "bg-primary text-black border-primary font-black shadow-md shadow-primary/20"
                            : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 6. Shift / Time Filter */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Turno / Horário
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: "qualquer", label: "Qualquer", icon: Clock },
                      { key: "manha", label: "Manhã", icon: Sun },
                      { key: "tarde", label: "Tarde", icon: Sunset },
                      { key: "noite", label: "Noite", icon: Moon },
                    ].map((t) => {
                      const Icon = t.icon;
                      const isSelected = timeFilter === t.key;
                      return (
                        <button
                          key={t.key}
                          onClick={() => setTimeFilter(t.key as any)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold transition border flex items-center justify-center gap-1.5 ${
                            isSelected
                              ? "bg-primary text-black border-primary font-black shadow-md shadow-primary/20"
                              : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          <span>{t.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 7. Minimum Budget & Payment Type Filter */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Valor Mínimo Oferecido
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { label: "Todos", val: undefined },
                      { label: "R$ 100+", val: 100 },
                      { label: "R$ 300+", val: 300 },
                      { label: "R$ 500+", val: 500 },
                    ].map((b, idx) => (
                      <button
                        key={idx}
                        onClick={() => setMinBudget(b.val)}
                        className={`py-2 rounded-xl text-[11px] font-bold border transition text-center ${
                          minBudget === b.val
                            ? "bg-primary text-black border-primary font-black"
                            : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                        }`}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 8. Distance Radius Filter (using real coordinates) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Compass className="h-3.5 w-3.5 text-primary" />
                      <span>Raio de Distância</span>
                    </label>
                    <span className="text-[11px] font-mono text-primary font-bold">
                      {maxDistanceKm ? `${maxDistanceKm} km` : "Qualquer"}
                    </span>
                  </div>

                  {userCoords ? (
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { label: "Todas", val: undefined },
                        { label: "10 km", val: 10 },
                        { label: "25 km", val: 25 },
                        { label: "50 km", val: 50 },
                      ].map((dist, idx) => (
                        <button
                          key={idx}
                          onClick={() => setMaxDistanceKm(dist.val)}
                          className={`py-2 rounded-xl text-[11px] font-bold border transition text-center ${
                            maxDistanceKm === dist.val
                              ? "bg-primary text-black border-primary font-black"
                              : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                          }`}
                        >
                          {dist.label}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <button
                      onClick={requestLocation}
                      disabled={isLocating}
                      className="w-full py-2.5 px-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-primary/50 text-xs text-zinc-400 hover:text-white flex items-center justify-center gap-2 transition"
                    >
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      <span>{isLocating ? "Obtendo localização..." : "Ativar GPS para filtrar por distância"}</span>
                    </button>
                  )}
                </div>
              </div>
            </aside>

            {/* ── Right Column: Opportunities Feed (8 cols) ── */}
            <div className="lg:col-span-8 space-y-6">
              {/* Sort & Status Summary Bar */}
              <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-zinc-400 font-semibold">
                    Mostrando{" "}
                    <strong className="text-white font-bold">
                      {opportunities.length}
                    </strong>{" "}
                    oportunidade{opportunities.length === 1 ? "" : "s"}
                  </span>

                  {/* Compatibility filter button if user has profile */}
                  {hasCompatibilityProfile && (
                    <button
                      onClick={() => setOnlyCompatible(!onlyCompatible)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                        onlyCompatible
                          ? "bg-primary text-black border-primary font-black shadow-md shadow-primary/10"
                          : "bg-primary/10 border-primary/30 text-primary hover:bg-primary/20"
                      }`}
                    >
                      <Star className="h-3.5 w-3.5" />
                      <span>{onlyCompatible ? "Mostrando apenas compatíveis" : "⭐ Compatíveis comigo"}</span>
                    </button>
                  )}

                  {/* Active filters pill badges */}
                  {selectedCategory !== "todos" && (
                    <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded-md text-[10px] text-zinc-300 flex items-center gap-1">
                      <span>Cat: {selectedCategory}</span>
                      <X className="h-3 w-3 cursor-pointer" onClick={() => handleCategoryChange("todos")} />
                    </span>
                  )}
                  {selectedCity !== "Todas" && (
                    <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded-md text-[10px] text-zinc-300 flex items-center gap-1">
                      <span>{selectedCity}</span>
                      <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedCity("Todas")} />
                    </span>
                  )}
                  {dateFilter !== "all" && (
                    <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded-md text-[10px] text-zinc-300 flex items-center gap-1">
                      <span>Data: {dateFilter}</span>
                      <X className="h-3 w-3 cursor-pointer" onClick={() => setDateFilter("all")} />
                    </span>
                  )}
                  {timeFilter !== "qualquer" && (
                    <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded-md text-[10px] text-zinc-300 flex items-center gap-1">
                      <span>Turno: {timeFilter}</span>
                      <X className="h-3 w-3 cursor-pointer" onClick={() => setTimeFilter("qualquer")} />
                    </span>
                  )}
                  {maxDistanceKm && (
                    <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded-md text-[10px] text-primary flex items-center gap-1">
                      <span>≤ {maxDistanceKm}km</span>
                      <X className="h-3 w-3 cursor-pointer" onClick={() => setMaxDistanceKm(undefined)} />
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-zinc-500 font-bold">Ordenar:</span>
                  <select
                    value={sortBy}
                    onChange={(e: any) => setSortBy(e.target.value)}
                    className="bg-zinc-900 border border-zinc-800 text-white rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="recent">Relevância / Mais Recentes</option>
                    <option value="compatibility">Mais Compatíveis Primeiro</option>
                    <option value="budget_desc">Maior Valor</option>
                    <option value="budget_asc">Menor Valor</option>
                    <option value="date_asc">Data Mais Próxima</option>
                    {userCoords && <option value="distance">Mais Próximas de Mim</option>}
                  </select>
                </div>
              </div>

              {/* Top Banner: Availability Status / Customization */}
              {user && hasCompatibilityProfile ? (
                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">
                        Destaques de compatibilidade ativados
                      </h4>
                      <p className="text-[11px] text-zinc-400">
                        Oportunidades com o selo verde são compatíveis com suas categorias, cidades e horários cadastrados.
                      </p>
                    </div>
                  </div>
                  <Link href="/disponibilidade">
                    <Button variant="outline" className="border-primary/30 hover:bg-primary/10 text-primary text-xs h-8 px-3 rounded-xl shrink-0">
                      Ajustar Disponibilidade
                    </Button>
                  </Link>
                </div>
              ) : user ? (
                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                      <SlidersHorizontal className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">
                        Personalize suas oportunidades
                      </h4>
                      <p className="text-[11px] text-zinc-400">
                        Configure suas cidades de atendimento, serviços e turnos para receber destaques personalizados.
                      </p>
                    </div>
                  </div>
                  <Link href="/disponibilidade">
                    <Button className="bg-primary text-black font-black hover:bg-primary/90 text-xs h-8 px-3 rounded-xl shrink-0">
                      Configurar Agora
                    </Button>
                  </Link>
                </div>
              ) : null}

              {/* Opportunities List / Cards */}
              {isLoading ? (
                <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-16 flex flex-col items-center justify-center gap-4 text-center">
                  <div className="w-12 h-12 border-4 border-zinc-800 border-t-primary rounded-full animate-spin"></div>
                  <p className="text-zinc-400 font-semibold text-sm">
                    Filtrando oportunidades disponíveis...
                  </p>
                </div>
              ) : error ? (
                <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-16 text-center space-y-4">
                  <p className="text-red-400 font-bold">{error}</p>
                  <Button
                    onClick={fetchOpportunities}
                    className="bg-primary text-black font-bold"
                  >
                    Tentar Novamente
                  </Button>
                </div>
              ) : opportunities.length === 0 ? (
                <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-16 text-center space-y-4 shadow-xl">
                  <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600 mx-auto">
                    <Briefcase className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    Nenhuma oportunidade encontrada
                  </h3>
                  <p className="text-zinc-400 text-sm max-w-md mx-auto leading-relaxed">
                    Não encontramos nenhuma necessidade com os filtros selecionados (categoria, cidade, data, turno, valor ou distância).
                  </p>
                  <div className="pt-2">
                    <Button
                      onClick={clearFilters}
                      variant="outline"
                      className="border-zinc-800 hover:bg-zinc-900 text-white flex items-center gap-2 mx-auto"
                    >
                      <RotateCcw className="h-4 w-4 text-primary" />
                      <span>Limpar Todos os Filtros</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {opportunities.map((opp) => (
                    <Link
                      key={opp.id}
                      href={`/necessidade/${opp.id}`}
                      className="group block"
                    >
                      <div className={`border rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col justify-between h-full space-y-4 ${
                        opp.isCompatible
                          ? "bg-zinc-950 border-primary/40 hover:border-primary shadow-primary/5 ring-1 ring-primary/20"
                          : "bg-zinc-950 border-zinc-800/90 hover:border-primary/60 hover:shadow-primary/5"
                      }`}>
                        {/* Highlight badge for compatible opportunities (Etapa 12) */}
                        {opp.isCompatible && (
                          <div className="bg-primary/10 border border-primary/30 rounded-xl px-3 py-2 flex items-center justify-between gap-2 text-primary text-xs font-black">
                            <div className="flex items-center gap-1.5">
                              <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                              <span>✓ Compatível com você</span>
                            </div>
                            {opp.compatibilityReasons && opp.compatibilityReasons.length > 0 && (
                              <span className="text-[10px] text-zinc-400 font-semibold truncate max-w-[200px]">
                                {opp.compatibilityReasons.join(" • ")}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Card Header: Category & Publication Time */}
                        <div className="flex items-center justify-between gap-2 border-b border-zinc-900 pb-3">
                          <div className="flex flex-wrap items-center gap-2">
                            {opp.category && (
                              <span className="px-2.5 py-1 bg-primary/10 border border-primary/20 text-primary rounded-lg text-[10px] font-black uppercase tracking-wider">
                                {opp.category}
                              </span>
                            )}
                            {opp.subcategoryName && (
                              <span className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg text-[10px] font-semibold">
                                {opp.subcategoryName}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-zinc-500 font-medium">
                            {formatTimeAgo(opp.createdAt)}
                          </span>
                        </div>

                        {/* Title & Description */}
                        <div className="space-y-2">
                          <h2 className="text-lg font-black text-white group-hover:text-primary transition leading-snug line-clamp-2">
                            {opp.title}
                          </h2>
                          <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                            {opp.description}
                          </p>
                        </div>

                        {/* Metadata Grid */}
                        <div className="grid grid-cols-2 gap-2 text-xs text-zinc-300 pt-1">
                          <div className="flex items-center gap-1.5 text-zinc-400">
                            <MapPin className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                            <span className="truncate">
                              {opp.neighborhood
                                ? `${opp.neighborhood}, ${opp.city}`
                                : opp.city}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-zinc-400">
                            <Calendar className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />
                            <span>{formatFriendlyDate(opp.startDate)}</span>
                          </div>

                          {(opp.startTime || opp.endTime) && (
                            <div className="flex items-center gap-1.5 text-zinc-400">
                              <Clock className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
                              <span>
                                {opp.startTime || "--:--"} às{" "}
                                {opp.endTime || "--:--"}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center gap-1.5 text-zinc-400">
                            <Users className={`h-3.5 w-3.5 flex-shrink-0 ${opp.filledSpots > 0 ? "text-amber-400" : "text-primary"}`} />
                            <span className={opp.filledSpots > 0 ? "text-amber-400 font-bold" : "text-zinc-300"}>
                              {opp.filledSpots} de {opp.requiredProfessionals} vagas
                              {opp.filledSpots > 0
                                ? ` (${opp.requiredProfessionals - opp.filledSpots} restante${opp.requiredProfessionals - opp.filledSpots === 1 ? "" : "s"})`
                                : ""}
                            </span>
                          </div>
                        </div>

                        {/* Distance if available */}
                        {opp.distanceStr && (
                          <div className="inline-flex items-center gap-1.5 text-xs text-primary font-bold">
                            <Compass className="h-3.5 w-3.5" />
                            <span>{opp.distanceStr}</span>
                          </div>
                        )}

                        {/* Requirements snippet if present */}
                        {opp.requirements && (
                          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl px-3 py-2 text-[11px] text-zinc-400 flex items-start gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5 text-zinc-500 flex-shrink-0 mt-0.5" />
                            <span className="line-clamp-1">
                              Req: {opp.requirements}
                            </span>
                          </div>
                        )}

                        {/* Card Footer: Budget Offer & CTA */}
                        <div className="border-t border-zinc-900 pt-3 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">
                              Valor Oferecido
                            </span>
                            <div className="flex items-baseline gap-1.5">
                              {opp.paymentType === "a_combinar" || !opp.budget ? (
                                <span className="text-sm font-black text-white">
                                  A Combinar
                                </span>
                              ) : (
                                <span className="text-base font-black text-primary font-mono">
                                  R${" "}
                                  {Number(opp.budget)
                                    .toFixed(2)
                                    .replace(".", ",")}
                                </span>
                              )}
                              <span className="text-[11px] text-zinc-500 font-medium">
                                (
                                {paymentLabels[opp.paymentType] ||
                                  opp.paymentType}
                                )
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 text-xs font-black text-primary group-hover:translate-x-1 transition duration-200">
                            <span>Ver Detalhes</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
