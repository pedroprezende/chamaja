import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "@/lib/location-context";
import { storage } from "@/lib/storage";
import { vanillaTrpc } from "@/lib/trpc";
import {
  categories as mockCategories,
  subcategoriesByCategory,
  Category,
  Subcategory,
} from "@/data/mock";
import LocationConfirmationMap from "@/components/location-confirmation-map";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export type PaymentType = "total" | "diaria" | "hora" | "a_combinar";

interface NeedFormData {
  title: string;
  categoryId: string;
  categoryName: string;
  subcategoryId: string;
  subcategoryName: string;
  description: string;
  requiredProfessionals: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  paymentType: PaymentType;
  budget: string; // Formatted number
  cep: string;
  address: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  requirements: string;
  notes: string;
  photos: string[]; // Local URIs or uploaded URLs
}

const INITIAL_FORM: NeedFormData = {
  title: "",
  categoryId: "reformas-reparos",
  categoryName: "Reformas e Reparos",
  subcategoryId: "eletricista",
  subcategoryName: "Eletricista",
  description: "",
  requiredProfessionals: 1,
  startDate: new Date().toISOString().split("T")[0],
  endDate: "",
  startTime: "08:00",
  endTime: "17:00",
  paymentType: "total",
  budget: "",
  cep: "",
  address: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "Bragança Paulista",
  latitude: null,
  longitude: null,
  requirements: "",
  notes: "",
  photos: [],
};

export default function PrecisoDeAlguemScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isSignedIn } = useAuth();
  const locationCtx = useLocation();

  // Wizard Steps: 1: Serviço, 2: Prazos & Valores, 3: Localização, 4: Requisitos & Fotos, 5: Revisão, 6: Sucesso
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formData, setFormData] = useState<NeedFormData>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [publishedNeedId, setPublishedNeedId] = useState<string | null>(null);
  const [showMapModal, setShowMapModal] = useState(false);

  // Subcategory list based on selected category
  const activeSubcategories =
    subcategoriesByCategory[formData.categoryId] || [];

  // Initialize with user location if available
  useEffect(() => {
    if (locationCtx.coords && !formData.latitude) {
      setFormData((prev) => ({
        ...prev,
        latitude: locationCtx.coords?.latitude ?? null,
        longitude: locationCtx.coords?.longitude ?? null,
      }));
    }
  }, [locationCtx.coords]);

  const triggerHaptic = (
    style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light
  ) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(style);
    }
  };

  const handleBack = () => {
    triggerHaptic();
    if (currentStep > 1 && currentStep < 6) {
      setCurrentStep((prev) => prev - 1);
    } else {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/(tabs)" as any);
      }
    }
  };

  const handleLogin = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/auth/login" as any);
  };

  // Helper CEP Search
  const handleSearchCep = async (textCep: string) => {
    const cleanCep = textCep.replace(/\D/g, "");
    setFormData((prev) => ({ ...prev, cep: textCep }));

    if (cleanCep.length === 8) {
      setIsSearchingCep(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await res.json();
        if (data && !data.erro) {
          triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
          setFormData((prev) => ({
            ...prev,
            address: data.logradouro || prev.address,
            neighborhood: data.bairro || prev.neighborhood,
            city: data.localidade || prev.city,
          }));

          // Geocode address
          try {
            const nomRes = await fetch(
              `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
                `${data.logradouro}, ${data.bairro}, ${data.localidade}, Brasil`
              )}&format=json&limit=1`,
              {
                headers: {
                  "User-Agent": "XamaJaApp/1.0",
                },
              }
            );
            const nomData = await nomRes.json();
            if (Array.isArray(nomData) && nomData.length > 0) {
              setFormData((prev) => ({
                ...prev,
                latitude: parseFloat(nomData[0].lat),
                longitude: parseFloat(nomData[0].lon),
              }));
            }
          } catch (geoErr) {
            console.warn("Nominatim CEP search warning:", geoErr);
          }
        } else {
          Alert.alert("CEP não encontrado", "Verifique os números digitados.");
        }
      } catch (err) {
        console.warn("Erro ao buscar CEP:", err);
      } finally {
        setIsSearchingCep(false);
      }
    }
  };

  // Pick photos from device
  const handlePickPhotos = async () => {
    triggerHaptic();
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permissão Necessária",
          "Precisamos de acesso às suas fotos para anexar imagens da necessidade."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 5 - formData.photos.length,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newUris = result.assets.map((asset) => asset.uri);
        setFormData((prev) => ({
          ...prev,
          photos: [...prev.photos, ...newUris].slice(0, 5),
        }));
      }
    } catch (err) {
      console.warn("Erro ao selecionar fotos:", err);
      Alert.alert("Erro", "Não foi possível carregar as fotos.");
    }
  };

  const handleRemovePhoto = (index: number) => {
    triggerHaptic();
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, idx) => idx !== index),
    }));
  };

  // Step Validation
  const validateStep = (step: number): boolean => {
    if (step === 1) {
      if (!formData.title.trim() || formData.title.trim().length < 3) {
        Alert.alert(
          "Título Obrigatório",
          "Informe um título claro com pelo menos 3 caracteres para o que você precisa."
        );
        return false;
      }
      if (!formData.categoryId) {
        Alert.alert(
          "Categoria Obrigatória",
          "Selecione uma categoria para o seu pedido."
        );
        return false;
      }
      if (
        !formData.description.trim() ||
        formData.description.trim().length < 10
      ) {
        Alert.alert(
          "Descrição Detalhada",
          "Descreva o serviço com pelo menos 10 caracteres para que os profissionais compreendam o pedido."
        );
        return false;
      }
      if (formData.requiredProfessionals < 1) {
        Alert.alert(
          "Quantidade",
          "A quantidade de profissionais deve ser de no mínimo 1."
        );
        return false;
      }
      return true;
    }

    if (step === 2) {
      if (!formData.startDate) {
        Alert.alert(
          "Data de Início",
          "Informe a data em que o serviço deverá começar (AAAA-MM-DD)."
        );
        return false;
      }
      if (formData.paymentType !== "a_combinar" && !formData.budget) {
        Alert.alert(
          "Valor Oferecido",
          "Informe o valor estimado ou marque a opção 'A combinar'."
        );
        return false;
      }
      return true;
    }

    if (step === 3) {
      if (!formData.city.trim()) {
        Alert.alert("Cidade Obrigatória", "Informe a cidade da necessidade.");
        return false;
      }
      return true;
    }

    return true;
  };

  const handleNextStep = () => {
    if (!validateStep(currentStep)) return;
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setCurrentStep((prev) => prev + 1);
  };

  // Final Publish Action
  const handlePublish = async () => {
    if (!isSignedIn || !user) {
      handleLogin();
      return;
    }

    triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
    setIsSubmitting(true);

    try {
      // 1. Upload photos to Supabase Storage if they are local URIs
      let uploadedPhotoUrls: string[] = [];
      if (formData.photos.length > 0) {
        setIsUploadingPhotos(true);
        for (const localUri of formData.photos) {
          if (localUri.startsWith("http")) {
            uploadedPhotoUrls.push(localUri);
          } else {
            try {
              const uploaded = await storage.uploadImage(
                localUri,
                "chamaja-images"
              );
              if (uploaded) {
                uploadedPhotoUrls.push(uploaded);
              }
            } catch (upErr) {
              console.warn("Falha no upload da foto:", upErr);
            }
          }
        }
        setIsUploadingPhotos(false);
      }

      // 2. Parse numeric budget
      const parsedBudget =
        formData.paymentType === "a_combinar"
          ? null
          : parseFloat(formData.budget.replace(/[^\d.,]/g, "").replace(",", ".")) ||
            null;

      // 3. Build full address
      let fullAddress = formData.address.trim();
      if (formData.number.trim()) fullAddress += `, ${formData.number.trim()}`;
      if (formData.complement.trim())
        fullAddress += ` (${formData.complement.trim()})`;

      // 4. Send payload to tRPC needs.create
      const result = await vanillaTrpc.needs.create.mutate({
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.categoryName,
        categoryId: formData.categoryId,
        subcategoryId: formData.subcategoryId || undefined,
        subcategoryName: formData.subcategoryName || undefined,
        requiredProfessionals: formData.requiredProfessionals,
        startDate: formData.startDate,
        endDate: formData.endDate ? formData.endDate : undefined,
        startTime: formData.startTime || undefined,
        endTime: formData.endTime || undefined,
        budget: parsedBudget ?? undefined,
        paymentType: formData.paymentType,
        address: fullAddress || undefined,
        neighborhood: formData.neighborhood.trim() || undefined,
        city: formData.city.trim(),
        latitude: formData.latitude ?? undefined,
        longitude: formData.longitude ?? undefined,
        requirements: formData.requirements.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        photos: uploadedPhotoUrls,
      });

      if (result && result.success) {
        setPublishedNeedId(result.id);
        setCurrentStep(6); // Success Step
        triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
      } else {
        throw new Error("Falha ao salvar necessidade");
      }
    } catch (err: any) {
      console.error("Erro ao publicar necessidade:", err);
      Alert.alert(
        "Erro na Publicação",
        err.message ||
          "Não foi possível publicar sua necessidade. Verifique sua conexão e tente novamente."
      );
    } finally {
      setIsSubmitting(false);
      setIsUploadingPhotos(false);
    }
  };

  const paymentLabels: Record<PaymentType, string> = {
    total: "Valor Total",
    diaria: "Por Diária",
    hora: "Por Hora",
    a_combinar: "A Combinar",
  };

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
          onPress={handleBack}
          style={({ pressed }) => [
            styles.backBtn,
            { backgroundColor: colors.surface, borderColor: colors.border },
            pressed && { opacity: 0.7 },
          ]}
        >
          <MaterialIcons
            name={currentStep === 6 ? "close" : "arrow-back"}
            size={22}
            color={colors.foreground}
          />
        </Pressable>

        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            Publicar Necessidade
          </Text>
          {currentStep >= 1 && currentStep <= 5 && (
            <Text style={[styles.headerSubtitle, { color: colors.muted }]}>
              Etapa {currentStep} de 5
            </Text>
          )}
        </View>

        <View style={{ width: 40 }} />
      </View>

      {/* ── Stepper Bar (Etapas 1 a 5) ── */}
      {currentStep >= 1 && currentStep <= 5 && (
        <View style={styles.stepperContainer}>
          {[1, 2, 3, 4, 5].map((s) => (
            <View
              key={s}
              style={[
                styles.stepSegment,
                {
                  backgroundColor:
                    s <= currentStep ? "#25D366" : "rgba(255,255,255,0.12)",
                },
              ]}
            />
          ))}
        </View>
      )}

      {/* ── Modal de Confirmação no Mapa ── */}
      {showMapModal && formData.latitude && formData.longitude && (
        <View style={styles.mapModalOverlay}>
          <View style={styles.mapModalContent}>
            <View style={styles.mapModalHeader}>
              <Text style={styles.mapModalTitle}>Ajustar Localização no Mapa</Text>
              <Pressable
                onPress={() => setShowMapModal(false)}
                style={styles.mapModalClose}
              >
                <MaterialIcons name="close" size={20} color="#FFFFFF" />
              </Pressable>
            </View>
            <View style={{ flex: 1 }}>
              <LocationConfirmationMap
                initialCoords={{
                  latitude: formData.latitude,
                  longitude: formData.longitude,
                }}
                onConfirm={(coords) => {
                  setFormData((prev) => ({
                    ...prev,
                    latitude: coords.latitude,
                    longitude: coords.longitude,
                  }));
                  setShowMapModal(false);
                  triggerHaptic();
                }}
                onCancel={() => setShowMapModal(false)}
              />
            </View>
          </View>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 40 },
        ]}
      >
        {/* ── SE O USUÁRIO NÃO ESTIVER LOGADO ── */}
        {!isSignedIn ? (
          <View
            style={[
              styles.authGateCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.lockIconBox}>
              <MaterialIcons name="lock-outline" size={32} color="#EAB308" />
            </View>
            <Text style={[styles.authGateTitle, { color: colors.foreground }]}>
              Identificação Necessária
            </Text>
            <Text style={[styles.authGateDesc, { color: colors.muted }]}>
              Para publicar uma necessidade e receber propostas de profissionais
              com segurança, você precisa estar conectado à sua conta XamaJá.
            </Text>

            <Pressable
              onPress={handleLogin}
              style={({ pressed }) => [
                styles.primaryActionBtn,
                pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
              ]}
            >
              <Text style={styles.primaryActionBtnText}>
                Entrar ou Criar Conta
              </Text>
              <MaterialIcons name="arrow-forward" size={18} color="#000000" />
            </Pressable>
          </View>
        ) : (
          /* ── FLUXO DAS ETAPAS DO FORMULÁRIO ── */
          <>
            {/* ══════════════════════════════════════════════════════
                PASSO 1: O QUE VOCÊ PRECISA? (Título, Categoria, Descrição, Vagas)
            ══════════════════════════════════════════════════════ */}
            {currentStep === 1 && (
              <View style={styles.stepFormWrapper}>
                <View style={styles.stepHeader}>
                  <View style={styles.stepBadge}>
                    <MaterialIcons name="edit-note" size={16} color="#25D366" />
                    <Text style={styles.stepBadgeText}>PASSO 1 DE 5</Text>
                  </View>
                  <Text
                    style={[styles.stepTitle, { color: colors.foreground }]}
                  >
                    O que você precisa?
                  </Text>
                  <Text style={[styles.stepDesc, { color: colors.muted }]}>
                    Diga em poucas palavras o tipo de profissional ou serviço
                    que está buscando.
                  </Text>
                </View>

                {/* Campo: Título */}
                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                    Título da necessidade *
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                        color: colors.foreground,
                      },
                    ]}
                    placeholder="Ex: Instalação de 4 ventiladores de teto"
                    placeholderTextColor="#71717A"
                    value={formData.title}
                    onChangeText={(t) =>
                      setFormData((p) => ({ ...p, title: t }))
                    }
                    maxLength={100}
                  />
                  <Text style={[styles.charCount, { color: colors.muted }]}>
                    {formData.title.length}/100
                  </Text>
                </View>

                {/* Campo: Categoria */}
                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                    Categoria principal *
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoryChipsScroll}
                  >
                    {mockCategories.map((cat) => {
                      const isSelected = formData.categoryId === cat.id;
                      return (
                        <Pressable
                          key={cat.id}
                          onPress={() => {
                            triggerHaptic();
                            const subs = subcategoriesByCategory[cat.id] || [];
                            setFormData((p) => ({
                              ...p,
                              categoryId: cat.id,
                              categoryName: cat.name.replace("\n", " "),
                              subcategoryId: subs[0]?.id || "",
                              subcategoryName: subs[0]?.name || "",
                            }));
                          }}
                          style={[
                            styles.categoryChip,
                            {
                              backgroundColor: isSelected
                                ? "rgba(37, 211, 102, 0.15)"
                                : colors.surface,
                              borderColor: isSelected
                                ? "#25D366"
                                : colors.border,
                            },
                          ]}
                        >
                          <MaterialIcons
                            name={cat.icon as any}
                            size={18}
                            color={isSelected ? "#25D366" : "#A1A1AA"}
                          />
                          <Text
                            style={[
                              styles.categoryChipText,
                              {
                                color: isSelected
                                  ? "#25D366"
                                  : colors.foreground,
                                fontWeight: isSelected ? "700" : "500",
                              },
                            ]}
                          >
                            {cat.name.replace("\n", " ")}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Campo: Subcategoria */}
                {activeSubcategories.length > 0 && (
                  <View style={styles.fieldGroup}>
                    <Text
                      style={[styles.fieldLabel, { color: colors.foreground }]}
                    >
                      Especialidade / Subcategoria
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.categoryChipsScroll}
                    >
                      {activeSubcategories.map((sub) => {
                        const isSelected = formData.subcategoryId === sub.id;
                        return (
                          <Pressable
                            key={sub.id}
                            onPress={() => {
                              triggerHaptic();
                              setFormData((p) => ({
                                ...p,
                                subcategoryId: sub.id,
                                subcategoryName: sub.name,
                              }));
                            }}
                            style={[
                              styles.subCategoryChip,
                              {
                                backgroundColor: isSelected
                                  ? "#25D366"
                                  : colors.surface,
                                borderColor: isSelected
                                  ? "#25D366"
                                  : colors.border,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.subCategoryChipText,
                                {
                                  color: isSelected ? "#000000" : colors.foreground,
                                  fontWeight: isSelected ? "800" : "500",
                                },
                              ]}
                            >
                              {sub.name}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}

                {/* Campo: Descrição */}
                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                    Descrição detalhada do serviço *
                  </Text>
                  <TextInput
                    style={[
                      styles.textArea,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                        color: colors.foreground,
                      },
                    ]}
                    placeholder="Descreva o que deve ser feito, condições do local, altura, materiais necessários, etc."
                    placeholderTextColor="#71717A"
                    value={formData.description}
                    onChangeText={(t) =>
                      setFormData((p) => ({ ...p, description: t }))
                    }
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                  <Text style={[styles.charCount, { color: colors.muted }]}>
                    Mínimo 10 caracteres ({formData.description.length})
                  </Text>
                </View>

                {/* Campo: Quantidade de Profissionais */}
                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                    Quantidade de profissionais necessários
                  </Text>
                  <View
                    style={[
                      styles.counterRow,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Pressable
                      onPress={() => {
                        triggerHaptic();
                        setFormData((p) => ({
                          ...p,
                          requiredProfessionals: Math.max(
                            1,
                            p.requiredProfessionals - 1
                          ),
                        }));
                      }}
                      style={styles.counterBtn}
                    >
                      <MaterialIcons
                        name="remove"
                        size={20}
                        color={colors.foreground}
                      />
                    </Pressable>

                    <View style={styles.counterDisplay}>
                      <Text
                        style={[
                          styles.counterValue,
                          { color: colors.foreground },
                        ]}
                      >
                        {formData.requiredProfessionals}{" "}
                        {formData.requiredProfessionals === 1
                          ? "profissional"
                          : "profissionais"}
                      </Text>
                    </View>

                    <Pressable
                      onPress={() => {
                        triggerHaptic();
                        setFormData((p) => ({
                          ...p,
                          requiredProfessionals: p.requiredProfessionals + 1,
                        }));
                      }}
                      style={styles.counterBtn}
                    >
                      <MaterialIcons
                        name="add"
                        size={20}
                        color={colors.foreground}
                      />
                    </Pressable>
                  </View>
                </View>

                {/* Botão Avançar */}
                <Pressable
                  onPress={handleNextStep}
                  style={({ pressed }) => [
                    styles.primaryActionBtn,
                    pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
                  ]}
                >
                  <Text style={styles.primaryActionBtnText}>
                    Continuar: Prazos e Valores
                  </Text>
                  <MaterialIcons
                    name="arrow-forward"
                    size={18}
                    color="#000000"
                  />
                </Pressable>
              </View>
            )}

            {/* ══════════════════════════════════════════════════════
                PASSO 2: QUANDO E QUANTO? (Datas, Horários, Orçamento, Pagamento)
            ══════════════════════════════════════════════════════ */}
            {currentStep === 2 && (
              <View style={styles.stepFormWrapper}>
                <View style={styles.stepHeader}>
                  <View style={styles.stepBadge}>
                    <MaterialIcons
                      name="calendar-today"
                      size={16}
                      color="#25D366"
                    />
                    <Text style={styles.stepBadgeText}>PASSO 2 DE 5</Text>
                  </View>
                  <Text
                    style={[styles.stepTitle, { color: colors.foreground }]}
                  >
                    Prazos e Valores
                  </Text>
                  <Text style={[styles.stepDesc, { color: colors.muted }]}>
                    Defina quando o serviço deve ocorrer e quanto você está
                    oferecendo.
                  </Text>
                </View>

                {/* Datas de Início e Término */}
                <View style={styles.gridTwoCols}>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.fieldLabel, { color: colors.foreground }]}
                    >
                      Data de Início *
                    </Text>
                    <TextInput
                      style={[
                        styles.textInput,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.border,
                          color: colors.foreground,
                        },
                      ]}
                      placeholder="AAAA-MM-DD"
                      placeholderTextColor="#71717A"
                      value={formData.startDate}
                      onChangeText={(t) =>
                        setFormData((p) => ({ ...p, startDate: t }))
                      }
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.fieldLabel, { color: colors.foreground }]}
                    >
                      Data de Término (Opcional)
                    </Text>
                    <TextInput
                      style={[
                        styles.textInput,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.border,
                          color: colors.foreground,
                        },
                      ]}
                      placeholder="AAAA-MM-DD"
                      placeholderTextColor="#71717A"
                      value={formData.endDate}
                      onChangeText={(t) =>
                        setFormData((p) => ({ ...p, endDate: t }))
                      }
                    />
                  </View>
                </View>

                {/* Horários */}
                <View style={styles.gridTwoCols}>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.fieldLabel, { color: colors.foreground }]}
                    >
                      Horário Inicial
                    </Text>
                    <TextInput
                      style={[
                        styles.textInput,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.border,
                          color: colors.foreground,
                        },
                      ]}
                      placeholder="08:00"
                      placeholderTextColor="#71717A"
                      value={formData.startTime}
                      onChangeText={(t) =>
                        setFormData((p) => ({ ...p, startTime: t }))
                      }
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.fieldLabel, { color: colors.foreground }]}
                    >
                      Horário Final
                    </Text>
                    <TextInput
                      style={[
                        styles.textInput,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.border,
                          color: colors.foreground,
                        },
                      ]}
                      placeholder="17:00"
                      placeholderTextColor="#71717A"
                      value={formData.endTime}
                      onChangeText={(t) =>
                        setFormData((p) => ({ ...p, endTime: t }))
                      }
                    />
                  </View>
                </View>

                {/* Forma de Pagamento */}
                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                    Forma de Pagamento Pretendida *
                  </Text>
                  <View style={styles.paymentOptionsGrid}>
                    {(
                      [
                        { id: "total", label: "Valor Total", icon: "payments" },
                        { id: "diaria", label: "Por Diária", icon: "today" },
                        {
                          id: "hora",
                          label: "Por Hora",
                          icon: "schedule",
                        },
                        {
                          id: "a_combinar",
                          label: "A Combinar",
                          icon: "handshake",
                        },
                      ] as const
                    ).map((opt) => {
                      const isSelected = formData.paymentType === opt.id;
                      return (
                        <Pressable
                          key={opt.id}
                          onPress={() => {
                            triggerHaptic();
                            setFormData((p) => ({
                              ...p,
                              paymentType: opt.id,
                            }));
                          }}
                          style={[
                            styles.paymentOptionCard,
                            {
                              backgroundColor: isSelected
                                ? "rgba(37, 211, 102, 0.12)"
                                : colors.surface,
                              borderColor: isSelected
                                ? "#25D366"
                                : colors.border,
                            },
                          ]}
                        >
                          <MaterialIcons
                            name={opt.icon as any}
                            size={20}
                            color={isSelected ? "#25D366" : "#A1A1AA"}
                          />
                          <Text
                            style={[
                              styles.paymentOptionText,
                              {
                                color: isSelected
                                  ? "#25D366"
                                  : colors.foreground,
                                fontWeight: isSelected ? "700" : "500",
                              },
                            ]}
                          >
                            {opt.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* Valor Oferecido (Desabilitado quando "A combinar") */}
                {formData.paymentType !== "a_combinar" && (
                  <View style={styles.fieldGroup}>
                    <Text
                      style={[styles.fieldLabel, { color: colors.foreground }]}
                    >
                      Valor Oferecido (R$) *
                    </Text>
                    <TextInput
                      style={[
                        styles.textInput,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.border,
                          color: colors.foreground,
                          fontSize: 18,
                          fontWeight: "700",
                        },
                      ]}
                      placeholder="R$ 250,00"
                      placeholderTextColor="#71717A"
                      value={formData.budget}
                      onChangeText={(t) =>
                        setFormData((p) => ({ ...p, budget: t }))
                      }
                      keyboardType="numeric"
                    />
                  </View>
                )}

                {/* Aviso Informativo de Pagamento Direto */}
                <View
                  style={[
                    styles.infoNoticeCard,
                    {
                      backgroundColor: "rgba(37, 211, 102, 0.08)",
                      borderColor: "rgba(37, 211, 102, 0.25)",
                    },
                  ]}
                >
                  <MaterialIcons
                    name="info-outline"
                    size={20}
                    color="#25D366"
                  />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.infoNoticeTitle}>
                      Pagamento Direto & Sem Taxas
                    </Text>
                    <Text style={styles.infoNoticeText}>
                      O valor informado é uma estimativa oferecida por você. O
                      pagamento do serviço é combinado e quitado diretamente
                      entre você e o profissional (fora do XamaJá).
                    </Text>
                  </View>
                </View>

                {/* Botões de Ação */}
                <View style={styles.buttonRow}>
                  <Pressable
                    onPress={() => setCurrentStep(1)}
                    style={[
                      styles.secondaryActionBtn,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.secondaryActionBtnText,
                        { color: colors.foreground },
                      ]}
                    >
                      Voltar
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={handleNextStep}
                    style={({ pressed }) => [
                      styles.primaryActionBtn,
                      { flex: 2 },
                      pressed && {
                        opacity: 0.85,
                        transform: [{ scale: 0.99 }],
                      },
                    ]}
                  >
                    <Text style={styles.primaryActionBtnText}>
                      Continuar: Localização
                    </Text>
                    <MaterialIcons
                      name="arrow-forward"
                      size={18}
                      color="#000000"
                    />
                  </Pressable>
                </View>
              </View>
            )}

            {/* ══════════════════════════════════════════════════════
                PASSO 3: ONDE SERÁ REALIZADO? (Endereço, CEP, Cidade, Mapa)
            ══════════════════════════════════════════════════════ */}
            {currentStep === 3 && (
              <View style={styles.stepFormWrapper}>
                <View style={styles.stepHeader}>
                  <View style={styles.stepBadge}>
                    <MaterialIcons name="place" size={16} color="#25D366" />
                    <Text style={styles.stepBadgeText}>PASSO 3 DE 5</Text>
                  </View>
                  <Text
                    style={[styles.stepTitle, { color: colors.foreground }]}
                  >
                    Onde será realizado?
                  </Text>
                  <Text style={[styles.stepDesc, { color: colors.muted }]}>
                    Informe o endereço para que os profissionais da região
                    possam visualizar a distância.
                  </Text>
                </View>

                {/* Busca por CEP */}
                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                    CEP (com preenchimento automático)
                  </Text>
                  <View style={styles.inputWithAction}>
                    <TextInput
                      style={[
                        styles.textInput,
                        {
                          flex: 1,
                          backgroundColor: colors.surface,
                          borderColor: colors.border,
                          color: colors.foreground,
                        },
                      ]}
                      placeholder="Ex: 12900-000"
                      placeholderTextColor="#71717A"
                      value={formData.cep}
                      onChangeText={handleSearchCep}
                      keyboardType="numeric"
                      maxLength={9}
                    />
                    {isSearchingCep && (
                      <View style={styles.actionIconInside}>
                        <ActivityIndicator size="small" color="#25D366" />
                      </View>
                    )}
                  </View>
                </View>

                {/* Rua / Endereço */}
                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                    Rua / Logradouro
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                        color: colors.foreground,
                      },
                    ]}
                    placeholder="Ex: Av. Salvador Markowicz"
                    placeholderTextColor="#71717A"
                    value={formData.address}
                    onChangeText={(t) =>
                      setFormData((p) => ({ ...p, address: t }))
                    }
                  />
                </View>

                {/* Número e Complemento */}
                <View style={styles.gridTwoCols}>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.fieldLabel, { color: colors.foreground }]}
                    >
                      Número
                    </Text>
                    <TextInput
                      style={[
                        styles.textInput,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.border,
                          color: colors.foreground,
                        },
                      ]}
                      placeholder="Ex: 120"
                      placeholderTextColor="#71717A"
                      value={formData.number}
                      onChangeText={(t) =>
                        setFormData((p) => ({ ...p, number: t }))
                      }
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.fieldLabel, { color: colors.foreground }]}
                    >
                      Complemento
                    </Text>
                    <TextInput
                      style={[
                        styles.textInput,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.border,
                          color: colors.foreground,
                        },
                      ]}
                      placeholder="Apto, Bloco, etc."
                      placeholderTextColor="#71717A"
                      value={formData.complement}
                      onChangeText={(t) =>
                        setFormData((p) => ({ ...p, complement: t }))
                      }
                    />
                  </View>
                </View>

                {/* Bairro e Cidade */}
                <View style={styles.gridTwoCols}>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.fieldLabel, { color: colors.foreground }]}
                    >
                      Bairro
                    </Text>
                    <TextInput
                      style={[
                        styles.textInput,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.border,
                          color: colors.foreground,
                        },
                      ]}
                      placeholder="Ex: Centro / Taboão"
                      placeholderTextColor="#71717A"
                      value={formData.neighborhood}
                      onChangeText={(t) =>
                        setFormData((p) => ({ ...p, neighborhood: t }))
                      }
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.fieldLabel, { color: colors.foreground }]}
                    >
                      Cidade *
                    </Text>
                    <TextInput
                      style={[
                        styles.textInput,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.border,
                          color: colors.foreground,
                        },
                      ]}
                      placeholder="Ex: Bragança Paulista"
                      placeholderTextColor="#71717A"
                      value={formData.city}
                      onChangeText={(t) =>
                        setFormData((p) => ({ ...p, city: t }))
                      }
                    />
                  </View>
                </View>

                {/* Botão de Ajustar no Mapa */}
                <View
                  style={[
                    styles.mapCardBox,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.mapCardIconBox}>
                    <MaterialIcons
                      name="map"
                      size={24}
                      color="#25D366"
                    />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text
                      style={[
                        styles.mapCardTitle,
                        { color: colors.foreground },
                      ]}
                    >
                      Localização no Mapa
                    </Text>
                    <Text style={[styles.mapCardSubtitle, { color: colors.muted }]}>
                      {formData.latitude && formData.longitude
                        ? `Coordenadas: ${formData.latitude.toFixed(4)}, ${formData.longitude.toFixed(4)}`
                        : "Toque para confirmar ou ajustar o pino no mapa interativo."}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => {
                      triggerHaptic();
                      // Set default coords if not present
                      if (!formData.latitude) {
                        setFormData((p) => ({
                          ...p,
                          latitude: -22.952,
                          longitude: -46.542,
                        }));
                      }
                      setShowMapModal(true);
                    }}
                    style={[
                      styles.mapCardBtn,
                      { backgroundColor: "rgba(37, 211, 102, 0.15)" },
                    ]}
                  >
                    <Text style={styles.mapCardBtnText}>
                      {formData.latitude ? "Ajustar" : "Abrir Mapa"}
                    </Text>
                  </Pressable>
                </View>

                {/* Botões de Ação */}
                <View style={styles.buttonRow}>
                  <Pressable
                    onPress={() => setCurrentStep(2)}
                    style={[
                      styles.secondaryActionBtn,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.secondaryActionBtnText,
                        { color: colors.foreground },
                      ]}
                    >
                      Voltar
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={handleNextStep}
                    style={({ pressed }) => [
                      styles.primaryActionBtn,
                      { flex: 2 },
                      pressed && {
                        opacity: 0.85,
                        transform: [{ scale: 0.99 }],
                      },
                    ]}
                  >
                    <Text style={styles.primaryActionBtnText}>
                      Continuar: Requisitos & Fotos
                    </Text>
                    <MaterialIcons
                      name="arrow-forward"
                      size={18}
                      color="#000000"
                    />
                  </Pressable>
                </View>
              </View>
            )}

            {/* ══════════════════════════════════════════════════════
                PASSO 4: REQUISITOS & FOTOS (Exigências, Observações, Upload)
            ══════════════════════════════════════════════════════ */}
            {currentStep === 4 && (
              <View style={styles.stepFormWrapper}>
                <View style={styles.stepHeader}>
                  <View style={styles.stepBadge}>
                    <MaterialIcons
                      name="add-photo-alternate"
                      size={16}
                      color="#25D366"
                    />
                    <Text style={styles.stepBadgeText}>PASSO 4 DE 5</Text>
                  </View>
                  <Text
                    style={[styles.stepTitle, { color: colors.foreground }]}
                  >
                    Requisitos e Fotos
                  </Text>
                  <Text style={[styles.stepDesc, { color: colors.muted }]}>
                    Anexe fotos do local ou objeto e especifique requisitos
                    especiais para o serviço.
                  </Text>
                </View>

                {/* Requisitos */}
                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                    Requisitos do profissional (Opcional)
                  </Text>
                  <TextInput
                    style={[
                      styles.textArea,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                        color: colors.foreground,
                      },
                    ]}
                    placeholder="Ex: Trazer escada alta, ferramentas próprias, emissão de nota fiscal, etc."
                    placeholderTextColor="#71717A"
                    value={formData.requirements}
                    onChangeText={(t) =>
                      setFormData((p) => ({ ...p, requirements: t }))
                    }
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>

                {/* Observações */}
                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                    Observações e Instruções de acesso (Opcional)
                  </Text>
                  <TextInput
                    style={[
                      styles.textArea,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                        color: colors.foreground,
                      },
                    ]}
                    placeholder="Ex: Condomínio com portaria, horário permitido até às 17h, estacionamento no local."
                    placeholderTextColor="#71717A"
                    value={formData.notes}
                    onChangeText={(t) =>
                      setFormData((p) => ({ ...p, notes: t }))
                    }
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>

                {/* Galeria de Fotos */}
                <View style={styles.fieldGroup}>
                  <View style={styles.photoHeaderRow}>
                    <Text
                      style={[styles.fieldLabel, { color: colors.foreground }]}
                    >
                      Fotos do local ou item ({formData.photos.length}/5)
                    </Text>
                    {formData.photos.length < 5 && (
                      <Pressable
                        onPress={handlePickPhotos}
                        style={styles.addPhotoSmallBtn}
                      >
                        <MaterialIcons
                          name="add-a-photo"
                          size={16}
                          color="#25D366"
                        />
                        <Text style={styles.addPhotoSmallBtnText}>
                          Adicionar Foto
                        </Text>
                      </Pressable>
                    )}
                  </View>

                  {formData.photos.length === 0 ? (
                    <Pressable
                      onPress={handlePickPhotos}
                      style={[
                        styles.emptyPhotoBox,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <MaterialIcons
                        name="cloud-upload"
                        size={36}
                        color="#71717A"
                      />
                      <Text
                        style={[
                          styles.emptyPhotoTitle,
                          { color: colors.foreground },
                        ]}
                      >
                        Anexe fotos para receber propostas mais precisas
                      </Text>
                      <Text
                        style={[styles.emptyPhotoDesc, { color: colors.muted }]}
                      >
                        Toque para selecionar imagens da sua galeria
                      </Text>
                    </Pressable>
                  ) : (
                    <View style={styles.photoGrid}>
                      {formData.photos.map((uri, idx) => (
                        <View key={idx} style={styles.photoThumbWrapper}>
                          <Image
                            source={{ uri }}
                            style={styles.photoThumbImage}
                          />
                          <Pressable
                            onPress={() => handleRemovePhoto(idx)}
                            style={styles.photoRemoveBtn}
                          >
                            <MaterialIcons
                              name="close"
                              size={14}
                              color="#FFFFFF"
                            />
                          </Pressable>
                        </View>
                      ))}

                      {formData.photos.length < 5 && (
                        <Pressable
                          onPress={handlePickPhotos}
                          style={[
                            styles.photoAddSlot,
                            {
                              backgroundColor: colors.surface,
                              borderColor: colors.border,
                            },
                          ]}
                        >
                          <MaterialIcons name="add" size={28} color="#25D366" />
                          <Text
                            style={[
                              styles.photoAddSlotText,
                              { color: colors.muted },
                            ]}
                          >
                            Mais fotos
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  )}
                </View>

                {/* Botões de Ação */}
                <View style={styles.buttonRow}>
                  <Pressable
                    onPress={() => setCurrentStep(3)}
                    style={[
                      styles.secondaryActionBtn,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.secondaryActionBtnText,
                        { color: colors.foreground },
                      ]}
                    >
                      Voltar
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={handleNextStep}
                    style={({ pressed }) => [
                      styles.primaryActionBtn,
                      { flex: 2 },
                      pressed && {
                        opacity: 0.85,
                        transform: [{ scale: 0.99 }],
                      },
                    ]}
                  >
                    <Text style={styles.primaryActionBtnText}>
                      Revisar e Publicar
                    </Text>
                    <MaterialIcons
                      name="arrow-forward"
                      size={18}
                      color="#000000"
                    />
                  </Pressable>
                </View>
              </View>
            )}

            {/* ══════════════════════════════════════════════════════
                PASSO 5: REVISÃO COMPLETA & PUBLICAÇÃO
            ══════════════════════════════════════════════════════ */}
            {currentStep === 5 && (
              <View style={styles.stepFormWrapper}>
                <View style={styles.stepHeader}>
                  <View style={styles.stepBadge}>
                    <MaterialIcons
                      name="check-circle"
                      size={16}
                      color="#25D366"
                    />
                    <Text style={styles.stepBadgeText}>PASSO 5 DE 5</Text>
                  </View>
                  <Text
                    style={[styles.stepTitle, { color: colors.foreground }]}
                  >
                    Revisão da Necessidade
                  </Text>
                  <Text style={[styles.stepDesc, { color: colors.muted }]}>
                    Confira todos os dados antes de publicar seu pedido.
                  </Text>
                </View>

                {/* Card Resumo do Serviço */}
                <View
                  style={[
                    styles.reviewCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.reviewSectionHeader}>
                    <MaterialIcons name="build" size={18} color="#25D366" />
                    <Text
                      style={[
                        styles.reviewSectionTitle,
                        { color: colors.foreground },
                      ]}
                    >
                      Serviço Desejado
                    </Text>
                    <Pressable
                      onPress={() => setCurrentStep(1)}
                      style={styles.editStepLink}
                    >
                      <Text style={styles.editStepLinkText}>Editar</Text>
                    </Pressable>
                  </View>

                  <Text
                    style={[styles.reviewMainTitle, { color: colors.foreground }]}
                  >
                    {formData.title}
                  </Text>

                  <View style={styles.reviewBadgeRow}>
                    <View style={styles.reviewPill}>
                      <Text style={styles.reviewPillText}>
                        {formData.categoryName}
                      </Text>
                    </View>
                    {formData.subcategoryName ? (
                      <View
                        style={[
                          styles.reviewPill,
                          {
                            backgroundColor: "rgba(37, 211, 102, 0.15)",
                            borderColor: "rgba(37, 211, 102, 0.3)",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.reviewPillText,
                            { color: "#25D366" },
                          ]}
                        >
                          {formData.subcategoryName}
                        </Text>
                      </View>
                    ) : null}
                    <View style={styles.reviewPill}>
                      <Text style={styles.reviewPillText}>
                        {formData.requiredProfessionals}{" "}
                        {formData.requiredProfessionals === 1
                          ? "vaga"
                          : "vagas"}
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={[styles.reviewDescription, { color: colors.muted }]}
                  >
                    {formData.description}
                  </Text>
                </View>

                {/* Card Resumo Prazos & Valores */}
                <View
                  style={[
                    styles.reviewCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.reviewSectionHeader}>
                    <MaterialIcons
                      name="attach-money"
                      size={18}
                      color="#25D366"
                    />
                    <Text
                      style={[
                        styles.reviewSectionTitle,
                        { color: colors.foreground },
                      ]}
                    >
                      Prazos & Valores
                    </Text>
                    <Pressable
                      onPress={() => setCurrentStep(2)}
                      style={styles.editStepLink}
                    >
                      <Text style={styles.editStepLinkText}>Editar</Text>
                    </Pressable>
                  </View>

                  <View style={styles.reviewInfoRow}>
                    <Text
                      style={[styles.reviewInfoLabel, { color: colors.muted }]}
                    >
                      Data de Início:
                    </Text>
                    <Text
                      style={[
                        styles.reviewInfoValue,
                        { color: colors.foreground },
                      ]}
                    >
                      {formData.startDate}{" "}
                      {formData.endDate ? `até ${formData.endDate}` : ""}
                    </Text>
                  </View>

                  {(formData.startTime || formData.endTime) && (
                    <View style={styles.reviewInfoRow}>
                      <Text
                        style={[
                          styles.reviewInfoLabel,
                          { color: colors.muted },
                        ]}
                      >
                        Horário:
                      </Text>
                      <Text
                        style={[
                          styles.reviewInfoValue,
                          { color: colors.foreground },
                        ]}
                      >
                        {formData.startTime || "--:--"} às{" "}
                        {formData.endTime || "--:--"}
                      </Text>
                    </View>
                  )}

                  <View style={styles.reviewInfoRow}>
                    <Text
                      style={[styles.reviewInfoLabel, { color: colors.muted }]}
                    >
                      Forma de Pagamento:
                    </Text>
                    <Text
                      style={[
                        styles.reviewInfoValue,
                        { color: colors.foreground },
                      ]}
                    >
                      {paymentLabels[formData.paymentType]}
                    </Text>
                  </View>

                  <View style={styles.reviewInfoRow}>
                    <Text
                      style={[styles.reviewInfoLabel, { color: colors.muted }]}
                    >
                      Valor Oferecido:
                    </Text>
                    <Text
                      style={[
                        styles.reviewInfoValue,
                        { color: "#25D366", fontWeight: "800" },
                      ]}
                    >
                      {formData.paymentType === "a_combinar"
                        ? "A combinar diretamente"
                        : formData.budget
                          ? `R$ ${formData.budget}`
                          : "A combinar"}
                    </Text>
                  </View>
                </View>

                {/* Card Resumo Localização */}
                <View
                  style={[
                    styles.reviewCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.reviewSectionHeader}>
                    <MaterialIcons name="place" size={18} color="#25D366" />
                    <Text
                      style={[
                        styles.reviewSectionTitle,
                        { color: colors.foreground },
                      ]}
                    >
                      Local de Execução
                    </Text>
                    <Pressable
                      onPress={() => setCurrentStep(3)}
                      style={styles.editStepLink}
                    >
                      <Text style={styles.editStepLinkText}>Editar</Text>
                    </Pressable>
                  </View>

                  <Text
                    style={[
                      styles.reviewAddressText,
                      { color: colors.foreground },
                    ]}
                  >
                    {formData.address ? `${formData.address}` : ""}
                    {formData.number ? `, ${formData.number}` : ""}
                    {formData.neighborhood ? ` - ${formData.neighborhood}` : ""}
                    {` - ${formData.city}`}
                  </Text>
                  {formData.cep ? (
                    <Text
                      style={[
                        styles.reviewAddressSub,
                        { color: colors.muted },
                      ]}
                    >
                      CEP: {formData.cep}
                    </Text>
                  ) : null}
                </View>

                {/* Fotos Anexadas */}
                {formData.photos.length > 0 && (
                  <View
                    style={[
                      styles.reviewCard,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <View style={styles.reviewSectionHeader}>
                      <MaterialIcons
                        name="photo-library"
                        size={18}
                        color="#25D366"
                      />
                      <Text
                        style={[
                          styles.reviewSectionTitle,
                          { color: colors.foreground },
                        ]}
                      >
                        Fotos Anexadas ({formData.photos.length})
                      </Text>
                      <Pressable
                        onPress={() => setCurrentStep(4)}
                        style={styles.editStepLink}
                      >
                        <Text style={styles.editStepLinkText}>Editar</Text>
                      </Pressable>
                    </View>

                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ gap: 8 }}
                    >
                      {formData.photos.map((uri, i) => (
                        <Image
                          key={i}
                          source={{ uri }}
                          style={styles.reviewPhotoThumb}
                        />
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* Card de Transparência e Responsabilidade */}
                <View
                  style={[
                    styles.infoNoticeCard,
                    {
                      backgroundColor: "rgba(234, 179, 8, 0.08)",
                      borderColor: "rgba(234, 179, 8, 0.25)",
                    },
                  ]}
                >
                  <MaterialIcons
                    name="verified-user"
                    size={20}
                    color="#EAB308"
                  />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text
                      style={[
                        styles.infoNoticeTitle,
                        { color: "#EAB308" },
                      ]}
                    >
                      Combinação Direta via WhatsApp
                    </Text>
                    <Text style={styles.infoNoticeText}>
                      Ao publicar, seu pedido ficará disponível para
                      profissionais qualificados entrarem em contato com você.
                      O XamaJá não intermedia nem processa os pagamentos de
                      serviços.
                    </Text>
                  </View>
                </View>

                {/* Botões de Ação */}
                <View style={styles.buttonRow}>
                  <Pressable
                    disabled={isSubmitting}
                    onPress={() => setCurrentStep(4)}
                    style={[
                      styles.secondaryActionBtn,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.secondaryActionBtnText,
                        { color: colors.foreground },
                      ]}
                    >
                      Voltar
                    </Text>
                  </Pressable>

                  <Pressable
                    disabled={isSubmitting}
                    onPress={handlePublish}
                    style={({ pressed }) => [
                      styles.primaryActionBtn,
                      { flex: 2 },
                      isSubmitting && { opacity: 0.6 },
                      pressed && {
                        opacity: 0.85,
                        transform: [{ scale: 0.99 }],
                      },
                    ]}
                  >
                    {isSubmitting ? (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <ActivityIndicator size="small" color="#000000" />
                        <Text style={styles.primaryActionBtnText}>
                          {isUploadingPhotos
                            ? "Enviando Fotos..."
                            : "Publicando..."}
                        </Text>
                      </View>
                    ) : (
                      <>
                        <Text style={styles.primaryActionBtnText}>
                          Confirmar e Publicar
                        </Text>
                        <MaterialIcons
                          name="check"
                          size={20}
                          color="#000000"
                        />
                      </>
                    )}
                  </Pressable>
                </View>
              </View>
            )}

            {/* ══════════════════════════════════════════════════════
                PASSO 6: SUCESSO!
            ══════════════════════════════════════════════════════ */}
            {currentStep === 6 && (
              <View style={styles.successContainer}>
                <View style={styles.successIconOuter}>
                  <View style={styles.successIconInner}>
                    <MaterialIcons name="check" size={36} color="#000000" />
                  </View>
                </View>

                <Text
                  style={[styles.successTitle, { color: colors.foreground }]}
                >
                  Necessidade Publicada!
                </Text>

                <Text style={[styles.successSubtitle, { color: colors.muted }]}>
                  Sua solicitação foi cadastrada com sucesso e já está visível
                  para os profissionais da região de {formData.city}.
                </Text>

                {publishedNeedId && (
                  <View
                    style={[
                      styles.idCard,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.idCardLabel, { color: colors.muted }]}
                    >
                      CÓDIGO DE REFERÊNCIA
                    </Text>
                    <Text
                      style={[
                        styles.idCardValue,
                        { color: colors.foreground },
                      ]}
                    >
                      {publishedNeedId}
                    </Text>
                  </View>
                )}

                <View
                  style={[
                    styles.nextStepsCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.nextStepsTitle,
                      { color: colors.foreground },
                    ]}
                  >
                    O que acontece agora?
                  </Text>

                  <View style={styles.nextStepItem}>
                    <View style={styles.nextStepBullet} />
                    <Text
                      style={[styles.nextStepText, { color: colors.muted }]}
                    >
                      Profissionais qualificados verão seu pedido no XamaJá.
                    </Text>
                  </View>

                  <View style={styles.nextStepItem}>
                    <View style={styles.nextStepBullet} />
                    <Text
                      style={[styles.nextStepText, { color: colors.muted }]}
                    >
                      Eles entrarão em contato diretamente pelo WhatsApp para
                      combinar valores e horários.
                    </Text>
                  </View>

                  <View style={styles.nextStepItem}>
                    <View style={styles.nextStepBullet} />
                    <Text
                      style={[styles.nextStepText, { color: colors.muted }]}
                    >
                      Você tem total liberdade para escolher a melhor proposta.
                    </Text>
                  </View>
                </View>

                <View style={{ gap: 10, width: "100%", marginTop: 8 }}>
                  <Pressable
                    onPress={() => {
                      triggerHaptic();
                      if (publishedNeedId) {
                        router.push(`/needs/${publishedNeedId}` as any);
                      } else {
                        router.replace("/(tabs)" as any);
                      }
                    }}
                    style={({ pressed }) => [
                      styles.primaryActionBtn,
                      pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
                    ]}
                  >
                    <Text style={styles.primaryActionBtnText}>
                      Abrir Necessidade Criada
                    </Text>
                    <MaterialIcons name="arrow-forward" size={20} color="#000000" />
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      triggerHaptic();
                      router.replace("/(tabs)" as any);
                    }}
                    style={({ pressed }) => [
                      styles.secondaryActionBtn,
                      { width: "100%", paddingVertical: 14 },
                      pressed && { opacity: 0.8 },
                    ]}
                  >
                    <Text
                      style={[
                        styles.secondaryActionBtnText,
                        { color: colors.foreground },
                      ]}
                    >
                      Voltar ao Início
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
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
  headerTitleContainer: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 1,
  },
  stepperContainer: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  stepSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  stepFormWrapper: {
    gap: 16,
  },
  stepHeader: {
    gap: 6,
    marginBottom: 4,
  },
  stepBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(37, 211, 102, 0.12)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  stepBadgeText: {
    color: "#25D366",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: "900",
  },
  stepDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    minHeight: 90,
  },
  charCount: {
    fontSize: 11,
    textAlign: "right",
  },
  categoryChipsScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 13,
  },
  subCategoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  subCategoryChipText: {
    fontSize: 12,
  },
  counterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 14,
    padding: 6,
  },
  counterBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  counterDisplay: {
    alignItems: "center",
  },
  counterValue: {
    fontSize: 15,
    fontWeight: "700",
  },
  gridTwoCols: {
    flexDirection: "row",
    gap: 12,
  },
  paymentOptionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  paymentOptionCard: {
    width: (SCREEN_WIDTH - 48) / 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  paymentOptionText: {
    fontSize: 13,
  },
  infoNoticeCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  infoNoticeTitle: {
    color: "#25D366",
    fontSize: 13,
    fontWeight: "700",
  },
  infoNoticeText: {
    color: "#A1A1AA",
    fontSize: 12,
    lineHeight: 17,
  },
  inputWithAction: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  actionIconInside: {
    position: "absolute",
    right: 12,
  },
  mapCardBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  mapCardIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(37, 211, 102, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  mapCardTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  mapCardSubtitle: {
    fontSize: 11,
    lineHeight: 15,
  },
  mapCardBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  mapCardBtnText: {
    color: "#25D366",
    fontSize: 12,
    fontWeight: "700",
  },
  photoHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  addPhotoSmallBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  addPhotoSmallBtnText: {
    color: "#25D366",
    fontSize: 12,
    fontWeight: "700",
  },
  emptyPhotoBox: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    gap: 8,
  },
  emptyPhotoTitle: {
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  emptyPhotoDesc: {
    fontSize: 11,
    textAlign: "center",
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  photoThumbWrapper: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  photoThumbImage: {
    width: "100%",
    height: "100%",
  },
  photoRemoveBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.75)",
    alignItems: "center",
    justifyContent: "center",
  },
  photoAddSlot: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  photoAddSlotText: {
    fontSize: 10,
    fontWeight: "600",
  },
  reviewCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  reviewSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  reviewSectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    flex: 1,
  },
  editStepLink: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  editStepLinkText: {
    color: "#25D366",
    fontSize: 12,
    fontWeight: "700",
  },
  reviewMainTitle: {
    fontSize: 17,
    fontWeight: "800",
  },
  reviewBadgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  reviewPill: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  reviewPillText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },
  reviewDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  reviewInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reviewInfoLabel: {
    fontSize: 12,
  },
  reviewInfoValue: {
    fontSize: 13,
    fontWeight: "600",
  },
  reviewAddressText: {
    fontSize: 14,
    fontWeight: "600",
  },
  reviewAddressSub: {
    fontSize: 12,
  },
  reviewPhotoThumb: {
    width: 64,
    height: 64,
    borderRadius: 10,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  primaryActionBtn: {
    backgroundColor: "#25D366",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    shadowColor: "#25D366",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryActionBtnText: {
    color: "#000000",
    fontSize: 15,
    fontWeight: "800",
  },
  secondaryActionBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  secondaryActionBtnText: {
    fontSize: 14,
    fontWeight: "700",
  },
  authGateCard: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: "center",
    textAlign: "center",
    gap: 12,
    marginTop: 20,
  },
  lockIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(234, 179, 8, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(234, 179, 8, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  authGateTitle: {
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  authGateDesc: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    maxWidth: 280,
    marginBottom: 8,
  },
  successContainer: {
    alignItems: "center",
    paddingVertical: 20,
    gap: 16,
  },
  successIconOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(37, 211, 102, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  successIconInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#25D366",
    alignItems: "center",
    justifyContent: "center",
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
  },
  successSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    maxWidth: 300,
  },
  idCard: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    gap: 2,
  },
  idCardLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  idCardValue: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  nextStepsCard: {
    width: "100%",
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
  },
  nextStepsTitle: {
    fontSize: 14,
    fontWeight: "800",
  },
  nextStepItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  nextStepBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#25D366",
    marginTop: 6,
  },
  nextStepText: {
    fontSize: 12,
    lineHeight: 17,
    flex: 1,
  },
  mapModalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.85)",
    zIndex: 999,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  mapModalContent: {
    width: "100%",
    height: "80%",
    backgroundColor: "#18181B",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  mapModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  mapModalTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  mapModalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
});
