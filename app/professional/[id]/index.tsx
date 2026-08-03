import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Linking,
  Alert,
  Share,
  Platform,
  ActivityIndicator,
  Modal,
  TextInput,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useEffect, useMemo } from "react";
import { LinearGradient } from "expo-linear-gradient";

import { LeaveReviewModal } from "@/components/leave-review-modal";
import { useFavorites } from "@/lib/favorites-context";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/lib/auth-context";
import { addReview } from "@/data/mock";
import { useLocation } from "@/lib/location-context";
import { SOCIAL_NETWORKS, SOCIAL_PNG_ASSETS } from "@/constants/app";
import { supabase } from "@/lib/supabase";
import { getMockProviderById } from "@/app/(tabs)/home-mock-data";
import {
  calculateHaversineDistance,
  formatDistancePtBr,
  estimateDrivingTimeMinutes,
  formatDrivingTimePtBr,
  formatDistanceWithPreposition,
} from "@/lib/location-utils";
import {
  parseWorkingHours,
  calculateRealTimeStatus,
  formatDaySchedule,
  DAYS_CONFIG,
} from "@/lib/working-hours";

const DEFAULT_COVER =
  "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&q=80";

function getWhatsAppUrl(phone: any, name: any) {
  const cleaned = String(phone || "").replace(/\D/g, "");
  const number = cleaned.startsWith("55") ? cleaned : `55${cleaned}`;
  const message = encodeURIComponent(
    `Olá ${String(name || "")}, encontrei seu perfil no XamaJá e gostaria de solicitar um orçamento.`,
  );
  return `https://wa.me/${number}?text=${message}`;
}

const parseJsonArray = (val: any): string[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try {
    const parsed = JSON.parse(val);
    if (Array.isArray(parsed)) return parsed;
  } catch { }
  if (typeof val === "string") {
    return val
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
};

const getAvatarUrl = (name: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=25D366&color=fff&size=150`;

// Subcategorias que possuem cardápio (restaurante/alimentação real)
const FOOD_SUBCATEGORY_IDS = new Set([
  "pizzaria", "restaurante", "hamburgueria", "lanchonete", "sushi",
  "churrascaria", "cafeteria", "padaria", "sorveteria", "bar",
  "buffet", "cantina", "food-truck", "doceria", "marmitaria",
]);

// Subcategorias que são lojas/catálogos (sem cardápio de alimentos)
const CATALOG_SUBCATEGORY_IDS = new Set([
  "loja-roupas", "loja-eletronicos", "loja-moveis", "loja-celular",
  "farmacia", "mercado", "mercadinho", "supermercado", "pet-shop",
  "tabacaria", "bazar", "material-construcao", "papelaria",
  "livraria", "joalheria", "relojoaria", "otica", "sex-shop",
  "loja-sporting", "oficina", "auto-pecas",
]);

type EstablishmentType = "food" | "catalog" | "service" | "academy" | "clinic" | "beauty" | "generic";

function getEstablishmentType(
  categoryId?: string | null,
  subcategoryId?: string | null,
): EstablishmentType {
  const cat = (categoryId || "").toLowerCase();
  const sub = (subcategoryId || "").toLowerCase();

  // Academia / Fitness
  if (cat === "academias" || cat === "fitness" || sub === "academia" || sub === "crossfit" || sub === "musculacao") {
    return "academy";
  }
  // Saúde / Clínica
  if (cat === "saude" || sub === "dentista" || sub === "clinica" || sub === "medico" || sub === "fisioterapeuta" || sub === "psicologo") {
    return "clinic";
  }
  // Beleza
  if (cat === "beleza-estetica") {
    return "beauty";
  }
  // Comércios: verificar se é food ou catalog pelo subcategoryId
  if (cat === "comercios") {
    if (FOOD_SUBCATEGORY_IDS.has(sub)) return "food";
    if (CATALOG_SUBCATEGORY_IDS.has(sub)) return "catalog";
    // Fallback: se tiver hasCatalog mas não for food subcategory, é catalog
    return "catalog";
  }
  // Serviços gerais (reformas, automotivo, domésticos, profissionais, etc.)
  if (
    cat === "reformas-reparos" ||
    cat === "servicos-domesticos" ||
    cat === "servicos-externos" ||
    cat === "automotivo" ||
    cat === "assistencia-tecnica" ||
    cat === "servicos-profissionais" ||
    cat === "logistica" ||
    cat === "educacao" ||
    cat === "eventos" ||
    cat === "mobilidade"
  ) {
    return "service";
  }
  return "generic";
}

type EstablishmentConfig = {
  moduleTitle: string;
  moduleIcon: string;
  emptyMessage: string;
  emptySub: string;
  ctaLabel: string;
  ctaIcon: string;
  aboutTitle: string;
  productIcon: string;
};

function getEstablishmentConfig(type: EstablishmentType, hasWhatsApp: boolean): EstablishmentConfig {
  switch (type) {
    case "food":
      return {
        moduleTitle: "Destaques do Cardápio",
        moduleIcon: "restaurant-menu",
        emptyMessage: "Cardápio ainda não cadastrado",
        emptySub: "Este estabelecimento ainda não adicionou seu cardápio. Entre em contato para saber o que está disponível.",
        ctaLabel: "Ver Cardápio / Fazer Pedido",
        ctaIcon: "restaurant",
        aboutTitle: "Sobre o Restaurante",
        productIcon: "restaurant",
      };
    case "catalog":
      return {
        moduleTitle: "Catálogo de Produtos",
        moduleIcon: "inventory-2",
        emptyMessage: "Catálogo em atualização",
        emptySub: "Os produtos ainda não foram cadastrados. Em breve o catálogo completo estará disponível.",
        ctaLabel: "Ver Catálogo",
        ctaIcon: "store",
        aboutTitle: "Sobre a Loja",
        productIcon: "inventory-2",
      };
    case "beauty":
      return {
        moduleTitle: "Serviços e Tratamentos",
        moduleIcon: "auto-awesome",
        emptyMessage: "Serviços ainda não cadastrados",
        emptySub: "Os serviços e preços serão adicionados em breve. Entre em contato para mais informações.",
        ctaLabel: "Chamar no WhatsApp",
        ctaIcon: "chat",
        aboutTitle: "Sobre o Salão / Estúdio",
        productIcon: "content-cut",
      };
    case "service":
      return {
        moduleTitle: "Serviços Oferecidos",
        moduleIcon: "handyman",
        emptyMessage: "Serviços ainda não cadastrados",
        emptySub: "Os serviços e especialidades serão adicionados em breve. Entre em contato para um orçamento.",
        ctaLabel: "Solicitar Orçamento",
        ctaIcon: "chat",
        aboutTitle: "Sobre o Prestador",
        productIcon: "handyman",
      };
    case "academy":
      return {
        moduleTitle: "Planos e Modalidades",
        moduleIcon: "fitness-center",
        emptyMessage: "Planos ainda não cadastrados",
        emptySub: "Os planos e modalidades serão adicionados em breve. Entre em contato para mais informações.",
        ctaLabel: "Chamar no WhatsApp",
        ctaIcon: "chat",
        aboutTitle: "Sobre a Academia",
        productIcon: "fitness-center",
      };
    case "clinic":
      return {
        moduleTitle: "Especialidades",
        moduleIcon: "medical-services",
        emptyMessage: "Especialidades ainda não cadastradas",
        emptySub: "As especialidades e procedimentos serão adicionados em breve.",
        ctaLabel: "Agendar Consulta",
        ctaIcon: "event",
        aboutTitle: "Sobre a Clínica",
        productIcon: "medical-services",
      };
    default:
      return {
        moduleTitle: "Serviços e Informações",
        moduleIcon: "info",
        emptyMessage: "Conteúdo em breve",
        emptySub: "Este estabelecimento ainda está configurando seu perfil. Em breve haverá mais informações.",
        ctaLabel: hasWhatsApp ? "Chamar no WhatsApp" : "Ver Perfil",
        ctaIcon: "chat",
        aboutTitle: "Sobre o Estabelecimento",
        productIcon: "store",
      };
  }
}



export default function ProfessionalDetailScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  console.log(`[PROFILE: ${id}] Component mounted or updated`);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"sobre" | "servicos" | "avaliacoes">("sobre");
  const { isFavorite, toggleFavorite } = useFavorites();
  const trackView = trpc.analytics.trackServiceView.useMutation();
  const trackWhatsapp = trpc.analytics.trackWhatsappClick.useMutation();
  const { coords, addressName, permissionGranted } = useLocation();
  const isDefaultCity = addressName === "Bragança Paulista - SP";
  const showDistance = coords !== null;
  const { width: windowWidth } = useWindowDimensions();
  const isWide = Platform.OS === 'web' && windowWidth >= 900;

  const { user, isAdmin } = useAuth();

  // -- Transfer Ownership State --
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferSearch, setTransferSearch] = useState("");
  const [transferResults, setTransferResults] = useState<any[]>([]);
  const [transferTarget, setTransferTarget] = useState<any | null>(null);
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferEmail, setTransferEmail] = useState("");

  const transferOwnershipMutation = trpc.providers.transferOwnership.useMutation();

  const searchUsersMutation = trpc.providers.searchUsersForTransfer.useQuery(
    { query: transferSearch.trim() },
    { enabled: false }
  );

  const handleSearchTransferUser = async () => {
    if (!transferSearch.trim()) return;
    setTransferLoading(true);
    setTransferResults([]);
    try {
      const res = await searchUsersMutation.refetch();
      setTransferResults(res.data || []);
    } catch (err: any) {
      console.error("Erro na busca de usuários:", err);
      Alert.alert("Erro", `Erro ao buscar usuários: ${err.message || err}`);
    } finally {
      setTransferLoading(false);
    }
  };

  const handleTransferOwnership = async () => {
    if (!professional) return;
    if (!transferTarget && !transferEmail.trim()) {
      Alert.alert("Atenção", "Selecione um usuário ou informe um e-mail.");
      return;
    }

    try {
      setTransferLoading(true);
      await transferOwnershipMutation.mutateAsync({
        providerId: professional.id,
        newUserId: transferTarget ? transferTarget.open_id : null,
        emailInvite: !transferTarget && transferEmail.trim() ? transferEmail.trim() : undefined,
      });
      Alert.alert(
        "Sucesso",
        transferTarget
          ? "Propriedade transferida com sucesso!"
          : "Convite de propriedade enviado com sucesso!"
      );
      setShowTransferModal(false);
      refetch();
    } catch (err: any) {
      Alert.alert("Erro", err.message || "Erro ao transferir propriedade.");
    } finally {
      setTransferLoading(false);
    }
  };
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const submitReview = trpc.providers.submitReview.useMutation();

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState<
    | "perfil_falso"
    | "golpe"
    | "informacoes_incorretas"
    | "comportamento_inadequado"
    | "outro"
  >("perfil_falso");
  const [reportDetails, setReportDetails] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const isIdValid = !!id && id !== "[id]" && id !== "undefined";
  const isMock = typeof id === "string" && id.startsWith("mock-");

  const {
    data: dbProfessional,
    isLoading: loadingQuery,
    isFetching,
    refetch,
  } = trpc.providers.getById.useQuery(id as string, {
    enabled: isIdValid && !isMock,
  });

  const professional = useMemo(() => {
    if (isMock && typeof id === "string") {
      return getMockProviderById(id);
    }
    return dbProfessional;
  }, [isMock, id, dbProfessional]);

  const loading = !isIdValid || (!isMock && (loadingQuery || (!professional && isFetching)));

  console.log(`[PROFILE: ${id}] State Update:`, {
    isIdValid,
    isMock,
    loadingQuery,
    isFetching,
    hasData: !!professional,
    loading
  });

  const isCommerce = useMemo(() => {
    if (!professional) return false;
    return (
      professional.hasCatalog ||
      professional.categoryId === "comercios" ||
      professional.category === "Comércios" ||
      professional.category === "comercios"
    );
  }, [professional]);

  const isRealCommerce = useMemo(() => {
    if (!professional) return false;
    return (
      professional.categoryId === "comercios" ||
      professional.category === "Comércios" ||
      professional.category === "comercios"
    );
  }, [professional]);

  const galleryImages = useMemo(() => parseJsonArray(professional?.gallery), [professional?.gallery]);
  const currentImageIndex = selectedImage
    ? galleryImages.indexOf(selectedImage)
    : -1;

  const handlePrevImage = () => {
    if (currentImageIndex > 0) {
      setSelectedImage(galleryImages[currentImageIndex - 1]);
    }
  };

  const handleNextImage = () => {
    if (currentImageIndex < galleryImages.length - 1) {
      setSelectedImage(galleryImages[currentImageIndex + 1]);
    }
  };

  const { data: reviews = [], refetch: refetchReviews } =
    trpc.providers.getReviews.useQuery(id as string, {
      enabled: !!id,
    });

  const distanceInfo = useMemo(() => {
    if (
      showDistance &&
      coords &&
      professional &&
      professional.latitude !== null &&
      professional.latitude !== undefined &&
      professional.longitude !== null &&
      professional.longitude !== undefined
    ) {
      const lat = Number(professional.latitude);
      const lon = Number(professional.longitude);
      if (!isNaN(lat) && !isNaN(lon)) {
        const distKm = calculateHaversineDistance(
          coords.latitude,
          coords.longitude,
          lat,
          lon,
        );
        const timeMin = estimateDrivingTimeMinutes(distKm);
        return {
          distanceText: formatDistancePtBr(distKm),
          distancePrepText: formatDistanceWithPreposition(distKm),
          drivingTimeText: formatDrivingTimePtBr(timeMin),
        };
      }
    }
    return null;
  }, [coords, professional, showDistance]);

  const favored = professional ? isFavorite(professional.id) : false;

  useEffect(() => {
    if (professional) {
      trackView.mutate({
        categoryId: professional.categoryId || undefined,
        serviceId: professional.id,
        userId: user?.id || undefined,
      });
    }
  }, [professional?.id, user?.id]);

  const handleOpenWhatsApp = () => {
    if (!professional) return;
    trackWhatsapp.mutate({
      providerId: professional.id,
      serviceName: professional.name,
      city: professional.city || undefined,
      userId: user?.id || undefined,
    });

    const phone = professional.phone || professional.whatsapp || "";
    const url = getWhatsAppUrl(phone, professional.name);
    Linking.openURL(url).catch(() =>
      Alert.alert("Erro", "Não foi possível abrir o WhatsApp."),
    );
  };

  const handleOpenReportModal = () => {
    if (!user) {
      Alert.alert(
        "Acesso Necessário",
        "Você precisa estar conectado em uma conta para enviar uma denúncia.",
      );
      router.push("/auth/login" as any);
      return;
    }
    setReportReason("perfil_falso");
    setReportDetails("");
    setShowReportModal(true);
  };

  const handleSubmitReport = async () => {
    if (!professional || !user) return;
    setIsSubmittingReport(true);

    try {
      const isCommerce =
        professional.categoryId === "comercios" ||
        professional.category === "Comércios" ||
        professional.category === "comercios";
      const reportedType = isCommerce ? "comércio" : "prestador";

      const { error } = await supabase.from("denuncias").insert({
        reporter_id: user.id,
        reported_id: professional.id,
        reported_type: reportedType,
        reason: reportReason,
        details: reportDetails.trim() || null,
        status: "pendente",
      });

      if (error) throw error;

      Alert.alert(
        "Denúncia Enviada",
        "Agradecemos o seu envio. A equipe administrativa analisará a denúncia em breve.",
      );
      setShowReportModal(false);
    } catch (err: any) {
      console.error("Erro ao enviar denúncia:", err);
      Alert.alert(
        "Erro",
        "Não foi possível enviar a denúncia. Tente novamente mais tarde.",
      );
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const parsedHours = useMemo(() => {
    return parseWorkingHours(professional?.workingHours);
  }, [professional?.workingHours]);

  const realTimeStatus = useMemo(() => {
    return calculateRealTimeStatus(parsedHours);
  }, [parsedHours]);

  const socialLinks = useMemo(() => {
    if (!professional?.socialLinks) return {};
    if (typeof professional.socialLinks === "object") return professional.socialLinks;
    try {
      return JSON.parse(professional.socialLinks);
    } catch {
      return {};
    }
  }, [professional?.socialLinks]);

  if (loading) {
    console.log(`[PROFILE: ${id}] Rendering Skeleton (loading)`);
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Floating Header Skeleton */}
        <View style={[styles.floatingHeader, { paddingTop: insets.top + 8 }]}>
          <View style={[styles.floatingBackBtn, { backgroundColor: colors.border }]} />
          <View style={{ flex: 1 }} />
          <View style={[styles.floatingBackBtn, { backgroundColor: colors.border, marginRight: 8 }]} />
          <View style={[styles.floatingBackBtn, { backgroundColor: colors.border }]} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 160 }}>
          {/* Capa Skeleton */}
          <View style={[styles.coverContainer, { backgroundColor: colors.border + "60" }]} />

          {/* Profile Card Overlay Skeleton */}
          <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.avatarContainer}>
              <View style={[styles.avatar, { backgroundColor: colors.border + "80", borderColor: colors.surface }]} />
            </View>

            <View style={styles.detailsContainer}>
              <View style={{ width: 180, height: 22, backgroundColor: colors.border, borderRadius: 6, marginBottom: 8, alignSelf: "center" }} />
              <View style={{ width: 130, height: 16, backgroundColor: colors.border + "80", borderRadius: 4, marginBottom: 12, alignSelf: "center" }} />
              <View style={{ width: 220, height: 14, backgroundColor: colors.border + "50", borderRadius: 4, alignSelf: "center" }} />
            </View>
          </View>

          {/* Metrics Grid Skeleton */}
          <View style={[styles.metricGrid, { backgroundColor: colors.surface, borderColor: colors.border, height: 70 }]}>
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              <View style={{ width: 40, height: 16, backgroundColor: colors.border, borderRadius: 4 }} />
            </View>
            <View style={styles.metricDivider} />
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              <View style={{ width: 50, height: 16, backgroundColor: colors.border, borderRadius: 4 }} />
            </View>
            <View style={styles.metricDivider} />
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              <View style={{ width: 60, height: 16, backgroundColor: colors.border, borderRadius: 4 }} />
            </View>
          </View>

          {/* Body Section Skeleton */}
          <View style={[styles.section, { marginTop: 24 }]}>
            <View style={{ width: 140, height: 18, backgroundColor: colors.border, borderRadius: 4, marginBottom: 12 }} />
            <View style={{ width: "100%", height: 14, backgroundColor: colors.border + "60", borderRadius: 4, marginBottom: 6 }} />
            <View style={{ width: "90%", height: 14, backgroundColor: colors.border + "60", borderRadius: 4, marginBottom: 6 }} />
            <View style={{ width: "60%", height: 14, backgroundColor: colors.border + "60", borderRadius: 4 }} />
          </View>
        </ScrollView>
      </View>
    );
  }

  if (!professional) {
    console.log(`[PROFILE: ${id}] Rendering NotFound (!professional)`);
    return (
      <View
        style={[
          styles.container,
          { paddingTop: insets.top, backgroundColor: colors.background },
        ]}
      >
        <View
          style={[
            styles.notFoundHeader,
            {
              borderBottomColor: colors.border,
              backgroundColor: colors.surface,
            },
          ]}
        >
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <MaterialIcons
              name="arrow-back"
              size={24}
              color={colors.foreground}
            />
          </Pressable>
        </View>
        <View style={styles.notFound}>
          <MaterialIcons name="person-off" size={64} color={colors.muted} />
          <Text style={[styles.notFoundText, { color: colors.foreground }]}>
            Profissional não encontrado
          </Text>
          <Text
            style={{
              color: colors.muted,
              textAlign: "center",
              marginTop: 8,
              paddingHorizontal: 40,
            }}
          >
            Este perfil pode ter sido removido ou o link está incorreto.
          </Text>
          <Pressable
            style={{
              marginTop: 24,
              backgroundColor: colors.primary,
              paddingHorizontal: 32,
              paddingVertical: 14,
              borderRadius: 16,
            }}
            onPress={() => router.replace("/(tabs)")}
          >
            <Text style={{ color: "#FFF", fontWeight: "700" }}>
              Voltar para o Início
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // Type-narrowed alias to prevent TS closure warnings
  const prof = professional;
  console.log(`[PROFILE: ${id}] Main render starting, prof.id=`, prof?.id);

  // Dynamic establishment type + config
  const estType = getEstablishmentType(prof.categoryId, prof.subcategoryId);
  const hasWhatsApp = !!(prof.phone || prof.whatsapp);
  const estConfig = getEstablishmentConfig(estType, hasWhatsApp);

  // Does this establishment have any product/service content loaded?
  const rawProducts: any[] = (() => {
    if (!prof.services) return [];
    try {
      const parsed = typeof prof.services === "string" ? JSON.parse(prof.services) : prof.services;
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  })();
  const hasProducts = rawProducts.length > 0;

  // Should the content module button go to the menu/catalog screen?
  const contentGoesToMenu = estType === "food" || estType === "catalog" || estType === "beauty" || estType === "academy" || estType === "clinic";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ═══ FLOATING HEADER (over cover) ═══ */}
      <View style={[styles.floatingHeader, { paddingTop: insets.top + 8 }]}>
        <Pressable
          style={({ pressed }) => [styles.floatingBackBtn, pressed && { opacity: 0.7 }]}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={20} color="#FFF" />
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable
          style={({ pressed }) => [styles.floatingBackBtn, pressed && { opacity: 0.7 }]}
          onPress={() =>
            toggleFavorite({
              id: prof.id,
              name: prof.name,
              category: prof.category || "",
              city: prof.city || "",
              avatar:
                prof.avatarThumbnailUri ||
                prof.avatarUri ||
                getAvatarUrl(prof.name),
              rating: Number(prof.rating) || 0,
              phone: prof.phone || "",
              type:
                typeof prof.plan === "string"
                  ? (prof.plan.toLowerCase() as "free" | "premium")
                  : "free",
              latitude: prof.latitude ? Number(prof.latitude) : null,
              longitude: prof.longitude ? Number(prof.longitude) : null,
            })
          }
        >
          <MaterialIcons
            name={favored ? "favorite" : "favorite-border"}
            size={19}
            color={favored ? "#EF4444" : "#FFF"}
          />
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.floatingBackBtn, pressed && { opacity: 0.7 }]}
          onPress={handleOpenReportModal}
        >
          <MaterialIcons name="report" size={19} color="#FFF" />
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.floatingBackBtn, pressed && { opacity: 0.7 }]}
          onPress={() =>
            Share.share({ message: `Confira ${prof.name} no app XamaJá!` })
          }
        >
          <MaterialIcons name="share" size={19} color="#FFF" />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
      >
        {/* ═══ COVER ═══ */}
        <Pressable
          onPress={() => prof.coverUri && setSelectedImage(prof.coverUri)}
          disabled={!prof.coverUri}
          style={({ pressed }) => [
            styles.coverContainer,
            isWide && styles.coverContainerWide,
            pressed && prof.coverUri && { opacity: 0.95 },
          ]}
        >
          {prof.coverUri ? (
            <Image
              source={{ uri: prof.coverUri }}
              style={styles.coverImage}
              contentFit="cover"
            />
          ) : (
            <LinearGradient
              colors={["#18181b", "#09090b"]}
              style={styles.coverImage}
            />
          )}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.55)"]}
            style={styles.coverGradientBottom}
          />
        </Pressable>

        {/* ═══ PROFILE CARD (sobreposto à capa) ═══ */}
        <View
          style={[
            styles.profileCard,
            isWide && styles.profileCardWide,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.avatarContainer}>
            <Pressable
              onPress={() =>
                setSelectedImage(prof.avatarUri || getAvatarUrl(prof.name))
              }
            >
              <Image
                source={{ uri: prof.avatarUri || getAvatarUrl(prof.name) }}
                style={[
                  styles.avatar,
                  { borderColor: colors.surface, backgroundColor: colors.border + "60" },
                ]}
              />
            </Pressable>
            {prof.isVerified && (
              <View style={styles.heroVerifiedBadge}>
                <MaterialIcons name="verified" size={22} color="#25D366" />
              </View>
            )}
          </View>

          <View style={styles.detailsContainer}>
            <Text
              style={[styles.heroName, { color: colors.foreground, textAlign: "center" }]}
              numberOfLines={2}
            >
              {prof.name}
            </Text>
            {prof.isVerified && (
              <View style={styles.heroVerifiedPill}>
                <MaterialIcons name="check-circle" size={11} color="#25D366" />
                <Text style={styles.heroVerifiedPillText}>VERIFICADO</Text>
              </View>
            )}
            <Text style={[styles.profileCategory, { color: colors.primary }]}>
              {prof.subcategoryName || prof.category}
            </Text>

            <View style={styles.profileLocationRows}>
              {!!prof.neighborhood && (
                <View style={styles.locationRow}>
                  <MaterialIcons name="location-on" size={15} color="#EF4444" />
                  <Text style={[styles.locationRowText, { color: colors.foreground }]}>
                    Bairro:{" "}
                    <Text style={styles.locationRowValue}>{prof.neighborhood}</Text>
                  </Text>
                </View>
              )}
              <View style={styles.locationRow}>
                <MaterialIcons name="location-on" size={15} color="#EF4444" />
                <Text style={[styles.locationRowText, { color: colors.foreground }]}>
                  Cidade:{" "}
                  <Text style={styles.locationRowValue}>
                    {prof.city || "Bragança Paulista"}
                  </Text>
                </Text>
              </View>
              {distanceInfo && (
                <View style={styles.locationRow}>
                  <MaterialIcons name="directions-car" size={15} color="#F59E0B" />
                  <Text style={styles.distanceRowText}>
                    Distância até você: {distanceInfo.distanceText}
                  </Text>
                </View>
              )}
            </View>

            {/* Info Pills */}
            {(prof.onlineStatus || prof.topBadge || prof.responseTime) && (
              <View style={[styles.heroPillsRow, { justifyContent: "center", marginTop: 6 }]}>
                {prof.onlineStatus && (
                  <View
                    style={[
                      styles.heroPill,
                      { backgroundColor: "rgba(16,185,129,0.12)" },
                    ]}
                  >
                    <View
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: "#4ADE80",
                      }}
                    />
                    <Text style={[styles.heroPillText, { color: "#4ADE80" }]}>
                      Online agora
                    </Text>
                  </View>
                )}
                {prof.topBadge && (
                  <View
                    style={[
                      styles.heroPill,
                      { backgroundColor: "rgba(217,119,6,0.12)" },
                    ]}
                  >
                    <MaterialIcons name="emoji-events" size={13} color="#FBBF24" />
                    <Text style={[styles.heroPillText, { color: "#FBBF24" }]}>
                      {prof.topBadge}
                    </Text>
                  </View>
                )}
                {prof.responseTime && (
                  <View style={styles.heroPill}>
                    <MaterialIcons name="chat" size={13} color="#A78BFA" />
                    <Text style={styles.heroPillText}>Responde em {prof.responseTime}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Commerce Tags */}
            {isCommerce && parseJsonArray(prof.tags).length > 0 && (
              <View style={[styles.heroPillsRow, { justifyContent: "center", marginTop: 6 }]}>
                {parseJsonArray(prof.tags).map((tag: string, idx: number) => (
                  <View key={idx} style={styles.heroPill}>
                    <MaterialIcons
                      name={
                        tag.toLowerCase().includes("delivery")
                          ? "motorcycle"
                          : tag.toLowerCase().includes("retirada")
                            ? "store"
                            : "check"
                      }
                      size={13}
                      color="#25D366"
                    />
                    <Text style={styles.heroPillText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Admin Transfer */}
            {isAdmin && (
              <Pressable
                onPress={() => setShowTransferModal(true)}
                style={[
                  styles.adminTransferBtn,
                  { alignSelf: "stretch", justifyContent: "center", marginTop: 16 },
                ]}
              >
                <MaterialIcons name="swap-horiz" size={18} color="#FFF" />
                <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 13 }}>
                  Transferir Propriedade
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* ═══ METRIC GRID ═══ */}
        <View
          style={[
            styles.metricGrid,
            isWide && styles.metricGridWide,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.metricItem}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <MaterialIcons name="star" size={15} color="#F59E0B" />
              <Text style={[styles.metricValue, { color: colors.foreground }]}>
                {Number(prof.rating || 0).toFixed(1)}
              </Text>
            </View>
            <Text style={[styles.metricLabel, { color: colors.muted }]}>
              {prof.ratingCount || 0} avaliações
            </Text>
          </View>
          <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />
          <View style={styles.metricItem}>
            <MaterialIcons name="event" size={15} color="#A78BFA" />
            <Text style={[styles.metricValue, { color: colors.foreground }]}>
              {prof.foundedYear ? `Desde ${prof.foundedYear}` : "—"}
            </Text>
            <Text style={[styles.metricLabel, { color: colors.muted }]}>Ano início</Text>
          </View>
          <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />
          <View style={styles.metricItem}>
            <MaterialIcons name="speed" size={15} color="#A78BFA" />
            <Text style={[styles.metricValue, { color: colors.foreground }]}>
              {prof.responseTime ? "Rápido" : "—"}
            </Text>
            <Text style={[styles.metricLabel, { color: colors.muted }]}>Tempo resp.</Text>
          </View>
        </View>

        {/* ═══ TAB NAVIGATION ═══ */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabStripContent}
          style={[styles.tabStrip, { borderBottomColor: colors.border }]}
        >
          <Pressable
            style={[
              styles.tab,
              activeTab === "sobre" && styles.tabActive,
              activeTab === "sobre" && { borderBottomColor: colors.primary },
            ]}
            onPress={() => setActiveTab("sobre")}
          >
            <MaterialIcons name="info-outline" size={15} color={activeTab === "sobre" ? colors.primary : colors.muted} />
            <Text style={[styles.tabText, { color: activeTab === "sobre" ? colors.primary : colors.muted }]}>
              Sobre & Serviços
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.tab,
              activeTab === "servicos" && styles.tabActive,
              activeTab === "servicos" && { borderBottomColor: colors.primary },
            ]}
            onPress={() => {
              if (contentGoesToMenu && hasProducts) {
                router.push(`/professional/${prof.id}/menu` as any);
              } else {
                setActiveTab("servicos");
              }
            }}
          >
            <MaterialIcons name="sell" size={15} color={activeTab === "servicos" ? colors.primary : colors.muted} />
            <Text style={[styles.tabText, { color: activeTab === "servicos" ? colors.primary : colors.muted }]}>
              Serviços e Preços
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.tab,
              activeTab === "avaliacoes" && styles.tabActive,
              activeTab === "avaliacoes" && { borderBottomColor: colors.primary },
            ]}
            onPress={() => setActiveTab("avaliacoes")}
          >
            <MaterialIcons name="star-outline" size={15} color={activeTab === "avaliacoes" ? colors.primary : colors.muted} />
            <Text style={[styles.tabText, { color: activeTab === "avaliacoes" ? colors.primary : colors.muted }]}>
              Avaliações ({reviews.length})
            </Text>
          </Pressable>
          <Pressable
            style={styles.tab}
            onPress={() => {
              const gl = parseJsonArray(prof.gallery);
              if (gl.length > 0) setSelectedImage(gl[0]);
            }}
          >
            <MaterialIcons name="photo-library" size={15} color={colors.muted} />
            <Text style={[styles.tabText, { color: colors.muted }]}>Fotos</Text>
          </Pressable>
        </ScrollView>

        {/* ═══ CONTENT AREA ═══ */}
        <View
          style={[styles.contentArea, isWide && styles.contentAreaWide]}
        >
          {/* ── Main Column ── */}
          <View style={[styles.mainCol, isWide && styles.mainColWide]}>
            {activeTab === "sobre" && (
              <>
            {/* Gallery Card */}
            {(() => {
              const gl = parseJsonArray(prof.gallery);
              if (gl.length === 0) return null;
              const maxVis = 5;
              const visible = gl.slice(0, maxVis);
              const remaining = Math.max(0, gl.length - maxVis);
              return (
                <View
                  style={[
                    styles.card,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.cardTitleRow}>
                      <MaterialIcons
                        name="photo-camera"
                        size={18}
                        color={colors.primary}
                      />
                      <Text
                        style={[styles.cardTitle, { color: colors.foreground }]}
                      >
                        Fotos do Trabalho
                      </Text>
                    </View>
                    <Pressable
                      style={styles.cardLinkBtn}
                      onPress={() => setSelectedImage(gl[0])}
                    >
                      <Text
                        style={[
                          styles.cardLinkText,
                          { color: colors.primary },
                        ]}
                      >
                        Ver todas as fotos
                      </Text>
                      <MaterialIcons
                        name="arrow-forward"
                        size={14}
                        color={colors.primary}
                      />
                    </Pressable>
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 10, paddingTop: 14 }}
                  >
                    {visible.map((uri: string, idx: number) => {
                      const isLast =
                        idx === visible.length - 1 && remaining > 0;
                      return (
                        <Pressable
                          key={idx}
                          onPress={() => setSelectedImage(uri)}
                          style={({ pressed }) => [
                            styles.galleryThumb,
                            { borderColor: colors.border },
                            pressed && {
                              opacity: 0.85,
                              transform: [{ scale: 0.97 }],
                            },
                          ]}
                        >
                          <Image
                            source={{ uri }}
                            style={styles.galleryThumbImg}
                          />
                          {isLast && (
                            <View style={styles.galleryOverlay}>
                              <Text style={styles.galleryOverlayCount}>
                                +{remaining}
                              </Text>
                              <Text style={styles.galleryOverlaySub}>
                                Ver todas
                              </Text>
                            </View>
                          )}
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>
              );
            })()}

            {/* About Card */}
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.cardTitleRow}>
                <MaterialIcons
                  name="person"
                  size={18}
                  color={colors.primary}
                />
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                  {estConfig.aboutTitle}
                </Text>
              </View>
              <Text style={[styles.cardDesc, { color: colors.muted }]}>
                {prof.description || "Nenhuma descrição adicionada ainda."}
              </Text>

              {parseJsonArray(prof.popularServices).length > 0 && (
                <View style={{ marginTop: 18 }}>
                  <Text
                    style={[
                      styles.cardSubTitle,
                      { color: colors.foreground },
                    ]}
                  >
                    Especialidades
                  </Text>
                  <View style={styles.chipsRow}>
                    {parseJsonArray(prof.popularServices).map(
                      (s: string, i: number) => (
                        <View
                          key={i}
                          style={[
                            styles.chipPill,
                            {
                              backgroundColor: colors.primary + "12",
                              borderColor: colors.primary + "30",
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.chipPillText,
                              { color: colors.foreground },
                            ]}
                          >
                            {s}
                          </Text>
                        </View>
                      ),
                    )}
                  </View>
                </View>
              )}

              {!isCommerce && parseJsonArray(prof.tags).length > 0 && (
                <View style={{ marginTop: 12 }}>
                  <View style={styles.chipsRow}>
                    {parseJsonArray(prof.tags).map(
                      (tag: string, i: number) => (
                        <View
                          key={i}
                          style={[
                            styles.chipPill,
                            {
                              backgroundColor: colors.border + "60",
                              borderColor: colors.border,
                            },
                          ]}
                        >
                          <MaterialIcons
                            name="check"
                            size={11}
                            color={colors.muted}
                          />
                          <Text
                            style={[
                              styles.chipPillText,
                              { color: colors.muted },
                            ]}
                          >
                            {tag}
                          </Text>
                        </View>
                      ),
                    )}
                  </View>
                </View>
              )}

              <View style={{ marginTop: 18 }}>
                <Text
                  style={[styles.cardSubTitle, { color: colors.foreground }]}
                >
                  Atende
                </Text>
                <View style={styles.attendRow}>
                  <View style={styles.attendItem}>
                    <MaterialIcons name="home" size={15} color={colors.muted} />
                    <Text
                      style={[styles.attendText, { color: colors.muted }]}
                    >
                      Em domicílio
                    </Text>
                  </View>
                  <View style={styles.attendItem}>
                    <MaterialIcons
                      name="store"
                      size={15}
                      color={colors.muted}
                    />
                    <Text
                      style={[styles.attendText, { color: colors.muted }]}
                    >
                      No estabelecimento
                    </Text>
                  </View>
                  <View style={styles.attendItem}>
                    <MaterialIcons
                      name="language"
                      size={15}
                      color={colors.muted}
                    />
                    <Text
                      style={[styles.attendText, { color: colors.muted }]}
                    >
                      Atendimento online
                    </Text>
                  </View>
                </View>
              </View>
            </View>

              </>
            )}

            {activeTab === "servicos" && (
              <>
            {/* Dynamic Content Module */}
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardTitleRow}>
                  <MaterialIcons
                    name={estConfig.moduleIcon as any}
                    size={18}
                    color={colors.primary}
                  />
                  <Text
                    style={[styles.cardTitle, { color: colors.foreground }]}
                  >
                    {estConfig.moduleTitle}
                  </Text>
                </View>
                {hasProducts && contentGoesToMenu && (
                  <Pressable
                    onPress={() =>
                      router.push(
                        `/professional/${prof.id}/menu` as any,
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.cardLinkText,
                        { color: colors.primary },
                      ]}
                    >
                      Ver todos
                    </Text>
                  </Pressable>
                )}
              </View>
              {hasProducts ? (
                <View style={{ gap: 10, marginTop: 14 }}>
                  {rawProducts.slice(0, 3).map((prod: any) => (
                    <Pressable
                      key={prod.id || prod.name}
                      style={[
                        styles.productRow,
                        {
                          backgroundColor: colors.background,
                          borderColor: colors.border,
                        },
                      ]}
                      onPress={() =>
                        router.push(
                          `/professional/${prof.id}/menu` as any,
                        )
                      }
                    >
                      {prod.imageUri ? (
                        <Image
                          source={{ uri: prod.imageUri }}
                          style={styles.productImg}
                        />
                      ) : (
                        <View
                          style={[
                            styles.productImg,
                            {
                              alignItems: "center",
                              justifyContent: "center",
                              backgroundColor: colors.border + "40",
                            },
                          ]}
                        >
                          <MaterialIcons
                            name={estConfig.productIcon as any}
                            size={20}
                            color={colors.muted}
                          />
                        </View>
                      )}
                      <View style={styles.productInfo}>
                        <Text
                          style={[
                            styles.productName,
                            { color: colors.foreground },
                          ]}
                          numberOfLines={1}
                        >
                          {prod.name}
                        </Text>
                        {!!prod.description && (
                          <Text
                            style={[
                              styles.productDescText,
                              { color: colors.muted },
                            ]}
                            numberOfLines={2}
                          >
                            {prod.description}
                          </Text>
                        )}
                        {(estType === "food" || estType === "catalog") &&
                          prod.price !== undefined &&
                          prod.price !== null && (
                            <Text
                              style={[
                                styles.productPrice,
                                { color: colors.primary },
                              ]}
                            >
                              R$ {Number(prod.price).toFixed(2)}
                            </Text>
                          )}
                      </View>
                    </Pressable>
                  ))}
                </View>
              ) : (
                <View
                  style={[
                    styles.emptyModule,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <MaterialIcons
                    name={estConfig.moduleIcon as any}
                    size={36}
                    color={colors.muted}
                  />
                  <Text
                    style={[
                      styles.emptyModuleTitle,
                      { color: colors.foreground },
                    ]}
                  >
                    {estConfig.emptyMessage}
                  </Text>
                  <Text
                    style={[
                      styles.emptyModuleSub,
                      { color: colors.muted },
                    ]}
                  >
                    {estConfig.emptySub}
                  </Text>
                </View>
              )}
            </View>

              </>
            )}

            {activeTab === "avaliacoes" && (
              <>
            {/* Reviews Card */}
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardTitleRow}>
                  <MaterialIcons name="star" size={18} color="#F59E0B" />
                  <Text
                    style={[styles.cardTitle, { color: colors.foreground }]}
                  >
                    Avaliações dos Clientes
                  </Text>
                  <View style={styles.ratingInlineBadge}>
                    <Text style={styles.ratingInlineValue}>
                      {Number(prof.rating || 0).toFixed(1)}
                    </Text>
                    <View style={{ flexDirection: "row", gap: 1 }}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <MaterialIcons
                          key={s}
                          name="star"
                          size={10}
                          color={
                            s <= Math.round(Number(prof.rating || 0))
                              ? "#F59E0B"
                              : "#4B5563"
                          }
                        />
                      ))}
                    </View>
                    <Text style={styles.ratingInlineCount}>
                      ({prof.ratingCount || 0} avaliações)
                    </Text>
                  </View>
                </View>
                <Pressable
                  style={styles.cardLinkBtn}
                  onPress={() => setShowReviewModal(true)}
                >
                  <Text
                    style={[
                      styles.cardLinkText,
                      { color: colors.primary },
                    ]}
                  >
                    Escrever avaliação
                  </Text>
                  <MaterialIcons
                    name="arrow-forward"
                    size={14}
                    color={colors.primary}
                  />
                </Pressable>
              </View>

              {reviews && reviews.length > 0 ? (
                <View style={{ gap: 12, marginTop: 14 }}>
                  {reviews.slice(0, 5).map((rev: any) => (
                    <View
                      key={rev.id}
                      style={[
                        styles.reviewCard,
                        {
                          backgroundColor: colors.background,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <View style={styles.reviewHeader}>
                        <View
                          style={[
                            styles.reviewAvatarCircle,
                            { backgroundColor: colors.primary },
                          ]}
                        >
                          <Text style={styles.reviewAvatarLetter}>
                            {(rev.userName || "U").charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={{ flex: 1, gap: 2 }}>
                          <Text
                            style={[
                              styles.reviewUserName,
                              { color: colors.foreground },
                            ]}
                          >
                            {rev.userName}
                          </Text>
                          <Text
                            style={{ fontSize: 11, color: colors.muted }}
                          >
                            {rev.createdAt}
                          </Text>
                        </View>
                        <View style={styles.reviewStarsRow}>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <MaterialIcons
                              key={s}
                              name="star"
                              size={13}
                              color={
                                s <= Number(rev.rating)
                                  ? "#F59E0B"
                                  : "#4B5563"
                              }
                            />
                          ))}
                        </View>
                      </View>
                      {!!rev.comment && (
                        <Text
                          style={[
                            styles.reviewComment,
                            { color: colors.muted },
                          ]}
                        >
                          {rev.comment}
                        </Text>
                      )}
                    </View>
                  ))}
                  {reviews.length > 5 && (
                    <Pressable
                      style={styles.viewAllBtn}
                      onPress={() =>
                        router.push(`/reviews/${id}` as any)
                      }
                    >
                      <Text
                        style={[
                          styles.viewAllBtnText,
                          { color: colors.primary },
                        ]}
                      >
                        Ver todas as {reviews.length} avaliações
                      </Text>
                      <MaterialIcons
                        name="arrow-forward"
                        size={16}
                        color={colors.primary}
                      />
                    </Pressable>
                  )}
                </View>
              ) : (
                <View style={styles.emptyReviews}>
                  <MaterialIcons
                    name="rate-review"
                    size={32}
                    color={colors.muted}
                  />
                  <Text
                    style={[
                      styles.emptyReviewsText,
                      { color: colors.muted },
                    ]}
                  >
                    Nenhuma avaliação ainda. Seja o primeiro a avaliar!
                  </Text>
                </View>
              )}
            </View>
              </>
            )}
          </View>

          {/* ── Sidebar Column ── */}
          <View style={[styles.sideCol, isWide && styles.sideColWide]}>
            {/* Hours Card */}
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardTitleRow}>
                  <MaterialIcons
                    name="access-time"
                    size={18}
                    color={colors.primary}
                  />
                  <Text
                    style={[styles.cardTitle, { color: colors.foreground }]}
                  >
                    Horário de Funcionamento
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor: realTimeStatus.isOpen
                        ? "rgba(16,185,129,0.15)"
                        : "rgba(239,68,68,0.15)",
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor: realTimeStatus.isOpen
                          ? "#10B981"
                          : "#EF4444",
                      },
                    ]}
                  />
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "800",
                      color: realTimeStatus.isOpen ? "#10B981" : "#EF4444",
                    }}
                  >
                    {realTimeStatus.badge}
                  </Text>
                </View>
              </View>
              <View style={{ gap: 6, marginTop: 14 }}>
                {DAYS_CONFIG.map(({ key, label }) => {
                  const daySched = parsedHours[key];
                  const formatted = formatDaySchedule(daySched);
                  const todayIndex = new Date().getDay();
                  const dayKeysOrder: typeof key[] = [
                    "sunday",
                    "monday",
                    "tuesday",
                    "wednesday",
                    "thursday",
                    "friday",
                    "saturday",
                  ];
                  const isToday = dayKeysOrder[todayIndex] === key;
                  return (
                    <View
                      key={key}
                      style={[
                        styles.hoursRow,
                        isToday && {
                          backgroundColor: colors.primary + "10",
                          borderRadius: 8,
                          paddingHorizontal: 10,
                        },
                      ]}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        {isToday && (
                          <View
                            style={[
                              styles.statusDot,
                              { backgroundColor: colors.primary },
                            ]}
                          />
                        )}
                        <Text
                          style={[
                            styles.hoursDayLabel,
                            {
                              color: isToday
                                ? colors.foreground
                                : colors.muted,
                              fontWeight: isToday ? "800" : "500",
                            },
                          ]}
                        >
                          {label}
                        </Text>
                      </View>
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: daySched.active ? "700" : "400",
                          color: daySched.active
                            ? colors.foreground
                            : colors.muted,
                        }}
                      >
                        {formatted}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Trust Card */}
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.cardTitleRow}>
                <MaterialIcons
                  name="verified-user"
                  size={18}
                  color={colors.primary}
                />
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                  Profissional de Confiança
                </Text>
              </View>
              <View style={styles.trustGrid}>
                {prof.isVerified && (
                  <View style={styles.trustItem}>
                    <View
                      style={[
                        styles.trustIconBg,
                        { backgroundColor: "rgba(37,211,102,0.1)" },
                      ]}
                    >
                      <MaterialIcons
                        name="check-circle"
                        size={24}
                        color="#25D366"
                      />
                    </View>
                    <Text
                      style={[
                        styles.trustLabel,
                        { color: colors.foreground },
                      ]}
                    >
                      Perfil{"\n"}verificado
                    </Text>
                  </View>
                )}
                {(prof.phone || prof.whatsapp) && (
                  <View style={styles.trustItem}>
                    <View
                      style={[
                        styles.trustIconBg,
                        { backgroundColor: "rgba(37,211,102,0.1)" },
                      ]}
                    >
                      <MaterialIcons name="chat" size={24} color="#25D366" />
                    </View>
                    <Text
                      style={[
                        styles.trustLabel,
                        { color: colors.foreground },
                      ]}
                    >
                      WhatsApp{"\n"}confirmado
                    </Text>
                  </View>
                )}
                {(prof.address || prof.latitude) && (
                  <View style={styles.trustItem}>
                    <View
                      style={[
                        styles.trustIconBg,
                        { backgroundColor: "rgba(37,211,102,0.1)" },
                      ]}
                    >
                      <MaterialIcons
                        name="location-on"
                        size={24}
                        color="#25D366"
                      />
                    </View>
                    <Text
                      style={[
                        styles.trustLabel,
                        { color: colors.foreground },
                      ]}
                    >
                      Endereço{"\n"}confirmado
                    </Text>
                  </View>
                )}
                {prof.foundedYear && (
                  <View style={styles.trustItem}>
                    <View
                      style={[
                        styles.trustIconBg,
                        { backgroundColor: "rgba(37,211,102,0.1)" },
                      ]}
                    >
                      <MaterialIcons
                        name="event"
                        size={24}
                        color="#25D366"
                      />
                    </View>
                    <Text
                      style={[
                        styles.trustLabel,
                        { color: colors.foreground },
                      ]}
                    >
                      Atua desde{"\n"}
                      {prof.foundedYear}
                    </Text>
                  </View>
                )}
              </View>

              {/* Social Media */}
              {(() => {
                const activeNetworks = [
                  { key: "instagram", label: "Instagram" },
                  { key: "facebook", label: "Facebook" },
                  { key: "youtube", label: "YouTube" },
                  { key: "tiktok", label: "TikTok" },
                ].filter(
                  (n) =>
                    socialLinks[n.key] &&
                    String(socialLinks[n.key]).trim() !== "" &&
                    SOCIAL_PNG_ASSETS[n.key],
                );
                if (activeNetworks.length === 0) return null;

                const handleOpenSocial = async (
                  networkKey: string,
                  rawUrl: string,
                ) => {
                  if (!rawUrl) return;
                  const trimmed = rawUrl.trim();
                  const fullUrl = trimmed.startsWith("http")
                    ? trimmed
                    : `https://${trimmed}`;
                  let nativeScheme = "";
                  if (networkKey === "instagram") {
                    const match = fullUrl.match(
                      /(?:instagram\.com\/)([^/?#]+)/,
                    );
                    if (match && match[1])
                      nativeScheme = `instagram://user?username=${match[1]}`;
                  } else if (networkKey === "facebook") {
                    const match = fullUrl.match(
                      /(?:facebook\.com\/)([^/?#]+)/,
                    );
                    if (match && match[1])
                      nativeScheme = `fb://page/${match[1]}`;
                  } else if (networkKey === "youtube") {
                    const match = fullUrl.match(
                      /(?:youtube\.com\/(?:@|channel\/|user\/)?)([^/?#]+)/,
                    );
                    if (match && match[1])
                      nativeScheme = `vnd.youtube://${match[1]}`;
                  }
                  if (nativeScheme) {
                    try {
                      const canOpen =
                        await Linking.canOpenURL(nativeScheme);
                      if (canOpen) {
                        await Linking.openURL(nativeScheme);
                        return;
                      }
                    } catch (_) {}
                  }
                  Linking.openURL(fullUrl).catch(() => {});
                };

                return (
                  <View style={styles.socialSection}>
                    <Text
                      style={[
                        styles.socialLabel,
                        { color: colors.foreground },
                      ]}
                    >
                      Redes Sociais
                    </Text>
                    <View style={styles.socialIconsRow}>
                      {activeNetworks.map((network) => (
                        <Pressable
                          key={network.key}
                          onPress={() =>
                            handleOpenSocial(
                              network.key,
                              String(socialLinks[network.key]).trim(),
                            )
                          }
                          style={({ pressed }) => [
                            styles.socialIconBtn,
                            pressed && {
                              opacity: 0.75,
                              transform: [{ scale: 0.93 }],
                            },
                          ]}
                        >
                          <Image
                            source={SOCIAL_PNG_ASSETS[network.key]}
                            style={{ width: 36, height: 36 }}
                            contentFit="contain"
                          />
                        </Pressable>
                      ))}
                    </View>
                  </View>
                );
              })()}
            </View>

            {/* WhatsApp CTA Card */}
            <View
              style={[
                styles.ctaCard,
                {
                  backgroundColor: colors.primary + "08",
                  borderColor: colors.primary + "30",
                },
              ]}
            >
              <MaterialIcons name="chat" size={28} color={colors.primary} />
              <Text style={[styles.ctaTitle, { color: colors.foreground }]}>
                Fale direto com o profissional!
              </Text>
              <Text style={[styles.ctaSub, { color: colors.muted }]}>
                Combine detalhes, solicite orçamentos ou faça pedidos de
                forma 100% gratuita via WhatsApp.
              </Text>
              <Pressable
                style={({ pressed }) => [
                  styles.ctaBtn,
                  { backgroundColor: colors.primary },
                  pressed && {
                    opacity: 0.9,
                    transform: [{ scale: 0.98 }],
                  },
                ]}
                onPress={handleOpenWhatsApp}
              >
                <MaterialIcons name="chat" size={20} color="#FFF" />
                <Text style={styles.ctaBtnText}>Chamar no WhatsApp</Text>
              </Pressable>
            </View>

            {/* Location Card */}
            <Pressable
              style={[
                styles.card,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
              onPress={async () => {
                const locationQuery =
                  prof.latitude && prof.longitude
                    ? `${prof.latitude},${prof.longitude}`
                    : (
                        prof.address ||
                        `${prof.neighborhood || ""}, ${prof.city || ""}`
                      ).trim();
                if (locationQuery) {
                  if (
                    prof.address &&
                    prof.address.startsWith("http")
                  ) {
                    Linking.openURL(prof.address);
                  } else {
                    const encodedQuery =
                      encodeURIComponent(locationQuery);
                    const url = Platform.select({
                      ios: `http://maps.apple.com/?q=${encodedQuery}`,
                      android: `geo:0,0?q=${encodedQuery}`,
                      web: `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`,
                    });
                    try {
                      if (url) await Linking.openURL(url);
                      else
                        Linking.openURL(
                          `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`,
                        );
                    } catch {
                      Linking.openURL(
                        `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`,
                      );
                    }
                  }
                }
              }}
            >
              <View style={styles.cardTitleRow}>
                <MaterialIcons
                  name="location-on"
                  size={18}
                  color={colors.primary}
                />
                <Text
                  style={[styles.cardTitle, { color: colors.foreground }]}
                >
                  Localização
                </Text>
              </View>
              <Text
                style={[
                  styles.locationAddr,
                  { color: colors.foreground },
                ]}
              >
                {prof.address ||
                  `${prof.neighborhood || ""}, ${prof.city || ""}`}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  marginTop: 6,
                }}
              >
                <MaterialIcons
                  name="open-in-new"
                  size={13}
                  color="#2563EB"
                />
                <Text
                  style={{
                    fontSize: 12,
                    color: "#2563EB",
                    fontWeight: "600",
                  }}
                >
                  Abrir no mapa
                </Text>
              </View>
              {distanceInfo && (
                <Text
                  style={{
                    fontSize: 13,
                    color: "#10B981",
                    fontWeight: "700",
                    marginTop: 8,
                  }}
                >
                  📍 {distanceInfo.distanceText} de você
                </Text>
              )}
            </Pressable>
          </View>
        </View>

        {/* Report Link */}
        <Pressable
          style={({ pressed }) => [
            styles.reportBtn,
            pressed && { opacity: 0.7 },
          ]}
          onPress={handleOpenReportModal}
        >
          <MaterialIcons name="outlined-flag" size={18} color="#EF4444" />
          <Text style={styles.reportBtnText}>
            Denunciar este prestador
          </Text>
        </Pressable>
      </ScrollView>

      {/* ═══ BOTTOM STICKY BAR ═══ */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}
      >
        <View style={styles.bottomBarTop}>
          <Image
            source={{ uri: prof.avatarUri || getAvatarUrl(prof.name) }}
            style={styles.bottomBarAvatar}
          />
          <View style={{ flex: 1, gap: 2, marginRight: 8 }}>
            <Text
              style={[
                styles.bottomBarName,
                { color: colors.foreground },
              ]}
              numberOfLines={1}
            >
              {prof.name}
            </Text>
            <Text
              style={{ fontSize: 11, color: colors.muted }}
              numberOfLines={1}
            >
              {prof.subcategoryName || prof.category}
            </Text>
          </View>
          <View style={styles.bottomBarStats}>
            <View style={styles.bottomBarStatItem}>
              <MaterialIcons name="star" size={13} color="#F59E0B" />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "700",
                  color: colors.foreground,
                }}
              >
                {Number(prof.rating || 0).toFixed(1)}
              </Text>
            </View>
            {distanceInfo && (
              <View style={styles.bottomBarStatItem}>
                <MaterialIcons
                  name="location-on"
                  size={12}
                  color="#9CA3AF"
                />
                <Text style={{ fontSize: 11, color: colors.muted }}>
                  {distanceInfo.distanceText}
                </Text>
              </View>
            )}
            <View style={styles.bottomBarStatItem}>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: realTimeStatus.isOpen
                      ? "#10B981"
                      : "#EF4444",
                  },
                ]}
              />
              <Text
                style={{
                  fontSize: 11,
                  color: realTimeStatus.isOpen ? "#10B981" : "#EF4444",
                  fontWeight: "600",
                }}
              >
                {realTimeStatus.badge}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.bottomBarBtns}>
          <Pressable
            style={({ pressed }) => [
              styles.bottomBtnOutline,
              { borderColor: colors.primary },
              pressed && { opacity: 0.85 },
            ]}
            onPress={() => {
              if (contentGoesToMenu && hasProducts)
                router.push(`/professional/${prof.id}/menu` as any);
              else setShowReviewModal(true);
            }}
          >
            <MaterialIcons
              name={
                contentGoesToMenu && hasProducts
                  ? "menu-book"
                  : "star-outline"
              }
              size={18}
              color={colors.primary}
            />
            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color: colors.primary,
              }}
            >
              {contentGoesToMenu && hasProducts ? "Ver Serviços" : "Avaliar"}
            </Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.bottomBtnPrimary,
              { backgroundColor: colors.primary },
              pressed && {
                opacity: 0.9,
                transform: [{ scale: 0.98 }],
              },
            ]}
            onPress={
              contentGoesToMenu
                ? () =>
                    router.push(
                      `/professional/${prof.id}/menu` as any,
                    )
                : handleOpenWhatsApp
            }
          >
            <MaterialIcons
              name={estConfig.ctaIcon as any}
              size={20}
              color="#FFF"
            />
            <Text style={styles.bottomBtnPrimaryText}>
              {estConfig.ctaLabel}
            </Text>
          </Pressable>
        </View>
      </View>


            {/* Image Viewer Modal */}
      <Modal
        visible={!!selectedImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <View style={styles.modalBackground}>
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setSelectedImage(null)}
          />
          <View style={styles.modalContent}>
            <Pressable
              style={styles.closeModalBtn}
              onPress={() => setSelectedImage(null)}
            >
              <MaterialIcons name="close" size={28} color="#FFF" />
            </Pressable>
            {selectedImage && (
              <Image
                source={{ uri: selectedImage }}
                style={styles.fullImage}
                contentFit="contain"
              />
            )}

            {/* Gallery Navigation Controls */}
            {galleryImages.length > 1 && (
              <>
                {currentImageIndex > 0 && (
                  <Pressable
                    style={styles.modalLeftBtn}
                    onPress={handlePrevImage}
                  >
                    <MaterialIcons name="chevron-left" size={36} color="#FFF" />
                  </Pressable>
                )}
                {currentImageIndex < galleryImages.length - 1 && (
                  <Pressable
                    style={styles.modalRightBtn}
                    onPress={handleNextImage}
                  >
                    <MaterialIcons
                      name="chevron-right"
                      size={36}
                      color="#FFF"
                    />
                  </Pressable>
                )}

                {/* Image counter indicator */}
                <View style={styles.imageCounter}>
                  <Text style={styles.imageCounterText}>
                    {currentImageIndex + 1} de {galleryImages.length}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Transfer Ownership Modal (Admins only) */}
      <Modal
        visible={showTransferModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTransferModal(false)}
      >
        <View style={styles.modalOverlayBackground}>
          <View style={[styles.reportModalContent, { backgroundColor: colors.surface, maxHeight: "80%" }]}>
            <View style={styles.reportModalHeader}>
              <Text style={[styles.reportModalTitle, { color: colors.foreground }]}>
                Transferir Propriedade
              </Text>
              <Pressable onPress={() => setShowTransferModal(false)} style={styles.closeReportBtn}>
                <MaterialIcons name="close" size={24} color={colors.foreground} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
              <Text style={[styles.reportModalSubtitle, { color: colors.muted }]}>
                Busque um usuário existente ou envie um convite por e-mail para transferir a propriedade de <Text style={{ fontWeight: "700" }}>{prof.name}</Text>.
              </Text>

              {/* Search User */}
              <View style={{ marginTop: 16 }}>
                <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>
                  Buscar usuário existente:
                </Text>
                <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                  <TextInput
                    style={{
                      flex: 1,
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      color: colors.foreground,
                    }}
                    placeholder="Nome, e-mail ou telefone"
                    placeholderTextColor={colors.muted}
                    value={transferSearch}
                    onChangeText={setTransferSearch}
                    onSubmitEditing={handleSearchTransferUser}
                  />
                  <Pressable
                    onPress={handleSearchTransferUser}
                    disabled={transferLoading || !transferSearch.trim()}
                    style={{
                      backgroundColor: colors.primary,
                      padding: 12,
                      borderRadius: 8,
                      opacity: transferLoading || !transferSearch.trim() ? 0.6 : 1,
                    }}
                  >
                    {transferLoading ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <MaterialIcons name="search" size={20} color="#FFF" />
                    )}
                  </Pressable>
                </View>
              </View>

              {/* Search Results */}
              {transferResults.length > 0 && (
                <View style={{ marginTop: 16 }}>
                  <Text style={{ fontSize: 12, fontWeight: "700", color: colors.muted, marginBottom: 8 }}>
                    RESULTADOS DA BUSCA:
                  </Text>
                  {transferResults.map((u) => {
                    const openId = u.openId || u.open_id;
                    const isSelected = (transferTarget?.openId || transferTarget?.open_id) === openId;
                    return (
                      <Pressable
                        key={openId}
                        onPress={() => {
                          setTransferTarget(isSelected ? null : { ...u, open_id: openId, openId });
                          if (!isSelected) setTransferEmail("");
                        }}
                        style={{
                          borderWidth: 1,
                          borderColor: isSelected ? colors.primary : colors.border,
                          backgroundColor: isSelected ? colors.primary + "15" : "transparent",
                          padding: 12,
                          borderRadius: 8,
                          marginBottom: 8,
                        }}
                      >
                        <Text style={{ fontWeight: "700", color: colors.foreground }}>{u.name || "Sem Nome"}</Text>
                        <Text style={{ fontSize: 13, color: colors.muted }}>{u.email}</Text>
                        {u.phone && <Text style={{ fontSize: 12, color: colors.muted }}>{u.phone}</Text>}
                      </Pressable>
                    );
                  })}
                </View>
              )}

              {/* Email Invite (if not selected user) */}
              <View style={{ marginTop: 24, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 16 }}>
                <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>
                  Ou convide um novo usuário:
                </Text>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    color: colors.foreground,
                    backgroundColor: transferTarget ? colors.surface : "transparent",
                    opacity: transferTarget ? 0.5 : 1,
                  }}
                  placeholder="E-mail do novo proprietário"
                  placeholderTextColor={colors.muted}
                  value={transferEmail}
                  onChangeText={setTransferEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!transferTarget}
                />
                <Text style={{ fontSize: 11, color: colors.muted, marginTop: 4 }}>
                  Um convite será gerado. Quando o usuário se cadastrar com este e-mail, a propriedade será vinculada.
                </Text>
              </View>
            </ScrollView>

            <View style={{ marginTop: 16, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 16 }}>
              <Pressable
                onPress={handleTransferOwnership}
                disabled={transferLoading || (!transferTarget && !transferEmail.trim())}
                style={{
                  backgroundColor: colors.primary,
                  paddingVertical: 14,
                  borderRadius: 12,
                  alignItems: "center",
                  opacity: transferLoading || (!transferTarget && !transferEmail.trim()) ? 0.6 : 1,
                }}
              >
                {transferLoading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={{ color: "#FFF", fontWeight: "700" }}>
                    Confirmar Transferência
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Leave Review Modal */}
      <LeaveReviewModal
        visible={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        isLoading={isSubmittingReview}
        onSubmit={async (rating, comment) => {
          try {
            setIsSubmittingReview(true);
            const userName = user?.name || "Você";
            const userAvatar =
              user?.avatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}`;

            await submitReview.mutateAsync({
              providerId: prof.id,
              rating,
              comment,
            });

            addReview({
              professionalId: prof.id,
              userName,
              userAvatar,
              rating,
              comment,
              createdAt: new Date().toISOString().split("T")[0],
            });

            await refetch();
            await refetchReviews();

            setShowReviewModal(false);
            Alert.alert("Sucesso", "Sua avaliação foi registrada!");
          } catch (error) {
            console.error("Failed to submit review:", error);
            Alert.alert(
              "Erro",
              "Não foi possível enviar a avaliação. Tente novamente.",
            );
          } finally {
            setIsSubmittingReview(false);
          }
        }}
        professionalName={prof.name}
      />

      {/* Leave Report Modal */}
      <Modal
        visible={showReportModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowReportModal(false)}
      >
        <View style={styles.modalOverlayBackground}>
          <View
            style={[
              styles.reportModalContent,
              { backgroundColor: colors.surface },
            ]}
          >
            <View style={styles.reportModalHeader}>
              <Text
                style={[styles.reportModalTitle, { color: colors.foreground }]}
              >
                Denunciar Perfil
              </Text>
              <Pressable
                onPress={() => setShowReportModal(false)}
                style={styles.closeReportBtn}
              >
                <MaterialIcons
                  name="close"
                  size={24}
                  color={colors.foreground}
                />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 24 }}
            >
              <Text
                style={[styles.reportModalSubtitle, { color: colors.muted }]}
              >
                Selecione o motivo mais adequado para a denúncia contra o perfil
                de <Text style={{ fontWeight: "700" }}>{prof.name}</Text>:
              </Text>

              {/* Reasons selector */}
              {(
                [
                  { key: "perfil_falso", label: "Perfil falso / Clone" },
                  { key: "golpe", label: "Golpe / Tentativa de Fraude" },
                  {
                    key: "informacoes_incorretas",
                    label: "Informações incorretas / Desatualizadas",
                  },
                  {
                    key: "comportamento_inadequado",
                    label: "Comportamento inadequado / Ofensivo",
                  },
                  { key: "outro", label: "Outro motivo" },
                ] as const
              ).map((item) => {
                const isSelected = reportReason === item.key;
                return (
                  <Pressable
                    key={item.key}
                    onPress={() => setReportReason(item.key)}
                    style={[
                      styles.reasonOption,
                      {
                        borderColor: isSelected
                          ? colors.primary
                          : colors.border,
                      },
                      isSelected && { backgroundColor: colors.primary + "09" },
                    ]}
                  >
                    <View
                      style={[
                        styles.radioButton,
                        {
                          borderColor: isSelected
                            ? colors.primary
                            : colors.muted,
                        },
                      ]}
                    >
                      {isSelected && (
                        <View
                          style={[
                            styles.radioButtonInner,
                            { backgroundColor: colors.primary },
                          ]}
                        />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.reasonLabelText,
                        {
                          color: colors.foreground,
                          fontWeight: isSelected ? "600" : "400",
                        },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}

              <Text
                style={[
                  styles.detailsLabelText,
                  { color: colors.foreground, marginTop: 16 },
                ]}
              >
                Mais detalhes (Opcional)
              </Text>
              <TextInput
                style={[
                  styles.detailsInput,
                  {
                    color: colors.foreground,
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                  },
                ]}
                placeholder="Explique detalhadamente o motivo da denúncia para nos ajudar a analisar o caso..."
                placeholderTextColor={colors.muted}
                multiline={true}
                numberOfLines={4}
                value={reportDetails}
                onChangeText={setReportDetails}
              />
            </ScrollView>

            <View
              style={[
                styles.reportModalFooter,
                { borderTopColor: colors.border },
              ]}
            >
              <Pressable
                style={[
                  styles.reportModalCancelBtn,
                  { borderColor: colors.border },
                ]}
                onPress={() => setShowReportModal(false)}
                disabled={isSubmittingReport}
              >
                <Text
                  style={[
                    styles.reportCancelBtnText,
                    { color: colors.foreground },
                  ]}
                >
                  Cancelar
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.reportModalSubmitBtn,
                  { backgroundColor: "#EF4444" },
                  isSubmittingReport && { opacity: 0.7 },
                ]}
                onPress={handleSubmitReport}
                disabled={isSubmittingReport}
              >
                {isSubmittingReport ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.reportSubmitBtnText}>
                    Enviar Denúncia
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  /* ── Skeleton / Loading (kept from original) ── */
  floatingHeader: {
    position: "absolute",
    top: 0, left: 0, right: 0, zIndex: 10,
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  floatingBackBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center", justifyContent: "center",
  },
  coverContainer: {
    width: "100%", height: 220, position: "relative",
    overflow: "hidden", backgroundColor: "#1F2937",
  },
  profileCard: {
    marginHorizontal: 16, marginTop: -35, padding: 16, borderRadius: 24,
    borderWidth: 1, alignItems: "center",
  },
  avatarContainer: { position: "relative", marginTop: -55 },
  avatar: {
    width: 84, height: 84, borderRadius: 42, borderWidth: 4,
    backgroundColor: "#E5E7EB",
  },
  detailsContainer: { alignItems: "center", marginTop: 10, gap: 4, width: "100%" },
  metricGrid: {
    flexDirection: "row", marginHorizontal: 16, marginTop: 16,
    paddingVertical: 14, borderRadius: 20, borderWidth: 1,
  },
  metricDivider: {
    width: 1, height: "80%", backgroundColor: "#E2E8F0", alignSelf: "center",
  },
  section: { paddingHorizontal: 20, paddingTop: 24 },

  /* ── Not Found ── */
  notFoundHeader: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
  },
  backBtn: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: "center", justifyContent: "center",
  },
  notFound: {
    flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: 100,
  },
  notFoundText: { fontSize: 20, fontWeight: "800", marginTop: 16 },

  /* ═══ COVER ═══ */
  coverContainerWide: { height: 320 },
  coverImage: { width: "100%", height: "100%" },
  coverGradientBottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 90,
  },

  /* ═══ PROFILE CARD ═══ */
  profileCardWide: {
    maxWidth: 640,
    alignSelf: "center",
    width: "100%",
  },
  profileCategory: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    textAlign: "center",
  },
  profileLocationRows: {
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  locationRowText: {
    fontSize: 13,
    fontWeight: "500",
  },
  locationRowValue: {
    fontWeight: "800",
  },
  distanceRowText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4ADE80",
  },

  /* ═══ METRIC GRID ═══ */
  metricGridWide: {
    maxWidth: 640,
    alignSelf: "center",
    width: "100%",
  },
  metricItem: { flex: 1, alignItems: "center", gap: 4 },
  metricValue: { fontSize: 14, fontWeight: "800" },
  metricLabel: { fontSize: 11, fontWeight: "600" },

  /* ═══ HERO (nome/avatar reaproveitados no Profile Card) ═══ */
  heroVerifiedBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#111827",
    borderRadius: 12,
    padding: 1,
  },
  heroName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  heroVerifiedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(37,211,102,0.15)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  heroVerifiedPillText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#25D366",
    letterSpacing: 0.5,
  },
  heroPillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  heroPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  heroPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#D1D5DB",
  },
  adminTransferBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#25D366",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignSelf: "flex-start",
  },

  /* ═══ TAB STRIP ═══ */
  tabStrip: {
    borderBottomWidth: 1,
  },
  tabStripContent: {
    paddingHorizontal: 16,
    gap: 0,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "700",
  },

  /* ═══ CONTENT AREA ═══ */
  contentArea: {
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 16,
  },
  contentAreaWide: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 20,
    maxWidth: 1200,
    alignSelf: "center",
    width: "100%",
  },
  mainCol: { gap: 16, width: "100%" },
  mainColWide: { flex: 3 },
  sideCol: { gap: 16, width: "100%" },
  sideColWide: { flex: 2 },

  /* ═══ CARDS ═══ */
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  cardLinkBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  cardLinkText: {
    fontSize: 13,
    fontWeight: "700",
  },
  cardDesc: {
    fontSize: 14,
    lineHeight: 22,
    marginTop: 12,
  },
  cardSubTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  /* ── Gallery ── */
  galleryThumb: {
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    position: "relative",
  },
  galleryThumbImg: {
    width: 160,
    height: 110,
    backgroundColor: "#1F2937",
  },
  galleryOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
  },
  galleryOverlayCount: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  galleryOverlaySub: {
    fontSize: 11,
    fontWeight: "600",
    color: "#D1D5DB",
    marginTop: 2,
  },

  /* ── Chips ── */
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chipPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipPillText: {
    fontSize: 12,
    fontWeight: "600",
  },

  /* ── Attend ── */
  attendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  attendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  attendText: {
    fontSize: 13,
    fontWeight: "500",
  },

  /* ── Products ── */
  productRow: {
    flexDirection: "row",
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 12,
    alignItems: "center",
  },
  productImg: {
    width: 64,
    height: 64,
    borderRadius: 10,
  },
  productInfo: { flex: 1, gap: 2 },
  productName: { fontSize: 14, fontWeight: "700" },
  productDescText: { fontSize: 11, lineHeight: 15 },
  productPrice: { fontSize: 13, fontWeight: "700", marginTop: 2 },

  /* ── Empty Module ── */
  emptyModule: {
    marginTop: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed" as const,
    padding: 24,
    alignItems: "center",
    gap: 10,
  },
  emptyModuleTitle: { fontSize: 15, fontWeight: "700", textAlign: "center" },
  emptyModuleSub: {
    fontSize: 13, lineHeight: 19, textAlign: "center", maxWidth: 280,
  },

  /* ── Rating Inline ── */
  ratingInlineBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(245,158,11,0.08)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  ratingInlineValue: {
    fontSize: 13,
    fontWeight: "800",
    color: "#F59E0B",
  },
  ratingInlineCount: {
    fontSize: 11,
    fontWeight: "500",
    color: "#9CA3AF",
  },

  /* ── Reviews ── */
  reviewCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  reviewAvatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  reviewAvatarLetter: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  reviewUserName: { fontSize: 13, fontWeight: "700" },
  reviewStarsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  reviewComment: { fontSize: 13, lineHeight: 19 },
  emptyReviews: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    gap: 8,
    marginTop: 10,
  },
  emptyReviewsText: { fontSize: 13, fontWeight: "500", textAlign: "center" },
  viewAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 10,
  },
  viewAllBtnText: { fontSize: 13, fontWeight: "700" },

  /* ── Hours ── */
  hoursRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 5,
  },
  hoursDayLabel: { fontSize: 13 },

  /* ── Status ── */
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  /* ── Trust ── */
  trustGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 16,
    justifyContent: "space-between",
  },
  trustItem: {
    alignItems: "center",
    gap: 8,
    width: "22%",
    minWidth: 70,
  },
  trustIconBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  trustLabel: {
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 15,
  },

  /* ── Social ── */
  socialSection: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    paddingTop: 16,
  },
  socialLabel: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 12,
  },
  socialIconsRow: {
    flexDirection: "row",
    gap: 14,
  },
  socialIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  /* ── CTA ── */
  ctaCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    gap: 10,
  },
  ctaTitle: {
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },
  ctaSub: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    maxWidth: 300,
  },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    width: "100%",
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 6,
  },
  ctaBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  /* ── Location ── */
  locationAddr: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
    marginTop: 10,
  },

  /* ── Report ── */
  reportBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.2)",
    backgroundColor: "rgba(239, 68, 68, 0.05)",
  },
  reportBtnText: { color: "#EF4444", fontSize: 14, fontWeight: "700" },

  /* ═══ BOTTOM BAR ═══ */
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  bottomBarTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  bottomBarAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E5E7EB",
  },
  bottomBarName: {
    fontSize: 14,
    fontWeight: "700",
  },
  bottomBarStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  bottomBarStatItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  bottomBarBtns: {
    flexDirection: "row",
    gap: 10,
  },
  bottomBtnOutline: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 50,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  bottomBtnPrimary: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 50,
    borderRadius: 14,
  },
  bottomBtnPrimaryText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  /* ═══ MODALS (kept from original) ═══ */
  modalBackground: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center", alignItems: "center",
  },
  modalOverlay: { ...StyleSheet.absoluteFillObject },
  modalContent: {
    width: "100%", height: "80%",
    justifyContent: "center", alignItems: "center",
  },
  closeModalBtn: {
    position: "absolute", top: 50, right: 25, zIndex: 10,
    padding: 10, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 25,
  },
  fullImage: { width: "100%", height: "100%" },
  modalLeftBtn: {
    position: "absolute", left: 20, zIndex: 10, padding: 10,
    backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 25,
  },
  modalRightBtn: {
    position: "absolute", right: 20, zIndex: 10, padding: 10,
    backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 25,
  },
  imageCounter: {
    position: "absolute", bottom: 20, backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15,
  },
  imageCounterText: { color: "#FFF", fontSize: 14, fontWeight: "600" },
  modalOverlayBackground: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end",
  },
  reportModalContent: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40, maxHeight: "85%",
  },
  reportModalHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: 16,
  },
  reportModalTitle: { fontSize: 18, fontWeight: "800" },
  closeReportBtn: { padding: 4 },
  reportModalSubtitle: { fontSize: 14, lineHeight: 20, marginBottom: 16 },
  reasonOption: {
    flexDirection: "row", alignItems: "center", padding: 14,
    borderRadius: 12, borderWidth: 1, marginBottom: 10, gap: 12,
  },
  radioButton: {
    width: 18, height: 18, borderRadius: 9, borderWidth: 2,
    alignItems: "center", justifyContent: "center",
  },
  radioButtonInner: { width: 10, height: 10, borderRadius: 5 },
  reasonLabelText: { fontSize: 14 },
  detailsLabelText: { fontSize: 14, fontWeight: "700", marginBottom: 8 },
  detailsInput: {
    borderRadius: 12, borderWidth: 1, padding: 12, height: 90,
    textAlignVertical: "top", fontSize: 14,
  },
  reportModalFooter: {
    flexDirection: "row", gap: 12, marginTop: 20,
    borderTopWidth: 1, paddingTop: 16,
  },
  reportModalCancelBtn: {
    flex: 1, borderRadius: 12, borderWidth: 1, height: 48,
    alignItems: "center", justifyContent: "center",
  },
  reportCancelBtnText: { fontSize: 14, fontWeight: "700" },
  reportModalSubmitBtn: {
    flex: 2, borderRadius: 12, height: 48,
    alignItems: "center", justifyContent: "center",
  },
  reportSubmitBtnText: { color: "#FFF", fontSize: 14, fontWeight: "700" },
});
