import { useState, useEffect, useRef } from "react";
import { useRoute, Link } from "wouter";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Users,
  AlertCircle,
  FileText,
  Camera,
  Share2,
  Check,
  ShieldCheck,
  PlusCircle,
  Briefcase,
  User,
  BadgeCheck,
  ThumbsUp,
  Send,
  X,
  Lock,
  Star,
  ExternalLink,
  ChevronRight,
  UserCheck,
  UserX,
  MessageSquare,
  DollarSign,
  LayoutDashboard,
  CheckCircle,
  XCircle,
  Clock3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getSessionToken, supabase } from "@/lib/supabase";

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
  if (diffInMinutes < 60) return `há ${diffInMinutes} minutos`;
  if (diffInHours === 1) return "há 1 hora";
  if (diffInHours < 24) return `há ${diffInHours} horas`;
  if (diffInDays === 1) return "ontem";
  if (diffInDays < 7) return `há ${diffInDays} dias`;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function DetalheNecessidade() {
  const [, params] = useRoute("/necessidade/:id");
  const [, paramsNeeds] = useRoute("/needs/:id");
  const needId = params?.id || paramsNeeds?.id;

  const [need, setNeed] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Application Modal States
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [applyMessage, setApplyMessage] = useState("");
  const [applyPrice, setApplyPrice] = useState("");
  const [applyTime, setApplyTime] = useState("");
  const [isSubmittingApply, setIsSubmittingApply] = useState(false);

  // Applications list for creator
  const [applications, setApplications] = useState<any[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (needId) {
      fetchNeedDetails(needId);
    }
  }, [needId]);

  const fetchApplications = async (id: string) => {
    setLoadingApps(true);
    try {
      const token = await getSessionToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const url = `/api/trpc/needs.listApplications?input=${encodeURIComponent(
        JSON.stringify({ needId: id })
      )}`;
      const res = await fetch(url, { headers });
      if (res.ok) {
        const json = await res.json();
        const data = Array.isArray(json)
          ? json[0]?.result?.data
          : json?.result?.data;
        if (Array.isArray(data)) {
          setApplications(data);
        }
      }
    } catch (e: any) {
      console.warn("Erro ao buscar candidaturas:", e);
    } finally {
      setLoadingApps(false);
    }
  };

  const fetchNeedDetails = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await getSessionToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const url = `/api/trpc/needs.getById?input=${encodeURIComponent(
        JSON.stringify({ id })
      )}`;
      const res = await fetch(url, { headers });
      if (res.ok) {
        const json = await res.json();
        const data = Array.isArray(json)
          ? json[0]?.result?.data
          : json?.result?.data;
        if (data) {
          setNeed(data);
          setIsLoading(false);
          if (data.isOwner) {
            fetchApplications(data.id);
          }
          return;
        }
      }
      setError("Necessidade não encontrada.");
    } catch (e: any) {
      console.error("Erro ao buscar necessidade:", e);
      setError(e.message || "Erro de conexão ao buscar necessidade.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptApp = async (appId: string) => {
    setActionLoadingId(appId);
    try {
      const token = await getSessionToken();
      const res = await fetch("/api/trpc/needs.acceptApplication", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ applicationId: appId }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        const errMsg = errJson?.error?.message || errJson?.message || "Erro ao aceitar candidatura.";
        throw new Error(errMsg);
      }

      toast.success("Candidatura aceita com sucesso!");
      setApplications((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, status: "aceita" } : a))
      );
      // Refresh need to update filled spots
      if (need) {
        fetchNeedDetails(need.id);
      }
    } catch (err: any) {
      console.error("Erro ao aceitar:", err);
      toast.error(err.message || "Não foi possível aceitar este profissional.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectApp = async (appId: string) => {
    setActionLoadingId(appId);
    try {
      const token = await getSessionToken();
      const res = await fetch("/api/trpc/needs.rejectApplication", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ applicationId: appId }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        const errMsg = errJson?.error?.message || errJson?.message || "Erro ao recusar candidatura.";
        throw new Error(errMsg);
      }

      toast.info("Candidatura recusada.");
      setApplications((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, status: "recusada" } : a))
      );
    } catch (err: any) {
      console.error("Erro ao recusar:", err);
      toast.error(err.message || "Não foi possível recusar esta proposta.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (need && mapContainerRef.current) {
      const L = (window as any).L;
      if (!L) return;

      const hasCoords = need.latitude && need.longitude;
      const lat = hasCoords ? Number(need.latitude) : -22.952;
      const lng = hasCoords ? Number(need.longitude) : -46.542;

      // Clean existing instance
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {}
        mapInstanceRef.current = null;
      }
      if ((mapContainerRef.current as any)._leaflet_id) {
        (mapContainerRef.current as any)._leaflet_id = null;
      }

      // Initialize map
      const map = L.map(mapContainerRef.current, {
        center: [lat, lng],
        zoom: 15,
        zoomControl: true,
        scrollWheelZoom: false,
      });

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        {
          attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
          maxZoom: 19,
        }
      ).addTo(map);

      // Custom green pin icon
      const greenPinIcon = L.divIcon({
        className: "custom-map-pin",
        html: `
          <div style="
            background-color: #25D366;
            width: 32px;
            height: 32px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(37, 211, 102, 0.4);
            border: 2px solid #FFFFFF;
          ">
            <div style="
              width: 10px;
              height: 10px;
              background-color: #000000;
              border-radius: 50%;
              transform: rotate(45deg);
            "></div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      const marker = L.marker([lat, lng], {
        icon: greenPinIcon,
      }).addTo(map);

      marker.bindPopup(
        `<div style="font-family:sans-serif;font-size:12px;font-weight:bold;color:#000;">
          ${need.title}<br/><span style="color:#666;font-weight:normal;">${need.city}</span>
        </div>`
      );

      mapInstanceRef.current = map;
    }
  }, [need]);

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success("Link da necessidade copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyClick = async () => {
    const token = await getSessionToken();
    if (!token) {
      setShowAuthModal(true);
      return;
    }

    if (need?.isOwner) {
      toast.error("Você é o autor desta necessidade e não pode se candidatar.");
      return;
    }

    if (need?.myApplication) {
      toast.info("Você já enviou interesse para esta oportunidade.");
      return;
    }

    if (need?.status !== "ativa") {
      toast.error(`Esta oportunidade está com status ${need?.status}.`);
      return;
    }

    if (need?.budget) {
      setApplyPrice(String(need.budget));
    }
    setShowApplyModal(true);
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!need) return;

    setIsSubmittingApply(true);
    try {
      const token = await getSessionToken();
      if (!token) {
        setShowAuthModal(true);
        setIsSubmittingApply(false);
        return;
      }

      const numericPrice = applyPrice ? parseFloat(applyPrice.replace(",", ".")) : undefined;

      const res = await fetch("/api/trpc/needs.applyToNeed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          needId: need.id,
          message: applyMessage.trim() || undefined,
          proposedPrice: numericPrice && !isNaN(numericPrice) ? numericPrice : undefined,
          estimatedTime: applyTime.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        const errMsg = errJson?.error?.message || errJson?.message || "Erro ao enviar interesse.";
        throw new Error(errMsg);
      }

      toast.success("Interesse enviado com sucesso! O contratante poderá entrar em contato.");
      setShowApplyModal(false);
      // Refresh need to display application status
      await fetchNeedDetails(need.id);
    } catch (err: any) {
      console.error("Erro ao candidatar-se:", err);
      toast.error(err.message || "Não foi possível enviar a candidatura.");
    } finally {
      setIsSubmittingApply(false);
    }
  };

  const paymentLabels: Record<string, string> = {
    total: "Valor Total",
    diaria: "Por Diária",
    hora: "Por Hora",
    a_combinar: "A Combinar",
  };

  const required = need?.requiredProfessionals || 1;
  const filled = need?.filledSpots || 0;
  const spotsAvailable = Math.max(0, required - filled);
  const isAvailable = spotsAvailable > 0 && need?.status === "ativa";
  const hasApplied = !!need?.myApplication;
  const isOwner = !!need?.isOwner;

  // Visual status computation
  const isClosed = need?.status === "encerrada" || filled >= required;
  const isPartial = need?.status === "ativa" && filled > 0 && filled < required;
  const isCancelled = need?.status === "cancelada" || need?.status === "pausada";

  const statusBadge = isCancelled
    ? {
        label: need?.status === "cancelada" ? "Cancelada" : "Pausada",
        dot: "⚪",
        className: "bg-zinc-800/60 border-zinc-700 text-zinc-400",
      }
    : isClosed
    ? {
        label: "Encerrada",
        dot: "🔴",
        className: "bg-red-500/10 border-red-500/20 text-red-400",
      }
    : isPartial
    ? {
        label: "Parcialmente Preenchida",
        dot: "🟡",
        className: "bg-amber-500/10 border-amber-500/20 text-amber-400",
      }
    : {
        label: "Aberta",
        dot: "🟢",
        className: "bg-primary/10 border-primary/20 text-primary",
      };

  // Metrics for contractor
  const pendingCount = applications.filter((a) => a.status === "pendente").length;
  const acceptedCount = applications.filter((a) => a.status === "aceita").length;
  const rejectedCount = applications.filter((a) => a.status === "recusada").length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070708] text-white flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-zinc-800 border-t-primary rounded-full animate-spin"></div>
        <p className="text-zinc-400 font-semibold text-sm">
          Carregando dados da oportunidade...
        </p>
      </div>
    );
  }

  if (error || !need) {
    return (
      <div className="min-h-screen bg-[#070708] text-white flex flex-col">
        {/* Header */}
        <header className="border-b border-zinc-800/80 bg-black/60 backdrop-blur-xl">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <img
                src="/assets/images/logo-xamaja.png"
                alt="XamaJá"
                className="h-8 w-auto object-contain"
              />
            </Link>
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-black text-white">
            Necessidade Não Encontrada
          </h1>
          <p className="text-zinc-400 text-sm max-w-md">
            {error || "O registro solicitado não existe ou foi removido."}
          </p>
          <div className="flex gap-3 pt-2">
            <Link href="/oportunidades">
              <Button variant="outline" className="border-zinc-700 text-white">
                Ver Oportunidades
              </Button>
            </Link>
            <Link href="/publicar-necessidade">
              <Button className="bg-primary text-black font-bold">
                Publicar Necessidade
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070708] text-foreground flex flex-col font-sans">
      {/* ── Top Header ── */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-zinc-900">
        <div className="container mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/oportunidades"
              className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white transition"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Oportunidades</span>
            </Link>
            <span className="text-zinc-700">/</span>
            <span className="text-xs text-zinc-500 font-semibold truncate max-w-[200px]">
              {need.title}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={copyShareLink}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold text-zinc-300 hover:text-white transition"
              title="Compartilhar"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-primary" />
                  <span className="text-primary">Copiado</span>
                </>
              ) : (
                <>
                  <Share2 className="h-3.5 w-3.5" />
                  <span>Compartilhar</span>
                </>
              )}
            </button>

            <Link href="/publicar-necessidade">
              <Button
                size="sm"
                className="bg-primary hover:bg-primary/90 text-black font-black text-xs rounded-xl shadow-md shadow-primary/20 flex items-center gap-1.5"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>Nova Necessidade</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main Content Container ── */}
      <main className="flex-1 py-8 md:py-12">
        <div className="container mx-auto px-4 lg:px-8 max-w-6xl space-y-8">
          {/* ── Hero Banner ── */}
          <div className="relative bg-zinc-950 border border-zinc-800/80 rounded-3xl p-6 md:p-10 overflow-hidden shadow-2xl">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                {/* 4-State Visual Badge (🟢, 🟡, 🔴, ⚪) */}
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 border rounded-full text-xs font-bold uppercase tracking-wider ${statusBadge.className}`}
                >
                  <span>{statusBadge.dot}</span>
                  <span>{statusBadge.label}</span>
                </span>

                {/* Vagas Status Pill: X de Y profissionais necessários */}
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    isAvailable
                      ? "bg-blue-500/10 border border-blue-500/20 text-blue-400"
                      : "bg-zinc-800 border border-zinc-700 text-zinc-400"
                  }`}
                >
                  <Users className="h-3.5 w-3.5" />
                  <span>
                    {filled} de {required} profissionais necessários
                  </span>
                </span>

                {need.category && (
                  <span className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-zinc-300 text-xs font-semibold">
                    {need.category}
                    {need.subcategoryName ? ` • ${need.subcategoryName}` : ""}
                  </span>
                )}

                <span className="text-zinc-600 text-xs font-mono ml-auto">
                  Publicado {formatTimeAgo(need.createdAt)}
                </span>
              </div>

              <h1 className="text-2xl md:text-4xl font-black text-white leading-tight">
                {need.title}
              </h1>

              <div className="flex flex-wrap items-center gap-6 pt-2 text-sm text-zinc-400">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>
                    {need.city}
                    {need.neighborhood ? `, ${need.neighborhood}` : ""}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span>Início: {need.startDate}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <span>
                    {spotsAvailable} vaga{spotsAvailable === 1 ? "" : "s"} restante{spotsAvailable === 1 ? "" : "s"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── PAINEL EXCLUSIVO DO CONTRATANTE (Métricas + Candidaturas) ── */}
          {isOwner && (
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
              {/* Topo do Painel */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-900 pb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <LayoutDashboard className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white">
                      Painel do Contratante
                    </h2>
                    <p className="text-xs text-zinc-400">
                      Acompanhe o preenchimento de vagas e gerencie os profissionais interessados.
                    </p>
                  </div>
                </div>

                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${statusBadge.className}`}>
                  {statusBadge.dot} {statusBadge.label}
                </span>
              </div>

              {/* Grid com as 6 Métricas do Contratante */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 text-center space-y-1">
                  <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                    Total de Vagas
                  </span>
                  <div className="text-2xl font-black text-white font-mono">{required}</div>
                </div>

                <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 text-center space-y-1">
                  <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                    Preenchidas
                  </span>
                  <div className="text-2xl font-black text-primary font-mono">{filled}</div>
                </div>

                <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 text-center space-y-1">
                  <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                    Vagas Restantes
                  </span>
                  <div className={`text-2xl font-black font-mono ${spotsAvailable > 0 ? "text-blue-400" : "text-zinc-600"}`}>
                    {spotsAvailable}
                  </div>
                </div>

                <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 text-center space-y-1">
                  <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                    Pendentes
                  </span>
                  <div className="text-2xl font-black text-amber-400 font-mono">{pendingCount}</div>
                </div>

                <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 text-center space-y-1">
                  <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                    Aceitos
                  </span>
                  <div className="text-2xl font-black text-primary font-mono">{acceptedCount}</div>
                </div>

                <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 text-center space-y-1">
                  <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                    Recusados
                  </span>
                  <div className="text-2xl font-black text-red-400 font-mono">{rejectedCount}</div>
                </div>
              </div>

              {/* Lista de Candidaturas */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <span>Profissionais Interessados ({applications.length})</span>
                  </h3>
                </div>

                {loadingApps ? (
                  <div className="py-8 flex flex-col items-center justify-center gap-2 text-zinc-500">
                    <div className="w-6 h-6 border-2 border-zinc-700 border-t-primary rounded-full animate-spin" />
                    <span className="text-xs">Carregando interessados...</span>
                  </div>
                ) : applications.length === 0 ? (
                  <div className="py-10 text-center space-y-3 bg-zinc-900/40 rounded-2xl border border-zinc-900">
                    <User className="h-10 w-10 text-zinc-600 mx-auto" />
                    <h3 className="text-sm font-bold text-zinc-300">
                      Nenhum profissional demonstrou interesse ainda
                    </h3>
                    <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                      Assim que um profissional enviar proposta, ele aparecerá aqui com perfil, mensagem e valor para sua aprovação.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {applications.map((appItem) => {
                      const isPending = appItem.status === "pendente";
                      const isAccepted = appItem.status === "aceita";
                      const isRejected = appItem.status === "recusada";
                      const isActionLoading = actionLoadingId === appItem.id;

                      return (
                        <div
                          key={appItem.id}
                          className={`rounded-2xl border p-5 space-y-4 transition ${
                            isAccepted
                              ? "bg-primary/5 border-primary/40 shadow-lg shadow-primary/5"
                              : isRejected
                              ? "bg-red-500/5 border-red-500/20 opacity-75"
                              : "bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700"
                          }`}
                        >
                          {/* Header: Foto, Nome, Categoria, Avaliação e Link */}
                          <div className="flex items-center gap-3">
                            {appItem.professionalAvatar ? (
                              <img
                                src={appItem.professionalAvatar}
                                alt={appItem.professionalName}
                                className="w-12 h-12 rounded-xl object-cover border border-zinc-800"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold">
                                <User className="h-6 w-6" />
                              </div>
                            )}

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <h4 className="text-sm font-bold text-white truncate">
                                  {appItem.professionalName}
                                </h4>
                                {appItem.isVerified && (
                                  <BadgeCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                                )}
                              </div>

                              {appItem.professionalCategory && (
                                <p className="text-xs text-zinc-400 truncate">
                                  {appItem.professionalCategory}
                                </p>
                              )}

                              {appItem.professionalRating && (
                                <div className="flex items-center gap-1 text-[11px] text-amber-400 font-bold mt-0.5">
                                  <Star className="h-3 w-3 fill-amber-400" />
                                  <span>{Number(appItem.professionalRating).toFixed(1)}</span>
                                  {appItem.professionalRatingCount > 0 && (
                                    <span className="text-zinc-500 font-normal">
                                      ({appItem.professionalRatingCount})
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            <Link
                              href={`/prestador/${appItem.providerId || appItem.userId}`}
                              className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[11px] font-bold text-zinc-300 hover:text-white flex items-center gap-1 transition"
                            >
                              <span>Perfil</span>
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          </div>

                          {/* Mensagem enviada */}
                          {appItem.message && (
                            <div className="bg-black/30 p-3 rounded-xl border border-white/5 text-xs text-zinc-300 italic leading-relaxed">
                              "{appItem.message}"
                            </div>
                          )}

                          {/* Proposta e Prazo */}
                          <div className="flex flex-wrap items-center gap-3 text-xs">
                            {appItem.proposedPrice && (
                              <div className="bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-lg text-primary font-bold">
                                Proposta: R$ {Number(appItem.proposedPrice).toFixed(2).replace(".", ",")}
                              </div>
                            )}

                            {appItem.estimatedTime && (
                              <div className="bg-zinc-800/80 px-2.5 py-1 rounded-lg text-zinc-300 font-medium">
                                Prazo: {appItem.estimatedTime}
                              </div>
                            )}

                            <span className="text-zinc-600 text-[11px] ml-auto">
                              {formatTimeAgo(appItem.createdAt)}
                            </span>
                          </div>

                          {/* Ações / Status */}
                          <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between gap-2">
                            {isAccepted ? (
                              <div className="flex items-center gap-2 text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-xl w-full justify-center">
                                <CheckCircle2 className="h-4 w-4" />
                                <span>Candidatura Aceita</span>
                              </div>
                            ) : isRejected ? (
                              <div className="flex items-center gap-2 text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-xl w-full justify-center">
                                <X className="h-4 w-4" />
                                <span>Candidatura Recusada</span>
                              </div>
                            ) : isPending ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRejectApp(appItem.id)}
                                  disabled={isActionLoading}
                                  className="flex-1 border-zinc-800 hover:bg-red-500/10 hover:border-red-500/30 text-zinc-400 hover:text-red-400 text-xs h-9 rounded-xl"
                                >
                                  <UserX className="h-3.5 w-3.5 mr-1" />
                                  <span>Recusar</span>
                                </Button>

                                <Button
                                  size="sm"
                                  onClick={() => handleAcceptApp(appItem.id)}
                                  disabled={isActionLoading || spotsAvailable <= 0}
                                  className={`flex-1 text-black font-bold text-xs h-9 rounded-xl shadow-md ${
                                    spotsAvailable > 0
                                      ? "bg-primary hover:bg-primary/90 shadow-primary/20"
                                      : "bg-zinc-700 text-zinc-400 cursor-not-allowed"
                                  }`}
                                >
                                  {isActionLoading ? (
                                    <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <>
                                      <UserCheck className="h-3.5 w-3.5 mr-1" />
                                      <span>{spotsAvailable > 0 ? "Aceitar" : "Sem Vagas"}</span>
                                    </>
                                  )}
                                </Button>
                              </>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── 2-Column Details Grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column (8 cols): Info, Description, Location */}
            <div className="lg:col-span-8 space-y-6">
              {/* Creator / Requester Card */}
              <div className="bg-zinc-950 border border-zinc-800/80 rounded-3xl p-6 md:p-8 space-y-4 shadow-xl">
                <div className="flex items-center gap-3 border-b border-zinc-900 pb-4">
                  <User className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-bold text-white">
                    Solicitante / Contratante
                  </h2>
                </div>

                <div className="flex items-center gap-4">
                  {need.creatorAvatar ? (
                    <img
                      src={need.creatorAvatar}
                      alt={need.creatorName}
                      className="w-14 h-14 rounded-2xl object-cover border border-zinc-800"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                      <User className="h-7 w-7" />
                    </div>
                  )}

                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-white">
                        {need.creatorName || "Cliente XamaJá"}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md uppercase">
                        <BadgeCheck className="h-3 w-3" />
                        Verificado
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400">
                      {need.city} • Cliente na plataforma
                    </p>
                  </div>
                </div>
              </div>

              {/* Description Card */}
              <div className="bg-zinc-950 border border-zinc-800/80 rounded-3xl p-6 md:p-8 space-y-4 shadow-xl">
                <div className="flex items-center gap-3 border-b border-zinc-900 pb-4">
                  <FileText className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-bold text-white">
                    Descrição Detalhada do Serviço
                  </h2>
                </div>
                <p className="text-zinc-300 text-sm md:text-base leading-relaxed whitespace-pre-wrap">
                  {need.description}
                </p>
              </div>

              {/* Requirements & Notes */}
              {(need.requirements || need.notes) && (
                <div className="bg-zinc-950 border border-zinc-800/80 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
                  {need.requirements && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                        Requisitos do Profissional
                      </h3>
                      <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">
                        {need.requirements}
                      </p>
                    </div>
                  )}

                  {need.notes && (
                    <div className="space-y-2 border-t border-zinc-900 pt-4">
                      <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                        Observações & Instruções de Acesso
                      </h3>
                      <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">
                        {need.notes}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Location Card with Map */}
              <div className="bg-zinc-950 border border-zinc-800/80 rounded-3xl p-6 md:p-8 space-y-4 shadow-xl">
                <div className="flex items-center gap-3 border-b border-zinc-900 pb-4">
                  <MapPin className="h-5 w-5 text-primary" />
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      Local de Atendimento
                    </h2>
                    <p className="text-xs text-zinc-500">
                      {need.address
                        ? `${need.address} - ${need.neighborhood || ""}, ${need.city}`
                        : `${need.city}`}
                    </p>
                  </div>
                </div>

                <div
                  ref={mapContainerRef}
                  className="h-64 w-full rounded-2xl overflow-hidden border border-zinc-800 z-10"
                />
              </div>

              {/* Photos Gallery */}
              {Array.isArray(need.photos) && need.photos.length > 0 && (
                <div className="bg-zinc-950 border border-zinc-800/80 rounded-3xl p-6 md:p-8 space-y-4 shadow-xl">
                  <div className="flex items-center gap-3 border-b border-zinc-900 pb-4">
                    <Camera className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-bold text-white">
                      Fotos Anexadas ({need.photos.length})
                    </h2>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {need.photos.map((photoUrl: string, idx: number) => (
                      <div
                        key={idx}
                        onClick={() => setSelectedPhoto(photoUrl)}
                        className="cursor-pointer group relative aspect-square rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900 hover:border-primary transition"
                      >
                        <img
                          src={photoUrl}
                          alt={`Foto ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column (4 cols): Action Card, Budget, Schedule, Info Notice */}
            <div className="lg:col-span-4 space-y-6">
              {/* Financial & Schedule Summary Card */}
              <div className="bg-zinc-950 border border-zinc-800/80 rounded-3xl p-6 md:p-7 space-y-6 shadow-xl sticky top-24">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                    Valor Oferecido
                  </span>
                  <div className="flex items-baseline gap-2">
                    {need.paymentType === "a_combinar" || !need.budget ? (
                      <span className="text-2xl font-black text-white">
                        A Combinar
                      </span>
                    ) : (
                      <span className="text-3xl font-black text-primary font-mono">
                        R$ {Number(need.budget).toFixed(2).replace(".", ",")}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-zinc-500 block">
                    Forma de pagamento:{" "}
                    <strong className="text-zinc-300">
                      {paymentLabels[need.paymentType] || need.paymentType}
                    </strong>
                  </span>
                </div>

                {/* ── BOTÃO OU CARD DE CANDIDATURA (TENHO INTERESSE) ── */}
                {hasApplied ? (
                  <div className="bg-primary/10 border border-primary/30 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center gap-2 text-primary font-black text-sm">
                      <CheckCircle2 className="h-5 w-5" />
                      <span>Interesse Enviado!</span>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      Você já demonstrou interesse nesta oportunidade{" "}
                      <strong>{formatTimeAgo(need.myApplication.createdAt)}</strong>.
                    </p>
                    {need.myApplication.proposedPrice && (
                      <div className="text-xs text-zinc-400 pt-1 border-t border-primary/20">
                        Proposta enviada:{" "}
                        <strong className="text-primary font-mono">
                          R$ {Number(need.myApplication.proposedPrice).toFixed(2).replace(".", ",")}
                        </strong>
                      </div>
                    )}
                    {need.myApplication.message && (
                      <p className="text-xs italic text-zinc-400 bg-black/30 p-2.5 rounded-xl border border-white/5">
                        "{need.myApplication.message}"
                      </p>
                    )}
                    <div className="text-[11px] text-primary/90 font-semibold flex items-center gap-1.5 pt-1">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Aguardando retorno via WhatsApp</span>
                    </div>
                  </div>
                ) : isOwner ? (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 space-y-1.5 text-xs text-blue-300">
                    <div className="font-bold flex items-center gap-1.5 text-blue-400">
                      <ShieldCheck className="h-4 w-4" />
                      <span>Sua Publicação</span>
                    </div>
                    <p className="text-zinc-400">
                      Você é o autor desta oportunidade. Gerencie os profissionais interessados no painel acima.
                    </p>
                  </div>
                ) : isClosed ? (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-center space-y-1 text-xs text-red-400">
                    <div className="font-bold">Oportunidade Encerrada</div>
                    <p className="text-zinc-500 text-[11px]">Todas as vagas foram preenchidas.</p>
                  </div>
                ) : (
                  <Button
                    onClick={handleApplyClick}
                    className="w-full bg-primary hover:bg-primary/90 text-black font-black h-13 py-3.5 rounded-2xl text-base shadow-xl shadow-primary/20 flex items-center justify-center gap-2 transform active:scale-98 transition duration-150"
                  >
                    <ThumbsUp className="h-5 w-5" />
                    <span>Tenho Interesse</span>
                  </Button>
                )}

                <div className="border-t border-zinc-900 pt-4 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                      Data de Início
                    </span>
                    <span className="font-bold text-white">
                      {need.startDate}
                    </span>
                  </div>

                  {need.endDate && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                        Data de Término
                      </span>
                      <span className="font-bold text-white">
                        {need.endDate}
                      </span>
                    </div>
                  )}

                  {(need.startTime || need.endTime) && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500 flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-zinc-400" />
                        Horário de Execução
                      </span>
                      <span className="font-bold text-white">
                        {need.startTime || "--:--"} às{" "}
                        {need.endTime || "--:--"}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500 flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-zinc-400" />
                      Vagas Disponíveis
                    </span>
                    <span className="font-bold text-white">
                      {spotsAvailable} de {need.requiredProfessionals} vaga{need.requiredProfessionals === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>

                {/* Direct payment disclaimer */}
                <div className="bg-primary/5 border border-primary/15 rounded-2xl p-4 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-primary font-bold">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Pagamento Combinado Diretamente</span>
                  </div>
                  <p className="text-zinc-400 leading-relaxed">
                    O XamaJá não retém taxas nem intermedia o pagamento deste
                    serviço. A negociação e acerto ocorrem diretamente entre as
                    partes via WhatsApp.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <Link href="/oportunidades" className="w-full block">
                    <Button
                      variant="outline"
                      className="w-full border-zinc-800 hover:bg-zinc-900 text-zinc-300 hover:text-white h-11 rounded-xl text-xs flex items-center justify-center gap-2"
                    >
                      <Briefcase className="h-3.5 w-3.5" />
                      <span>Ver Mais Oportunidades</span>
                    </Button>
                  </Link>

                  <Link href="/publicar-necessidade" className="w-full block">
                    <Button
                      variant="ghost"
                      className="w-full text-zinc-400 hover:text-white text-xs h-9 flex items-center justify-center gap-1.5"
                    >
                      <PlusCircle className="h-3.5 w-3.5" />
                      <span>Publicar Outra Necessidade</span>
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Application Form Modal ── */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <ThumbsUp className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">
                    Demonstrar Interesse
                  </h3>
                  <p className="text-xs text-zinc-400 truncate max-w-xs">
                    {need.title}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowApplyModal(false)}
                className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleApplySubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300">
                  Mensagem de apresentação (opcional)
                </label>
                <textarea
                  rows={3}
                  value={applyMessage}
                  onChange={(e) => setApplyMessage(e.target.value)}
                  placeholder="Ex: Olá! Tenho experiência com este serviço e ferramentas próprias. Posso iniciar prontamente."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary transition resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300">
                    Valor Proposto em R$ (opcional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={applyPrice}
                    onChange={(e) => setApplyPrice(e.target.value)}
                    placeholder="Ex: 200.00"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary transition"
                  />
                  <span className="text-[10px] text-zinc-500 block">
                    Oferta do cliente: R${" "}
                    {need.budget ? Number(need.budget).toFixed(2).replace(".", ",") : "A Combinar"}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300">
                    Disponibilidade / Prazo (opcional)
                  </label>
                  <input
                    type="text"
                    value={applyTime}
                    onChange={(e) => setApplyTime(e.target.value)}
                    placeholder="Ex: Início imediato"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary transition"
                  />
                </div>
              </div>

              <div className="bg-primary/5 border border-primary/15 rounded-xl p-3 text-xs text-zinc-400 flex items-start gap-2.5">
                <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  Ao enviar, seu interesse ficará registrado para o cliente. Os detalhes de agendamento e pagamento serão combinados diretamente via WhatsApp.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowApplyModal(false)}
                  className="border-zinc-800 hover:bg-zinc-900 text-zinc-400 text-xs h-11 px-5 rounded-xl"
                >
                  Cancelar
                </Button>

                <Button
                  type="submit"
                  disabled={isSubmittingApply}
                  className="bg-primary hover:bg-primary/90 text-black font-black text-xs h-11 px-6 rounded-xl flex items-center gap-2 shadow-md shadow-primary/20"
                >
                  {isSubmittingApply ? (
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      <span>Enviar Interesse</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Auth Required Modal ── */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-6 md:p-8 text-center space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto">
              <Lock className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-white">
                Faça login para se candidatar
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Você precisa estar conectado à sua conta de profissional no XamaJá para demonstrar interesse nesta oportunidade.
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              <a
                href="/parceiro"
                className="w-full block"
              >
                <Button className="w-full bg-primary hover:bg-primary/90 text-black font-black text-xs h-12 rounded-xl">
                  Entrar ou Cadastrar-se
                </Button>
              </a>

              <Button
                variant="ghost"
                onClick={() => setShowAuthModal(false)}
                className="w-full text-zinc-400 hover:text-white text-xs h-10 rounded-xl"
              >
                Voltar aos Detalhes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Photo Lightbox Modal ── */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
        >
          <div className="relative max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl">
            <img
              src={selectedPhoto}
              alt="Ampliação"
              className="w-full h-full object-contain max-h-[85vh]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
