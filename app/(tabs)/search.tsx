import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Modal,
  Dimensions,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { useState, useEffect, useMemo, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocation } from "@/lib/location-context";
import { useColors } from "@/hooks/use-colors";
import { useFavorites } from "@/lib/favorites-context";
import { ScreenContainer } from "@/components/screen-container";
import SearchMap from "@/components/search-map";
import AddressSelectorModal from "@/components/address-selector-modal";
import {
  calculateHaversineDistance,
  formatDistancePtBr,
} from "@/lib/location-utils";
import { trpc } from "@/lib/trpc";

// Categoria Pills para Prestadores
const PRESTADORES_PILLS = [
  { id: "todos", name: "Todos", icon: "all-inclusive" },
  { id: "reformas-reparos", name: "Reformas", icon: "build" },
  { id: "beleza-estetica", name: "Beleza", icon: "content-cut" },
  { id: "servicos-domesticos", name: "Domésticos", icon: "home" },
  { id: "assistencia-tecnica", name: "Técnica", icon: "settings" },
];

const PRESTADORES_MORE = [
  { id: "automotivo", name: "Automotivo", icon: "directions-car" },
  { id: "servicos-externos", name: "Serviços Externos", icon: "yard" },
  {
    id: "servicos-profissionais",
    name: "Serviços Profissionais",
    icon: "business-center",
  },
  { id: "saude", name: "Saúde", icon: "local-hospital" },
  { id: "eventos", name: "Eventos", icon: "celebration" },
  { id: "logistica", name: "Logística", icon: "local-shipping" },
  { id: "educacao", name: "Educação", icon: "school" },
  { id: "mobilidade", name: "Mobilidade", icon: "directions-bus" },
];

// Categoria Pills para Comércios (subcategorias de comercios)
const COMERCIOS_PILLS = [
  { id: "todos", name: "Todos", icon: "all-inclusive" },
  { id: "mercado", name: "Mercados", icon: "local-grocery-store" },
  { id: "farmacia", name: "Farmácias", icon: "local-pharmacy" },
  { id: "pet-shop", name: "Pet Shops", icon: "pets" },
  { id: "oficina", name: "Oficinas", icon: "build" },
];

const COMERCIOS_MORE = [
  { id: "loja-eletronicos", name: "Eletrônicos", icon: "devices" },
  { id: "loja-roupas", name: "Roupas", icon: "checkroom" },
  { id: "material-construcao", name: "Mat. Construção", icon: "hardware" },
  { id: "loja-moveis", name: "Móveis", icon: "chair" },
  { id: "loja-celular", name: "Celulares", icon: "phone-android" },
];

const DISTANCE_STEPS = [
  { id: "1", label: "1 km", value: 1 },
  { id: "3", label: "3 km", value: 3 },
  { id: "5", label: "5 km", value: 5 },
  { id: "10", label: "10 km", value: 10 },
  { id: "all", label: "+10 km", value: 50 },
];

const CATEGORY_ITEMS = [
  { id: "todos", name: "Todos", icon: "all-inclusive" },
  { id: "reformas-reparos", name: "Reformas", icon: "build" },
  { id: "beleza-estetica", name: "Beleza", icon: "content-cut" },
  { id: "servicos-domesticos", name: "Domésticos", icon: "home" },
  { id: "automotivo", name: "Automotivo", icon: "directions-car" },
];

export default function SearchScreen() {
  const colors = useColors();
  const router = useRouter();
  const { coords, addressName, permissionGranted } = useLocation();
  const { isFavorite, toggleFavorite } = useFavorites();
  const mapComponentRef = useRef<any>(null);
  const [mapCenter, setMapCenter] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const isDefaultCity = addressName === "Bragança Paulista - SP";
  const showDistance = coords !== null;

  // Estados principais
  const [query, setQuery] = useState("");
  const [isMapView, setIsMapView] = useState(false);
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [selectedPill, setSelectedPill] = useState("todos");
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(
    null,
  );
  const [showMoreModal, setShowMoreModal] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Filtros ativos
  const [activeSort, setActiveSort] = useState<
    "relevance" | "distance" | "rating" | "popularity" | "recent"
  >("relevance");
  const [activeProximityFilter, setActiveProximityFilter] = useState<
    "all" | "1" | "3" | "5" | "10" | "50"
  >("all");
  const [activeProfileType, setActiveProfileType] = useState<
    "all" | "professional" | "comercio"
  >("professional");
  const [activeRatingFilter, setActiveRatingFilter] = useState<
    "all" | "2" | "3" | "4" | "5"
  >("all");
  const [activeAvailability, setActiveAvailability] = useState<
    "any" | "now" | "today" | "scheduled"
  >("any");
  const [activePriceLevel, setActivePriceLevel] = useState<
    "all" | "1" | "2" | "3" | "4"
  >("all");
  const [onlyOnlineFilter, setOnlyOnlineFilter] = useState(false); // keep for toggle option backward compatibility

  // Estados temporários do modal de filtros
  const [tempSort, setTempSort] = useState<
    "relevance" | "distance" | "rating" | "popularity" | "recent"
  >("relevance");
  const [tempProximity, setTempProximity] = useState<
    "all" | "1" | "3" | "5" | "10" | "50"
  >("all");
  const [tempProfileType, setTempProfileType] = useState<
    "all" | "professional" | "comercio"
  >("professional");
  const [tempRating, setTempRating] = useState<"all" | "2" | "3" | "4" | "5">(
    "all",
  );
  const [tempAvailability, setTempAvailability] = useState<
    "any" | "now" | "today" | "scheduled"
  >("any");
  const [tempPriceLevel, setTempPriceLevel] = useState<
    "all" | "1" | "2" | "3" | "4"
  >("all");
  const [tempCategory, setTempCategory] = useState<string>("todos");
  const [tempOnlyOnline, setTempOnlyOnline] = useState(false);

  const [cachedProviders, setCachedProviders] = useState<any[]>([]);

  // Estados para Busca Inteligente
  const [smartMatch, setSmartMatch] = useState<{
    id: string;
    name: string;
    type: "category" | "subcategory";
    categoryId?: string;
    subcategoryId?: string;
  } | null>(null);
  const [smartSearching, setSmartSearching] = useState(false);

  // Estados do Chatbot Xará
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [chatStep, setChatStep] = useState(0);
  const [chatMessages, setChatMessages] = useState<
    Array<{ sender: "bot" | "user"; text: string }>
  >([]);

  useEffect(() => {
    AsyncStorage.getItem("@chamaja_cached_providers_filtered")
      .then((val) => {
        if (val) {
          setCachedProviders(JSON.parse(val));
        }
      })
      .catch((err) =>
        console.warn("Failed to load cached providers in search:", err),
      );
  }, []);

  // Coordenadas padrão de Bragança Paulista - SP
  const defaultCoords = { latitude: -22.952, longitude: -46.542 };
  const userCoords = coords || defaultCoords;

  // Helper functions para categorias
  const isPrestadorCategory = (pillId: string) => {
    return (
      PRESTADORES_PILLS.some((p) => p.id === pillId) ||
      PRESTADORES_MORE.some((p) => p.id === pillId)
    );
  };

  const isComercioCategory = (pillId: string) => {
    return (
      COMERCIOS_PILLS.some((p) => p.id === pillId) ||
      COMERCIOS_MORE.some((p) => p.id === pillId)
    );
  };

  // Listas de Pills Combinadas para quando o perfil for 'all'
  const combinedPills = useMemo(() => {
    const all = [
      { id: "todos", name: "Todos", icon: "all-inclusive" },
      ...PRESTADORES_PILLS.filter((p) => p.id !== "todos"),
      ...COMERCIOS_PILLS.filter((p) => p.id !== "todos"),
    ];
    const seen = new Set();
    return all.filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  }, []);

  const combinedMorePills = useMemo(() => {
    const all = [...PRESTADORES_MORE, ...COMERCIOS_MORE];
    const seen = new Set();
    return all.filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  }, []);

  // tRPC query para busca filtrada otimizada no servidor
  const {
    data: dbProviders = cachedProviders,
    isLoading: loadingProviders,
    refetch,
  } = trpc.providers.searchFiltered.useQuery(
    {
      query: query.trim() || undefined,
      profileType: activeProfileType === "all" ? undefined : activeProfileType,
      categoryId:
        selectedPill !== "todos" && isPrestadorCategory(selectedPill)
          ? selectedPill
          : undefined,
      subcategoryId:
        selectedPill !== "todos" && isComercioCategory(selectedPill)
          ? selectedPill
          : undefined,
      userLatitude: userCoords.latitude,
      userLongitude: userCoords.longitude,
      maxDistanceKm:
        activeProximityFilter === "all"
          ? undefined
          : Number(activeProximityFilter),
      minRating:
        activeRatingFilter === "all" ? undefined : Number(activeRatingFilter),
      onlyOnline: activeAvailability === "now" || onlyOnlineFilter,
      priceLevel:
        activePriceLevel === "all" ? undefined : Number(activePriceLevel),
      availability: activeAvailability,
      sortBy: activeSort,
    },
    {
      placeholderData: (prev) => prev,
    },
  );

  // Preview query executada em tempo real enquanto o modal de filtros está aberto
  const { data: previewProviders = [], isLoading: loadingPreview } =
    trpc.providers.searchFiltered.useQuery(
      {
        query: query.trim() || undefined,
        profileType: tempProfileType === "all" ? undefined : tempProfileType,
        categoryId:
          tempCategory !== "todos" && isPrestadorCategory(tempCategory)
            ? tempCategory
            : undefined,
        subcategoryId:
          tempCategory !== "todos" && isComercioCategory(tempCategory)
            ? tempCategory
            : undefined,
        userLatitude: userCoords.latitude,
        userLongitude: userCoords.longitude,
        maxDistanceKm:
          tempProximity === "all" ? undefined : Number(tempProximity),
        minRating: tempRating === "all" ? undefined : Number(tempRating),
        onlyOnline: tempAvailability === "now" || tempOnlyOnline,
        priceLevel:
          tempPriceLevel === "all" ? undefined : Number(tempPriceLevel),
        availability: tempAvailability,
        sortBy: tempSort,
      },
      {
        enabled: filterModalVisible,
        placeholderData: (prev) => prev,
      },
    );

  useEffect(() => {
    if (
      dbProviders &&
      dbProviders.length > 0 &&
      dbProviders !== cachedProviders
    ) {
      AsyncStorage.setItem(
        "@chamaja_cached_providers_filtered",
        JSON.stringify(dbProviders),
      ).catch(console.error);
    }
  }, [dbProviders, cachedProviders]);

  // Busca Inteligente tRPC Query
  const { refetch: fetchSmartSearch } = trpc.providers.smartSearch.useQuery(
    { query },
    { enabled: false },
  );

  const startChatbot = () => {
    setChatStep(0);
    setChatMessages([
      {
        sender: "bot",
        text: "Olá! Sou o Xará, o assistente virtual do XamaJá. 🦜\n\nNão entendi muito bem sua busca. Pode me dizer em qual área você precisa de ajuda?",
      },
    ]);
    setChatModalVisible(true);
  };

  const handleChatOption = (option: {
    label: string;
    nextStep: number;
    mapCategory?: string;
    mapQuery?: string;
  }) => {
    setChatMessages((prev) => [
      ...prev,
      { sender: "user", text: option.label },
    ]);
    const next = option.nextStep;
    setChatStep(next);

    setTimeout(() => {
      let botText = "";
      if (next === 1) {
        botText =
          "Excelente! É algo relacionado à parte elétrica, encanamento, pintura, pedreiro ou móveis?";
      } else if (next === 2) {
        botText = "Perfeito! Qual serviço doméstico você precisa no momento?";
      } else if (next === 3) {
        botText =
          "Entendido! Qual equipamento ou aparelho está apresentando problemas?";
      } else if (next === 4) {
        botText =
          "Com certeza! Que tipo de serviço de beleza/estética você procura?";
      } else if (next === 5) {
        botText = "Legal! É conserto mecânico ou limpeza/lavagem de carro?";
      } else if (next === 99) {
        botText = `Perfeito! Entendi que você precisa de um ${option.mapQuery || "profissional"}. Clique no botão abaixo para ver as opções na sua região!`;
      }

      setChatMessages((prev) => [...prev, { sender: "bot", text: botText }]);
    }, 600);
  };

  const completeChatbot = (category: string, queryStr: string) => {
    setSelectedPill(category);
    setQuery(queryStr);
    setActiveProfileType("professional");
    setSmartMatch({
      id: category,
      name: queryStr,
      type: "subcategory",
      categoryId: category,
      subcategoryId: category,
    });
    setChatModalVisible(false);
  };

  const handleSmartSearch = async () => {
    if (!query.trim()) return;
    setSmartSearching(true);
    try {
      const { data: res } = await fetchSmartSearch();
      if (res && "id" in res) {
        setSmartMatch({
          id: res.id,
          name: res.name,
          type: res.type as "category" | "subcategory",
          categoryId: res.categoryId,
          subcategoryId: res.subcategoryId,
        });

        if (res.categoryId) {
          setSelectedPill(res.categoryId);
        }
        if (res.type === "subcategory" && res.name) {
          setQuery(res.name);
        }
        setActiveProfileType("professional");
      } else {
        setSmartMatch(null);
        startChatbot();
      }
    } catch (err) {
      console.warn("Smart Search error:", err);
      startChatbot();
    } finally {
      setSmartSearching(false);
    }
  };

  const openFilterModal = () => {
    setTempSort(activeSort);
    setTempProximity(activeProximityFilter);
    setTempProfileType(activeProfileType);
    setTempRating(activeRatingFilter);
    setTempAvailability(activeAvailability);
    setTempPriceLevel(activePriceLevel);
    setTempCategory(selectedPill);
    setTempOnlyOnline(onlyOnlineFilter);
    setFilterModalVisible(true);
  };

  const applyFilters = () => {
    setActiveSort(tempSort);
    setActiveProximityFilter(tempProximity);
    setActiveProfileType(tempProfileType);
    setActiveRatingFilter(tempRating);
    setActiveAvailability(tempAvailability);
    setActivePriceLevel(tempPriceLevel);
    setSelectedPill(tempCategory);
    setOnlyOnlineFilter(tempOnlyOnline);
    setFilterModalVisible(false);
  };

  const clearFilters = () => {
    setTempSort("relevance");
    setTempProximity("all");
    setTempProfileType("all");
    setTempRating("all");
    setTempAvailability("any");
    setTempPriceLevel("all");
    setTempCategory("todos");
    setTempOnlyOnline(false);
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (activeSort !== "relevance") count++;
    if (activeProximityFilter !== "all") count++;
    if (activeProfileType !== "all") count++;
    if (activeRatingFilter !== "all") count++;
    if (activeAvailability !== "any") count++;
    if (activePriceLevel !== "all") count++;
    if (selectedPill !== "todos") count++;
    if (onlyOnlineFilter) count++;
    return count;
  }, [
    activeSort,
    activeProximityFilter,
    activeProfileType,
    activeRatingFilter,
    activeAvailability,
    activePriceLevel,
    selectedPill,
    onlyOnlineFilter,
  ]);

  // A filtragem é totalmente delegada ao backend para performance e escalabilidade
  const providersList = dbProviders;

  // Prestador selecionado no mapa
  const selectedProvider = useMemo(() => {
    if (!selectedProviderId) return null;
    return providersList.find((p) => p.id === selectedProviderId) || null;
  }, [selectedProviderId, providersList]);

  // Adiciona logs detalhados de localização do usuário, endereço selecionado e prestadores
  useEffect(() => {
    console.log("=== [DIAGNÓSTICO LOCALIZAÇÃO] ===");
    console.log(`- Endereço Selecionado: "${addressName}"`);
    console.log(
      `- Coordenadas do Endereço/Usuário: Lat ${userCoords.latitude}, Lng ${userCoords.longitude}`,
    );
    console.log(
      `- Coordenadas do Fallback/GPS Ativo: ${coords ? `Lat ${coords.latitude}, Lng ${coords.longitude}` : "Nenhuma (Usando Fallback Padrão -22.9520, -46.5420)"}`,
    );
    console.log(`- Total de Prestadores Mapeados: ${providersList.length}`);
    providersList.forEach((p, idx) => {
      console.log(
        `  [Prestador #${idx + 1}] Nome: "${p.name}" | Cat: "${p.category || p.subcategoryName}" | Bairro: "${p.neighborhood}" | Coordenadas: Lat ${p.latitude}, Lng ${p.longitude} | Distância: ${p.distanceStr || "N/A"}`,
      );
    });
    console.log("=================================");
  }, [userCoords, addressName, coords, providersList]);

  const handleTabChange = (type: "all" | "professional" | "comercio") => {
    setActiveProfileType(type);
    setSelectedPill("todos");
    setSelectedProviderId(null);
  };

  // Ao clicar em re-centralizar no mapa
  const handleRecenter = () => {
    mapComponentRef.current?.recenter();
  };

  // Ação de escaneamento "Buscar nesta área"
  const handleScanArea = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      refetch();
    }, 1200);
  };

  const currentPills =
    activeProfileType === "professional"
      ? PRESTADORES_PILLS
      : activeProfileType === "comercio"
        ? COMERCIOS_PILLS
        : combinedPills;

  const morePills =
    activeProfileType === "professional"
      ? PRESTADORES_MORE
      : activeProfileType === "comercio"
        ? COMERCIOS_MORE
        : combinedMorePills;

  const modalCurrentPills = filterModalVisible
    ? tempProfileType === "professional"
      ? PRESTADORES_PILLS
      : tempProfileType === "comercio"
        ? COMERCIOS_PILLS
        : combinedPills
    : currentPills;

  const modalMorePills = filterModalVisible
    ? tempProfileType === "professional"
      ? PRESTADORES_MORE
      : tempProfileType === "comercio"
        ? COMERCIOS_MORE
        : combinedMorePills
    : morePills;

  const currentCount = providersList.length;
  const countLabel =
    activeProfileType === "professional"
      ? `${currentCount} profissionais encontrados`
      : activeProfileType === "comercio"
        ? `${currentCount} comércios encontrados`
        : `${currentCount} resultados encontrados`;

  return (
    <ScreenContainer edges={["left", "right"]} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.headerBackBtn}>
            <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
          </Pressable>

          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>
              {isMapView ? "Mapa" : "Profissionais próximos"}
            </Text>
            <Pressable
              style={styles.locationContainer}
              onPress={() => setAddressModalVisible(true)}
            >
              <Text style={styles.locationText} numberOfLines={1}>
                📍 {addressName}
              </Text>
              <MaterialIcons
                name="keyboard-arrow-down"
                size={16}
                color="#22C55E"
              />
            </Pressable>
            <Text style={styles.subtitleCount}>{countLabel}</Text>
          </View>

          {/* Botões de Ação Direta */}
          <View style={styles.headerRightRow}>
            {!isMapView && (
              <Pressable
                style={[
                  styles.headerFilterBtn,
                  activeFiltersCount > 0 && {
                    borderColor: "#22C55E",
                    backgroundColor: "rgba(34, 197, 94, 0.05)",
                  },
                ]}
                onPress={openFilterModal}
              >
                <MaterialIcons name="tune" size={20} color="#22C55E" />
                <Text style={styles.headerFilterText}>Filtros</Text>
                {activeFiltersCount > 0 && (
                  <View style={styles.filterBadge}>
                    <Text style={styles.filterBadgeText}>
                      {activeFiltersCount}
                    </Text>
                  </View>
                )}
              </Pressable>
            )}

            <Pressable
              onPress={() => {
                setIsMapView(!isMapView);
                setSelectedProviderId(null);
              }}
              style={styles.headerToggleBtn}
            >
              <MaterialIcons
                name={isMapView ? "format-list-bulleted" : "map"}
                size={20}
                color={isMapView ? "#22C55E" : "#FFFFFF"}
              />
              <Text
                style={[
                  styles.headerToggleText,
                  isMapView && { color: "#22C55E" },
                ]}
              >
                {isMapView ? "Lista" : "Mapa"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Barra de Pesquisa */}
      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <MaterialIcons name="search" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder={
              activeProfileType === "professional"
                ? "Buscar serviço ou profissional..."
                : activeProfileType === "comercio"
                  ? "Buscar comércio ou local..."
                  : "Buscar profissionais ou comércios..."
            }
            placeholderTextColor="#9CA3AF"
            value={query}
            onChangeText={(t) => {
              setQuery(t);
              setSelectedProviderId(null);
              if (smartMatch) setSmartMatch(null);
            }}
            autoCorrect={false}
            onSubmitEditing={handleSmartSearch}
            returnKeyType="search"
          />
          {smartSearching && (
            <ActivityIndicator
              size="small"
              color="#22C55E"
              style={{ marginRight: 6 }}
            />
          )}
          {query.length > 0 && !smartSearching && (
            <Pressable
              onPress={() => {
                setQuery("");
                setSmartMatch(null);
              }}
            >
              <MaterialIcons name="close" size={18} color="#9CA3AF" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Tabs Segmentadas: Todos vs Prestadores vs Comércios */}
      <View style={styles.tabBarContainer}>
        <View style={styles.tabBar}>
          <Pressable
            onPress={() => handleTabChange("all")}
            style={[
              styles.tabButton,
              activeProfileType === "all" && styles.tabButtonActive,
            ]}
          >
            <MaterialIcons
              name="all-inclusive"
              size={18}
              color={activeProfileType === "all" ? "#FFFFFF" : "#9CA3AF"}
            />
            <Text
              style={[
                styles.tabText,
                activeProfileType === "all" && styles.tabTextActive,
              ]}
            >
              Todos
            </Text>
          </Pressable>

          <Pressable
            onPress={() => handleTabChange("professional")}
            style={[
              styles.tabButton,
              activeProfileType === "professional" && styles.tabButtonActive,
            ]}
          >
            <MaterialIcons
              name="person"
              size={18}
              color={
                activeProfileType === "professional" ? "#FFFFFF" : "#9CA3AF"
              }
            />
            <Text
              style={[
                styles.tabText,
                activeProfileType === "professional" && styles.tabTextActive,
              ]}
            >
              Prestadores
            </Text>
          </Pressable>

          <Pressable
            onPress={() => handleTabChange("comercio")}
            style={[
              styles.tabButton,
              activeProfileType === "comercio" && styles.tabButtonActive,
            ]}
          >
            <MaterialIcons
              name="storefront"
              size={18}
              color={activeProfileType === "comercio" ? "#FFFFFF" : "#9CA3AF"}
            />
            <Text
              style={[
                styles.tabText,
                activeProfileType === "comercio" && styles.tabTextActive,
              ]}
            >
              Comércios
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Chips/Pills de Categorias Rápidas */}
      <View style={styles.pillsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsScroll}
        >
          {currentPills.map((pill) => {
            const isSelected = selectedPill === pill.id;
            return (
              <Pressable
                key={pill.id}
                onPress={() => {
                  setSelectedPill(pill.id);
                  setSelectedProviderId(null);
                }}
                style={[
                  styles.pillButton,
                  isSelected && styles.pillButtonActive,
                ]}
              >
                <Text
                  style={[styles.pillText, isSelected && styles.pillTextActive]}
                >
                  {pill.name}
                </Text>
              </Pressable>
            );
          })}
          <Pressable
            onPress={() => setShowMoreModal(true)}
            style={styles.pillButtonMore}
          >
            <MaterialIcons
              name="grid-view"
              size={16}
              color="#D1D5DB"
              style={{ marginRight: 4 }}
            />
            <Text style={styles.pillTextMore}>Mais</Text>
          </Pressable>
        </ScrollView>
      </View>

      {/* Conteúdo Principal: Mapa ou Lista */}
      <View style={styles.mainContent}>
        {loadingProviders ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#22C55E" />
            <Text style={styles.loadingText}>Carregando resultados...</Text>
          </View>
        ) : isMapView ? (
          /* =================== MAP VIEW =================== */
          <View style={StyleSheet.absoluteFillObject}>
            <SearchMap
              ref={mapComponentRef}
              providers={providersList as any}
              userCoords={userCoords}
              selectedProviderId={selectedProviderId}
              onSelectProvider={setSelectedProviderId}
              onMapCenterChange={setMapCenter}
            />

            {/* Radar Scan - Buscar nesta área */}
            <View style={styles.scanAreaWrapper}>
              <Pressable
                onPress={handleScanArea}
                disabled={isScanning}
                style={styles.scanAreaButton}
              >
                {isScanning ? (
                  <ActivityIndicator
                    size="small"
                    color="#22C55E"
                    style={{ marginRight: 6 }}
                  />
                ) : (
                  <MaterialIcons
                    name="refresh"
                    size={18}
                    color="#22C55E"
                    style={{ marginRight: 6 }}
                  />
                )}
                <Text style={styles.scanAreaText}>
                  {isScanning ? "Buscando..." : "Buscar nesta área"}
                </Text>
              </Pressable>
            </View>

            {/* Botão de Re-centralizar */}
            <Pressable onPress={handleRecenter} style={styles.recenterButton}>
              <MaterialIcons name="my-location" size={24} color="#FFFFFF" />
            </Pressable>

            {/* Card de Detalhes no Rodapé */}
            {selectedProvider && (
              <View style={styles.detailCard}>
                <Pressable
                  onPress={() => setSelectedProviderId(null)}
                  style={styles.cardCloseBtn}
                >
                  <MaterialIcons name="close" size={20} color="#9CA3AF" />
                </Pressable>

                <View style={styles.cardHeader}>
                  <Image
                    source={{
                      uri:
                        selectedProvider.avatarThumbnailUri ||
                        selectedProvider.avatarUri ||
                        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
                    }}
                    style={styles.cardAvatar}
                  />
                  <View style={styles.cardInfo}>
                    <View style={styles.cardTitleRow}>
                      <Text style={styles.cardName} numberOfLines={1}>
                        {selectedProvider.name}
                      </Text>
                      {selectedProvider.isVerified && (
                        <MaterialIcons
                          name="verified"
                          size={16}
                          color="#22C55E"
                          style={{ marginLeft: 4 }}
                        />
                      )}
                    </View>
                    <Text style={styles.cardSpecialty} numberOfLines={1}>
                      {selectedProvider.category ||
                        selectedProvider.subcategoryName}
                    </Text>

                    {/* Classificação */}
                    <View style={styles.cardRatingRow}>
                      <MaterialIcons name="star" size={16} color="#FBBF24" />
                      <Text style={styles.cardRating}>
                        {Number(selectedProvider.rating).toFixed(1)}
                      </Text>
                      <Text style={styles.cardReviews}>
                        ({selectedProvider.ratingCount} avaliações)
                      </Text>
                      {showDistance && selectedProvider.distanceStr ? (
                        <>
                          <Text style={styles.cardDot}>•</Text>
                          <Text style={styles.cardDistance}>
                            📍 {selectedProvider.distanceStr}
                          </Text>
                        </>
                      ) : null}
                    </View>

                    <Text style={styles.cardOpenStatus}>Aberto agora</Text>
                  </View>
                </View>

                <Pressable
                  onPress={() =>
                    router.push(`/professional/${selectedProvider.id}` as any)
                  }
                  style={styles.cardButton}
                >
                  <Text style={styles.cardButtonText}>Ver perfil</Text>
                </Pressable>
              </View>
            )}
          </View>
        ) : (
          /* =================== LIST VIEW =================== */
          <FlatList
            data={providersList}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              smartMatch ? (
                <View
                  style={[
                    styles.smartMatchBanner,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.smartMatchHeader}>
                    <Image
                      source={require("@/assets/images/mascote-xara.png")}
                      style={styles.smartMatchMascot}
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.smartMatchTitle,
                          { color: colors.foreground },
                        ]}
                      >
                        Busca Inteligente Xará
                      </Text>
                      <Text
                        style={[styles.smartMatchSub, { color: colors.muted }]}
                      >
                        Mapeado para:{" "}
                        <Text style={{ color: "#22C55E", fontWeight: "700" }}>
                          {smartMatch.name}
                        </Text>
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => {
                        setSmartMatch(null);
                        setQuery("");
                        setSelectedPill("todos");
                      }}
                      style={styles.smartMatchClearBtn}
                    >
                      <MaterialIcons
                        name="close"
                        size={16}
                        color={colors.muted}
                      />
                    </Pressable>
                  </View>
                </View>
              ) : null
            }
            renderItem={({ item }) => {
              const isFav = isFavorite(item.id);

              return (
                <Pressable
                  onPress={() => router.push(`/professional/${item.id}` as any)}
                  style={styles.providerCard}
                >
                  {/* Avatar com Badge */}
                  <View style={styles.avatarSection}>
                    <Image
                      source={{
                        uri:
                          item.avatarThumbnailUri ||
                          item.avatarUri ||
                          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
                      }}
                      style={styles.providerAvatar}
                      contentFit="cover"
                    />
                    {item.topBadge && (
                      <View
                        style={[
                          styles.badgeTag,
                          item.topBadge === "Patrocinado" &&
                            styles.badgePatrocinado,
                          item.topBadge === "Destaque" && styles.badgeDestaque,
                          item.topBadge === "Verificado" &&
                            styles.badgeVerificado,
                        ]}
                      >
                        <Text style={styles.badgeText}>{item.topBadge}</Text>
                      </View>
                    )}
                  </View>

                  {/* Informações detalhadas */}
                  <View style={styles.providerDetails}>
                    <View style={styles.providerHeaderRow}>
                      <View style={styles.providerTitleContainer}>
                        <Text style={styles.providerName} numberOfLines={1}>
                          {item.name}
                        </Text>
                        {item.isVerified && (
                          <MaterialIcons
                            name="verified"
                            size={16}
                            color="#22C55E"
                            style={{ marginLeft: 4 }}
                          />
                        )}
                      </View>

                      {/* Botão de Favoritar */}
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          toggleFavorite({
                            id: item.id,
                            name: item.name,
                            category: item.category || "",
                            city: item.city || "",
                            avatar:
                              item.avatarThumbnailUri ||
                              item.avatarUri ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}`,
                            rating: Number(item.rating) || 0,
                            phone: item.phone || item.whatsapp || "",
                            type:
                              item.benefitKeys?.includes("premium_badge") ||
                              item.benefitKeys?.includes("featured_search")
                                ? "premium"
                                : "free",
                            latitude: item.latitude
                              ? Number(item.latitude)
                              : null,
                            longitude: item.longitude
                              ? Number(item.longitude)
                              : null,
                          });
                        }}
                        style={styles.favBtn}
                      >
                        <MaterialIcons
                          name={isFav ? "favorite" : "favorite-border"}
                          size={22}
                          color={isFav ? "#EF4444" : "#9CA3AF"}
                        />
                      </Pressable>
                    </View>

                    <Text style={styles.providerCategory}>
                      {item.category || item.subcategoryName}
                    </Text>

                    {/* Rating e Distância */}
                    <View style={styles.ratingSection}>
                      <MaterialIcons name="star" size={16} color="#FBBF24" />
                      <Text style={styles.ratingValue}>
                        {Number(item.rating).toFixed(1)}
                      </Text>
                      <Text style={styles.ratingCount}>
                        ({item.ratingCount})
                      </Text>
                      {showDistance && item.distanceStr ? (
                        <>
                          <Text style={styles.ratingDot}>•</Text>
                          <Text style={styles.distanceText}>
                            📍 {item.distanceStr}
                          </Text>
                        </>
                      ) : null}
                    </View>

                    <View style={styles.statusRow}>
                      <Text style={styles.openText}>Aberto agora</Text>
                      <Text style={styles.neighborhoodText}>
                        {item.neighborhood}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialIcons name="search-off" size={60} color="#9CA3AF" />
                <Text style={styles.emptyTitle}>
                  Nenhum profissional encontrado
                </Text>
                <Text style={styles.emptySubtitle}>
                  Tente alterar seus termos de busca ou selecionar outra
                  categoria.
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* Modal de "Mais Categorias" */}
      <Modal
        visible={showMoreModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMoreModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Todas as categorias</Text>
              <Pressable
                onPress={() => setShowMoreModal(false)}
                style={styles.modalCloseBtn}
              >
                <MaterialIcons name="close" size={24} color="#FFFFFF" />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.modalGrid}>
              {/* Opção Todos */}
              <Pressable
                onPress={() => {
                  if (filterModalVisible) {
                    setTempCategory("todos");
                  } else {
                    setSelectedPill("todos");
                  }
                  setShowMoreModal(false);
                  setSelectedProviderId(null);
                }}
                style={[
                  styles.gridItem,
                  (filterModalVisible
                    ? tempCategory === "todos"
                    : selectedPill === "todos") && styles.gridItemActive,
                ]}
              >
                <View style={styles.gridIconContainer}>
                  <MaterialIcons
                    name="all-inclusive"
                    size={24}
                    color="#22C55E"
                  />
                </View>
                <Text style={styles.gridItemLabel}>Todos</Text>
              </Pressable>

              {/* Pills padrões */}
              {modalCurrentPills.slice(1).map((pill) => {
                const isSelected = filterModalVisible
                  ? tempCategory === pill.id
                  : selectedPill === pill.id;
                return (
                  <Pressable
                    key={pill.id}
                    onPress={() => {
                      if (filterModalVisible) {
                        setTempCategory(pill.id);
                      } else {
                        setSelectedPill(pill.id);
                      }
                      setShowMoreModal(false);
                      setSelectedProviderId(null);
                    }}
                    style={[
                      styles.gridItem,
                      isSelected && styles.gridItemActive,
                    ]}
                  >
                    <View style={styles.gridIconContainer}>
                      <MaterialIcons
                        name={pill.icon as any}
                        size={24}
                        color="#22C55E"
                      />
                    </View>
                    <Text style={styles.gridItemLabel}>{pill.name}</Text>
                  </Pressable>
                );
              })}

              {/* Pills adicionais */}
              {modalMorePills.map((pill) => {
                const isSelected = filterModalVisible
                  ? tempCategory === pill.id
                  : selectedPill === pill.id;
                return (
                  <Pressable
                    key={pill.id}
                    onPress={() => {
                      if (filterModalVisible) {
                        setTempCategory(pill.id);
                      } else {
                        setSelectedPill(pill.id);
                      }
                      setShowMoreModal(false);
                      setSelectedProviderId(null);
                    }}
                    style={[
                      styles.gridItem,
                      isSelected && styles.gridItemActive,
                    ]}
                  >
                    <View style={styles.gridIconContainer}>
                      <MaterialIcons
                        name={pill.icon as any}
                        size={24}
                        color="#22C55E"
                      />
                    </View>
                    <Text style={styles.gridItemLabel}>{pill.name}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal de Filtros Avançados iFood-Style */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={() => setFilterModalVisible(false)}
          />
          <View
            style={[
              styles.filterSheet,
              {
                backgroundColor: "#080808",
                borderColor: "#1C1C1E",
                borderWidth: 1,
              },
            ]}
          >
            <View
              style={[styles.modalHandle, { backgroundColor: "#1C1C1E" }]}
            />

            <View style={styles.filterModalHeader}>
              <Pressable
                onPress={() => setFilterModalVisible(false)}
                style={styles.filterCloseBtn}
              >
                <MaterialIcons name="close" size={24} color="#FFFFFF" />
              </Pressable>

              <View style={styles.filterHeaderTitleContainer}>
                <Text style={styles.filterModalTitle}>Filtros</Text>
                <Text style={styles.filterModalSubtitle}>
                  Refine sua busca no XamaJá
                </Text>
              </View>

              <Pressable onPress={clearFilters} style={styles.clearFiltersBtn}>
                <Text style={styles.clearFiltersText}>Limpar tudo</Text>
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.filterFormScroll}
            >
              {/* Seção Ordenação (Cards) */}
              <Text style={styles.filterSectionTitle}>Ordenar por</Text>
              <View style={styles.sortGrid}>
                {[
                  { id: "distance", label: "Mais próximos", icon: "near-me" },
                  { id: "rating", label: "Melhor avaliação", icon: "star" },
                  {
                    id: "popularity",
                    label: "Mais populares",
                    icon: "trending-up",
                  },
                  { id: "recent", label: "Mais recentes", icon: "schedule" },
                ].map((opt) => {
                  const isSel = tempSort === opt.id;
                  return (
                    <Pressable
                      key={opt.id}
                      onPress={() => setTempSort(opt.id as any)}
                      style={[styles.sortCard, isSel && styles.sortCardActive]}
                    >
                      <MaterialIcons
                        name={opt.icon as any}
                        size={22}
                        color={isSel ? "#22C55E" : "#9CA3AF"}
                      />
                      <Text
                        style={[
                          styles.sortCardLabel,
                          isSel && styles.sortCardLabelActive,
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Seção Distância Máxima (Step Slider Interativo) */}
              {showDistance && (
                <>
                  <Text style={[styles.filterSectionTitle, { marginTop: 22 }]}>
                    Distância máxima
                  </Text>
                  <View style={styles.sliderContainer}>
                    <View style={styles.sliderTrackWrapper}>
                      <View style={styles.sliderTrackBackground} />
                      <View
                        style={[
                          styles.sliderTrackActive,
                          {
                            width: `${DISTANCE_STEPS.findIndex((s) => s.id === tempProximity) * 25}%`,
                          },
                        ]}
                      />
                      {DISTANCE_STEPS.map((step, idx) => {
                        const isPassed =
                          idx <=
                          DISTANCE_STEPS.findIndex(
                            (s) => s.id === tempProximity,
                          );
                        const isCurrent = step.id === tempProximity;
                        return (
                          <Pressable
                            key={step.id}
                            onPress={() => setTempProximity(step.id as any)}
                            style={[
                              styles.sliderDot,
                              { left: `${idx * 25}%` },
                              isPassed && styles.sliderDotPassed,
                              isCurrent && styles.sliderDotCurrent,
                            ]}
                          />
                        );
                      })}
                    </View>

                    <View style={styles.sliderLabelsRow}>
                      {DISTANCE_STEPS.map((step, idx) => {
                        const isCurrent = step.id === tempProximity;
                        return (
                          <Pressable
                            key={step.id}
                            onPress={() => setTempProximity(step.id as any)}
                            style={[
                              styles.sliderLabelBtn,
                              { left: `${idx * 25}%` },
                            ]}
                          >
                            <Text
                              style={[
                                styles.sliderStepLabel,
                                isCurrent && styles.sliderStepLabelActive,
                              ]}
                            >
                              {step.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                </>
              )}

              {/* Seção Categoria (Fila de Categorias Circulares) */}
              <Text style={[styles.filterSectionTitle, { marginTop: 22 }]}>
                Categoria
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryScroll}
                style={{ marginBottom: 4 }}
              >
                {CATEGORY_ITEMS.map((cat) => {
                  const isSel = tempCategory === cat.id;
                  return (
                    <Pressable
                      key={cat.id}
                      onPress={() => setTempCategory(cat.id)}
                      style={styles.categoryCircleBtn}
                    >
                      <View
                        style={[
                          styles.categoryCircle,
                          isSel && styles.categoryCircleActive,
                        ]}
                      >
                        <MaterialIcons
                          name={cat.icon as any}
                          size={24}
                          color={isSel ? "#22C55E" : "#FFFFFF"}
                        />
                      </View>
                      <Text
                        style={[
                          styles.categoryCircleLabel,
                          isSel && styles.categoryCircleLabelActive,
                        ]}
                      >
                        {cat.name}
                      </Text>
                    </Pressable>
                  );
                })}
                <Pressable
                  onPress={() => setShowMoreModal(true)}
                  style={styles.categoryCircleBtn}
                >
                  <View style={styles.categoryCircle}>
                    <MaterialIcons name="grid-view" size={24} color="#9CA3AF" />
                  </View>
                  <Text style={styles.categoryCircleLabel}>Mais</Text>
                </Pressable>
              </ScrollView>

              {/* Seção Tipo de Perfil (Segmentador Horizontal) */}
              <Text style={[styles.filterSectionTitle, { marginTop: 22 }]}>
                Tipo de perfil
              </Text>
              <View style={styles.segmentedContainer}>
                {[
                  { id: "all", label: "Todos" },
                  { id: "professional", label: "Prestadores" },
                  { id: "comercio", label: "Lojas e Empresas" },
                ].map((opt) => {
                  const isSel = tempProfileType === opt.id;
                  return (
                    <Pressable
                      key={opt.id}
                      onPress={() => setTempProfileType(opt.id as any)}
                      style={[
                        styles.segmentedButton,
                        isSel && styles.segmentedButtonActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.segmentedText,
                          isSel && styles.segmentedTextActive,
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Seção Avaliação Mínima (Fila de Estrelas) */}
              <Text style={[styles.filterSectionTitle, { marginTop: 22 }]}>
                Avaliação mínima
              </Text>
              <View style={styles.ratingRowChips}>
                {[
                  { id: "all", label: "Qualquer" },
                  { id: "4", label: "4.0+ ⭐" },
                  { id: "3", label: "3.0+ ⭐" },
                  { id: "2", label: "2.0+ ⭐" },
                  { id: "5", label: "5.0 ⭐" },
                ].map((opt) => {
                  const isSel = tempRating === opt.id;
                  return (
                    <Pressable
                      key={opt.id}
                      onPress={() => setTempRating(opt.id as any)}
                      style={[
                        styles.ratingChip,
                        isSel && styles.ratingChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.ratingChipText,
                          isSel && styles.ratingChipTextActive,
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Seção Disponibilidade (Ícones clock/lightning/calendar) */}
              <Text style={[styles.filterSectionTitle, { marginTop: 22 }]}>
                Disponibilidade
              </Text>
              <View style={styles.availabilityRow}>
                {[
                  { id: "any", label: "Qualquer", icon: "schedule" },
                  { id: "now", label: "Disponível agora", icon: "bolt" },
                  { id: "today", label: "Hoje", icon: "today" },
                  { id: "scheduled", label: "Agendar", icon: "event" },
                ].map((opt) => {
                  const isSel = tempAvailability === opt.id;
                  return (
                    <Pressable
                      key={opt.id}
                      onPress={() => setTempAvailability(opt.id as any)}
                      style={[
                        styles.availabilityCard,
                        isSel && styles.availabilityCardActive,
                      ]}
                    >
                      <MaterialIcons
                        name={opt.icon as any}
                        size={20}
                        color={isSel ? "#22C55E" : "#9CA3AF"}
                      />
                      <Text
                        style={[
                          styles.availabilityCardLabel,
                          isSel && styles.availabilityCardLabelActive,
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Seção Faixa de Preço (Faixa $, $$, $$$, $$$$) */}
              <Text style={[styles.filterSectionTitle, { marginTop: 22 }]}>
                Faixa de preço
              </Text>
              <View style={styles.priceRow}>
                {[
                  { id: "all", label: "Qualquer" },
                  { id: "1", label: "$" },
                  { id: "2", label: "$$" },
                  { id: "3", label: "$$$" },
                  { id: "4", label: "$$$$" },
                ].map((opt) => {
                  const isSel = tempPriceLevel === opt.id;
                  return (
                    <Pressable
                      key={opt.id}
                      onPress={() => setTempPriceLevel(opt.id as any)}
                      style={[
                        styles.priceButton,
                        isSel && styles.priceButtonActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.priceButtonText,
                          isSel && styles.priceButtonTextActive,
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>

            <View style={styles.filterFooter}>
              <Pressable
                style={[styles.applyFilterBtn, { backgroundColor: "#22C55E" }]}
                onPress={applyFilters}
                disabled={loadingPreview}
              >
                {loadingPreview ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.applyFilterBtnText}>
                    Aplicar filtros ({previewProviders.length}{" "}
                    {previewProviders.length === 1 ? "resultado" : "resultados"}
                    )
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <AddressSelectorModal
        visible={addressModalVisible}
        onClose={() => setAddressModalVisible(false)}
      />

      {/* Modal do Chatbot Xará */}
      <Modal
        visible={chatModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setChatModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={() => setChatModalVisible(false)}
          />
          <View style={[styles.chatSheet, { backgroundColor: colors.surface }]}>
            {/* Header do Chat */}
            <View
              style={[styles.chatHeader, { borderBottomColor: colors.border }]}
            >
              <Image
                source={require("@/assets/images/mascote-xara.png")}
                style={styles.chatHeaderMascot}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.chatHeaderTitle, { color: colors.foreground }]}
                >
                  Assistente Xará
                </Text>
                <Text style={styles.chatHeaderSubtitle}>
                  Estou aqui para ajudar!
                </Text>
              </View>
              <Pressable
                onPress={() => setChatModalVisible(false)}
                style={styles.chatCloseBtn}
              >
                <MaterialIcons
                  name="close"
                  size={24}
                  color={colors.foreground}
                />
              </Pressable>
            </View>

            {/* Mensagens do Chat */}
            <ScrollView
              style={styles.chatMessagesContainer}
              contentContainerStyle={{ gap: 12, paddingVertical: 16 }}
              ref={(ref) => ref?.scrollToEnd({ animated: true })}
            >
              {chatMessages.map((msg, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.chatMessageBubble,
                    msg.sender === "user"
                      ? styles.chatBubbleUser
                      : [
                          styles.chatBubbleBot,
                          {
                            backgroundColor: colors.background,
                            borderColor: colors.border,
                          },
                        ],
                  ]}
                >
                  <Text
                    style={[
                      styles.chatMessageText,
                      msg.sender === "user"
                        ? styles.chatTextUser
                        : { color: colors.foreground },
                    ]}
                  >
                    {msg.text}
                  </Text>
                </View>
              ))}
            </ScrollView>

            {/* Opções de Resposta Rápida (Quick Replies) */}
            <View
              style={[
                styles.chatOptionsContainer,
                { borderTopColor: colors.border },
              ]}
            >
              {chatStep === 0 && (
                <View style={styles.chatOptionsGrid}>
                  <Pressable
                    style={styles.chatOptionBtn}
                    onPress={() =>
                      handleChatOption({
                        label: "🏠 Reformas ou Consertos",
                        nextStep: 1,
                      })
                    }
                  >
                    <Text style={styles.chatOptionBtnText}>
                      🏠 Reformas e Consertos
                    </Text>
                  </Pressable>
                  <Pressable
                    style={styles.chatOptionBtn}
                    onPress={() =>
                      handleChatOption({
                        label: "🧹 Serviços Domésticos",
                        nextStep: 2,
                      })
                    }
                  >
                    <Text style={styles.chatOptionBtnText}>
                      🧹 Serviços Domésticos
                    </Text>
                  </Pressable>
                  <Pressable
                    style={styles.chatOptionBtn}
                    onPress={() =>
                      handleChatOption({
                        label: "💻 Assistência Técnica",
                        nextStep: 3,
                      })
                    }
                  >
                    <Text style={styles.chatOptionBtnText}>
                      💻 Assistência Técnica
                    </Text>
                  </Pressable>
                  <Pressable
                    style={styles.chatOptionBtn}
                    onPress={() =>
                      handleChatOption({
                        label: "✂️ Beleza ou Bem-estar",
                        nextStep: 4,
                      })
                    }
                  >
                    <Text style={styles.chatOptionBtnText}>
                      ✂️ Beleza ou Bem-estar
                    </Text>
                  </Pressable>
                  <Pressable
                    style={styles.chatOptionBtn}
                    onPress={() =>
                      handleChatOption({
                        label: "🚗 Serviços para Veículos",
                        nextStep: 5,
                      })
                    }
                  >
                    <Text style={styles.chatOptionBtnText}>
                      🚗 Serviços para Veículos
                    </Text>
                  </Pressable>
                </View>
              )}

              {chatStep === 1 && (
                <View style={styles.chatOptionsList}>
                  <Pressable
                    style={styles.chatOptionBtn}
                    onPress={() =>
                      handleChatOption({
                        label: "⚡ Elétrica",
                        nextStep: 99,
                        mapCategory: "reformas-reparos",
                        mapQuery: "Eletricista",
                      })
                    }
                  >
                    <Text style={styles.chatOptionBtnText}>
                      ⚡ Elétrica (chuveiro, fiação, tomadas)
                    </Text>
                  </Pressable>
                  <Pressable
                    style={styles.chatOptionBtn}
                    onPress={() =>
                      handleChatOption({
                        label: "💧 Encanamento",
                        nextStep: 99,
                        mapCategory: "reformas-reparos",
                        mapQuery: "Encanador",
                      })
                    }
                  >
                    <Text style={styles.chatOptionBtnText}>
                      💧 Encanamento (pias, canos, vazamento)
                    </Text>
                  </Pressable>
                  <Pressable
                    style={styles.chatOptionBtn}
                    onPress={() =>
                      handleChatOption({
                        label: "🎨 Pintura",
                        nextStep: 99,
                        mapCategory: "reformas-reparos",
                        mapQuery: "Pintor",
                      })
                    }
                  >
                    <Text style={styles.chatOptionBtnText}>
                      🎨 Pintura (paredes, portões)
                    </Text>
                  </Pressable>
                  <Pressable
                    style={styles.chatOptionBtn}
                    onPress={() =>
                      handleChatOption({
                        label: "🧱 Pedreiro / Construção",
                        nextStep: 99,
                        mapCategory: "reformas-reparos",
                        mapQuery: "Pedreiro",
                      })
                    }
                  >
                    <Text style={styles.chatOptionBtnText}>
                      🧱 Pedreiro / Construção geral
                    </Text>
                  </Pressable>
                  <Pressable
                    style={styles.chatOptionBtn}
                    onPress={() =>
                      handleChatOption({
                        label: "🔨 Montagem de móveis",
                        nextStep: 99,
                        mapCategory: "reformas-reparos",
                        mapQuery: "Montador",
                      })
                    }
                  >
                    <Text style={styles.chatOptionBtnText}>
                      🔨 Montagem/Desmontagem de móveis
                    </Text>
                  </Pressable>
                </View>
              )}

              {chatStep === 2 && (
                <View style={styles.chatOptionsList}>
                  <Pressable
                    style={styles.chatOptionBtn}
                    onPress={() =>
                      handleChatOption({
                        label: "🧹 Diarista",
                        nextStep: 99,
                        mapCategory: "servicos-domesticos",
                        mapQuery: "Diarista",
                      })
                    }
                  >
                    <Text style={styles.chatOptionBtnText}>
                      🧹 Diarista (limpeza geral)
                    </Text>
                  </Pressable>
                  <Pressable
                    style={styles.chatOptionBtn}
                    onPress={() =>
                      handleChatOption({
                        label: "🧼 Faxineira",
                        nextStep: 99,
                        mapCategory: "servicos-domesticos",
                        mapQuery: "Faxineira",
                      })
                    }
                  >
                    <Text style={styles.chatOptionBtnText}>🧼 Faxineira</Text>
                  </Pressable>
                  <Pressable
                    style={styles.chatOptionBtn}
                    onPress={() =>
                      handleChatOption({
                        label: "👶 Babá / Cuidado infantil",
                        nextStep: 99,
                        mapCategory: "servicos-domesticos",
                        mapQuery: "Babá",
                      })
                    }
                  >
                    <Text style={styles.chatOptionBtnText}>
                      👶 Babá / Cuidado infantil
                    </Text>
                  </Pressable>
                </View>
              )}

              {chatStep === 3 && (
                <View style={styles.chatOptionsList}>
                  <Pressable
                    style={styles.chatOptionBtn}
                    onPress={() =>
                      handleChatOption({
                        label: "📱 Conserto de Celular",
                        nextStep: 99,
                        mapCategory: "assistencia-tecnica",
                        mapQuery: "Celular",
                      })
                    }
                  >
                    <Text style={styles.chatOptionBtnText}>
                      📱 Conserto de Celular
                    </Text>
                  </Pressable>
                  <Pressable
                    style={styles.chatOptionBtn}
                    onPress={() =>
                      handleChatOption({
                        label: "💻 Técnico de Notebook / PC",
                        nextStep: 99,
                        mapCategory: "assistencia-tecnica",
                        mapQuery: "Notebook",
                      })
                    }
                  >
                    <Text style={styles.chatOptionBtnText}>
                      💻 Técnico de Notebook / PC
                    </Text>
                  </Pressable>
                  <Pressable
                    style={styles.chatOptionBtn}
                    onPress={() =>
                      handleChatOption({
                        label: "❄️ Ar-condicionado",
                        nextStep: 99,
                        mapCategory: "assistencia-tecnica",
                        mapQuery: "Ar-condicionado",
                      })
                    }
                  >
                    <Text style={styles.chatOptionBtnText}>
                      ❄️ Ar-condicionado
                    </Text>
                  </Pressable>
                </View>
              )}

              {chatStep === 4 && (
                <View style={styles.chatOptionsList}>
                  <Pressable
                    style={styles.chatOptionBtn}
                    onPress={() =>
                      handleChatOption({
                        label: "✂️ Barbeiro ou Cabeleireiro",
                        nextStep: 99,
                        mapCategory: "beleza-estetica",
                        mapQuery: "Barbeiro",
                      })
                    }
                  >
                    <Text style={styles.chatOptionBtnText}>
                      ✂️ Barbeiro ou Cabeleireiro
                    </Text>
                  </Pressable>
                  <Pressable
                    style={styles.chatOptionBtn}
                    onPress={() =>
                      handleChatOption({
                        label: "💅 Manicure ou Pedicure",
                        nextStep: 99,
                        mapCategory: "beleza-estetica",
                        mapQuery: "Manicure",
                      })
                    }
                  >
                    <Text style={styles.chatOptionBtnText}>
                      💅 Manicure ou Pedicure
                    </Text>
                  </Pressable>
                </View>
              )}

              {chatStep === 5 && (
                <View style={styles.chatOptionsList}>
                  <Pressable
                    style={styles.chatOptionBtn}
                    onPress={() =>
                      handleChatOption({
                        label: "🔧 Mecânico",
                        nextStep: 99,
                        mapCategory: "automotivo",
                        mapQuery: "Mecânico",
                      })
                    }
                  >
                    <Text style={styles.chatOptionBtnText}>
                      🔧 Mecânico / Oficina
                    </Text>
                  </Pressable>
                  <Pressable
                    style={styles.chatOptionBtn}
                    onPress={() =>
                      handleChatOption({
                        label: "🚗 Lava Rápido",
                        nextStep: 99,
                        mapCategory: "automotivo",
                        mapQuery: "Lava Rápido",
                      })
                    }
                  >
                    <Text style={styles.chatOptionBtnText}>🚗 Lava Rápido</Text>
                  </Pressable>
                </View>
              )}

              {chatStep === 99 && (
                <Pressable
                  style={[
                    styles.chatFinalBtn,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={() => {
                    let matchedCat = "todos";
                    let matchedQ = "";
                    if (chatMessages.some((m) => m.text.includes("Elétrica"))) {
                      matchedCat = "reformas-reparos";
                      matchedQ = "Eletricista";
                    } else if (
                      chatMessages.some((m) => m.text.includes("Encanamento"))
                    ) {
                      matchedCat = "reformas-reparos";
                      matchedQ = "Encanador";
                    } else if (
                      chatMessages.some((m) => m.text.includes("Pintura"))
                    ) {
                      matchedCat = "reformas-reparos";
                      matchedQ = "Pintor";
                    } else if (
                      chatMessages.some((m) => m.text.includes("Pedreiro"))
                    ) {
                      matchedCat = "reformas-reparos";
                      matchedQ = "Pedreiro";
                    } else if (
                      chatMessages.some((m) =>
                        m.text.includes("Montagem de móveis"),
                      )
                    ) {
                      matchedCat = "reformas-reparos";
                      matchedQ = "Montador";
                    } else if (
                      chatMessages.some((m) => m.text.includes("Diarista"))
                    ) {
                      matchedCat = "servicos-domesticos";
                      matchedQ = "Diarista";
                    } else if (
                      chatMessages.some((m) => m.text.includes("Faxineira"))
                    ) {
                      matchedCat = "servicos-domesticos";
                      matchedQ = "Faxineira";
                    } else if (
                      chatMessages.some((m) => m.text.includes("Babá"))
                    ) {
                      matchedCat = "servicos-domesticos";
                      matchedQ = "Babá";
                    } else if (
                      chatMessages.some((m) => m.text.includes("Celular"))
                    ) {
                      matchedCat = "assistencia-tecnica";
                      matchedQ = "Celular";
                    } else if (
                      chatMessages.some((m) => m.text.includes("Notebook"))
                    ) {
                      matchedCat = "assistencia-tecnica";
                      matchedQ = "Notebook";
                    } else if (
                      chatMessages.some((m) =>
                        m.text.includes("Ar-condicionado"),
                      )
                    ) {
                      matchedCat = "assistencia-tecnica";
                      matchedQ = "Ar-condicionado";
                    } else if (
                      chatMessages.some((m) => m.text.includes("Barbeiro"))
                    ) {
                      matchedCat = "beleza-estetica";
                      matchedQ = "Barbeiro";
                    } else if (
                      chatMessages.some((m) => m.text.includes("Manicure"))
                    ) {
                      matchedCat = "beleza-estetica";
                      matchedQ = "Manicure";
                    } else if (
                      chatMessages.some((m) => m.text.includes("Mecânico"))
                    ) {
                      matchedCat = "automotivo";
                      matchedQ = "Mecânico";
                    } else if (
                      chatMessages.some((m) => m.text.includes("Lava Rápido"))
                    ) {
                      matchedCat = "automotivo";
                      matchedQ = "Lava Rápido";
                    }

                    completeChatbot(matchedCat, matchedQ);
                  }}
                >
                  <Text style={styles.chatFinalBtnText}>
                    Ver Profissionais Próximos!
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#080808",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1C1C1E",
    backgroundColor: "#080808",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#1C1C1E",
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  locationText: {
    fontSize: 13,
    color: "#22C55E",
    fontWeight: "700",
  },
  subtitleCount: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 2,
  },
  headerRightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerFilterBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111111",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#1C1C1E",
  },
  headerFilterText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  headerToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111111",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#1C1C1E",
  },
  headerToggleText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#080808",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111111",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: "#1C1C1E",
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#FFFFFF",
    padding: 0,
  },
  tabBarContainer: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: "#080808",
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#111111",
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: "#1C1C1E",
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: "#22C55E",
  },
  tabText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#9CA3AF",
  },
  tabTextActive: {
    color: "#FFFFFF",
  },
  pillsWrapper: {
    backgroundColor: "#080808",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1C1C1E",
  },
  pillsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  pillButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#1C1C1E",
  },
  pillButtonActive: {
    backgroundColor: "#22C55E",
    borderColor: "#22C55E",
  },
  pillText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#D1D5DB",
  },
  pillTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  pillButtonMore: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#1F2937",
    borderWidth: 1,
    borderColor: "#374151",
  },
  pillTextMore: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  mainContent: {
    flex: 1,
    position: "relative",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  listContainer: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  providerCard: {
    flexDirection: "row",
    backgroundColor: "#111111",
    borderRadius: 16,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: "#1C1C1E",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 3,
  },
  avatarSection: {
    position: "relative",
  },
  providerAvatar: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: "#1F2937",
  },
  badgeTag: {
    position: "absolute",
    top: 6,
    left: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgePatrocinado: {
    backgroundColor: "#22C55E",
  },
  badgeDestaque: {
    backgroundColor: "#16A34A",
  },
  badgeVerificado: {
    backgroundColor: "#3b82f6",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  providerDetails: {
    flex: 1,
    justifyContent: "center",
  },
  providerHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  providerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  providerName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
    maxWidth: "85%",
  },
  favBtn: {
    padding: 4,
  },
  providerCategory: {
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: 2,
  },
  ratingSection: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  ratingValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
    marginLeft: 4,
  },
  ratingCount: {
    fontSize: 11,
    color: "#9CA3AF",
    marginLeft: 2,
  },
  ratingDot: {
    color: "#9CA3AF",
    marginHorizontal: 6,
  },
  distanceText: {
    fontSize: 12,
    color: "#D1D5DB",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  openText: {
    color: "#22C55E",
    fontSize: 13,
    fontWeight: "700",
  },
  neighborhoodText: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    paddingHorizontal: 30,
    lineHeight: 20,
  },
  scanAreaWrapper: {
    position: "absolute",
    top: 16,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
  },
  scanAreaButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111111",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#1C1C1E",
  },
  scanAreaText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  recenterButton: {
    position: "absolute",
    bottom: 240,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#111111",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    borderWidth: 1,
    borderColor: "#1C1C1E",
    zIndex: 10,
  },
  detailCard: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: "#111111",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 1,
    borderColor: "#1C1C1E",
    zIndex: 10,
  },
  cardCloseBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 20,
    padding: 4,
  },
  cardHeader: {
    flexDirection: "row",
    gap: 12,
  },
  cardAvatar: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: "#1F2937",
  },
  cardInfo: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
    maxWidth: "80%",
  },
  cardSpecialty: {
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: 1,
  },
  cardRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  cardRating: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
    marginLeft: 3,
  },
  cardReviews: {
    fontSize: 11,
    color: "#9CA3AF",
    marginLeft: 2,
  },
  cardDot: {
    color: "#9CA3AF",
    marginHorizontal: 4,
  },
  cardDistance: {
    fontSize: 12,
    color: "#D1D5DB",
  },
  cardOpenStatus: {
    color: "#22C55E",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },
  cardButton: {
    backgroundColor: "#22C55E",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  cardButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#080808",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: Dimensions.get("window").height * 0.75,
    borderWidth: 1,
    borderColor: "#1C1C1E",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1C1C1E",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 16,
    gap: 12,
    justifyContent: "space-between",
  },
  gridItem: {
    width: "30%",
    backgroundColor: "#111111",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#1C1C1E",
    gap: 8,
  },
  gridItemActive: {
    borderColor: "#22C55E",
    backgroundColor: "rgba(34, 197, 94, 0.08)",
  },
  gridIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#080808",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#1C1C1E",
  },
  gridItemLabel: {
    color: "#D1D5DB",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  modalHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 12,
  },
  filterSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
    maxHeight: Dimensions.get("window").height * 0.88,
  },
  filterModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#1C1C1E",
    paddingBottom: 16,
    marginBottom: 10,
  },
  filterCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#111111",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#1C1C1E",
  },
  filterHeaderTitleContainer: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 12,
  },
  filterModalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  filterModalSubtitle: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
  },
  clearFiltersBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "rgba(34, 197, 94, 0.08)",
  },
  clearFiltersText: {
    color: "#22C55E",
    fontSize: 13,
    fontWeight: "700",
  },
  filterFormScroll: {
    marginVertical: 8,
  },
  filterSectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  sortGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "space-between",
  },
  sortCard: {
    width: "48%",
    backgroundColor: "#111111",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#1C1C1E",
    gap: 6,
  },
  sortCardActive: {
    borderColor: "#22C55E",
    backgroundColor: "rgba(34, 197, 94, 0.06)",
  },
  sortCardLabel: {
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  sortCardLabelActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  // Step Slider
  sliderContainer: {
    paddingHorizontal: 12,
    marginVertical: 10,
    marginBottom: 16,
  },
  sliderTrackWrapper: {
    height: 4,
    backgroundColor: "#1C1C1E",
    borderRadius: 2,
    position: "relative",
  },
  sliderTrackBackground: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#1C1C1E",
  },
  sliderTrackActive: {
    position: "absolute",
    left: 0,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#22C55E",
  },
  sliderDot: {
    position: "absolute",
    top: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#111111",
    borderWidth: 2.5,
    borderColor: "#374151",
    transform: [{ translateX: -8 }],
  },
  sliderDotPassed: {
    borderColor: "#22C55E",
    backgroundColor: "#22C55E",
  },
  sliderDotCurrent: {
    width: 20,
    height: 20,
    borderRadius: 10,
    top: -8,
    backgroundColor: "#FFFFFF",
    borderColor: "#22C55E",
    borderWidth: 5,
    transform: [{ translateX: -10 }],
    shadowColor: "#22C55E",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 5,
  },
  sliderLabelsRow: {
    height: 20,
    position: "relative",
    marginTop: 12,
  },
  sliderLabelBtn: {
    position: "absolute",
    width: 60,
    transform: [{ translateX: -30 }],
    alignItems: "center",
  },
  sliderStepLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "600",
  },
  sliderStepLabelActive: {
    color: "#22C55E",
    fontWeight: "800",
  },
  // Circular Categories
  categoryScroll: {
    gap: 12,
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  categoryCircleBtn: {
    alignItems: "center",
    width: 70,
  },
  categoryCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#111111",
    borderWidth: 1.5,
    borderColor: "#1C1C1E",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  categoryCircleActive: {
    borderColor: "#22C55E",
    backgroundColor: "rgba(34, 197, 94, 0.08)",
  },
  categoryCircleLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "600",
    textAlign: "center",
  },
  categoryCircleLabelActive: {
    color: "#22C55E",
    fontWeight: "800",
  },
  // Segmented control
  segmentedContainer: {
    flexDirection: "row",
    backgroundColor: "#111111",
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: "#1C1C1E",
  },
  segmentedButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  segmentedButtonActive: {
    backgroundColor: "#22C55E",
  },
  segmentedText: {
    fontSize: 13,
    color: "#9CA3AF",
    fontWeight: "600",
  },
  segmentedTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  // Rating Row Chips
  ratingRowChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  ratingChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#111111",
    borderWidth: 1.5,
    borderColor: "#1C1C1E",
  },
  ratingChipActive: {
    borderColor: "#22C55E",
    backgroundColor: "rgba(34, 197, 94, 0.08)",
  },
  ratingChipText: {
    color: "#9CA3AF",
    fontSize: 13,
    fontWeight: "600",
  },
  ratingChipTextActive: {
    color: "#22C55E",
    fontWeight: "800",
  },
  // Availability
  availabilityRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "space-between",
  },
  availabilityCard: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111111",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: "#1C1C1E",
    gap: 8,
  },
  availabilityCardActive: {
    borderColor: "#22C55E",
    backgroundColor: "rgba(34, 197, 94, 0.08)",
  },
  availabilityCardLabel: {
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "600",
  },
  availabilityCardLabelActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  // Price row
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 6,
  },
  priceButton: {
    flex: 1,
    backgroundColor: "#111111",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#1C1C1E",
  },
  priceButtonActive: {
    borderColor: "#22C55E",
    backgroundColor: "rgba(34, 197, 94, 0.08)",
  },
  priceButtonText: {
    color: "#9CA3AF",
    fontSize: 13,
    fontWeight: "700",
  },
  priceButtonTextActive: {
    color: "#22C55E",
    fontWeight: "800",
  },
  // Footer apply button
  filterFooter: {
    borderTopWidth: 1,
    borderTopColor: "#1C1C1E",
    paddingTop: 12,
    marginTop: 12,
    backgroundColor: "#080808",
  },
  applyFilterBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  applyFilterBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  filterBadge: {
    backgroundColor: "#22C55E",
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    marginLeft: 6,
  },
  filterBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  clearFiltersBtnText: {
    color: "#22C55E",
    fontSize: 13,
    fontWeight: "700",
  },
  smartMatchBanner: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  smartMatchHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  smartMatchMascot: {
    width: 36,
    height: 48,
    resizeMode: "contain",
  },
  smartMatchTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  smartMatchSub: {
    fontSize: 12,
    marginTop: 2,
  },
  smartMatchClearBtn: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  chatSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    height: "80%",
    width: "100%",
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  chatHeaderMascot: {
    width: 32,
    height: 44,
    resizeMode: "contain",
  },
  chatHeaderTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  chatHeaderSubtitle: {
    fontSize: 12,
    color: "#22C55E",
    fontWeight: "600",
    marginTop: 1,
  },
  chatCloseBtn: {
    padding: 6,
  },
  chatMessagesContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  chatMessageBubble: {
    maxWidth: "80%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  chatBubbleUser: {
    alignSelf: "flex-end",
    backgroundColor: "#22C55E",
    borderBottomRightRadius: 4,
  },
  chatBubbleBot: {
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  chatMessageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  chatTextUser: {
    color: "#FFFFFF",
    fontWeight: "500",
  },
  chatOptionsContainer: {
    padding: 20,
    borderTopWidth: 1,
  },
  chatOptionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chatOptionsList: {
    gap: 8,
  },
  chatOptionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#22C55E",
    backgroundColor: "transparent",
  },
  chatOptionBtnText: {
    color: "#22C55E",
    fontSize: 13,
    fontWeight: "700",
  },
  chatFinalBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#22C55E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  chatFinalBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
});
