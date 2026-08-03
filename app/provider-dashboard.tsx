import React, { useState } from "react";
import * as Clipboard from "expo-clipboard";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  FlatList,
  Modal,
  TextInput,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { trpc } from "@/lib/trpc";
import { BUSINESS_TYPES, CATEGORIES_BY_TYPE } from "@/lib/constants/categories";
import {
  useProvider,
  PLANS,
  type ProviderService,
} from "@/lib/provider-context";
import { SOCIAL_NETWORKS, SOCIAL_PNG_ASSETS } from "@/constants/app";

export default function ProviderDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    provider,
    isProvider,
    addService,
    updateService,
    deleteService,
    renewPlan,
    updateProvider,
  } = useProvider();
  const isCommerce =
    provider?.hasCatalog ||
    provider?.categoryId === "comercios" ||
    provider?.category === "Comércios" ||
    provider?.category === "comercios";

  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<ProviderService | null>(
    null,
  );
  const [form, setForm] = useState({
    name: "",
    description: "",
    imageUri: "",
    price: "",
    productCategory: "",
    gallery: [] as string[],
  });
  const [saving, setSaving] = useState(false);

  // Edit Profile States & Handlers
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    category: "",
    description: "",
    phone: "",
    city: "",
    neighborhood: "",
    address: "",
    avatar: "",
    coverUri: "",
    workingHours: "",
    businessType: "servicos",
    deliveryTime: "",
    socialLinks: {} as Record<string, string>,
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Hours Option States
  const [weekdayOpen, setWeekdayOpen] = useState(true);
  const [weekdayStart, setWeekdayStart] = useState("08:00");
  const [weekdayEnd, setWeekdayEnd] = useState("18:00");

  const [saturdayOpen, setSaturdayOpen] = useState(false);
  const [saturdayStart, setSaturdayStart] = useState("09:00");
  const [saturdayEnd, setSaturdayEnd] = useState("14:00");

  const [sundayOpen, setSundayOpen] = useState(false);
  const [sundayStart, setSundayStart] = useState("09:00");
  const [sundayEnd, setSundayEnd] = useState("14:00");

  const [useCustomHours, setUseCustomHours] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Time Picker Modal states
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerOptions, setPickerOptions] = useState<string[]>([]);
  const [pickerTitle, setPickerTitle] = useState("");
  const [onSelectOption, setOnSelectOption] = useState<(val: string) => void>(
    () => (val: string) => {},
  );

  const HOURS = [
    "00:00",
    "01:00",
    "02:00",
    "03:00",
    "04:00",
    "05:00",
    "06:00",
    "07:00",
    "07:30",
    "08:00",
    "08:30",
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "12:00",
    "12:30",
    "13:00",
    "13:30",
    "14:00",
    "14:30",
    "15:00",
    "15:30",
    "16:00",
    "16:30",
    "17:00",
    "17:30",
    "18:00",
    "18:30",
    "19:00",
    "19:30",
    "20:00",
    "20:30",
    "21:00",
    "21:30",
    "22:00",
    "22:30",
    "23:00",
    "23:30",
  ];

  const openTimePicker = (
    title: string,
    currentVal: string,
    onSelect: (val: string) => void,
  ) => {
    setPickerTitle(title);
    setPickerOptions(HOURS);
    setOnSelectOption(() => onSelect);
    setPickerVisible(true);
  };

  const handlePaste = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text) {
        setProfileForm((prev) => ({ ...prev, workingHours: text }));
      }
    } catch (e) {
      Alert.alert("Erro", "Não foi possível colar do clipboard.");
    }
  };

  const handlePickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled) {
      setProfileForm((prev) => ({ ...prev, avatar: result.assets[0].uri }));
    }
  };

  const handlePickCover = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.85,
    });
    if (!result.canceled) {
      setProfileForm((prev) => ({ ...prev, coverUri: result.assets[0].uri }));
    }
  };

  const handleSaveProfile = async () => {
    if (!profileForm.name.trim() || !profileForm.category.trim()) {
      Alert.alert("Erro", "Nome e categoria são obrigatórios.");
      return;
    }

    if (
      profileForm.businessType === "alimentacao" &&
      (!profileForm.deliveryTime || !profileForm.deliveryTime.trim())
    ) {
      Alert.alert(
        "Erro",
        "O tempo estimado de entrega é obrigatório para comércios de alimentação.",
      );
      return;
    }

    let workingHoursValue = "";
    if (useCustomHours) {
      workingHoursValue = profileForm.workingHours;
    } else {
      const obj: any = {};
      if (weekdayOpen) {
        obj.weekday = `${weekdayStart}h-${weekdayEnd}h`;
      }
      if (saturdayOpen) {
        obj.saturday = `${saturdayStart}h-${saturdayEnd}h`;
      }
      if (sundayOpen) {
        obj.sunday = `${sundayStart}h-${sundayEnd}h`;
      }
      workingHoursValue = JSON.stringify(obj);
    }

    setSavingProfile(true);
    try {
      await updateProvider({
        name: profileForm.name.trim(),
        category: profileForm.category.trim(),
        description: profileForm.description.trim(),
        phone: profileForm.phone.trim(),
        city: profileForm.city.trim(),
        neighborhood: profileForm.neighborhood.trim(),
        address: profileForm.address.trim(),
        avatar: profileForm.avatar,
        coverUri: profileForm.coverUri,
        workingHours: workingHoursValue.trim(),
        businessType: profileForm.businessType,
        deliveryTime:
          profileForm.businessType === "alimentacao"
            ? profileForm.deliveryTime.trim()
            : null,
        socialLinks: profileForm.socialLinks,
      });
      setShowEditProfileModal(false);
      Alert.alert("Sucesso", "Dados do negócio atualizados com sucesso.");
    } catch (e) {
      Alert.alert("Erro", "Não foi possível atualizar os dados do negócio.");
    } finally {
      setSavingProfile(false);
    }
  };

  if (!isProvider || !provider) {
    return (
      <View
        style={[
          styles.container,
          {
            paddingTop: insets.top,
            alignItems: "center",
            justifyContent: "center",
          },
        ]}
      >
        <MaterialIcons name="lock" size={56} color="#D1D5DB" />
        <Text style={styles.emptyTitle}>Área exclusiva para prestadores</Text>
        <Pressable
          style={({ pressed }) => [styles.ctaBtn, pressed && { opacity: 0.85 }]}
          onPress={() => router.replace("/become-provider" as any)}
        >
          <Text style={styles.ctaBtnText}>Tornar-me prestador</Text>
        </Pressable>
      </View>
    );
  }

  const plan = provider.plan ? PLANS[provider.plan] : null;
  const expiresAt = provider.planExpiresAt
    ? new Date(provider.planExpiresAt).toLocaleDateString("pt-BR")
    : null;

  const openCreateModal = () => {
    const max = provider.maxServicos !== undefined ? provider.maxServicos : 1;
    if (max !== -1 && provider.services.length >= max) {
      Alert.alert(
        "Limite Atingido",
        `Seu plano permite cadastrar apenas ${max} ${isCommerce ? "produto" : "serviço"}(s). Faça upgrade para adicionar mais.`,
        [{ text: "OK" }],
      );
      return;
    }
    setEditingService(null);
    setForm({
      name: "",
      description: "",
      imageUri: "",
      price: "",
      productCategory: "",
      gallery: [],
    });
    setShowModal(true);
  };

  const openEditModal = (service: ProviderService) => {
    setEditingService(service);
    setForm({
      name: service.name,
      description: service.description,
      imageUri: service.imageUri || "",
      price: service.price !== undefined ? String(service.price) : "",
      productCategory: service.productCategory || "",
      gallery: service.gallery || [],
    });
    setShowModal(true);
  };

  const handlePickGalleryPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.85,
      allowsMultipleSelection: true,
    });
    if (!result.canceled) {
      const newUris = result.assets.map((a) => a.uri);
      setForm((prev) => ({
        ...prev,
        gallery: [...prev.gallery, ...newUris].slice(0, 8),
      }));
    }
  };

  const removeGalleryPhoto = (index: number) => {
    setForm((prev) => ({
      ...prev,
      gallery: prev.gallery.filter((_, i) => i !== index),
    }));
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.85,
    });
    if (!result.canceled) {
      setForm((prev) => ({ ...prev, imageUri: result.assets[0].uri }));
    }
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.description.trim()) {
      Alert.alert(
        "Erro",
        `Preencha nome e descrição do ${isCommerce ? "produto" : "serviço"}.`,
      );
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        name: form.name.trim(),
        description: form.description.trim(),
        imageUri: form.imageUri || undefined,
        gallery: form.gallery.length > 0 ? form.gallery : undefined,
        price: form.price ? Number(form.price) : undefined,
      };

      if (isCommerce) {
        payload.productCategory = form.productCategory.trim() || undefined;
      }

      if (editingService) {
        await updateService(editingService.id, payload);
      } else {
        await addService(payload);
      }
      setShowModal(false);
    } catch (e: any) {
      Alert.alert(
        "Erro",
        `Não foi possível salvar o ${isCommerce ? "produto" : "serviço"}.`,
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert("Remover serviço", `Remover "${name}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Remover",
        style: "destructive",
        onPress: () => deleteService(id),
      },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/(tabs)" as any);
            }
          }}
        >
          <MaterialIcons name="arrow-back" size={24} color="#111827" />
        </Pressable>
        <Text style={styles.headerTitle}>Meu negócio</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Profile card */}
        <View style={styles.profileCard}>
          <Image source={{ uri: provider.avatar }} style={styles.avatar} />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{provider.name}</Text>
            <Text style={styles.profileCategory}>{provider.category}</Text>
            <Text style={styles.profileCity}>
              {provider.city} — {provider.neighborhood}
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.editProfileInlineBtn,
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => {
                let wOpen = true,
                  wStart = "08:00",
                  wEnd = "18:00";
                let sOpen = false,
                  sStart = "09:00",
                  sEnd = "14:00";
                let sunOpen = false,
                  sunStart = "09:00",
                  sunEnd = "14:00";
                let custom = false;
                let rawValue = provider.workingHours
                  ? typeof provider.workingHours === "string"
                    ? provider.workingHours
                    : JSON.stringify(provider.workingHours)
                  : "";

                if (provider.workingHours) {
                  try {
                    const parsed = JSON.parse(provider.workingHours);
                    if (
                      parsed &&
                      (parsed.weekday || parsed.saturday || parsed.sunday)
                    ) {
                      if (parsed.weekday) {
                        const parts = parsed.weekday
                          .replace(/h/g, "")
                          .split("-");
                        if (parts.length === 2) {
                          wOpen = true;
                          wStart = parts[0].trim();
                          wEnd = parts[1].trim();
                        }
                      } else {
                        wOpen = false;
                      }

                      if (parsed.saturday) {
                        const parts = parsed.saturday
                          .replace(/h/g, "")
                          .split("-");
                        if (parts.length === 2) {
                          sOpen = true;
                          sStart = parts[0].trim();
                          sEnd = parts[1].trim();
                        }
                      } else {
                        sOpen = false;
                      }

                      if (parsed.sunday) {
                        const parts = parsed.sunday
                          .replace(/h/g, "")
                          .split("-");
                        if (parts.length === 2) {
                          sunOpen = true;
                          sunStart = parts[0].trim();
                          sunEnd = parts[1].trim();
                        }
                      } else {
                        sunOpen = false;
                      }
                    } else {
                      custom = true;
                    }
                  } catch {
                    custom = true;
                  }
                } else {
                  wOpen = true;
                  sOpen = false;
                  sunOpen = false;
                }

                setWeekdayOpen(wOpen);
                setWeekdayStart(wStart);
                setWeekdayEnd(wEnd);
                setSaturdayOpen(sOpen);
                setSaturdayStart(sStart);
                setSaturdayEnd(sEnd);
                setSundayOpen(sunOpen);
                setSundayStart(sunStart);
                setSundayEnd(sunEnd);
                setUseCustomHours(custom);

                setProfileForm({
                  name: provider.name || "",
                  category: provider.category || "",
                  description: provider.description || "",
                  phone: provider.phone || "",
                  city: provider.city || "",
                  neighborhood: provider.neighborhood || "",
                  address: provider.address || "",
                  avatar: provider.avatar || "",
                  coverUri: provider.coverUri || "",
                  workingHours: rawValue,
                  businessType: provider.businessType || "servicos",
                  deliveryTime: provider.deliveryTime || "",
                  socialLinks: provider.socialLinks || {},
                });
                setShowEditProfileModal(true);
              }}
            >
              <MaterialIcons name="edit" size={14} color="#25D366" />
              <Text style={styles.editProfileInlineText}>
                Editar dados do negócio
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Plan card */}
        <View style={styles.planCard}>
          <View style={styles.planLeft}>
            <MaterialIcons name="workspace-premium" size={22} color="#25D366" />
            <View>
              <Text style={styles.planLabel}>
                Plano {plan?.label || "Inativo"}
              </Text>
              {expiresAt && (
                <Text style={styles.planExpiry}>Válido até {expiresAt}</Text>
              )}
            </View>
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.renewBtn,
              pressed && { opacity: 0.7 },
            ]}
            onPress={() => {
              Alert.alert("Renovar plano", "Escolha o plano:", [
                {
                  text: "Mensal — R$10,00",
                  onPress: () => renewPlan("monthly"),
                },
                { text: "Anual — R$99,90", onPress: () => renewPlan("annual") },
                { text: "Cancelar", style: "cancel" },
              ]);
            }}
          >
            <Text style={styles.renewBtnText}>Renovar</Text>
          </Pressable>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {provider.services.length}
              {provider.maxServicos !== undefined
                ? provider.maxServicos === -1
                  ? " / ∞"
                  : ` / ${provider.maxServicos}`
                : " / 1"}
            </Text>
            <Text style={styles.statLabel}>
              {isCommerce ? "Produtos" : "Serviços"}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Contatos</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>5.0</Text>
            <Text style={styles.statLabel}>Avaliação</Text>
          </View>
        </View>

        {/* Services section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {isCommerce ? "Meus Produtos" : "Meus Serviços"}
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.addBtn,
              pressed && { opacity: 0.8 },
            ]}
            onPress={openCreateModal}
          >
            <MaterialIcons name="add" size={18} color="#fff" />
            <Text style={styles.addBtnText}>Adicionar</Text>
          </Pressable>
        </View>

        {provider.services.length === 0 ? (
          <View style={styles.emptyServices}>
            <MaterialIcons
              name="add-circle-outline"
              size={48}
              color="#D1D5DB"
            />
            <Text style={styles.emptyTitle}>
              Nenhum {isCommerce ? "produto" : "serviço"} cadastrado
            </Text>
            <Text style={styles.emptySubtitle}>
              Adicione os {isCommerce ? "produtos" : "serviços"} que você
              oferece
            </Text>
          </View>
        ) : (
          provider.services.map((svc) => (
            <View key={svc.id} style={styles.serviceCard}>
              {svc.imageUri ? (
                <Image
                  source={{ uri: svc.imageUri }}
                  style={styles.serviceThumbnail}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.serviceIconPlaceholder}>
                  <MaterialIcons name="build" size={24} color="#25D366" />
                </View>
              )}
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{svc.name}</Text>
                <Text style={styles.serviceDesc} numberOfLines={2}>
                  {svc.description}
                </Text>
              </View>
              <View style={styles.serviceActions}>
                <Pressable
                  style={({ pressed }) => [
                    styles.actionBtn,
                    styles.editBtn,
                    pressed && { opacity: 0.7 },
                  ]}
                  onPress={() => openEditModal(svc)}
                >
                  <MaterialIcons name="edit" size={16} color="#3B82F6" />
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.actionBtn,
                    styles.deleteBtn,
                    pressed && { opacity: 0.7 },
                  ]}
                  onPress={() => handleDelete(svc.id, svc.name)}
                >
                  <MaterialIcons
                    name="delete-outline"
                    size={16}
                    color="#EF4444"
                  />
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingService
                  ? isCommerce
                    ? "Editar Produto"
                    : "Editar Serviço"
                  : isCommerce
                    ? "Novo Produto"
                    : "Novo Serviço"}
              </Text>
              <Pressable
                style={({ pressed }) => [
                  styles.modalCloseBtn,
                  pressed && { opacity: 0.6 },
                ]}
                onPress={() => setShowModal(false)}
              >
                <MaterialIcons name="close" size={22} color="#6B7280" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.fieldLabel}>Imagem (opcional)</Text>
              <Pressable
                style={({ pressed }) => [
                  styles.imagePickerBtn,
                  pressed && { opacity: 0.8 },
                ]}
                onPress={handlePickImage}
              >
                {form.imageUri ? (
                  <View style={styles.imagePreviewWrapper}>
                    <Image
                      source={{ uri: form.imageUri }}
                      style={styles.imagePreview}
                      resizeMode="cover"
                    />
                    <View style={styles.imageEditOverlay}>
                      <MaterialIcons name="edit" size={18} color="#fff" />
                      <Text style={styles.imageEditText}>Trocar foto</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <MaterialIcons
                      name="add-photo-alternate"
                      size={28}
                      color="#9CA3AF"
                    />
                    <Text style={styles.imagePlaceholderText}>
                      Adicionar foto
                    </Text>
                  </View>
                )}
              </Pressable>

              <Text style={styles.fieldLabel}>
                {isCommerce ? "Nome do produto" : "Nome do serviço"}
              </Text>
              <View style={styles.fieldBox}>
                <MaterialIcons
                  name={isCommerce ? "shopping-bag" : "build"}
                  size={18}
                  color="#9CA3AF"
                />
                <TextInput
                  style={styles.fieldInput}
                  placeholder={
                    isCommerce
                      ? "Ex: Pizza de Calabresa"
                      : "Ex: Instalação elétrica"
                  }
                  placeholderTextColor="#9CA3AF"
                  value={form.name}
                  onChangeText={(t) => setForm({ ...form, name: t })}
                />
              </View>

              <Text style={styles.fieldLabel}>Descrição</Text>
              <View
                style={[
                  styles.fieldBox,
                  { alignItems: "flex-start", paddingTop: 12 },
                ]}
              >
                <TextInput
                  style={[
                    styles.fieldInput,
                    { minHeight: 80, textAlignVertical: "top" },
                  ]}
                  placeholder={
                    isCommerce
                      ? "Descreva o produto..."
                      : "Descreva o serviço..."
                  }
                  placeholderTextColor="#9CA3AF"
                  value={form.description}
                  onChangeText={(t) => setForm({ ...form, description: t })}
                  multiline
                  numberOfLines={4}
                />
              </View>

              <Text style={styles.fieldLabel}>Preço (R$ - opcional)</Text>
              <View style={styles.fieldBox}>
                <MaterialIcons
                  name="attach-money"
                  size={18}
                  color="#9CA3AF"
                />
                <TextInput
                  style={styles.fieldInput}
                  placeholder="Ex: 45.00"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  value={form.price}
                  onChangeText={(t) => setForm({ ...form, price: t })}
                />
              </View>

              {isCommerce && (
                <>
                  <Text style={styles.fieldLabel}>
                    Categoria do Produto (opcional)
                  </Text>
                  <View style={styles.fieldBox}>
                    <MaterialIcons name="label" size={18} color="#9CA3AF" />
                    <TextInput
                      style={styles.fieldInput}
                      placeholder="Ex: Pizzas Salgadas, Bebidas"
                      placeholderTextColor="#9CA3AF"
                      value={form.productCategory}
                      onChangeText={(t) =>
                        setForm({ ...form, productCategory: t })
                      }
                    />
                  </View>
                </>
              )}

              {/* Galeria de fotos do local */}
              <Text style={styles.fieldLabel}>
                Galeria de fotos do local (máx. 8)
              </Text>
              <Text
                style={[
                  styles.fieldLabel,
                  {
                    fontSize: 11,
                    color: "#9CA3AF",
                    marginTop: -8,
                    marginBottom: 8,
                  },
                ]}
              >
                Adicione fotos da fachada, interior e ambiente
              </Text>
              <View style={styles.galleryRow}>
                {form.gallery.map((uri, idx) => (
                  <View key={idx} style={styles.galleryThumbWrapper}>
                    <Image
                      source={{ uri }}
                      style={styles.galleryThumb}
                      resizeMode="cover"
                    />
                    <Pressable
                      style={styles.galleryRemoveBtn}
                      onPress={() => removeGalleryPhoto(idx)}
                    >
                      <MaterialIcons name="close" size={12} color="#fff" />
                    </Pressable>
                  </View>
                ))}
                {form.gallery.length < 8 && (
                  <Pressable
                    style={({ pressed }) => [
                      styles.galleryAddBtn,
                      pressed && { opacity: 0.7 },
                    ]}
                    onPress={handlePickGalleryPhoto}
                  >
                    <MaterialIcons
                      name="add-photo-alternate"
                      size={22}
                      color="#25D366"
                    />
                    <Text style={styles.galleryAddText}>Foto</Text>
                  </Pressable>
                )}
              </View>

              <View style={styles.modalActions}>
                <Pressable
                  style={({ pressed }) => [
                    styles.cancelBtn,
                    pressed && { opacity: 0.7 },
                  ]}
                  onPress={() => setShowModal(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.saveBtn,
                    (pressed || saving) && { opacity: 0.85 },
                  ]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <MaterialIcons
                        name={editingService ? "check" : "add"}
                        size={18}
                        color="#fff"
                      />
                      <Text style={styles.saveBtnText}>
                        {editingService ? "Salvar" : "Adicionar"}
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal Editar Dados do Negócio */}
      <Modal
        visible={showEditProfileModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditProfileModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Dados do Negócio</Text>
              <Pressable
                style={({ pressed }) => [
                  styles.modalCloseBtn,
                  pressed && { opacity: 0.6 },
                ]}
                onPress={() => setShowEditProfileModal(false)}
              >
                <MaterialIcons name="close" size={22} color="#6B7280" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Fotos (Avatar e Cover) */}
              <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Foto do Negócio</Text>
                  <Pressable
                    style={({ pressed }) => [
                      styles.imagePickerBtn,
                      pressed && { opacity: 0.8 },
                    ]}
                    onPress={handlePickAvatar}
                  >
                    {profileForm.avatar ? (
                      <View
                        style={{
                          width: "100%",
                          height: 80,
                          position: "relative",
                        }}
                      >
                        <Image
                          source={{ uri: profileForm.avatar }}
                          style={{ width: "100%", height: 80, borderRadius: 8 }}
                          resizeMode="cover"
                        />
                        <View style={styles.imageEditOverlay}>
                          <MaterialIcons name="edit" size={14} color="#fff" />
                        </View>
                      </View>
                    ) : (
                      <View style={[styles.imagePlaceholder, { height: 80 }]}>
                        <MaterialIcons
                          name="add-a-photo"
                          size={20}
                          color="#9CA3AF"
                        />
                      </View>
                    )}
                  </Pressable>
                </View>

                <View style={{ flex: 2 }}>
                  <Text style={styles.fieldLabel}>Foto de Capa</Text>
                  <Pressable
                    style={({ pressed }) => [
                      styles.imagePickerBtn,
                      pressed && { opacity: 0.8 },
                    ]}
                    onPress={handlePickCover}
                  >
                    {profileForm.coverUri ? (
                      <View
                        style={{
                          width: "100%",
                          height: 80,
                          position: "relative",
                        }}
                      >
                        <Image
                          source={{ uri: profileForm.coverUri }}
                          style={{ width: "100%", height: 80, borderRadius: 8 }}
                          resizeMode="cover"
                        />
                        <View style={styles.imageEditOverlay}>
                          <MaterialIcons name="edit" size={14} color="#fff" />
                        </View>
                      </View>
                    ) : (
                      <View style={[styles.imagePlaceholder, { height: 80 }]}>
                        <MaterialIcons
                          name="add-photo-alternate"
                          size={20}
                          color="#9CA3AF"
                        />
                      </View>
                    )}
                  </Pressable>
                </View>
              </View>

              <Text style={styles.fieldLabel}>Nome do Negócio</Text>
              <View style={styles.fieldBox}>
                <MaterialIcons name="store" size={18} color="#9CA3AF" />
                <TextInput
                  style={styles.fieldInput}
                  placeholder="Nome do seu negócio"
                  placeholderTextColor="#9CA3AF"
                  value={profileForm.name}
                  onChangeText={(t) =>
                    setProfileForm({ ...profileForm, name: t })
                  }
                />
              </View>

              <Text style={styles.fieldLabel}>Categoria (Selecione primeiro o Tipo)</Text>
              <Pressable
                style={styles.fieldBox}
                onPress={() => {
                  if (profileForm.businessType) {
                    setShowCategoryModal(true);
                  } else {
                    Alert.alert("Atenção", "Selecione o tipo de negócio primeiro.");
                  }
                }}
              >
                <MaterialIcons name="label" size={18} color="#9CA3AF" />
                <Text
                  style={[
                    styles.fieldInput,
                    {
                      color: profileForm.category ? "#111827" : "#9CA3AF",
                      paddingTop: Platform.OS === "ios" ? 0 : 2,
                      lineHeight: 22,
                    },
                  ]}
                >
                  {profileForm.category || "Selecionar categoria"}
                </Text>
                <MaterialIcons name="chevron-right" size={20} color="#9CA3AF" />
              </Pressable>

              {/* Tipo de Negócio */}
              <Text style={styles.fieldLabel}>Tipo de Negócio</Text>
              <View style={[styles.businessTypeContainer, { flexWrap: "wrap" }]}>
                {BUSINESS_TYPES.map((type) => {
                  const isSelected = profileForm.businessType === type.id;
                  return (
                    <Pressable
                      key={type.id}
                      style={[
                        styles.typeButton,
                        { flexBasis: "48%", flexGrow: 1, marginBottom: 8 },
                        isSelected && styles.typeButtonSelected,
                      ]}
                      onPress={() => {
                        if (profileForm.businessType !== type.id) {
                          setProfileForm({
                            ...profileForm,
                            businessType: type.id,
                            category: "", 
                            deliveryTime:
                              type.id === "alimentacao"
                                ? profileForm.deliveryTime || "30-45 min"
                                : "",
                          });
                        }
                      }}
                    >
                      <MaterialIcons
                        name={type.icon as any}
                        size={18}
                        color={isSelected ? "#FFFFFF" : "#6B7280"}
                      />
                      <Text
                        style={[
                          styles.typeButtonText,
                          isSelected && styles.typeButtonTextSelected,
                        ]}
                      >
                        {type.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Delivery Time (Only if businessType is alimentacao) */}
              {profileForm.businessType === "alimentacao" && (
                <>
                  <Text style={styles.fieldLabel}>
                    Tempo Estimado de Entrega
                  </Text>
                  <View style={styles.fieldBox}>
                    <MaterialIcons
                      name="access-time"
                      size={18}
                      color="#9CA3AF"
                    />
                    <TextInput
                      style={styles.fieldInput}
                      placeholder="Ex: 30-45 min"
                      placeholderTextColor="#9CA3AF"
                      value={profileForm.deliveryTime}
                      onChangeText={(t) =>
                        setProfileForm({ ...profileForm, deliveryTime: t })
                      }
                    />
                  </View>
                </>
              )}

              <Text style={styles.fieldLabel}>Descrição do Negócio</Text>
              <View
                style={[
                  styles.fieldBox,
                  { alignItems: "flex-start", paddingTop: 12 },
                ]}
              >
                <TextInput
                  style={[
                    styles.fieldInput,
                    { minHeight: 60, textAlignVertical: "top" },
                  ]}
                  placeholder="Fale um pouco sobre o seu negócio..."
                  placeholderTextColor="#9CA3AF"
                  value={profileForm.description}
                  onChangeText={(t) =>
                    setProfileForm({ ...profileForm, description: t })
                  }
                  multiline
                  numberOfLines={3}
                />
              </View>

              <Text style={styles.fieldLabel}>Telefone/WhatsApp</Text>
              <View style={styles.fieldBox}>
                <MaterialIcons name="phone" size={18} color="#9CA3AF" />
                <TextInput
                  style={styles.fieldInput}
                  placeholder="DDD + Número"
                  placeholderTextColor="#9CA3AF"
                  value={profileForm.phone}
                  onChangeText={(t) =>
                    setProfileForm({ ...profileForm, phone: t })
                  }
                />
              </View>

              <Text style={styles.fieldLabel}>Horário de Funcionamento</Text>

              {/* Type of working hours input toggle */}
              <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
                <Pressable
                  style={[
                    styles.hourModeBtn,
                    !useCustomHours && styles.hourModeBtnActive,
                  ]}
                  onPress={() => setUseCustomHours(false)}
                >
                  <Text
                    style={[
                      styles.hourModeBtnText,
                      !useCustomHours && styles.hourModeBtnTextActive,
                    ]}
                  >
                    Selecionar Opções
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.hourModeBtn,
                    useCustomHours && styles.hourModeBtnActive,
                  ]}
                  onPress={() => setUseCustomHours(true)}
                >
                  <Text
                    style={[
                      styles.hourModeBtnText,
                      useCustomHours && styles.hourModeBtnTextActive,
                    ]}
                  >
                    Digitar/Colar Texto
                  </Text>
                </Pressable>
              </View>

              {!useCustomHours ? (
                <View style={styles.optionsHoursContainer}>
                  {/* Segunda a Sexta */}
                  <View style={styles.hourRow}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        width: 110,
                        gap: 6,
                      }}
                    >
                      <Pressable
                        style={[
                          styles.checkbox,
                          weekdayOpen && styles.checkboxChecked,
                        ]}
                        onPress={() => setWeekdayOpen(!weekdayOpen)}
                      >
                        {weekdayOpen && (
                          <MaterialIcons name="check" size={12} color="#fff" />
                        )}
                      </Pressable>
                      <Text
                        style={[
                          styles.hourRowLabel,
                          weekdayOpen && { fontWeight: "700" },
                        ]}
                      >
                        Seg a Sex
                      </Text>
                    </View>
                    {weekdayOpen ? (
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                          flex: 1,
                          justifyContent: "flex-end",
                        }}
                      >
                        <Pressable
                          style={styles.timeSelectBtn}
                          onPress={() =>
                            openTimePicker(
                              "Início Segunda a Sexta",
                              weekdayStart,
                              setWeekdayStart,
                            )
                          }
                        >
                          <Text style={styles.timeSelectBtnText}>
                            {weekdayStart}
                          </Text>
                        </Pressable>
                        <Text style={{ fontSize: 12, color: "#6B7280" }}>
                          até
                        </Text>
                        <Pressable
                          style={styles.timeSelectBtn}
                          onPress={() =>
                            openTimePicker(
                              "Fim Segunda a Sexta",
                              weekdayEnd,
                              setWeekdayEnd,
                            )
                          }
                        >
                          <Text style={styles.timeSelectBtnText}>
                            {weekdayEnd}
                          </Text>
                        </Pressable>
                      </View>
                    ) : (
                      <Text style={styles.closedText}>
                        Fechado / Sem Atendimento
                      </Text>
                    )}
                  </View>

                  {/* Sábado */}
                  <View style={styles.hourRow}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        width: 110,
                        gap: 6,
                      }}
                    >
                      <Pressable
                        style={[
                          styles.checkbox,
                          saturdayOpen && styles.checkboxChecked,
                        ]}
                        onPress={() => setSaturdayOpen(!saturdayOpen)}
                      >
                        {saturdayOpen && (
                          <MaterialIcons name="check" size={12} color="#fff" />
                        )}
                      </Pressable>
                      <Text
                        style={[
                          styles.hourRowLabel,
                          saturdayOpen && { fontWeight: "700" },
                        ]}
                      >
                        Sábado
                      </Text>
                    </View>
                    {saturdayOpen ? (
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                          flex: 1,
                          justifyContent: "flex-end",
                        }}
                      >
                        <Pressable
                          style={styles.timeSelectBtn}
                          onPress={() =>
                            openTimePicker(
                              "Início Sábado",
                              saturdayStart,
                              setSaturdayStart,
                            )
                          }
                        >
                          <Text style={styles.timeSelectBtnText}>
                            {saturdayStart}
                          </Text>
                        </Pressable>
                        <Text style={{ fontSize: 12, color: "#6B7280" }}>
                          até
                        </Text>
                        <Pressable
                          style={styles.timeSelectBtn}
                          onPress={() =>
                            openTimePicker(
                              "Fim Sábado",
                              saturdayEnd,
                              setSaturdayEnd,
                            )
                          }
                        >
                          <Text style={styles.timeSelectBtnText}>
                            {saturdayEnd}
                          </Text>
                        </Pressable>
                      </View>
                    ) : (
                      <Text style={styles.closedText}>
                        Fechado / Sem Atendimento
                      </Text>
                    )}
                  </View>

                  {/* Domingo */}
                  <View style={styles.hourRow}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        width: 110,
                        gap: 6,
                      }}
                    >
                      <Pressable
                        style={[
                          styles.checkbox,
                          sundayOpen && styles.checkboxChecked,
                        ]}
                        onPress={() => setSundayOpen(!sundayOpen)}
                      >
                        {sundayOpen && (
                          <MaterialIcons name="check" size={12} color="#fff" />
                        )}
                      </Pressable>
                      <Text
                        style={[
                          styles.hourRowLabel,
                          sundayOpen && { fontWeight: "700" },
                        ]}
                      >
                        Domingo
                      </Text>
                    </View>
                    {sundayOpen ? (
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                          flex: 1,
                          justifyContent: "flex-end",
                        }}
                      >
                        <Pressable
                          style={styles.timeSelectBtn}
                          onPress={() =>
                            openTimePicker(
                              "Início Domingo",
                              sundayStart,
                              setSundayStart,
                            )
                          }
                        >
                          <Text style={styles.timeSelectBtnText}>
                            {sundayStart}
                          </Text>
                        </Pressable>
                        <Text style={{ fontSize: 12, color: "#6B7280" }}>
                          até
                        </Text>
                        <Pressable
                          style={styles.timeSelectBtn}
                          onPress={() =>
                            openTimePicker(
                              "Fim Domingo",
                              sundayEnd,
                              setSundayEnd,
                            )
                          }
                        >
                          <Text style={styles.timeSelectBtnText}>
                            {sundayEnd}
                          </Text>
                        </Pressable>
                      </View>
                    ) : (
                      <Text style={styles.closedText}>
                        Fechado / Sem Atendimento
                      </Text>
                    )}
                  </View>
                </View>
              ) : (
                <View style={[styles.fieldBox, { paddingRight: 8 }]}>
                  <MaterialIcons name="access-time" size={18} color="#9CA3AF" />
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="Ex: Seg a Sex, das 8h às 18h"
                    placeholderTextColor="#9CA3AF"
                    value={profileForm.workingHours}
                    onChangeText={(t) =>
                      setProfileForm({ ...profileForm, workingHours: t })
                    }
                    selectTextOnFocus={true}
                    contextMenuHidden={false}
                  />
                  <Pressable
                    style={({ pressed }) => [
                      styles.pasteInlineBtn,
                      pressed && { opacity: 0.7 },
                    ]}
                    onPress={handlePaste}
                  >
                    <MaterialIcons
                      name="content-paste"
                      size={16}
                      color="#25D366"
                    />
                    <Text style={styles.pasteInlineText}>Colar</Text>
                  </Pressable>
                </View>
              )}

              <Text style={styles.fieldLabel}>Endereço Completo</Text>
              <View style={styles.fieldBox}>
                <MaterialIcons name="place" size={18} color="#9CA3AF" />
                <TextInput
                  style={styles.fieldInput}
                  placeholder="Rua, número, complemento"
                  placeholderTextColor="#9CA3AF"
                  value={profileForm.address}
                  onChangeText={(t) =>
                    setProfileForm({ ...profileForm, address: t })
                  }
                />
              </View>

              <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Bairro</Text>
                  <View style={styles.fieldBox}>
                    <TextInput
                      style={styles.fieldInput}
                      placeholder="Bairro"
                      placeholderTextColor="#9CA3AF"
                      value={profileForm.neighborhood}
                      onChangeText={(t) =>
                        setProfileForm({ ...profileForm, neighborhood: t })
                      }
                    />
                  </View>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Cidade</Text>
                  <View style={styles.fieldBox}>
                    <TextInput
                      style={styles.fieldInput}
                      placeholder="Cidade"
                      placeholderTextColor="#9CA3AF"
                      value={profileForm.city}
                      onChangeText={(t) =>
                        setProfileForm({ ...profileForm, city: t })
                      }
                    />
                  </View>
                </View>
              </View>

              {/* Social Media Links */}
              <Text style={styles.fieldLabel}>Redes Sociais</Text>
              <Text
                style={[
                  styles.fieldLabel,
                  { fontSize: 11, color: "#9CA3AF", marginTop: -8, marginBottom: 8 },
                ]}
              >
                Adicione os links do seu perfil nas redes sociais
              </Text>
              {SOCIAL_NETWORKS.map((network) => (
                <View key={network.key} style={{ marginBottom: 10 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <Image
                      source={SOCIAL_PNG_ASSETS[network.key]}
                      style={{ width: 20, height: 20, resizeMode: "contain" }}
                    />
                    <Text style={{ fontSize: 13, fontWeight: "600", color: "#374151" }}>
                      {network.label}
                    </Text>
                  </View>
                  <View style={styles.fieldBox}>
                    <TextInput
                      style={styles.fieldInput}
                      placeholder={network.placeholder}
                      placeholderTextColor="#9CA3AF"
                      value={profileForm.socialLinks[network.key] || ""}
                      onChangeText={(t) =>
                        setProfileForm({
                          ...profileForm,
                          socialLinks: { ...profileForm.socialLinks, [network.key]: t },
                        })
                      }
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="url"
                    />
                    {!!profileForm.socialLinks[network.key] && (
                      <Pressable
                        onPress={() => {
                          const updated = { ...profileForm.socialLinks };
                          delete updated[network.key];
                          setProfileForm({ ...profileForm, socialLinks: updated });
                        }}
                        style={{ padding: 4 }}
                      >
                        <MaterialIcons name="close" size={16} color="#9CA3AF" />
                      </Pressable>
                    )}
                  </View>
                </View>
              ))}

              <View style={styles.modalActions}>
                <Pressable
                  style={({ pressed }) => [
                    styles.cancelBtn,
                    pressed && { opacity: 0.7 },
                  ]}
                  onPress={() => setShowEditProfileModal(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.saveBtn,
                    (pressed || savingProfile) && { opacity: 0.85 },
                  ]}
                  onPress={handleSaveProfile}
                  disabled={savingProfile}
                >
                  {savingProfile ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <MaterialIcons name="check" size={18} color="#fff" />
                      <Text style={styles.saveBtnText}>Salvar</Text>
                    </>
                  )}
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Time Picker Modal */}
      <Modal
        visible={pickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerVisible(false)}
      >
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerSheet}>
            <Text style={styles.pickerTitle}>{pickerTitle}</Text>
            <FlatList
              data={pickerOptions}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.pickerOptionItem}
                  onPress={() => {
                    onSelectOption(item);
                    setPickerVisible(false);
                  }}
                >
                  <Text style={styles.pickerOptionText}>{item}</Text>
                </Pressable>
              )}
              style={{ maxHeight: 300 }}
              showsVerticalScrollIndicator={true}
            />
            <Pressable
              style={styles.pickerCloseBtn}
              onPress={() => setPickerVisible(false)}
            >
              <Text style={styles.pickerCloseBtnText}>Fechar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Modal Selecionar Categoria */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecionar Categoria</Text>
              <Pressable
                style={({ pressed }) => [
                  styles.modalCloseBtn,
                  pressed && { opacity: 0.6 },
                ]}
                onPress={() => setShowCategoryModal(false)}
              >
                <MaterialIcons name="close" size={22} color="#6B7280" />
              </Pressable>
            </View>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 40 }}
            >
              {profileForm.businessType &&
                CATEGORIES_BY_TYPE[profileForm.businessType]?.map((cat) => (
                  <Pressable
                    key={cat.id}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: 16,
                      borderBottomWidth: 1,
                      borderBottomColor: "#F3F4F6",
                    }}
                    onPress={() => {
                      setProfileForm({ ...profileForm, category: cat.label });
                      setShowCategoryModal(false);
                    }}
                  >
                    <MaterialIcons
                      name={cat.icon as any}
                      size={20}
                      color={
                        profileForm.category === cat.label
                          ? "#25D366"
                          : "#6B7280"
                      }
                    />
                    <Text
                      style={{
                        flex: 1,
                        marginLeft: 12,
                        fontSize: 16,
                        color:
                          profileForm.category === cat.label
                            ? "#111827"
                            : "#4B5563",
                        fontWeight:
                          profileForm.category === cat.label ? "600" : "400",
                      }}
                    >
                      {cat.label}
                    </Text>
                    {profileForm.category === cat.label && (
                      <MaterialIcons name="check" size={20} color="#25D366" />
                    )}
                  </Pressable>
                ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    margin: 16,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#E5E7EB",
  },
  profileInfo: { flex: 1, gap: 3 },
  profileName: { fontSize: 17, fontWeight: "700", color: "#111827" },
  profileCategory: { fontSize: 14, color: "#25D366", fontWeight: "600" },
  profileCity: { fontSize: 13, color: "#6B7280" },
  planCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F0FDF4",
    marginHorizontal: 16,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    marginBottom: 12,
  },
  planLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  planLabel: { fontSize: 15, fontWeight: "700", color: "#111827" },
  planExpiry: { fontSize: 12, color: "#6B7280" },
  renewBtn: {
    backgroundColor: "#25D366",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  renewBtnText: { fontSize: 13, fontWeight: "700", color: "#FFFFFF" },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statItem: { flex: 1, alignItems: "center", gap: 4 },
  statValue: { fontSize: 20, fontWeight: "700", color: "#111827" },
  statLabel: { fontSize: 12, color: "#6B7280" },
  statDivider: { width: 1, backgroundColor: "#E5E7EB", marginVertical: 4 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#25D366",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  addBtnText: { fontSize: 13, fontWeight: "700", color: "#FFFFFF" },
  emptyServices: { alignItems: "center", paddingVertical: 40, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: "#374151" },
  emptySubtitle: { fontSize: 13, color: "#9CA3AF" },
  galleryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  galleryThumbWrapper: {
    width: 72,
    height: 72,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  },
  galleryThumb: {
    width: "100%",
    height: "100%",
  },
  galleryRemoveBtn: {
    position: "absolute",
    top: 3,
    right: 3,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  galleryAddBtn: {
    width: 72,
    height: 72,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#25D366",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: "#F0FDF4",
  },
  galleryAddText: {
    fontSize: 10,
    color: "#25D366",
    fontWeight: "600",
  },
  serviceCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  serviceThumbnail: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    marginRight: 12,
  },
  serviceIconPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  serviceInfo: { flex: 1, gap: 3 },
  serviceName: { fontSize: 15, fontWeight: "700", color: "#111827" },
  serviceDesc: { fontSize: 12, color: "#6B7280", lineHeight: 17 },
  serviceActions: { flexDirection: "column", gap: 6, marginLeft: 8 },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  editBtn: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  deleteBtn: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#25D366",
    borderRadius: 14,
    paddingVertical: 16,
    marginHorizontal: 16,
    marginTop: 16,
    gap: 8,
  },
  ctaBtnText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: "90%",
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E5E7EB",
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    marginBottom: 4,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  imagePickerBtn: { borderRadius: 12, overflow: "hidden", marginBottom: 4 },
  imagePreviewWrapper: { position: "relative", width: "100%", height: 140 },
  imagePreview: { width: "100%", height: 140, borderRadius: 12 },
  imageEditOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 7,
    gap: 5,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  imageEditText: { color: "#FFFFFF", fontSize: 13, fontWeight: "600" },
  imagePlaceholder: {
    width: "100%",
    height: 110,
    backgroundColor: "#F9FAFB",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  imagePlaceholderText: { fontSize: 13, color: "#9CA3AF" },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
    marginTop: 12,
  },
  fieldBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  fieldInput: { flex: 1, fontSize: 14, color: "#111827", padding: 0 },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 24 },
  cancelBtn: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  cancelBtnText: { fontSize: 15, fontWeight: "600", color: "#374151" },
  saveBtn: {
    flex: 2,
    backgroundColor: "#25D366",
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  saveBtnText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
  editProfileInlineBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
    alignSelf: "flex-start",
  },
  editProfileInlineText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#25D366",
  },
  hourModeBtn: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  hourModeBtnActive: {
    backgroundColor: "#E5FBEB",
    borderColor: "#25D366",
  },
  hourModeBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4B5563",
  },
  hourModeBtnTextActive: {
    color: "#15803D",
    fontWeight: "700",
  },
  optionsHoursContainer: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
    gap: 12,
    marginBottom: 8,
  },
  hourRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  hourRowLabel: {
    fontSize: 14,
    color: "#374151",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "#9CA3AF",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  checkboxChecked: {
    backgroundColor: "#25D366",
    borderColor: "#25D366",
  },
  timeSelectBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#fff",
    minWidth: 70,
    alignItems: "center",
  },
  timeSelectBtnText: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "600",
  },
  closedText: {
    fontSize: 13,
    color: "#9CA3AF",
    fontStyle: "italic",
  },
  pasteInlineBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  pasteInlineText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#25D366",
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  pickerSheet: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    maxHeight: "70%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
    textAlign: "center",
  },
  pickerOptionItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    alignItems: "center",
  },
  pickerOptionText: {
    fontSize: 16,
    color: "#111827",
    fontWeight: "500",
  },
  pickerCloseBtn: {
    marginTop: 16,
    paddingVertical: 12,
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    alignItems: "center",
  },
  pickerCloseBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#4B5563",
  },
  businessTypeContainer: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
    marginBottom: 8,
  },
  typeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
  },
  typeButtonSelected: {
    backgroundColor: "#25D366",
    borderColor: "#25D366",
  },
  typeButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  typeButtonTextSelected: {
    color: "#FFFFFF",
  },
});
