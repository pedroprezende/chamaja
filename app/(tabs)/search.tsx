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
  { id: "servicos-profissionais", name: "Serviços Profissionais", icon: "business-center" },
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

export default function SearchScreen() {
  const colors = useColors();
  const router = useRouter();
  const { coords, addressName, permissionGranted } = useLocation();
  const { isFavorite, toggleFavorite } = useFavorites();
  const mapComponentRef = useRef<any>(null);
  const [mapCenter, setMapCenter] = useState<{ latitude: number; longitude: number } | null>(null);

  const isDefaultCity = addressName === "Bragança Paulista - SP";
  const showDistance = coords !== null;

  // Estados principais
  const [query, setQuery] = useState("");
  const [isMapView, setIsMapView] = useState(false);
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<"prestadores" | "comercios">("prestadores");
  const [selectedPill, setSelectedPill] = useState("todos");
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [showMoreModal, setShowMoreModal] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [activeProximityFilter, setActiveProximityFilter] = useState<"all" | "1" | "3" | "5" | "10">("all");
  const [activeSort, setActiveSort] = useState<"distance" | "rating" | "none">("distance");

  // tRPC query para pegar prestadores e comércios ativos
  const { data: dbProviders = [], isLoading: loadingProviders, refetch } = trpc.providers.list.useQuery();

  // Coordenadas padrão de Bragança Paulista - SP
  const defaultCoords = { latitude: -22.9520, longitude: -46.5420 };
  const userCoords = coords || defaultCoords;

  // Filtrar prestadores/comércios client-side
  const filtered = useMemo(() => {
    return dbProviders.filter((p) => {
      // 1. Filtrar por Tab Ativa
      const isComercio = p.categoryId === "comercios";
      if (activeTab === "prestadores" && isComercio) return false;
      if (activeTab === "comercios" && !isComercio) return false;

      // 2. Filtrar por Categoria / Especialidade Selecionada nas Pills
      if (selectedPill !== "todos") {
        if (activeTab === "prestadores") {
          if (p.categoryId !== selectedPill) return false;
        } else {
          if (p.subcategoryId !== selectedPill) return false;
        }
      }

      // 3. Filtrar por Texto da Busca (se houver)
      if (query.trim()) {
        const q = query.toLowerCase();
        const nameMatch = (p.name || "").toLowerCase().includes(q);
        const descMatch = (p.description || "").toLowerCase().includes(q);
        const catMatch = (p.category || "").toLowerCase().includes(q);
        const subNameMatch = (p.subcategoryName || "").toLowerCase().includes(q);
        const neighborhoodMatch = (p.neighborhood || "").toLowerCase().includes(q);
        return nameMatch || descMatch || catMatch || subNameMatch || neighborhoodMatch;
      }

      return true;
    });
  }, [dbProviders, activeTab, selectedPill, query]);

  // Adicionar distância, filtrar por proximidade e ordenar
  const providersList = useMemo(() => {
    let list = filtered.map((p) => {
      let distanceKm = 9999;
      let distanceStr = "";
      if (p.latitude !== null && p.latitude !== undefined && p.longitude !== null && p.longitude !== undefined) {
        distanceKm = calculateHaversineDistance(
          userCoords.latitude,
          userCoords.longitude,
          Number(p.latitude),
          Number(p.longitude)
        );
        distanceStr = formatDistancePtBr(distanceKm);
      }
      return {
        ...p,
        distanceKm,
        distanceStr,
      };
    });

    // 1. Filtrar por proximidade máxima
    if (showDistance && activeProximityFilter !== "all") {
      const maxDist = Number(activeProximityFilter);
      list = list.filter((p) => p.distanceKm <= maxDist);
    }

    // 2. Ordenar
    return list.sort((a, b) => {
      if (activeSort === "rating") {
        return (b.rating || 0) - (a.rating || 0);
      }
      if (showDistance && activeSort === "distance") {
        return a.distanceKm - b.distanceKm;
      }
      
      // Default (relevância): Premium/Annual primeiro, depois distância
      const isAPremium = a.plan === "premium" || a.plan === "annual";
      const isBPremium = b.plan === "premium" || b.plan === "annual";
      if (isAPremium && !isBPremium) return -1;
      if (!isAPremium && isBPremium) return 1;

      if (showDistance) {
        return a.distanceKm - b.distanceKm;
      }
      return 0;
    });
  }, [filtered, userCoords, activeProximityFilter, activeSort, showDistance]);

  // Prestador selecionado no mapa
  const selectedProvider = useMemo(() => {
    if (!selectedProviderId) return null;
    return providersList.find((p) => p.id === selectedProviderId) || null;
  }, [selectedProviderId, providersList]);

  // Adiciona logs detalhados de localização do usuário, endereço selecionado e prestadores
  useEffect(() => {
    console.log("=== [DIAGNÓSTICO LOCALIZAÇÃO] ===");
    console.log(`- Endereço Selecionado: "${addressName}"`);
    console.log(`- Coordenadas do Endereço/Usuário: Lat ${userCoords.latitude}, Lng ${userCoords.longitude}`);
    console.log(`- Coordenadas do Fallback/GPS Ativo: ${coords ? `Lat ${coords.latitude}, Lng ${coords.longitude}` : "Nenhuma (Usando Fallback Padrão -22.9520, -46.5420)"}`);
    console.log(`- Total de Prestadores Mapeados: ${providersList.length}`);
    providersList.forEach((p, idx) => {
      console.log(`  [Prestador #${idx + 1}] Nome: "${p.name}" | Cat: "${p.category || p.subcategoryName}" | Bairro: "${p.neighborhood}" | Coordenadas: Lat ${p.latitude}, Lng ${p.longitude} | Distância: ${p.distanceStr || 'N/A'}`);
    });
    console.log("=================================");
  }, [userCoords, addressName, coords, providersList]);

  // Ao trocar de aba, resetamos o filtro de subcategoria e o selecionado no mapa
  const handleTabChange = (tab: "prestadores" | "comercios") => {
    setActiveTab(tab);
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

  const currentPills = activeTab === "prestadores" ? PRESTADORES_PILLS : COMERCIOS_PILLS;
  const morePills = activeTab === "prestadores" ? PRESTADORES_MORE : COMERCIOS_MORE;

  const currentCount = providersList.length;
  const countLabel = activeTab === "prestadores"
    ? `${currentCount} profissionais encontrados`
    : `${currentCount} comércios encontrados`;

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
              <Text style={styles.locationText} numberOfLines={1}>📍 {addressName}</Text>
              <MaterialIcons name="keyboard-arrow-down" size={16} color="#22C55E" />
            </Pressable>
            <Text style={styles.subtitleCount}>{countLabel}</Text>
          </View>

          {/* Botões de Ação Direta */}
          <View style={styles.headerRightRow}>
            {!isMapView && (
              <Pressable 
                style={styles.headerFilterBtn}
                onPress={() => setFilterModalVisible(true)}
              >
                <MaterialIcons name="tune" size={20} color="#22C55E" />
                <Text style={styles.headerFilterText}>Filtros</Text>
                {(activeProximityFilter !== "all" || activeSort !== "distance") && (
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#EF4444", position: "absolute", top: 2, right: 2 }} />
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
              <Text style={[styles.headerToggleText, isMapView && { color: "#22C55E" }]}>
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
              activeTab === "prestadores"
                ? "Buscar serviço ou profissional..."
                : "Buscar comércio ou local..."
            }
            placeholderTextColor="#9CA3AF"
            value={query}
            onChangeText={(t) => {
              setQuery(t);
              setSelectedProviderId(null);
            }}
            autoCorrect={false}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery("")}>
              <MaterialIcons name="close" size={18} color="#9CA3AF" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Tabs Segmentadas: Prestadores vs Comércios */}
      <View style={styles.tabBarContainer}>
        <View style={styles.tabBar}>
          <Pressable
            onPress={() => handleTabChange("prestadores")}
            style={[styles.tabButton, activeTab === "prestadores" && styles.tabButtonActive]}
          >
            <MaterialIcons
              name="person"
              size={18}
              color={activeTab === "prestadores" ? "#FFFFFF" : "#9CA3AF"}
            />
            <Text style={[styles.tabText, activeTab === "prestadores" && styles.tabTextActive]}>
              Prestadores
            </Text>
          </Pressable>

          <Pressable
            onPress={() => handleTabChange("comercios")}
            style={[styles.tabButton, activeTab === "comercios" && styles.tabButtonActive]}
          >
            <MaterialIcons
              name="storefront"
              size={18}
              color={activeTab === "comercios" ? "#FFFFFF" : "#9CA3AF"}
            />
            <Text style={[styles.tabText, activeTab === "comercios" && styles.tabTextActive]}>
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
                style={[styles.pillButton, isSelected && styles.pillButtonActive]}
              >
                <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>
                  {pill.name}
                </Text>
              </Pressable>
            );
          })}
          <Pressable
            onPress={() => setShowMoreModal(true)}
            style={styles.pillButtonMore}
          >
            <MaterialIcons name="grid-view" size={16} color="#D1D5DB" style={{ marginRight: 4 }} />
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
                  <ActivityIndicator size="small" color="#22C55E" style={{ marginRight: 6 }} />
                ) : (
                  <MaterialIcons name="refresh" size={18} color="#22C55E" style={{ marginRight: 6 }} />
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
                      uri: selectedProvider.avatarUri || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
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
                      {selectedProvider.category || selectedProvider.subcategoryName}
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
                  onPress={() => router.push(`/professional/${selectedProvider.id}` as any)}
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
                        uri: item.avatarUri || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
                      }}
                      style={styles.providerAvatar}
                      contentFit="cover"
                    />
                    {item.topBadge && (
                      <View
                        style={[
                          styles.badgeTag,
                          item.topBadge === "Patrocinado" && styles.badgePatrocinado,
                          item.topBadge === "Destaque" && styles.badgeDestaque,
                          item.topBadge === "Verificado" && styles.badgeVerificado,
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
                            avatar: item.avatarUri || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}`,
                            rating: Number(item.rating) || 0,
                            phone: item.phone || item.whatsapp || "",
                            type: (typeof item.plan === "string" && (item.plan.toLowerCase() === "premium" || item.plan.toLowerCase() === "annual" || item.plan.toLowerCase() === "monthly")) ? "premium" : "free",
                            latitude: item.latitude ? Number(item.latitude) : null,
                            longitude: item.longitude ? Number(item.longitude) : null,
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
                      <Text style={styles.ratingValue}>{Number(item.rating).toFixed(1)}</Text>
                      <Text style={styles.ratingCount}>({item.ratingCount})</Text>
                      {showDistance && item.distanceStr ? (
                        <>
                          <Text style={styles.ratingDot}>•</Text>
                          <Text style={styles.distanceText}>📍 {item.distanceStr}</Text>
                        </>
                      ) : null}
                    </View>

                    <View style={styles.statusRow}>
                      <Text style={styles.openText}>Aberto agora</Text>
                      <Text style={styles.neighborhoodText}>{item.neighborhood}</Text>
                    </View>
                  </View>
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialIcons name="search-off" size={60} color="#9CA3AF" />
                <Text style={styles.emptyTitle}>Nenhum profissional encontrado</Text>
                <Text style={styles.emptySubtitle}>
                  Tente alterar seus termos de busca ou selecionar outra categoria.
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
              <Pressable onPress={() => setShowMoreModal(false)} style={styles.modalCloseBtn}>
                <MaterialIcons name="close" size={24} color="#FFFFFF" />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.modalGrid}>
              {/* Opção Todos */}
              <Pressable
                onPress={() => {
                  setSelectedPill("todos");
                  setShowMoreModal(false);
                  setSelectedProviderId(null);
                }}
                style={[styles.gridItem, selectedPill === "todos" && styles.gridItemActive]}
              >
                <View style={styles.gridIconContainer}>
                  <MaterialIcons name="all-inclusive" size={24} color="#22C55E" />
                </View>
                <Text style={styles.gridItemLabel}>Todos</Text>
              </Pressable>

              {/* Pills padrões */}
              {currentPills.slice(1).map((pill) => (
                <Pressable
                  key={pill.id}
                  onPress={() => {
                    setSelectedPill(pill.id);
                    setShowMoreModal(false);
                    setSelectedProviderId(null);
                  }}
                  style={[styles.gridItem, selectedPill === pill.id && styles.gridItemActive]}
                >
                  <View style={styles.gridIconContainer}>
                    <MaterialIcons name={pill.icon as any} size={24} color="#22C55E" />
                  </View>
                  <Text style={styles.gridItemLabel}>{pill.name}</Text>
                </Pressable>
              ))}

              {/* Pills adicionais */}
              {morePills.map((pill) => (
                <Pressable
                  key={pill.id}
                  onPress={() => {
                    setSelectedPill(pill.id);
                    setShowMoreModal(false);
                    setSelectedProviderId(null);
                  }}
                  style={[styles.gridItem, selectedPill === pill.id && styles.gridItemActive]}
                >
                  <View style={styles.gridIconContainer}>
                    <MaterialIcons name={pill.icon as any} size={24} color="#22C55E" />
                  </View>
                  <Text style={styles.gridItemLabel}>{pill.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal de Filtros Avançados */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setFilterModalVisible(false)} />
          <View style={[styles.filterSheet, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
            <Text style={styles.modalTitle}>Filtrar e Ordenar</Text>
            
            <ScrollView showsVerticalScrollIndicator={false} style={{ marginVertical: 12 }}>
              {/* Seção Ordenação */}
              <Text style={styles.filterSectionTitle}>Ordenar por</Text>
              <View style={styles.filterOptionsGroup}>
                {[
                  { id: "distance", label: "Mais próximos", icon: "gps-fixed" },
                  { id: "rating", label: "Melhor Avaliação", icon: "star" },
                  { id: "none", label: "Padrão (Relevância)", icon: "sort" }
                ].map((opt) => {
                  const isSel = activeSort === opt.id;
                  return (
                    <Pressable
                      key={opt.id}
                      onPress={() => setActiveSort(opt.id as any)}
                      style={[styles.filterOption, isSel && styles.filterOptionActive]}
                    >
                      <MaterialIcons name={opt.icon as any} size={20} color={isSel ? "#22C55E" : "#9CA3AF"} />
                      <Text style={[styles.filterOptionText, isSel && { color: "#22C55E", fontWeight: "700" }]}>
                        {opt.label}
                      </Text>
                      {isSel && <MaterialIcons name="check" size={20} color="#22C55E" />}
                    </Pressable>
                  );
                })}
              </View>

              {/* Seção Proximidade */}
              {showDistance && (
                <>
                  <Text style={[styles.filterSectionTitle, { marginTop: 16 }]}>Distância Máxima</Text>
                  <View style={styles.filterOptionsGroup}>
                    {[
                      { id: "all", label: "Qualquer distância" },
                      { id: "1", label: "Até 1 km" },
                      { id: "3", label: "Até 3 km" },
                      { id: "5", label: "Até 5 km" },
                      { id: "10", label: "Até 10 km" }
                    ].map((opt) => {
                      const isSel = activeProximityFilter === opt.id;
                      return (
                        <Pressable
                          key={opt.id}
                          onPress={() => setActiveProximityFilter(opt.id as any)}
                          style={[styles.filterOption, isSel && styles.filterOptionActive]}
                        >
                          <MaterialIcons name="place" size={20} color={isSel ? "#22C55E" : "#9CA3AF"} />
                          <Text style={[styles.filterOptionText, isSel && { color: "#22C55E", fontWeight: "700" }]}>
                            {opt.label}
                          </Text>
                          {isSel && <MaterialIcons name="check" size={20} color="#22C55E" />}
                        </Pressable>
                      );
                    })}
                  </View>
                </>
              )}
            </ScrollView>

            <Pressable
              style={[styles.applyFilterBtn, { backgroundColor: "#22C55E" }]}
              onPress={() => setFilterModalVisible(false)}
            >
              <Text style={styles.applyFilterBtnText}>Aplicar Filtros</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <AddressSelectorModal
        visible={addressModalVisible}
        onClose={() => setAddressModalVisible(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111827",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1F2937",
    backgroundColor: "#111827",
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
    backgroundColor: "#1F2937",
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
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
    fontWeight: "600",
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
    backgroundColor: "#1F2937",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#22C55E",
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
    backgroundColor: "#1F2937",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
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
    backgroundColor: "#111827",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1F2937",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
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
    backgroundColor: "#111827",
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#1F2937",
    borderRadius: 10,
    padding: 3,
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
    fontSize: 14,
    fontWeight: "600",
    color: "#9CA3AF",
  },
  tabTextActive: {
    color: "#FFFFFF",
  },
  pillsWrapper: {
    backgroundColor: "#111827",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1F2937",
  },
  pillsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  pillButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#1F2937",
  },
  pillButtonActive: {
    backgroundColor: "#22C55E",
  },
  pillText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#D1D5DB",
  },
  pillTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  pillButtonMore: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#374151",
  },
  pillTextMore: {
    fontSize: 13,
    fontWeight: "500",
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
    backgroundColor: "#1F2937",
    borderRadius: 16,
    padding: 12,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarSection: {
    position: "relative",
  },
  providerAvatar: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: "#374151",
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
    fontWeight: "800",
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
    fontWeight: "700",
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
    fontWeight: "600",
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
    fontWeight: "700",
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
    backgroundColor: "#1F2937",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#374151",
  },
  scanAreaText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  recenterButton: {
    position: "absolute",
    bottom: 240,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#1F2937",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    borderWidth: 1,
    borderColor: "#374151",
    zIndex: 10,
  },
  detailCard: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: "#1F2937",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 1,
    borderColor: "#374151",
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
    backgroundColor: "#374151",
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
    fontWeight: "700",
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
    fontWeight: "600",
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
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#111827",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: Dimensions.get("window").height * 0.7,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1F2937",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
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
    backgroundColor: "#1F2937",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "transparent",
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
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
  },
  gridItemLabel: {
    color: "#D1D5DB",
    fontSize: 12,
    fontWeight: "600",
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
    padding: 20,
    paddingBottom: 40,
    maxHeight: Dimensions.get("window").height * 0.85,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 10,
  },
  filterOptionsGroup: {
    gap: 8,
  },
  filterOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1F2937",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "transparent",
    gap: 12,
  },
  filterOptionActive: {
    borderColor: "#22C55E",
    backgroundColor: "rgba(34, 197, 94, 0.08)",
  },
  filterOptionText: {
    flex: 1,
    fontSize: 14,
    color: "#D1D5DB",
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
});
