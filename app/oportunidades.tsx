import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Dimensions,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useLocation } from "@/lib/location-context";
import { vanillaTrpc } from "@/lib/trpc";
import { categories, subcategoriesByCategory, type Category, type Subcategory } from "@/data/mock";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

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
  return `${d}/${m}`;
}

export default function OportunidadesScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const locationCtx = useLocation();

  // Data States
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 7 Filter States
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("todos");
  const [selectedSubcategory, setSelectedSubcategory] = useState("todos");
  const [selectedCity, setSelectedCity] = useState("Todas");
  const [dateFilter, setDateFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState<"qualquer" | "manha" | "tarde" | "noite">("qualquer");
  const [minBudgetFilter, setMinBudgetFilter] = useState<number | undefined>(undefined);
  const [maxDistanceFilter, setMaxDistanceFilter] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState<"recent" | "budget_desc" | "distance" | "date_asc">("recent");

  // Bottom Sheet Modal
  const [showFiltersModal, setShowFiltersModal] = useState(false);

  const triggerHaptic = (style = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(style);
    }
  };

  // Available subcategories for current category
  const availableSubcategories = useMemo(() => {
    if (selectedCategory === "todos") return [];
    return subcategoriesByCategory[selectedCategory] || [];
  }, [selectedCategory]);

  const handleCategorySelect = (catId: string) => {
    triggerHaptic();
    setSelectedCategory(catId);
    setSelectedSubcategory("todos");
  };

  const fetchOpportunities = async (isPull = false) => {
    if (isPull) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const userLat = locationCtx.coords?.latitude;
      const userLng = locationCtx.coords?.longitude;

      const res = await vanillaTrpc.needs.list.query({
        status: "ativa",
        search: search.trim() || undefined,
        categoryId: selectedCategory !== "todos" ? selectedCategory : undefined,
        subcategoryId: selectedSubcategory !== "todos" ? selectedSubcategory : undefined,
        city: selectedCity !== "Todas" ? selectedCity : undefined,
        dateFilter: dateFilter !== "all" ? dateFilter : undefined,
        timeFilter: timeFilter !== "qualquer" ? timeFilter : undefined,
        minBudget: minBudgetFilter,
        sortBy: sortBy,
        latitude: userLat,
        longitude: userLng,
        maxDistanceKm: maxDistanceFilter,
        limit: 50,
      });

      if (res && Array.isArray(res.items)) {
        setOpportunities(res.items);
      } else {
        setOpportunities([]);
      }
    } catch (err: any) {
      console.error("Erro ao buscar oportunidades:", err);
      setError(err.message || "Não foi possível carregar as oportunidades.");
    } finally {
      setLoading(false);
      setRefreshing(false);
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
    sortBy,
    minBudgetFilter,
    maxDistanceFilter,
    locationCtx.coords?.latitude,
    locationCtx.coords?.longitude,
  ]);

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOpportunities();
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const clearAllFilters = () => {
    triggerHaptic();
    setSearch("");
    setSelectedCategory("todos");
    setSelectedSubcategory("todos");
    setSelectedCity("Todas");
    setDateFilter("all");
    setTimeFilter("qualquer");
    setMinBudgetFilter(undefined);
    setMaxDistanceFilter(undefined);
    setSortBy("recent");
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (search !== "") count++;
    if (selectedCategory !== "todos") count++;
    if (selectedSubcategory !== "todos") count++;
    if (selectedCity !== "Todas") count++;
    if (dateFilter !== "all") count++;
    if (timeFilter !== "qualquer") count++;
    if (minBudgetFilter !== undefined) count++;
    if (maxDistanceFilter !== undefined) count++;
    return count;
  }, [
    search,
    selectedCategory,
    selectedSubcategory,
    selectedCity,
    dateFilter,
    timeFilter,
    minBudgetFilter,
    maxDistanceFilter,
  ]);

  const paymentLabels: Record<string, string> = {
    total: "Total",
    diaria: "Diária",
    hora: "Hora",
    a_combinar: "A Combinar",
  };

  const availableCities = ["Todas", "Bragança Paulista", "Atibaia", "Extrema", "Itatiba", "Campinas", "São Paulo"];

  return (
    <ScreenContainer
      style={{ backgroundColor: colors.background }}
      edges={["top", "left", "right"]}
    >
      <StatusBar style="light" />

      {/* ── Top Header ── */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Pressable
          onPress={() => {
            triggerHaptic();
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/(tabs)" as any);
            }
          }}
          style={({ pressed }) => [
            styles.backBtn,
            { backgroundColor: colors.surface, borderColor: colors.border },
            pressed && { opacity: 0.7 },
          ]}
        >
          <MaterialIcons name="arrow-back" size={22} color={colors.foreground} />
        </Pressable>

        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            Encontrar Oportunidades
          </Text>
          <Text style={[styles.headerSubtitle, { color: "#25D366" }]}>
            {opportunities.length}{" "}
            {opportunities.length === 1 ? "vaga disponível" : "vagas disponíveis"}
          </Text>
        </View>

        <Pressable
          onPress={() => {
            triggerHaptic();
            router.push("/preciso-de-alguem" as any);
          }}
          style={({ pressed }) => [
            styles.publishBtn,
            pressed && { opacity: 0.8 },
          ]}
        >
          <MaterialIcons name="add" size={18} color="#000000" />
          <Text style={styles.publishBtnText}>Publicar</Text>
        </Pressable>
      </View>

      {/* ── Search Bar & Quick Filter Trigger ── */}
      <View
        style={[
          styles.searchSection,
          {
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={styles.searchRow}>
          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <MaterialIcons name="search" size={20} color={colors.muted} />
            <TextInput
              style={[styles.searchInput, { color: colors.foreground }]}
              placeholder="Buscar serviço, eletricista, pintor..."
              placeholderTextColor="#71717A"
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch("")} hitSlop={8}>
                <MaterialIcons name="close" size={18} color={colors.muted} />
              </Pressable>
            )}
          </View>

          {/* Filter Bottom Sheet Trigger Button */}
          <Pressable
            onPress={() => {
              triggerHaptic();
              setShowFiltersModal(true);
            }}
            style={[
              styles.filterTriggerBtn,
              activeFiltersCount > 0
                ? { backgroundColor: "#25D366", borderColor: "#25D366" }
                : { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <MaterialIcons
              name="tune"
              size={20}
              color={activeFiltersCount > 0 ? "#000000" : colors.foreground}
            />
            {activeFiltersCount > 0 && (
              <View style={styles.filterBadgeCircle}>
                <Text style={styles.filterBadgeCircleText}>{activeFiltersCount}</Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Quick Filter Horizontal Scroll (Categories) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickChipsRow}
        >
          <Pressable
            onPress={() => handleCategorySelect("todos")}
            style={[
              styles.quickChip,
              selectedCategory === "todos"
                ? { backgroundColor: "rgba(37, 211, 102, 0.15)", borderColor: "#25D366" }
                : { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text
              style={[
                styles.quickChipText,
                { color: selectedCategory === "todos" ? "#25D366" : colors.muted },
              ]}
            >
              Todas
            </Text>
          </Pressable>

          {categories.map((cat: Category) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <Pressable
                key={cat.id}
                onPress={() => handleCategorySelect(isSelected ? "todos" : cat.id)}
                style={[
                  styles.quickChip,
                  isSelected
                    ? { backgroundColor: "rgba(37, 211, 102, 0.15)", borderColor: "#25D366" }
                    : { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <Text
                  style={[
                    styles.quickChipText,
                    { color: isSelected ? "#25D366" : colors.muted },
                  ]}
                >
                  {cat.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Feed List ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.feedContainer,
          { paddingBottom: Math.max(insets.bottom, 24) + 40 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchOpportunities(true)}
            tintColor="#25D366"
            colors={["#25D366"]}
          />
        }
      >
        {loading && !refreshing ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#25D366" />
            <Text style={[styles.loadingText, { color: colors.muted }]}>
              Filtrando oportunidades...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.emptyBox}>
            <MaterialIcons name="error-outline" size={44} color="#EF4444" />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              Erro ao carregar oportunidades
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.muted }]}>{error}</Text>
            <Pressable
              onPress={() => fetchOpportunities()}
              style={[styles.retryBtn, { backgroundColor: "#25D366" }]}
            >
              <Text style={styles.retryBtnText}>Tentar Novamente</Text>
            </Pressable>
          </View>
        ) : opportunities.length === 0 ? (
          <View style={styles.emptyBox}>
            <View
              style={[
                styles.emptyIconCircle,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <MaterialIcons name="work-outline" size={36} color={colors.muted} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              Nenhuma oportunidade encontrada
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.muted }]}>
              Não encontramos necessidades ativas com os filtros atuais.
              Tente limpar os filtros para ver todas as vagas.
            </Text>
            <Pressable
              onPress={clearAllFilters}
              style={[styles.clearFilterBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <MaterialIcons name="replay" size={16} color="#25D366" />
              <Text style={[styles.clearFilterBtnText, { color: colors.foreground }]}>
                Limpar Todos os Filtros
              </Text>
            </Pressable>
          </View>
        ) : (
          opportunities.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => {
                triggerHaptic();
                router.push(`/needs/${item.id}` as any);
              }}
              style={({ pressed }) => [
                styles.oppCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
                pressed && {
                  opacity: 0.9,
                  transform: [{ scale: 0.99 }],
                },
              ]}
            >
              {/* Card Header: Category & Time Ago */}
              <View style={styles.cardTopRow}>
                <View style={styles.categoryBadgeRow}>
                  {item.category && (
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>{item.category}</Text>
                    </View>
                  )}
                  {item.subcategoryName && (
                    <View style={styles.subcategoryBadge}>
                      <Text style={styles.subcategoryBadgeText}>{item.subcategoryName}</Text>
                    </View>
                  )}
                </View>

                <Text style={[styles.timeAgoText, { color: colors.muted }]}>
                  {formatTimeAgo(item.createdAt)}
                </Text>
              </View>

              {/* Title & Description */}
              <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={[styles.cardDescription, { color: colors.muted }]} numberOfLines={2}>
                {item.description}
              </Text>

              {/* Meta Grid */}
              <View style={styles.metaGrid}>
                <View style={styles.metaItem}>
                  <MaterialIcons name="place" size={14} color="#25D366" />
                  <Text style={[styles.metaText, { color: colors.foreground }]} numberOfLines={1}>
                    {item.neighborhood ? `${item.neighborhood} — ` : ""}
                    {item.city}
                  </Text>
                </View>

                {item.distanceStr && (
                  <View style={styles.metaItem}>
                    <MaterialIcons name="near-me" size={14} color="#25D366" />
                    <Text style={[styles.metaDistanceText, { color: "#25D366" }]}>
                      {item.distanceStr}
                    </Text>
                  </View>
                )}

                <View style={styles.metaItem}>
                  <MaterialIcons name="event" size={14} color="#60A5FA" />
                  <Text style={[styles.metaText, { color: colors.foreground }]}>
                    {formatFriendlyDate(item.startDate)}
                    {item.endDate ? ` a ${formatFriendlyDate(item.endDate)}` : ""}
                  </Text>
                </View>

                {(item.startTime || item.endTime) && (
                  <View style={styles.metaItem}>
                    <MaterialIcons name="schedule" size={14} color="#F59E0B" />
                    <Text style={[styles.metaText, { color: colors.foreground }]}>
                      {item.startTime || "--:--"} às {item.endTime || "--:--"}
                    </Text>
                  </View>
                )}

                <View style={styles.metaItem}>
                  <MaterialIcons
                    name="people"
                    size={14}
                    color={item.filledSpots > 0 ? "#F59E0B" : "#25D366"}
                  />
                  <Text
                    style={[
                      styles.metaText,
                      {
                        color: item.filledSpots > 0 ? "#F59E0B" : colors.foreground,
                        fontWeight: "700",
                      },
                    ]}
                  >
                    {item.filledSpots} de {item.requiredProfessionals} profissionais necessários
                    {item.filledSpots > 0
                      ? ` (${item.requiredProfessionals - item.filledSpots} restante${item.requiredProfessionals - item.filledSpots === 1 ? "" : "s"})`
                      : ""}
                  </Text>
                </View>
              </View>

              {/* Requirements highlight if present */}
              {item.requirements && (
                <View
                  style={[
                    styles.requirementsBox,
                    { backgroundColor: "rgba(255, 255, 255, 0.04)" },
                  ]}
                >
                  <MaterialIcons name="checklist" size={14} color={colors.muted} />
                  <Text style={[styles.requirementsText, { color: colors.muted }]} numberOfLines={1}>
                    Req: {item.requirements}
                  </Text>
                </View>
              )}

              {/* Card Footer: Financial Offer & Action Link */}
              <View style={[styles.cardFooter, { borderTopColor: "rgba(255,255,255,0.06)" }]}>
                <View>
                  <Text style={[styles.budgetLabel, { color: colors.muted }]}>Valor oferecido:</Text>
                  <View style={styles.budgetRow}>
                    <Text style={styles.budgetValue}>
                      {item.paymentType === "a_combinar" || !item.budget
                        ? "A Combinar"
                        : `R$ ${Number(item.budget).toFixed(2).replace(".", ",")}`}
                    </Text>
                    <Text style={[styles.paymentBadge, { color: colors.muted }]}>
                      / {paymentLabels[item.paymentType] || item.paymentType}
                    </Text>
                  </View>
                </View>

                <View style={styles.seeMoreBtn}>
                  <Text style={styles.seeMoreBtnText}>Ver Detalhes</Text>
                  <MaterialIcons name="arrow-forward" size={16} color="#25D366" />
                </View>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>

      {/* ── Mobile Filters Bottom Sheet Modal ── */}
      <Modal
        visible={showFiltersModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFiltersModal(false)}
      >
        <View style={styles.sheetOverlay}>
          <Pressable style={styles.sheetBackdrop} onPress={() => setShowFiltersModal(false)} />

          <View
            style={[
              styles.sheetContent,
              {
                backgroundColor: colors.surface,
                paddingBottom: Math.max(insets.bottom, 20) + 10,
              },
            ]}
          >
            {/* Sheet Handle */}
            <View style={styles.sheetHandle} />

            {/* Sheet Header */}
            <View style={styles.sheetHeader}>
              <View style={styles.sheetHeaderTitleRow}>
                <MaterialIcons name="tune" size={20} color="#25D366" />
                <Text style={[styles.sheetTitle, { color: colors.foreground }]}>
                  Filtros de Oportunidades
                </Text>
              </View>

              <View style={styles.sheetHeaderActions}>
                {activeFiltersCount > 0 && (
                  <Pressable onPress={clearAllFilters} hitSlop={8}>
                    <Text style={styles.sheetClearText}>Limpar</Text>
                  </Pressable>
                )}
                <Pressable onPress={() => setShowFiltersModal(false)} hitSlop={8}>
                  <MaterialIcons name="close" size={22} color={colors.muted} />
                </Pressable>
              </View>
            </View>

            <ScrollView style={styles.sheetScroll} showsVerticalScrollIndicator={false}>
              {/* 1. Categorias */}
              <View style={styles.sheetSection}>
                <Text style={[styles.sheetSectionTitle, { color: colors.muted }]}>
                  CATEGORIA
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sheetPillsRow}>
                  <Pressable
                    onPress={() => handleCategorySelect("todos")}
                    style={[
                      styles.sheetPill,
                      selectedCategory === "todos"
                        ? { backgroundColor: "#25D366", borderColor: "#25D366" }
                        : { backgroundColor: colors.background, borderColor: colors.border },
                    ]}
                  >
                    <Text
                      style={[
                        styles.sheetPillText,
                        { color: selectedCategory === "todos" ? "#000000" : colors.muted },
                      ]}
                    >
                      Todas
                    </Text>
                  </Pressable>

                  {categories.map((cat) => (
                    <Pressable
                      key={cat.id}
                      onPress={() => handleCategorySelect(cat.id)}
                      style={[
                        styles.sheetPill,
                        selectedCategory === cat.id
                          ? { backgroundColor: "#25D366", borderColor: "#25D366" }
                          : { backgroundColor: colors.background, borderColor: colors.border },
                      ]}
                    >
                      <Text
                        style={[
                          styles.sheetPillText,
                          { color: selectedCategory === cat.id ? "#000000" : colors.muted },
                        ]}
                      >
                        {cat.name}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              {/* 2. Subcategorias (se houver categoria selecionada) */}
              {selectedCategory !== "todos" && availableSubcategories.length > 0 && (
                <View style={styles.sheetSection}>
                  <Text style={[styles.sheetSectionTitle, { color: colors.muted }]}>
                    ESPECIALIDADE / SUBCATEGORIA
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sheetPillsRow}>
                    <Pressable
                      onPress={() => {
                        triggerHaptic();
                        setSelectedSubcategory("todos");
                      }}
                      style={[
                        styles.sheetPill,
                        selectedSubcategory === "todos"
                          ? { backgroundColor: "#25D366", borderColor: "#25D366" }
                          : { backgroundColor: colors.background, borderColor: colors.border },
                      ]}
                    >
                      <Text
                        style={[
                          styles.sheetPillText,
                          { color: selectedSubcategory === "todos" ? "#000000" : colors.muted },
                        ]}
                      >
                        Todas
                      </Text>
                    </Pressable>

                    {availableSubcategories.map((sub) => (
                      <Pressable
                        key={sub.id}
                        onPress={() => {
                          triggerHaptic();
                          setSelectedSubcategory(sub.id);
                        }}
                        style={[
                          styles.sheetPill,
                          selectedSubcategory === sub.id
                            ? { backgroundColor: "#25D366", borderColor: "#25D366" }
                            : { backgroundColor: colors.background, borderColor: colors.border },
                        ]}
                      >
                        <Text
                          style={[
                            styles.sheetPillText,
                            { color: selectedSubcategory === sub.id ? "#000000" : colors.muted },
                          ]}
                        >
                          {sub.name}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* 3. Cidades */}
              <View style={styles.sheetSection}>
                <Text style={[styles.sheetSectionTitle, { color: colors.muted }]}>CIDADE</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sheetPillsRow}>
                  {availableCities.map((city) => {
                    const isSelected = selectedCity === city;
                    return (
                      <Pressable
                        key={city}
                        onPress={() => {
                          triggerHaptic();
                          setSelectedCity(city);
                        }}
                        style={[
                          styles.sheetPill,
                          isSelected
                            ? { backgroundColor: "#25D366", borderColor: "#25D366" }
                            : { backgroundColor: colors.background, borderColor: colors.border },
                        ]}
                      >
                        <Text
                          style={[
                            styles.sheetPillText,
                            { color: isSelected ? "#000000" : colors.muted },
                          ]}
                        >
                          {city}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              {/* 4. Data do Serviço */}
              <View style={styles.sheetSection}>
                <Text style={[styles.sheetSectionTitle, { color: colors.muted }]}>DATA</Text>
                <View style={styles.sheetGridRow}>
                  {[
                    { key: "all", label: "Qualquer data" },
                    { key: "today", label: "Hoje" },
                    { key: "tomorrow", label: "Amanhã" },
                    { key: "week", label: "Esta semana" },
                  ].map((d) => (
                    <Pressable
                      key={d.key}
                      onPress={() => {
                        triggerHaptic();
                        setDateFilter(d.key);
                      }}
                      style={[
                        styles.sheetGridBtn,
                        dateFilter === d.key
                          ? { backgroundColor: "#25D366", borderColor: "#25D366" }
                          : { backgroundColor: colors.background, borderColor: colors.border },
                      ]}
                    >
                      <Text
                        style={[
                          styles.sheetGridBtnText,
                          { color: dateFilter === d.key ? "#000000" : colors.foreground },
                        ]}
                      >
                        {d.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* 5. Turno / Horário */}
              <View style={styles.sheetSection}>
                <Text style={[styles.sheetSectionTitle, { color: colors.muted }]}>TURNO / HORÁRIO</Text>
                <View style={styles.sheetGridRow}>
                  {[
                    { key: "qualquer", label: "Qualquer" },
                    { key: "manha", label: "Manhã" },
                    { key: "tarde", label: "Tarde" },
                    { key: "noite", label: "Noite" },
                  ].map((t) => (
                    <Pressable
                      key={t.key}
                      onPress={() => {
                        triggerHaptic();
                        setTimeFilter(t.key as any);
                      }}
                      style={[
                        styles.sheetGridBtn,
                        timeFilter === t.key
                          ? { backgroundColor: "#25D366", borderColor: "#25D366" }
                          : { backgroundColor: colors.background, borderColor: colors.border },
                      ]}
                    >
                      <Text
                        style={[
                          styles.sheetGridBtnText,
                          { color: timeFilter === t.key ? "#000000" : colors.foreground },
                        ]}
                      >
                        {t.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* 6. Valor Mínimo */}
              <View style={styles.sheetSection}>
                <Text style={[styles.sheetSectionTitle, { color: colors.muted }]}>VALOR MÍNIMO</Text>
                <View style={styles.sheetGridRow}>
                  {[
                    { label: "Todos", val: undefined },
                    { label: "R$ 100+", val: 100 },
                    { label: "R$ 300+", val: 300 },
                    { label: "R$ 500+", val: 500 },
                  ].map((b, idx) => (
                    <Pressable
                      key={idx}
                      onPress={() => {
                        triggerHaptic();
                        setMinBudgetFilter(b.val);
                      }}
                      style={[
                        styles.sheetGridBtn,
                        minBudgetFilter === b.val
                          ? { backgroundColor: "#25D366", borderColor: "#25D366" }
                          : { backgroundColor: colors.background, borderColor: colors.border },
                      ]}
                    >
                      <Text
                        style={[
                          styles.sheetGridBtnText,
                          { color: minBudgetFilter === b.val ? "#000000" : colors.foreground },
                        ]}
                      >
                        {b.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* 7. Raio de Distância */}
              <View style={styles.sheetSection}>
                <Text style={[styles.sheetSectionTitle, { color: colors.muted }]}>RAIO DE DISTÂNCIA</Text>
                <View style={styles.sheetGridRow}>
                  {[
                    { label: "Todas", val: undefined },
                    { label: "10 km", val: 10 },
                    { label: "25 km", val: 25 },
                    { label: "50 km", val: 50 },
                  ].map((dist, idx) => (
                    <Pressable
                      key={idx}
                      onPress={() => {
                        triggerHaptic();
                        setMaxDistanceFilter(dist.val);
                      }}
                      style={[
                        styles.sheetGridBtn,
                        maxDistanceFilter === dist.val
                          ? { backgroundColor: "#25D366", borderColor: "#25D366" }
                          : { backgroundColor: colors.background, borderColor: colors.border },
                      ]}
                    >
                      <Text
                        style={[
                          styles.sheetGridBtnText,
                          { color: maxDistanceFilter === dist.val ? "#000000" : colors.foreground },
                        ]}
                      >
                        {dist.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </ScrollView>

            {/* Bottom Apply CTA */}
            <View style={styles.sheetFooter}>
              <Pressable
                onPress={() => {
                  triggerHaptic();
                  setShowFiltersModal(false);
                }}
                style={[styles.sheetApplyBtn, { backgroundColor: "#25D366" }]}
              >
                <Text style={styles.sheetApplyBtnText}>
                  Ver {opportunities.length} Oportunidade{opportunities.length === 1 ? "" : "s"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleWrap: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  publishBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#25D366",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  publishBtnText: {
    color: "#000000",
    fontSize: 12,
    fontWeight: "800",
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 10,
    borderBottomWidth: 1,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    height: "100%",
  },
  filterTriggerBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  filterBadgeCircle: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#000000",
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#25D366",
  },
  filterBadgeCircleText: {
    color: "#25D366",
    fontSize: 9,
    fontWeight: "900",
  },
  quickChipsRow: {
    gap: 6,
    paddingVertical: 2,
  },
  quickChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  quickChipText: {
    fontSize: 11,
    fontWeight: "700",
  },
  feedContainer: {
    padding: 16,
    gap: 14,
  },
  loadingBox: {
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
  },
  emptyBox: {
    paddingVertical: 60,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    textAlign: "center",
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "800",
    textAlign: "center",
  },
  emptyDesc: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 280,
  },
  clearFilterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 6,
  },
  clearFilterBtnText: {
    fontSize: 12,
    fontWeight: "700",
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 6,
  },
  retryBtnText: {
    color: "#000000",
    fontSize: 12,
    fontWeight: "800",
  },
  oppCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  categoryBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  categoryBadge: {
    backgroundColor: "rgba(37, 211, 102, 0.12)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryBadgeText: {
    color: "#25D366",
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  subcategoryBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  subcategoryBadgeText: {
    color: "#D4D4D8",
    fontSize: 10,
    fontWeight: "600",
  },
  timeAgoText: {
    fontSize: 11,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
  },
  cardDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  metaGrid: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
    paddingVertical: 2,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    fontWeight: "600",
  },
  metaDistanceText: {
    fontSize: 11,
    fontWeight: "800",
  },
  requirementsBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  requirementsText: {
    fontSize: 11,
    fontStyle: "italic",
    flex: 1,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    paddingTop: 8,
  },
  budgetLabel: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  budgetRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  budgetValue: {
    color: "#25D366",
    fontSize: 14,
    fontWeight: "900",
  },
  paymentBadge: {
    fontSize: 11,
  },
  seeMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  seeMoreBtnText: {
    color: "#25D366",
    fontSize: 12,
    fontWeight: "800",
  },
  sheetOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  sheetBackdrop: {
    flex: 1,
  },
  sheetContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    paddingTop: 8,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignSelf: "center",
    marginBottom: 8,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  sheetHeaderTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  sheetHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sheetClearText: {
    color: "#25D366",
    fontSize: 12,
    fontWeight: "700",
  },
  sheetScroll: {
    paddingHorizontal: 20,
  },
  sheetSection: {
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  sheetSectionTitle: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  sheetPillsRow: {
    gap: 8,
  },
  sheetPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  sheetPillText: {
    fontSize: 12,
    fontWeight: "700",
  },
  sheetGridRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  sheetGridBtn: {
    flex: 1,
    minWidth: (SCREEN_WIDTH - 64) / 2,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetGridBtnText: {
    fontSize: 12,
    fontWeight: "700",
  },
  sheetFooter: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  sheetApplyBtn: {
    width: "100%",
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetApplyBtnText: {
    color: "#000000",
    fontSize: 14,
    fontWeight: "900",
  },
});
