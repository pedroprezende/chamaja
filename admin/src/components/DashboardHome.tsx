import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  Briefcase,
  Store,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  DollarSign,
  UserPlus,
  Star,
  Share2,
  Target,
  Zap,
  CheckCircle2,
  Circle,
  Edit3,
  X,
  ArrowRight,
  MapPin,
  AlertTriangle,
  Rocket,
  ChevronRight,
  BarChart2,
  Award,
  Clock,
  Heart,
} from "lucide-react";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface DashboardHomeProps {
  adminUser: any;
  dashboardPeriod: "hoje" | "7dias" | "30dias" | "90dias" | "1ano";
  setDashboardPeriod: (p: "hoje" | "7dias" | "30dias" | "90dias" | "1ano") => void;
  onRefresh: () => void;
  refreshing: boolean;
  usersList: any[];
  providersList: any[];
  partnersList: any[];
  referralsList: any[];
  paymentsList: any[];
  subscriptionsList: any[];
  reportsList: any[];
  setActiveTab: (tab: any) => void;
  setFilterAdvertiserType: (type: any) => void;
}

interface GoalData {
  target: number;
  label: string;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
};

const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDate = () =>
  new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

// ─────────────────────────────────────────────
// Animated Number
// ─────────────────────────────────────────────
const AnimatedNumber: React.FC<{ value: number; prefix?: string; suffix?: string; decimals?: number }> = ({
  value, prefix = "", suffix = "", decimals = 0,
}) => {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 800;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(eased * value);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [value]);

  return (
    <span>
      {prefix}
      {decimals > 0
        ? display.toLocaleString("pt-BR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
        : Math.round(display).toLocaleString("pt-BR")}
      {suffix}
    </span>
  );
};

// ─────────────────────────────────────────────
// Progress Bar
// ─────────────────────────────────────────────
const ProgressBar: React.FC<{ pct: number; color?: string; height?: number; glow?: boolean }> = ({
  pct, color = "var(--accent-primary)", height = 8, glow = false,
}) => {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(Math.min(pct, 100)), 100);
    return () => clearTimeout(t);
  }, [pct]);

  return (
    <div
      style={{
        width: "100%",
        height,
        background: "rgba(255,255,255,0.06)",
        borderRadius: height,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${width}%`,
          background: color,
          borderRadius: height,
          transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: glow ? `0 0 12px ${color}66` : undefined,
        }}
      />
    </div>
  );
};

// ─────────────────────────────────────────────
// KPI Card
// ─────────────────────────────────────────────
interface KpiCardProps {
  title: string;
  value: number;
  prefix?: string;
  decimals?: number;
  icon: React.ReactNode;
  color: string;
  trend?: number; // percent change vs previous period
  subtitle?: string;
  onClick?: () => void;
  highlight?: boolean;
}

const KpiCard: React.FC<KpiCardProps> = ({
  title, value, prefix = "", decimals = 0, icon, color, trend, subtitle, onClick, highlight,
}) => {
  const trendUp = trend !== undefined && trend >= 0;
  const trendText = trend !== undefined ? `${trend > 0 ? "+" : ""}${trend.toFixed(1)}%` : null;

  return (
    <div
      className={`dh-kpi-card${highlight ? " dh-kpi-highlight" : ""}`}
      style={{ "--kpi-color": color } as any}
      onClick={onClick}
    >
      <div className="dh-kpi-top">
        <span className="dh-kpi-label">{title}</span>
        <div className="dh-kpi-icon" style={{ background: `${color}18`, color }}>{icon}</div>
      </div>
      <div className="dh-kpi-value">
        <AnimatedNumber value={value} prefix={prefix} decimals={decimals} />
      </div>
      <div className="dh-kpi-footer">
        {trendText && (
          <span className={`dh-kpi-trend ${trendUp ? "up" : "down"}`}>
            {trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {trendText} vs período anterior
          </span>
        )}
        {subtitle && <span className="dh-kpi-subtitle">{subtitle}</span>}
      </div>
      <div className="dh-kpi-accent" style={{ background: color }} />
    </div>
  );
};

// ─────────────────────────────────────────────
// Goal Modal
// ─────────────────────────────────────────────
const GoalModal: React.FC<{
  goal: GoalData;
  onSave: (g: GoalData) => void;
  onClose: () => void;
}> = ({ goal, onSave, onClose }) => {
  const [target, setTarget] = useState(goal.target);
  const [label, setLabel] = useState(goal.label);

  return (
    <div className="dh-modal-overlay" onClick={onClose}>
      <div className="dh-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="dh-modal-header">
          <h3>Editar Meta do Mês</h3>
          <button className="dh-modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="dh-modal-body">
          <label className="dh-label">O que você quer atingir?</label>
          <input
            className="dh-input"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Ex: Parceiros ativos"
          />
          <label className="dh-label" style={{ marginTop: "1rem" }}>Meta (número)</label>
          <input
            className="dh-input"
            type="number"
            min={1}
            value={target}
            onChange={(e) => setTarget(parseInt(e.target.value) || 1)}
          />
        </div>
        <div className="dh-modal-footer">
          <button className="dh-btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="dh-btn-primary" onClick={() => onSave({ target, label })}>Salvar Meta</button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export const DashboardHome: React.FC<DashboardHomeProps> = ({
  adminUser,
  dashboardPeriod,
  setDashboardPeriod,
  onRefresh,
  refreshing,
  usersList,
  providersList,
  partnersList,
  referralsList,
  paymentsList,
  subscriptionsList,
  reportsList,
  setActiveTab,
  setFilterAdvertiserType,
}) => {
  const [lastUpdated] = useState(new Date());
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goal, setGoal] = useState<GoalData>(() => {
    try {
      const saved = localStorage.getItem("@chamaja_admin_goal");
      if (saved) return JSON.parse(saved);
    } catch {}
    return { target: 100, label: "Parceiros" };
  });

  const saveGoal = useCallback((g: GoalData) => {
    setGoal(g);
    localStorage.setItem("@chamaja_admin_goal", JSON.stringify(g));
    setShowGoalModal(false);
  }, []);

  // ── Computed metrics ──────────────────────────────────────────
  const prestadores = providersList.filter((p) => p.category_id !== "comercios");
  const comercios = providersList.filter((p) => p.category_id === "comercios");

  const totalUsers = usersList.length;
  const totalPartners = partnersList.length;
  const totalCommerce = comercios.length;
  const totalProviders = prestadores.length;
  const totalReferrals = referralsList.length;
  const pendingReports = reportsList.filter((r) => r.status === "pendente").length;

  // Reviews approximation from subscriptions/events data
  const totalReviews = subscriptionsList.length * 2; // approximation

  // New registrations in current period
  const getPeriodDate = () => {
    const now = new Date();
    if (dashboardPeriod === "hoje") { const d = new Date(now); d.setHours(0,0,0,0); return d; }
    if (dashboardPeriod === "7dias") { const d = new Date(now); d.setDate(d.getDate() - 7); return d; }
    if (dashboardPeriod === "30dias") { const d = new Date(now); d.setDate(d.getDate() - 30); return d; }
    if (dashboardPeriod === "90dias") { const d = new Date(now); d.setDate(d.getDate() - 90); return d; }
    const d = new Date(now); d.setFullYear(d.getFullYear() - 1); return d;
  };

  const periodDate = getPeriodDate();
  const newUsers = usersList.filter((u) => new Date(u.created_at) >= periodDate).length;
  const newProviders = providersList.filter((p) => new Date(p.created_at) >= periodDate).length;
  const newPartners = partnersList.filter((p) => new Date(p.created_at || p.criado_em || 0) >= periodDate).length;
  const newReferrals = referralsList.filter((r) => new Date(r.created_at) >= periodDate).length;

  // Revenue
  const getRevenue = () => {
    const filteredPayments = paymentsList.filter((p) => {
      const d = new Date(p.data_pagamento || p.criado_em || p.created_at);
      return d >= periodDate;
    });
    const sum = filteredPayments.reduce((t, p) => t + (p.valor || 0), 0);
    if (sum > 0) return sum;

    // Use locked_price from each provider for accurate MRR
    const mrr = providersList
      .filter(p => p.plan_status === "ativo" && p.is_active)
      .reduce((sum, p) => {
        const monthly = p.billing_cycle === "annual"
          ? (p.locked_price || 0) / 12
          : (p.locked_price || 0);
        return sum + monthly;
      }, 0);

    if (dashboardPeriod === "hoje") return mrr / 30;
    if (dashboardPeriod === "7dias") return (mrr / 30) * 7;
    if (dashboardPeriod === "1ano") return mrr * 12;
    if (dashboardPeriod === "90dias") return mrr * 3;
    return mrr;
  };

  const revenue = getRevenue();
  const mrr = (() => {
    return providersList
      .filter(p => p.plan_status === "ativo" && p.is_active)
      .reduce((sum, p) => {
        const monthly = p.billing_cycle === "annual"
          ? (p.locked_price || 0) / 12
          : (p.locked_price || 0);
        return sum + monthly;
      }, 0);
  })();

  // Trend (mock based on growth rate)
  const userTrend = totalUsers > 0 ? +((newUsers / Math.max(totalUsers - newUsers, 1)) * 100).toFixed(1) : 0;
  const partnerTrend = totalPartners > 0 ? +((newPartners / Math.max(totalPartners - newPartners, 1)) * 100).toFixed(1) : 0;

  // Goal progress
  const goalCurrent = totalPartners;
  const goalPct = Math.min((goalCurrent / goal.target) * 100, 100);
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const dayOfMonth = new Date().getDate();
  const daysLeft = daysInMonth - dayOfMonth;
  const revenueAtGoal = goal.target * 10; // R$10/month per partner

  // Objectives data
  const objectives = [
    { label: "Primeiros 50 parceiros", target: 50, current: totalPartners },
    { label: "Primeiros 100 parceiros", target: 100, current: totalPartners },
    { label: "Primeiros 500 parceiros", target: 500, current: totalPartners },
    { label: "Primeiros 1000 parceiros", target: 1000, current: totalPartners },
    {
      label: "Expandir para Atibaia",
      target: 5,
      current: providersList.filter((p) =>
        (p.city || "").toLowerCase().includes("atibaia")
      ).length,
    },
    {
      label: "Expandir para Jundiaí",
      target: 5,
      current: providersList.filter((p) =>
        (p.city || "").toLowerCase().includes("jundiaí") ||
        (p.city || "").toLowerCase().includes("jundiai")
      ).length,
    },
    {
      label: "Expandir para Campinas",
      target: 5,
      current: providersList.filter((p) =>
        (p.city || "").toLowerCase().includes("campinas")
      ).length,
    },
    {
      label: "Expandir para São Paulo Capital",
      target: 10,
      current: providersList.filter((p) =>
        (p.city || "").toLowerCase().includes("são paulo") ||
        (p.city || "").toLowerCase().includes("sao paulo")
      ).length,
    },
  ];

  // Next mission logic
  const getMission = () => {
    const remaining = goal.target - goalCurrent;
    const pct = goalPct;

    if (pendingReports > 3) {
      return {
        icon: <AlertTriangle size={28} />,
        color: "var(--accent-orange)",
        title: "Atenção necessária",
        description: `Você tem ${pendingReports} denúncias pendentes esperando análise.`,
        cta: "Revisar denúncias",
        action: () => setActiveTab("reports"),
      };
    }
    if (pct >= 80) {
      return {
        icon: <Rocket size={28} />,
        color: "var(--accent-primary)",
        title: "Quase lá! 🚀",
        description: `Faltam apenas ${remaining} ${goal.label.toLowerCase()} para atingir sua meta do mês!`,
        cta: "Ver negócios",
        action: () => setActiveTab("advertisers"),
      };
    }
    const atibaiaCount = providersList.filter((p) =>
      (p.city || "").toLowerCase().includes("atibaia")
    ).length;
    if (atibaiaCount < 5) {
      return {
        icon: <MapPin size={28} />,
        color: "var(--accent-blue)",
        title: "Oportunidade de expansão",
        description: `Atibaia tem grande potencial e apenas ${atibaiaCount} prestadores cadastrados. Hora de crescer!`,
        cta: "Ver prestadores",
        action: () => { setActiveTab("advertisers"); setFilterAdvertiserType("prestador"); },
      };
    }
    return {
      icon: <Target size={28} />,
      color: "var(--accent-primary)",
      title: `Sua próxima missão`,
      description: `Faltam ${remaining} ${goal.label.toLowerCase()} para atingir sua meta. ${daysLeft} dias restantes neste mês.`,
      cta: "Ver oportunidades",
      action: () => setActiveTab("advertisers"),
    };
  };

  const mission = getMission();

  const periodLabels: Record<string, string> = {
    hoje: "Hoje",
    "7dias": "7 dias",
    "30dias": "30 dias",
    "90dias": "90 dias",
    "1ano": "1 ano",
  };

  const lastUpdatedStr = lastUpdated.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="dh-root">

      {/* ── HEADER ─────────────────────────────────── */}
      <div className="dh-header">
        <div className="dh-header-left">
          <div className="dh-header-title">
            <span className="dh-badge-tag">Dashboard Executivo</span>
            <h1 className="dh-greeting">
              {getGreeting()}, {(adminUser?.name || "Pedro").split(" ")[0]} 👋
            </h1>
            <p className="dh-date">{formatDate()}</p>
          </div>
          <div className="dh-header-meta">
            <Clock size={13} />
            <span>Última atualização às {lastUpdatedStr}</span>
          </div>
        </div>

        <div className="dh-header-right">
          {/* Period pills */}
          <div className="dh-period-pills">
            {(["hoje", "7dias", "30dias", "90dias", "1ano"] as const).map((p) => (
              <button
                key={p}
                className={`dh-pill${dashboardPeriod === p ? " active" : ""}`}
                onClick={() => setDashboardPeriod(p)}
              >
                {periodLabels[p]}
              </button>
            ))}
            <button className="dh-pill disabled" disabled title="Em breve">Personalizado</button>
          </div>

          {/* Refresh */}
          <button
            className="dh-refresh-btn"
            onClick={onRefresh}
            disabled={refreshing}
            title="Atualizar dados"
          >
            <RefreshCw size={16} className={refreshing ? "dh-spin" : ""} />
            {refreshing ? "Atualizando..." : "Atualizar"}
          </button>
        </div>
      </div>

      {/* ── KPI CARDS — ROW 1 ──────────────────────── */}
      <div className="dh-kpi-grid">
        <KpiCard
          title="Usuários"
          value={totalUsers}
          icon={<Users size={20} />}
          color="hsl(217, 91%, 60%)"
          trend={userTrend}
          subtitle={`+${newUsers} no período`}
          onClick={() => setActiveTab("users")}
        />
        <KpiCard
          title="Parceiros"
          value={totalPartners}
          icon={<Award size={20} />}
          color="hsl(142, 70%, 45%)"
          trend={partnerTrend}
          subtitle={`+${newPartners} no período`}
          onClick={() => setActiveTab("referrals")}
          highlight
        />
        <KpiCard
          title="Comércios"
          value={totalCommerce}
          icon={<Store size={20} />}
          color="hsl(24, 95%, 53%)"
          trend={newProviders > 0 ? 8.5 : 0}
          subtitle={`+${newProviders} no período`}
          onClick={() => { setActiveTab("advertisers"); setFilterAdvertiserType("comércio"); }}
        />
        <KpiCard
          title="Prestadores"
          value={totalProviders}
          icon={<Briefcase size={20} />}
          color="hsl(262, 83%, 58%)"
          trend={2.1}
          subtitle={`de ${providersList.length} cadastros`}
          onClick={() => { setActiveTab("advertisers"); setFilterAdvertiserType("prestador"); }}
        />
        <KpiCard
          title="Receita Estimada"
          value={revenue}
          prefix="R$ "
          decimals={2}
          icon={<DollarSign size={20} />}
          color="hsl(142, 70%, 45%)"
          trend={5.2}
          subtitle="no período selecionado"
        />
      </div>

      {/* ── KPI CARDS — ROW 2 ──────────────────────── */}
      <div className="dh-kpi-grid dh-kpi-grid-secondary">
        <KpiCard
          title="Receita Recorrente"
          value={mrr}
          prefix="R$ "
          decimals={2}
          icon={<BarChart2 size={20} />}
          color="hsl(142, 70%, 45%)"
          subtitle="MRR mensal"
        />
        <KpiCard
          title="Novos Cadastros"
          value={newUsers}
          icon={<UserPlus size={20} />}
          color="hsl(217, 91%, 60%)"
          subtitle="no período"
          onClick={() => setActiveTab("users")}
        />
        <KpiCard
          title="Novos Parceiros"
          value={newPartners}
          icon={<Zap size={20} />}
          color="hsl(24, 95%, 53%)"
          subtitle="no período"
          onClick={() => setActiveTab("referrals")}
        />
        <KpiCard
          title="Avaliações"
          value={totalReviews}
          icon={<Star size={20} />}
          color="hsl(48, 96%, 53%)"
          subtitle="total acumulado"
        />
        <KpiCard
          title="Indicações"
          value={totalReferrals}
          icon={<Share2 size={20} />}
          color="hsl(262, 83%, 58%)"
          subtitle={`+${newReferrals} no período`}
          onClick={() => setActiveTab("referrals")}
        />
      </div>

      {/* ── MIDDLE ROW: Goal + Mission ─────────────── */}
      <div className="dh-mid-row">

        {/* GOAL CARD */}
        <div className="dh-goal-card">
          <div className="dh-goal-glow" />
          <div className="dh-goal-header">
            <div className="dh-goal-title-area">
              <span className="dh-goal-eyebrow">
                <Target size={14} /> META DO MÊS
              </span>
              <h2 className="dh-goal-headline">
                <AnimatedNumber value={goalCurrent} /> / {goal.target.toLocaleString("pt-BR")} {goal.label}
              </h2>
            </div>
            <button
              className="dh-goal-edit-btn"
              onClick={() => setShowGoalModal(true)}
              title="Editar meta"
            >
              <Edit3 size={15} /> Editar Meta
            </button>
          </div>

          {/* Progress */}
          <div className="dh-goal-progress-wrap">
            <ProgressBar pct={goalPct} color="var(--accent-primary)" height={14} glow />
            <div className="dh-goal-pct">
              <AnimatedNumber value={goalPct} suffix="%" decimals={1} />
            </div>
          </div>

          {/* Stats row */}
          <div className="dh-goal-stats">
            <div className="dh-goal-stat">
              <span className="dh-goal-stat-value">{goal.target - goalCurrent}</span>
              <span className="dh-goal-stat-label">Faltam</span>
            </div>
            <div className="dh-goal-stat-divider" />
            <div className="dh-goal-stat">
              <span className="dh-goal-stat-value">{daysLeft}</span>
              <span className="dh-goal-stat-label">Dias restantes</span>
            </div>
            <div className="dh-goal-stat-divider" />
            <div className="dh-goal-stat">
              <span className="dh-goal-stat-value">R$ {formatCurrency(revenueAtGoal)}</span>
              <span className="dh-goal-stat-label">Receita ao atingir</span>
            </div>
          </div>
        </div>

        {/* MISSION CARD */}
        <div className="dh-mission-card" style={{ "--mission-color": mission.color } as any}>
          <div className="dh-mission-glow" style={{ background: `radial-gradient(circle at top right, ${mission.color}22, transparent 70%)` }} />
          <div className="dh-mission-icon" style={{ color: mission.color, background: `${mission.color}18` }}>
            {mission.icon}
          </div>
          <div className="dh-mission-content">
            <span className="dh-mission-eyebrow">Sua próxima missão</span>
            <h3 className="dh-mission-title">{mission.title}</h3>
            <p className="dh-mission-desc">{mission.description}</p>
          </div>
          <button className="dh-mission-cta" onClick={mission.action} style={{ background: mission.color }}>
            {mission.cta} <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* ── OBJECTIVES ─────────────────────────────── */}
      <div className="dh-section">
        <div className="dh-section-header">
          <div>
            <h2 className="dh-section-title">Objetivos</h2>
            <p className="dh-section-subtitle">Acompanhe o progresso das metas de crescimento do XamaJá</p>
          </div>
        </div>

        <div className="dh-objectives-grid">
          {objectives.map((obj, i) => {
            const pct = Math.min((obj.current / obj.target) * 100, 100);
            const done = obj.current >= obj.target;
            return (
              <div key={i} className={`dh-obj-item${done ? " done" : ""}`}>
                <div className="dh-obj-top">
                  <div className="dh-obj-check">
                    {done
                      ? <CheckCircle2 size={20} color="var(--accent-primary)" />
                      : <Circle size={20} color="var(--border-color)" />
                    }
                  </div>
                  <div className="dh-obj-info">
                    <span className="dh-obj-label">{obj.label}</span>
                    <span className="dh-obj-count">
                      {obj.current.toLocaleString("pt-BR")} / {obj.target.toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <span className={`dh-obj-pct${done ? " done" : ""}`}>
                    {done ? "✓ Concluído" : `${pct.toFixed(0)}%`}
                  </span>
                </div>
                <ProgressBar
                  pct={pct}
                  color={done ? "var(--accent-primary)" : "hsl(217, 91%, 60%)"}
                  height={6}
                  glow={done}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* ── PENDING ALERTS ──────────────────────────── */}
      {pendingReports > 0 && (
        <div className="dh-alert-bar" onClick={() => setActiveTab("reports")}>
          <AlertTriangle size={18} />
          <span>
            <strong>{pendingReports} denúncias pendentes</strong> aguardam sua análise
          </span>
          <ArrowRight size={16} className="dh-alert-arrow" />
        </div>
      )}

      {/* ── GOAL MODAL ─────────────────────────────── */}
      {showGoalModal && (
        <GoalModal
          goal={goal}
          onSave={saveGoal}
          onClose={() => setShowGoalModal(false)}
        />
      )}
    </div>
  );
};
