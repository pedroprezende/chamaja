import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
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
  GestureHandlerRootView 
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
import { useAuth } from "@/lib/auth-context";
import { useNotifications } from "@/lib/notifications-context";
import { MigrationManager } from "@/components/MigrationManager";
import { getSubcategories } from "@/data/mock";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { useColors } from "@/hooks/use-colors";
import { useThemeContext } from "@/lib/theme-provider";
import { useLocation } from "@/lib/location-context";
import { calculateHaversineDistance, formatDistancePtBr } from "@/lib/location-utils";
import { useDebounce } from "@/hooks/use-debounce";
import { AnimatedCard } from "@/components/ui/animated-card";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";

// ─── Constantes ──────────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, string> = {
  "reformas-reparos":       "build",
  "assistencia-tecnica":    "settings",
  "servicos-domesticos":    "home",
  "servicos-externos":      "yard",
  "automotivo":             "directions-car",
  "beleza-estetica":        "content-cut",
  "servicos-profissionais": "business-center",
  "saude":                  "local-hospital",
  "eventos":                "celebration",
  "logistica":              "local-shipping",
  "educacao":               "school",
  "comercios":              "storefront",
  "mobilidade":             "commute",
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

function openWhatsApp(phone: string, serviceName: string) {
  let number = phone.replace(/\D/g, "");
  if (!number.startsWith("55")) number = "55" + number;
  const msg = encodeURIComponent(
    `Olá! Vi o serviço "${serviceName}" no ChamaJá e gostaria de mais informações. 😊`
  );
  Linking.openURL(`https://wa.me/${number}?text=${msg}`).catch(() =>
    Alert.alert("WhatsApp não encontrado", "Verifique se o WhatsApp está instalado.")
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

// ─── Prestadores de Destaque Simulados para Fallback ──────────────────────────
const MOCK_PROVIDERS_BY_CAT: Record<string, any[]> = {
  "reformas-reparos": [
    {
      id: "mock-pintor",
      name: "Pintor Profissional",
      category: "Reformas e Reparos",
      subcategoryName: "Pintura",
      categoryId: "reformas-reparos",
      avatarUri: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=200&q=80",
      rating: 4.9,
      ratingCount: 62,
      distance: "1,1 km",
      coverUri: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=300&q=80"
    },
    {
      id: "mock-gesseiro",
      name: "Gesseiro Express",
      category: "Reformas e Reparos",
      subcategoryName: "Gesso",
      categoryId: "reformas-reparos",
      avatarUri: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=200&q=80",
      rating: 4.8,
      ratingCount: 45,
      distance: "2,3 km",
      coverUri: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=300&q=80"
    },
    {
      id: "mock-vidraceiro",
      name: "Vidraçaria Silva",
      category: "Reformas e Reparos",
      subcategoryName: "Vidraçaria",
      categoryId: "reformas-reparos",
      avatarUri: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=200&q=80",
      rating: 4.7,
      ratingCount: 38,
      distance: "1,7 km",
      coverUri: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=300&q=80"
    }
  ],
  "servicos-externos": [
    {
      id: "mock-jardineiro",
      name: "Jardins & Cia",
      category: "Serviços Externos",
      subcategoryName: "Jardinagem",
      categoryId: "servicos-externos",
      avatarUri: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=200&q=80",
      rating: 4.9,
      ratingCount: 88,
      distance: "0,9 km",
      coverUri: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=300&q=80"
    },
    {
      id: "mock-piscineiro",
      name: "Limpeza de Piscina Azul",
      category: "Serviços Externos",
      subcategoryName: "Piscineiro",
      categoryId: "servicos-externos",
      avatarUri: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=200&q=80",
      rating: 4.8,
      ratingCount: 29,
      distance: "1,5 km",
      coverUri: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=300&q=80"
    }
  ],
  "servicos-domesticos": [
    {
      id: "mock-diarista",
      name: "Diarista Brilho Único",
      category: "Serviços Domésticos",
      subcategoryName: "Limpeza",
      categoryId: "servicos-domesticos",
      avatarUri: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=200&q=80",
      rating: 5.0,
      ratingCount: 104,
      distance: "1,4 km",
      coverUri: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=300&q=80"
    },
    {
      id: "mock-passadeira",
      name: "Passadeira Elegante",
      category: "Serviços Domésticos",
      subcategoryName: "Passadeira",
      categoryId: "servicos-domesticos",
      avatarUri: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200&q=80",
      rating: 4.7,
      ratingCount: 19,
      distance: "2,0 km",
      coverUri: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300&q=80"
    }
  ],
  "assistencia-tecnica": [
    {
      id: "mock-celulares",
      name: "Tech Smart Assistência",
      category: "Assistência Técnica",
      subcategoryName: "Celulares",
      categoryId: "assistencia-tecnica",
      avatarUri: "https://images.unsplash.com/photo-1546054454-aa26e2b734c7?w=200&q=80",
      rating: 4.7,
      ratingCount: 78,
      distance: "1,5 km",
      coverUri: "https://images.unsplash.com/photo-1546054454-aa26e2b734c7?w=300&q=80"
    },
    {
      id: "mock-refri",
      name: "Refrigeração Norte",
      category: "Assistência Técnica",
      subcategoryName: "Eletrodomésticos",
      categoryId: "assistencia-tecnica",
      avatarUri: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=200&q=80",
      rating: 4.6,
      ratingCount: 42,
      distance: "3,1 km",
      coverUri: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=300&q=80"
    }
  ],
  "beleza-estetica": [
    {
      id: "mock-manicure",
      name: "Espaço Unhas de Diva",
      category: "Beleza e Estética",
      subcategoryName: "Manicure",
      categoryId: "beleza-estetica",
      avatarUri: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=200&q=80",
      rating: 4.9,
      ratingCount: 112,
      distance: "0,5 km",
      coverUri: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=300&q=80"
    },
    {
      id: "mock-sobrancelhas",
      name: "Cílios & Sobrancelhas",
      category: "Beleza e Estética",
      subcategoryName: "Estética",
      categoryId: "beleza-estetica",
      avatarUri: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200&q=80",
      rating: 4.8,
      ratingCount: 56,
      distance: "1,2 km",
      coverUri: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300&q=80"
    }
  ]
};

function getMockProvidersForCategory(categoryId: string): any[] {
  return MOCK_PROVIDERS_BY_CAT[categoryId] || [];
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const { ads, isLoading: adsLoading } = useAds(true);

  const { colorScheme, setColorScheme } = useThemeContext();
  const { coords } = useLocation();



  const isAdmin = user?.role === "admin";
  const firstName = user?.name?.split(" ")[0] || "você";

  // ── Serviços via tRPC (banco real) ──
  const { data: dbServices = [], isLoading: loadingServices, refetch: refetchServices } = trpc.services.list.useQuery(undefined, { refetchOnMount: true });
  const { data: dbProviders = [], isLoading: loadingProviders } = trpc.providers.list.useQuery(undefined, { refetchOnMount: true });

  const services = React.useMemo<Service[]>(() =>
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
    }))
  , [dbServices]);

  const loadServices = useCallback(() => { refetchServices(); }, [refetchServices]);

  const createServiceMutation = trpc.services.create.useMutation({ onSuccess: () => refetchServices() });
  const updateServiceMutation = trpc.services.update.useMutation({ onSuccess: () => refetchServices() });
  const deleteServiceMutation = trpc.services.delete.useMutation({ onSuccess: () => refetchServices() });
  const reorderServicesMutation = trpc.services.reorder.useMutation();
  const reorderCategoriesMutation = trpc.categories.reorder.useMutation({
    onSuccess: () => {
      trpc.useContext().categories.list.invalidate();
    }
  });

  // ── Categorias via tRPC ──
  const { data: dbCategories = [], isLoading: loadingCats } = trpc.categories.list.useQuery();
  const { data: dbSubcategories = [] } = trpc.categories.subServices.listAll.useQuery();

  const featuredProviders = React.useMemo(() => {
    const list = dbProviders.filter((p) => p.destaque && p.isActive);
    if (list.length > 0) return list;
    // Fallback: use first few active providers
    return dbProviders.filter((p) => p.isActive).slice(0, 3);
  }, [dbProviders]);

  const popularSubcategories = React.useMemo(() => {
    const popularNames = ["encanador", "eletricista", "chaveiro", "motoboy", "ar condicionado", "pintor", "diarista"];
    const list = dbSubcategories.filter(sub => 
      popularNames.some(name => sub.name.toLowerCase().includes(name))
    );
    if (list.length > 0) return list.slice(0, 6);
    return dbSubcategories.slice(0, 6);
  }, [dbSubcategories]);

  const nearbyCount = React.useMemo(() => {
    return dbProviders.filter(p => p.isActive).length || 247;
  }, [dbProviders]);

  const renderProviderCard = useCallback((item: any, index: number, isFeatured: boolean = false) => {
    let distanceText = "";
    if (coords && item.latitude !== null && item.longitude !== null && item.latitude !== undefined && item.longitude !== undefined) {
      const distKm = calculateHaversineDistance(
        coords.latitude,
        coords.longitude,
        Number(item.latitude),
        Number(item.longitude)
      );
      distanceText = formatDistancePtBr(distKm).replace(" de você", "");
    } else {
      distanceText = item.distance || `${(1.0 + (index * 0.4)).toFixed(1).replace(".", ",")} km`;
    }

    const isMock = String(item.id).startsWith("mock-");

    return (
      <Pressable
        key={item.id}
        style={[
          styles.featuredCard,
          { backgroundColor: colors.surface, borderColor: colors.border }
        ]}
        onPress={() => {
          if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          if (isMock) {
            router.push({
              pathname: "/categories/[section]",
              params: { section: item.categoryId || "reformas-reparos", title: item.category }
            } as any);
          } else {
            router.push(`/professional/${item.id}` as any);
          }
        }}
      >
        <View style={styles.featuredImageWrapper}>
          <Image
            source={{ uri: item.coverUri || item.avatarUri || "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=300&q=80" }}
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
            <Text style={[styles.featuredName, { color: colors.foreground }]} numberOfLines={1}>
              {item.name}
            </Text>
            {(item.isVerified || isMock) && (
              <MaterialIcons name="verified" size={14} color="#22C55E" />
            )}
          </View>

          <Text style={[styles.featuredSub, { color: colors.discreto }]} numberOfLines={1}>
            {item.subcategoryName || item.category || "Profissional"} • {distanceText}
          </Text>

          <View style={styles.featuredBottom}>
            <View style={styles.ratingRow}>
              <MaterialIcons name="star" size={14} color="#FBBF24" />
              <Text style={[styles.ratingText, { color: colors.foreground }]}>
                {Number(item.rating || 5.0).toFixed(1)} ({item.ratingCount || 0})
              </Text>
            </View>
            <View style={[styles.abertoBadge, { 
              backgroundColor: colorScheme === "dark" ? "rgba(34, 197, 94, 0.15)" : "#DCFCE7" 
            }]}>
              <Text style={[styles.abertoText, { 
                color: colorScheme === "dark" ? "#22C55E" : "#15803D" 
              }]}>Aberto</Text>
            </View>
          </View>
        </View>
      </Pressable>
    );
  }, [coords, colors, colorScheme, router]);

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
  const [activeFilter, setActiveFilter] = useState<'rating' | 'name' | 'none'>('none');
  const [suggestionInput, setSuggestionInput] = useState("");
  const [suggestionOffset, setSuggestionOffset] = useState(0);
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
      if (clean.length < 2 || clean === "de" || clean === "o" || clean === "a") return;
      
      setLocalRecentSearches((prev) => {
        const filtered = prev.filter((q) => q !== clean);
        const updated = [clean, ...filtered].slice(0, 5);
        AsyncStorage.setItem("@chamaja_recent_searches", JSON.stringify(updated)).catch(console.error);
        return updated;
      });
    } catch (e) {
      console.error("Erro ao salvar busca local:", e);
    }
  };

  const toggleEditMode = useCallback(() => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
      Alert.alert("Permissão necessária", "Permita o acesso à galeria nas configurações.");
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
      const uri = (Platform.OS === "web" && asset.base64) ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
      setForm((f) => ({ ...f, imageUri: uri }));
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!form.name.trim()) { Alert.alert("Atenção", "Informe o nome do serviço."); return; }
    if (!form.categoryId) { Alert.alert("Atenção", "Selecione uma categoria."); return; }
    setSaving(true);
    try {
      // Upload da imagem para o Supabase Storage se for local
      let finalImageUri = form.imageUri;
      if (form.imageUri && !form.imageUri.startsWith("http")) {
        const uploadedUrl = await storage.uploadImage(form.imageUri);
        if (uploadedUrl) finalImageUri = uploadedUrl;
      }

      const catName = dbCategories.find((c: any) => c.id === form.categoryId)?.name?.replace("\n", " ") || form.categoryId;
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
      const subcatObj = dbSubcategories.find(s => s.id === form.subcategoryId);
      const subcatName = subcatObj ? subcatObj.name : (form.subcategoryId || undefined);

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
  }, [form, editingService, dbCategories, dbSubcategories, createServiceMutation, updateServiceMutation]);

  const handleDelete = useCallback((svc: Service) => {
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
      ]
    );
  }, [deleteServiceMutation]);

  // ── Drag-and-drop ──
  const handleDragEnd = useCallback(async ({ data }: { data: Service[] }) => {
    reorderServicesMutation.mutate({ ids: data.map((s) => s.id) });
  }, [reorderServicesMutation]);

  const debouncedSearch = useDebounce(homeSearchQuery, 500);

  // Busca global via tRPC (Real-time DB)
  const { data: searchResults = [], isLoading: searching } = trpc.providers.search.useQuery(
    debouncedSearch,
    { enabled: debouncedSearch.length > 1 }
  );

  const trackSearchMutation = trpc.analytics.trackSearch.useMutation();

  useEffect(() => {
    if (debouncedSearch.length > 1) {
      trackSearchMutation.mutate({ query: debouncedSearch, userId: user?.id || undefined });
      saveSearchLocally(debouncedSearch);
    }
  }, [debouncedSearch]);

  // ── Sugestões para Você (Dinâmico e Conectado ao Banco com Recomendações) ──
  const suggestions = React.useMemo(() => {
    // 1. Filtrar as subcategorias que batem com as pesquisas locais recentes do usuário
    const matchingSubs: typeof dbSubcategories = [];
    if (localRecentSearches.length > 0) {
      dbSubcategories.forEach((sub) => {
        const name = sub.name.toLowerCase();
        const matches = localRecentSearches.some((q) => {
          return name.includes(q) || q.includes(name);
        });
        if (matches) {
          matchingSubs.push(sub);
        }
      });
    }

    // 2. Filtrar as subcategorias que possuem pelo menos 1 prestador ativo no banco (evitando duplicadas)
    const availableSubs = dbSubcategories.filter((sub) => {
      if (matchingSubs.some((m) => m.id === sub.id)) return false;

      return dbProviders.some((prov) => {
        if (!prov.subcategoryId) return false;
        const ids = prov.subcategoryId.split(",").map(id => id.trim()).filter(Boolean);
        return ids.includes(sub.id);
      });
    });

    // 3. Fallbacks populares se não houver disponíveis suficientes (evitando duplicadas)
    const fallbackSubs = dbSubcategories.filter(sub => {
      if (matchingSubs.some((m) => m.id === sub.id) || availableSubs.some((a) => a.id === sub.id)) return false;

      return sub.name.includes("Manicure") || 
        sub.name.includes("Pintor") || 
        sub.name.includes("Eletricista") || 
        sub.name.includes("Encanador") ||
        sub.name.includes("Mecânico") ||
        sub.name.includes("Diarista");
    });

    // Unir as listas priorizando as recomendações personalizadas no topo!
    const merged = [...matchingSubs, ...availableSubs, ...fallbackSubs];

    // Rotacionar sugestões com base no offset selecionado pelo usuário
    const sliced = [];
    for (let i = 0; i < 3; i++) {
      const idx = (suggestionOffset + i) % (merged.length || 1);
      if (merged[idx]) sliced.push(merged[idx]);
    }

    return sliced.map((sub, idx) => {
      // Notas e avaliações realistas
      const subProviders = dbProviders.filter(prov => {
        if (!prov.subcategoryId) return false;
        const ids = prov.subcategoryId.split(",").map(id => id.trim()).filter(Boolean);
        return ids.includes(sub.id);
      });

      // 1. Encontrar prestador real com foto nesta subcategoria
      const providerWithAvatar = subProviders.find(p => p.avatarUri && p.avatarUri.startsWith("http"));
      
      // 2. Definir imagem:
      //   - Prioridade 1: avatar do prestador real
      //   - Prioridade 2: imagem oficial da subcategoria/serviço
      //   - Prioridade 3: Imagem linda e contextualizada de fallback
      let finalImageUrl = providerWithAvatar?.avatarUri || sub.imageUrl || "";

      if (!finalImageUrl) {
        const name = sub.name.toLowerCase();
        if (name.includes("mecanico") || name.includes("carro") || name.includes("auto")) {
          finalImageUrl = "https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=200&q=80";
        } else if (name.includes("jardim") || name.includes("jardineiro") || name.includes("poda")) {
          finalImageUrl = "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=200&q=80";
        } else if (name.includes("piscina") || name.includes("piscineiro") || name.includes("limpar piscina")) {
          finalImageUrl = "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=200&q=80";
        } else if (name.includes("manicure") || name.includes("pedicure") || name.includes("unha")) {
          finalImageUrl = "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=200&q=80";
        } else if (name.includes("sobrancelha") || name.includes("estetica") || name.includes("cilios")) {
          finalImageUrl = "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200&q=80";
        } else if (name.includes("eletricista") || name.includes("energia") || name.includes("luz")) {
          finalImageUrl = "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=200&q=80";
        } else if (name.includes("encanador") || name.includes("agua") || name.includes("tubo")) {
          finalImageUrl = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&q=80";
        } else if (name.includes("pintor") || name.includes("tinta")) {
          finalImageUrl = "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=200&q=80";
        } else if (name.includes("faxina") || name.includes("diarista") || name.includes("limpeza")) {
          finalImageUrl = "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=200&q=80";
        } else {
          finalImageUrl = "https://images.unsplash.com/photo-1521791136366-3e553771295d?w=200&q=80";
        }
      }

      const avgRating = subProviders.length > 0 
        ? parseFloat((subProviders.reduce((acc, p) => acc + (p.rating || 0), 0) / subProviders.length).toFixed(1))
        : parseFloat((4.7 + (idx * 0.1)).toFixed(1));

      const reviewsCount = subProviders.length > 0
        ? subProviders.length * 15 + Math.floor(Math.random() * 5)
        : 85 + (idx * 23);

      return {
        ...sub,
        imageUri: finalImageUrl,
        rating: avgRating,
        reviewsCount,
      };
    });
  }, [dbSubcategories, dbProviders, suggestionOffset, localRecentSearches]);

  const suggestionsSubtitle = React.useMemo(() => {
    return localRecentSearches.length > 0
      ? "Recomendado com base nas suas pesquisas recentes"
      : "Baseado no que é mais buscado na sua região";
  }, [localRecentSearches]);

  const handleNextSuggestions = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSuggestionOffset(prev => prev + 3);
  };

  const handleSubmitSuggestion = () => {
    if (!suggestionInput.trim()) return;
    
    // Rastrear sugestão como pesquisa
    trackSearchMutation.mutate({
      query: `[SUGESTÃO]: ${suggestionInput.trim()}`,
      userId: user?.id || undefined
    });

    const userCity = (user as any)?.city || "sua cidade";
    if (Platform.OS === "web") {
      window.alert(`Sugestão enviada! Obrigado por ajudar o ChamaJá a crescer em ${userCity}! 💚`);
    } else {
      Alert.alert("Sugestão enviada", `Obrigado por ajudar o ChamaJá a crescer em ${userCity}! 💚`);
    }
    setSuggestionInput("");
  };

  // Filtrar serviços administrativos também para busca global
  const filteredServices = React.useMemo(() => {
    if (!homeSearchQuery.trim()) return services;
    const q = homeSearchQuery.toLowerCase();
    return services.filter(s => 
      s.name.toLowerCase().includes(q) || 
      s.category.toLowerCase().includes(q) ||
      s.description?.toLowerCase().includes(q)
    );
  }, [services, homeSearchQuery]);

  // Combinar resultados: Prestadores do banco + Serviços administrativos
  const globalResults = React.useMemo(() => {
    if (!homeSearchQuery.trim()) return [];
    
    // Mapear prestadores para o formato de exibição
    const providers = searchResults.map(p => {
      const specialty = dbSubcategories.find(s => s.id === p.subcategoryId);
      return {
        id: p.id,
        name: p.name,
        category: p.category || "Profissional",
        description: p.description || "",
        imageUri: p.avatarUri || specialty?.imageUrl || undefined,
        type: "PROVIDER" as const,
        rating: p.rating || 0,
      };
    });

    // Mapear serviços
    const svcs = filteredServices.map(s => ({
      id: s.id,
      name: s.name,
      category: s.category,
      description: s.description || "",
      imageUri: s.imageUri || undefined,
      type: "SERVICE" as const,
      rating: 5, // Serviços do admin são considerados "premium/nota máxima"
    }));

    let results = [...svcs, ...providers];

    // Aplicar Filtros
    if (activeFilter === 'rating') {
      results.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (activeFilter === 'name') {
      results.sort((a, b) => a.name.localeCompare(b.name));
    }

    return results;
  }, [searchResults, filteredServices, homeSearchQuery, dbSubcategories, activeFilter]);

  // ── Drag-and-drop Categorias ──
  const handleCategoryDragEnd = useCallback(async ({ data }: { data: any[] }) => {
    reorderCategoriesMutation.mutate({ ids: data.map((c) => c.id) });
  }, [reorderCategoriesMutation]);

  // ── Render Bloco de Categoria (Draggable) ──
  const renderCategoryBlock = useCallback(({ item: cat, drag, isActive, index }: any) => {
    // 1. Filtrar prestadores reais ativos da categoria
    const catProviders = dbProviders.filter(p => p.categoryId === cat.id && p.isActive);
    
    // 2. Fallback para prestadores simulados caso não haja no banco real
    let displayList = catProviders;
    if (displayList.length === 0) {
      displayList = getMockProvidersForCategory(cat.id);
    }
    
    const content = (
      <Pressable
        onLongPress={editMode ? drag : undefined}
        style={[
          styles.categoryBlock,
          { backgroundColor: "transparent" },
          isActive && { backgroundColor: colors.background, borderRadius: 16, paddingVertical: 10 }
        ]}
      >
        <View style={styles.categoryHeaderVertical}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              {editMode && <MaterialIcons name="drag-indicator" size={18} color={colors.muted} />}
              <Text style={[styles.categoryTitleVertical, { color: colors.foreground }]}>{cat.name.replace("\n", " ")}</Text>
            </View>
          </View>
          <Pressable onPress={() => !editMode && router.push(`/categories/${cat.id}` as any)}>
            <Text style={[styles.seeAllText, { color: colors.primary }]}>Ver todos</Text>
          </Pressable>
        </View>
        {displayList.length > 0 ? (
          <FlatList
            data={displayList}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.subCatList}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index: pIndex }) => renderProviderCard(item, pIndex, false)}
          />
        ) : (
          <View style={[styles.emptySubCat, { backgroundColor: colors.background, borderRadius: 12 }]}>
            <Text style={[styles.emptySubCatText, { color: colors.muted }]}>Nenhum profissional disponível.</Text>
          </View>
        )}
      </Pressable>
    );

    return (
      <Animated.View entering={FadeInDown.delay(index * 100).duration(600)}>
        {drag ? <ScaleDecorator>{content}</ScaleDecorator> : content}
      </Animated.View>
    );
  }, [dbProviders, editMode, router, colors, colorScheme, coords, renderProviderCard]);

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
              style={({ pressed }) => [styles.whatsappMiniBtn, pressed && { opacity: 0.7 }]}
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
                <MaterialIcons name="drag-indicator" size={18} color="#6B7280" />
              </Pressable>
              <View style={styles.editActions}>
                <Pressable
                  style={({ pressed }) => [styles.editBtn, pressed && { opacity: 0.7 }]}
                  onPress={() => openEdit(item)}
                >
                  <MaterialIcons name="edit" size={14} color="#FFFFFF" />
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.7 }]}
                  onPress={() => handleDelete(item)}
                >
                  <MaterialIcons name="delete" size={14} color="#FFFFFF" />
                </Pressable>
              </View>
            </View>
          )}
        </View>
      );

      return typeof drag === "function" ? <ScaleDecorator>{content}</ScaleDecorator> : content;
    },
    [editMode, openEdit, handleDelete, router]
  );

  // ── Render card (modo normal: FlatList simples) ──
  const renderNormalCard = useCallback(
    (item: Service) => (
      <Pressable
        key={item.id}
        style={({ pressed }) => [styles.adminServiceCard, pressed && { opacity: 0.85 }]}
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
            style={({ pressed }) => [styles.whatsappMiniBtn, pressed && { opacity: 0.7 }]}
            onPress={() => openWhatsApp(item.whatsapp!, item.name)}
          >
            <MaterialIcons name="chat" size={14} color="#FFFFFF" />
          </Pressable>
        )}
      </Pressable>
    ),
    [router]
  );

  // ── Render Item para a lista principal (Categorias) ──
  const renderHomeItem = useCallback(({ item, index }: any) => {
    return renderCategoryBlock({ item, index, drag: undefined, isActive: false });
  }, [renderCategoryBlock]);

  // ── Skeleton Loader para melhor UX ──
  const HomeSkeleton = () => (
    <View style={{ padding: 16, gap: 20 }}>
      <Skeleton style={{ height: 180, borderRadius: 20 }} />
      <View style={{ flexDirection: "row", gap: 12 }}>
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} style={{ width: 70, height: 90, borderRadius: 16 }} />
        ))}
      </View>
      <Skeleton style={{ height: 200, borderRadius: 24 }} />
    </View>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenContainer style={{ backgroundColor: colors.background }} edges={["top", "left", "right"]}>
        <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
        {/* MigrationManager temporarily removed to debug UI hang */}
      {/* <MigrationManager /> */}
        
        {/* Header Fixo */}
        <View style={[styles.header, { backgroundColor: colors.background, borderBottomWidth: 0, paddingBottom: 8 }]}>
          <View style={styles.headerLeftContainer}>
            {/* Avatar do Usuário */}
            <View style={[styles.avatarHeaderWrapper, { borderColor: "#22C55E", borderWidth: 2 }]}>
              <Image
                source={{ uri: (user as any)?.avatarUri || "https://images.unsplash.com/photo-1552728089-57bdde30ebd3?w=100&q=80" }}
                style={styles.avatarHeader}
              />
            </View>
            <View style={styles.headerTitleContainer}>
              <Text style={[styles.greeting, { color: colors.foreground }]} numberOfLines={1}>Olá, {firstName}!</Text>
              <View style={styles.locationContainer}>
                <MaterialIcons name="location-on" size={14} color="#22C55E" />
                <Text style={[styles.locationText, { color: colors.foreground }]} numberOfLines={1}>
                  Bragança Paulista - SP
                </Text>
                <MaterialIcons name="keyboard-arrow-down" size={14} color={colors.foreground} />
              </View>
              <Text style={[styles.nearbySummaryText, { color: colors.discreto }]}>
                Encontramos <Text style={{ color: "#22C55E", fontWeight: "700" }}>{nearbyCount}</Text> profissionais próximos
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
                <MaterialIcons name="notifications-none" size={24} color={colors.foreground} />
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
        <View style={[styles.searchRow, { backgroundColor: colors.background, paddingBottom: 12 }]}>
          <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
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
            {searching && <ActivityIndicator size="small" color={colors.primary} />}
          </View>
          <Pressable
            style={[styles.filterBtn, { backgroundColor: "transparent", borderColor: "#22C55E", borderWidth: 1 }]}
            onPress={() => setFilterModalVisible(true)}
          >
            <MaterialIcons name="tune" size={20} color="#22C55E" />
            <Text style={[styles.filterBtnText, { color: "#22C55E" }]}>Filtros</Text>
            {activeFilter !== "none" && <View style={[styles.filterActiveDot, { backgroundColor: "#22C55E" }]} />}
          </Pressable>
        </View>

        {/* Conteúdo Principal Virtualizado */}
        {homeSearchQuery.length > 0 ? (
          /* Lista de Resultados da Busca */
          <FlatList
            data={globalResults}
            keyExtractor={(item) => `${item.type}-${item.id}`}
            contentContainerStyle={{ padding: 16, gap: 12 }}
            renderItem={({ item, index }) => (
              <Animated.View entering={FadeInDown.delay(index * 50).duration(400)}>
                <Pressable
                style={({ pressed }) => [
                  styles.verticalServiceCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] }
                ]}
                onPress={() => {
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push({
                    pathname: "/professional/[id]",
                    params: { id: item.id }
                  } as any);
                }}
              >
                <View style={styles.verticalCardContent}>
                  {item.imageUri ? (
                    <Image source={{ uri: item.imageUri }} style={styles.verticalCardImage} />
                  ) : (
                    <View style={[styles.verticalCardIconBg, { backgroundColor: colors.background }]}>
                      <MaterialIcons 
                        name={(item.type === "SERVICE" ? getAdminIcon(item.category) : "person") as any} 
                        size={24} 
                        color={colors.primary} 
                      />
                    </View>
                  )}
                  <View style={styles.verticalCardInfo}>
                    <Text style={[styles.verticalCardName, { color: colors.foreground }]}>{item.name}</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <Text style={[styles.verticalCardCategory, { color: colors.primary }]}>{item.category}</Text>
                      <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
                      <Text style={{ fontSize: 11, color: colors.muted }}>
                        {item.type === "SERVICE" ? "Serviço" : "Profissional"}
                      </Text>
                    </View>
                    {item.description && (
                      <Text style={[styles.verticalCardDesc, { color: colors.muted }]} numberOfLines={1}>
                        {item.description}
                      </Text>
                    )}
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color={colors.muted} />
                </View>
              </Pressable>
            </Animated.View>
          )}
            ListEmptyComponent={
              searching ? (
                <View style={{ padding: 20 }}>{[1, 2, 3].map(i => <Skeleton key={i} style={{ height: 80, marginBottom: 12, borderRadius: 16 }} />)}</View>
              ) : (
                <View style={styles.emptySearchLarge}>
                  <MaterialIcons name="search-off" size={48} color={colors.muted} />
                  <Text style={[styles.emptySearchTitle, { color: colors.foreground }]}>Nenhum resultado</Text>
                  <Text style={[styles.emptySearchSub, { color: colors.muted }]}>Não encontramos nada para "{homeSearchQuery}"</Text>
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
            removeClippedSubviews={Platform.OS === 'android'}
            initialNumToRender={3}
            maxToRenderPerBatch={5}
            windowSize={10}
            refreshing={loadingServices || loadingCats}
            onRefresh={loadServices}
            ListHeaderComponent={
              <View style={{ gap: 8 }}>
                {/* 1. Carrossel de Anúncios no Topo */}
                <View style={{ marginTop: 12, marginBottom: 8, paddingHorizontal: 16 }}>
                  <AdsCarousel ads={ads} />
                </View>

                 {/* 2. Categorias Rápidas */}
                <View style={{ marginTop: 8 }}>
                  <View style={styles.sectionWrapper}>
                    <View style={styles.sectionHeader}>
                      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Categorias</Text>
                      <Pressable onPress={() => router.push("/search" as any)}>
                        <Text style={[styles.seeAllText, { color: colors.primary }]}>Ver todas</Text>
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
                          if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          router.push({
                            pathname: "/categories/[section]",
                            params: { section: cat.id, title: cat.name.replace("\n", " ") }
                          } as any);
                        }}
                      >
                        <View style={[styles.quickCatIconBg, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                          <MaterialIcons name={CATEGORY_ICONS[cat.id] as any || "build"} size={28} color="#22C55E" />
                        </View>
                        <Text style={[styles.quickCatLabel, { color: colors.foreground }]} numberOfLines={2}>
                          {cat.name.replace("\n", " ")}
                        </Text>
                      </Pressable>
                    ))}
                    {/* Botão extra Mais Categorias */}
                    <Pressable
                      style={styles.quickCatBtn}
                      onPress={() => {
                        if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.push("/search" as any);
                      }}
                    >
                      <View style={[styles.quickCatIconBg, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <MaterialIcons name="more-horiz" size={28} color="#22C55E" />
                      </View>
                      <Text style={[styles.quickCatLabel, { color: colors.foreground }]} numberOfLines={2}>
                        Mais Categorias
                      </Text>
                    </Pressable>
                  </ScrollView>
                </View>

                {/* 3. Destaques para você */}
                <View style={{ marginTop: 16 }}>
                  <View style={styles.sectionWrapper}>
                    <View style={styles.sectionHeader}>
                      <View style={styles.sectionTitleRow}>
                        <MaterialIcons name="star" size={20} color="#FBBF24" />
                        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Destaques para você</Text>
                      </View>
                      <Pressable onPress={() => router.push("/search" as any)}>
                        <Text style={[styles.seeAllText, { color: colors.primary }]}>Ver todos</Text>
                      </Pressable>
                    </View>
                  </View>
                  {loadingProviders ? (
                    <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} />
                  ) : (
                    <FlatList
                      data={featuredProviders}
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ paddingHorizontal: 16, gap: 12, paddingBottom: 10 }}
                      keyExtractor={(item) => item.id}
                      renderItem={({ item, index }) => renderProviderCard(item, index, true)}
                    />
                  )}
                </View>

                {/* 4. Mais procurados hoje */}
                <View style={{ marginTop: 16, marginBottom: 8 }}>
                  <View style={styles.sectionWrapper}>
                    <View style={styles.sectionHeader}>
                      <View style={styles.sectionTitleRow}>
                        <MaterialIcons name="local-fire-department" size={20} color="#FF4500" />
                        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Mais procurados hoje</Text>
                      </View>
                      <Pressable onPress={() => router.push("/search" as any)}>
                        <Text style={[styles.seeAllText, { color: colors.primary }]}>Ver todos</Text>
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
                        const ids = p.subcategoryId.split(",").map(id => id.trim()).filter(Boolean);
                        return ids.includes(item.id);
                      }).length;
                      
                      const countText = count > 0 ? `${count} por perto` : "Ver profissionais";

                      const lowerName = item.name.toLowerCase();
                      let iconName = "build";
                      if (lowerName.includes("encanador")) iconName = "plumbing";
                      else if (lowerName.includes("eletricista")) iconName = "flash-on";
                      else if (lowerName.includes("chaveiro")) iconName = "vpn-key";
                      else if (lowerName.includes("motoboy") || lowerName.includes("entrega")) iconName = "motorcycle";
                      else if (lowerName.includes("ar condicionado") || lowerName.includes("refrigera")) iconName = "ac-unit";
                      else if (lowerName.includes("pintor")) iconName = "format-paint";
                      else if (lowerName.includes("diarista") || lowerName.includes("limpeza")) iconName = "cleaning-services";

                      return (
                        <Pressable
                          style={[
                            styles.popularPill,
                            { backgroundColor: colors.surface, borderColor: colors.border }
                          ]}
                          onPress={() => {
                            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setHomeSearchQuery(item.name);
                          }}
                        >
                          <View style={[styles.popularIconBg, { backgroundColor: colors.background }]}>
                            <MaterialIcons name={iconName as any} size={20} color={colors.primary} />
                          </View>
                          <View>
                            <Text style={[styles.popularName, { color: colors.foreground }]}>{item.name}</Text>
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
            ListFooterComponent={
              <View style={styles.suggestionsContainer}>
                {/* Header */}
                <View style={styles.suggestionsHeader}>
                  <MaterialIcons name="auto-awesome" size={20} color="#059669" />
                  <Text style={styles.suggestionsTitle}>Sugestões para você</Text>
                  <MaterialIcons name="auto-awesome" size={20} color="#059669" />
                </View>
                <Text style={styles.suggestionsSubtitle}>{suggestionsSubtitle}</Text>

                {/* Items */}
                {suggestions.map((item) => (
                  <Pressable
                    key={item.id}
                    style={styles.suggestionCard}
                    onPress={() => {
                      if (Platform.OS !== "web") {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                      setHomeSearchQuery(item.name);
                    }}
                  >
                    <Image
                      source={{ uri: item.imageUri }}
                      style={styles.suggestionImage}
                    />
                    <View style={styles.suggestionInfo}>
                      <Text style={styles.suggestionName}>{item.name}</Text>
                      <View style={styles.suggestionMetaRow}>
                        <MaterialIcons name="star" size={14} color="#FBBF24" />
                        <Text style={styles.suggestionMetaText}>
                          {item.rating.toFixed(1)} • {item.reviewsCount} {item.reviewsCount === 1 ? "avaliação" : "avaliações"}
                        </Text>
                      </View>
                    </View>
                    <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
                  </Pressable>
                ))}

                {/* Ver mais sugestões button */}
                <Pressable
                  style={({ pressed }) => [
                    styles.moreSuggestionsBtn,
                    pressed && { opacity: 0.8 }
                  ]}
                  onPress={handleNextSuggestions}
                >
                  <Text style={styles.moreSuggestionsText}>Ver mais sugestões</Text>
                </Pressable>

                {/* Dotted suggestion box */}
                <View style={styles.feedbackContainer}>
                  <View style={styles.feedbackHeader}>
                    <View style={styles.feedbackIconBg}>
                      <MaterialIcons name="rate-review" size={18} color="#FFFFFF" />
                    </View>
                    <View style={styles.feedbackHeaderText}>
                      <Text style={styles.feedbackTitle}>Não encontrou o que precisa?</Text>
                      <Text style={styles.feedbackSubtitle}>Sugira um serviço para a sua cidade</Text>
                    </View>
                  </View>

                  <View style={styles.feedbackForm}>
                    <TextInput
                      style={styles.feedbackInput}
                      placeholder="Ex: Fotógrafo, DJ, Pintor..."
                      placeholderTextColor="#9CA3AF"
                      value={suggestionInput}
                      onChangeText={setSuggestionInput}
                    />
                    <Pressable
                      style={({ pressed }) => [
                        styles.feedbackSubmitBtn,
                        pressed && { opacity: 0.9 }
                      ]}
                      onPress={handleSubmitSuggestion}
                    >
                      <Text style={styles.feedbackSubmitText}>Enviar</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            }
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
            <Pressable style={styles.modalBackdrop} onPress={() => setModalVisible(false)} />
            <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
              <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                  {editingService ? "Editar Serviço" : "Novo Serviço"}
                </Text>

                {/* Nome */}
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Nome do serviço *</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
                  value={form.name}
                  onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
                  placeholder="Ex: Eletricista residencial"
                  placeholderTextColor={colors.muted}
                  returnKeyType="done"
                />

                {/* Categoria */}
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Categoria *</Text>
                <Pressable
                  style={[styles.dropdownTrigger, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={() => setCatDropOpen((v) => !v)}
                >
                  <Text style={[styles.dropdownTriggerText, { color: colors.foreground }, !form.categoryId && { color: colors.muted }]}>
                    {form.categoryId
                      ? dbCategories.find((c) => c.id === form.categoryId)?.name.replace("\n", " ") || form.categoryId
                      : "Selecionar Categoria"}
                  </Text>
                  <MaterialIcons
                    name={catDropOpen ? "keyboard-arrow-up" : "keyboard-arrow-down"}
                    size={20}
                    color={colors.muted}
                  />
                </Pressable>
                {catDropOpen && (
                  <View style={[styles.dropdownList, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false} style={{ maxHeight: 220 }}>
                      {dbCategories.map((cat) => (
                        <Pressable
                          key={cat.id}
                          style={({ pressed }) => [
                            styles.dropdownItem,
                            form.categoryId === cat.id && styles.dropdownItemSelected,
                            { backgroundColor: form.categoryId === cat.id ? colors.background : colors.surface },
                            pressed && { backgroundColor: colors.background },
                          ]}
                          onPress={() => {
                            setForm((f) => ({ ...f, categoryId: cat.id, subcategoryId: "" }));
                            setCatDropOpen(false);
                          }}
                        >
                          <MaterialIcons
                            name={CATEGORY_ICONS[cat.id] as any}
                            size={16}
                            color={form.categoryId === cat.id ? colors.primary : colors.muted}
                          />
                          <Text style={[
                            styles.dropdownItemText,
                            { color: colors.foreground },
                            form.categoryId === cat.id && { color: colors.primary, fontWeight: "700" },
                          ]}>
                            {cat.name.replace("\n", " ")}
                          </Text>
                          {form.categoryId === cat.id && (
                            <MaterialIcons name="check" size={16} color={colors.primary} />
                          )}
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* Especialidade (Opcional) */}
                {form.categoryId && (
                  <>
                    <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Especialidade (Opcional)</Text>
                    <Pressable
                      style={[styles.dropdownTrigger, { backgroundColor: colors.background, borderColor: colors.border }]}
                      onPress={() => setSubCatDropOpen((v) => !v)}
                    >
                      <Text style={[styles.dropdownTriggerText, { color: colors.foreground }, !form.subcategoryId && { color: colors.muted }]}>
                        {form.subcategoryId
                          ? dbSubcategories.find((s) => s.id === form.subcategoryId)?.name || form.subcategoryId
                          : "Selecionar especialidade"}
                      </Text>
                      <MaterialIcons
                        name={subCatDropOpen ? "keyboard-arrow-up" : "keyboard-arrow-down"}
                        size={20}
                        color={colors.muted}
                      />
                    </Pressable>
                    {subCatDropOpen && (
                      <View style={[styles.dropdownList, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false} style={{ maxHeight: 220 }}>
                          <Pressable
                            style={({ pressed }) => [
                              styles.dropdownItem,
                              !form.subcategoryId && styles.dropdownItemSelected,
                              { backgroundColor: !form.subcategoryId ? colors.background : colors.surface },
                              pressed && { backgroundColor: colors.background },
                            ]}
                            onPress={() => {
                              setForm((f) => ({ ...f, subcategoryId: "" }));
                              setSubCatDropOpen(false);
                            }}
                          >
                            <Text style={[styles.dropdownItemText, { color: colors.foreground }, !form.subcategoryId && { color: colors.primary, fontWeight: "700" }]}>
                              Nenhuma
                            </Text>
                            {!form.subcategoryId && <MaterialIcons name="check" size={16} color={colors.primary} />}
                          </Pressable>
                          {(() => {
                            const subs: any[] = [];
                            dbSubcategories.filter(s => s.categoryId === form.categoryId).forEach((s: any) => {
                              if (!subs.find(item => item.name.toLowerCase() === s.name.toLowerCase())) {
                                subs.push(s);
                              }
                            });
                            return subs.map((sub: any) => (
                              <Pressable
                                key={sub.id}
                                style={({ pressed }) => [
                                  styles.dropdownItem,
                                  form.subcategoryId === sub.id && styles.dropdownItemSelected,
                                  { backgroundColor: form.subcategoryId === sub.id ? colors.background : colors.surface },
                                  pressed && { backgroundColor: colors.background },
                                ]}
                                onPress={() => {
                                  setForm((f) => ({ ...f, subcategoryId: sub.id }));
                                  setSubCatDropOpen(false);
                                }}
                              >
                                <Text style={[
                                  styles.dropdownItemText,
                                  { color: colors.foreground },
                                  form.subcategoryId === sub.id && { color: colors.primary, fontWeight: "700" },
                                ]}>
                                  {sub.name}
                                </Text>
                                {form.subcategoryId === sub.id && (
                                  <MaterialIcons name="check" size={16} color={colors.primary} />
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
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Imagem de capa</Text>
                <Pressable
                  style={({ pressed }) => [styles.imagePicker, { backgroundColor: colors.background, borderColor: colors.border }, pressed && { opacity: 0.8 }]}
                  onPress={pickImage}
                >
                  {form.imageUri ? (
                    <>
                      <Image source={{ uri: form.imageUri }} style={styles.imagePreview} resizeMode="cover" />
                      <View style={styles.imageOverlay}>
                        <MaterialIcons name="photo-camera" size={20} color="#FFFFFF" />
                        <Text style={styles.imageOverlayText}>Trocar foto</Text>
                      </View>
                    </>
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <MaterialIcons name="add-photo-alternate" size={32} color={colors.muted} />
                      <Text style={[styles.imagePlaceholderText, { color: colors.muted }]}>Toque para adicionar imagem</Text>
                    </View>
                  )}
                </Pressable>

                {/* WhatsApp */}
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>WhatsApp do prestador</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
                  value={form.whatsapp}
                  onChangeText={(v) => setForm((f) => ({ ...f, whatsapp: v }))}
                  placeholder="Ex: (11) 99999-9999"
                  placeholderTextColor={colors.muted}
                  keyboardType="phone-pad"
                  returnKeyType="done"
                />
                <Text style={[styles.fieldHint, { color: colors.muted }]}>
                  Ao tocar no serviço, o usuário será direcionado para este WhatsApp.
                </Text>

                {/* Descrição */}
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Descrição</Text>
                <TextInput
                  style={[styles.textInput, { height: 90, textAlignVertical: "top", backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
                  value={form.description}
                  onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
                  placeholder="Ex: Especialidades, experiência, diferenciais..."
                  placeholderTextColor={colors.muted}
                  multiline
                  numberOfLines={4}
                  returnKeyType="default"
                />

                {/* Endereço */}
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Endereço (bairro/cidade)</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
                  value={form.address}
                  onChangeText={(v) => setForm((f) => ({ ...f, address: v }))}
                  placeholder="Ex: Centro, São Paulo - SP"
                  placeholderTextColor={colors.muted}
                  returnKeyType="done"
                />

                {/* Toggle Exibir na Home */}
                <Pressable
                  style={styles.toggleRow}
                  onPress={() => setForm((f) => ({ ...f, showOnHome: !f.showOnHome }))}
                >
                  <View>
                    <Text style={[styles.toggleLabel, { color: colors.foreground }]}>Exibir na Home</Text>
                    <Text style={[styles.toggleSub, { color: colors.muted }]}>Aparece na seção "Serviços Disponíveis"</Text>
                  </View>
                  <View style={[styles.toggleSwitch, { backgroundColor: colors.border }, form.showOnHome && { backgroundColor: colors.primary }]}>
                    <View style={[styles.toggleThumb, form.showOnHome && styles.toggleThumbOn]} />
                  </View>
                </Pressable>

                {/* Botões */}
                <View style={styles.modalActions}>
                  <Pressable
                    style={({ pressed }) => [styles.cancelBtn, { borderColor: colors.border }, pressed && { opacity: 0.7 }]}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={[styles.cancelBtnText, { color: colors.muted }]}>Cancelar</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [styles.saveBtn, { backgroundColor: colors.primary }, pressed && { opacity: 0.85 }]}
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
            <Pressable style={styles.modalBackdrop} onPress={() => setFilterModalVisible(false)} />
            <View style={[styles.filterSheet, { backgroundColor: colors.surface }]}>
              <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>Filtrar e Ordenar</Text>
              <Text style={[styles.fieldHint, { color: colors.muted }]}>Escolha como deseja visualizar os resultados</Text>

              <View style={styles.filterOptions}>
                <Pressable 
                  style={[styles.filterOption, { backgroundColor: colors.background, borderColor: colors.border }, activeFilter === 'rating' && { borderColor: colors.primary, backgroundColor: colors.background }]}
                  onPress={() => { setActiveFilter('rating'); setFilterModalVisible(false); }}
                >
                  <MaterialIcons name="star" size={20} color={activeFilter === 'rating' ? colors.primary : colors.muted} />
                  <Text style={[styles.filterOptionText, { color: colors.foreground }, activeFilter === 'rating' && { color: colors.primary, fontWeight: "700" }]}>Melhor Avaliação</Text>
                  {activeFilter === 'rating' && <MaterialIcons name="check" size={20} color={colors.primary} />}
                </Pressable>

                <Pressable 
                  style={[styles.filterOption, { backgroundColor: colors.background, borderColor: colors.border }, activeFilter === 'name' && { borderColor: colors.primary, backgroundColor: colors.background }]}
                  onPress={() => { setActiveFilter('name'); setFilterModalVisible(false); }}
                >
                  <MaterialIcons name="sort-by-alpha" size={20} color={activeFilter === 'name' ? colors.primary : colors.muted} />
                  <Text style={[styles.filterOptionText, { color: colors.foreground }, activeFilter === 'name' && { color: colors.primary, fontWeight: "700" }]}>Ordem Alfabética (A-Z)</Text>
                  {activeFilter === 'name' && <MaterialIcons name="check" size={20} color={colors.primary} />}
                </Pressable>

                <Pressable 
                  style={[styles.filterOption, { backgroundColor: colors.background, borderColor: colors.border }, activeFilter === 'none' && { borderColor: colors.primary, backgroundColor: colors.background }]}
                  onPress={() => { setActiveFilter('none'); setFilterModalVisible(false); }}
                >
                  <MaterialIcons name="refresh" size={20} color={activeFilter === 'none' ? colors.primary : colors.muted} />
                  <Text style={[styles.filterOptionText, { color: colors.foreground }, activeFilter === 'none' && { color: colors.primary, fontWeight: "700" }]}>Padrão (Relevância)</Text>
                  {activeFilter === 'none' && <MaterialIcons name="check" size={20} color={colors.primary} />}
                </Pressable>
              </View>

              <Pressable style={[styles.applyFilterBtn, { backgroundColor: colors.primary }]} onPress={() => setFilterModalVisible(false)}>
                <Text style={styles.applyFilterBtnText}>Fechar</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </ScreenContainer>
    </GestureHandlerRootView>
  );
}


// ─── Estilos ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
  },
  headerLeftContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  avatarHeaderWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarHeader: {
    width: "100%",
    height: "100%",
    borderRadius: 22,
  },
  headerTitleContainer: {
    flex: 1,
    gap: 1,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginTop: 1,
  },
  locationText: {
    fontSize: 13,
    fontWeight: "700",
  },
  nearbySummaryText: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 2,
  },
  greeting: { fontSize: 18, fontWeight: "800", color: "#111827" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  editModeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  editModeBtnActive: {
    backgroundColor: "#25D366",
    borderColor: "#25D366",
  },
  editModeBtnLabel: { fontSize: 12, fontWeight: "700", color: "#FFFFFF" },
  bellBtn: { padding: 4 },
  bellWrapper: { position: "relative" },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#EF4444",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: { color: "#FFFFFF", fontSize: 9, fontWeight: "700" },
  editBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#25D366",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  editBannerText: { flex: 1, fontSize: 12, color: "#FFFFFF", fontWeight: "500" },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    gap: 12,
    marginTop: 8,
    marginBottom: 4,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    gap: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: Platform.OS === "ios" ? 48 : 42,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    position: "relative",
  },
  filterBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#25D366",
  },
  filterActiveDot: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#25D366",
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  filterSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  filterOptions: {
    marginTop: 20,
    gap: 10,
  },
  filterOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  filterOptionSelected: {
    backgroundColor: "#F0FDF4",
    borderColor: "#25D366",
  },
  filterOptionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: "#4B5563",
  },
  filterOptionTextSelected: {
    color: "#15803D",
    fontWeight: "700",
  },
  applyFilterBtn: {
    marginTop: 24,
    backgroundColor: "#25D366",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  applyFilterBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  searchTextInput: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
    padding: 0,
  },
  searchPlaceholder: { fontSize: 14, color: "#9CA3AF" },
  categoriesContainer: { paddingHorizontal: 16, paddingVertical: 16, gap: 12 },
  categoryItem: { alignItems: "center", width: 76, gap: 6 },
  categoryIconBox: {
    width: 60,
    height: 60,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryLabel: {
    fontSize: 11,
    color: "#374151",
    textAlign: "center",
    fontWeight: "500",
    lineHeight: 14,
  },
  sectionWrapper: { marginTop: 8, paddingHorizontal: 16 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: "#111827" },
  seeAll: { fontSize: 13, color: "#1A73E8", fontWeight: "500" },
  loadingRow: { height: 120, alignItems: "center", justifyContent: "center" },
  emptySearch: {
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
  },
  emptySearchText: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  // Search Results
  searchResultContainer: {
    marginTop: 12,
    paddingHorizontal: 20,
  },
  searchResultHeader: {
    marginBottom: 16,
  },
  searchResultTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  verticalResultsList: {
    gap: 12,
  },
  verticalServiceCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  verticalCardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  verticalCardImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
  },
  verticalCardIconBg: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
  },
  verticalCardInfo: {
    flex: 1,
    gap: 2,
  },
  verticalCardName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  verticalCardCategory: {
    fontSize: 13,
    color: "#25D366",
    fontWeight: "600",
  },
  verticalCardDesc: {
    fontSize: 13,
    color: "#6B7280",
  },
  emptySearchLarge: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptySearchTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#374151",
    marginTop: 8,
  },
  emptySearchSub: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#25D366",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addBtnText: { fontSize: 12, fontWeight: "700", color: "#FFFFFF" },
  adminServicesRow: { gap: 12, paddingBottom: 8 },
  adminServiceCard: {
    width: 130,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  adminServiceCardEdit: {
    borderColor: "#25D366",
    borderWidth: 2,
    shadowColor: "#25D366",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  adminServiceCardDragging: {
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    transform: [{ scale: 1.05 }],
  },
  adminServiceImage: { width: "100%", height: 90, backgroundColor: "#F3F4F6" },
  adminServiceIconBg: {
    width: "100%",
    height: 90,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#BBF7D0",
  },
  adminServiceInfo: { padding: 8, gap: 2 },
  adminServiceName: { fontSize: 12, fontWeight: "700", color: "#111827" },
  adminServiceCategory: { fontSize: 11, color: "#6B7280" },
  whatsappMiniBtn: {
    position: "absolute",
    bottom: 36,
    right: 6,
    backgroundColor: "#25D366",
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  editOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  dragHandle: { padding: 4 },
  editActions: { flexDirection: "row", gap: 4 },
  editBtn: {
    backgroundColor: "#3B82F6",
    borderRadius: 8,
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtn: {
    backgroundColor: "#EF4444",
    borderRadius: 8,
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyAddCard: {
    height: 100,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#25D366",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#F0FDF4",
    marginBottom: 8,
  },
  emptyAddText: { fontSize: 13, color: "#15803D", fontWeight: "500" },
  cardsRow: { flexDirection: "row", gap: 10, marginBottom: 8 },
  serviceCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  serviceImage: { width: "100%", height: 90, backgroundColor: "#F3F4F6" },
  serviceName: {
    fontSize: 12,
    fontWeight: "500",
    color: "#111827",
    padding: 8,
    paddingTop: 6,
    lineHeight: 16,
  },
  premiumHeaderRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  // Modal
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)" },
  modalSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    maxHeight: "90%",
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#111827", marginBottom: 4 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6, marginTop: 14 },
  fieldHint: { fontSize: 11, color: "#9CA3AF", marginTop: 4, lineHeight: 16 },
  textInput: {
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#FAFAFA",
  },
  dropdownTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#FAFAFA",
  },
  dropdownTriggerText: { fontSize: 14, color: "#111827", flex: 1 },
  dropdownList: {
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    marginTop: 4,
    overflow: "hidden",
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  dropdownItemSelected: { backgroundColor: "#F0FDF4" },
  dropdownItemText: { flex: 1, fontSize: 14, color: "#374151" },
  dropdownItemTextSelected: { color: "#15803D", fontWeight: "600" },
  imagePicker: {
    height: 120,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    overflow: "hidden",
    backgroundColor: "#FAFAFA",
  },
  imagePreview: { width: "100%", height: "100%" },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  imageOverlayText: { color: "#FFFFFF", fontSize: 13, fontWeight: "600" },
  imagePlaceholder: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  imagePlaceholderText: { fontSize: 13, color: "#9CA3AF" },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    paddingVertical: 4,
  },
  toggleLabel: { fontSize: 14, fontWeight: "600", color: "#111827" },
  toggleSub: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },
  toggleSwitch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  toggleSwitchOn: { backgroundColor: "#25D366" },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbOn: { alignSelf: "flex-end" },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 24 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },
  cancelBtnText: { fontSize: 15, fontWeight: "600", color: "#374151" },
  saveBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#25D366",
    alignItems: "center",
  },
  saveBtnText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
  categoryBlock: { marginBottom: 24 },
  categoryHeaderVertical: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, marginBottom: 12 },
  categoryTitleVertical: { fontSize: 16, fontWeight: "700", color: "#111827" },
  categorySubtitleVertical: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  seeAllText: { fontSize: 13, fontWeight: "600", color: "#25D366" },
  subCatList: { paddingHorizontal: 16, gap: 12 },
  subCatCard: { 
    width: 140, 
    marginRight: 12,
    borderWidth: 1, 
    borderColor: "#F3F4F6", 
    overflow: "hidden" 
  },
  subCatImageWrapper: { width: "100%", height: 90, backgroundColor: "#F3F4F6", justifyContent: "center", alignItems: "center" },
  subCatImage: { width: "100%", height: "100%" },
  subCatPlaceholder: { width: "100%", height: "100%", justifyContent: "center", alignItems: "center" },
  subCatInfo: { padding: 10, height: 50, justifyContent: 'center' },
  subCatName: { fontSize: 13, fontWeight: "600", color: "#111827", lineHeight: 18 },
  emptySubCat: { paddingHorizontal: 16, paddingBottom: 8 },
  emptySubCatText: { fontSize: 13, color: "#9CA3AF" },
  horizontalCatsWrapper: {
    marginBottom: 20,
  },
  horizontalCatsContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  quickCatBtn: {
    alignItems: "center",
    width: 80,
  },
  quickCatIconBg: {
    width: 64,
    height: 64,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickCatLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#4B5563",
    textAlign: "center",
    lineHeight: 14,
  },
  horizontalProvidersContent: { paddingHorizontal: 16, gap: 12, paddingBottom: 8 },
  horizontalProfCard: { 
    width: 130, 
    backgroundColor: "#FFFFFF", 
    borderRadius: 20, 
    padding: 12, 
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  profCardAvatarWrap: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    marginBottom: 10,
    position: "relative",
  },
  profCardAvatar: { width: "100%", height: "100%", borderRadius: 40 },
  profCardAvatarFallback: { 
    width: "100%", 
    height: "100%", 
    borderRadius: 40, 
    backgroundColor: "#F0FDF4", 
    alignItems: "center", 
    justifyContent: "center" 
  },
  profCardRatingBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "#25D366",
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  profCardRatingText: { fontSize: 10, fontWeight: "800", color: "#FFFFFF" },
  profCardName: { fontSize: 13, fontWeight: "700", color: "#111827", marginBottom: 2, textAlign: "center" },
  profCardCategory: { fontSize: 11, color: "#9CA3AF", textAlign: "center" },
  suggestionsContainer: {
    backgroundColor: "#F0FDF4",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#DCFCE7",
  },
  suggestionsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 4,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#065F46",
  },
  suggestionsSubtitle: {
    fontSize: 12,
    color: "#4B5563",
    marginBottom: 16,
    fontWeight: "500",
    textAlign: "center",
  },
  suggestionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  suggestionImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: "#E5E7EB",
  },
  suggestionInfo: {
    flex: 1,
    justifyContent: "center",
  },
  suggestionName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
  },
  suggestionMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  suggestionMetaText: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "500",
  },
  moreSuggestionsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#22C55E",
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 20,
    gap: 6,
  },
  moreSuggestionsText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#22C55E",
  },
  feedbackContainer: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#BBF7D0",
    borderRadius: 18,
    padding: 16,
    backgroundColor: "transparent",
  },
  feedbackHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  feedbackIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#1F2937",
    alignItems: "center",
    justifyContent: "center",
  },
  feedbackHeaderText: {
    flex: 1,
  },
  feedbackTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 2,
  },
  feedbackSubtitle: {
    fontSize: 11,
    color: "#4B5563",
  },
  feedbackForm: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  feedbackInput: {
    flex: 1,
    height: 40,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 13,
    color: "#1F2937",
    outlineStyle: "none",
  } as any,
  feedbackSubmitBtn: {
    backgroundColor: "#059669",
    height: 40,
    borderRadius: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  feedbackSubmitText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  featuredCard: {
    width: 250,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  featuredImageWrapper: {
    width: "100%",
    height: 110,
    position: "relative",
    backgroundColor: "#F3F4F6",
  },
  featuredImage: {
    width: "100%",
    height: "100%",
  },
  sponsoredBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  sponsoredText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  featuredInfo: {
    padding: 10,
    gap: 4,
  },
  featuredTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  featuredName: {
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
  },
  featuredSub: {
    fontSize: 11,
    color: "#6B7280",
  },
  featuredBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: "600",
  },
  abertoBadge: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  abertoText: {
    color: "#15803D",
    fontSize: 9,
    fontWeight: "800",
  },
  popularPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  popularIconBg: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  popularName: {
    fontSize: 12,
    fontWeight: "700",
  },
  popularCount: {
    fontSize: 10,
    color: "#9CA3AF",
    marginTop: 1,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
});
