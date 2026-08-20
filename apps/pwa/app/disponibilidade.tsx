import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Switch,
  ActivityIndicator,
  Alert,
  Platform,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/lib/auth-context";
import { vanillaTrpc } from "@/lib/trpc";
import { categories, subcategoriesByCategory, type Category, type Subcategory } from "@/data/mock";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const ALL_DAYS = [
  { key: "seg", label: "Seg", full: "Segunda-feira" },
  { key: "ter", label: "Ter", full: "Terça-feira" },
  { key: "qua", label: "Qua", full: "Quarta-feira" },
  { key: "qui", label: "Qui", full: "Quinta-feira" },
  { key: "sex", label: "Sex", full: "Sexta-feira" },
  { key: "sab", label: "Sáb", full: "Sábado" },
  { key: "dom", label: "Dom", full: "Domingo" },
];

const ALL_SHIFTS = [
  { key: "manha", label: "Manhã", sub: "Até 12h", icon: "wb-sunny" },
  { key: "tarde", label: "Tarde", sub: "12h às 18h", icon: "wb-twilight" },
  { key: "noite", label: "Noite", sub: "Após 18h", icon: "nights-stay" },
];

const DEFAULT_CITIES = [
  "Bragança Paulista",
  "Atibaia",
  "Extrema",
  "Itatiba",
  "Campinas",
  "São Paulo",
  "Piracaia",
  "Jarinu",
];

const DISTANCE_PRESETS = [10, 20, 30, 50, 100];

export default function DisponibilidadeScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [isAvailable, setIsAvailable] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>(["Bragança Paulista"]);
  const [customCityInput, setCustomCityInput] = useState("");
  const [maxDistanceKm, setMaxDistanceKm] = useState(30);
  const [availableDays, setAvailableDays] = useState<string[]>(["seg", "ter", "qua", "qui", "sex"]);
  const [selectedShifts, setSelectedShifts] = useState<string[]>(["manha", "tarde"]);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("18:00");
  const [notes, setNotes] = useState("");

  const [providerInfo, setProviderInfo] = useState<{
    hasProviderProfile: boolean;
    providerName: string;
    providerCategory: string;
    providerCity: string;
  } | null>(null);

  const triggerHaptic = (style = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(style);
    }
  };

  const loadAvailability = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await vanillaTrpc.providers.getOpportunityAvailability.query();
      if (data) {
        setIsAvailable(data.isAvailable ?? true);
        setSelectedCategories(data.categories || []);
        setSelectedSubcategories(data.subcategories || []);
        setSelectedCities(data.cities && data.cities.length > 0 ? data.cities : ["Bragança Paulista"]);
        setMaxDistanceKm(data.maxDistanceKm || 30);
        setAvailableDays(data.availableDays && data.availableDays.length > 0 ? data.availableDays : ["seg", "ter", "qua", "qui", "sex"]);
        setSelectedShifts(data.shifts && data.shifts.length > 0 ? data.shifts : ["manha", "tarde"]);
        setStartTime(data.startTime || "08:00");
        setEndTime(data.endTime || "18:00");
        setNotes(data.notes || "");

        setProviderInfo({
          hasProviderProfile: data.hasProviderProfile,
          providerName: data.providerName || user.name || "",
          providerCategory: data.providerCategory || "",
          providerCity: data.providerCity || "",
        });
      }
    } catch (err: any) {
      console.error("Erro ao carregar disponibilidade:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAvailability();
  }, [user?.id]);

  // Handlers for toggles
  const toggleCategory = (catName: string) => {
    triggerHaptic();
    setSelectedCategories((prev) =>
      prev.includes(catName) ? prev.filter((c) => c !== catName) : [...prev, catName]
    );
  };

  const toggleSubcategory = (subName: string) => {
    triggerHaptic();
    setSelectedSubcategories((prev) =>
      prev.includes(subName) ? prev.filter((s) => s !== subName) : [...prev, subName]
    );
  };

  const toggleCity = (city: string) => {
    triggerHaptic();
    setSelectedCities((prev) =>
      prev.includes(city)
        ? prev.length > 1
          ? prev.filter((c) => c !== city)
          : prev
        : [...prev, city]
    );
  };

  const addCustomCity = () => {
    const trimmed = customCityInput.trim();
    if (!trimmed) return;
    if (!selectedCities.includes(trimmed)) {
      setSelectedCities((prev) => [...prev, trimmed]);
      triggerHaptic();
    }
    setCustomCityInput("");
  };

  const toggleDay = (dayKey: string) => {
    triggerHaptic();
    setAvailableDays((prev) =>
      prev.includes(dayKey)
        ? prev.length > 1
          ? prev.filter((d) => d !== dayKey)
          : prev
        : [...prev, dayKey]
    );
  };

  const selectPresetDays = (type: "weekdays" | "all" | "weekend") => {
    triggerHaptic();
    if (type === "weekdays") {
      setAvailableDays(["seg", "ter", "qua", "qui", "sex"]);
    } else if (type === "weekend") {
      setAvailableDays(["sab", "dom"]);
    } else {
      setAvailableDays(["seg", "ter", "qua", "qui", "sex", "sab", "dom"]);
    }
  };

  const toggleShift = (shiftKey: string) => {
    triggerHaptic();
    setSelectedShifts((prev) =>
      prev.includes(shiftKey)
        ? prev.length > 1
          ? prev.filter((s) => s !== shiftKey)
          : prev
        : [...prev, shiftKey]
    );
  };

  const handleSave = async () => {
    if (!user) {
      Alert.alert("Atenção", "Você precisa estar conectado para salvar sua disponibilidade.");
      return;
    }

    if (selectedCategories.length === 0) {
      Alert.alert("Atenção", "Selecione ao menos uma categoria de serviço.");
      return;
    }

    if (selectedCities.length === 0) {
      Alert.alert("Atenção", "Selecione ao menos uma cidade de atendimento.");
      return;
    }

    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);

    try {
      await vanillaTrpc.providers.updateOpportunityAvailability.mutate({
        isAvailable,
        categories: selectedCategories,
        subcategories: selectedSubcategories,
        cities: selectedCities,
        maxDistanceKm,
        availableDays,
        shifts: selectedShifts,
        startTime,
        endTime,
        notes: notes.trim(),
      });

      if (Platform.OS === "web") {
        alert("Disponibilidade salva com sucesso!");
      } else {
        Alert.alert("Sucesso! 🎉", "Sua disponibilidade foi atualizada com sucesso.");
      }
    } catch (err: any) {
      console.error("Erro ao salvar disponibilidade:", err);
      Alert.alert("Erro", err.message || "Não foi possível salvar a disponibilidade.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenContainer
      style={{ backgroundColor: colors.background }}
      edges={["top", "left", "right"]}
    >
      <StatusBar style="light" />

      {/* ── Header ── */}
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
              router.replace("/(tabs)/profile" as any);
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
            Disponibilidade
          </Text>
          <Text style={[styles.headerSubtitle, { color: isAvailable ? "#25D366" : colors.muted }]}>
            {isAvailable ? "🟢 Recebendo Oportunidades" : "⚪ Pausado Temporariamente"}
          </Text>
        </View>

        <Pressable
          onPress={handleSave}
          disabled={saving || loading}
          style={({ pressed }) => [
            styles.saveHeaderBtn,
            { backgroundColor: "#25D366" },
            (pressed || saving) && { opacity: 0.8 },
          ]}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#000000" />
          ) : (
            <Text style={styles.saveHeaderBtnText}>Salvar</Text>
          )}
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#25D366" />
          <Text style={[styles.loadingText, { color: colors.muted }]}>
            Carregando configurações de disponibilidade...
          </Text>
        </View>
      ) : !user ? (
        <View style={styles.emptyBox}>
          <MaterialIcons name="lock-outline" size={48} color={colors.primary} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            Faça login para gerenciar sua disponibilidade
          </Text>
          <Text style={[styles.emptyDesc, { color: colors.muted }]}>
            Conecte-se para configurar seus serviços, raio de atendimento e horários disponíveis.
          </Text>
          <Pressable
            onPress={() => router.push("/(tabs)/profile" as any)}
            style={[styles.loginBtn, { backgroundColor: "#25D366" }]}
          >
            <Text style={styles.loginBtnText}>Entrar na Conta</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.contentContainer,
            { paddingBottom: Math.max(insets.bottom, 24) + 80 },
          ]}
        >
          {/* ── Status Card: "Estou disponível para oportunidades" ── */}
          <View
            style={[
              styles.statusCard,
              {
                backgroundColor: isAvailable
                  ? "rgba(37, 211, 102, 0.1)"
                  : colors.surface,
                borderColor: isAvailable ? "rgba(37, 211, 102, 0.3)" : colors.border,
              },
            ]}
          >
            <View style={styles.statusCardLeft}>
              <View
                style={[
                  styles.statusIconCircle,
                  { backgroundColor: isAvailable ? "#25D366" : "rgba(255,255,255,0.1)" },
                ]}
              >
                <MaterialIcons
                  name={isAvailable ? "work" : "work-off"}
                  size={20}
                  color={isAvailable ? "#000000" : colors.muted}
                />
              </View>
              <View style={styles.statusTextWrap}>
                <Text style={[styles.statusCardTitle, { color: colors.foreground }]}>
                  Estou disponível para oportunidades
                </Text>
                <Text style={[styles.statusCardDesc, { color: colors.muted }]}>
                  {isAvailable
                    ? "Seu perfil está apto a receber propostas e candidatar-se a vagas."
                    : "Pausado: você não receberá novas oportunidades até reativar."}
                </Text>
              </View>
            </View>

            <Switch
              value={isAvailable}
              onValueChange={(val) => {
                triggerHaptic();
                setIsAvailable(val);
              }}
              trackColor={{ false: "#3F3F46", true: "#25D366" }}
              thumbColor={Platform.OS === "android" ? (isAvailable ? "#FFFFFF" : "#A1A1AA") : "#FFFFFF"}
            />
          </View>

          {/* ── Section 1: Categorias e Especialidades ── */}
          <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.sectionHeaderRow}>
              <MaterialIcons name="category" size={18} color="#25D366" />
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Categorias & Serviços que realiza
              </Text>
            </View>
            <Text style={[styles.sectionSubtitle, { color: colors.muted }]}>
              Selecione as áreas onde você tem experiência e interesse em atuar.
            </Text>

            <View style={styles.chipsWrap}>
              {categories.map((cat: Category) => {
                const isSelected = selectedCategories.includes(cat.name) || selectedCategories.includes(cat.id);
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => toggleCategory(cat.name)}
                    style={[
                      styles.chip,
                      isSelected
                        ? { backgroundColor: "#25D366", borderColor: "#25D366" }
                        : { backgroundColor: colors.background, borderColor: colors.border },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        {
                          color: isSelected ? "#000000" : colors.foreground,
                          fontWeight: isSelected ? "800" : "600",
                        },
                      ]}
                    >
                      {cat.name}
                    </Text>
                    {isSelected && <MaterialIcons name="check" size={14} color="#000000" />}
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* ── Section 2: Cidades e Regiões ── */}
          <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.sectionHeaderRow}>
              <MaterialIcons name="place" size={18} color="#60A5FA" />
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Cidades e Regiões onde atende
              </Text>
            </View>
            <Text style={[styles.sectionSubtitle, { color: colors.muted }]}>
              Marque as cidades onde você aceita prestar serviços.
            </Text>

            <View style={styles.chipsWrap}>
              {DEFAULT_CITIES.map((city) => {
                const isSelected = selectedCities.includes(city);
                return (
                  <Pressable
                    key={city}
                    onPress={() => toggleCity(city)}
                    style={[
                      styles.chip,
                      isSelected
                        ? { backgroundColor: "#60A5FA", borderColor: "#60A5FA" }
                        : { backgroundColor: colors.background, borderColor: colors.border },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        {
                          color: isSelected ? "#000000" : colors.foreground,
                          fontWeight: isSelected ? "800" : "600",
                        },
                      ]}
                    >
                      {city}
                    </Text>
                    {isSelected && <MaterialIcons name="check" size={14} color="#000000" />}
                  </Pressable>
                );
              })}
            </View>

            {/* Add custom city */}
            <View style={styles.addCityRow}>
              <TextInput
                style={[
                  styles.cityInput,
                  { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground },
                ]}
                placeholder="Outra cidade ou bairro..."
                placeholderTextColor="#71717A"
                value={customCityInput}
                onChangeText={setCustomCityInput}
                onSubmitEditing={addCustomCity}
              />
              <Pressable
                onPress={addCustomCity}
                style={[styles.addCityBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <MaterialIcons name="add" size={20} color="#25D366" />
              </Pressable>
            </View>
          </View>

          {/* ── Section 3: Raio Máximo de Deslocamento ── */}
          <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.sectionHeaderRow}>
              <MaterialIcons name="near-me" size={18} color="#F59E0B" />
              <View style={styles.distanceTitleRow}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  Distância máxima de deslocamento
                </Text>
                <Text style={[styles.distanceValueBadge, { color: "#F59E0B" }]}>
                  Até {maxDistanceKm} km
                </Text>
              </View>
            </View>
            <Text style={[styles.sectionSubtitle, { color: colors.muted }]}>
              Raio de distância máxima a partir da sua base que você aceita se locomover.
            </Text>

            <View style={styles.distancePresetsRow}>
              {DISTANCE_PRESETS.map((km) => {
                const isSelected = maxDistanceKm === km;
                return (
                  <Pressable
                    key={km}
                    onPress={() => {
                      triggerHaptic();
                      setMaxDistanceKm(km);
                    }}
                    style={[
                      styles.distancePill,
                      isSelected
                        ? { backgroundColor: "#F59E0B", borderColor: "#F59E0B" }
                        : { backgroundColor: colors.background, borderColor: colors.border },
                    ]}
                  >
                    <Text
                      style={[
                        styles.distancePillText,
                        {
                          color: isSelected ? "#000000" : colors.foreground,
                          fontWeight: isSelected ? "800" : "600",
                        },
                      ]}
                    >
                      {km} km
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* ── Section 4: Dias da Semana ── */}
          <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.sectionHeaderRow}>
              <MaterialIcons name="event" size={18} color="#A78BFA" />
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Dias disponíveis na semana
              </Text>
            </View>

            <View style={styles.presetDaysRow}>
              <Pressable
                onPress={() => selectPresetDays("weekdays")}
                style={[styles.presetDayBtn, { borderColor: colors.border }]}
              >
                <Text style={[styles.presetDayBtnText, { color: colors.muted }]}>Dias úteis (Seg-Sex)</Text>
              </Pressable>
              <Pressable
                onPress={() => selectPresetDays("all")}
                style={[styles.presetDayBtn, { borderColor: colors.border }]}
              >
                <Text style={[styles.presetDayBtnText, { color: colors.muted }]}>Todos os dias</Text>
              </Pressable>
            </View>

            <View style={styles.daysGrid}>
              {ALL_DAYS.map((day) => {
                const isSelected = availableDays.includes(day.key);
                return (
                  <Pressable
                    key={day.key}
                    onPress={() => toggleDay(day.key)}
                    style={[
                      styles.dayCircle,
                      isSelected
                        ? { backgroundColor: "#A78BFA", borderColor: "#A78BFA" }
                        : { backgroundColor: colors.background, borderColor: colors.border },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayCircleText,
                        {
                          color: isSelected ? "#000000" : colors.foreground,
                          fontWeight: isSelected ? "900" : "600",
                        },
                      ]}
                    >
                      {day.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* ── Section 5: Horários e Turnos ── */}
          <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.sectionHeaderRow}>
              <MaterialIcons name="schedule" size={18} color="#EC4899" />
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Turnos e Horários disponíveis
              </Text>
            </View>

            <View style={styles.shiftsGrid}>
              {ALL_SHIFTS.map((shift) => {
                const isSelected = selectedShifts.includes(shift.key);
                return (
                  <Pressable
                    key={shift.key}
                    onPress={() => toggleShift(shift.key)}
                    style={[
                      styles.shiftCard,
                      isSelected
                        ? { backgroundColor: "rgba(236, 72, 153, 0.15)", borderColor: "#EC4899" }
                        : { backgroundColor: colors.background, borderColor: colors.border },
                    ]}
                  >
                    <MaterialIcons
                      name={shift.icon as any}
                      size={20}
                      color={isSelected ? "#EC4899" : colors.muted}
                    />
                    <Text
                      style={[
                        styles.shiftTitle,
                        { color: isSelected ? "#EC4899" : colors.foreground, fontWeight: "800" },
                      ]}
                    >
                      {shift.label}
                    </Text>
                    <Text style={[styles.shiftSub, { color: colors.muted }]}>{shift.sub}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.timeRangeRow}>
              <View style={styles.timeInputBox}>
                <Text style={[styles.timeInputLabel, { color: colors.muted }]}>Das</Text>
                <TextInput
                  style={[styles.timeInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                  value={startTime}
                  onChangeText={setStartTime}
                  placeholder="08:00"
                  placeholderTextColor="#71717A"
                />
              </View>
              <Text style={[styles.timeSeparator, { color: colors.muted }]}>até</Text>
              <View style={styles.timeInputBox}>
                <Text style={[styles.timeInputLabel, { color: colors.muted }]}>Às</Text>
                <TextInput
                  style={[styles.timeInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                  value={endTime}
                  onChangeText={setEndTime}
                  placeholder="18:00"
                  placeholderTextColor="#71717A"
                />
              </View>
            </View>
          </View>

          {/* ── Section 6: Observações / Diferenciais ── */}
          <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.sectionHeaderRow}>
              <MaterialIcons name="edit-note" size={18} color="#25D366" />
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Observações e Diferenciais (Opcional)
              </Text>
            </View>
            <Text style={[styles.sectionSubtitle, { color: colors.muted }]}>
              Ex: Possuo ferramentas profissionais, veículo próprio, disponibilidade imediata.
            </Text>

            <TextInput
              style={[
                styles.notesInput,
                { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground },
              ]}
              multiline
              numberOfLines={3}
              placeholder="Descreva observações importantes sobre sua disponibilidade..."
              placeholderTextColor="#71717A"
              value={notes}
              onChangeText={setNotes}
            />
          </View>
        </ScrollView>
      )}

      {/* ── Sticky Bottom Save Button ── */}
      {user && !loading && (
        <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={[styles.saveMainBtn, { backgroundColor: "#25D366" }]}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#000000" />
            ) : (
              <View style={styles.saveBtnContent}>
                <MaterialIcons name="save" size={20} color="#000000" />
                <Text style={styles.saveMainBtnText}>Salvar Disponibilidade</Text>
              </View>
            )}
          </Pressable>
        </View>
      )}
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
  },
  saveHeaderBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  saveHeaderBtnText: {
    color: "#000000",
    fontSize: 12,
    fontWeight: "800",
  },
  loadingBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
  },
  emptyBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },
  emptyDesc: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 280,
  },
  loginBtn: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  loginBtnText: {
    color: "#000000",
    fontSize: 13,
    fontWeight: "800",
  },
  contentContainer: {
    padding: 16,
    gap: 16,
  },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  statusCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    paddingRight: 10,
  },
  statusIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  statusTextWrap: {
    flex: 1,
  },
  statusCardTitle: {
    fontSize: 14,
    fontWeight: "800",
  },
  statusCardDesc: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  sectionCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    flex: 1,
  },
  sectionSubtitle: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: -4,
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
  },
  addCityRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  cityInput: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 12,
  },
  addCityBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  distanceTitleRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  distanceValueBadge: {
    fontSize: 13,
    fontWeight: "900",
  },
  distancePresetsRow: {
    flexDirection: "row",
    gap: 8,
  },
  distancePill: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  distancePillText: {
    fontSize: 12,
  },
  presetDaysRow: {
    flexDirection: "row",
    gap: 8,
  },
  presetDayBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  presetDayBtnText: {
    fontSize: 10,
    fontWeight: "700",
  },
  daysGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 4,
  },
  dayCircle: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCircleText: {
    fontSize: 12,
  },
  shiftsGrid: {
    flexDirection: "row",
    gap: 8,
  },
  shiftCard: {
    flex: 1,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    gap: 4,
  },
  shiftTitle: {
    fontSize: 12,
  },
  shiftSub: {
    fontSize: 9,
  },
  timeRangeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
  },
  timeInputBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  timeInputLabel: {
    fontSize: 11,
    fontWeight: "700",
  },
  timeInput: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "700",
  },
  timeSeparator: {
    fontSize: 11,
    fontWeight: "700",
  },
  notesInput: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    fontSize: 12,
    minHeight: 70,
    textAlignVertical: "top",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  saveMainBtn: {
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  saveMainBtnText: {
    color: "#000000",
    fontSize: 14,
    fontWeight: "900",
  },
});
