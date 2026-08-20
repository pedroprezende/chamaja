import { useState, useEffect } from "react";
import { Link } from "wouter";
import {
  Briefcase,
  PlusCircle,
  Clock,
  Calendar,
  MapPin,
  Users,
  AlertCircle,
  Eye,
  Edit,
  PauseCircle,
  PlayCircle,
  XCircle,
  CheckCircle2,
  DollarSign,
  ChevronRight,
  UserCheck,
  UserX,
  Lock,
  ArrowLeft,
  X,
  Save,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getSessionToken } from "@/lib/supabase";

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

export default function MinhasNecessidades() {
  const [needsList, setNeedsList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("todas");
  const [isAuth, setIsAuth] = useState<boolean | null>(null);

  // Edit Modal State
  const [editingNeed, setEditingNeed] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editBudget, setEditBudget] = useState("");
  const [editPaymentType, setEditPaymentType] = useState("total");
  const [editStartDate, setEditStartDate] = useState("");
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");
  const [editRequirements, setEditRequirements] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Cancel Confirmation Modal State
  const [cancellingNeedId, setCancellingNeedId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const fetchMyNeeds = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await getSessionToken();
      if (!token) {
        setIsAuth(false);
        setIsLoading(false);
        return;
      }
      setIsAuth(true);

      const url = `/api/trpc/needs.myPublishedNeeds?input=${encodeURIComponent(
        JSON.stringify({ status: "todas" })
      )}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Não foi possível carregar suas publicações.");
      }

      const json = await res.json();
      const data = Array.isArray(json)
        ? json[0]?.result?.data
        : json?.result?.data;

      if (Array.isArray(data)) {
        setNeedsList(data);
      } else {
        setNeedsList([]);
      }
    } catch (e: any) {
      console.error("Erro ao buscar publicações:", e);
      setError(e.message || "Erro de conexão ao buscar publicações.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyNeeds();
  }, []);

  const handleTogglePause = async (needItem: any) => {
    const isPaused = needItem.status === "pausada";
    const newStatus = isPaused ? "ativa" : "pausada";
    const actionLabel = isPaused ? "reativar" : "pausar";

    try {
      const token = await getSessionToken();
      const res = await fetch("/api/trpc/needs.update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: needItem.id,
          status: newStatus,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson?.error?.message || `Erro ao ${actionLabel} publicação.`);
      }

      toast.success(
        isPaused
          ? "Oportunidade reativada com sucesso!"
          : "Oportunidade pausada. Ela não aparecerá no feed de buscas."
      );
      setNeedsList((prev) =>
        prev.map((item) => (item.id === needItem.id ? { ...item, status: newStatus } : item))
      );
    } catch (e: any) {
      console.error(`Erro ao ${actionLabel}:`, e);
      toast.error(e.message || `Não foi possível ${actionLabel} a necessidade.`);
    }
  };

  const handleOpenEdit = (needItem: any) => {
    setEditingNeed(needItem);
    setEditTitle(needItem.title || "");
    setEditDesc(needItem.description || "");
    setEditBudget(needItem.budget ? String(needItem.budget) : "");
    setEditPaymentType(needItem.paymentType || "total");
    setEditStartDate(needItem.startDate || "");
    setEditStartTime(needItem.startTime || "");
    setEditEndTime(needItem.endTime || "");
    setEditRequirements(needItem.requirements || "");
    setEditNotes(needItem.notes || "");
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNeed) return;

    setIsSavingEdit(true);
    try {
      const token = await getSessionToken();
      const numericBudget = editBudget ? parseFloat(editBudget.replace(",", ".")) : undefined;

      const res = await fetch("/api/trpc/needs.update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: editingNeed.id,
          title: editTitle.trim(),
          description: editDesc.trim(),
          budget: numericBudget && !isNaN(numericBudget) ? numericBudget : undefined,
          paymentType: editPaymentType,
          startDate: editStartDate,
          startTime: editStartTime || null,
          endTime: editEndTime || null,
          requirements: editRequirements.trim() || null,
          notes: editNotes.trim() || null,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson?.error?.message || "Erro ao atualizar necessidade.");
      }

      toast.success("Publicação atualizada com sucesso!");
      setEditingNeed(null);
      fetchMyNeeds();
    } catch (err: any) {
      console.error("Erro ao editar:", err);
      toast.error(err.message || "Não foi possível salvar as alterações.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancellingNeedId) return;

    setIsCancelling(true);
    try {
      const token = await getSessionToken();
      const res = await fetch("/api/trpc/needs.cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: cancellingNeedId,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson?.error?.message || "Erro ao cancelar publicação.");
      }

      toast.info("Publicação cancelada com sucesso.");
      setCancellingNeedId(null);
      setNeedsList((prev) =>
        prev.map((item) =>
          item.id === cancellingNeedId ? { ...item, status: "cancelada" } : item
        )
      );
    } catch (err: any) {
      console.error("Erro ao cancelar:", err);
      toast.error(err.message || "Não foi possível cancelar a necessidade.");
    } finally {
      setIsCancelling(false);
    }
  };

  const paymentLabels: Record<string, string> = {
    total: "Valor Total",
    diaria: "Por Diária",
    hora: "Por Hora",
    a_combinar: "A Combinar",
  };

  // Filter list by selected tab
  const filteredNeeds = needsList.filter((item) => {
    const required = item.requiredProfessionals || 1;
    const filled = item.filledSpots || 0;
    const isClosed = item.status === "encerrada" || filled >= required;
    const isPartial = item.status === "ativa" && filled > 0 && filled < required;
    const isOpen = item.status === "ativa" && filled === 0;
    const isPausedOrCancelled = item.status === "pausada" || item.status === "cancelada";

    if (statusFilter === "ativas") return isOpen;
    if (statusFilter === "parciais") return isPartial;
    if (statusFilter === "encerradas") return isClosed;
    if (statusFilter === "pausadas_canceladas") return isPausedOrCancelled;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#070708] text-foreground flex flex-col font-sans">
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
                className="text-zinc-400 hover:text-white transition"
              >
                Mural de Oportunidades
              </Link>
              <span className="text-primary font-bold transition flex items-center gap-1.5">
                <Briefcase className="h-4 w-4" />
                <span>Minhas Publicações</span>
              </span>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/publicar-necessidade">
              <Button className="bg-primary hover:bg-primary/90 text-black font-black text-xs md:text-sm px-4 h-10 rounded-xl shadow-lg shadow-primary/10 flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                <span>Publicar Nova Necessidade</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 py-8 md:py-12">
        <div className="container mx-auto px-4 lg:px-8 max-w-6xl space-y-8">
          {/* Header Title Section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
                <Briefcase className="h-3.5 w-3.5" />
                <span>Painel do Solicitante</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-white">
                Gerenciar Minhas Necessidades
              </h1>
              <p className="text-xs md:text-sm text-zinc-400">
                Acompanhe o status, avalie os interessados, edite detalhes e pause ou encerre seus pedidos.
              </p>
            </div>

            <Link href="/publicar-necessidade">
              <Button className="bg-primary hover:bg-primary/90 text-black font-black text-xs rounded-xl h-11 px-5 flex items-center gap-2 shadow-md shadow-primary/15">
                <PlusCircle className="h-4 w-4" />
                <span>Nova Necessidade</span>
              </Button>
            </Link>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-zinc-900">
            {[
              { key: "todas", label: "Todas", count: needsList.length },
              {
                key: "ativas",
                label: "🟢 Abertas",
                count: needsList.filter((n) => n.status === "ativa" && (n.filledSpots || 0) === 0).length,
              },
              {
                key: "parciais",
                label: "🟡 Parcialmente Preenchidas",
                count: needsList.filter(
                  (n) => n.status === "ativa" && (n.filledSpots || 0) > 0 && (n.filledSpots || 0) < (n.requiredProfessionals || 1)
                ).length,
              },
              {
                key: "encerradas",
                label: "🔴 Encerradas",
                count: needsList.filter(
                  (n) => n.status === "encerrada" || (n.filledSpots || 0) >= (n.requiredProfessionals || 1)
                ).length,
              },
              {
                key: "pausadas_canceladas",
                label: "⚪ Pausadas / Canceladas",
                count: needsList.filter((n) => n.status === "pausada" || n.status === "cancelada").length,
              },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 ${
                  statusFilter === tab.key
                    ? "bg-primary text-black font-black shadow-md shadow-primary/20"
                    : "bg-zinc-950 border border-zinc-800/80 text-zinc-400 hover:text-white hover:border-zinc-700"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    statusFilter === tab.key
                      ? "bg-black/20 text-black font-black"
                      : "bg-zinc-800 text-zinc-400"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* List Content */}
          {isLoading ? (
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-16 flex flex-col items-center justify-center gap-4 text-center">
              <div className="w-12 h-12 border-4 border-zinc-800 border-t-primary rounded-full animate-spin"></div>
              <p className="text-zinc-400 font-semibold text-sm">
                Carregando suas necessidades publicadas...
              </p>
            </div>
          ) : isAuth === false ? (
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-16 text-center space-y-4 shadow-xl">
              <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto">
                <Lock className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-bold text-white">Faça login para ver suas necessidades</h2>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                Você precisa estar conectado à sua conta XamaJá para gerenciar suas publicações de serviços.
              </p>
              <div className="pt-2">
                <a href="/parceiro">
                  <Button className="bg-primary hover:bg-primary/90 text-black font-black text-xs px-6 h-11 rounded-xl">
                    Entrar na Minha Conta
                  </Button>
                </a>
              </div>
            </div>
          ) : error ? (
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-16 text-center space-y-4">
              <p className="text-red-400 font-bold">{error}</p>
              <Button onClick={fetchMyNeeds} className="bg-primary text-black font-bold">
                Tentar Novamente
              </Button>
            </div>
          ) : filteredNeeds.length === 0 ? (
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-16 text-center space-y-4 shadow-xl">
              <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600 mx-auto">
                <Briefcase className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-white">
                Nenhuma publicação nesta categoria
              </h3>
              <p className="text-zinc-400 text-xs md:text-sm max-w-md mx-auto leading-relaxed">
                {statusFilter === "todas"
                  ? "Você ainda não publicou nenhuma necessidade. Clique abaixo para solicitar um profissional."
                  : "Não há publicações correspondentes ao filtro selecionado."}
              </p>
              <div className="pt-2">
                <Link href="/publicar-necessidade">
                  <Button className="bg-primary hover:bg-primary/90 text-black font-black text-xs px-6 h-11 rounded-xl">
                    Publicar Minha Primeira Necessidade
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredNeeds.map((item) => {
                const required = item.requiredProfessionals || 1;
                const filled = item.filledSpots || 0;
                const spotsLeft = Math.max(0, required - filled);
                const isClosed = item.status === "encerrada" || filled >= required;
                const isPartial = item.status === "ativa" && filled > 0 && filled < required;
                const isCancelled = item.status === "cancelada";
                const isPaused = item.status === "pausada";

                const stateBadge = isCancelled
                  ? { label: "Cancelada", dot: "⚪", className: "bg-zinc-800/80 border-zinc-700 text-zinc-400" }
                  : isPaused
                  ? { label: "Pausada", dot: "⚪", className: "bg-zinc-800/80 border-zinc-700 text-amber-400" }
                  : isClosed
                  ? { label: "Encerrada", dot: "🔴", className: "bg-red-500/10 border-red-500/20 text-red-400" }
                  : isPartial
                  ? { label: "Parcialmente Preenchida", dot: "🟡", className: "bg-amber-500/10 border-amber-500/20 text-amber-400" }
                  : { label: "Aberta", dot: "🟢", className: "bg-primary/10 border-primary/20 text-primary" };

                return (
                  <div
                    key={item.id}
                    className="bg-zinc-950 border border-zinc-800/90 hover:border-zinc-700 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-5 transition"
                  >
                    {/* Top Row: Category, Date & Status Pill */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2 border-b border-zinc-900 pb-3">
                        <div className="flex flex-wrap items-center gap-2">
                          {item.category && (
                            <span className="px-2.5 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg text-[10px] font-bold">
                              {item.category}
                            </span>
                          )}
                          <span className={`px-2.5 py-0.5 border rounded-lg text-[10px] font-bold uppercase tracking-wider ${stateBadge.className}`}>
                            {stateBadge.dot} {stateBadge.label}
                          </span>
                        </div>

                        <span className="text-[11px] text-zinc-500 font-mono">
                          {formatTimeAgo(item.createdAt)}
                        </span>
                      </div>

                      {/* Title & Description */}
                      <div className="space-y-1.5">
                        <h3 className="text-base font-black text-white leading-snug line-clamp-2">
                          {item.title}
                        </h3>
                        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      {/* Details Matrix (Location, Date, Time, Spots) */}
                      <div className="grid grid-cols-2 gap-2 text-xs text-zinc-300 pt-1">
                        <div className="flex items-center gap-1.5 text-zinc-400">
                          <MapPin className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                          <span className="truncate">
                            {item.neighborhood ? `${item.neighborhood}, ` : ""}
                            {item.city}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-zinc-400">
                          <Calendar className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />
                          <span>{item.startDate}</span>
                        </div>

                        {(item.startTime || item.endTime) && (
                          <div className="flex items-center gap-1.5 text-zinc-400">
                            <Clock className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
                            <span>
                              {item.startTime || "--:--"} às {item.endTime || "--:--"}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-1.5 text-zinc-400">
                          <Users className="h-3.5 w-3.5 text-purple-400 flex-shrink-0" />
                          <span className="font-bold text-zinc-300">
                            {filled} de {required} vagas
                            {spotsLeft > 0 ? ` (${spotsLeft} restante${spotsLeft === 1 ? "" : "s"})` : ""}
                          </span>
                        </div>
                      </div>

                      {/* Interested Candidates Alert Box */}
                      <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold">
                            <Users className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white block">
                              {item.totalApplications}{" "}
                              {item.totalApplications === 1 ? "interessado" : "interessados"}
                            </span>
                            <span className="text-[10px] text-zinc-400">
                              {item.pendingApplications > 0 ? (
                                <strong className="text-amber-400 font-bold">
                                  {item.pendingApplications} aguardando resposta
                                </strong>
                              ) : (
                                "Todas avaliadas"
                              )}
                            </span>
                          </div>
                        </div>

                        <Link href={`/necessidade/${item.id}`}>
                          <span className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                            <span>Ver Candidatos</span>
                            <ChevronRight className="h-3.5 w-3.5" />
                          </span>
                        </Link>
                      </div>

                      {/* Offer / Budget */}
                      <div className="flex items-baseline justify-between text-xs pt-1">
                        <span className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
                          Valor Oferecido:
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-sm font-black text-primary font-mono">
                            {item.budget
                              ? `R$ ${Number(item.budget).toFixed(2).replace(".", ",")}`
                              : "A Combinar"}
                          </span>
                          <span className="text-zinc-500 text-[11px]">
                            ({paymentLabels[item.paymentType] || item.paymentType})
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Actions Toolbar */}
                    <div className="border-t border-zinc-900 pt-3 flex flex-wrap items-center justify-between gap-2">
                      <Link href={`/necessidade/${item.id}`} className="flex-1">
                        <Button
                          size="sm"
                          className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white font-bold text-xs h-9 rounded-xl flex items-center justify-center gap-1.5"
                        >
                          <Eye className="h-3.5 w-3.5 text-primary" />
                          <span>Ver Detalhes</span>
                        </Button>
                      </Link>

                      {/* Edit Button */}
                      {!isCancelled && !isClosed && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenEdit(item)}
                          className="border-zinc-800 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs h-9 rounded-xl px-3 flex items-center gap-1"
                          title="Editar detalhes"
                        >
                          <Edit className="h-3.5 w-3.5" />
                          <span>Editar</span>
                        </Button>
                      )}

                      {/* Pause / Unpause Button */}
                      {!isCancelled && !isClosed && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTogglePause(item)}
                          className={`text-xs h-9 rounded-xl px-3 flex items-center gap-1 border ${
                            isPaused
                              ? "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
                              : "border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                          }`}
                          title={isPaused ? "Reativar vaga" : "Pausar vaga"}
                        >
                          {isPaused ? (
                            <>
                              <PlayCircle className="h-3.5 w-3.5" />
                              <span>Reativar</span>
                            </>
                          ) : (
                            <>
                              <PauseCircle className="h-3.5 w-3.5" />
                              <span>Pausar</span>
                            </>
                          )}
                        </Button>
                      )}

                      {/* Cancel Button */}
                      {!isCancelled && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setCancellingNeedId(item.id)}
                          className="text-zinc-500 hover:text-red-400 hover:bg-red-500/10 text-xs h-9 rounded-xl px-2.5"
                          title="Cancelar publicação"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* ── Edit Need Modal ── */}
      {editingNeed && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Edit className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Editar Necessidade</h3>
                  <p className="text-xs text-zinc-400 truncate max-w-xs">{editingNeed.title}</p>
                </div>
              </div>

              <button
                onClick={() => setEditingNeed(null)}
                className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300">Título do Pedido</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-primary transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300">Descrição Detalhada</label>
                <textarea
                  rows={4}
                  required
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-primary transition resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300">Valor Oferecido (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editBudget}
                    onChange={(e) => setEditBudget(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-primary transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300">Forma de Pagamento</label>
                  <select
                    value={editPaymentType}
                    onChange={(e) => setEditPaymentType(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-primary transition cursor-pointer"
                  >
                    <option value="total">Valor Total</option>
                    <option value="diaria">Por Diária</option>
                    <option value="hora">Por Hora</option>
                    <option value="a_combinar">A Combinar</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300">Data de Início</label>
                  <input
                    type="date"
                    required
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-primary transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300">Horário Inicial</label>
                  <input
                    type="time"
                    value={editStartTime}
                    onChange={(e) => setEditStartTime(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-primary transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300">Horário Final</label>
                  <input
                    type="time"
                    value={editEndTime}
                    onChange={(e) => setEditEndTime(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-primary transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300">Requisitos do Profissional</label>
                <textarea
                  rows={2}
                  value={editRequirements}
                  onChange={(e) => setEditRequirements(e.target.value)}
                  placeholder="Ex: Ferramentas próprias, veículo para transporte..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-primary transition resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300">Observações & Acesso</label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Ex: Tocar interfone 302, portão lateral..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-primary transition resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-900">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingNeed(null)}
                  className="border-zinc-800 hover:bg-zinc-900 text-zinc-400 text-xs h-11 px-5 rounded-xl"
                >
                  Cancelar
                </Button>

                <Button
                  type="submit"
                  disabled={isSavingEdit}
                  className="bg-primary hover:bg-primary/90 text-black font-black text-xs h-11 px-6 rounded-xl flex items-center gap-2 shadow-md shadow-primary/20"
                >
                  {isSavingEdit ? (
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5" />
                      <span>Salvar Alterações</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Cancel Confirmation Modal ── */}
      {cancellingNeedId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-6 md:p-8 text-center space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mx-auto">
              <XCircle className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-white">Deseja cancelar esta necessidade?</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Ao cancelar, ela sairá do mural de oportunidades e não aceitará mais candidaturas.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setCancellingNeedId(null)}
                className="flex-1 border-zinc-800 hover:bg-zinc-900 text-zinc-400 text-xs h-11 rounded-xl"
              >
                Voltar
              </Button>

              <Button
                disabled={isCancelling}
                onClick={handleConfirmCancel}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold text-xs h-11 rounded-xl shadow-md shadow-red-500/20"
              >
                {isCancelling ? "Cancelando..." : "Confirmar Cancelamento"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
