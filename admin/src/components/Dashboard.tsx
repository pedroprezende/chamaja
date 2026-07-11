import React, { useState, useEffect } from "react";
import { DashboardHome } from "./DashboardHome";
import { PlansManagement } from "./PlansManagement";
import { supabase } from "../supabase";
import {
  Users,
  Briefcase,
  Store,
  TrendingUp,
  LogOut,
  RefreshCw,
  Search,
  Award,
  Database,
  ArrowRight,
  ShieldAlert,
  ShieldOff,
  UserCheck,
  Trash2,
  MapPin,
  Star,
  History,
  User,
  Phone,
  Mail,
  X,
  Activity,
  DollarSign,
  UserPlus,
  Calendar,
  Eye,
  MessageSquare,
  Heart,
  Edit,
  Save,
  Rocket,
  Image as ImageIcon,
  Settings,
  Shield,
  Key,
  Lock,
} from "lucide-react";

interface DashboardProps {
  adminUser: any;
  onLogout: () => void;
}

// Custom SVG Line Chart Component
interface SVGLineChartProps {
  data: { label: string; value: number }[];
  color: string;
  gradientId: string;
  title: string;
}

const SVGLineChart: React.FC<SVGLineChartProps> = ({
  data,
  color,
  gradientId,
  title,
}) => {
  if (!data || data.length === 0) return null;

  const width = 500;
  const height = 180;
  const paddingLeft = 35;
  const paddingRight = 15;
  const paddingTop = 15;
  const paddingBottom = 25;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxVal = Math.max(...data.map((d) => d.value), 5) * 1.1;

  const points = data.map((d, i) => {
    const x = paddingLeft + (i * chartWidth) / Math.max(data.length - 1, 1);
    const y = height - paddingBottom - (d.value * chartHeight) / maxVal;
    return { x, y, label: d.label, value: d.value };
  });

  const linePath = points.reduce((path, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${path} L ${p.x} ${p.y}`;
  }, "");

  const areaPath = linePath
    ? `${linePath} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`
    : "";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        width: "100%",
      }}
    >
      <span
        style={{
          fontSize: "0.85rem",
          color: "var(--text-secondary)",
          fontWeight: 600,
        }}
      >
        {title}
      </span>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height="100%"
        style={{ overflow: "visible" }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {Array.from({ length: 4 }).map((_, i) => {
          const y = paddingTop + (i * chartHeight) / 3;
          const val = Math.round(maxVal - (i * maxVal) / 3);
          return (
            <g key={i} opacity="0.12">
              <line
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke="var(--text-primary)"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <text
                x={paddingLeft - 8}
                y={y + 3}
                textAnchor="end"
                fill="var(--text-secondary)"
                fontSize="8px"
                fontWeight="600"
              >
                {val}
              </text>
            </g>
          );
        })}

        {areaPath && <path d={areaPath} fill={`url(#${gradientId})`} />}
        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {points.map((p, i) => (
          <text
            key={i}
            x={p.x}
            y={height - 8}
            textAnchor="middle"
            fill="var(--text-muted)"
            fontSize="8px"
            fontWeight="500"
          >
            {p.label}
          </text>
        ))}

        {points.map((p, i) => (
          <g key={i} className="chart-dot-group">
            <circle
              cx={p.x}
              cy={p.y}
              r="3.5"
              fill="var(--bg-surface)"
              stroke={color}
              strokeWidth="2"
            />
            <title>{`${p.label}: ${Math.round(p.value)}`}</title>
          </g>
        ))}
      </svg>
    </div>
  );
};

// Custom SVG Bar Chart Component
interface SVGBarChartProps {
  data: { label: string; value: number }[];
  color: string;
  title: string;
}

const SVGBarChart: React.FC<SVGBarChartProps> = ({ data, color, title }) => {
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        width: "100%",
      }}
    >
      <span
        style={{
          fontSize: "0.85rem",
          color: "var(--text-secondary)",
          fontWeight: 600,
        }}
      >
        {title}
      </span>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.88rem",
          width: "100%",
        }}
      >
        {data.map((item, index) => {
          const percentage = Math.min((item.value / maxVal) * 100, 100);
          return (
            <div
              key={index}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.25rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                }}
              >
                <span style={{ color: "var(--text-primary)" }}>
                  {item.label}
                </span>
                <span style={{ color: color }}>{item.value}</span>
              </div>
              <div
                style={{
                  width: "100%",
                  height: "8px",
                  backgroundColor: "var(--border-color)",
                  borderRadius: "4px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${percentage}%`,
                    height: "100%",
                    backgroundColor: color,
                    borderRadius: "4px",
                    boxShadow: `0 0 8px ${color}44`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Custom SVG Vertical Bar Chart Component
interface SVGVerticalBarChartProps {
  data: { label: string; value: number }[];
  color: string;
  title: string;
  isCurrency?: boolean;
}

const SVGVerticalBarChart: React.FC<SVGVerticalBarChartProps> = ({
  data,
  color,
  title,
  isCurrency,
}) => {
  if (!data || data.length === 0) return null;
  const width = 500;
  const height = 180;
  const paddingLeft = 35;
  const paddingRight = 15;
  const paddingTop = 15;
  const paddingBottom = 25;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxVal = Math.max(...data.map((d) => d.value), 5) * 1.15;
  const barWidth = (chartWidth / data.length) * 0.6;
  const barGap = (chartWidth / data.length) * 0.4;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        width: "100%",
      }}
    >
      <span
        style={{
          fontSize: "0.85rem",
          color: "var(--text-secondary)",
          fontWeight: 600,
        }}
      >
        {title}
      </span>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height="100%"
        style={{ overflow: "visible" }}
      >
        {Array.from({ length: 4 }).map((_, i) => {
          const y = paddingTop + (i * chartHeight) / 3;
          const val = Math.round(maxVal - (i * maxVal) / 3);
          return (
            <g key={i} opacity="0.12">
              <line
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke="var(--text-primary)"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <text
                x={paddingLeft - 8}
                y={y + 3}
                textAnchor="end"
                fill="var(--text-secondary)"
                fontSize="8px"
                fontWeight="600"
              >
                {isCurrency ? `R$${val}` : val}
              </text>
            </g>
          );
        })}

        {data.map((d, i) => {
          const x = paddingLeft + i * (barWidth + barGap) + barGap / 2;
          const h = (d.value * chartHeight) / maxVal;
          const y = height - paddingBottom - h;
          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(h, 2)}
                fill={color}
                rx="3"
                ry="3"
                style={{
                  filter: `drop-shadow(0px 2px 4px ${color}33)`,
                  opacity: 0.85,
                }}
              />
              <text
                x={x + barWidth / 2}
                y={height - 10}
                textAnchor="middle"
                fill="var(--text-muted)"
                fontSize="8px"
                fontWeight="500"
              >
                {d.label}
              </text>
              <text
                x={x + barWidth / 2}
                y={y - 4}
                textAnchor="middle"
                fill="var(--text-primary)"
                fontSize="8px"
                fontWeight="600"
              >
                {isCurrency ? `R$${d.value.toFixed(0)}` : d.value.toFixed(0)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export const Dashboard: React.FC<DashboardProps> = ({
  adminUser,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<
    | "dashboard"
    | "users"
    | "advertisers"
    | "reports"
    | "financial"
    | "settings"
    | "referrals"
    | "plans"
  >("dashboard");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Database tables
  const [usersList, setUsersList] = useState<any[]>([]);
  const [providersList, setProvidersList] = useState<any[]>([]);
  const [paymentsList, setPaymentsList] = useState<any[]>([]);
  const [eventsList, setEventsList] = useState<any[]>([]);
  const [reportsList, setReportsList] = useState<any[]>([]);
  const [reportActionsList, setReportActionsList] = useState<any[]>([]);
  const [subscriptionsList, setSubscriptionsList] = useState<any[]>([]);
  const [appSettingsList, setAppSettingsList] = useState<any[]>([]);
  const [activityLogsList, setActivityLogsList] = useState<any[]>([]);
  const [referralsList, setReferralsList] = useState<any[]>([]);
  const [partnersList, setPartnersList] = useState<any[]>([]);

  // Search & Filter states for referrals
  const [searchReferral, setSearchReferral] = useState("");
  const [filterReferralStatus, setFilterReferralStatus] = useState<
    "all" | "novo" | "contatado" | "cadastrado" | "ativo"
  >("all");

  // Settings tab states
  const [searchLogQuery, setSearchLogQuery] = useState("");
  const [newAdminSearch, setNewAdminSearch] = useState("");
  const [selectedNewAdmin, setSelectedNewAdmin] = useState<any | null>(null);
  const [newAdminRole, setNewAdminRole] = useState<
    "principal" | "secundario" | "moderador"
  >("moderador");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Settings values states
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [contactWhatsapp, setContactWhatsapp] = useState("");
  const [minRatingFeatured, setMinRatingFeatured] = useState(4.5);
  const [appVersion, setAppVersion] = useState("1.0.0");
  const [savingSettings, setSavingSettings] = useState(false);

  // Search states
  const [searchUser, setSearchUser] = useState("");
  const [searchAdvertiser, setSearchAdvertiser] = useState("");
  const [searchReport, setSearchReport] = useState("");

  // User filter states
  const [filterUserType, setFilterUserType] = useState<
    "all" | "cliente" | "prestador" | "comércio"
  >("all");
  const [filterUserStatus, setFilterUserStatus] = useState<
    "all" | "ativo" | "suspenso" | "bloqueado"
  >("all");

  // Advertiser filter states
  const [filterAdvertiserType, setFilterAdvertiserType] = useState<
    "all" | "prestador" | "comércio"
  >("all");
  const [filterAdvertiserStatus, setFilterAdvertiserStatus] = useState<
    "all" | "ativos" | "pendentes" | "suspensos" | "vencidos" | "premium"
  >("all");

  // Report filter states
  const [filterReportStatus, setFilterReportStatus] = useState<
    "all" | "pendente" | "resolvido"
  >("all");
  const [filterReportReason, setFilterReportReason] = useState<
    | "all"
    | "perfil_falso"
    | "golpe"
    | "informacoes_incorretas"
    | "comportamento_inadequado"
    | "outro"
  >("all");

  // Financial filter states
  const [searchFinancial, setSearchFinancial] = useState("");
  const [filterFinancialPlan, setFilterFinancialPlan] = useState<
    "all" | "monthly" | "annual"
  >("all");
  const [filterFinancialStatus, setFilterFinancialStatus] = useState<
    "all" | "active" | "past_due" | "canceled"
  >("all");

  // Dashboard period filter: hoje, 7dias, 30dias, 90dias, 1ano
  const [dashboardPeriod, setDashboardPeriod] = useState<
    "hoje" | "7dias" | "30dias" | "90dias" | "1ano"
  >("30dias");

  // User detail modal states
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [userEvents, setUserEvents] = useState<any[]>([]);
  const [userReviews, setUserReviews] = useState<any[]>([]);
  const [userActions, setUserActions] = useState<any[]>([]);
  const [actionReason, setActionReason] = useState("");
  const [modalTab, setModalTab] = useState<
    "activity" | "reviews" | "admin_history"
  >("activity");

  // Advertiser detail modal states
  const [selectedAdvertiser, setSelectedAdvertiser] = useState<any | null>(
    null,
  );
  const [advertiserReviews, setAdvertiserReviews] = useState<any[]>([]);
  const [advertiserPayments, setAdvertiserPayments] = useState<any[]>([]);
  const [advertiserStats, setAdvertiserStats] = useState({
    views: 0,
    clicks: 0,
    favorites: 0,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [advertiserTab, setAdvertiserTab] = useState<
    "info" | "reviews" | "payments" | "services"
  >("info");
  const [advertiserPermission, setAdvertiserPermission] = useState<any | null>(
    null,
  );
  const [editMaxServicos, setEditMaxServicos] = useState<number>(1);
  const [editHasCatalog, setEditHasCatalog] = useState(false);

  // Promotion states
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [promoCategory, setPromoCategory] = useState("");
  const [promoHasCatalog, setPromoHasCatalog] = useState(false);
  const [promoting, setPromoting] = useState(false);

  // Report detail modal states
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [reportActionReason, setReportActionReason] = useState("");

  // Edit fields states for Advertiser
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editNeighborhood, setEditNeighborhood] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editWhatsapp, setEditWhatsapp] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPlan, setEditPlan] = useState("");
  const [editPlanId, setEditPlanId] = useState<string | null>(null);
  const [editPlanStatus, setEditPlanStatus] = useState("gratuito");
  const [editBillingCycle, setEditBillingCycle] = useState("monthly");
  const [editPlanExpiresAt, setEditPlanExpiresAt] = useState("");
  const [editPlanStartedAt, setEditPlanStartedAt] = useState("");
  const [editBusinessType, setEditBusinessType] = useState("servicos");
  const [editDeliveryTime, setEditDeliveryTime] = useState("");
  const [editIsVerified, setEditIsVerified] = useState(false);
  const [editTopBadge, setEditTopBadge] = useState<string | null>(null);
  const [editDestaque, setEditDestaque] = useState(false);
  const [isAdLoading, setIsAdLoading] = useState(false);
  const [existingAd, setExistingAd] = useState<any | null>(null);
  const [adTitle, setAdTitle] = useState("");
  const [adDescription, setAdDescription] = useState("");
  const [adImageUrl, setAdImageUrl] = useState("");
  const [adIsFeatured, setAdIsFeatured] = useState(true);
  const [plansList, setPlansList] = useState<any[]>([]);

  // Promote custom states
  const [promoBusinessType, setPromoBusinessType] = useState("servicos");
  const [promoDeliveryTime, setPromoDeliveryTime] = useState("");

  const fetchData = async () => {
    try {
      // Fetch users
      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      if (usersError) throw usersError;

      // Fetch providers
      const { data: providers, error: providersError } = await supabase
        .from("providers")
        .select("*")
        .order("created_at", { ascending: false });

      if (providersError) throw providersError;

      // Fetch payments
      const { data: payments, error: paymentsError } = await supabase
        .from("pagamentos")
        .select("*");

      if (paymentsError)
        console.warn("Erro ao buscar pagamentos:", paymentsError);

      // Fetch app events
      const { data: events, error: eventsError } = await supabase
        .from("app_events")
        .select("*");

      if (eventsError) console.warn("Erro ao buscar eventos:", eventsError);

      // Fetch reports (denuncias)
      const { data: denuncias, error: denunciasError } = await supabase
        .from("denuncias")
        .select("*")
        .order("created_at", { ascending: false });

      if (denunciasError)
        console.warn("Erro ao buscar denúncias:", denunciasError);

      // Fetch report actions log
      const { data: reportActions, error: reportActionsError } = await supabase
        .from("admin_report_actions")
        .select("*")
        .order("created_at", { ascending: false });

      if (reportActionsError)
        console.warn("Erro ao buscar ações em denúncias:", reportActionsError);

      // Fetch subscriptions
      const { data: subscriptions, error: subscriptionsError } = await supabase
        .from("subscriptions")
        .select("*")
        .order("created_at", { ascending: false });

      if (subscriptionsError)
        console.warn("Erro ao buscar assinaturas:", subscriptionsError);

      // Fetch app settings
      const { data: settings, error: settingsError } = await supabase
        .from("app_settings")
        .select("*");

      if (settingsError)
        console.warn("Erro ao buscar configurações:", settingsError);

      // Fetch admin activity logs
      const { data: activityLogs, error: activityLogsError } = await supabase
        .from("admin_activity_logs")
        .select("*")
        .order("created_at", { ascending: false });

      if (activityLogsError)
        console.warn("Erro ao buscar logs de atividades:", activityLogsError);

      // Fetch categories
      const { data: categories, error: categoriesError } = await supabase
        .from("categories")
        .select("*")
        .order("name", { ascending: true });

      if (categoriesError)
        console.warn("Erro ao buscar categorias:", categoriesError);

      // Fetch referrals
      const { data: referrals, error: referralsError } = await supabase
        .from("referrals")
        .select("*")
        .order("created_at", { ascending: false });

      if (referralsError)
        console.warn("Erro ao buscar indicações:", referralsError);

      // Fetch partners
      const { data: partners, error: partnersError } = await supabase
        .from("partners")
        .select("*")
        .order("created_at", { ascending: false });

      if (partnersError)
        console.warn("Erro ao buscar parceiros:", partnersError);

      // Fetch plans
      const { data: plans, error: plansError } = await supabase
        .from("plans")
        .select("*, benefits:plan_benefits(*)")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (plansError)
        console.warn("Erro ao buscar planos:", plansError);

      setUsersList(users || []);
      setProvidersList(providers || []);
      setPaymentsList(payments || []);
      setEventsList(events || []);
      setReportsList(denuncias || []);
      setReportActionsList(reportActions || []);
      setSubscriptionsList(subscriptions || []);
      setAppSettingsList(settings || []);
      setActivityLogsList(activityLogs || []);
      setCategoriesList(categories || []);
      setReferralsList(referrals || []);
      setPartnersList(partners || []);
      setPlansList(plans || []);

      // Initialize settings form states with current database values
      if (settings) {
        const maint = settings.find((s) => s.key === "maintenance_mode");
        if (maint) setMaintenanceMode(maint.value === "true");

        const whatsapp = settings.find((s) => s.key === "contact_whatsapp");
        if (whatsapp) setContactWhatsapp(whatsapp.value);

        const rating = settings.find((s) => s.key === "min_rating_featured");
        if (rating) setMinRatingFeatured(parseFloat(rating.value) || 4.5);

        const version = settings.find((s) => s.key === "app_version");
        if (version) setAppVersion(version.value);
      }

      // Refresh opened user
      if (selectedUser) {
        const refreshedUser = users?.find(
          (u) => u.open_id === selectedUser.open_id,
        );
        if (refreshedUser) {
          setSelectedUser(refreshedUser);
          const { data: actions } = await supabase
            .from("admin_user_actions")
            .select("*")
            .eq("user_id", refreshedUser.open_id)
            .order("created_at", { ascending: false });
          setUserActions(actions || []);
        } else {
          setSelectedUser(null);
        }
      }

      // Refresh opened advertiser
      if (selectedAdvertiser) {
        const refreshedAd = providers?.find(
          (p) => p.id === selectedAdvertiser.id,
        );
        if (refreshedAd) {
          setSelectedAdvertiser(refreshedAd);
        } else {
          setSelectedAdvertiser(null);
        }
      }

      // Refresh opened report
      if (selectedReport) {
        const refreshedRep = denuncias?.find((r) => r.id === selectedReport.id);
        if (refreshedRep) {
          setSelectedReport(refreshedRep);
        } else {
          setSelectedReport(null);
        }
      }
    } catch (err: any) {
      console.error("Erro ao carregar dados do painel:", err);
      alert(
        "Falha ao carregar dados do Supabase. Verifique a console ou permissões RLS.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Helper to log admin actions
  const logAdminActivity = async (actionType: string, details: string) => {
    try {
      const role = adminUser.admin_role || "principal";
      const { error } = await supabase.from("admin_activity_logs").insert({
        admin_email: adminUser.email,
        admin_role: role,
        action_type: actionType,
        details: details,
      });
      if (error) console.error("Erro ao registrar log de atividade:", error);
    } catch (err) {
      console.error("Erro ao registrar log de atividade:", err);
    }
  };

  // Helper: Get type of user
  const getUserType = (openId: string) => {
    const provider = providersList.find((p) => p.user_id === openId);
    if (!provider) return "cliente";
    return provider.category_id === "comercios" ? "comércio" : "prestador";
  };

  // Helper: Get user phone
  const getUserPhone = (user: any) => {
    if (user.phone) return user.phone;
    const provider = providersList.find((p) => p.user_id === user.open_id);
    return provider ? provider.whatsapp || provider.phone || "-" : "-";
  };

  // Helper: Get name of report author
  const getReporterName = (reporterId: string) => {
    const user = usersList.find((u) => u.open_id === reporterId);
    return user
      ? user.name || user.email || "Usuário sem nome"
      : "Usuário Desconhecido";
  };

  // Helper: Get name of reported user/provider
  const getReportedName = (reportedId: string, type: string) => {
    if (type === "prestador" || type === "comércio") {
      const provider = providersList.find(
        (p) => p.id === reportedId || p.user_id === reportedId,
      );
      return provider ? provider.name : "Prestador/Comércio Desconhecido";
    }
    const user = usersList.find((u) => u.open_id === reportedId);
    return user
      ? user.name || user.email || "Cliente sem nome"
      : "Cliente Desconhecido";
  };

  // Helper: Map reasons to friendly labels
  const mapReasonLabel = (reason: string) => {
    switch (reason) {
      case "perfil_falso":
        return "Perfil falso";
      case "golpe":
        return "Golpe";
      case "informacoes_incorretas":
        return "Informações incorretas";
      case "comportamento_inadequado":
        return "Comportamento inadequado";
      case "outro":
        return "Outro";
      default:
        return reason;
    }
  };

  // Denúncia Actions (resolvido, suspender, bloquear)
  const handleResolveReport = async (
    actionType: "resolvido" | "suspender" | "bloquear",
  ) => {
    if (!selectedReport) return;
    if (!reportActionReason.trim()) {
      alert("Por favor, preencha a justificativa da ação.");
      return;
    }

    if (
      adminUser.admin_role === "moderador" &&
      (actionType === "suspender" || actionType === "bloquear")
    ) {
      alert(
        "Permissão insuficiente. Moderadores só podem marcar denúncias como resolvidas sem aplicar suspensão ou bloqueio diretamente.",
      );
      return;
    }

    const confirmMsg = `Tem certeza que deseja aplicar a ação "${actionType.toUpperCase()}" para esta denúncia?`;
    if (!window.confirm(confirmMsg)) return;

    setModalLoading(true);

    try {
      const reportId = selectedReport.id;
      const reportedId = selectedReport.reported_id;
      const reportedType = selectedReport.reported_type;

      // 1. If suspender or bloquear, execute the user/provider status updates
      if (actionType === "suspender") {
        if (reportedType === "cliente") {
          const { error } = await supabase
            .from("users")
            .update({ status: "suspenso" })
            .eq("open_id", reportedId);
          if (error) throw error;
        } else {
          // Provider / Commerce
          const provider = providersList.find(
            (p) => p.id === reportedId || p.user_id === reportedId,
          );
          if (provider) {
            const { error: pError } = await supabase
              .from("providers")
              .update({ is_active: false, status: "suspenso" })
              .eq("id", provider.id);
            if (pError) throw pError;

            if (provider.user_id) {
              const { error: uError } = await supabase
                .from("users")
                .update({ status: "suspenso" })
                .eq("open_id", provider.user_id);
              if (uError) throw uError;
            }
          }
        }

        // Insert log in admin_user_actions
        const targetUserId =
          reportedType === "cliente"
            ? reportedId
            : providersList.find((p) => p.id === reportedId)?.user_id ||
              reportedId;
        await supabase.from("admin_user_actions").insert({
          user_id: targetUserId,
          action_type: "suspender",
          reason: `Suspenso via denúncia #${reportId}: ${reportActionReason}`,
          admin_email: adminUser.email,
        });
      } else if (actionType === "bloquear") {
        if (reportedType === "cliente") {
          const { error } = await supabase
            .from("users")
            .update({ status: "bloqueado" })
            .eq("open_id", reportedId);
          if (error) throw error;
        } else {
          const provider = providersList.find(
            (p) => p.id === reportedId || p.user_id === reportedId,
          );
          if (provider) {
            const { error: pError } = await supabase
              .from("providers")
              .update({ is_active: false, status: "bloqueado" })
              .eq("id", provider.id);
            if (pError) throw pError;

            if (provider.user_id) {
              const { error: uError } = await supabase
                .from("users")
                .update({ status: "bloqueado" })
                .eq("open_id", provider.user_id);
              if (uError) throw uError;
            }
          }
        }

        const targetUserId =
          reportedType === "cliente"
            ? reportedId
            : providersList.find((p) => p.id === reportedId)?.user_id ||
              reportedId;
        await supabase.from("admin_user_actions").insert({
          user_id: targetUserId,
          action_type: "bloquear",
          reason: `Bloqueado via denúncia #${reportId}: ${reportActionReason}`,
          admin_email: adminUser.email,
        });
      }

      // 2. Insert report resolution action log
      const { error: actionLogErr } = await supabase
        .from("admin_report_actions")
        .insert({
          report_id: reportId,
          action_type: actionType,
          reason: reportActionReason,
          admin_email: adminUser.email,
        });
      if (actionLogErr) throw actionLogErr;

      // 3. Mark the report itself as resolved
      const { error: reportErr } = await supabase
        .from("denuncias")
        .update({ status: "resolvido", updated_at: new Date().toISOString() })
        .eq("id", reportId);
      if (reportErr) throw reportErr;

      alert(
        `Denúncia #${reportId} resolvida com sucesso! Ação executada: ${actionType.toUpperCase()}`,
      );
      await logAdminActivity(
        "resolve_report",
        `Denúncia #${reportId} resolvida com ação: ${actionType}. Alvo: ${reportedId}. Justificativa: ${reportActionReason}`,
      );
      setReportActionReason("");
      await fetchData();
    } catch (err: any) {
      console.error("Erro ao resolver denúncia:", err);
      alert(
        `Erro: ${err.message || "Não foi possível concluir a resolução da denúncia."}`,
      );
    } finally {
      setModalLoading(false);
    }
  };

  // Fetch related details for user modal
  const handleSelectUser = async (user: any) => {
    setSelectedUser(user);
    setModalLoading(true);
    setActionReason("");
    setModalTab("activity");
    setUserEvents([]);
    setUserReviews([]);
    setUserActions([]);
    setPromoCategory("");
    setPromoHasCatalog(false);

    try {
      const { data: events } = await supabase
        .from("app_events")
        .select("*")
        .eq("usuario_id", user.open_id)
        .order("created_at", { ascending: false });

      const { data: reviews } = await supabase
        .from("reviews")
        .select("*")
        .eq("user_name", user.name)
        .order("created_at", { ascending: false });

      const { data: actions } = await supabase
        .from("admin_user_actions")
        .select("*")
        .eq("user_id", user.open_id)
        .order("created_at", { ascending: false });

      setUserEvents(events || []);
      setUserReviews(reviews || []);
      setUserActions(actions || []);
    } catch (err) {
      console.error("Erro ao carregar detalhes estendidos do usuário:", err);
    } finally {
      setModalLoading(false);
    }
  };

  // Fetch related details for advertiser modal
  const handleSelectAdvertiser = async (provider: any) => {
    setSelectedAdvertiser(provider);
    setModalLoading(true);
    setIsEditing(false);
    setAdvertiserTab("info");
    setAdvertiserReviews([]);
    setAdvertiserPayments([]);
    setAdvertiserPermission(null);
    setEditMaxServicos(1);

    // Initialize edit fields
    setEditName(provider.name || "");
    setEditCategory(provider.category || "");
    setEditCity(provider.city || "");
    setEditNeighborhood(provider.neighborhood || "");
    setEditPhone(provider.phone || "");
    setEditWhatsapp(provider.whatsapp || "");
    setEditAddress(provider.address || "");
    setEditDescription(provider.description || "");
    setEditPlan(provider.plan || "free");
    setEditPlanId(provider.plan_id || null);
    setEditPlanStatus(provider.plan_status || "gratuito");
    setEditBillingCycle(provider.billing_cycle || "monthly");
    setEditPlanExpiresAt(
      provider.plan_expires_at ? provider.plan_expires_at.split("T")[0] : "",
    );
    setEditPlanStartedAt(
      provider.plan_started_at ? provider.plan_started_at.split("T")[0] : "",
    );
    setEditHasCatalog(provider.has_catalog || false);
    setEditBusinessType(provider.business_type || "servicos");
    setEditDeliveryTime(provider.delivery_time || "");
    setEditIsVerified(provider.is_verified || false);
    setEditTopBadge(provider.top_badge || null);
    setEditDestaque(provider.destaque || false);
    setExistingAd(null);
    setAdTitle(provider.category || "");
    setAdImageUrl(provider.cover_thumbnail_uri || provider.avatar_thumbnail_uri || provider.avatar_uri || "");
    setAdDescription("");
    setAdIsFeatured(true);

    try {
      // 1. Fetch reviews
      const { data: reviews } = await supabase
        .from("reviews")
        .select("*")
        .eq("professional_id", provider.id)
        .order("created_at", { ascending: false });

      // 2. Fetch payments
      const { data: payments } = await supabase
        .from("pagamentos")
        .select("*")
        .eq("prestador_id", provider.id)
        .order("data_pagamento", { ascending: false });

      // 3. Fetch analytics counts
      const { count: viewsCount } = await supabase
        .from("service_views")
        .select("*", { count: "exact", head: true })
        .eq("service_id", provider.id);

      const { count: clicksCount } = await supabase
        .from("whatsapp_clicks")
        .select("*", { count: "exact", head: true })
        .eq("provider_id", provider.id);

      const { count: favoritesCount } = await supabase
        .from("favorites")
        .select("*", { count: "exact", head: true })
        .eq("provider_id", provider.id);

      // 4. Fetch business permissions
      const { data: permData } = await supabase
        .from("business_permissions")
        .select("*")
        .eq("business_id", provider.id)
        .maybeSingle();

      if (permData) {
        setAdvertiserPermission(permData);
        setEditMaxServicos(permData.max_servicos);
      }

      // 5. Fetch associated featured ad (sponsorship banner)
      setIsAdLoading(true);
      const { data: ads } = await supabase
        .from("featured_ads")
        .select("*");
      if (ads) {
        const assocAd = ads.find((a: any) => {
          try {
            if (a.description?.startsWith("{")) {
              const parsed = JSON.parse(a.description);
              return parsed.providerId === provider.id;
            }
          } catch (e) {}
          return a.description === provider.id;
        });
        if (assocAd) {
          setExistingAd(assocAd);
          setAdTitle(assocAd.title || "");
          setAdImageUrl(assocAd.image_url || "");
          try {
            if (assocAd.description?.startsWith("{")) {
              setAdDescription(JSON.parse(assocAd.description).description || "");
            } else {
              setAdDescription("");
            }
          } catch (e) {
            setAdDescription("");
          }
          setAdIsFeatured(assocAd.is_featured);
        }
      }

      setAdvertiserReviews(reviews || []);
      setAdvertiserPayments(payments || []);
      setAdvertiserStats({
        views: viewsCount || 0,
        clicks: clicksCount || 0,
        favorites: favoritesCount || 0,
      });
    } catch (err) {
      console.error("Erro ao carregar detalhes do anunciante:", err);
    } finally {
      setModalLoading(false);
    }
  };

  // Edit advertiser info handler
  const handleSaveAdvertiserInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdvertiser) return;

    if (adminUser.admin_role === "moderador") {
      alert(
        "Permissão insuficiente. Moderadores não podem editar informações de anunciantes.",
      );
      return;
    }

    if (
      editBusinessType === "alimentacao" &&
      (!editDeliveryTime || !editDeliveryTime.trim())
    ) {
      alert("Por favor, digite o tempo estimado de entrega.");
      return;
    }

    setModalLoading(true);

    try {
      const { error } = await supabase
        .from("providers")
        .update({
          name: editName,
          category: editCategory,
          city: editCity,
          neighborhood: editNeighborhood,
          phone: editPhone,
          whatsapp: editWhatsapp,
          address: editAddress,
          description: editDescription,
          plan: editPlan,
          plan_id: editPlanId,
          plan_status: editPlanStatus,
          billing_cycle: editBillingCycle,
          plan_expires_at: editPlanExpiresAt
            ? new Date(editPlanExpiresAt).toISOString()
            : null,
          plan_started_at: editPlanStartedAt
            ? new Date(editPlanStartedAt).toISOString()
            : null,
          has_catalog: editHasCatalog,
          business_type: editBusinessType,
          delivery_time:
            editBusinessType === "alimentacao" ? editDeliveryTime : null,
          is_verified: editIsVerified,
          top_badge: editTopBadge,
        })
        .eq("id", selectedAdvertiser.id);

      if (error) throw error;

      // Save business permissions
      if (advertiserPermission) {
        const { error: permErr } = await supabase
          .from("business_permissions")
          .update({
            max_servicos: editMaxServicos,
            updated_at: new Date().toISOString(),
          })
          .eq("id", advertiserPermission.id);
        if (permErr) throw permErr;
      } else {
        const { data: newPerm, error: permErr } = await supabase
          .from("business_permissions")
          .insert({
            business_id: selectedAdvertiser.id,
            max_servicos: editMaxServicos,
            status: "ativo",
          })
          .select()
          .single();
        if (permErr) throw permErr;
        setAdvertiserPermission(newPerm);
      }

      alert("Informações do anunciante atualizadas com sucesso!");
      await logAdminActivity(
        "edit_advertiser",
        `Informações do anunciante ${selectedAdvertiser.name} (ID: ${selectedAdvertiser.id}) editadas. Plano: ${editPlan || "Gratuito"}, Status: ${editPlanStatus}, Ciclo: ${editBillingCycle}, Categoria: ${editCategory}`,
      );
      setIsEditing(false);
      await fetchData();
    } catch (err: any) {
      console.error("Erro ao salvar informações do anunciante:", err);
      alert(`Erro: ${err.message || "Não foi possível salvar as alterações."}`);
    } finally {
      setModalLoading(false);
    }
  };

  // Save or Update Featured Ad (Destaques em Evidência)
  const handleSaveFeaturedAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdvertiser) return;
    setModalLoading(true);
    try {
      const combinedDescription = JSON.stringify({
        providerId: selectedAdvertiser.id,
        description: adDescription,
      });

      if (existingAd) {
        // Update
        const { error } = await supabase
          .from("featured_ads")
          .update({
            title: adTitle,
            image_url: adImageUrl,
            description: combinedDescription,
            is_featured: adIsFeatured,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingAd.id);
        if (error) throw error;
        alert("Banner patrocinado atualizado com sucesso!");
      } else {
        // Create
        // Get max order first
        const { data: allAds } = await supabase.from("featured_ads").select("display_order");
        const maxOrder = allAds && allAds.length > 0 ? Math.max(...allAds.map((a: any) => a.display_order || 0)) : -1;
        const newId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

        const { error } = await supabase
          .from("featured_ads")
          .insert({
            id: newId,
            title: adTitle,
            provider_name: selectedAdvertiser.name,
            image_url: adImageUrl,
            description: combinedDescription,
            is_featured: adIsFeatured,
            display_order: maxOrder + 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        if (error) throw error;
        alert("Banner patrocinado criado com sucesso!");
      }
      
      // Reload advertiser modal details
      await handleSelectAdvertiser(selectedAdvertiser);
    } catch (err: any) {
      console.error("Erro ao salvar banner:", err);
      alert(`Erro: ${err.message || "Não foi possível salvar o banner."}`);
    } finally {
      setModalLoading(false);
    }
  };

  // Delete Featured Ad
  const handleDeleteFeaturedAd = async () => {
    if (!existingAd) return;
    if (!window.confirm("Tem certeza que deseja remover este anúncio patrocinado em evidência?")) return;
    setModalLoading(true);
    try {
      const { error } = await supabase
        .from("featured_ads")
        .delete()
        .eq("id", existingAd.id);
      if (error) throw error;
      alert("Banner patrocinado removido com sucesso!");
      // Reload
      await handleSelectAdvertiser(selectedAdvertiser);
    } catch (err: any) {
      console.error("Erro ao excluir banner:", err);
      alert(`Erro: ${err.message || "Não foi possível excluir o banner."}`);
    } finally {
      setModalLoading(false);
    }
  };

  // Save "Destaques para você" status
  const handleToggleDestaqueStatus = async (status: boolean) => {
    if (!selectedAdvertiser) return;
    setModalLoading(true);
    try {
      const { error } = await supabase
        .from("providers")
        .update({ destaque: status })
        .eq("id", selectedAdvertiser.id);
      if (error) throw error;
      alert(`Prestador ${status ? 'adicionado aos' : 'removido dos'} Destaques para você!`);
      // Update selected provider in local state
      setSelectedAdvertiser({ ...selectedAdvertiser, destaque: status });
      setEditDestaque(status);
      await fetchData();
    } catch (err: any) {
      console.error("Erro ao atualizar destaque:", err);
      alert(`Erro: ${err.message || "Não foi possível atualizar o status de destaque."}`);
    } finally {
      setModalLoading(false);
    }
  };

  // Advertiser Actions (ativar, desativar, suspender, aprovar, bloquear)
  const handleAdvertiserStatusAction = async (
    action: "ativar" | "desativar" | "suspender" | "aprovar" | "bloquear",
  ) => {
    if (!selectedAdvertiser) return;

    if (adminUser.admin_role === "moderador") {
      alert(
        "Permissão insuficiente. Moderadores não podem alterar o status de anunciantes.",
      );
      return;
    }

    const confirmMsg = `Tem certeza que deseja ${action} o negócio de ${selectedAdvertiser.name}?`;
    if (!window.confirm(confirmMsg)) return;

    setModalLoading(true);

    try {
      let updates: any = {};
      if (action === "ativar" || action === "aprovar") {
        updates = { is_active: true, status: "ativo" };
      } else if (action === "desativar") {
        updates = { is_active: false, status: "inativo" };
      } else if (action === "suspender") {
        updates = { is_active: false, status: "suspenso" };
      } else if (action === "bloquear") {
        updates = { is_active: false, status: "bloqueado" };
      }

      const { error } = await supabase
        .from("providers")
        .update(updates)
        .eq("id", selectedAdvertiser.id);

      if (error) throw error;

      // Update business_permissions status too if blocking/approving/suspending
      let permStatus = "ativo";
      if (action === "bloquear") permStatus = "bloqueado";
      else if (action === "suspender") permStatus = "suspenso";

      const { error: permErr } = await supabase
        .from("business_permissions")
        .update({ status: permStatus, updated_at: new Date().toISOString() })
        .eq("business_id", selectedAdvertiser.id);

      if (permErr) {
        console.warn("Could not update business_permissions status:", permErr);
      }

      alert(`Anúncio atualizado com status: ${updates.status.toUpperCase()}`);
      await logAdminActivity(
        `${action}_advertiser`,
        `Status do anunciante ${selectedAdvertiser.name} (ID: ${selectedAdvertiser.id}) alterado para: ${action}`,
      );
      await fetchData();
    } catch (err: any) {
      console.error("Erro ao alterar status do anúncio:", err);
      alert(`Erro: ${err.message || "Não foi possível concluir a ação."}`);
    } finally {
      setModalLoading(false);
    }
  };

  // Promote a user to provider / commerce
  const handlePromoteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (!promoCategory) {
      alert("Por favor, selecione uma categoria.");
      return;
    }

    if (
      promoBusinessType === "alimentacao" &&
      (!promoDeliveryTime || !promoDeliveryTime.trim())
    ) {
      alert("Por favor, digite o tempo estimado de entrega.");
      return;
    }

    if (adminUser.admin_role === "moderador") {
      alert(
        "Permissão insuficiente. Moderadores não podem criar ou promover anunciantes.",
      );
      return;
    }

    const confirmMsg = `Tem certeza que deseja promover o usuário "${selectedUser.name || selectedUser.email}" a Anunciante?`;
    if (!window.confirm(confirmMsg)) return;

    setPromoting(true);

    try {
      const selectedCat = categoriesList.find((c) => c.id === promoCategory);
      const categoryName = selectedCat ? selectedCat.name : "Serviços";

      // Generate a unique provider ID
      const providerId =
        "p_" +
        (typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
          ? crypto.randomUUID().replace(/-/g, "").substring(0, 20)
          : Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15));

      // 1. Insert provider
      const { error: pErr } = await supabase.from("providers").insert({
        id: providerId,
        user_id: selectedUser.open_id,
        name:
          selectedUser.name ||
          selectedUser.email?.split("@")[0] ||
          "Anunciante",
        category: categoryName,
        category_id: promoCategory,
        has_catalog: promoHasCatalog,
        is_active: true,
        status: "ativo",
        plan: "free",
        display_order: 0,
        clients_served: 0,
        rating: 0,
        rating_count: 0,
        business_type: promoBusinessType,
        delivery_time:
          promoBusinessType === "alimentacao" ? promoDeliveryTime : null,
      });

      if (pErr) throw pErr;

      // 2. Insert business permissions
      const { error: permErr } = await supabase
        .from("business_permissions")
        .insert({
          business_id: providerId,
          max_servicos: 10, // Default a reasonable number for services if promoted by admin
          status: "ativo",
        });

      if (permErr) console.warn("Erro ao inserir permissões padrão:", permErr);

      // 3. Log activity
      await logAdminActivity(
        "promote_user",
        `Usuário ${selectedUser.email} promovido a Anunciante (${categoryName}). ID do Anúncio: ${providerId}. Catálogo: ${promoHasCatalog ? "Sim" : "Não"}`,
      );

      alert("Usuário promovido com sucesso! Agora ele é um anunciante ativo.");

      // Reset promotion form
      setPromoCategory("");
      setPromoHasCatalog(false);
      setPromoBusinessType("servicos");
      setPromoDeliveryTime("");

      // Reload dashboard data
      await fetchData();
    } catch (err: any) {
      console.error("Erro ao promover usuário:", err);
      alert(`Erro ao promover usuário: ${err.message || err}`);
    } finally {
      setPromoting(false);
    }
  };

  // User Actions (suspender, bloquear, reativar, excluir)
  const handleUserAction = async (
    actionType: "suspender" | "bloquear" | "reativar" | "excluir",
  ) => {
    if (!selectedUser) return;

    if (adminUser.admin_role === "moderador") {
      alert(
        "Permissão insuficiente. Moderadores não podem realizar ações administrativas em contas de usuários.",
      );
      return;
    }

    if (!actionReason.trim()) {
      alert("Por favor, informe o motivo da ação administrativa.");
      return;
    }

    const confirmMessage = `Tem certeza que deseja ${actionType} a conta de ${selectedUser.name}?`;
    if (!window.confirm(confirmMessage)) return;

    setModalLoading(true);

    try {
      if (actionType === "excluir") {
        await supabase
          .from("providers")
          .delete()
          .eq("user_id", selectedUser.open_id);
        await supabase
          .from("favorites")
          .delete()
          .eq("user_id", selectedUser.open_id);

        const { error: deleteErr } = await supabase
          .from("users")
          .delete()
          .eq("open_id", selectedUser.open_id);

        if (deleteErr) throw deleteErr;

        alert(`Conta de ${selectedUser.name} foi excluída permanentemente.`);
        await logAdminActivity(
          "delete_user",
          `Conta excluída permanentemente: ${selectedUser.name} (${selectedUser.email || "sem email"}, open_id: ${selectedUser.open_id}). Motivo: ${actionReason}`,
        );
        setSelectedUser(null);
      } else {
        const nextStatus =
          actionType === "suspender"
            ? "suspenso"
            : actionType === "bloquear"
              ? "bloqueado"
              : "ativo";

        const { error: updateErr } = await supabase
          .from("users")
          .update({ status: nextStatus })
          .eq("open_id", selectedUser.open_id);

        if (updateErr) throw updateErr;

        const { error: logErr } = await supabase
          .from("admin_user_actions")
          .insert({
            user_id: selectedUser.open_id,
            action_type: actionType,
            reason: actionReason,
            admin_email: adminUser.email,
          });

        if (logErr) throw logErr;

        alert(`Ação de ${actionType} executada com sucesso.`);
        await logAdminActivity(
          `${actionType}_user`,
          `Usuário ${selectedUser.name} (open_id: ${selectedUser.open_id}) status alterado para: ${nextStatus}. Motivo: ${actionReason}`,
        );
        setActionReason("");
      }

      await fetchData();
    } catch (err: any) {
      console.error("Erro ao executar ação administrativa:", err);
      alert(`Erro: ${err.message || "Não foi possível concluir a ação."}`);
    } finally {
      setModalLoading(false);
    }
  };

  // Promote a user to admin role
  const handlePromoteAdmin = async () => {
    if (adminUser.admin_role !== "principal") {
      alert(
        "Permissão insuficiente. Apenas administradores principais podem promover administradores.",
      );
      return;
    }
    if (!selectedNewAdmin) {
      alert("Por favor, selecione um usuário para promover.");
      return;
    }
    try {
      const { error } = await supabase
        .from("users")
        .update({
          role: "admin",
          admin_role: newAdminRole,
        })
        .eq("open_id", selectedNewAdmin.open_id);

      if (error) throw error;

      alert(
        `Usuário ${selectedNewAdmin.name || selectedNewAdmin.email} promovido a Administrador (${newAdminRole.toUpperCase()}) com sucesso!`,
      );
      await logAdminActivity(
        "promote_admin",
        `Promoveu usuário ${selectedNewAdmin.name} (${selectedNewAdmin.email}, open_id: ${selectedNewAdmin.open_id}) para cargo: ${newAdminRole}`,
      );
      setNewAdminSearch("");
      setSelectedNewAdmin(null);
      await fetchData();
    } catch (err: any) {
      alert(`Erro ao promover usuário: ${err.message}`);
    }
  };

  // Change existing admin's role
  const handleUpdateAdminRole = async (targetUser: any, nextRole: string) => {
    if (adminUser.admin_role !== "principal") {
      alert(
        "Permissão insuficiente. Apenas administradores principais podem alterar cargos.",
      );
      return;
    }
    const confirmMsg = `Tem certeza de que deseja alterar o cargo de ${targetUser.name || targetUser.email} para ${nextRole.toUpperCase()}?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const { error } = await supabase
        .from("users")
        .update({ admin_role: nextRole })
        .eq("open_id", targetUser.open_id);

      if (error) throw error;

      alert("Cargo atualizado com sucesso!");
      await logAdminActivity(
        "update_admin_role",
        `Alterou cargo do admin ${targetUser.name || targetUser.email} (${targetUser.email}) para: ${nextRole}`,
      );
      await fetchData();
    } catch (err: any) {
      alert(`Erro ao alterar cargo: ${err.message}`);
    }
  };

  // Demote admin back to normal user status
  const handleDemoteAdmin = async (targetUser: any) => {
    if (adminUser.admin_role !== "principal") {
      alert(
        "Permissão insuficiente. Apenas administradores principais podem demover administradores.",
      );
      return;
    }
    if (targetUser.email === adminUser.email) {
      alert("Você não pode demover a si mesmo!");
      return;
    }
    const confirmMsg = `Tem certeza de que deseja demover ${targetUser.name || targetUser.email} de administrador para usuário comum?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const { error } = await supabase
        .from("users")
        .update({ role: "client", admin_role: null })
        .eq("open_id", targetUser.open_id);

      if (error) throw error;

      alert("Administrador removido com sucesso!");
      await logAdminActivity(
        "demote_admin",
        `Demoveu administrador ${targetUser.name || targetUser.email} (${targetUser.email}) para usuário comum`,
      );
      await fetchData();
    } catch (err: any) {
      alert(`Erro ao demover administrador: ${err.message}`);
    }
  };

  // Update logged-in admin's own password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("As senhas não coincidem!");
      return;
    }
    if (newPassword.length < 6) {
      alert("A senha deve ter pelo menos 6 caracteres!");
      return;
    }
    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      alert("Senha alterada com sucesso!");
      await logAdminActivity(
        "change_password",
        "Administrador alterou sua própria senha",
      );
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      alert(`Erro ao alterar senha: ${err.message}`);
    } finally {
      setPasswordLoading(false);
    }
  };

  // Save global app configuration keys
  const handleSaveAppSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adminUser.admin_role !== "principal") {
      alert(
        "Permissão insuficiente. Apenas administradores principais podem alterar as configurações do app.",
      );
      return;
    }
    setSavingSettings(true);
    try {
      const settingsToUpdate = [
        { key: "maintenance_mode", value: maintenanceMode.toString() },
        { key: "contact_whatsapp", value: contactWhatsapp },
        { key: "min_rating_featured", value: minRatingFeatured.toString() },
        { key: "app_version", value: appVersion },
      ];

      for (const setting of settingsToUpdate) {
        const { error } = await supabase
          .from("app_settings")
          .update({
            value: setting.value,
            updated_at: new Date().toISOString(),
            updated_by: adminUser.email,
          })
          .eq("key", setting.key);
        if (error) throw error;
      }

      alert("Configurações gerais do aplicativo salvas com sucesso!");
      await logAdminActivity(
        "update_app_settings",
        `Configurações gerais do app atualizadas: Manutenção=${maintenanceMode}, Whats=${contactWhatsapp}, MinRating=${minRatingFeatured}, Versão=${appVersion}`,
      );
      await fetchData();
    } catch (err: any) {
      alert(`Erro ao salvar configurações: ${err.message}`);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleUpdateReferralStatus = async (
    referralId: number,
    newStatus: string,
  ) => {
    try {
      const { error } = await supabase
        .from("referrals")
        .update({ status: newStatus })
        .eq("id", referralId);

      if (error) throw error;

      alert("Status da indicação atualizado com sucesso!");
      await logAdminActivity(
        "update_referral_status",
        `Status da indicação ID ${referralId} alterado para ${newStatus}`,
      );
      await fetchData();
    } catch (err: any) {
      console.error("Erro ao atualizar status da indicação:", err);
      alert(`Erro: ${err.message || "Não foi possível atualizar o status."}`);
    }
  };

  // Date helper for registrations in the last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Helper to fetch user's associated address from providers table
  const getUserAddress = (openId: string) => {
    const provider = providersList.find((p) => p.user_id === openId);
    if (!provider) return null;
    if (!provider.address && !provider.neighborhood && !provider.city)
      return null;
    return {
      address: provider.address || "Sem endereço cadastrado",
      neighborhood: provider.neighborhood || "Sem bairro",
      city: provider.city || "Sem cidade",
    };
  };

  // Filter providers from comércios
  const prestadores = providersList.filter(
    (p) => p.category_id !== "comercios",
  );
  const comercios = providersList.filter((p) => p.category_id === "comercios");

  // Basic Stats
  const totalUsers = usersList.length;
  const totalProviders = prestadores.length;
  const totalCommerce = comercios.length;

  const newUsersToday = usersList.filter((u) => {
    const d = new Date(u.created_at);
    return d.toDateString() === new Date().toDateString();
  }).length;

  const newRegistrationsWeek = usersList.filter(
    (u) => new Date(u.created_at) >= sevenDaysAgo,
  ).length;

  const getEstimatedRevenue = () => {
    const now = new Date();
    let filterDate = new Date();
    if (dashboardPeriod === "hoje") {
      filterDate.setHours(0, 0, 0, 0);
    } else if (dashboardPeriod === "7dias") {
      filterDate.setDate(now.getDate() - 7);
    } else if (dashboardPeriod === "30dias") {
      filterDate.setDate(now.getDate() - 30);
    } else if (dashboardPeriod === "1ano") {
      filterDate.setFullYear(now.getFullYear() - 1);
    }

    const filteredPayments = paymentsList.filter((p) => {
      const d = new Date(p.data_pagamento || p.criado_em || p.created_at);
      return d >= filterDate;
    });

    const sum = filteredPayments.reduce(
      (total, p) => total + (p.valor || 0),
      0,
    );
    if (sum > 0) return sum;

    const monthlyActive = providersList.filter(
      (p) => p.plan === "monthly" && p.is_active,
    ).length;
    const annualActive = providersList.filter(
      (p) => p.plan === "annual" && p.is_active,
    ).length;
    // Use locked_price from each provider for accurate MRR
    const mrr = providersList
      .filter(p => p.plan_status === "ativo" && p.is_active)
      .reduce((sum, p) => {
        const monthly = p.billing_cycle === "annual"
          ? (p.locked_price || 0) / 12
          : (p.locked_price || 0);
        return sum + monthly;
      }, 0);

    let est = mrr;
    if (dashboardPeriod === "hoje") est = mrr / 30;
    else if (dashboardPeriod === "7dias") est = (mrr / 30) * 7;
    else if (dashboardPeriod === "1ano") est = mrr * 12;

    return est > 0
      ? est
      : dashboardPeriod === "hoje"
        ? 15
        : dashboardPeriod === "7dias"
          ? 120
          : dashboardPeriod === "30dias"
            ? 520
            : 6240;
  };

  const getChartPoints = () => {
    const now = new Date();
    const points: {
      label: string;
      users: number;
      providers: number;
      accesses: number;
    }[] = [];

    if (dashboardPeriod === "hoje") {
      const slots = [
        {
          label: "00-04h",
          start: 0,
          end: 4,
          fallbackUsers: 1,
          fallbackProvs: 0,
          fallbackAcc: 4,
        },
        {
          label: "04-08h",
          start: 4,
          end: 8,
          fallbackUsers: 2,
          fallbackProvs: 1,
          fallbackAcc: 9,
        },
        {
          label: "08-12h",
          start: 8,
          end: 12,
          fallbackUsers: 5,
          fallbackProvs: 2,
          fallbackAcc: 32,
        },
        {
          label: "12-16h",
          start: 12,
          end: 16,
          fallbackUsers: 4,
          fallbackProvs: 1,
          fallbackAcc: 28,
        },
        {
          label: "16-20h",
          start: 16,
          end: 20,
          fallbackUsers: 7,
          fallbackProvs: 3,
          fallbackAcc: 44,
        },
        {
          label: "20-24h",
          start: 20,
          end: 24,
          fallbackUsers: 3,
          fallbackProvs: 1,
          fallbackAcc: 18,
        },
      ];

      slots.forEach((slot) => {
        const uCount = usersList.filter((u) => {
          const d = new Date(u.created_at);
          return (
            d.toDateString() === now.toDateString() &&
            d.getHours() >= slot.start &&
            d.getHours() < slot.end
          );
        }).length;

        const pCount = providersList.filter((p) => {
          const d = new Date(p.created_at);
          return (
            d.toDateString() === now.toDateString() &&
            d.getHours() >= slot.start &&
            d.getHours() < slot.end
          );
        }).length;

        const aCount = eventsList.filter((e) => {
          const d = new Date(e.created_at || e.criadoEm);
          return (
            d.toDateString() === now.toDateString() &&
            d.getHours() >= slot.start &&
            d.getHours() < slot.end
          );
        }).length;

        points.push({
          label: slot.label,
          users: uCount || slot.fallbackUsers,
          providers: pCount || slot.fallbackProvs,
          accesses: aCount || slot.fallbackAcc,
        });
      });
    } else if (dashboardPeriod === "7dias") {
      const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
      const fallbackUsers = [4, 6, 8, 5, 12, 9, 3];
      const fallbackProvs = [1, 2, 2, 1, 3, 2, 0];
      const fallbackAcc = [25, 42, 60, 48, 88, 72, 35];

      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const dayLabel = days[d.getDay()];

        const uCount = usersList.filter(
          (u) => new Date(u.created_at).toDateString() === d.toDateString(),
        ).length;
        const pCount = providersList.filter(
          (p) => new Date(p.created_at).toDateString() === d.toDateString(),
        ).length;
        const aCount = eventsList.filter(
          (e) =>
            new Date(e.created_at || e.criadoEm).toDateString() ===
            d.toDateString(),
        ).length;

        points.push({
          label: dayLabel,
          users: uCount || fallbackUsers[6 - i],
          providers: pCount || fallbackProvs[6 - i],
          accesses: aCount || fallbackAcc[6 - i],
        });
      }
    } else if (dashboardPeriod === "30dias") {
      const fallbackUsers = [15, 22, 18, 28, 32, 25];
      const fallbackProvs = [3, 6, 4, 7, 8, 5];
      const fallbackAcc = [110, 180, 140, 220, 260, 210];

      for (let i = 5; i >= 0; i--) {
        const end = new Date();
        end.setDate(now.getDate() - i * 5);
        const start = new Date();
        start.setDate(now.getDate() - (i + 1) * 5);

        const label = `${start.getDate()}/${start.getMonth() + 1}`;

        const uCount = usersList.filter((u) => {
          const d = new Date(u.created_at);
          return d >= start && d <= end;
        }).length;

        const pCount = providersList.filter((p) => {
          const d = new Date(p.created_at);
          return d >= start && d <= end;
        }).length;

        const aCount = eventsList.filter((e) => {
          const d = new Date(e.created_at || e.criadoEm);
          return d >= start && d <= end;
        }).length;

        points.push({
          label,
          users: uCount || fallbackUsers[5 - i],
          providers: pCount || fallbackProvs[5 - i],
          accesses: aCount || fallbackAcc[5 - i],
        });
      }
    } else {
      const months = [
        "Jan",
        "Fev",
        "Mar",
        "Abr",
        "Mai",
        "Jun",
        "Jul",
        "Ago",
        "Set",
        "Out",
        "Nov",
        "Dez",
      ];
      const fallbackUsers = [
        80, 110, 95, 120, 145, 130, 155, 170, 160, 190, 210, 240,
      ];
      const fallbackProvs = [15, 22, 18, 25, 30, 28, 34, 38, 35, 42, 48, 55];
      const fallbackAcc = [
        450, 620, 580, 720, 890, 810, 960, 1100, 1020, 1250, 1380, 1550,
      ];

      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthLabel = months[d.getMonth()];

        const uCount = usersList.filter((u) => {
          const ud = new Date(u.created_at);
          return (
            ud.getMonth() === d.getMonth() &&
            ud.getFullYear() === d.getFullYear()
          );
        }).length;

        const pCount = providersList.filter((p) => {
          const pd = new Date(p.created_at);
          return (
            pd.getMonth() === d.getMonth() &&
            pd.getFullYear() === d.getFullYear()
          );
        }).length;

        const aCount = eventsList.filter((e) => {
          const ed = new Date(e.created_at || e.criadoEm);
          return (
            ed.getMonth() === d.getMonth() &&
            ed.getFullYear() === d.getFullYear()
          );
        }).length;

        points.push({
          label: monthLabel,
          users: uCount || fallbackUsers[11 - i],
          providers: pCount || fallbackProvs[11 - i],
          accesses: aCount || fallbackAcc[11 - i],
        });
      }
    }

    return points;
  };

  const chartPoints = getChartPoints();

  // Categories bar chart data
  const getTopCategoriesData = () => {
    const counts: Record<string, number> = {};
    eventsList.forEach((e) => {
      if (e.tipo_evento === "busca" && e.valor) {
        const term = e.valor.trim();
        if (term.length > 2) {
          counts[term] = (counts[term] || 0) + 1;
        }
      }
    });

    const fallbackCategories = [
      { label: "Reformas e Reparos", value: 68 },
      { label: "Assistência Técnica", value: 52 },
      { label: "Bares e Restaurantes", value: 41 },
      { label: "Beleza e Bem-Estar", value: 34 },
      { label: "Aulas e Cursos", value: 24 },
    ];

    const sorted = Object.entries(counts)
      .map(([label, value]) => ({
        label: label.charAt(0).toUpperCase() + label.slice(1),
        value,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return sorted.length > 0 ? sorted : fallbackCategories;
  };

  const topCategories = getTopCategoriesData();

  // Cities bar chart data
  const getTopCitiesData = () => {
    const counts: Record<string, number> = {};
    providersList.forEach((p) => {
      if (p.city) {
        const c = p.city.trim();
        counts[c] = (counts[c] || 0) + 1;
      }
    });

    const fallbackCities = [
      { label: "Bragança Paulista", value: 62 },
      { label: "Atibaia", value: 38 },
      { label: "Itatiba", value: 24 },
      { label: "Campinas", value: 17 },
      { label: "São Paulo", value: 11 },
    ];

    const sorted = Object.entries(counts)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return sorted.length > 0 ? sorted : fallbackCities;
  };

  const topCities = getTopCitiesData();

  // Filtered lists for Users
  const filteredUsers = usersList.filter((u) => {
    const term = searchUser.toLowerCase();
    const type = getUserType(u.open_id);
    const status = u.status || "ativo";

    const matchesSearch =
      (u.name && u.name.toLowerCase().includes(term)) ||
      (u.email && u.email.toLowerCase().includes(term)) ||
      getUserPhone(u).includes(term);

    const matchesType = filterUserType === "all" || type === filterUserType;
    const matchesStatus =
      filterUserStatus === "all" || status === filterUserStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  // Filtered lists for Advertisers (unified Prestadores and Comércios)
  const filteredAdvertisers = providersList.filter((p) => {
    const term = searchAdvertiser.toLowerCase();
    const isCom = p.category_id === "comercios";
    const type = isCom ? "comércio" : "prestador";
    const status = p.status || "ativo";
    const isPremium = p.plan_status === "ativo";
    const hasExpired = p.plan_status === "expirado";

    // Search check
    const matchesSearch =
      (p.name && p.name.toLowerCase().includes(term)) ||
      (p.category && p.category.toLowerCase().includes(term)) ||
      (p.city && p.city.toLowerCase().includes(term)) ||
      (p.phone && p.phone.includes(term)) ||
      (p.whatsapp && p.whatsapp.includes(term));

    // Type filter
    const matchesType =
      filterAdvertiserType === "all" || type === filterAdvertiserType;

    // Status filter (ativos, pendentes, suspensos, vencidos, premium)
    let matchesStatus = true;
    if (filterAdvertiserStatus === "ativos") {
      matchesStatus = p.is_active === true && status === "ativo";
    } else if (filterAdvertiserStatus === "pendentes") {
      matchesStatus = status === "pendente";
    } else if (filterAdvertiserStatus === "suspensos") {
      matchesStatus = status === "suspenso";
    } else if (filterAdvertiserStatus === "vencidos") {
      matchesStatus = hasExpired;
    } else if (filterAdvertiserStatus === "premium") {
      matchesStatus = isPremium && !hasExpired;
    }

    return matchesSearch && matchesType && matchesStatus;
  });

  // Filtered lists for Denúncias (Reports)
  const filteredReports = reportsList.filter((r) => {
    const term = searchReport.toLowerCase();
    const reporterName = getReporterName(r.reporter_id).toLowerCase();
    const reportedName = getReportedName(
      r.reported_id,
      r.reported_type,
    ).toLowerCase();
    const reasonLabel = mapReasonLabel(r.reason).toLowerCase();
    const details = (r.details || "").toLowerCase();

    const matchesSearch =
      reporterName.includes(term) ||
      reportedName.includes(term) ||
      reasonLabel.includes(term) ||
      details.includes(term);

    const matchesStatus =
      filterReportStatus === "all" || r.status === filterReportStatus;
    const matchesReason =
      filterReportReason === "all" || r.reason === filterReportReason;

    return matchesSearch && matchesStatus && matchesReason;
  });

  // Filtered lists for Financeiro (Subscriptions)
  const filteredSubscriptions = subscriptionsList.filter((s) => {
    const term = searchFinancial.toLowerCase();

    // Find provider name
    const provider = providersList.find((p) => p.id === s.provider_id);
    const providerName = provider
      ? provider.name.toLowerCase()
      : "profissional desconhecido";

    const matchesSearch = providerName.includes(term);

    const matchesPlan =
      filterFinancialPlan === "all" || s.plan_type === filterFinancialPlan;

    let matchesStatus = true;
    if (filterFinancialStatus !== "all") {
      const now = new Date();
      const expiresAt = new Date(s.current_period_end);
      if (filterFinancialStatus === "active") {
        matchesStatus = s.status === "active" && expiresAt > now;
      } else if (filterFinancialStatus === "past_due") {
        matchesStatus =
          s.status === "past_due" || (s.status === "active" && expiresAt < now);
      } else if (filterFinancialStatus === "canceled") {
        matchesStatus = s.status === "canceled";
      }
    }

    return matchesSearch && matchesPlan && matchesStatus;
  });

  // Filtered lists for Indicações (Referrals)
  const filteredReferrals = referralsList.filter((ref) => {
    const term = searchReferral.toLowerCase();
    const partner = partnersList.find((p) => p.id === ref.partner_id);
    const partnerName = partner ? partner.nome.toLowerCase() : "desconhecido";
    const leadName = ref.nome_indicado.toLowerCase();
    const phone = ref.telefone_indicado;

    const matchesSearch =
      partnerName.includes(term) ||
      leadName.includes(term) ||
      phone.includes(term) ||
      (partner && partner.codigo_indicacao.toLowerCase().includes(term));

    const matchesStatus =
      filterReferralStatus === "all" || ref.status === filterReferralStatus;

    return matchesSearch && matchesStatus;
  });

  // Helper: Get monthly revenue for past 6 months
  const getMonthlyRevenueData = () => {
    const monthlyRevenue: { [key: string]: number } = {};
    const months = [
      "Jan",
      "Fev",
      "Mar",
      "Abr",
      "Mai",
      "Jun",
      "Jul",
      "Ago",
      "Set",
      "Out",
      "Nov",
      "Dez",
    ];

    // Initialize past 6 months
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = `${months[d.getMonth()]}/${d.getFullYear().toString().substring(2)}`;
      monthlyRevenue[label] = 0;
    }

    paymentsList.forEach((p) => {
      const payDate = new Date(p.data_pagamento || p.criado_em);
      const label = `${months[payDate.getMonth()]}/${payDate.getFullYear().toString().substring(2)}`;
      if (monthlyRevenue[label] !== undefined) {
        monthlyRevenue[label] += p.valor || 0;
      }
    });

    return Object.keys(monthlyRevenue).map((key) => ({
      label: key,
      value: monthlyRevenue[key],
    }));
  };

  // Helper: Get active subscriptions count over past 6 months
  const getActiveSubscriptionsGrowthData = () => {
    const growthData: { [key: string]: number } = {};
    const months = [
      "Jan",
      "Fev",
      "Mar",
      "Abr",
      "Mai",
      "Jun",
      "Jul",
      "Ago",
      "Set",
      "Out",
      "Nov",
      "Dez",
    ];

    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = `${months[d.getMonth()]}/${d.getFullYear().toString().substring(2)}`;
      growthData[label] = 0;
    }

    const labels = Object.keys(growthData);
    labels.forEach((label) => {
      const [mName, yStr] = label.split("/");
      const mIdx = months.indexOf(mName);
      const year = parseInt("20" + yStr);
      const refDate = new Date(year, mIdx + 1, 0); // last day of that month

      let activeInMonth = 0;
      subscriptionsList.forEach((s) => {
        const start = new Date(s.current_period_start);
        const end = s.current_period_end
          ? new Date(s.current_period_end)
          : null;

        if (start <= refDate) {
          if (s.status === "active") {
            activeInMonth++;
          } else if (
            s.status === "canceled" &&
            s.canceled_at &&
            new Date(s.canceled_at) > refDate
          ) {
            activeInMonth++;
          } else if (s.status === "past_due" && end && end > refDate) {
            activeInMonth++;
          }
        }
      });
      growthData[label] = activeInMonth;
    });

    return labels.map((key) => ({
      label: key,
      value: growthData[key],
    }));
  };

  // Helper: Get cancellations (churn) count over past 6 months
  const getCancellationsData = () => {
    const cancellations: { [key: string]: number } = {};
    const months = [
      "Jan",
      "Fev",
      "Mar",
      "Abr",
      "Mai",
      "Jun",
      "Jul",
      "Ago",
      "Set",
      "Out",
      "Nov",
      "Dez",
    ];

    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = `${months[d.getMonth()]}/${d.getFullYear().toString().substring(2)}`;
      cancellations[label] = 0;
    }

    subscriptionsList.forEach((s) => {
      if (s.status === "canceled" && s.canceled_at) {
        const cDate = new Date(s.canceled_at);
        const label = `${months[cDate.getMonth()]}/${cDate.getFullYear().toString().substring(2)}`;
        if (cancellations[label] !== undefined) {
          cancellations[label]++;
        }
      }
    });

    return Object.keys(cancellations).map((key) => ({
      label: key,
      value: cancellations[key],
    }));
  };

  const recentUsers = usersList.slice(0, 5);
  const recentProviders = providersList.slice(0, 5);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Carregando dados do painel...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <Database
            className="logo-icon"
            size={24}
            style={{ color: "var(--accent-primary)" }}
          />
          <span>ChamaJá Admin</span>
        </div>

        <nav className="sidebar-menu">
          <li
            className={`sidebar-item ${activeTab === "dashboard" ? "active" : ""}`}
          >
            <button onClick={() => setActiveTab("dashboard")}>
              <TrendingUp size={18} />
              Dashboard
            </button>
          </li>
          <li
            className={`sidebar-item ${activeTab === "users" ? "active" : ""}`}
          >
            <button onClick={() => setActiveTab("users")}>
              <Users size={18} />
              Usuários ({totalUsers})
            </button>
          </li>
          <li
            className={`sidebar-item ${activeTab === "advertisers" ? "active" : ""}`}
          >
            <button onClick={() => setActiveTab("advertisers")}>
              <Store size={18} />
              Negócios cadastrados ({providersList.length})
            </button>
          </li>
          <li
            className={`sidebar-item ${activeTab === "reports" ? "active" : ""}`}
          >
            <button onClick={() => setActiveTab("reports")}>
              <ShieldAlert
                size={18}
                style={{
                  color:
                    reportsList.filter((r) => r.status === "pendente").length >
                    0
                      ? "var(--accent-orange)"
                      : undefined,
                }}
              />
              Denúncias (
              {reportsList.filter((r) => r.status === "pendente").length})
            </button>
          </li>
          <li
            className={`sidebar-item ${activeTab === "financial" ? "active" : ""}`}
          >
            <button onClick={() => setActiveTab("financial")}>
              <DollarSign size={18} />
              Financeiro
            </button>
          </li>
          <li
            className={`sidebar-item ${activeTab === "referrals" ? "active" : ""}`}
          >
            <button onClick={() => setActiveTab("referrals")}>
              <UserCheck size={18} />
              Indicações ({referralsList.length})
            </button>
          </li>
          <li
            className={`sidebar-item ${activeTab === "settings" ? "active" : ""}`}
          >
            <button onClick={() => setActiveTab("settings")}>
              <Settings size={18} />
              Configurações
            </button>
          </li>
          <li
            className={`sidebar-item ${activeTab === "plans" ? "active" : ""}`}
          >
            <button onClick={() => setActiveTab("plans")}>
              <Award size={18} />
              Planos
            </button>
          </li>
        </nav>

        <div className="sidebar-footer">
          <div className="admin-profile">
            <div className="admin-avatar">
              {getInitials(adminUser?.name || adminUser?.email)}
            </div>
            <div className="admin-info">
              <span className="admin-name">
                {adminUser?.name || "Administrador"}
              </span>
              <span className="admin-role">
                {adminUser?.email || "admin@chamaja.com"}
              </span>
            </div>
          </div>
          <button className="btn-logout" onClick={onLogout}>
            <LogOut size={16} />
            Sair do Painel
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {/* Header */}
        <header className="dashboard-header">
          <div className="dashboard-title">
            <h1>
              {activeTab === "dashboard" && "Dashboard Geral"}
              {activeTab === "users" && "Gestão de Usuários"}
              {activeTab === "advertisers" && "Negócios cadastrados"}
              {activeTab === "reports" && "Gestão de Denúncias"}
              {activeTab === "financial" && "Módulo Financeiro"}
              {activeTab === "settings" && "Configurações Administrativas"}
              {activeTab === "referrals" && "Controle de Indicações"}
              {activeTab === "plans" && "Gestão de Planos e Assinaturas"}
            </h1>
            <p>
              {activeTab === "dashboard" &&
                "Visão analítica em tempo real do ecossistema ChamaJá"}
              {activeTab === "users" &&
                "Controle de perfis, auditoria de atividades e ações administrativas"}
              {activeTab === "advertisers" &&
                "Gerenciamento de prestadores de serviços, estabelecimentos comerciais, limites de serviços e planos premium"}
              {activeTab === "reports" &&
                "Análise de reclamações, moderação de perfis e histórico de resoluções"}
              {activeTab === "financial" &&
                "Acompanhamento de receita, assinaturas de profissionais e status de planos SaaS"}
              {activeTab === "settings" &&
                "Controle de permissões, logs de atividades e parametrização geral do aplicativo"}
              {activeTab === "referrals" &&
                "Painel administrativo de controle de parceiros e acompanhamento do status de leads indicados"}
              {activeTab === "plans" &&
                "Configure os planos, preços e benefícios oferecidos."}
            </p>
          </div>

          <div className="header-actions">
            <button
              className="btn-refresh"
              onClick={handleRefresh}
              disabled={refreshing}
              title="Atualizar dados"
            >
              <RefreshCw
                size={18}
                className={refreshing ? "spin" : ""}
                style={{
                  animation: refreshing ? "spin 1s linear infinite" : "none",
                }}
              />
            </button>
          </div>
        </header>

        {/* PLANS TAB */}
        {activeTab === "plans" && (
          <PlansManagement />
        )}

        {/* DASHBOARD TAB */}
        {activeTab === "dashboard" && (
          <DashboardHome
            adminUser={adminUser}
            dashboardPeriod={dashboardPeriod}
            setDashboardPeriod={setDashboardPeriod}
            onRefresh={handleRefresh}
            refreshing={refreshing}
            usersList={usersList}
            providersList={providersList}
            partnersList={partnersList}
            referralsList={referralsList}
            paymentsList={paymentsList}
            subscriptionsList={subscriptionsList}
            reportsList={reportsList}
            setActiveTab={setActiveTab}
            setFilterAdvertiserType={setFilterAdvertiserType}
          />
        )}

        {/* USERS TAB */}
        {activeTab === "users" && (
          <div className="section-container">
            <div
              className="section-header"
              style={{ flexWrap: "wrap", gap: "1rem" }}
            >
              <div className="section-title">
                <h2>Gerenciar Usuários ({filteredUsers.length})</h2>
              </div>

              <div className="filter-row">
                <div className="search-box">
                  <Search className="search-icon" size={16} />
                  <input
                    type="text"
                    placeholder="Buscar por nome, email, telefone..."
                    value={searchUser}
                    onChange={(e) => setSearchUser(e.target.value)}
                  />
                </div>

                <select
                  className="filter-select"
                  value={filterUserType}
                  onChange={(e) => setFilterUserType(e.target.value as any)}
                >
                  <option value="all">Todos os tipos</option>
                  <option value="cliente">Clientes</option>
                  <option value="prestador">Prestadores</option>
                  <option value="comércio">Comércios</option>
                </select>

                <select
                  className="filter-select"
                  value={filterUserStatus}
                  onChange={(e) => setFilterUserStatus(e.target.value as any)}
                >
                  <option value="all">Todos os status</option>
                  <option value="ativo">Ativos</option>
                  <option value="suspenso">Suspensos</option>
                  <option value="bloqueado">Bloqueados</option>
                </select>
              </div>
            </div>

            <div className="table-wrapper">
              {filteredUsers.length === 0 ? (
                <div className="empty-state">
                  <Search className="empty-state-icon" size={32} />
                  <p>Nenhum usuário correspondente aos filtros.</p>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>E-mail</th>
                      <th>Telefone</th>
                      <th>Tipo</th>
                      <th>Criado em</th>
                      <th>Último Acesso</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => {
                      const userType = getUserType(u.open_id);
                      const userStatus = u.status || "ativo";

                      return (
                        <tr
                          key={u.id}
                          style={{ cursor: "pointer" }}
                          onClick={() => handleSelectUser(u)}
                        >
                          <td>
                            <div className="user-cell">
                              <div
                                className="user-avatar-small"
                                style={{
                                  backgroundColor:
                                    userType === "comércio"
                                      ? "var(--accent-orange)"
                                      : userType === "prestador"
                                        ? "var(--accent-primary)"
                                        : "var(--accent-blue)",
                                }}
                              >
                                {getInitials(u.name || u.email)}
                              </div>
                              <div style={{ fontWeight: 600 }}>
                                {u.name || "Sem nome informado"}
                              </div>
                            </div>
                          </td>
                          <td>{u.email || "-"}</td>
                          <td>{getUserPhone(u)}</td>
                          <td>
                            <span
                              className={`badge ${
                                userType === "comércio"
                                  ? "badge-premium"
                                  : userType === "prestador"
                                    ? "badge-admin"
                                    : "badge-user"
                              }`}
                            >
                              {userType.toUpperCase()}
                            </span>
                          </td>
                          <td>{formatDate(u.created_at).split(" ")[0]}</td>
                          <td>{formatDate(u.last_signed_in)}</td>
                          <td>
                            <span
                              className={`badge ${
                                userStatus === "ativo"
                                  ? "badge-active"
                                  : userStatus === "suspenso"
                                    ? "badge-inactive"
                                    : "badge-inactive"
                              }`}
                              style={{
                                backgroundColor:
                                  userStatus === "suspenso"
                                    ? "rgba(245, 158, 11, 0.15)"
                                    : undefined,
                                color:
                                  userStatus === "suspenso"
                                    ? "var(--accent-orange)"
                                    : undefined,
                                borderColor:
                                  userStatus === "suspenso"
                                    ? "rgba(245, 158, 11, 0.2)"
                                    : undefined,
                              }}
                            >
                              {userStatus.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ADVERTISERS (Unified Prestadores and Comércios) TAB */}
        {activeTab === "advertisers" && (
          <div className="section-container">
            <div
              className="section-header"
              style={{ flexWrap: "wrap", gap: "1rem" }}
            >
              <div className="section-title">
                <h2>Negócios cadastrados ({filteredAdvertisers.length})</h2>
              </div>

              <div className="filter-row">
                <div className="search-box">
                  <Search className="search-icon" size={16} />
                  <input
                    type="text"
                    placeholder="Buscar nome, categoria, cidade..."
                    value={searchAdvertiser}
                    onChange={(e) => setSearchAdvertiser(e.target.value)}
                  />
                </div>

                <select
                  className="filter-select"
                  value={filterAdvertiserType}
                  onChange={(e) =>
                    setFilterAdvertiserType(e.target.value as any)
                  }
                >
                  <option value="all">Todos os Tipos</option>
                  <option value="prestador">Prestadores</option>
                  <option value="comércio">Comércios</option>
                </select>

                <select
                  className="filter-select"
                  value={filterAdvertiserStatus}
                  onChange={(e) =>
                    setFilterAdvertiserStatus(e.target.value as any)
                  }
                >
                  <option value="all">Todos os Status</option>
                  <option value="ativos">Ativos</option>
                  <option value="pendentes">Pendentes</option>
                  <option value="suspensos">Suspensos</option>
                  <option value="vencidos">Planos Vencidos</option>
                  <option value="premium">Planos Premium Ativos</option>
                </select>
              </div>
            </div>

            <div className="table-wrapper">
              {filteredAdvertisers.length === 0 ? (
                <div className="empty-state">
                  <Search className="empty-state-icon" size={32} />
                  <p>Nenhum anunciante correspondente aos filtros.</p>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Nome Negócio/Profissional</th>
                      <th>Categoria</th>
                      <th>Cidade</th>
                      <th>Telefone/WhatsApp</th>
                      <th>Serviços</th>
                      <th>Plano Contratado</th>
                      <th>Data de Cadastro</th>
                      <th>Status do Anúncio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAdvertisers.map((p) => {
                      const isCom = p.category_id === "comercios";
                      const isPremium = p.plan_status === "ativo";
                      const hasExpired = p.plan_status === "expirado";
                      const status = p.status || "ativo";
                      let servicesCount = 0;
                      try {
                        if (p.services) {
                          const parsed =
                            typeof p.services === "string"
                              ? JSON.parse(p.services)
                              : p.services;
                          if (Array.isArray(parsed))
                            servicesCount = parsed.length;
                        }
                      } catch {}

                      return (
                        <tr
                          key={p.id}
                          style={{ cursor: "pointer" }}
                          onClick={() => handleSelectAdvertiser(p)}
                        >
                          <td style={{ fontWeight: 600 }}>{p.name}</td>
                          <td>
                            <span
                              className={`badge ${isCom ? "badge-premium" : "badge-user"}`}
                            >
                              {isCom
                                ? "Comércio"
                                : p.category || "Profissional"}
                            </span>
                          </td>
                          <td>{p.city || "-"}</td>
                          <td>{p.whatsapp || p.phone || "-"}</td>
                          <td>{servicesCount}</td>
                          <td>
                            {isPremium && !hasExpired ? (
                              <span className="badge badge-premium">
                                {p.billing_cycle === "annual"
                                  ? "Anual (PREMIUM)"
                                  : p.billing_cycle === "semiannual"
                                    ? "Semestral (PREMIUM)"
                                    : p.billing_cycle === "quarterly"
                                      ? "Trimestral (PREMIUM)"
                                      : "Mensal (PREMIUM)"}
                              </span>
                            ) : (
                              <span className="badge badge-free">Gratuito</span>
                            )}
                          </td>
                          <td>{formatDate(p.created_at).split(" ")[0]}</td>
                          <td>
                            <span
                              className={`badge ${
                                p.is_active && status === "ativo"
                                  ? "badge-active"
                                  : status === "pendente"
                                    ? "badge-inactive"
                                    : "badge-inactive"
                              }`}
                              style={{
                                backgroundColor:
                                  status === "suspenso"
                                    ? "rgba(245, 158, 11, 0.15)"
                                    : status === "pendente"
                                      ? "rgba(59, 130, 246, 0.15)"
                                      : undefined,
                                color:
                                  status === "suspenso"
                                    ? "var(--accent-orange)"
                                    : status === "pendente"
                                      ? "var(--accent-blue)"
                                      : undefined,
                                borderColor:
                                  status === "suspenso"
                                    ? "rgba(245, 158, 11, 0.2)"
                                    : status === "pendente"
                                      ? "rgba(59, 130, 246, 0.2)"
                                      : undefined,
                              }}
                            >
                              {status === "suspenso"
                                ? "SUSPENSO"
                                : status === "pendente"
                                  ? "PENDENTE"
                                  : p.is_active
                                    ? "ATIVO"
                                    : "INATIVO"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* REPORTS (DENÚNCIAS) TAB */}
        {activeTab === "reports" && (
          <div className="section-container">
            <div
              className="section-header"
              style={{ flexWrap: "wrap", gap: "1rem" }}
            >
              <div className="section-title">
                <h2>Gerenciar Denúncias ({filteredReports.length})</h2>
              </div>

              <div className="filter-row">
                <div className="search-box">
                  <Search className="search-icon" size={16} />
                  <input
                    type="text"
                    placeholder="Buscar autor, alvo, motivo..."
                    value={searchReport}
                    onChange={(e) => setSearchReport(e.target.value)}
                  />
                </div>

                <select
                  className="filter-select"
                  value={filterReportStatus}
                  onChange={(e) => setFilterReportStatus(e.target.value as any)}
                >
                  <option value="all">Todos os Status</option>
                  <option value="pendente">Pendentes</option>
                  <option value="resolvido">Resolvidas</option>
                </select>

                <select
                  className="filter-select"
                  value={filterReportReason}
                  onChange={(e) => setFilterReportReason(e.target.value as any)}
                >
                  <option value="all">Todos os Motivos</option>
                  <option value="perfil_falso">Perfil Falso</option>
                  <option value="golpe">Golpe</option>
                  <option value="informacoes_incorretas">
                    Informações Incorretas
                  </option>
                  <option value="comportamento_inadequado">
                    Comportamento Inadequado
                  </option>
                  <option value="outro">Outro</option>
                </select>
              </div>
            </div>

            <div className="table-wrapper">
              {filteredReports.length === 0 ? (
                <div className="empty-state">
                  <ShieldAlert
                    className="empty-state-icon"
                    size={32}
                    style={{ color: "var(--text-muted)" }}
                  />
                  <p>Nenhuma denúncia correspondente aos filtros.</p>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Quem Denunciou (Autor)</th>
                      <th>Quem Foi Denunciado (Alvo)</th>
                      <th>Tipo Alvo</th>
                      <th>Motivo</th>
                      <th>Data da Denúncia</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReports.map((r) => {
                      const status = r.status || "pendente";
                      return (
                        <tr
                          key={r.id}
                          style={{ cursor: "pointer" }}
                          onClick={() => {
                            setSelectedReport(r);
                            setReportActionReason("");
                          }}
                        >
                          <td style={{ fontWeight: 600 }}>#{r.id}</td>
                          <td>{getReporterName(r.reporter_id)}</td>
                          <td style={{ fontWeight: 600 }}>
                            {getReportedName(r.reported_id, r.reported_type)}
                          </td>
                          <td>
                            <span
                              className={`badge ${r.reported_type === "cliente" ? "badge-user" : "badge-premium"}`}
                            >
                              {r.reported_type === "comercio"
                                ? "Comércio"
                                : r.reported_type === "prestador"
                                  ? "Prestador"
                                  : "Cliente"}
                            </span>
                          </td>
                          <td>{mapReasonLabel(r.reason)}</td>
                          <td>{formatDate(r.created_at)}</td>
                          <td>
                            <span
                              className={`badge ${status === "resolvido" ? "badge-active" : "badge-inactive"}`}
                              style={{
                                backgroundColor:
                                  status === "pendente"
                                    ? "rgba(239, 68, 68, 0.15)"
                                    : undefined,
                                color:
                                  status === "pendente" ? "#ef4444" : undefined,
                                borderColor:
                                  status === "pendente"
                                    ? "rgba(239, 68, 68, 0.2)"
                                    : undefined,
                              }}
                            >
                              {status === "resolvido"
                                ? "RESOLVIDO"
                                : "PENDENTE"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* FINANCIAL (FINANCEIRO) TAB */}
        {activeTab === "financial" &&
          (() => {
            const totalRevenue = paymentsList.reduce(
              (acc, p) => acc + (p.valor || 0),
              0,
            );

            const now = new Date();
            const activeSubsCount = subscriptionsList.filter(
              (s) =>
                s.status === "active" && new Date(s.current_period_end) > now,
            ).length;
            const plansSold = paymentsList.length;

            const next7Days = new Date();
            next7Days.setDate(next7Days.getDate() + 7);
            const expiringSoonCount = subscriptionsList.filter((s) => {
              const d = new Date(s.current_period_end);
              return s.status === "active" && d >= now && d <= next7Days;
            }).length;

            const pastDueCount = subscriptionsList.filter(
              (s) =>
                s.status === "past_due" ||
                (s.status === "active" && new Date(s.current_period_end) < now),
            ).length;

            return (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.5rem",
                }}
              >
                {/* METRICS CARDS */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "1.5rem",
                  }}
                >
                  {/* 1. Total Arrecadado */}
                  <div
                    className="kpi-card revenue"
                    style={{ borderLeft: "4px solid var(--accent-primary)" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        width: "100%",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.25rem",
                        }}
                      >
                        <span
                          className="kpi-title"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          Total Arrecadado
                        </span>
                        <span
                          className="kpi-value"
                          style={{
                            fontSize: "1.5rem",
                            color: "var(--text-primary)",
                          }}
                        >
                          R${" "}
                          {totalRevenue.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      <div
                        className="kpi-icon-wrapper"
                        style={{
                          backgroundColor: "rgba(37, 211, 102, 0.15)",
                          color: "var(--accent-primary)",
                        }}
                      >
                        <DollarSign size={20} />
                      </div>
                    </div>
                  </div>

                  {/* 2. Assinaturas Ativas */}
                  <div
                    className="kpi-card users"
                    style={{ borderLeft: "4px solid var(--accent-blue)" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        width: "100%",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.25rem",
                        }}
                      >
                        <span
                          className="kpi-title"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          Assinaturas Ativas
                        </span>
                        <span
                          className="kpi-value"
                          style={{
                            fontSize: "1.5rem",
                            color: "var(--text-primary)",
                          }}
                        >
                          {activeSubsCount}
                        </span>
                      </div>
                      <div
                        className="kpi-icon-wrapper"
                        style={{
                          backgroundColor: "rgba(59, 130, 246, 0.15)",
                          color: "var(--accent-blue)",
                        }}
                      >
                        <UserCheck size={20} />
                      </div>
                    </div>
                  </div>

                  {/* 3. Planos Vendidos */}
                  <div
                    className="kpi-card commerce"
                    style={{ borderLeft: "4px solid var(--accent-purple)" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        width: "100%",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.25rem",
                        }}
                      >
                        <span
                          className="kpi-title"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          Planos Vendidos
                        </span>
                        <span
                          className="kpi-value"
                          style={{
                            fontSize: "1.5rem",
                            color: "var(--text-primary)",
                          }}
                        >
                          {plansSold}
                        </span>
                      </div>
                      <div
                        className="kpi-icon-wrapper"
                        style={{
                          backgroundColor: "rgba(168, 85, 247, 0.15)",
                          color: "var(--accent-purple)",
                        }}
                      >
                        <Briefcase size={20} />
                      </div>
                    </div>
                  </div>

                  {/* 4. Vencimentos Próximos */}
                  <div
                    className="kpi-card warning"
                    style={{
                      borderLeft: "4px solid var(--accent-orange)",
                      backgroundColor: "var(--bg-surface)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        width: "100%",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.25rem",
                        }}
                      >
                        <span
                          className="kpi-title"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          Vence em 7 dias
                        </span>
                        <span
                          className="kpi-value"
                          style={{
                            fontSize: "1.5rem",
                            color: "var(--text-primary)",
                          }}
                        >
                          {expiringSoonCount}
                        </span>
                      </div>
                      <div
                        className="kpi-icon-wrapper"
                        style={{
                          backgroundColor: "rgba(245, 158, 11, 0.15)",
                          color: "var(--accent-orange)",
                        }}
                      >
                        <Calendar size={20} />
                      </div>
                    </div>
                  </div>

                  {/* 5. Clientes Inadimplentes / Vencidos */}
                  <div
                    className="kpi-card danger"
                    style={{
                      borderLeft: "4px solid #ef4444",
                      backgroundColor: "var(--bg-surface)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        width: "100%",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.25rem",
                        }}
                      >
                        <span
                          className="kpi-title"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          Contas Vencidas
                        </span>
                        <span
                          className="kpi-value"
                          style={{
                            fontSize: "1.5rem",
                            color: "var(--text-primary)",
                          }}
                        >
                          {pastDueCount}
                        </span>
                      </div>
                      <div
                        className="kpi-icon-wrapper"
                        style={{
                          backgroundColor: "rgba(239, 68, 68, 0.15)",
                          color: "#ef4444",
                        }}
                      >
                        <ShieldOff size={20} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* CHARTS ROW */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                    gap: "1.5rem",
                  }}
                >
                  <div
                    className="section-container"
                    style={{ padding: "1.25rem" }}
                  >
                    <SVGVerticalBarChart
                      data={getMonthlyRevenueData()}
                      color="var(--accent-primary)"
                      title="Receita Mensal (Faturamento em R$)"
                      isCurrency={true}
                    />
                  </div>

                  <div
                    className="section-container"
                    style={{ padding: "1.25rem" }}
                  >
                    <SVGLineChart
                      data={getActiveSubscriptionsGrowthData()}
                      color="var(--accent-blue)"
                      gradientId="grad-growth"
                      title="Crescimento de Assinaturas Ativas"
                    />
                  </div>

                  <div
                    className="section-container"
                    style={{ padding: "1.25rem" }}
                  >
                    <SVGVerticalBarChart
                      data={getCancellationsData()}
                      color="#ef4444"
                      title="Cancelamentos de Assinaturas (Churn)"
                    />
                  </div>
                </div>

                {/* SUBSCRIPTIONS TABLE */}
                <div className="section-container">
                  <div
                    className="section-header"
                    style={{ flexWrap: "wrap", gap: "1rem" }}
                  >
                    <div className="section-title">
                      <h2>
                        Controle de Assinantes SaaS (
                        {filteredSubscriptions.length})
                      </h2>
                    </div>

                    <div className="filter-row">
                      <div className="search-box">
                        <Search className="search-icon" size={16} />
                        <input
                          type="text"
                          placeholder="Buscar assinante..."
                          value={searchFinancial}
                          onChange={(e) => setSearchFinancial(e.target.value)}
                        />
                      </div>

                      <select
                        className="filter-select"
                        value={filterFinancialPlan}
                        onChange={(e) =>
                          setFilterFinancialPlan(e.target.value as any)
                        }
                      >
                        <option value="all">Todos os Planos</option>
                        <option value="monthly">Mensal</option>
                        <option value="annual">Anual</option>
                      </select>

                      <select
                        className="filter-select"
                        value={filterFinancialStatus}
                        onChange={(e) =>
                          setFilterFinancialStatus(e.target.value as any)
                        }
                      >
                        <option value="all">Todos os Status</option>
                        <option value="active">Ativas</option>
                        <option value="past_due">
                          Vencidas / Inadimplentes
                        </option>
                        <option value="canceled">Canceladas</option>
                      </select>
                    </div>
                  </div>

                  <div className="table-wrapper">
                    {filteredSubscriptions.length === 0 ? (
                      <div className="empty-state">
                        <DollarSign
                          className="empty-state-icon"
                          size={32}
                          style={{ color: "var(--text-muted)" }}
                        />
                        <p>Nenhuma assinatura correspondente aos filtros.</p>
                      </div>
                    ) : (
                      <table>
                        <thead>
                          <tr>
                            <th>Assinante (Negócio/Profissional)</th>
                            <th>Plano</th>
                            <th>Valor</th>
                            <th>Último Pagamento</th>
                            <th>Próximo Vencimento</th>
                            <th>Status</th>
                            <th>Gateway ID</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredSubscriptions.map((s) => {
                            const provider = providersList.find(
                              (p) => p.id === s.provider_id,
                            );
                            const name = provider
                              ? provider.name
                              : "Profissional Desconhecido";

                            // Find last payment in paymentsList
                            const providerPayments = paymentsList
                              .filter((p) => p.prestador_id === s.provider_id)
                              .sort(
                                (a, b) =>
                                  new Date(
                                    b.data_pagamento || b.criado_em,
                                  ).getTime() -
                                  new Date(
                                    a.data_pagamento || a.criado_em,
                                  ).getTime(),
                              );

                            const lastPay = providerPayments[0];
                            const lastPayDateStr = lastPay
                              ? formatDate(
                                  lastPay.data_pagamento || lastPay.criado_em,
                                ).split(" ")[0]
                              : "-";

                            const subStatus = s.status;
                            const isExpired =
                              subStatus === "active" &&
                              new Date(s.current_period_end) < new Date();

                            return (
                              <tr key={s.id}>
                                <td style={{ fontWeight: 600 }}>{name}</td>
                                <td>
                                  <span className="badge badge-premium">
                                    {s.plan_type === "monthly"
                                      ? "Mensal"
                                      : "Anual"}
                                  </span>
                                </td>
                                <td style={{ fontWeight: 600 }}>
                                  R${" "}
                                  {(s.price_cents / 100).toLocaleString(
                                    "pt-BR",
                                    { minimumFractionDigits: 2 },
                                  )}
                                </td>
                                <td>{lastPayDateStr}</td>
                                <td>
                                  {
                                    formatDate(s.current_period_end).split(
                                      " ",
                                    )[0]
                                  }
                                </td>
                                <td>
                                  {subStatus === "active" && !isExpired ? (
                                    <span className="badge badge-active">
                                      ATIVA
                                    </span>
                                  ) : subStatus === "canceled" ? (
                                    <span
                                      className="badge badge-inactive"
                                      style={{
                                        backgroundColor:
                                          "rgba(107, 114, 128, 0.15)",
                                        color: "var(--text-secondary)",
                                        borderColor: "rgba(107, 114, 128, 0.2)",
                                      }}
                                    >
                                      CANCELADA
                                    </span>
                                  ) : (
                                    <span
                                      className="badge badge-inactive"
                                      style={{
                                        backgroundColor:
                                          "rgba(239, 68, 68, 0.15)",
                                        color: "#ef4444",
                                        borderColor: "rgba(239, 68, 68, 0.2)",
                                      }}
                                    >
                                      VENCIDA
                                    </span>
                                  )}
                                </td>
                                <td
                                  style={{
                                    fontSize: "0.75rem",
                                    fontFamily: "monospace",
                                    color: "var(--text-muted)",
                                  }}
                                >
                                  {s.gateway_subscription_id || "-"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

        {/* REFERRALS (INDICAÇÕES) TAB */}
        {activeTab === "referrals" && (
          <div className="section-container">
            <div
              className="section-header"
              style={{ flexWrap: "wrap", gap: "1rem" }}
            >
              <div className="section-title">
                <h2>Gerenciar Indicações ({filteredReferrals.length})</h2>
              </div>

              <div className="filter-row">
                <div className="search-box">
                  <Search className="search-icon" size={16} />
                  <input
                    type="text"
                    placeholder="Buscar por parceiro, lead, telefone ou código..."
                    value={searchReferral}
                    onChange={(e) => setSearchReferral(e.target.value)}
                  />
                </div>

                <select
                  className="filter-select"
                  value={filterReferralStatus}
                  onChange={(e) =>
                    setFilterReferralStatus(e.target.value as any)
                  }
                >
                  <option value="all">Todos os Status</option>
                  <option value="novo">Novo</option>
                  <option value="contatado">Contatado</option>
                  <option value="cadastrado">Cadastrado</option>
                  <option value="ativo">Ativo</option>
                </select>
              </div>
            </div>

            <div className="table-wrapper">
              {filteredReferrals.length === 0 ? (
                <div className="empty-state">
                  <UserCheck
                    className="empty-state-icon"
                    size={32}
                    style={{ color: "var(--text-muted)" }}
                  />
                  <p>Nenhuma indicação correspondente aos filtros.</p>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Parceiro</th>
                      <th>Código</th>
                      <th>Lead Indicado</th>
                      <th>Telefone</th>
                      <th>Data de Criação</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReferrals.map((ref) => {
                      const partner = partnersList.find(
                        (p) => p.id === ref.partner_id,
                      );
                      const partnerName = partner
                        ? partner.nome
                        : "Desconhecido";
                      const partnerCode = partner
                        ? partner.codigo_indicacao
                        : ref.codigo_indicacao;

                      return (
                        <tr key={ref.id}>
                          <td>
                            <div style={{ fontWeight: 600 }}>{partnerName}</div>
                            <div
                              style={{
                                fontSize: "0.75rem",
                                color: "var(--text-muted)",
                              }}
                            >
                              {partner?.email || "-"}
                            </div>
                          </td>
                          <td>
                            <span
                              className="badge badge-admin"
                              style={{ fontFamily: "monospace" }}
                            >
                              {partnerCode}
                            </span>
                          </td>
                          <td style={{ fontWeight: 600 }}>
                            {ref.nome_indicado}
                          </td>
                          <td style={{ fontFamily: "monospace" }}>
                            {ref.telefone_indicado}
                          </td>
                          <td>{formatDate(ref.created_at || ref.createdAt)}</td>
                          <td>
                            <select
                              className="filter-select"
                              style={{
                                fontSize: "0.8rem",
                                padding: "0.3rem 0.5rem",
                                width: "auto",
                                backgroundColor:
                                  ref.status === "ativo"
                                    ? "rgba(37, 211, 102, 0.15)"
                                    : ref.status === "cadastrado"
                                      ? "rgba(168, 85, 247, 0.15)"
                                      : ref.status === "contatado"
                                        ? "rgba(245, 158, 11, 0.15)"
                                        : "rgba(59, 130, 246, 0.15)",
                                color:
                                  ref.status === "ativo"
                                    ? "var(--accent-primary)"
                                    : ref.status === "cadastrado"
                                      ? "var(--accent-purple)"
                                      : ref.status === "contatado"
                                        ? "var(--accent-orange)"
                                        : "var(--accent-blue)",
                                borderColor:
                                  ref.status === "ativo"
                                    ? "rgba(37, 211, 102, 0.2)"
                                    : ref.status === "cadastrado"
                                      ? "rgba(168, 85, 247, 0.2)"
                                      : ref.status === "contatado"
                                        ? "rgba(245, 158, 11, 0.2)"
                                        : "rgba(59, 130, 246, 0.2)",
                              }}
                              value={ref.status}
                              onChange={(e) =>
                                handleUpdateReferralStatus(
                                  ref.id,
                                  e.target.value,
                                )
                              }
                            >
                              <option
                                value="novo"
                                style={{
                                  backgroundColor: "var(--bg-surface)",
                                  color: "var(--text-primary)",
                                }}
                              >
                                Novo
                              </option>
                              <option
                                value="contatado"
                                style={{
                                  backgroundColor: "var(--bg-surface)",
                                  color: "var(--text-primary)",
                                }}
                              >
                                Contatado
                              </option>
                              <option
                                value="cadastrado"
                                style={{
                                  backgroundColor: "var(--bg-surface)",
                                  color: "var(--text-primary)",
                                }}
                              >
                                Cadastrado
                              </option>
                              <option
                                value="ativo"
                                style={{
                                  backgroundColor: "var(--bg-surface)",
                                  color: "var(--text-primary)",
                                }}
                              >
                                Ativo
                              </option>
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* SETTINGS (CONFIGURAÇÕES) TAB */}
        {activeTab === "settings" &&
          (() => {
            // Filter administrators
            const admins = usersList.filter((u) => u.role === "admin");

            // Filter non-admin users for promotion search
            const nonAdmins = usersList.filter(
              (u) => u.role !== "admin" && u.role !== "system",
            );
            const searchNonAdminsResults =
              newAdminSearch.trim() === ""
                ? []
                : nonAdmins
                    .filter(
                      (u) =>
                        (u.name &&
                          u.name
                            .toLowerCase()
                            .includes(newAdminSearch.toLowerCase())) ||
                        (u.email &&
                          u.email
                            .toLowerCase()
                            .includes(newAdminSearch.toLowerCase())),
                    )
                    .slice(0, 5);

            // Filter activity logs
            const filteredLogs = activityLogsList.filter((log) => {
              const query = searchLogQuery.toLowerCase();
              return (
                (log.admin_email &&
                  log.admin_email.toLowerCase().includes(query)) ||
                (log.action_type &&
                  log.action_type.toLowerCase().includes(query)) ||
                (log.details && log.details.toLowerCase().includes(query))
              );
            });

            const isMaster = adminUser.admin_role === "principal";

            return (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "2rem",
                }}
              >
                {/* TOP CARDS ROW */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: "1.5rem",
                  }}
                >
                  {/* CARD 1: Profile Summary */}
                  <div
                    className="kpi-card users"
                    style={{
                      borderLeft: "4px solid var(--accent-blue)",
                      padding: "1.25rem",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <span
                        className="kpi-title"
                        style={{
                          fontSize: "0.75rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          color: "var(--text-secondary)",
                        }}
                      >
                        Administrador Conectado
                      </span>
                      <h3
                        style={{
                          color: "var(--text-primary)",
                          fontSize: "1.25rem",
                          fontWeight: 700,
                          marginTop: "0.5rem",
                        }}
                      >
                        {adminUser.name || "Sem Nome"}
                      </h3>
                      <p
                        style={{
                          color: "var(--text-muted)",
                          fontSize: "0.85rem",
                          marginTop: "0.25rem",
                        }}
                      >
                        {adminUser.email}
                      </p>
                    </div>
                    <div
                      style={{
                        marginTop: "1rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <span
                        className="badge badge-admin"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <Shield size={12} />
                        Nível:{" "}
                        {adminUser.admin_role
                          ? adminUser.admin_role.toUpperCase()
                          : "PRINCIPAL"}
                      </span>
                    </div>
                  </div>

                  {/* CARD 2: App Status Summary */}
                  <div
                    className="kpi-card commerce"
                    style={{
                      borderLeft:
                        "4px solid " +
                        (maintenanceMode
                          ? "var(--accent-orange)"
                          : "var(--accent-primary)"),
                      padding: "1.25rem",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <span
                        className="kpi-title"
                        style={{
                          fontSize: "0.75rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          color: "var(--text-secondary)",
                        }}
                      >
                        Status do Ecossistema
                      </span>
                      <h3
                        style={{
                          color: "var(--text-primary)",
                          fontSize: "1.25rem",
                          fontWeight: 700,
                          marginTop: "0.5rem",
                        }}
                      >
                        {maintenanceMode
                          ? "Em Manutenção"
                          : "Operando Normalmente"}
                      </h3>
                      <p
                        style={{
                          color: "var(--text-muted)",
                          fontSize: "0.85rem",
                          marginTop: "0.25rem",
                        }}
                      >
                        Versão do App: v{appVersion}
                      </p>
                    </div>
                    <div style={{ marginTop: "1rem" }}>
                      <span
                        className={`badge ${maintenanceMode ? "badge-inactive" : "badge-active"}`}
                      >
                        {maintenanceMode ? "MANUTENÇÃO ATIVA" : "ONLINE"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* TWO COLUMN CONTENT */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))",
                    gap: "1.5rem",
                  }}
                >
                  {/* COLUMN 1: GENERAL SETTINGS & PASSWORD */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "1.5rem",
                    }}
                  >
                    {/* APP GENERAL CONFIGURATIONS */}
                    <div
                      className="section-container"
                      style={{ padding: "1.5rem" }}
                    >
                      <div
                        className="section-title"
                        style={{ marginBottom: "1.25rem" }}
                      >
                        <h2
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            fontSize: "1.1rem",
                          }}
                        >
                          <Settings
                            size={18}
                            style={{ color: "var(--accent-primary)" }}
                          />
                          Configurações Gerais do Aplicativo (
                          {appSettingsList.length})
                        </h2>
                      </div>

                      {!isMaster && (
                        <div
                          className="empty-state"
                          style={{
                            padding: "1rem",
                            marginBottom: "1rem",
                            backgroundColor: "rgba(245, 158, 11, 0.05)",
                            border: "1px solid rgba(245, 158, 11, 0.1)",
                            borderRadius: "8px",
                          }}
                        >
                          <p
                            style={{
                              color: "var(--accent-orange)",
                              fontSize: "0.85rem",
                              margin: 0,
                              textAlign: "left",
                            }}
                          >
                            <strong>Apenas Leitura:</strong> Apenas o
                            Administrador Principal pode modificar estas
                            configurações.
                          </p>
                        </div>
                      )}

                      <form
                        onSubmit={handleSaveAppSettings}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "1rem",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "0.75rem",
                            borderRadius: "8px",
                            background: "var(--bg-primary)",
                            border: "1px solid var(--border-color)",
                          }}
                        >
                          <div
                            style={{ display: "flex", flexDirection: "column" }}
                          >
                            <span
                              style={{
                                fontSize: "0.88rem",
                                fontWeight: 600,
                                color: "var(--text-primary)",
                              }}
                            >
                              Modo de Manutenção
                            </span>
                            <span
                              style={{
                                fontSize: "0.75rem",
                                color: "var(--text-muted)",
                              }}
                            >
                              Bloqueia temporariamente o acesso dos usuários ao
                              aplicativo móvel
                            </span>
                          </div>
                          <input
                            type="checkbox"
                            checked={maintenanceMode}
                            onChange={(e) =>
                              setMaintenanceMode(e.target.checked)
                            }
                            disabled={!isMaster || savingSettings}
                            style={{
                              width: "18px",
                              height: "18px",
                              accentColor: "var(--accent-primary)",
                              cursor: isMaster ? "pointer" : "default",
                            }}
                          />
                        </div>

                        <div className="form-group">
                          <label
                            className="form-label"
                            style={{ fontSize: "0.82rem" }}
                          >
                            WhatsApp de Suporte / Contato no App
                          </label>
                          <input
                            type="text"
                            className="form-input"
                            style={{
                              paddingLeft: "0.75rem",
                              fontSize: "0.85rem",
                            }}
                            placeholder="(11) 99999-9999"
                            value={contactWhatsapp}
                            onChange={(e) => setContactWhatsapp(e.target.value)}
                            disabled={!isMaster || savingSettings}
                          />
                        </div>

                        <div className="form-group">
                          <label
                            className="form-label"
                            style={{ fontSize: "0.82rem" }}
                          >
                            Avaliação Mínima para Destaques (Featured)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            min="1"
                            max="5"
                            className="form-input"
                            style={{
                              paddingLeft: "0.75rem",
                              fontSize: "0.85rem",
                            }}
                            value={minRatingFeatured}
                            onChange={(e) =>
                              setMinRatingFeatured(
                                parseFloat(e.target.value) || 4.5,
                              )
                            }
                            disabled={!isMaster || savingSettings}
                          />
                        </div>

                        <div className="form-group">
                          <label
                            className="form-label"
                            style={{ fontSize: "0.82rem" }}
                          >
                            Versão do Aplicativo (Android / iOS)
                          </label>
                          <input
                            type="text"
                            className="form-input"
                            style={{
                              paddingLeft: "0.75rem",
                              fontSize: "0.85rem",
                            }}
                            placeholder="1.0.0"
                            value={appVersion}
                            onChange={(e) => setAppVersion(e.target.value)}
                            disabled={!isMaster || savingSettings}
                          />
                        </div>

                        {isMaster && (
                          <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ marginTop: "0.5rem" }}
                            disabled={savingSettings}
                          >
                            {savingSettings
                              ? "Salvando..."
                              : "Salvar Configurações Gerais"}
                          </button>
                        )}
                      </form>
                    </div>

                    {/* CHANGE PASSWORD */}
                    <div
                      className="section-container"
                      style={{ padding: "1.5rem" }}
                    >
                      <div
                        className="section-title"
                        style={{ marginBottom: "1.25rem" }}
                      >
                        <h2
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            fontSize: "1.1rem",
                          }}
                        >
                          <Key
                            size={18}
                            style={{ color: "var(--accent-orange)" }}
                          />
                          Alterar Minha Senha
                        </h2>
                      </div>

                      <form
                        onSubmit={handleChangePassword}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "1rem",
                        }}
                      >
                        <div className="form-group">
                          <label
                            className="form-label"
                            style={{ fontSize: "0.82rem" }}
                          >
                            Nova Senha
                          </label>
                          <div className="input-wrapper">
                            <Lock className="input-icon" size={16} />
                            <input
                              type="password"
                              className="form-input"
                              placeholder="Mínimo 6 caracteres"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              required
                              disabled={passwordLoading}
                            />
                          </div>
                        </div>

                        <div className="form-group">
                          <label
                            className="form-label"
                            style={{ fontSize: "0.82rem" }}
                          >
                            Confirmar Nova Senha
                          </label>
                          <div className="input-wrapper">
                            <Lock className="input-icon" size={16} />
                            <input
                              type="password"
                              className="form-input"
                              placeholder="Redigite a senha"
                              value={confirmPassword}
                              onChange={(e) =>
                                setConfirmPassword(e.target.value)
                              }
                              required
                              disabled={passwordLoading}
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="btn btn-action btn-action-reactivate"
                          style={{ width: "100%", marginTop: "0.5rem" }}
                          disabled={passwordLoading}
                        >
                          {passwordLoading
                            ? "Alterando..."
                            : "Alterar Senha do Meu Perfil"}
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* COLUMN 2: ADMIN MANAGEMENT */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "1.5rem",
                    }}
                  >
                    <div
                      className="section-container"
                      style={{ padding: "1.5rem" }}
                    >
                      <div
                        className="section-title"
                        style={{ marginBottom: "1.25rem" }}
                      >
                        <h2
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            fontSize: "1.1rem",
                          }}
                        >
                          <Shield
                            size={18}
                            style={{ color: "var(--accent-blue)" }}
                          />
                          Gerenciamento de Administradores
                        </h2>
                      </div>

                      {!isMaster ? (
                        <div
                          className="empty-state"
                          style={{ padding: "2rem" }}
                        >
                          <Shield
                            size={32}
                            style={{
                              color: "var(--text-muted)",
                              marginBottom: "0.5rem",
                            }}
                          />
                          <p
                            style={{
                              color: "var(--text-secondary)",
                              fontSize: "0.9rem",
                            }}
                          >
                            Acesso Restrito: Apenas administradores com cargo de{" "}
                            <strong>Administrador Principal (Master)</strong>{" "}
                            podem gerenciar e conceder cargos de acesso.
                          </p>
                        </div>
                      ) : (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "1.5rem",
                          }}
                        >
                          {/* CURRENT ADMINS TABLE */}
                          <div>
                            <span
                              style={{
                                fontSize: "0.8rem",
                                fontWeight: 600,
                                color: "var(--text-secondary)",
                                textTransform: "uppercase",
                                display: "block",
                                marginBottom: "0.5rem",
                              }}
                            >
                              Administradores Ativos ({admins.length})
                            </span>
                            <div
                              className="table-wrapper"
                              style={{ maxHeight: "220px", overflowY: "auto" }}
                            >
                              <table style={{ fontSize: "0.82rem" }}>
                                <thead>
                                  <tr>
                                    <th>Nome / Email</th>
                                    <th>Cargo</th>
                                    <th style={{ textAlign: "right" }}>
                                      Ações
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {admins.map((adm) => (
                                    <tr key={adm.id}>
                                      <td>
                                        <div style={{ fontWeight: 600 }}>
                                          {adm.name || "Sem Nome"}
                                        </div>
                                        <div
                                          style={{
                                            color: "var(--text-muted)",
                                            fontSize: "0.75rem",
                                          }}
                                        >
                                          {adm.email}
                                        </div>
                                      </td>
                                      <td>
                                        <select
                                          className="filter-select"
                                          style={{
                                            fontSize: "0.75rem",
                                            padding: "0.2rem 0.4rem",
                                            width: "auto",
                                          }}
                                          value={adm.admin_role || "moderador"}
                                          onChange={(e) =>
                                            handleUpdateAdminRole(
                                              adm,
                                              e.target.value,
                                            )
                                          }
                                          disabled={
                                            adm.email === adminUser.email
                                          }
                                        >
                                          <option value="principal">
                                            Principal
                                          </option>
                                          <option value="secundario">
                                            Secundário
                                          </option>
                                          <option value="moderador">
                                            Moderador
                                          </option>
                                        </select>
                                      </td>
                                      <td style={{ textAlign: "right" }}>
                                        <button
                                          className="btn-action btn-action-block"
                                          style={{
                                            width: "auto",
                                            fontSize: "0.72rem",
                                            padding: "0.2rem 0.5rem",
                                          }}
                                          onClick={() => handleDemoteAdmin(adm)}
                                          disabled={
                                            adm.email === adminUser.email
                                          }
                                        >
                                          Demover
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* PROMOTE NEW ADMIN FORM */}
                          <div
                            style={{
                              borderTop: "1px solid var(--border-color)",
                              paddingTop: "1.25rem",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "0.8rem",
                                fontWeight: 600,
                                color: "var(--text-secondary)",
                                textTransform: "uppercase",
                                display: "block",
                                marginBottom: "0.75rem",
                              }}
                            >
                              Promover Novo Administrador
                            </span>

                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "0.75rem",
                              }}
                            >
                              <div className="form-group" style={{ margin: 0 }}>
                                <label
                                  className="form-label"
                                  style={{ fontSize: "0.75rem" }}
                                >
                                  Buscar Usuário por Nome ou E-mail
                                </label>
                                <div className="input-wrapper">
                                  <Search className="input-icon" size={14} />
                                  <input
                                    type="text"
                                    className="form-input"
                                    style={{
                                      paddingLeft: "0.75rem",
                                      fontSize: "0.82rem",
                                    }}
                                    placeholder="Digite para buscar..."
                                    value={newAdminSearch}
                                    onChange={(e) => {
                                      setNewAdminSearch(e.target.value);
                                      setSelectedNewAdmin(null);
                                    }}
                                  />
                                </div>
                              </div>

                              {/* Search suggestions dropdown */}
                              {searchNonAdminsResults.length > 0 && (
                                <div
                                  style={{
                                    background: "var(--bg-surface)",
                                    border: "1px solid var(--border-color)",
                                    borderRadius: "8px",
                                    overflow: "hidden",
                                    display: "flex",
                                    flexDirection: "column",
                                  }}
                                >
                                  {searchNonAdminsResults.map((user) => (
                                    <div
                                      key={user.id}
                                      style={{
                                        padding: "0.5rem 0.75rem",
                                        borderBottom:
                                          "1px solid var(--border-color)",
                                        cursor: "pointer",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        fontSize: "0.8rem",
                                      }}
                                      onClick={() => {
                                        setSelectedNewAdmin(user);
                                        setNewAdminSearch("");
                                      }}
                                    >
                                      <div>
                                        <strong
                                          style={{
                                            color: "var(--text-primary)",
                                          }}
                                        >
                                          {user.name || "Sem Nome"}
                                        </strong>
                                        <span
                                          style={{
                                            color: "var(--text-muted)",
                                            marginLeft: "8px",
                                          }}
                                        >
                                          {user.email}
                                        </span>
                                      </div>
                                      <span
                                        style={{
                                          fontSize: "0.7rem",
                                          padding: "0.1rem 0.3rem",
                                          borderRadius: "4px",
                                          backgroundColor:
                                            "rgba(59, 130, 246, 0.1)",
                                          color: "var(--accent-blue)",
                                        }}
                                      >
                                        Selecionar
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Selected User to promote info */}
                              {selectedNewAdmin && (
                                <div
                                  style={{
                                    background: "rgba(59, 130, 246, 0.04)",
                                    border: "1px dashed var(--accent-blue)",
                                    borderRadius: "8px",
                                    padding: "0.75rem",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "0.5rem",
                                  }}
                                >
                                  <div style={{ fontSize: "0.8rem" }}>
                                    <span
                                      style={{ color: "var(--text-muted)" }}
                                    >
                                      Usuário Selecionado:{" "}
                                    </span>
                                    <strong
                                      style={{ color: "var(--text-primary)" }}
                                    >
                                      {selectedNewAdmin.name || "Sem Nome"}
                                    </strong>{" "}
                                    ({selectedNewAdmin.email})
                                  </div>
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "1rem",
                                    }}
                                  >
                                    <div
                                      style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        flex: 1,
                                      }}
                                    >
                                      <label
                                        style={{
                                          fontSize: "0.7rem",
                                          color: "var(--text-secondary)",
                                          marginBottom: "2px",
                                        }}
                                      >
                                        Nível de Acesso
                                      </label>
                                      <select
                                        className="filter-select"
                                        style={{
                                          width: "100%",
                                          padding: "0.3rem",
                                          fontSize: "0.8rem",
                                        }}
                                        value={newAdminRole}
                                        onChange={(e) =>
                                          setNewAdminRole(e.target.value as any)
                                        }
                                      >
                                        <option value="principal">
                                          Administrador Principal (Master)
                                        </option>
                                        <option value="secundario">
                                          Administrador Secundário
                                        </option>
                                        <option value="moderador">
                                          Moderador
                                        </option>
                                      </select>
                                    </div>
                                    <button
                                      className="btn btn-primary"
                                      style={{
                                        alignSelf: "flex-end",
                                        padding: "0.45rem 1rem",
                                        fontSize: "0.8rem",
                                        width: "auto",
                                      }}
                                      onClick={handlePromoteAdmin}
                                    >
                                      Promover
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* AUDIT LOGS TRAIL */}
                <div className="section-container">
                  <div
                    className="section-header"
                    style={{ flexWrap: "wrap", gap: "1rem" }}
                  >
                    <div className="section-title">
                      <h2
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <Activity
                          size={18}
                          style={{ color: "var(--accent-primary)" }}
                        />
                        Logs de Atividades Administrativas (
                        {filteredLogs.length})
                      </h2>
                    </div>

                    <div className="filter-row">
                      <div className="search-box">
                        <Search className="search-icon" size={16} />
                        <input
                          type="text"
                          placeholder="Buscar logs..."
                          value={searchLogQuery}
                          onChange={(e) => setSearchLogQuery(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div
                    className="table-wrapper"
                    style={{ maxHeight: "350px", overflowY: "auto" }}
                  >
                    {filteredLogs.length === 0 ? (
                      <div className="empty-state">
                        <Activity
                          className="empty-state-icon"
                          size={32}
                          style={{ color: "var(--text-muted)" }}
                        />
                        <p>
                          Nenhum log de atividade registrado ou correspondente
                          aos filtros.
                        </p>
                      </div>
                    ) : (
                      <table>
                        <thead>
                          <tr>
                            <th>Data / Hora</th>
                            <th>Administrador</th>
                            <th>Cargo</th>
                            <th>Tipo de Ação</th>
                            <th>Detalhamento da Ação</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredLogs.map((log) => {
                            const isError =
                              log.action_type.includes("error") ||
                              log.action_type.includes("fail") ||
                              log.action_type.includes("delete");
                            const isWarn =
                              log.action_type.includes("suspend") ||
                              log.action_type.includes("block") ||
                              log.action_type.includes("demote");
                            return (
                              <tr key={log.id}>
                                <td>
                                  {formatDate(log.created_at || log.criado_em)}
                                </td>
                                <td style={{ fontWeight: 600 }}>
                                  {log.admin_email}
                                </td>
                                <td>
                                  <span
                                    className={`badge ${log.admin_role === "principal" ? "badge-admin" : log.admin_role === "secundario" ? "badge-premium" : "badge-user"}`}
                                  >
                                    {log.admin_role.toUpperCase()}
                                  </span>
                                </td>
                                <td
                                  style={{
                                    fontWeight: 600,
                                    fontFamily: "monospace",
                                    fontSize: "0.78rem",
                                  }}
                                >
                                  <span
                                    style={{
                                      color: isError
                                        ? "var(--accent-danger)"
                                        : isWarn
                                          ? "var(--accent-orange)"
                                          : "var(--accent-primary)",
                                    }}
                                  >
                                    {log.action_type.toUpperCase()}
                                  </span>
                                </td>
                                <td>{log.details}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
      </main>

      {/* USER DETAILS MODAL */}
      {selectedUser && (
        <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <User size={20} style={{ color: "var(--accent-blue)" }} />
                <span>Detalhes do Usuário</span>
              </h2>
              <button
                className="btn-refresh"
                style={{ width: "32px", height: "32px", border: "none" }}
                onClick={() => setSelectedUser(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              {/* Left Column */}
              <div className="modal-sidebar-info">
                <div className="modal-sidebar-header">
                  <div
                    className="modal-avatar-large"
                    style={{
                      backgroundColor:
                        getUserType(selectedUser.open_id) === "comércio"
                          ? "var(--accent-orange)"
                          : getUserType(selectedUser.open_id) === "prestador"
                            ? "var(--accent-primary)"
                            : "var(--accent-blue)",
                    }}
                  >
                    {getInitials(selectedUser.name || selectedUser.email)}
                  </div>
                  <h3 className="modal-sidebar-title">
                    {selectedUser.name || "Sem nome"}
                  </h3>
                  <span
                    className={`badge ${
                      getUserType(selectedUser.open_id) === "comércio"
                        ? "badge-premium"
                        : getUserType(selectedUser.open_id) === "prestador"
                          ? "badge-admin"
                          : "badge-user"
                    }`}
                    style={{ marginTop: "0.5rem" }}
                  >
                    {getUserType(selectedUser.open_id).toUpperCase()}
                  </span>
                </div>

                <div>
                  <div className="modal-info-label">E-mail</div>
                  <div
                    className="modal-info-value"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <Mail size={12} style={{ color: "var(--text-muted)" }} />
                    {selectedUser.email || "Sem e-mail"}
                  </div>

                  <div className="modal-info-label">Telefone</div>
                  <div
                    className="modal-info-value"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <Phone size={12} style={{ color: "var(--text-muted)" }} />
                    {getUserPhone(selectedUser)}
                  </div>

                  <div className="modal-info-label">Login</div>
                  <div className="modal-info-value">
                    {selectedUser.login_method || "E-mail/Senha"}
                  </div>

                  <div className="modal-info-label">Criado em</div>
                  <div className="modal-info-value">
                    {formatDate(selectedUser.created_at)}
                  </div>

                  <div className="modal-info-label">Último Acesso</div>
                  <div className="modal-info-value">
                    {formatDate(selectedUser.last_signed_in)}
                  </div>

                  <div className="modal-info-label">Status da Conta</div>
                  <div className="modal-info-value">
                    <span
                      className={`badge ${
                        (selectedUser.status || "ativo") === "ativo"
                          ? "badge-active"
                          : "badge-inactive"
                      }`}
                      style={{
                        backgroundColor:
                          (selectedUser.status || "ativo") === "suspenso"
                            ? "rgba(245, 158, 11, 0.15)"
                            : undefined,
                        color:
                          (selectedUser.status || "ativo") === "suspenso"
                            ? "var(--accent-orange)"
                            : undefined,
                        borderColor:
                          (selectedUser.status || "ativo") === "suspenso"
                            ? "rgba(245, 158, 11, 0.2)"
                            : undefined,
                      }}
                    >
                      {(selectedUser.status || "ativo").toUpperCase()}
                    </span>
                  </div>

                  {getUserAddress(selectedUser.open_id) && (
                    <>
                      <div
                        className="modal-info-label"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          marginTop: "1rem",
                          borderTop: "1px solid var(--border-color)",
                          paddingTop: "0.5rem",
                        }}
                      >
                        <MapPin
                          size={12}
                          style={{ color: "var(--accent-orange)" }}
                        />
                        Endereço
                      </div>
                      <div
                        className="modal-info-value"
                        style={{
                          fontSize: "0.82rem",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {getUserAddress(selectedUser.open_id)?.address}
                        <br />
                        Bairro:{" "}
                        {getUserAddress(selectedUser.open_id)?.neighborhood}
                        <br />
                        Cidade: {getUserAddress(selectedUser.open_id)?.city}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Right Column */}
              <div className="modal-tab-container">
                <nav className="tab-nav">
                  <button
                    className={`tab-btn ${modalTab === "activity" ? "active" : ""}`}
                    onClick={() => setModalTab("activity")}
                  >
                    <Activity size={14} />
                    Atividades ({userEvents.length})
                  </button>
                  <button
                    className={`tab-btn ${modalTab === "reviews" ? "active" : ""}`}
                    onClick={() => setModalTab("reviews")}
                  >
                    <Star size={14} />
                    Avaliações ({userReviews.length})
                  </button>
                  <button
                    className={`tab-btn ${modalTab === "admin_history" ? "active" : ""}`}
                    onClick={() => setModalTab("admin_history")}
                  >
                    <History size={14} />
                    Histórico Admin ({userActions.length})
                  </button>
                </nav>

                <div className="tab-panel">
                  {modalLoading && (
                    <div style={{ textAlign: "center", padding: "2rem" }}>
                      <div
                        className="spinner"
                        style={{
                          margin: "0 auto 1rem",
                          width: "24px",
                          height: "24px",
                        }}
                      ></div>
                      <p style={{ fontSize: "0.85rem" }}>Carregando dados...</p>
                    </div>
                  )}

                  {!modalLoading && modalTab === "activity" && (
                    <>
                      {userEvents.length === 0 ? (
                        <p
                          style={{
                            color: "var(--text-muted)",
                            fontSize: "0.88rem",
                          }}
                        >
                          Nenhuma atividade registrada.
                        </p>
                      ) : (
                        userEvents.map((evt) => (
                          <div key={evt.id} className="timeline-item success">
                            <div className="timeline-header">
                              <span
                                style={{
                                  fontWeight: 600,
                                  color: "var(--text-primary)",
                                  textTransform: "capitalize",
                                }}
                              >
                                {evt.tipo_evento?.replace("_", " ")}
                              </span>
                              <span>
                                {formatDate(evt.criadoEm || evt.created_at)}
                              </span>
                            </div>
                            <div className="timeline-content">
                              {evt.valor
                                ? `Valor: "${evt.valor}"`
                                : "Ação efetuada no app"}
                              {evt.cidade && ` em ${evt.cidade}`}
                            </div>
                          </div>
                        ))
                      )}
                    </>
                  )}

                  {!modalLoading && modalTab === "reviews" && (
                    <>
                      {userReviews.length === 0 ? (
                        <p
                          style={{
                            color: "var(--text-muted)",
                            fontSize: "0.88rem",
                          }}
                        >
                          Nenhuma avaliação realizada por este usuário.
                        </p>
                      ) : (
                        userReviews.map((rev) => (
                          <div key={rev.id} className="review-item-card">
                            <div className="review-item-header">
                              <div className="stars-row">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    size={12}
                                    fill={
                                      i < Math.round(rev.rating)
                                        ? "currentColor"
                                        : "none"
                                    }
                                  />
                                ))}
                                <span
                                  style={{
                                    marginLeft: "4px",
                                    fontSize: "0.8rem",
                                    color: "var(--text-primary)",
                                  }}
                                >
                                  ({rev.rating})
                                </span>
                              </div>
                              <span
                                style={{
                                  fontSize: "0.75rem",
                                  color: "var(--text-muted)",
                                }}
                              >
                                {
                                  formatDate(
                                    rev.createdAt || rev.created_at,
                                  ).split(" ")[0]
                                }
                              </span>
                            </div>
                            <p
                              style={{
                                fontSize: "0.85rem",
                                color: "var(--text-secondary)",
                                fontStyle: "italic",
                              }}
                            >
                              "{rev.comment || "Sem comentários"}"
                            </p>
                          </div>
                        ))
                      )}
                    </>
                  )}

                  {!modalLoading && modalTab === "admin_history" && (
                    <>
                      {userActions.length === 0 ? (
                        <p
                          style={{
                            color: "var(--text-muted)",
                            fontSize: "0.88rem",
                          }}
                        >
                          Nenhuma ação administrativa registrada.
                        </p>
                      ) : (
                        userActions.map((act) => {
                          const isDanger =
                            act.action_type === "bloquear" ||
                            act.action_type === "excluir";
                          const isWarning = act.action_type === "suspender";

                          return (
                            <div
                              key={act.id}
                              className={`timeline-item ${isDanger ? "important" : isWarning ? "warning" : "success"}`}
                            >
                              <div className="timeline-header">
                                <span
                                  style={{
                                    fontWeight: 600,
                                    color: isDanger
                                      ? "var(--accent-danger)"
                                      : isWarning
                                        ? "var(--accent-orange)"
                                        : "var(--accent-primary)",
                                    textTransform: "capitalize",
                                  }}
                                >
                                  {act.action_type.toUpperCase()}
                                </span>
                                <span>{formatDate(act.created_at)}</span>
                              </div>
                              <div className="timeline-content">
                                <div>
                                  <strong>Motivo:</strong> {act.reason}
                                </div>
                                <div
                                  style={{
                                    fontSize: "0.75rem",
                                    color: "var(--text-muted)",
                                    marginTop: "4px",
                                  }}
                                >
                                  Responsável: {act.admin_email}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </>
                  )}
                </div>

                <div className="action-card">
                  <div className="action-card-header">
                    <ShieldAlert
                      size={16}
                      style={{ color: "var(--accent-danger)" }}
                    />
                    <span>Ações Administrativas</span>
                  </div>

                  <textarea
                    className="reason-textarea"
                    placeholder="Escreva detalhadamente o motivo desta ação administrativa para fins de auditoria..."
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                  />

                  <div className="btn-group-row">
                    {(selectedUser.status || "ativo") === "ativo" && (
                      <>
                        <button
                          className="btn-action btn-action-suspend"
                          onClick={() => handleUserAction("suspender")}
                          disabled={modalLoading}
                        >
                          <ShieldOff size={14} /> Suspender Conta
                        </button>
                        <button
                          className="btn-action btn-action-block"
                          onClick={() => handleUserAction("bloquear")}
                          disabled={modalLoading}
                        >
                          <ShieldAlert size={14} /> Bloquear Conta
                        </button>
                      </>
                    )}

                    {((selectedUser.status || "ativo") === "suspenso" ||
                      (selectedUser.status || "ativo") === "bloqueado") && (
                      <button
                        className="btn-action btn-action-reactivate"
                        onClick={() => handleUserAction("reativar")}
                        disabled={modalLoading}
                      >
                        <UserCheck size={14} /> Reativar Conta
                      </button>
                    )}

                    <button
                      className="btn-action btn-action-delete"
                      onClick={() => handleUserAction("excluir")}
                      disabled={modalLoading}
                      style={{ marginLeft: "auto" }}
                    >
                      <Trash2 size={14} /> Excluir Conta permanentemente
                    </button>
                  </div>
                </div>

                {getUserType(selectedUser.open_id) !== "cliente" ? (
                  <div
                    className="action-card"
                    style={{
                      borderLeft: "4px solid var(--accent-primary)",
                      marginTop: "1rem",
                    }}
                  >
                    <div className="action-card-header">
                      <Store
                        size={16}
                        style={{ color: "var(--accent-primary)" }}
                      />
                      <span>Anunciante Vinculado</span>
                    </div>
                    <p
                      style={{
                        fontSize: "0.85rem",
                        color: "var(--text-secondary)",
                        margin: "0.5rem 0",
                      }}
                    >
                      Este usuário já possui um perfil de{" "}
                      {getUserType(selectedUser.open_id)} cadastrado.
                    </p>
                    <button
                      className="btn btn-primary"
                      style={{
                        width: "100%",
                        marginTop: "0.5rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                      }}
                      onClick={() => {
                        const provider = providersList.find(
                          (p) => p.user_id === selectedUser.open_id,
                        );
                        if (provider) {
                          setSelectedUser(null); // Close User modal
                          handleSelectAdvertiser(provider); // Open Advertiser modal
                          setActiveTab("advertisers"); // Switch to Advertisers tab
                        } else {
                          alert(
                            "Não foi possível encontrar o perfil do anunciante correspondente.",
                          );
                        }
                      }}
                    >
                      <ArrowRight size={14} /> Ir para Perfil de Anunciante
                    </button>
                  </div>
                ) : (
                  <div
                    className="action-card"
                    style={{
                      borderLeft: "4px solid var(--accent-primary)",
                      marginTop: "1rem",
                    }}
                  >
                    <div className="action-card-header">
                      <UserPlus
                        size={16}
                        style={{ color: "var(--accent-primary)" }}
                      />
                      <span>Promover a Prestador ou Comércio</span>
                    </div>
                    <form
                      onSubmit={handlePromoteUser}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.75rem",
                        marginTop: "0.5rem",
                      }}
                    >
                      <div>
                        <label
                          className="form-label"
                          style={{ fontSize: "0.8rem", marginBottom: "4px" }}
                        >
                          Selecionar Categoria / Tipo
                        </label>
                        <select
                          className="filter-select"
                          style={{ width: "100%", padding: "6px" }}
                          value={promoCategory}
                          onChange={(e) => {
                            setPromoCategory(e.target.value);
                            // Auto check hasCatalog if category is Comércios
                            if (e.target.value === "comercios") {
                              setPromoHasCatalog(true);
                            }
                          }}
                          required
                        >
                          <option value="">Selecione uma categoria...</option>
                          {categoriesList.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}{" "}
                              {cat.id === "comercios"
                                ? "(Comércio)"
                                : "(Prestador)"}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label
                          className="form-label"
                          style={{ fontSize: "0.8rem", marginBottom: "4px" }}
                        >
                          Tipo de Negócio
                        </label>
                        <select
                          className="filter-select"
                          style={{ width: "100%", padding: "6px" }}
                          value={promoBusinessType}
                          onChange={(e) => {
                            setPromoBusinessType(e.target.value);
                            if (e.target.value !== "alimentacao") {
                              setPromoDeliveryTime("");
                            }
                          }}
                          required
                        >
                          <option value="servicos">Serviços</option>
                          <option value="alimentacao">Alimentação</option>
                          <option value="produtos">Produtos</option>
                        </select>
                      </div>

                      {promoBusinessType === "alimentacao" && (
                        <div>
                          <label
                            className="form-label"
                            style={{ fontSize: "0.8rem", marginBottom: "4px" }}
                          >
                            Tempo Estimado de Entrega
                          </label>
                          <input
                            type="text"
                            className="form-input"
                            style={{
                              paddingLeft: "0.5rem",
                              paddingRight: "0.5rem",
                              height: "34px",
                            }}
                            value={promoDeliveryTime}
                            onChange={(e) =>
                              setPromoDeliveryTime(e.target.value)
                            }
                            placeholder="Ex: 30-45 min"
                            required
                          />
                        </div>
                      )}

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          margin: "4px 0",
                        }}
                      >
                        <input
                          type="checkbox"
                          id="promoHasCatalog"
                          checked={promoHasCatalog}
                          onChange={(e) => setPromoHasCatalog(e.target.checked)}
                          style={{
                            width: "16px",
                            height: "16px",
                            cursor: "pointer",
                          }}
                        />
                        <label
                          htmlFor="promoHasCatalog"
                          className="form-label"
                          style={{
                            margin: 0,
                            cursor: "pointer",
                            fontSize: "0.82rem",
                            color: "var(--text-primary)",
                          }}
                        >
                          Ativar Catálogo de Serviços / Cardápio (com preços)
                        </label>
                      </div>

                      <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: "100%", marginTop: "0.25rem" }}
                        disabled={promoting || !promoCategory}
                      >
                        {promoting ? "Promovendo..." : "Confirmar Promoção"}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-logout"
                style={{ width: "auto" }}
                onClick={() => setSelectedUser(null)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADVERTISER DETAILS MODAL */}
      {selectedAdvertiser && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedAdvertiser(null)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <Store size={20} style={{ color: "var(--accent-primary)" }} />
                <span>Perfil de Anunciante</span>
              </h2>
              <button
                className="btn-refresh"
                style={{ width: "32px", height: "32px", border: "none" }}
                onClick={() => setSelectedAdvertiser(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              {/* Left Column: Advertiser Summary Cards */}
              <div className="modal-sidebar-info">
                <div className="modal-sidebar-header">
                  {selectedAdvertiser.avatar_uri ? (
                    <img
                      src={selectedAdvertiser.avatar_uri}
                      alt={selectedAdvertiser.name}
                      style={{
                        width: "64px",
                        height: "64px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        marginBottom: "0.75rem",
                        border: "2px solid var(--border-color)",
                      }}
                    />
                  ) : (
                    <div
                      className="modal-avatar-large"
                      style={{ backgroundColor: "var(--accent-primary)" }}
                    >
                      {getInitials(selectedAdvertiser.name)}
                    </div>
                  )}
                  <h3 className="modal-sidebar-title">
                    {selectedAdvertiser.name}
                  </h3>
                  <span
                    className="badge badge-user"
                    style={{ marginTop: "0.5rem" }}
                  >
                    {selectedAdvertiser.category || "Profissional"}
                  </span>
                </div>

                {/* Analytical Stats Panel */}
                <div
                  style={{
                    background: "var(--bg-primary)",
                    padding: "0.75rem",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: "0.82rem",
                    }}
                  >
                    <span
                      style={{
                        color: "var(--text-secondary)",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <Eye size={12} /> Visualizações:
                    </span>
                    <strong style={{ color: "var(--text-primary)" }}>
                      {advertiserStats.views}
                    </strong>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: "0.82rem",
                    }}
                  >
                    <span
                      style={{
                        color: "var(--text-secondary)",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <MessageSquare size={12} /> Cliques Whats:
                    </span>
                    <strong style={{ color: "var(--text-primary)" }}>
                      {advertiserStats.clicks}
                    </strong>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: "0.82rem",
                    }}
                  >
                    <span
                      style={{
                        color: "var(--text-secondary)",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <Heart size={12} /> Favoritos:
                    </span>
                    <strong style={{ color: "var(--text-primary)" }}>
                      {advertiserStats.favorites}
                    </strong>
                  </div>
                </div>

                <div>
                  <div className="modal-info-label">Cidade / Bairro</div>
                  <div className="modal-info-value">
                    {selectedAdvertiser.city || "-"} /{" "}
                    {selectedAdvertiser.neighborhood || "-"}
                  </div>

                  <div className="modal-info-label">Plano Ativo</div>
                  <div className="modal-info-value">
                    <span
                      className={`badge ${selectedAdvertiser.plan_status === "ativo" ? "badge-premium" : "badge-free"}`}
                    >
                      {selectedAdvertiser.plan_status === "ativo"
                        ? selectedAdvertiser.billing_cycle === "annual"
                          ? "Anual (PREMIUM)"
                          : selectedAdvertiser.billing_cycle === "semiannual"
                            ? "Semestral (PREMIUM)"
                            : selectedAdvertiser.billing_cycle === "quarterly"
                              ? "Trimestral (PREMIUM)"
                              : "Mensal (PREMIUM)"
                        : "Gratuito"}
                    </span>
                  </div>

                  <div className="modal-info-label">Vencimento do Plano</div>
                  <div className="modal-info-value">
                    {selectedAdvertiser.plan_expires_at
                      ? formatDate(selectedAdvertiser.plan_expires_at).split(
                          " ",
                        )[0]
                      : "-"}
                  </div>

                  <div className="modal-info-label">Selo Verificado</div>
                  <div className="modal-info-value">
                    {selectedAdvertiser.is_verified ? (
                      <span className="badge badge-active" style={{ backgroundColor: "rgba(34, 197, 94, 0.15)", color: "#22c55e", borderColor: "rgba(34, 197, 94, 0.2)" }}>Sim (Verificado)</span>
                    ) : (
                      <span className="badge badge-inactive">Não</span>
                    )}
                  </div>

                  <div className="modal-info-label">Selo de Destaque</div>
                  <div className="modal-info-value">
                    {selectedAdvertiser.top_badge ? (
                      <span className="badge badge-premium" style={{ backgroundColor: selectedAdvertiser.top_badge === "Patrocinado" ? "rgba(245, 158, 11, 0.15)" : selectedAdvertiser.top_badge === "Destaque" ? "rgba(59, 130, 246, 0.15)" : "rgba(34, 197, 94, 0.15)", color: selectedAdvertiser.top_badge === "Patrocinado" ? "#f59e0b" : selectedAdvertiser.top_badge === "Destaque" ? "#3b82f6" : "#22c55e", borderColor: selectedAdvertiser.top_badge === "Patrocinado" ? "rgba(245, 158, 11, 0.2)" : selectedAdvertiser.top_badge === "Destaque" ? "rgba(59, 130, 246, 0.2)" : "rgba(34, 197, 94, 0.2)" }}>
                        {selectedAdvertiser.top_badge}
                      </span>
                    ) : (
                      <span className="badge badge-inactive">Nenhum</span>
                    )}
                  </div>

                  <div className="modal-info-label">Status do Anúncio</div>
                  <div className="modal-info-value">
                    <span
                      className={`badge ${
                        selectedAdvertiser.is_active &&
                        (selectedAdvertiser.status || "ativo") === "ativo"
                          ? "badge-active"
                          : (selectedAdvertiser.status || "ativo") ===
                              "pendente"
                            ? "badge-inactive"
                            : "badge-inactive"
                      }`}
                      style={{
                        backgroundColor:
                          (selectedAdvertiser.status || "ativo") === "suspenso"
                            ? "rgba(245, 158, 11, 0.15)"
                            : (selectedAdvertiser.status || "ativo") ===
                                "pendente"
                              ? "rgba(59, 130, 246, 0.15)"
                              : undefined,
                        color:
                          (selectedAdvertiser.status || "ativo") === "suspenso"
                            ? "var(--accent-orange)"
                            : (selectedAdvertiser.status || "ativo") ===
                                "pendente"
                              ? "var(--accent-blue)"
                              : undefined,
                        borderColor:
                          (selectedAdvertiser.status || "ativo") === "suspenso"
                            ? "rgba(245, 158, 11, 0.2)"
                            : (selectedAdvertiser.status || "ativo") ===
                                "pendente"
                              ? "rgba(59, 130, 246, 0.2)"
                              : undefined,
                      }}
                    >
                      {(selectedAdvertiser.status || "ativo") === "suspenso"
                        ? "SUSPENSO"
                        : (selectedAdvertiser.status || "ativo") === "pendente"
                          ? "PENDENTE"
                          : selectedAdvertiser.is_active
                            ? "ATIVO"
                            : "INATIVO"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Tabbed Edit Forms & History Panels */}
              <div className="modal-tab-container">
                <nav className="tab-nav">
                  <button
                    className={`tab-btn ${advertiserTab === "info" ? "active" : ""}`}
                    onClick={() => {
                      setAdvertiserTab("info");
                      setIsEditing(false);
                    }}
                  >
                    <Edit size={14} />
                    Informações & Edição
                  </button>
                  <button
                    className={`tab-btn ${advertiserTab === "reviews" ? "active" : ""}`}
                    onClick={() => setAdvertiserTab("reviews")}
                  >
                    <Star size={14} />
                    Avaliações ({advertiserReviews.length})
                  </button>
                  <button
                    className={`tab-btn ${advertiserTab === "payments" ? "active" : ""}`}
                    onClick={() => setAdvertiserTab("payments")}
                  >
                    <DollarSign size={14} />
                    Histórico Financeiro ({advertiserPayments.length})
                  </button>
                  <button
                    className={`tab-btn ${advertiserTab === "services" ? "active" : ""}`}
                    onClick={() => setAdvertiserTab("services")}
                  >
                    <Briefcase size={14} />
                    Serviços
                  </button>
                  <button
                    className={`tab-btn ${advertiserTab === "sponsorship" ? "active" : ""}`}
                    onClick={() => setAdvertiserTab("sponsorship")}
                  >
                    <Rocket size={14} />
                    Destaques & Banner
                  </button>
                </nav>

                <div className="tab-panel">
                  {modalLoading && (
                    <div style={{ textAlign: "center", padding: "2rem" }}>
                      <div
                        className="spinner"
                        style={{
                          margin: "0 auto 1rem",
                          width: "24px",
                          height: "24px",
                        }}
                      ></div>
                      <p style={{ fontSize: "0.85rem" }}>
                        Carregando dados do anunciante...
                      </p>
                    </div>
                  )}

                  {/* TAB 1: Profile Info / Edit Form */}
                  {!modalLoading && advertiserTab === "info" && (
                    <>
                      {isEditing ? (
                        <form
                          onSubmit={handleSaveAdvertiserInfo}
                          className="edit-form-grid"
                        >
                          <div className="form-group">
                            <label className="form-label">
                              Nome Fantasia / Profissional
                            </label>
                            <input
                              type="text"
                              className="form-input"
                              style={{ paddingLeft: "0.75rem" }}
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              required
                            />
                          </div>

                          <div className="form-group">
                            <label className="form-label">Categoria</label>
                            <input
                              type="text"
                              className="form-input"
                              style={{ paddingLeft: "0.75rem" }}
                              value={editCategory}
                              onChange={(e) => setEditCategory(e.target.value)}
                            />
                          </div>

                          <div className="form-group">
                            <label className="form-label">Cidade</label>
                            <input
                              type="text"
                              className="form-input"
                              style={{ paddingLeft: "0.75rem" }}
                              value={editCity}
                              onChange={(e) => setEditCity(e.target.value)}
                            />
                          </div>

                          <div className="form-group">
                            <label className="form-label">Bairro</label>
                            <input
                              type="text"
                              className="form-input"
                              style={{ paddingLeft: "0.75rem" }}
                              value={editNeighborhood}
                              onChange={(e) =>
                                setEditNeighborhood(e.target.value)
                              }
                            />
                          </div>

                          <div className="form-group">
                            <label className="form-label">
                              Telefone de Contato
                            </label>
                            <input
                              type="text"
                              className="form-input"
                              style={{ paddingLeft: "0.75rem" }}
                              value={editPhone}
                              onChange={(e) => setEditPhone(e.target.value)}
                            />
                          </div>

                          <div className="form-group">
                            <label className="form-label">WhatsApp</label>
                            <input
                              type="text"
                              className="form-input"
                              style={{ paddingLeft: "0.75rem" }}
                              value={editWhatsapp}
                              onChange={(e) => setEditWhatsapp(e.target.value)}
                            />
                          </div>

                          <div className="form-group edit-form-full">
                            <label className="form-label">
                              Endereço Completo
                            </label>
                            <input
                              type="text"
                              className="form-input"
                              style={{ paddingLeft: "0.75rem" }}
                              value={editAddress}
                              onChange={(e) => setEditAddress(e.target.value)}
                            />
                          </div>

                          <div className="form-group edit-form-full">
                            <label className="form-label">
                              Descrição das Atividades / Sobre
                            </label>
                            <textarea
                              className="reason-textarea"
                              style={{ height: "90px" }}
                              value={editDescription}
                              onChange={(e) =>
                                setEditDescription(e.target.value)
                              }
                            />
                          </div>

                          <div className="form-group">
                            <label className="form-label">Plano</label>
                            <select
                              className="filter-select"
                              style={{ width: "100%" }}
                              value={editPlanId || ""}
                              onChange={(e) => {
                                const selectedId = e.target.value || null;
                                setEditPlanId(selectedId);
                                if (selectedId) {
                                  const selectedPlan = plansList.find(p => p.id === selectedId);
                                  if (selectedPlan) {
                                    setEditPlan(selectedPlan.name);
                                    setEditPlanStatus("ativo");
                                  }
                                } else {
                                  setEditPlan("free");
                                  setEditPlanStatus("gratuito");
                                }
                              }}
                            >
                              <option value="">Gratuito</option>
                              {plansList.map((plan) => (
                                <option key={plan.id} value={plan.id}>
                                  {plan.name} - R$ {plan.monthly_price?.toFixed(2) || "0,00"}/mês
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="form-group">
                            <label className="form-label">Status do Plano</label>
                            <select
                              className="filter-select"
                              style={{ width: "100%" }}
                              value={editPlanStatus}
                              onChange={(e) => setEditPlanStatus(e.target.value)}
                            >
                              <option value="gratuito">Gratuito</option>
                              <option value="ativo">Ativo</option>
                              <option value="suspenso">Suspenso</option>
                              <option value="cancelado">Cancelado</option>
                              <option value="expirado">Expirado</option>
                              <option value="em_teste">Em teste</option>
                            </select>
                          </div>

                          <div className="form-group">
                            <label className="form-label">Ciclo de Cobrança</label>
                            <select
                              className="filter-select"
                              style={{ width: "100%" }}
                              value={editBillingCycle}
                              onChange={(e) => setEditBillingCycle(e.target.value)}
                            >
                              <option value="monthly">Mensal</option>
                              <option value="quarterly">Trimestral</option>
                              <option value="semiannual">Semestral</option>
                              <option value="annual">Anual</option>
                            </select>
                          </div>

                          <div className="form-group">
                            <label className="form-label">Data de Início</label>
                            <input
                              type="date"
                              className="form-input"
                              style={{ paddingLeft: "0.75rem" }}
                              value={editPlanStartedAt}
                              onChange={(e) =>
                                setEditPlanStartedAt(e.target.value)
                              }
                            />
                          </div>

                          <div className="form-group">
                            <label className="form-label">
                              Expiração do Plano
                            </label>
                            <input
                              type="date"
                              className="form-input"
                              style={{ paddingLeft: "0.75rem" }}
                              value={editPlanExpiresAt}
                              onChange={(e) =>
                                setEditPlanExpiresAt(e.target.value)
                              }
                            />
                          </div>

                          <div className="form-group">
                            <label className="form-label">
                              Limite de Serviços (max: -1 = ilimitado)
                            </label>
                            <input
                              type="number"
                              className="form-input"
                              style={{ paddingLeft: "0.75rem" }}
                              value={editMaxServicos}
                              onChange={(e) =>
                                setEditMaxServicos(
                                  parseInt(e.target.value) || 1,
                                )
                              }
                              min="-1"
                              required
                            />
                          </div>

                          <div className="form-group">
                            <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", marginTop: "8px" }}>
                              <input
                                type="checkbox"
                                checked={editIsVerified}
                                onChange={(e) => setEditIsVerified(e.target.checked)}
                                style={{ width: "16px", height: "16px", cursor: "pointer" }}
                              />
                              Selo Verificado (Verificado)
                            </label>
                          </div>

                          <div className="form-group">
                            <label className="form-label">Selo de Destaque (Badge)</label>
                            <select
                              className="filter-select"
                              style={{ width: "100%" }}
                              value={editTopBadge || ""}
                              onChange={(e) => setEditTopBadge(e.target.value || null)}
                            >
                              <option value="">Nenhum</option>
                              <option value="Patrocinado">Patrocinado</option>
                              <option value="Destaque">Destaque</option>
                              <option value="Verificado">Verificado</option>
                            </select>
                          </div>

                          <div className="form-group">
                            <label className="form-label">
                              Tipo de Negócio
                            </label>
                            <select
                              className="filter-select"
                              style={{ width: "100%" }}
                              value={editBusinessType}
                              onChange={(e) => {
                                setEditBusinessType(e.target.value);
                                if (e.target.value !== "alimentacao") {
                                  setEditDeliveryTime("");
                                }
                              }}
                            >
                              <option value="servicos">Serviços</option>
                              <option value="alimentacao">Alimentação</option>
                              <option value="produtos">Produtos</option>
                            </select>
                          </div>

                          {editBusinessType === "alimentacao" && (
                            <div className="form-group">
                              <label className="form-label">
                                Tempo Estimado de Entrega
                              </label>
                              <input
                                type="text"
                                className="form-input"
                                style={{ paddingLeft: "0.75rem" }}
                                value={editDeliveryTime}
                                onChange={(e) =>
                                  setEditDeliveryTime(e.target.value)
                                }
                                placeholder="Ex: 30-45 min"
                                required
                              />
                            </div>
                          )}

                          <div
                            className="form-group"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              marginTop: "8px",
                            }}
                          >
                            <input
                              type="checkbox"
                              id="editHasCatalog"
                              checked={editHasCatalog}
                              onChange={(e) =>
                                setEditHasCatalog(e.target.checked)
                              }
                              style={{
                                width: "16px",
                                height: "16px",
                                cursor: "pointer",
                              }}
                            />
                            <label
                              htmlFor="editHasCatalog"
                              className="form-label"
                              style={{
                                margin: 0,
                                cursor: "pointer",
                                fontSize: "0.85rem",
                                color: "var(--text-primary)",
                              }}
                            >
                              Ativar Catálogo de Serviços / Cardápio (com
                              preços)
                            </label>
                          </div>

                          <div
                            className="btn-group-row edit-form-full"
                            style={{
                              justifyContent: "flex-end",
                              marginTop: "1rem",
                            }}
                          >
                            <button
                              type="button"
                              className="btn btn-logout"
                              style={{ width: "auto" }}
                              onClick={() => setIsEditing(false)}
                            >
                              Cancelar
                            </button>
                            <button
                              type="submit"
                              className="btn btn-primary"
                              style={{ width: "auto" }}
                            >
                              <Save size={16} /> Salvar Alterações
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "1rem",
                          }}
                        >
                          <div>
                            <span className="modal-info-label">
                              Descrição das Atividades
                            </span>
                            <p
                              className="modal-info-value"
                              style={{ lineHeight: "1.5", fontSize: "0.9rem" }}
                            >
                              {selectedAdvertiser.description ||
                                "Nenhuma descrição fornecida."}
                            </p>
                          </div>

                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "1fr 1fr",
                              gap: "1rem",
                            }}
                          >
                            <div>
                              <span className="modal-info-label">
                                Endereço Físico
                              </span>
                              <p
                                className="modal-info-value"
                                style={{
                                  display: "flex",
                                  alignItems: "flex-start",
                                  gap: "4px",
                                }}
                              >
                                <MapPin
                                  size={14}
                                  style={{
                                    color: "var(--accent-orange)",
                                    flexShrink: 0,
                                    marginTop: "2px",
                                  }}
                                />
                                <span>
                                  {selectedAdvertiser.address ||
                                    "Sem endereço cadastrado"}
                                </span>
                              </p>
                            </div>

                            <div>
                              <span className="modal-info-label">
                                Horário de Funcionamento
                              </span>
                              <p className="modal-info-value">
                                {selectedAdvertiser.working_hours ||
                                  "Não especificado"}
                              </p>
                            </div>
                          </div>

                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "1fr 1fr",
                              gap: "1rem",
                            }}
                          >
                            <div>
                              <span className="modal-info-label">
                                Limite de Serviços / Produtos
                              </span>
                              <p
                                className="modal-info-value"
                                style={{ fontWeight: 600 }}
                              >
                                {advertiserPermission
                                  ? advertiserPermission.max_servicos === -1
                                    ? "Ilimitado"
                                    : `${advertiserPermission.max_servicos} serviços`
                                  : "1 serviço"}
                              </p>
                            </div>

                            <div>
                              <span className="modal-info-label">
                                Status da Permissão
                              </span>
                              <div>
                                <span
                                  className="badge badge-active"
                                  style={{
                                    backgroundColor:
                                      (advertiserPermission?.status ||
                                        "ativo") === "bloqueado"
                                        ? "rgba(239, 68, 68, 0.15)"
                                        : (advertiserPermission?.status ||
                                              "ativo") === "suspenso"
                                          ? "rgba(245, 158, 11, 0.15)"
                                          : undefined,
                                    color:
                                      (advertiserPermission?.status ||
                                        "ativo") === "bloqueado"
                                        ? "#ef4444"
                                        : (advertiserPermission?.status ||
                                              "ativo") === "suspenso"
                                          ? "var(--accent-orange)"
                                          : undefined,
                                    borderColor:
                                      (advertiserPermission?.status ||
                                        "ativo") === "bloqueado"
                                        ? "rgba(239, 68, 68, 0.2)"
                                        : (advertiserPermission?.status ||
                                              "ativo") === "suspenso"
                                          ? "rgba(245, 158, 11, 0.2)"
                                          : undefined,
                                  }}
                                >
                                  {(
                                    advertiserPermission?.status || "ativo"
                                  ).toUpperCase()}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "1fr 1fr",
                              gap: "1rem",
                            }}
                          >
                            <div>
                              <span className="modal-info-label">
                                Catálogo / Cardápio
                              </span>
                              <p
                                className="modal-info-value"
                                style={{ fontWeight: 600 }}
                              >
                                {selectedAdvertiser.has_catalog
                                  ? "Habilitado"
                                  : "Desabilitado"}
                              </p>
                            </div>
                          </div>

                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "1fr 1fr",
                              gap: "1rem",
                            }}
                          >
                            <div>
                              <span className="modal-info-label">
                                Tipo de Negócio
                              </span>
                              <p
                                className="modal-info-value"
                                style={{
                                  fontWeight: 600,
                                  textTransform: "capitalize",
                                }}
                              >
                                {selectedAdvertiser.business_type ===
                                "alimentacao"
                                  ? "Alimentação"
                                  : selectedAdvertiser.business_type ===
                                      "produtos"
                                    ? "Produtos"
                                    : "Serviços"}
                              </p>
                            </div>

                            {selectedAdvertiser.business_type ===
                              "alimentacao" && (
                              <div>
                                <span className="modal-info-label">
                                  Tempo de Entrega
                                </span>
                                <p
                                  className="modal-info-value"
                                  style={{ fontWeight: 600 }}
                                >
                                  {selectedAdvertiser.delivery_time ||
                                    "Não especificado"}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Photos / Gallery rendering */}
                          <div>
                            <span className="modal-info-label">
                              Galeria de Fotos do Anúncio
                            </span>
                            {selectedAdvertiser.gallery &&
                            selectedAdvertiser.gallery.length > 0 ? (
                              <div
                                style={{
                                  display: "flex",
                                  gap: "0.5rem",
                                  flexWrap: "wrap",
                                  marginTop: "0.5rem",
                                }}
                              >
                                {selectedAdvertiser.gallery.map(
                                  (imgUrl: string, idx: number) => (
                                    <img
                                      key={idx}
                                      src={imgUrl}
                                      alt={`Foto ${idx + 1}`}
                                      style={{
                                        width: "70px",
                                        height: "70px",
                                        borderRadius: "6px",
                                        objectFit: "cover",
                                        border: "1px solid var(--border-color)",
                                      }}
                                    />
                                  ),
                                )}
                              </div>
                            ) : (
                              <p
                                style={{
                                  color: "var(--text-muted)",
                                  fontSize: "0.85rem",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  marginTop: "0.25rem",
                                }}
                              >
                                <ImageIcon size={14} /> Nenhuma imagem
                                cadastrada na galeria.
                              </p>
                            )}
                          </div>

                          <div
                            style={{
                              marginTop: "1rem",
                              borderTop: "1px solid var(--border-color)",
                              paddingTop: "1rem",
                            }}
                          >
                            <button
                              className="btn btn-primary"
                              style={{ width: "auto" }}
                              onClick={() => setIsEditing(true)}
                            >
                              <Edit size={16} /> Editar Informações do Perfil
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* TAB 2: Received Reviews list */}
                  {!modalLoading && advertiserTab === "reviews" && (
                    <>
                      {advertiserReviews.length === 0 ? (
                        <p
                          style={{
                            color: "var(--text-muted)",
                            fontSize: "0.88rem",
                          }}
                        >
                          Nenhuma avaliação recebida para este anunciante.
                        </p>
                      ) : (
                        advertiserReviews.map((rev) => (
                          <div key={rev.id} className="review-item-card">
                            <div className="review-item-header">
                              <div className="user-cell">
                                {rev.user_avatar ? (
                                  <img
                                    src={rev.user_avatar}
                                    alt={rev.user_name}
                                    style={{
                                      width: "24px",
                                      height: "24px",
                                      borderRadius: "50%",
                                    }}
                                  />
                                ) : (
                                  <div
                                    className="user-avatar-small"
                                    style={{
                                      width: "24px",
                                      height: "24px",
                                      fontSize: "0.7rem",
                                      backgroundColor: "var(--accent-purple)",
                                    }}
                                  >
                                    {getInitials(rev.user_name)}
                                  </div>
                                )}
                                <span style={{ fontWeight: 600 }}>
                                  {rev.user_name}
                                </span>
                              </div>
                              <span
                                style={{
                                  fontSize: "0.75rem",
                                  color: "var(--text-muted)",
                                }}
                              >
                                {
                                  formatDate(
                                    rev.created_at || rev.createdAt,
                                  ).split(" ")[0]
                                }
                              </span>
                            </div>
                            <div
                              className="stars-row"
                              style={{ marginBottom: "0.5rem" }}
                            >
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  size={10}
                                  fill={
                                    i < Math.round(rev.rating)
                                      ? "currentColor"
                                      : "none"
                                  }
                                />
                              ))}
                              <span
                                style={{
                                  fontSize: "0.75rem",
                                  color: "var(--text-primary)",
                                  marginLeft: "4px",
                                }}
                              >
                                ({rev.rating})
                              </span>
                            </div>
                            <p
                              style={{
                                fontSize: "0.85rem",
                                color: "var(--text-secondary)",
                                fontStyle: "italic",
                              }}
                            >
                              "{rev.comment}"
                            </p>
                          </div>
                        ))
                      )}
                    </>
                  )}

                  {/* TAB 3: Payment History list */}
                  {!modalLoading && advertiserTab === "payments" && (
                    <>
                      {advertiserPayments.length === 0 ? (
                        <p
                          style={{
                            color: "var(--text-muted)",
                            fontSize: "0.88rem",
                          }}
                        >
                          Nenhum pagamento registrado para este anunciante.
                        </p>
                      ) : (
                        <div className="table-wrapper">
                          <table>
                            <thead>
                              <tr>
                                <th>ID Pagamento</th>
                                <th>Plano</th>
                                <th>Valor</th>
                                <th>Data Pagamento</th>
                                <th>Método</th>
                              </tr>
                            </thead>
                            <tbody>
                              {advertiserPayments.map((pay) => (
                                <tr key={pay.id}>
                                  <td>#{pay.id}</td>
                                  <td>
                                    <span className="badge badge-premium">
                                      {pay.plano === "mensal"
                                        ? "Mensal"
                                        : "Anual"}
                                    </span>
                                  </td>
                                  <td style={{ fontWeight: 600 }}>
                                    R$ {pay.valor?.toFixed(2)}
                                  </td>
                                  <td>
                                    {
                                      formatDate(pay.data_pagamento).split(
                                        " ",
                                      )[0]
                                    }
                                  </td>
                                  <td style={{ textTransform: "uppercase" }}>
                                    {pay.metodo}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </>
                  )}

                  {/* TAB 4: Services list */}
                  {!modalLoading && advertiserTab === "services" && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "1rem",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span
                          className="modal-info-label"
                          style={{ margin: 0 }}
                        >
                          Serviços Cadastrados pelo Parceiro
                        </span>
                        <span
                          className="badge badge-active"
                          style={{ fontSize: "0.75rem", fontWeight: 700 }}
                        >
                          {(() => {
                            try {
                              const srvList = selectedAdvertiser.services
                                ? typeof selectedAdvertiser.services ===
                                  "string"
                                  ? JSON.parse(selectedAdvertiser.services)
                                  : selectedAdvertiser.services
                                : [];
                              return `${srvList.length} cadastrados`;
                            } catch (e) {
                              return "0 cadastrados";
                            }
                          })()}
                        </span>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.75rem",
                          marginTop: "0.25rem",
                        }}
                      >
                        {(() => {
                          try {
                            const srvList = selectedAdvertiser.services
                              ? typeof selectedAdvertiser.services === "string"
                                ? JSON.parse(selectedAdvertiser.services)
                                : selectedAdvertiser.services
                              : [];
                            if (
                              !Array.isArray(srvList) ||
                              srvList.length === 0
                            ) {
                              return (
                                <p
                                  style={{
                                    color: "var(--text-muted)",
                                    fontSize: "0.88rem",
                                  }}
                                >
                                  Nenhum serviço cadastrado por este parceiro.
                                </p>
                              );
                            }
                            return srvList.map((srv: any, idx: number) => (
                              <div
                                key={srv.id || idx}
                                style={{
                                  background: "var(--bg-primary)",
                                  padding: "1rem",
                                  borderRadius: "10px",
                                  border: "1px solid var(--border-color)",
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "0.35rem",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                  }}
                                >
                                  <strong
                                    style={{
                                      color: "var(--text-primary)",
                                      fontSize: "0.95rem",
                                    }}
                                  >
                                    {srv.name}
                                  </strong>
                                  <span
                                    style={{
                                      fontSize: "0.85rem",
                                      fontWeight: 800,
                                      color: "var(--accent-primary)",
                                      background: "rgba(37, 211, 102, 0.08)",
                                      padding: "2px 8px",
                                      borderRadius: "6px",
                                    }}
                                  >
                                    R${" "}
                                    {typeof srv.price === "number"
                                      ? srv.price.toFixed(2)
                                      : parseFloat(srv.price || 0).toFixed(2)}
                                  </span>
                                </div>
                                {srv.description && (
                                  <p
                                    style={{
                                      color: "var(--text-secondary)",
                                      fontSize: "0.8rem",
                                      lineHeight: "1.4",
                                      margin: 0,
                                    }}
                                  >
                                    {srv.description}
                                  </p>
                                )}
                              </div>
                            ));
                          } catch (err) {
                            return (
                              <p
                                style={{
                                  color: "var(--text-muted)",
                                  fontSize: "0.88rem",
                                }}
                              >
                                Erro ao processar a lista de serviços.
                              </p>
                            );
                          }
                        })()}
                      </div>
                    </div>
                  )}

                  {/* TAB 5: Sponsorship & Highlights */}
                  {!modalLoading && advertiserTab === "sponsorship" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                      {/* Section 1: Destaques para você */}
                      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-color)", padding: "1.25rem", borderRadius: "12px" }}>
                        <h4 style={{ margin: "0 0 0.5rem 0", color: "var(--text-primary)", fontSize: "1rem", fontWeight: 750 }}>
                          Destaques Para Você (Home)
                        </h4>
                        <p style={{ margin: "0 0 1rem 0", fontSize: "0.82rem", color: "var(--text-muted)" }}>
                          Controla se este prestador aparece na seção recomendada da Home no aplicativo móvel.
                        </p>
                        
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          {selectedAdvertiser.destaque ? (
                            <>
                              <span className="badge badge-active" style={{ backgroundColor: "rgba(132, 204, 22, 0.15)", color: "#84cc16", borderColor: "rgba(132, 204, 22, 0.2)" }}>ATIVO</span>
                              <button 
                                onClick={() => handleToggleDestaqueStatus(false)} 
                                className="btn btn-logout" 
                                style={{ width: "auto", margin: 0, padding: "0.4rem 1rem", fontSize: "0.82rem" }}
                              >
                                Remover dos Destaques
                              </button>
                            </>
                          ) : (
                            <>
                              <span className="badge badge-inactive">INATIVO</span>
                              <button 
                                onClick={() => handleToggleDestaqueStatus(true)} 
                                className="btn btn-primary" 
                                style={{ width: "auto", margin: 0, padding: "0.4rem 1rem", fontSize: "0.82rem", display: "flex", alignItems: "center", gap: "6px" }}
                              >
                                Adicionar aos Destaques
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Section 2: Destaques em Evidência (Banner Rotativo) */}
                      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-color)", padding: "1.25rem", borderRadius: "12px" }}>
                        <h4 style={{ margin: "0 0 0.5rem 0", color: "var(--text-primary)", fontSize: "1rem", fontWeight: 750 }}>
                          Destaques em Evidência (Banner Patrocinado na Home)
                        </h4>
                        <p style={{ margin: "0 0 1rem 0", fontSize: "0.82rem", color: "var(--text-muted)" }}>
                          Cria um banner de patrocínio em tela cheia na home do site e do aplicativo.
                        </p>

                        {isAdLoading ? (
                          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Buscando informações do banner...</p>
                        ) : existingAd ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            {/* Preview Banner */}
                            <div style={{ position: "relative", width: "100%", height: "130px", borderRadius: "8px", overflow: "hidden", border: "1px solid var(--border-color)" }}>
                              <img src={adImageUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="Banner Preview" />
                              <div style={{ position: "absolute", top: "8px", right: "8px", zIndex: 10 }}>
                                <span className="text-[8px] font-black tracking-widest bg-yellow-500 text-black px-2 py-0.5 rounded uppercase">Patrocinado</span>
                              </div>
                              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(transparent, rgba(0,0,0,0.8))", zIndex: 5 }}></div>
                              <div style={{ position: "absolute", bottom: "8px", left: "8px", zIndex: 10 }}>
                                <span style={{ fontSize: "8px", color: "var(--accent-primary)", textTransform: "uppercase", fontWeight: "bold" }}>{adTitle}</span>
                                <h4 style={{ margin: 0, color: "white", fontSize: "12px", fontWeight: "bold" }}>{selectedAdvertiser.name}</h4>
                                <p style={{ margin: 0, color: "#d1d5db", fontSize: "9px" }}>{adDescription}</p>
                              </div>
                            </div>

                            <form onSubmit={handleSaveFeaturedAd} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                              <div className="form-group">
                                <label className="form-label">Título da Categoria / Serviço</label>
                                <input type="text" className="form-input" style={{ paddingLeft: "0.75rem" }} value={adTitle} onChange={(e) => setAdTitle(e.target.value)} required />
                              </div>
                              <div className="form-group">
                                <label className="form-label">Descrição Curta do Anúncio</label>
                                <input type="text" className="form-input" style={{ paddingLeft: "0.75rem" }} value={adDescription} onChange={(e) => setAdDescription(e.target.value)} />
                              </div>
                              <div className="form-group">
                                <label className="form-label">URL da Imagem do Banner</label>
                                <input type="text" className="form-input" style={{ paddingLeft: "0.75rem" }} value={adImageUrl} onChange={(e) => setAdImageUrl(e.target.value)} required />
                              </div>
                              
                              <div className="form-group" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <input type="checkbox" id="adIsFeatured" checked={adIsFeatured} onChange={(e) => setAdIsFeatured(e.target.checked)} style={{ width: "16px", height: "16px" }} />
                                <label htmlFor="adIsFeatured" className="form-label" style={{ margin: 0, cursor: "pointer", fontSize: "0.85rem" }}>Banner Ativo</label>
                              </div>

                              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                                <button type="button" onClick={handleDeleteFeaturedAd} className="btn btn-logout" style={{ width: "auto", margin: 0 }}>
                                  Remover Banner
                                </button>
                                <button type="submit" className="btn btn-primary" style={{ width: "auto", margin: 0 }}>
                                  Atualizar Banner
                                </button>
                              </div>
                            </form>
                          </div>
                        ) : (
                          <div>
                            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem" }}>Este prestador não tem um anúncio patrocinado em evidência na home.</p>
                            <form onSubmit={handleSaveFeaturedAd} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                              <div className="form-group">
                                <label className="form-label">Título da Categoria / Serviço</label>
                                <input type="text" className="form-input" style={{ paddingLeft: "0.75rem" }} value={adTitle} onChange={(e) => setAdTitle(e.target.value)} required />
                              </div>
                              <div className="form-group">
                                <label className="form-label">Descrição Curta do Anúncio</label>
                                <input type="text" className="form-input" style={{ paddingLeft: "0.75rem" }} value={adDescription} onChange={(e) => setAdDescription(e.target.value)} />
                              </div>
                              <div className="form-group">
                                <label className="form-label">URL da Imagem do Banner</label>
                                <input type="text" className="form-input" style={{ paddingLeft: "0.75rem" }} value={adImageUrl} onChange={(e) => setAdImageUrl(e.target.value)} required />
                              </div>

                              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                                <button type="submit" className="btn btn-primary" style={{ width: "auto", margin: 0 }}>
                                  Criar Banner Patrocinado
                                </button>
                              </div>
                            </form>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Administrative Actions */}
                {!isEditing && (
                  <div
                    className="action-card"
                    style={{ backgroundColor: "rgba(37, 211, 102, 0.02)" }}
                  >
                    <div className="action-card-header">
                      <ShieldAlert
                        size={16}
                        style={{ color: "var(--accent-primary)" }}
                      />
                      <span>Modificar Status do Anúncio</span>
                    </div>

                    <div className="btn-group-row">
                      {/* Aprovar Cadastro Button */}
                      {(selectedAdvertiser.status || "ativo") ===
                        "pendente" && (
                        <button
                          className="btn-action btn-action-reactivate"
                          onClick={() =>
                            handleAdvertiserStatusAction("aprovar")
                          }
                          disabled={modalLoading}
                        >
                          <UserCheck size={14} /> Aprovar Cadastro
                        </button>
                      )}

                      {/* Ativar Button */}
                      {(!selectedAdvertiser.is_active ||
                        (selectedAdvertiser.status || "ativo") !== "ativo") &&
                        (selectedAdvertiser.status || "ativo") !==
                          "pendente" && (
                          <button
                            className="btn-action btn-action-reactivate"
                            onClick={() =>
                              handleAdvertiserStatusAction("ativar")
                            }
                            disabled={modalLoading}
                          >
                            <UserCheck size={14} /> Ativar Anúncio / Publicar
                          </button>
                        )}

                      {/* Desativar Button */}
                      {selectedAdvertiser.is_active &&
                        (selectedAdvertiser.status || "ativo") === "ativo" && (
                          <button
                            className="btn-action btn-action-suspend"
                            onClick={() =>
                              handleAdvertiserStatusAction("desativar")
                            }
                            disabled={modalLoading}
                          >
                            <ShieldOff size={14} /> Desativar Anúncio
                          </button>
                        )}

                      {/* Suspender Button */}
                      {(selectedAdvertiser.status || "ativo") !==
                        "suspenso" && (
                        <button
                          className="btn-action btn-action-block"
                          onClick={() =>
                            handleAdvertiserStatusAction("suspender")
                          }
                          disabled={modalLoading}
                        >
                          <ShieldAlert size={14} /> Suspender Perfil
                        </button>
                      )}

                      {/* Bloquear Negócio Button */}
                      {(selectedAdvertiser.status || "ativo") !==
                        "bloqueado" && (
                        <button
                          className="btn-action btn-action-block"
                          onClick={() =>
                            handleAdvertiserStatusAction("bloquear")
                          }
                          disabled={modalLoading}
                          style={{
                            backgroundColor: "rgba(239, 68, 68, 0.15)",
                            color: "#ef4444",
                            borderColor: "rgba(239, 68, 68, 0.2)",
                          }}
                        >
                          <Lock size={14} /> Bloquear Negócio
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-logout"
                style={{ width: "auto" }}
                onClick={() => setSelectedAdvertiser(null)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REPORT (DENÚNCIA) DETAILS MODAL */}
      {selectedReport && (
        <div className="modal-overlay" onClick={() => setSelectedReport(null)}>
          <div
            className="modal-content"
            style={{ maxWidth: "850px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <ShieldAlert
                  size={20}
                  style={{ color: "var(--accent-orange)" }}
                />
                <span>Detalhes da Denúncia #{selectedReport.id}</span>
              </h2>
              <button
                className="btn-refresh"
                style={{ width: "32px", height: "32px", border: "none" }}
                onClick={() => setSelectedReport(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div
              className="modal-body"
              style={{ gridTemplateColumns: "1.2fr 1.8fr" }}
            >
              {/* Left Column: Report Summary & Audit logs */}
              <div className="modal-sidebar-info">
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                  }}
                >
                  <div>
                    <span className="modal-info-label">Motivo da Denúncia</span>
                    <span
                      className="badge badge-inactive"
                      style={{
                        fontSize: "0.9rem",
                        marginTop: "0.25rem",
                        display: "inline-block",
                        backgroundColor: "rgba(239, 68, 68, 0.1)",
                        color: "#ef4444",
                        borderColor: "rgba(239, 68, 68, 0.15)",
                      }}
                    >
                      {mapReasonLabel(selectedReport.reason)}
                    </span>
                  </div>

                  <div>
                    <span className="modal-info-label">
                      Status do Relatório
                    </span>
                    <span
                      className={`badge ${(selectedReport.status || "pendente") === "resolvido" ? "badge-active" : "badge-inactive"}`}
                      style={{
                        backgroundColor:
                          (selectedReport.status || "pendente") === "pendente"
                            ? "rgba(239, 68, 68, 0.15)"
                            : undefined,
                        color:
                          (selectedReport.status || "pendente") === "pendente"
                            ? "#ef4444"
                            : undefined,
                        borderColor:
                          (selectedReport.status || "pendente") === "pendente"
                            ? "rgba(239, 68, 68, 0.2)"
                            : undefined,
                      }}
                    >
                      {(selectedReport.status || "pendente").toUpperCase()}
                    </span>
                  </div>

                  <div>
                    <span className="modal-info-label">Data de Abertura</span>
                    <div
                      className="modal-info-value"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <Calendar size={12} />
                      {formatDate(selectedReport.created_at)}
                    </div>
                  </div>

                  {selectedReport.details && (
                    <div>
                      <span className="modal-info-label">
                        Comentários / Detalhes
                      </span>
                      <div
                        className="modal-info-value"
                        style={{
                          backgroundColor: "var(--bg-primary)",
                          padding: "0.5rem 0.75rem",
                          borderRadius: "6px",
                          border: "1px solid var(--border-color)",
                          fontSize: "0.82rem",
                          lineHeight: "1.4",
                          color: "var(--text-secondary)",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {selectedReport.details}
                      </div>
                    </div>
                  )}

                  {/* Actions log on this specific report */}
                  <div
                    style={{
                      marginTop: "1rem",
                      borderTop: "1px solid var(--border-color)",
                      paddingTop: "1rem",
                    }}
                  >
                    <span
                      className="modal-info-label"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        marginBottom: "0.5rem",
                      }}
                    >
                      <History
                        size={12}
                        style={{ color: "var(--accent-blue)" }}
                      />
                      Histórico da Ação
                    </span>
                    {reportActionsList.filter(
                      (a) => a.report_id === selectedReport.id,
                    ).length === 0 ? (
                      <p
                        style={{
                          color: "var(--text-muted)",
                          fontSize: "0.75rem",
                          fontStyle: "italic",
                        }}
                      >
                        Nenhuma ação registrada para esta denúncia.
                      </p>
                    ) : (
                      reportActionsList
                        .filter((a) => a.report_id === selectedReport.id)
                        .map((action) => (
                          <div
                            key={action.id}
                            style={{
                              background: "rgba(59, 130, 246, 0.05)",
                              padding: "0.5rem",
                              borderRadius: "6px",
                              border: "1px solid rgba(59, 130, 246, 0.1)",
                              fontSize: "0.75rem",
                              display: "flex",
                              flexDirection: "column",
                              gap: "0.25rem",
                              marginBottom: "0.4rem",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                fontWeight: 600,
                              }}
                            >
                              <span
                                style={{
                                  textTransform: "uppercase",
                                  color: "var(--accent-blue)",
                                }}
                              >
                                {action.action_type}
                              </span>
                              <span style={{ color: "var(--text-muted)" }}>
                                {formatDate(action.created_at).split(" ")[0]}
                              </span>
                            </div>
                            <p style={{ color: "var(--text-secondary)" }}>
                              {action.reason}
                            </p>
                            <span
                              style={{
                                color: "var(--text-muted)",
                                fontSize: "0.68rem",
                              }}
                            >
                              Responsável: {action.admin_email}
                            </span>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Profiles of Reporter & Target, Action Panel */}
              <div
                className="modal-tab-container"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                {/* 1. Autor (Reporter) Profile Summary */}
                <div
                  className="action-card"
                  style={{
                    backgroundColor: "rgba(59, 130, 246, 0.02)",
                    margin: 0,
                  }}
                >
                  <div
                    className="action-card-header"
                    style={{
                      borderBottom: "1px solid var(--border-color)",
                      paddingBottom: "0.5rem",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <User size={14} style={{ color: "var(--accent-blue)" }} />
                    <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>
                      Denunciante (Autor)
                    </span>
                  </div>
                  {(() => {
                    const reporter = usersList.find(
                      (u) => u.open_id === selectedReport.reporter_id,
                    );
                    if (!reporter)
                      return (
                        <p
                          style={{
                            fontSize: "0.8rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          Dados do autor indisponíveis
                        </p>
                      );
                    return (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "0.5rem",
                          fontSize: "0.8rem",
                        }}
                      >
                        <div>
                          <span style={{ color: "var(--text-secondary)" }}>
                            Nome:
                          </span>
                          <strong
                            style={{
                              color: "var(--text-primary)",
                              display: "block",
                            }}
                          >
                            {reporter.name || "-"}
                          </strong>
                        </div>
                        <div>
                          <span style={{ color: "var(--text-secondary)" }}>
                            Email:
                          </span>
                          <strong
                            style={{
                              color: "var(--text-primary)",
                              display: "block",
                            }}
                          >
                            {reporter.email || "-"}
                          </strong>
                        </div>
                        <div>
                          <span style={{ color: "var(--text-secondary)" }}>
                            Telefone:
                          </span>
                          <strong
                            style={{
                              color: "var(--text-primary)",
                              display: "block",
                            }}
                          >
                            {getUserPhone(reporter)}
                          </strong>
                        </div>
                        <div>
                          <span style={{ color: "var(--text-secondary)" }}>
                            Data Cadastro:
                          </span>
                          <strong
                            style={{
                              color: "var(--text-primary)",
                              display: "block",
                            }}
                          >
                            {formatDate(reporter.created_at).split(" ")[0]}
                          </strong>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* 2. Alvo (Reported) Profile Summary */}
                <div
                  className="action-card"
                  style={{
                    backgroundColor: "rgba(239, 68, 68, 0.02)",
                    margin: 0,
                  }}
                >
                  <div
                    className="action-card-header"
                    style={{
                      borderBottom: "1px solid var(--border-color)",
                      paddingBottom: "0.5rem",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <ShieldAlert
                      size={14}
                      style={{ color: "var(--accent-orange)" }}
                    />
                    <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>
                      Alvo Denunciado (
                      {selectedReport.reported_type.toUpperCase()})
                    </span>
                  </div>
                  {(() => {
                    const type = selectedReport.reported_type;
                    const reportedId = selectedReport.reported_id;
                    if (type === "cliente") {
                      const client = usersList.find(
                        (u) => u.open_id === reportedId,
                      );
                      if (!client)
                        return (
                          <p
                            style={{
                              fontSize: "0.8rem",
                              color: "var(--text-muted)",
                            }}
                          >
                            Cliente não encontrado ou excluído
                          </p>
                        );
                      return (
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "0.5rem",
                            fontSize: "0.8rem",
                          }}
                        >
                          <div>
                            <span style={{ color: "var(--text-secondary)" }}>
                              Nome:
                            </span>
                            <strong
                              style={{
                                color: "var(--text-primary)",
                                display: "block",
                              }}
                            >
                              {client.name || "-"}
                            </strong>
                          </div>
                          <div>
                            <span style={{ color: "var(--text-secondary)" }}>
                              Email:
                            </span>
                            <strong
                              style={{
                                color: "var(--text-primary)",
                                display: "block",
                              }}
                            >
                              {client.email || "-"}
                            </strong>
                          </div>
                          <div>
                            <span style={{ color: "var(--text-secondary)" }}>
                              Status Conta:
                            </span>
                            <strong
                              style={{
                                color: "var(--text-primary)",
                                display: "block",
                              }}
                            >
                              <span
                                className={`badge ${(client.status || "ativo") === "ativo" ? "badge-active" : "badge-inactive"}`}
                              >
                                {(client.status || "ativo").toUpperCase()}
                              </span>
                            </strong>
                          </div>
                          <div>
                            <span style={{ color: "var(--text-secondary)" }}>
                              Telefone:
                            </span>
                            <strong
                              style={{
                                color: "var(--text-primary)",
                                display: "block",
                              }}
                            >
                              {getUserPhone(client)}
                            </strong>
                          </div>
                        </div>
                      );
                    } else {
                      const provider = providersList.find(
                        (p) => p.id === reportedId || p.user_id === reportedId,
                      );
                      if (!provider)
                        return (
                          <p
                            style={{
                              fontSize: "0.8rem",
                              color: "var(--text-muted)",
                            }}
                          >
                            Profissional/Estabelecimento não encontrado ou
                            excluído
                          </p>
                        );
                      return (
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "0.5rem",
                            fontSize: "0.8rem",
                          }}
                        >
                          <div>
                            <span style={{ color: "var(--text-secondary)" }}>
                              Nome Negócio:
                            </span>
                            <strong
                              style={{
                                color: "var(--text-primary)",
                                display: "block",
                              }}
                            >
                              {provider.name}
                            </strong>
                          </div>
                          <div>
                            <span style={{ color: "var(--text-secondary)" }}>
                              Categoria:
                            </span>
                            <strong
                              style={{
                                color: "var(--text-primary)",
                                display: "block",
                              }}
                            >
                              {provider.category || "-"}
                            </strong>
                          </div>
                          <div>
                            <span style={{ color: "var(--text-secondary)" }}>
                              Cidade / Bairro:
                            </span>
                            <strong
                              style={{
                                color: "var(--text-primary)",
                                display: "block",
                              }}
                            >
                              {provider.city || "-"} /{" "}
                              {provider.neighborhood || "-"}
                            </strong>
                          </div>
                          <div>
                            <span style={{ color: "var(--text-secondary)" }}>
                              Status Anúncio:
                            </span>
                            <strong
                              style={{
                                color: "var(--text-primary)",
                                display: "block",
                              }}
                            >
                              <span
                                className={`badge ${provider.is_active && (provider.status || "ativo") === "ativo" ? "badge-active" : "badge-inactive"}`}
                              >
                                {provider.status === "suspenso"
                                  ? "SUSPENSO"
                                  : provider.is_active
                                    ? "ATIVO"
                                    : "INATIVO"}
                              </span>
                            </strong>
                          </div>
                        </div>
                      );
                    }
                  })()}
                </div>

                {/* 3. Administrative Resolution Form */}
                {selectedReport.status === "pendente" ? (
                  <div
                    className="action-card"
                    style={{
                      backgroundColor: "rgba(37, 211, 102, 0.02)",
                      margin: 0,
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.75rem",
                    }}
                  >
                    <div className="action-card-header">
                      <UserCheck
                        size={14}
                        style={{ color: "var(--accent-primary)" }}
                      />
                      <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>
                        Painel de Resolução Administrativa
                      </span>
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label
                        className="form-label"
                        style={{ fontSize: "0.75rem" }}
                      >
                        Justificativa / Parecer do Administrador (Obrigatório)
                      </label>
                      <textarea
                        className="reason-textarea"
                        placeholder="Informe as conclusões da análise e os motivos da ação administrativa..."
                        value={reportActionReason}
                        onChange={(e) => setReportActionReason(e.target.value)}
                        style={{
                          height: "65px",
                          fontSize: "0.8rem",
                          padding: "0.4rem",
                        }}
                      />
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "0.5rem",
                      }}
                    >
                      <button
                        className="btn-action btn-action-reactivate"
                        style={{
                          flex: 1,
                          minWidth: "120px",
                          fontSize: "0.75rem",
                        }}
                        onClick={() => handleResolveReport("resolvido")}
                        disabled={modalLoading}
                      >
                        <UserCheck size={12} /> Marcar Resolvido (Sem Punição)
                      </button>
                      <button
                        className="btn-action btn-action-suspend"
                        style={{
                          flex: 1,
                          minWidth: "120px",
                          fontSize: "0.75rem",
                        }}
                        onClick={() => handleResolveReport("suspender")}
                        disabled={modalLoading}
                      >
                        <ShieldOff size={12} /> Suspender Usuário
                      </button>
                      <button
                        className="btn-action btn-action-block"
                        style={{
                          flex: 1,
                          minWidth: "120px",
                          fontSize: "0.75rem",
                        }}
                        onClick={() => handleResolveReport("bloquear")}
                        disabled={modalLoading}
                      >
                        <ShieldAlert size={12} /> Bloquear Usuário
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="action-card"
                    style={{
                      backgroundColor: "rgba(37, 211, 102, 0.05)",
                      margin: 0,
                      textAlign: "center",
                      padding: "1rem",
                    }}
                  >
                    <span
                      style={{
                        color: "var(--accent-primary)",
                        fontWeight: 600,
                        fontSize: "0.9rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "4px",
                      }}
                    >
                      <UserCheck size={16} /> Esta denúncia foi resolvida
                    </span>
                    <p
                      style={{
                        color: "var(--text-secondary)",
                        fontSize: "0.8rem",
                        marginTop: "0.25rem",
                      }}
                    >
                      Consulte o Histórico de Ações ao lado para ver a
                      justificativa e o responsável.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-logout"
                style={{ width: "auto" }}
                onClick={() => setSelectedReport(null)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
