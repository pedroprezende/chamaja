import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from "react-native";
import { Image } from "expo-image";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ScrollView,
  FlatList,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from "react-native-draggable-flatlist";

import { ScreenContainer } from "@/components/screen-container";
import { AdsCarousel } from "@/components/ads-carousel";
import { adminDB, type Service } from "@/lib/admin-database";
import { trpc } from "@/lib/trpc";
import { storage } from "@/lib/storage";
import { useAds } from "@/hooks/use-ads";
import { useAdminServices } from "@/hooks/use-admin-services";
import { useAuth } from "@/lib/auth-context";
import { useNotifications } from "@/lib/notifications-context";
import { MigrationManager } from "@/components/MigrationManager";
import { getSubcategories } from "@/data/mock";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { useColors } from "@/hooks/use-colors";
import { useThemeContext } from "@/lib/theme-provider";
import { useLocation } from "@/lib/location-context";
import {
  calculateHaversineDistance,
  formatDistancePtBr,
} from "@/lib/location-utils";
import { useDebounce } from "@/hooks/use-debounce";
import { AnimatedCard } from "@/components/ui/animated-card";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";
import AddressSelectorModal from "@/components/address-selector-modal";
import { createStyles } from "./index.styles";
import { generateWhatsAppMessage } from "@/lib/whatsapp-helper";
import {
  MOCK_PROVIDERS_BY_CAT,
  getMockProvidersForCategory,
} from "./home-mock-data";

// ─── Constantes ──────────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, string> = {
  "reformas-reparos": "build",
  "assistencia-tecnica": "settings",
  "servicos-domesticos": "home",
  "servicos-externos": "yard",
  automotivo: "directions-car",
  "beleza-estetica": "content-cut",
  "servicos-profissionais": "business-center",
  saude: "local-hospital",
  eventos: "celebration",
  logistica: "local-shipping",
  educacao: "school",
  comercios: "storefront",
  mobilidade: "commute",
};

const ADMIN_CATEGORY_ICONS: Record<string, string> = {
  eletricista: "electrical-services",
  encanador: "plumbing",
  diarista: "cleaning-services",
  pintor: "format-paint",
  pedreiro: "construction",
  marceneiro: "carpenter",
  jardineiro: "yard",
  default: "build",
};

function getAdminIcon(category: string): string {
  const key = category
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  for (const k of Object.keys(ADMIN_CATEGORY_ICONS)) {
    if (key.includes(k)) return ADMIN_CATEGORY_ICONS[k];
  }
  return ADMIN_CATEGORY_ICONS.default;
}

function openWhatsApp(phone: string, serviceName: string, category?: string) {
  let number = phone.replace(/\D/g, "");
  if (!number.startsWith("55")) number = "55" + number;
  const text = generateWhatsAppMessage({
    provider: {
      name: serviceName,
      category,
    },
    selectedItemName: serviceName,
  });
  const msg = encodeURIComponent(text);
  Linking.openURL(`https://wa.me/${number}?text=${msg}`).catch(() =>
    Alert.alert(
      "WhatsApp não encontrado",
      "Verifique se o WhatsApp está instalado.",
    ),
  );
}

// ─── Formulário vazio ─────────────────────────────────────────────────────
const EMPTY_FORM = {
  name: "",
  categoryId: "",
  subcategoryId: "",
  imageUri: "",
  whatsapp: "",
  description: "",
  address: "",
  gallery: [] as string[],
  showOnHome: true,
};

// (Prestadores simulados movidos para './home-mock-data.ts')

// ─── Componente principal ─────────────────────────────────────────────────────
export default function HomeScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const { ads, isLoading: adsLoading } = useAds(true);

  const { colorScheme, setColorScheme } = useThemeContext();
  const {
    coords,
    addressName,
    permissionGranted,
    loading: locationLoading,
  } = useLocation();
  const { services: adminServices } = useAdminServices(false);

  const isDefaultCity = addressName === "Bragança Paulista - SP";
  const showDistance = coords !== null;

  const [regionModalVisible, setRegionModalVisible] = useState(false);

  const isAdmin = user?.role === "admin";
  const firstName = user?.name?.split(" ")[0] || "você";

  // ── Estados para Cache Local ──
  const [cachedServices, setCachedServices] = useState<any[]>([]);
  const [cachedProviders, setCachedProviders] = useState<any[]>([]);
  const [cachedCategories, setCachedCategories] = useState<any[]>([]);
  const [cachedSubcategories, setCachedSubcategories] = useState<any[]>([]);

  useEffect(() => {
    const loadCache = async () => {
      try {
        const [svcs, provs, cats, subs] = await Promise.all([
          AsyncStorage.getItem("@chamaja_cached_services"),
          AsyncStorage.getItem("@chamaja_cached_providers"),
          AsyncStorage.getItem("@chamaja_cached_categories"),
          AsyncStorage.getItem("@chamaja_cached_subcategories"),
        ]);
        if (svcs) setCachedServices(JSON.parse(svcs));
        if (provs) setCachedProviders(JSON.parse(provs));
        if (cats) setCachedCategories(JSON.parse(cats));
        if (subs) setCachedSubcategories(JSON.parse(subs));
      } catch (e) {
        console.error("Failed to load home screen cache:", e);
      }
    };
    loadCache();
  }, []);

  // ── Serviços via tRPC (banco real) ──
  const {
    data: dbServices = cachedServices,
    isLoading: loadingServices,
    refetch: refetchServices,
  } = trpc.services.list.useQuery(undefined, {
    refetchOnMount: true,
    placeholderData: cachedServices.length > 0 ? cachedServices : undefined,
  });
  const { data: dbProviders = cachedProviders, isLoading: loadingProviders } =
    trpc.providers.listLightweight.useQuery(undefined, {
      refetchOnMount: true,
      placeholderData: cachedProviders.length > 0 ? cachedProviders : undefined,
    });

  useEffect(() => {
    if (dbServices && dbServices.length > 0 && dbServices !== cachedServices) {
      AsyncStorage.setItem(
        "@chamaja_cached_services",
        JSON.stringify(dbServices),
      ).catch(console.error);
    }
  }, [dbServices, cachedServices]);

  useEffect(() => {
    if (
      dbProviders &&
      dbProviders.length > 0 &&
      dbProviders !== cachedProviders
    ) {
      AsyncStorage.setItem(
        "@chamaja_cached_providers",
        JSON.stringify(dbProviders),
      ).catch(console.error);
    }
  }, [dbProviders, cachedProviders]);

  const services = React.useMemo<Service[]>(
    () =>
      dbServices.map((s: any) => ({
        id: s.id || String(Math.random()),
        adminId: s.adminId || "admin",
        name: s.name || s.title || "Sem nome",
        category: s.category || "Geral",
        categoryId: s.categoryId ?? undefined,
        subcategoryId: s.subcategoryId ?? undefined,
        subcategoryName: s.subcategoryName ?? undefined,
        description: s.description ?? "",
        icon: s.icon ?? "build",
        imageUri: s.imageUri || s.avatarUri || s.avatar_uri || undefined,
        whatsapp: s.whatsapp ?? undefined,
        address: s.address ?? undefined,
        gallery: s.gallery ?? undefined,
        showOnHome: true,
        displayOrder: s.displayOrder || 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
      })),
    [dbServices],
  );

  const loadServices = useCallback(() => {
    refetchServices();
  }, [refetchServices]);

  const createServiceMutation = trpc.services.create.useMutation({
    onSuccess: () => refetchServices(),
  });
  const updateServiceMutation = trpc.services.update.useMutation({
    onSuccess: () => refetchServices(),
  });
  const deleteServiceMutation = trpc.services.delete.useMutation({
    onSuccess: () => refetchServices(),
  });
  const reorderServicesMutation = trpc.services.reorder.useMutation();
  const reorderCategoriesMutation = trpc.categories.reorder.useMutation({
    onSuccess: () => {
      trpc.useContext().categories.list.invalidate();
    },
  });

  // ── Categorias via tRPC ──
  const { data: dbCategories = cachedCategories, isLoading: loadingCats } =
    trpc.categories.list.useQuery(undefined, {
      placeholderData:
        cachedCategories.length > 0 ? cachedCategories : undefined,
    });
  const { data: dbSubcategories = cachedSubcategories } =
    trpc.categories.subServices.listAll.useQuery(undefined, {
      placeholderData:
        cachedSubcategories.length > 0 ? cachedSubcategories : undefined,
    });

  useEffect(() => {
    if (
      dbCategories &&
      dbCategories.length > 0 &&
      dbCategories !== cachedCategories
    ) {
      AsyncStorage.setItem(
        "@chamaja_cached_categories",
        JSON.stringify(dbCategories),
      ).catch(console.error);
    }
  }, [dbCategories, cachedCategories]);

  useEffect(() => {
    if (
      dbSubcategories &&
      dbSubcategories.length > 0 &&
      dbSubcategories !== cachedSubcategories
    ) {
      AsyncStorage.setItem(
        "@chamaja_cached_subcategories",
        JSON.stringify(dbSubcategories),
      ).catch(console.error);
    }
  }, [dbSubcategories, cachedSubcategories]);

  const featuredProviders = React.useMemo(() => {
    const list = dbProviders
      .filter((p) => p.destaque && p.isActive)
      .map((p) => {
        let distanceKm = 9999;
        if (
          coords &&
          p.latitude !== null &&
          p.latitude !== undefined &&
          p.longitude !== null &&
          p.longitude !== undefined
        ) {
          distanceKm = calculateHaversineDistance(
            coords.latitude,
            coords.longitude,
            Number(p.latitude),
            Number(p.longitude),
          );
        }
        return { ...p, distanceKm };
      });
    // Sort by distance (closest first)
    return list.sort((a, b) => a.distanceKm - b.distanceKm);
  }, [dbProviders, coords]);

  const popularSubcategories = React.useMemo(() => {
    const popularNames = [
      "encanador",
      "eletricista",
      "chaveiro",
      "motoboy",
      "ar condicionado",
      "pintor",
      "diarista",
    ];
    const list = dbSubcategories.filter((sub) =>
      popularNames.some((name) => sub.name.toLowerCase().includes(name)),
    );
    if (list.length > 0) return list.slice(0, 6);
    return dbSubcategories.slice(0, 6);
  }, [dbSubcategories]);

  const nearbyCount = React.useMemo(() => {
    if (loadingProviders) return "...";
    return dbProviders.filter((p) => p.isActive).length;
  }, [dbProviders, loadingProviders]);

  const renderProviderCard = useCallback(
    (item: any, index: number, isFeatured: boolean = false) => {
      let distanceText = "";
      if (
        showDistance &&
        coords &&
        item.latitude !== null &&
        item.longitude !== null &&
        item.latitude !== undefined &&
        item.longitude !== undefined
      ) {
        const distKm = calculateHaversineDistance(
          coords.latitude,
          coords.longitude,
          Number(item.latitude),
          Number(item.longitude),
        );
        distanceText = formatDistancePtBr(distKm);
      }

      const isMock = String(item.id).startsWith("mock-");

      return (
        <Pressable
          key={item.id}
          style={[
            styles.featuredCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          onPress={() => {
            if (Platform.OS !== "web")
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (isMock) {
              router.push({
                pathname: "/categories/[section]",
                params: {
                  section: item.categoryId || "reformas-reparos",
                  title: item.category,
                },
              } as any);
            } else {
              router.push(`/professional/${item.id}` as any);
            }
          }}
        >
          <View style={styles.featuredImageWrapper}>
            <Image
              source={{
                uri:
                  item.coverThumbnailUri ||
                  item.avatarThumbnailUri ||
                  item.coverUri ||
                  item.avatarUri ||
                  "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=300&q=80",
              }}
              style={styles.featuredImage}
            />
            {isFeatured && (
              <View style={styles.sponsoredBadge}>
                <Text style={styles.sponsoredText}>Patrocinado</Text>
              </View>
            )}
          </View>

          <View style={styles.featuredInfo}>
            <View style={styles.featuredTitleRow}>
              <Text
                style={[styles.featuredName, { color: colors.foreground }]}
                numberOfLines={1}
              >
                {item.name}
              </Text>
              {(item.isVerified || isMock) && (
                <MaterialIcons name="verified" size={14} color="#22C55E" />
              )}
            </View>

            <Text
              style={[styles.featuredSub, { color: colors.discreto }]}
              numberOfLines={1}
            >
              {item.subcategoryName || item.category || "Profissional"}
              {showDistance && distanceText ? ` • 📍 ${distanceText}` : ""}
            </Text>

            <View style={styles.featuredBottom}>
              <View style={styles.ratingRow}>
                <MaterialIcons name="star" size={14} color="#FBBF24" />
                <Text style={[styles.ratingText, { color: colors.foreground }]}>
                  {item.ratingCount && Number(item.ratingCount) > 0 ? (
                    `${Number(item.rating).toFixed(1)} (${item.ratingCount})`
                  ) : (
                    "Novo"
                  )}
                </Text>
              </View>
              <View
                style={[
                  styles.abertoBadge,
                  {
                    backgroundColor:
                      colorScheme === "dark"
                        ? "rgba(34, 197, 94, 0.15)"
                        : "#DCFCE7",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.abertoText,
                    {
                      color: colorScheme === "dark" ? "#22C55E" : "#15803D",
                    },
                  ]}
                >
                  Aberto
                </Text>
              </View>
            </View>
          </View>
        </Pressable>
      );
    },
    [coords, showDistance, colors, colorScheme, router],
  );

  // Debug Logs
  useEffect(() => {
    console.log("[Supabase Debug] Categorias:", dbCategories.length);
    console.log("[Supabase Debug] Subcategorias:", dbSubcategories.length);
    console.log("[Supabase Debug] Serviços (Home):", dbServices.length);
  }, [dbCategories, dbSubcategories, dbServices]);

  // Categorias para a barra horizontal (Todas)
  const allCategories = dbCategories;

  // Categorias para os blocos verticais (Apenas as 3 principais ou as primeiras 3)
  const displayCategories = React.useMemo(() => {
    return allCategories.slice(0, 5);
  }, [allCategories]);

  const [editMode, setEditMode] = useState(false);
  const [homeSearchQuery, setHomeSearchQuery] = useState("");
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [activeFilter, setActiveFilter] = useState<
    "rating" | "name" | "none" | "distance"
  >("none");
  const [hasPromptedAddress, setHasPromptedAddress] = useState(false);

  // Automatically prompt for manual address selection if GPS location is denied and no location is set
  useEffect(() => {
    if (
      !locationLoading &&
      !permissionGranted &&
      isDefaultCity &&
      !hasPromptedAddress
    ) {
      setRegionModalVisible(true);
      setHasPromptedAddress(true);
    }
  }, [locationLoading, permissionGranted, isDefaultCity, hasPromptedAddress]);
  const [localRecentSearches, setLocalRecentSearches] = useState<string[]>([]);

  // Carregar buscas recentes locais ao inicializar a tela
  useEffect(() => {
    const loadRecentSearches = async () => {
      try {
        const stored = await AsyncStorage.getItem("@chamaja_recent_searches");
        if (stored) {
          setLocalRecentSearches(JSON.parse(stored));
        }
      } catch (e) {
        console.error("Erro ao carregar buscas locais:", e);
      }
    };
    loadRecentSearches();
  }, []);

  const saveSearchLocally = async (query: string) => {
    try {
      const clean = query.trim().toLowerCase();
      if (clean.length < 2 || clean === "de" || clean === "o" || clean === "a")
        return;

      setLocalRecentSearches((prev) => {
        const filtered = prev.filter((q) => q !== clean);
        const updated = [clean, ...filtered].slice(0, 5);
        AsyncStorage.setItem(
          "@chamaja_recent_searches",
          JSON.stringify(updated),
        ).catch(console.error);
        return updated;
      });
    } catch (e) {
      console.error("Erro ao salvar busca local:", e);
    }
  };

  const toggleEditMode = useCallback(() => {
    if (Platform.OS !== "web")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setEditMode((v) => !v);
  }, []);

  // ── Modal de criação/edição ──
  const [modalVisible, setModalVisible] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [catDropOpen, setCatDropOpen] = useState(false);
  const [subCatDropOpen, setSubCatDropOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const openCreate = useCallback(() => {
    setEditingService(null);
    setForm(EMPTY_FORM);
    setCatDropOpen(false);
    setModalVisible(true);
  }, []);

  const openEdit = useCallback((svc: Service) => {
    setEditingService(svc);
    setForm({
      name: svc.name,
      categoryId: svc.categoryId,
      subcategoryId: svc.subcategoryId || "",
      imageUri: svc.imageUri || "",
      whatsapp: svc.whatsapp || "",
      description: svc.description || "",
      address: svc.address || "",
      gallery: svc.gallery || [],
      showOnHome: svc.showOnHome,
    });
    setCatDropOpen(false);
    setModalVisible(true);
  }, []);

  const pickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permissão necessária",
        "Permita o acesso à galeria nas configurações.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const uri =
        Platform.OS === "web" && asset.base64
          ? `data:image/jpeg;base64,${asset.base64}`
          : asset.uri;
      setForm((f) => ({ ...f, imageUri: uri }));
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!form.name.trim()) {
      Alert.alert("Atenção", "Informe o nome do serviço.");
      return;
    }
    if (!form.categoryId) {
      Alert.alert("Atenção", "Selecione uma categoria.");
      return;
    }
    setSaving(true);
    try {
      // Upload da imagem para o Supabase Storage se for local
      let finalImageUri = form.imageUri;
      if (form.imageUri && !form.imageUri.startsWith("http")) {
        const uploadedUrl = await storage.uploadImage(form.imageUri);
        if (uploadedUrl) finalImageUri = uploadedUrl;
      }

      const catName =
        dbCategories
          .find((c: any) => c.id === form.categoryId)
          ?.name?.replace("\n", " ") || form.categoryId;
      const whatsapp = form.whatsapp.trim() || undefined;
      const description = form.description.trim() || undefined;
      const address = form.address.trim() || undefined;

      // Upload da galeria
      let finalGallery: string[] | undefined = undefined;
      if (form.gallery.length > 0) {
        finalGallery = [];
        for (const uri of form.gallery) {
          if (uri.startsWith("http")) {
            finalGallery.push(uri);
          } else {
            const uploadedUrl = await storage.uploadImage(uri);
            if (uploadedUrl) finalGallery.push(uploadedUrl);
          }
        }
      }

      // Buscar o nome real da subcategoria para salvar no DB
      const subcatObj = dbSubcategories.find(
        (s) => s.id === form.subcategoryId,
      );
      const subcatName = subcatObj
        ? subcatObj.name
        : form.subcategoryId || undefined;

      if (editingService) {
        await updateServiceMutation.mutateAsync({
          id: editingService.id,
          name: form.name.trim(),
          category: catName,
          categoryId: form.categoryId || undefined,
          subcategoryId: form.subcategoryId || undefined,
          subcategoryName: subcatName,
          imageUri: finalImageUri || undefined,
          whatsapp,
          description,
          address,
          gallery: finalGallery,
          showOnHome: form.showOnHome,
        });
      } else {
        await createServiceMutation.mutateAsync({
          name: form.name.trim(),
          category: catName,
          categoryId: form.categoryId || undefined,
          subcategoryId: form.subcategoryId || undefined,
          subcategoryName: subcatName,
          description,
          imageUri: finalImageUri || undefined,
          whatsapp,
          address,
          gallery: finalGallery,
          showOnHome: form.showOnHome,
        });
      }
      setModalVisible(false);
    } catch (e: any) {
      Alert.alert("Erro", e.message || "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }, [
    form,
    editingService,
    dbCategories,
    dbSubcategories,
    createServiceMutation,
    updateServiceMutation,
  ]);

  const handleDelete = useCallback(
    (svc: Service) => {
      Alert.alert(
        "Excluir serviço",
        `Tem certeza que deseja excluir "${svc.name}"?`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Excluir",
            style: "destructive",
            onPress: async () => {
              await deleteServiceMutation.mutateAsync({ id: svc.id });
            },
          },
        ],
      );
    },
    [deleteServiceMutation],
  );

  // ── Drag-and-drop ──
  const handleDragEnd = useCallback(
    async ({ data }: { data: Service[] }) => {
      reorderServicesMutation.mutate({ ids: data.map((s) => s.id) });
    },
    [reorderServicesMutation],
  );

  const debouncedSearch = useDebounce(homeSearchQuery, 500);

  // Busca global via tRPC (Real-time DB)
  const { data: searchResults = [], isLoading: queryLoading } =
    trpc.providers.search.useQuery(debouncedSearch, {
      enabled: debouncedSearch.length > 1,
    });

  const isDebouncing = homeSearchQuery.trim() !== debouncedSearch.trim();
  const searching =
    (queryLoading || isDebouncing) && homeSearchQuery.trim().length > 0;

  const trackSearchMutation = trpc.analytics.trackSearch.useMutation();

  useEffect(() => {
    if (debouncedSearch.length > 1) {
      trackSearchMutation.mutate({
        query: debouncedSearch,
        userId: user?.id || undefined,
      });
      saveSearchLocally(debouncedSearch);
    }
  }, [debouncedSearch]);

  // Filtrar serviços administrativos também para busca global
  const filteredServices = React.useMemo(() => {
    if (!homeSearchQuery.trim()) return services;
    const q = homeSearchQuery.toLowerCase();
    return services.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q),
    );
  }, [services, homeSearchQuery]);

  // Combinar resultados: Prestadores do banco + Serviços administrativos
  const globalResults = React.useMemo(() => {
    if (!homeSearchQuery.trim()) return [];

    // Mapear prestadores para o formato de exibição
    const providers = searchResults.map((p) => {
      const specialty = dbSubcategories.find((s) => s.id === p.subcategoryId);
      return {
        id: p.id,
        name: p.name,
        category: p.category || "Profissional",
        description: p.description || "",
        imageUri:
          p.avatarThumbnailUri ||
          p.avatarUri ||
          specialty?.imageUrl ||
          undefined,
        type: "PROVIDER" as const,
        rating: p.rating || 0,
        latitude: p.latitude,
        longitude: p.longitude,
        categoryId: p.categoryId || "",
      };
    });

    // Mapear serviços admin locais correspondentes
    const q = homeSearchQuery.toLowerCase();
    const matchingAdminServices = adminServices
      .filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q) ||
          s.description?.toLowerCase().includes(q),
      )
      .map((s) => ({
        id: s.id,
        name: s.name,
        category: s.category,
        description: s.description || "",
        imageUri: s.imageUri || undefined,
        type: "SERVICE" as const,
        rating: 5.0, // Nota padrão de verificação para serviços oficiais
        latitude: undefined,
        longitude: undefined,
        categoryId: s.categoryId || "",
      }));

    // Combinar prestadores e serviços administrativos
    let results = [...providers, ...matchingAdminServices];

    // Calcular distâncias
    const mapped = results.map((r) => {
      let distanceKm = 9999;
      if (
        coords &&
        r.latitude !== null &&
        r.latitude !== undefined &&
        r.longitude !== null &&
        r.longitude !== undefined
      ) {
        distanceKm = calculateHaversineDistance(
          coords.latitude,
          coords.longitude,
          Number(r.latitude),
          Number(r.longitude),
        );
      }
      return { ...r, distanceKm };
    });

    // Aplicar Filtros e Ordenação
    if (activeFilter === "rating") {
      mapped.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (activeFilter === "name") {
      mapped.sort((a, b) => a.name.localeCompare(b.name));
    } else if (activeFilter === "distance" && showDistance) {
      mapped.sort((a, b) => a.distanceKm - b.distanceKm);
    } else if (showDistance) {
      // Padrão: mais próximos primeiro
      mapped.sort((a, b) => a.distanceKm - b.distanceKm);
    }

    return mapped;
  }, [
    searchResults,
    homeSearchQuery,
    dbSubcategories,
    activeFilter,
    coords,
    showDistance,
    adminServices,
  ]);

  // ── Drag-and-drop Categorias ──
  const handleCategoryDragEnd = useCallback(
    async ({ data }: { data: any[] }) => {
      reorderCategoriesMutation.mutate({ ids: data.map((c) => c.id) });
    },
    [reorderCategoriesMutation],
  );

  // ── Render Bloco de Categoria (Draggable) ──
  const renderCategoryBlock = useCallback(
    ({ item: cat, drag, isActive, index }: any) => {
      // 1. Filtrar as subcategorias correspondentes a esta categoria
      const subCats = dbSubcategories.filter(
        (sub: any) => sub.categoryId === cat.id,
      );

      const content = (
        <Pressable
          onLongPress={editMode ? drag : undefined}
          style={[
            styles.categoryBlock,
            { backgroundColor: "transparent" },
            isActive && {
              backgroundColor: colors.background,
              borderRadius: 16,
              paddingVertical: 10,
            },
          ]}
        >
          <View style={styles.categoryHeaderVertical}>
            <View style={{ flex: 1 }}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                {editMode && (
                  <MaterialIcons
                    name="drag-indicator"
                    size={18}
                    color={colors.muted}
                  />
                )}
                <Text
                  style={[
                    styles.categoryTitleVertical,
                    { color: colors.foreground },
                  ]}
                >
                  {cat.name.replace("\n", " ")}
                </Text>
              </View>
            </View>
            <Pressable
              onPress={() =>
                !editMode && router.push(`/categories/${cat.id}` as any)
              }
            >
              <Text style={[styles.seeAllText, { color: colors.primary }]}>
                Ver todos
              </Text>
            </Pressable>
          </View>
          {subCats.length > 0 ? (
            <FlatList
              data={subCats}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.subCatList}
              keyExtractor={(item) => item.id}
              renderItem={({ item, index: subIndex }) => {
                // Calcular a quantidade de prestadores para esta subcategoria
                const count = dbProviders.filter((p) => {
                  if (!p.subcategoryId) return false;
                  const ids = p.subcategoryId
                    .split(",")
                    .map((id: string) => id.trim())
                    .filter(Boolean);
                  return ids.includes(item.id);
                }).length;

                const countText =
                  count > 0 ? `${count} por perto` : "Ver profissionais";

                return (
                  <AnimatedCard
                    style={StyleSheet.flatten([
                      styles.subCatCard,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                        borderWidth: 1,
                      },
                    ])}
                    onPress={() => {
                      if (!editMode) {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setHomeSearchQuery(item.name);
                      }
                    }}
                    delay={subIndex * 50}
                  >
                    <View style={styles.subCatImageWrapper}>
                      {item.imageUrl ? (
                        <Image
                          source={{ uri: item.imageUrl }}
                          style={styles.subCatImage}
                          contentFit="cover"
                          transition={200}
                        />
                      ) : (
                        <View
                          style={[
                            styles.subCatPlaceholder,
                            { backgroundColor: colors.surface },
                          ]}
                        >
                          <MaterialIcons
                            name={(item.icon || "build") as any}
                            size={32}
                            color="#22C55E"
                          />
                        </View>
                      )}
                    </View>
                    <View style={styles.subCatInfo}>
                      <Text
                        style={[
                          styles.subCatName,
                          { color: colors.foreground },
                        ]}
                        numberOfLines={1}
                      >
                        {item.name}
                      </Text>
                      <Text
                        style={{
                          fontSize: 10,
                          color: colors.discreto,
                          marginTop: 2,
                        }}
                      >
                        {countText}
                      </Text>
                    </View>
                  </AnimatedCard>
                );
              }}
            />
          ) : (
            <View
              style={[
                styles.emptySubCat,
                { backgroundColor: colors.background, borderRadius: 12 },
              ]}
            >
              <Text style={[styles.emptySubCatText, { color: colors.muted }]}>
                Nenhum serviço disponível.
              </Text>
            </View>
          )}
        </Pressable>
      );

      return (
        <Animated.View entering={FadeInDown.delay(index * 100).duration(600)}>
          {drag ? <ScaleDecorator>{content}</ScaleDecorator> : content}
        </Animated.View>
      );
    },
    [
      dbSubcategories,
      dbProviders,
      editMode,
      router,
      colors,
      colorScheme,
      coords,
    ],
  );

  // ── Render card (modo edição: draggable) ──
  const renderDraggableCard = useCallback(
    ({ item, drag, isActive }: RenderItemParams<Service>) => {
      const content = (
        <View
          style={[
            styles.adminServiceCard,
            editMode && styles.adminServiceCardEdit,
            isActive && styles.adminServiceCardDragging,
          ]}
        >
          {/* Imagem / ícone */}
          <Pressable
            style={{ flex: 1 }}
            onPress={() =>
              !editMode &&
              router.push({
                pathname: "/professional/[id]",
                params: { id: item.id },
              } as any)
            }
            onLongPress={editMode ? drag : undefined}
          >
            {item.imageUri ? (
              <Image
                source={{ uri: item.imageUri }}
                style={styles.adminServiceImage}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <View style={styles.adminServiceIconBg}>
                <MaterialIcons
                  name={getAdminIcon(item.category) as any}
                  size={30}
                  color="#25D366"
                />
              </View>
            )}
            <View style={styles.adminServiceInfo}>
              <Text style={styles.adminServiceName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.adminServiceCategory} numberOfLines={1}>
                {item.category}
              </Text>
            </View>
          </Pressable>

          {/* Botão WhatsApp (sempre visível quando tem número) */}
          {!!item.whatsapp && !editMode && (
            <Pressable
              style={({ pressed }) => [
                styles.whatsappMiniBtn,
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => openWhatsApp(item.whatsapp!, item.name)}
            >
              <MaterialIcons name="chat" size={14} color="#FFFFFF" />
            </Pressable>
          )}

          {/* Botões de edição */}
          {editMode && (
            <View style={styles.editOverlay}>
              {/* Drag handle */}
              <Pressable style={styles.dragHandle} onLongPress={drag}>
                <MaterialIcons
                  name="drag-indicator"
                  size={18}
                  color="#6B7280"
                />
              </Pressable>
              <View style={styles.editActions}>
                <Pressable
                  style={({ pressed }) => [
                    styles.editBtn,
                    pressed && { opacity: 0.7 },
                  ]}
                  onPress={() => openEdit(item)}
                >
                  <MaterialIcons name="edit" size={14} color="#FFFFFF" />
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.deleteBtn,
                    pressed && { opacity: 0.7 },
                  ]}
                  onPress={() => handleDelete(item)}
                >
                  <MaterialIcons name="delete" size={14} color="#FFFFFF" />
                </Pressable>
              </View>
            </View>
          )}
        </View>
      );

      return typeof drag === "function" ? (
        <ScaleDecorator>{content}</ScaleDecorator>
      ) : (
        content
      );
    },
    [editMode, openEdit, handleDelete, router],
  );

  // ── Render card (modo normal: FlatList simples) ──
  const renderNormalCard = useCallback(
    (item: Service) => (
      <Pressable
        key={item.id}
        style={({ pressed }) => [
          styles.adminServiceCard,
          pressed && { opacity: 0.85 },
        ]}
        onPress={() =>
          router.push({
            pathname: "/professional/[id]",
            params: { id: item.id },
          } as any)
        }
      >
        {item.imageUri ? (
          <Image
            source={{ uri: item.imageUri }}
            style={styles.adminServiceImage}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={styles.adminServiceIconBg}>
            <MaterialIcons
              name={getAdminIcon(item.category) as any}
              size={30}
              color="#25D366"
            />
          </View>
        )}
        <View style={styles.adminServiceInfo}>
          <Text style={styles.adminServiceName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.adminServiceCategory} numberOfLines={1}>
            {item.category}
          </Text>
        </View>
        {!!item.whatsapp && (
          <Pressable
            style={({ pressed }) => [
              styles.whatsappMiniBtn,
              pressed && { opacity: 0.7 },
            ]}
            onPress={() => openWhatsApp(item.whatsapp!, item.name)}
          >
            <MaterialIcons name="chat" size={14} color="#FFFFFF" />
          </Pressable>
        )}
      </Pressable>
    ),
    [router],
  );

  // ── Render Item para a lista principal (Categorias) ──
  const renderHomeItem = useCallback(
    ({ item, index }: any) => {
      return renderCategoryBlock({
        item,
        index,
        drag: undefined,
        isActive: false,
      });
    },
    [renderCategoryBlock],
  );

  // ── Skeleton Loader para melhor UX ──
  const HomeSkeleton = () => (
    <View style={{ padding: 16, gap: 20 }}>
      <Skeleton style={{ height: 180, borderRadius: 20 }} />
      <View style={{ flexDirection: "row", gap: 12 }}>
        {[1, 2, 3, 4].map((i) => (
          <Skeleton
            key={i}
            style={{ width: 70, height: 90, borderRadius: 16 }}
          />
        ))}
      </View>
      <Skeleton style={{ height: 200, borderRadius: 24 }} />
    </View>
  );

  const isInitialLoading =
    (loadingServices || loadingCats || loadingProviders) &&
    cachedCategories.length === 0;

  if (isInitialLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color="#25D366" />
        <Text style={{ marginTop: 16, fontSize: 14, color: colors.foreground }}>
          Carregando dados...
        </Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <ScreenContainer
        style={{ backgroundColor: colors.background }}
        edges={["top", "left", "right"]}
      >
        <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
        {/* MigrationManager temporarily removed to debug UI hang */}
        {/* <MigrationManager /> */}

        {/* Header Fixo */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.background,
              borderBottomWidth: 0,
              paddingBottom: 8,
            },
          ]}
        >
          <View style={styles.headerLeftContainer}>
            {/* Avatar do Usuário */}
            <Pressable
              style={[
                styles.avatarHeaderWrapper,
                { borderColor: "#22C55E", borderWidth: 2 },
              ]}
              onPress={() => router.push("/profile" as any)}
            >
              <Image
                source={{
                  uri:
                    user?.avatar ||
                    "https://ui-avatars.com/api/?name=" +
                      encodeURIComponent(firstName || "U") +
                      "&background=22C55E&color=fff",
                }}
                style={styles.avatarHeader}
              />
            </Pressable>
            <View style={styles.headerTitleContainer}>
              <Text
                style={[styles.greeting, { color: colors.foreground }]}
                numberOfLines={1}
              >
                Olá, {firstName}!
              </Text>
              <Pressable
                style={styles.locationContainer}
                onPress={() => setRegionModalVisible(true)}
              >
                <MaterialIcons name="location-on" size={14} color="#22C55E" />
                <Text
                  style={[styles.locationText, { color: colors.foreground }]}
                  numberOfLines={1}
                >
                  {addressName}
                </Text>
                <MaterialIcons
                  name="keyboard-arrow-down"
                  size={14}
                  color={colors.foreground}
                />
              </Pressable>
              <Text
                style={[styles.nearbySummaryText, { color: colors.discreto }]}
              >
                Encontramos{" "}
                <Text style={{ color: "#22C55E", fontWeight: "700" }}>
                  {nearbyCount}
                </Text>{" "}
                profissionais próximos
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            {/* Botão de Chaveamento de Tema */}
            <Pressable
              style={[styles.bellBtn, { marginRight: 8 }]}
              onPress={() => {
                if (Platform.OS !== "web") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                setColorScheme(colorScheme === "dark" ? "light" : "dark");
              }}
            >
              <MaterialIcons
                name={colorScheme === "dark" ? "wb-sunny" : "brightness-2"}
                size={22}
                color={colors.foreground}
              />
            </Pressable>

            <Pressable
              style={styles.bellBtn}
              onPress={() => router.push("/notifications" as any)}
            >
              <View style={styles.bellWrapper}>
                <MaterialIcons
                  name="notifications-none"
                  size={24}
                  color={colors.foreground}
                />
                {unreadCount > 0 && (
                  <View style={[styles.badge, { backgroundColor: "#EF4444" }]}>
                    <Text style={styles.badgeText}>{unreadCount}</Text>
                  </View>
                )}
              </View>
            </Pressable>
          </View>
        </View>

        {/* Banner de Edição */}
        {isAdmin && editMode && (
          <View style={styles.editBanner}>
            <MaterialIcons name="info-outline" size={16} color="#FFFFFF" />
            <Text style={styles.editBannerText}>
              Modo de edição: Arraste para reordenar ou use os botões nos cards.
            </Text>
          </View>
        )}

        {/* Busca e Filtros */}
        <View
          style={[
            styles.searchRow,
            { backgroundColor: colors.background, paddingBottom: 12 },
          ]}
        >
          <View
            style={[
              styles.searchContainer,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <MaterialIcons name="search" size={20} color={colors.discreto} />
            <TextInput
              style={[styles.searchTextInput, { color: colors.foreground }]}
              placeholder="Buscar serviços ou profissionais..."
              placeholderTextColor={colors.discreto + "80"}
              value={homeSearchQuery}
              onChangeText={setHomeSearchQuery}
            />
            {homeSearchQuery.length > 0 && (
              <Pressable onPress={() => setHomeSearchQuery("")}>
                <MaterialIcons name="close" size={18} color={colors.muted} />
              </Pressable>
            )}
            {searching && (
              <ActivityIndicator size="small" color={colors.primary} />
            )}
          </View>
        </View>

        {/* Visual warning banner when location cannot be determined */}
        {!permissionGranted && isDefaultCity && (
          <View
            style={[
              styles.locationWarningBanner,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.locationWarningHeader}>
              <MaterialIcons name="location-off" size={22} color="#EF4444" />
              <Text
                style={[
                  styles.locationWarningTitle,
                  { color: colors.foreground },
                ]}
              >
                Localização não ativada
              </Text>
            </View>
            <Text style={[styles.locationWarningText, { color: colors.muted }]}>
              Não conseguimos obter sua localização via GPS. Defina um endereço
              manualmente para calcular as distâncias e encontrar profissionais
              mais próximos.
            </Text>
            <Pressable
              onPress={() => setRegionModalVisible(true)}
              style={[
                styles.locationWarningBtn,
                { backgroundColor: colors.primary },
              ]}
            >
              <Text style={styles.locationWarningBtnText}>
                Definir Endereço Manualmente
              </Text>
            </Pressable>
          </View>
        )}

        {/* Conteúdo Principal Virtualizado */}
        {homeSearchQuery.length > 0 ? (
          /* Lista de Resultados da Busca */
          <FlatList
            data={globalResults}
            keyExtractor={(item) => `${item.type}-${item.id}`}
            contentContainerStyle={{ padding: 16, gap: 12 }}
            renderItem={({ item, index }) => (
              <Animated.View
                entering={FadeInDown.delay(index * 50).duration(400)}
              >
                <Pressable
                  style={({ pressed }) => [
                    styles.verticalServiceCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                    pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] },
                  ]}
                  onPress={() => {
                    if (Platform.OS !== "web")
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    if (item.type === "SERVICE") {
                      router.push({
                        pathname: "/admin-services/[serviceId]",
                        params: { serviceId: item.id, title: item.name },
                      } as any);
                    } else {
                      router.push({
                        pathname: "/professional/[id]",
                        params: { id: item.id },
                      } as any);
                    }
                  }}
                >
                  <View style={styles.verticalCardContent}>
                    {item.imageUri ? (
                      <Image
                        source={{ uri: item.imageUri }}
                        style={styles.verticalCardImage}
                      />
                    ) : (
                      <View
                        style={[
                          styles.verticalCardIconBg,
                          { backgroundColor: colors.background },
                        ]}
                      >
                        <MaterialIcons
                          name={
                            (item.categoryId === "comercios" ||
                            String(item.category)
                              .toLowerCase()
                              .includes("comercio")
                              ? "storefront"
                              : "person") as any
                          }
                          size={24}
                          color={colors.primary}
                        />
                      </View>
                    )}
                    <View style={styles.verticalCardInfo}>
                      <Text
                        style={[
                          styles.verticalCardName,
                          { color: colors.foreground },
                        ]}
                      >
                        {item.name}
                      </Text>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Text
                          style={[
                            styles.verticalCardCategory,
                            { color: colors.primary },
                          ]}
                        >
                          {item.category}
                        </Text>
                        <View
                          style={{
                            width: 4,
                            height: 4,
                            borderRadius: 2,
                            backgroundColor: colors.border,
                          }}
                        />
                        <Text style={{ fontSize: 11, color: colors.muted }}>
                          {item.type === "SERVICE"
                            ? "Serviço"
                            : item.categoryId === "comercios" ||
                                String(item.category)
                                  .toLowerCase()
                                  .includes("comercio")
                              ? "Comércio"
                              : "Profissional"}
                        </Text>
                        {showDistance &&
                        item.distanceKm &&
                        item.distanceKm < 9000 ? (
                          <>
                            <View
                              style={{
                                width: 4,
                                height: 4,
                                borderRadius: 2,
                                backgroundColor: colors.border,
                              }}
                            />
                            <Text
                              style={{ fontSize: 11, color: colors.primary }}
                            >
                              📍 {formatDistancePtBr(item.distanceKm)}
                            </Text>
                          </>
                        ) : null}
                      </View>
                      {item.description && (
                        <Text
                          style={[
                            styles.verticalCardDesc,
                            { color: colors.muted },
                          ]}
                          numberOfLines={1}
                        >
                          {item.description}
                        </Text>
                      )}
                    </View>
                    <MaterialIcons
                      name="chevron-right"
                      size={20}
                      color={colors.muted}
                    />
                  </View>
                </Pressable>
              </Animated.View>
            )}
            ListEmptyComponent={
              searching ? (
                <View style={{ padding: 20 }}>
                  {[1, 2, 3].map((i) => (
                    <Skeleton
                      key={i}
                      style={{ height: 80, marginBottom: 12, borderRadius: 16 }}
                    />
                  ))}
                </View>
              ) : homeSearchQuery.trim().length <= 1 ? (
                <View style={styles.emptySearchLarge}>
                  <MaterialIcons name="search" size={48} color={colors.muted} />
                  <Text
                    style={[
                      styles.emptySearchTitle,
                      { color: colors.foreground },
                    ]}
                  >
                    Digite para buscar
                  </Text>
                  <Text
                    style={[styles.emptySearchSub, { color: colors.muted }]}
                  >
                    Digite pelo menos 2 caracteres para buscar profissionais.
                  </Text>
                </View>
              ) : (
                <View style={styles.emptySearchLarge}>
                  <MaterialIcons
                    name="search-off"
                    size={48}
                    color={colors.muted}
                  />
                  <Text
                    style={[
                      styles.emptySearchTitle,
                      { color: colors.foreground },
                    ]}
                  >
                    Nenhum resultado
                  </Text>
                  <Text
                    style={[styles.emptySearchSub, { color: colors.muted }]}
                  >
                    Não encontramos nada para "{homeSearchQuery}"
                  </Text>
                </View>
              )
            }
          />
        ) : (
          /* Lista Principal (Home) */
          <FlatList
            data={displayCategories}
            keyExtractor={(item) => item.id}
            renderItem={renderHomeItem}
            contentContainerStyle={{ paddingBottom: 32 }}
            removeClippedSubviews={Platform.OS === "android"}
            initialNumToRender={3}
            maxToRenderPerBatch={5}
            windowSize={10}
            refreshing={loadingServices || loadingCats}
            onRefresh={loadServices}
            ListHeaderComponent={
              <View style={{ gap: 8 }}>
                {/* 1. Carrossel de Anúncios no Topo */}
                <View
                  style={{
                    marginTop: 12,
                    marginBottom: 8,
                    paddingHorizontal: 16,
                  }}
                >
                  <AdsCarousel ads={ads} />
                </View>

                {/* 2. Categorias Rápidas */}
                <View style={{ marginTop: 8 }}>
                  <View style={styles.sectionWrapper}>
                    <View style={styles.sectionHeader}>
                      <Text
                        style={[
                          styles.sectionTitle,
                          { color: colors.foreground },
                        ]}
                      >
                        Categorias
                      </Text>
                      <Pressable onPress={() => router.push("/search" as any)}>
                        <Text
                          style={[styles.seeAllText, { color: colors.primary }]}
                        >
                          Ver todas
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalCatsContent}
                  >
                    {allCategories?.slice(0, 5).map((cat) => (
                      <Pressable
                        key={cat.id}
                        style={styles.quickCatBtn}
                        onPress={() => {
                          if (Platform.OS !== "web")
                            Haptics.impactAsync(
                              Haptics.ImpactFeedbackStyle.Light,
                            );
                          router.push({
                            pathname: "/categories/[section]",
                            params: {
                              section: cat.id,
                              title: cat.name.replace("\n", " "),
                            },
                          } as any);
                        }}
                      >
                        <View
                          style={[
                            styles.quickCatIconBg,
                            {
                              backgroundColor: colors.surface,
                              borderColor: colors.border,
                            },
                          ]}
                        >
                          <MaterialIcons
                            name={(CATEGORY_ICONS[cat.id] as any) || "build"}
                            size={28}
                            color="#22C55E"
                          />
                        </View>
                        <Text
                          style={[
                            styles.quickCatLabel,
                            { color: colors.foreground },
                          ]}
                          numberOfLines={2}
                        >
                          {cat.name.replace("\n", " ")}
                        </Text>
                      </Pressable>
                    ))}
                    {/* Botão extra Mais Categorias */}
                    <Pressable
                      style={styles.quickCatBtn}
                      onPress={() => {
                        if (Platform.OS !== "web")
                          Haptics.impactAsync(
                            Haptics.ImpactFeedbackStyle.Light,
                          );
                        router.push("/search" as any);
                      }}
                    >
                      <View
                        style={[
                          styles.quickCatIconBg,
                          {
                            backgroundColor: colors.surface,
                            borderColor: colors.border,
                          },
                        ]}
                      >
                        <MaterialIcons
                          name="more-horiz"
                          size={28}
                          color="#22C55E"
                        />
                      </View>
                      <Text
                        style={[
                          styles.quickCatLabel,
                          { color: colors.foreground },
                        ]}
                        numberOfLines={2}
                      >
                        Mais Categorias
                      </Text>
                    </Pressable>
                  </ScrollView>
                </View>

                {/* 3. Destaques para você */}
                {featuredProviders.length > 0 && (
                  <View style={{ marginTop: 16 }}>
                    <View style={styles.sectionWrapper}>
                      <View style={styles.sectionHeader}>
                        <View style={styles.sectionTitleRow}>
                          <MaterialIcons
                            name="star"
                            size={20}
                            color="#FBBF24"
                          />
                          <Text
                            style={[
                              styles.sectionTitle,
                              { color: colors.foreground },
                            ]}
                          >
                            Destaques para você
                          </Text>
                        </View>
                        <Pressable
                          onPress={() => router.push("/search" as any)}
                        >
                          <Text
                            style={[
                              styles.seeAllText,
                              { color: colors.primary },
                            ]}
                          >
                            Ver todos
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                    {loadingProviders ? (
                      <ActivityIndicator
                        size="small"
                        color={colors.primary}
                        style={{ marginVertical: 20 }}
                      />
                    ) : (
                      <FlatList
                        data={featuredProviders}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{
                          paddingHorizontal: 16,
                          gap: 12,
                          paddingBottom: 10,
                        }}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item, index }) =>
                          renderProviderCard(item, index, true)
                        }
                      />
                    )}
                  </View>
                )}

                {/* 4. Mais procurados hoje */}
                <View style={{ marginTop: 16, marginBottom: 8 }}>
                  <View style={styles.sectionWrapper}>
                    <View style={styles.sectionHeader}>
                      <View style={styles.sectionTitleRow}>
                        <MaterialIcons
                          name="local-fire-department"
                          size={20}
                          color="#FF4500"
                        />
                        <Text
                          style={[
                            styles.sectionTitle,
                            { color: colors.foreground },
                          ]}
                        >
                          Mais procurados hoje
                        </Text>
                      </View>
                      <Pressable onPress={() => router.push("/search" as any)}>
                        <Text
                          style={[styles.seeAllText, { color: colors.primary }]}
                        >
                          Ver todos
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                  <FlatList
                    data={popularSubcategories}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => {
                      const count = dbProviders.filter((p) => {
                        if (!p.subcategoryId) return false;
                        const ids = p.subcategoryId
                          .split(",")
                          .map((id: string) => id.trim())
                          .filter(Boolean);
                        return ids.includes(item.id);
                      }).length;

                      const countText =
                        count > 0 ? `${count} por perto` : "Ver profissionais";

                      const lowerName = item.name.toLowerCase();
                      let iconName = "build";
                      if (lowerName.includes("encanador"))
                        iconName = "plumbing";
                      else if (lowerName.includes("eletricista"))
                        iconName = "flash-on";
                      else if (lowerName.includes("chaveiro"))
                        iconName = "vpn-key";
                      else if (
                        lowerName.includes("motoboy") ||
                        lowerName.includes("entrega")
                      )
                        iconName = "motorcycle";
                      else if (
                        lowerName.includes("ar condicionado") ||
                        lowerName.includes("refrigera")
                      )
                        iconName = "ac-unit";
                      else if (lowerName.includes("pintor"))
                        iconName = "format-paint";
                      else if (
                        lowerName.includes("diarista") ||
                        lowerName.includes("limpeza")
                      )
                        iconName = "cleaning-services";

                      return (
                        <Pressable
                          style={[
                            styles.popularPill,
                            {
                              backgroundColor: colors.surface,
                              borderColor: colors.border,
                            },
                          ]}
                          onPress={() => {
                            if (Platform.OS !== "web")
                              Haptics.impactAsync(
                                Haptics.ImpactFeedbackStyle.Light,
                              );
                            setHomeSearchQuery(item.name);
                          }}
                        >
                          <View
                            style={[
                              styles.popularIconBg,
                              { backgroundColor: colors.background },
                            ]}
                          >
                            <MaterialIcons
                              name={iconName as any}
                              size={20}
                              color={colors.primary}
                            />
                          </View>
                          <View>
                            <Text
                              style={[
                                styles.popularName,
                                { color: colors.foreground },
                              ]}
                            >
                              {item.name}
                            </Text>
                            <Text style={styles.popularCount}>{countText}</Text>
                          </View>
                        </Pressable>
                      );
                    }}
                  />
                </View>
              </View>
            }
            ListEmptyComponent={loadingServices ? <HomeSkeleton /> : null}
            ListFooterComponent={null}
          />
        )}

        {/* Modais */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalOverlay}
          >
            <Pressable
              style={styles.modalBackdrop}
              onPress={() => setModalVisible(false)}
            />
            <View
              style={[styles.modalSheet, { backgroundColor: colors.surface }]}
            >
              <View
                style={[styles.modalHandle, { backgroundColor: colors.border }]}
              />
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                  {editingService ? "Editar Serviço" : "Novo Serviço"}
                </Text>

                {/* Nome */}
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                  Nome do serviço *
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: colors.background,
                      color: colors.foreground,
                      borderColor: colors.border,
                    },
                  ]}
                  value={form.name}
                  onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
                  placeholder="Ex: Eletricista residencial"
                  placeholderTextColor={colors.muted}
                  returnKeyType="done"
                />

                {/* Categoria */}
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                  Categoria *
                </Text>
                <Pressable
                  style={[
                    styles.dropdownTrigger,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => setCatDropOpen((v) => !v)}
                >
                  <Text
                    style={[
                      styles.dropdownTriggerText,
                      { color: colors.foreground },
                      !form.categoryId && { color: colors.muted },
                    ]}
                  >
                    {form.categoryId
                      ? dbCategories
                          .find((c) => c.id === form.categoryId)
                          ?.name.replace("\n", " ") || form.categoryId
                      : "Selecionar Categoria"}
                  </Text>
                  <MaterialIcons
                    name={
                      catDropOpen ? "keyboard-arrow-up" : "keyboard-arrow-down"
                    }
                    size={20}
                    color={colors.muted}
                  />
                </Pressable>
                {catDropOpen && (
                  <View
                    style={[
                      styles.dropdownList,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <ScrollView
                      nestedScrollEnabled
                      showsVerticalScrollIndicator={false}
                      style={{ maxHeight: 220 }}
                    >
                      {dbCategories.map((cat) => (
                        <Pressable
                          key={cat.id}
                          style={({ pressed }) => [
                            styles.dropdownItem,
                            form.categoryId === cat.id &&
                              styles.dropdownItemSelected,
                            {
                              backgroundColor:
                                form.categoryId === cat.id
                                  ? colors.background
                                  : colors.surface,
                            },
                            pressed && { backgroundColor: colors.background },
                          ]}
                          onPress={() => {
                            setForm((f) => ({
                              ...f,
                              categoryId: cat.id,
                              subcategoryId: "",
                            }));
                            setCatDropOpen(false);
                          }}
                        >
                          <MaterialIcons
                            name={CATEGORY_ICONS[cat.id] as any}
                            size={16}
                            color={
                              form.categoryId === cat.id
                                ? colors.primary
                                : colors.muted
                            }
                          />
                          <Text
                            style={[
                              styles.dropdownItemText,
                              { color: colors.foreground },
                              form.categoryId === cat.id && {
                                color: colors.primary,
                                fontWeight: "700",
                              },
                            ]}
                          >
                            {cat.name.replace("\n", " ")}
                          </Text>
                          {form.categoryId === cat.id && (
                            <MaterialIcons
                              name="check"
                              size={16}
                              color={colors.primary}
                            />
                          )}
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* Especialidade (Opcional) */}
                {form.categoryId && (
                  <>
                    <Text
                      style={[styles.fieldLabel, { color: colors.foreground }]}
                    >
                      Especialidade (Opcional)
                    </Text>
                    <Pressable
                      style={[
                        styles.dropdownTrigger,
                        {
                          backgroundColor: colors.background,
                          borderColor: colors.border,
                        },
                      ]}
                      onPress={() => setSubCatDropOpen((v) => !v)}
                    >
                      <Text
                        style={[
                          styles.dropdownTriggerText,
                          { color: colors.foreground },
                          !form.subcategoryId && { color: colors.muted },
                        ]}
                      >
                        {form.subcategoryId
                          ? dbSubcategories.find(
                              (s) => s.id === form.subcategoryId,
                            )?.name || form.subcategoryId
                          : "Selecionar especialidade"}
                      </Text>
                      <MaterialIcons
                        name={
                          subCatDropOpen
                            ? "keyboard-arrow-up"
                            : "keyboard-arrow-down"
                        }
                        size={20}
                        color={colors.muted}
                      />
                    </Pressable>
                    {subCatDropOpen && (
                      <View
                        style={[
                          styles.dropdownList,
                          {
                            backgroundColor: colors.surface,
                            borderColor: colors.border,
                          },
                        ]}
                      >
                        <ScrollView
                          nestedScrollEnabled
                          showsVerticalScrollIndicator={false}
                          style={{ maxHeight: 220 }}
                        >
                          <Pressable
                            style={({ pressed }) => [
                              styles.dropdownItem,
                              !form.subcategoryId &&
                                styles.dropdownItemSelected,
                              {
                                backgroundColor: !form.subcategoryId
                                  ? colors.background
                                  : colors.surface,
                              },
                              pressed && { backgroundColor: colors.background },
                            ]}
                            onPress={() => {
                              setForm((f) => ({ ...f, subcategoryId: "" }));
                              setSubCatDropOpen(false);
                            }}
                          >
                            <Text
                              style={[
                                styles.dropdownItemText,
                                { color: colors.foreground },
                                !form.subcategoryId && {
                                  color: colors.primary,
                                  fontWeight: "700",
                                },
                              ]}
                            >
                              Nenhuma
                            </Text>
                            {!form.subcategoryId && (
                              <MaterialIcons
                                name="check"
                                size={16}
                                color={colors.primary}
                              />
                            )}
                          </Pressable>
                          {(() => {
                            const subs: any[] = [];
                            dbSubcategories
                              .filter((s) => s.categoryId === form.categoryId)
                              .forEach((s: any) => {
                                if (
                                  !subs.find(
                                    (item) =>
                                      item.name.toLowerCase() ===
                                      s.name.toLowerCase(),
                                  )
                                ) {
                                  subs.push(s);
                                }
                              });
                            return subs.map((sub: any) => (
                              <Pressable
                                key={sub.id}
                                style={({ pressed }) => [
                                  styles.dropdownItem,
                                  form.subcategoryId === sub.id &&
                                    styles.dropdownItemSelected,
                                  {
                                    backgroundColor:
                                      form.subcategoryId === sub.id
                                        ? colors.background
                                        : colors.surface,
                                  },
                                  pressed && {
                                    backgroundColor: colors.background,
                                  },
                                ]}
                                onPress={() => {
                                  setForm((f) => ({
                                    ...f,
                                    subcategoryId: sub.id,
                                  }));
                                  setSubCatDropOpen(false);
                                }}
                              >
                                <Text
                                  style={[
                                    styles.dropdownItemText,
                                    { color: colors.foreground },
                                    form.subcategoryId === sub.id && {
                                      color: colors.primary,
                                      fontWeight: "700",
                                    },
                                  ]}
                                >
                                  {sub.name}
                                </Text>
                                {form.subcategoryId === sub.id && (
                                  <MaterialIcons
                                    name="check"
                                    size={16}
                                    color={colors.primary}
                                  />
                                )}
                              </Pressable>
                            ));
                          })()}
                        </ScrollView>
                      </View>
                    )}
                  </>
                )}

                {/* Imagem */}
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                  Imagem de capa
                </Text>
                <Pressable
                  style={({ pressed }) => [
                    styles.imagePicker,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                    },
                    pressed && { opacity: 0.8 },
                  ]}
                  onPress={pickImage}
                >
                  {form.imageUri ? (
                    <>
                      <Image
                        source={{ uri: form.imageUri }}
                        style={styles.imagePreview}
                        resizeMode="cover"
                      />
                      <View style={styles.imageOverlay}>
                        <MaterialIcons
                          name="photo-camera"
                          size={20}
                          color="#FFFFFF"
                        />
                        <Text style={styles.imageOverlayText}>Trocar foto</Text>
                      </View>
                    </>
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <MaterialIcons
                        name="add-photo-alternate"
                        size={32}
                        color={colors.muted}
                      />
                      <Text
                        style={[
                          styles.imagePlaceholderText,
                          { color: colors.muted },
                        ]}
                      >
                        Toque para adicionar imagem
                      </Text>
                    </View>
                  )}
                </Pressable>

                {/* WhatsApp */}
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                  WhatsApp do prestador
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: colors.background,
                      color: colors.foreground,
                      borderColor: colors.border,
                    },
                  ]}
                  value={form.whatsapp}
                  onChangeText={(v) => setForm((f) => ({ ...f, whatsapp: v }))}
                  placeholder="Ex: (11) 99999-9999"
                  placeholderTextColor={colors.muted}
                  keyboardType="phone-pad"
                  returnKeyType="done"
                />
                <Text style={[styles.fieldHint, { color: colors.muted }]}>
                  Ao tocar no serviço, o usuário será direcionado para este
                  WhatsApp.
                </Text>

                {/* Descrição */}
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                  Descrição
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      height: 90,
                      textAlignVertical: "top",
                      backgroundColor: colors.background,
                      color: colors.foreground,
                      borderColor: colors.border,
                    },
                  ]}
                  value={form.description}
                  onChangeText={(v) =>
                    setForm((f) => ({ ...f, description: v }))
                  }
                  placeholder="Ex: Especialidades, experiência, diferenciais..."
                  placeholderTextColor={colors.muted}
                  multiline
                  numberOfLines={4}
                  returnKeyType="default"
                />

                {/* Endereço */}
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                  Endereço (bairro/cidade)
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: colors.background,
                      color: colors.foreground,
                      borderColor: colors.border,
                    },
                  ]}
                  value={form.address}
                  onChangeText={(v) => setForm((f) => ({ ...f, address: v }))}
                  placeholder="Ex: Centro, São Paulo - SP"
                  placeholderTextColor={colors.muted}
                  returnKeyType="done"
                />

                {/* Toggle Exibir na Home */}
                <Pressable
                  style={styles.toggleRow}
                  onPress={() =>
                    setForm((f) => ({ ...f, showOnHome: !f.showOnHome }))
                  }
                >
                  <View>
                    <Text
                      style={[styles.toggleLabel, { color: colors.foreground }]}
                    >
                      Exibir na Home
                    </Text>
                    <Text style={[styles.toggleSub, { color: colors.muted }]}>
                      Aparece na seção "Serviços Disponíveis"
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.toggleSwitch,
                      { backgroundColor: colors.border },
                      form.showOnHome && { backgroundColor: colors.primary },
                    ]}
                  >
                    <View
                      style={[
                        styles.toggleThumb,
                        form.showOnHome && styles.toggleThumbOn,
                      ]}
                    />
                  </View>
                </Pressable>

                {/* Botões */}
                <View style={styles.modalActions}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.cancelBtn,
                      { borderColor: colors.border },
                      pressed && { opacity: 0.7 },
                    ]}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text
                      style={[styles.cancelBtnText, { color: colors.muted }]}
                    >
                      Cancelar
                    </Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [
                      styles.saveBtn,
                      { backgroundColor: colors.primary },
                      pressed && { opacity: 0.85 },
                    ]}
                    onPress={handleSave}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.saveBtnText}>
                        {editingService ? "Salvar alterações" : "Criar serviço"}
                      </Text>
                    )}
                  </Pressable>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Modal de Filtros */}
        <Modal
          visible={filterModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setFilterModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <Pressable
              style={styles.modalBackdrop}
              onPress={() => setFilterModalVisible(false)}
            />
            <View
              style={[styles.filterSheet, { backgroundColor: colors.surface }]}
            >
              <View
                style={[styles.modalHandle, { backgroundColor: colors.border }]}
              />
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                Filtrar e Ordenar
              </Text>
              <Text style={[styles.fieldHint, { color: colors.muted }]}>
                Escolha como deseja visualizar os resultados
              </Text>

              <View style={styles.filterOptions}>
                {showDistance && (
                  <Pressable
                    style={[
                      styles.filterOption,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                      },
                      activeFilter === "distance" && {
                        borderColor: colors.primary,
                        backgroundColor: colors.background,
                      },
                    ]}
                    onPress={() => {
                      setActiveFilter("distance");
                      setFilterModalVisible(false);
                    }}
                  >
                    <MaterialIcons
                      name="gps-fixed"
                      size={20}
                      color={
                        activeFilter === "distance"
                          ? colors.primary
                          : colors.muted
                      }
                    />
                    <Text
                      style={[
                        styles.filterOptionText,
                        { color: colors.foreground },
                        activeFilter === "distance" && {
                          color: colors.primary,
                          fontWeight: "700",
                        },
                      ]}
                    >
                      Mais Próximos
                    </Text>
                    {activeFilter === "distance" && (
                      <MaterialIcons
                        name="check"
                        size={20}
                        color={colors.primary}
                      />
                    )}
                  </Pressable>
                )}

                <Pressable
                  style={[
                    styles.filterOption,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                    },
                    activeFilter === "rating" && {
                      borderColor: colors.primary,
                      backgroundColor: colors.background,
                    },
                  ]}
                  onPress={() => {
                    setActiveFilter("rating");
                    setFilterModalVisible(false);
                  }}
                >
                  <MaterialIcons
                    name="star"
                    size={20}
                    color={
                      activeFilter === "rating" ? colors.primary : colors.muted
                    }
                  />
                  <Text
                    style={[
                      styles.filterOptionText,
                      { color: colors.foreground },
                      activeFilter === "rating" && {
                        color: colors.primary,
                        fontWeight: "700",
                      },
                    ]}
                  >
                    Melhor Avaliação
                  </Text>
                  {activeFilter === "rating" && (
                    <MaterialIcons
                      name="check"
                      size={20}
                      color={colors.primary}
                    />
                  )}
                </Pressable>

                <Pressable
                  style={[
                    styles.filterOption,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                    },
                    activeFilter === "name" && {
                      borderColor: colors.primary,
                      backgroundColor: colors.background,
                    },
                  ]}
                  onPress={() => {
                    setActiveFilter("name");
                    setFilterModalVisible(false);
                  }}
                >
                  <MaterialIcons
                    name="sort-by-alpha"
                    size={20}
                    color={
                      activeFilter === "name" ? colors.primary : colors.muted
                    }
                  />
                  <Text
                    style={[
                      styles.filterOptionText,
                      { color: colors.foreground },
                      activeFilter === "name" && {
                        color: colors.primary,
                        fontWeight: "700",
                      },
                    ]}
                  >
                    Ordem Alfabética (A-Z)
                  </Text>
                  {activeFilter === "name" && (
                    <MaterialIcons
                      name="check"
                      size={20}
                      color={colors.primary}
                    />
                  )}
                </Pressable>

                <Pressable
                  style={[
                    styles.filterOption,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                    },
                    activeFilter === "none" && {
                      borderColor: colors.primary,
                      backgroundColor: colors.background,
                    },
                  ]}
                  onPress={() => {
                    setActiveFilter("none");
                    setFilterModalVisible(false);
                  }}
                >
                  <MaterialIcons
                    name="refresh"
                    size={20}
                    color={
                      activeFilter === "none" ? colors.primary : colors.muted
                    }
                  />
                  <Text
                    style={[
                      styles.filterOptionText,
                      { color: colors.foreground },
                      activeFilter === "none" && {
                        color: colors.primary,
                        fontWeight: "700",
                      },
                    ]}
                  >
                    Padrão (Relevância)
                  </Text>
                  {activeFilter === "none" && (
                    <MaterialIcons
                      name="check"
                      size={20}
                      color={colors.primary}
                    />
                  )}
                </Pressable>
              </View>

              <Pressable
                style={[
                  styles.applyFilterBtn,
                  { backgroundColor: colors.primary },
                ]}
                onPress={() => setFilterModalVisible(false)}
              >
                <Text style={styles.applyFilterBtnText}>Fechar</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* Modal de Seleção de Endereço (Estilo iFood) */}
        <AddressSelectorModal
          visible={regionModalVisible}
          onClose={() => setRegionModalVisible(false)}
        />
      </ScreenContainer>
    </GestureHandlerRootView>
  );
}

// ─── Estilos ─────────────────────────────────────────────────────────────────
// (Estilos extraídos para './index.styles.ts')
