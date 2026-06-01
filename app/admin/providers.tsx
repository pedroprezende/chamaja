/**
 * Tela Admin — Gerenciar Prestadores
 * CRUD completo de prestadores vinculados a serviços.
 */
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  TextInput,
  Alert,
  Image,
  ScrollView,
  Modal,
  Switch,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";

import { trpc } from "@/lib/trpc";
import { type AdminProvider, type CreateAdminProviderInput } from "@/lib/admin-providers-db";
import { storage } from "@/lib/storage";

// ─── Formulário vazio ─────────────────────────────────────────────────────────
interface ProviderForm extends CreateAdminProviderInput {
  serviceIds: string[];
  serviceNames: string[];
  workingHoursWeekday?: string;
  workingHoursSaturday?: string;
}

const EMPTY_FORM: ProviderForm = {
  name: "",
  serviceId: "",
  serviceName: "",
  subcategoryId: "",
  subcategoryName: "",
  serviceIds: [],
  serviceNames: [],
  whatsapp: "",
  description: "",
  address: "",
  avatarUri: "",
  gallery: [],
  rating: undefined,
  ratingCount: undefined,
  isActive: true,
  coverUri: "",
  isVerified: false,
  onlineStatus: false,
  responseTime: "",
  clientsServed: undefined,
  foundedYear: undefined,
  topBadge: "",
  popularServices: "",
  tags: "",
  workingHours: "",
  workingHoursWeekday: "",
  workingHoursSaturday: "",
};

// ─── Card de Prestador ────────────────────────────────────────────────────────
function ProviderCard({
  item,
  onEdit,
  onDelete,
  onToggle,
}: {
  item: any;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  return (
    <View style={[styles.card, !item.isActive && styles.cardInactive]}>
      <View style={styles.cardMain}>
        {/* Avatar */}
        {item.avatarUri ? (
          <Image source={{ uri: item.avatarUri }} style={styles.cardAvatar} />
        ) : (
          <View style={[styles.cardAvatar, styles.cardAvatarFallback]}>
            <MaterialIcons name="person" size={26} color="#94A3B8" />
          </View>
        )}

        {/* Informações */}
        <View style={styles.cardInfo}>
          <View style={styles.cardNameRow}>
            <Text style={styles.cardName} numberOfLines={1} ellipsizeMode="tail">
              {item.name}
            </Text>
            {item.isVerified && (
              <MaterialIcons name="verified" size={15} color="#15803D" style={{ marginLeft: 2 }} />
            )}
            {item.onlineStatus && (
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#25D366", marginLeft: 2 }} />
            )}
            {!item.isActive && (
              <View style={styles.inactivePill}>
                <Text style={styles.inactivePillText}>Inativo</Text>
              </View>
            )}
          </View>

          <View style={styles.servicePill}>
            <MaterialIcons name="build" size={11} color="#2563EB" />
            <Text style={styles.servicePillText} numberOfLines={1} ellipsizeMode="tail">
              {item.serviceName}
            </Text>
          </View>

          <View style={styles.cardMetaRow}>
            {!!item.whatsapp && (
              <View style={styles.cardMetaItem}>
                <MaterialIcons name="phone" size={12} color="#25D366" />
                <Text style={styles.cardMetaText}>{item.whatsapp}</Text>
              </View>
            )}
            {!!item.address && (
              <View style={styles.cardMetaItem}>
                <MaterialIcons name="place" size={12} color="#64748B" />
                <Text style={styles.cardMetaText} numberOfLines={1} ellipsizeMode="tail">
                  {item.address}
                </Text>
              </View>
            )}
            {!!item.rating && (
              <View style={styles.cardMetaItem}>
                <MaterialIcons name="star" size={12} color="#F59E0B" />
                <Text style={styles.cardMetaText}>{item.rating.toFixed(1)}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Ações */}
      <View style={styles.cardActions}>
        <Pressable
          style={({ pressed }) => [styles.actionBtn, styles.actionToggle, pressed && { opacity: 0.7 }]}
          onPress={onToggle}
        >
          <MaterialIcons
            name={item.isActive ? "visibility-off" : "visibility"}
            size={13}
            color="#64748B"
          />
          <Text style={styles.actionBtnText}>{item.isActive ? "Desativar" : "Ativar"}</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.actionBtn, styles.actionEdit, pressed && { opacity: 0.7 }]}
          onPress={onEdit}
        >
          <MaterialIcons name="edit" size={13} color="#2563EB" />
          <Text style={[styles.actionBtnText, { color: "#2563EB" }]}>Editar</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.actionBtn, styles.actionDelete, pressed && { opacity: 0.7 }]}
          onPress={onDelete}
        >
          <MaterialIcons name="delete-outline" size={13} color="#DC2626" />
          <Text style={[styles.actionBtnText, { color: "#DC2626" }]}>Excluir</Text>
        </Pressable>
      </View>
    </View>
  );
}

async function geocodeAddressClient(
  address: string | null | undefined,
  neighborhood?: string | null,
  city?: string | null
): Promise<{ latitude: number; longitude: number } | null> {
  const parts: string[] = [];
  if (address && address.trim() !== "") parts.push(address.trim());
  if (neighborhood && neighborhood.trim() !== "") parts.push(neighborhood.trim());
  if (city && city.trim() !== "") parts.push(city.trim());
  
  if (parts.length === 0) return null;
  parts.push("Brasil");

  const queryStr = parts.join(", ");
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(queryStr)}&format=json&limit=1`,
      {
        headers: {
          "User-Agent": "ChamaJaAdmin/1.0 (pedro@example.com)",
        },
      }
    );
    const data = await response.json();
    if (data && Array.isArray(data) && data.length > 0) {
      const lat = parseFloat(data[0].lat);
      const lon = parseFloat(data[0].lon);
      if (!isNaN(lat) && !isNaN(lon)) {
        return { latitude: lat, longitude: lon };
      }
    }
  } catch (error: any) {
    console.warn("[Geocoding Client] Failed for query:", queryStr, error.message);
  }
  
  // Se falhar, tenta apenas o bairro e cidade
  if (parts.length > 2) {
    const backupParts: string[] = [];
    if (neighborhood && neighborhood.trim() !== "") backupParts.push(neighborhood.trim());
    if (city && city.trim() !== "") backupParts.push(city.trim());
    backupParts.push("Brasil");
    const backupQuery = backupParts.join(", ");
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(backupQuery)}&format=json&limit=1`,
        {
          headers: {
            "User-Agent": "ChamaJaAdmin/1.0 (pedro@example.com)",
          },
        }
      );
      const data = await response.json();
      if (data && Array.isArray(data) && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        if (!isNaN(lat) && !isNaN(lon)) {
          return { latitude: lat, longitude: lon };
        }
      }
    } catch (e: any) {
      console.warn("[Geocoding Client] Backup failed for:", backupQuery, e.message);
    }
  }
  
  return null;
}

// ─── Tela Principal ───────────────────────────────────────────────────────────
export default function AdminProvidersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const utils = trpc.useUtils();
  const { data: dbProvidersData, isLoading: providersLoading } = trpc.providers.list.useQuery();
  const { data: dbServices } = trpc.services.all.useQuery();

  const createMutation = trpc.providers.create.useMutation();
  const updateMutation = trpc.providers.update.useMutation();
  const deleteMutation = trpc.providers.delete.useMutation();

  const providers = useMemo(() => dbProvidersData || [], [dbProvidersData]);
  const services = useMemo(() => dbServices || [], [dbServices]);
  
  const loading = providersLoading;
  const [saving, setSaving] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState<ProviderForm>(EMPTY_FORM);
  const [editingProvider, setEditingProvider] = useState<any>(null);
  const [showServicePicker, setShowServicePicker] = useState(false);
  const [serviceSearchQuery, setServiceSearchQuery] = useState("");
  const [selectedServicesMap, setSelectedServicesMap] = useState<Record<string, boolean>>({});

  const loadData = useCallback(async () => {
    await utils.providers.list.invalidate();
  }, [utils]);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = useMemo(() => {
    if (!searchText.trim()) return providers;
    const q = searchText.toLowerCase();
    return providers.filter(
      (p) =>
        (typeof p.name === "string" && p.name.toLowerCase().includes(q)) ||
        (typeof p.serviceName === "string" && p.serviceName.toLowerCase().includes(q)) ||
        (typeof p.address === "string" && p.address.toLowerCase().includes(q))
    );
  }, [providers, searchText]);

  const filteredServices = useMemo(() => {
    if (!serviceSearchQuery.trim()) return services;
    const q = serviceSearchQuery.toLowerCase();
    return services.filter((s) => typeof s.name === "string" && s.name.toLowerCase().includes(q));
  }, [services, serviceSearchQuery]);

  const openCreate = () => {
    setEditingProvider(null);
    setSelectedServicesMap({});
    setForm({ ...EMPTY_FORM });
    setShowServicePicker(false);
    setServiceSearchQuery("");
    setModalVisible(true);
  };

  const parseJsonArrayToCommaString = (val: any) => {
    if (!val) return "";
    try {
      const parsed = typeof val === "string" ? JSON.parse(val) : val;
      if (Array.isArray(parsed)) return parsed.join(", ");
    } catch {}
    return String(val);
  };

  const openEdit = (p: any) => {
    setEditingProvider(p);
    
    // Tentar recuperar múltiplos serviços
    let sIds: string[] = [];
    let sNames: string[] = [];
    
    if (p.serviceId && p.serviceId.includes(",")) {
      sIds = p.serviceId.split(",").map((s: string) => s.trim()).filter(Boolean);
      sNames = (p.serviceName || "").split(",").map((s: string) => s.trim()).filter(Boolean);
    } else if (p.serviceId) {
      sIds = [p.serviceId];
      sNames = [p.serviceName || ""];
    }

    // Sincronizar o mapa de seleções
    const initialMap: Record<string, boolean> = {};
    sIds.forEach(id => { initialMap[id] = true; });
    setSelectedServicesMap(initialMap);

    let weekdayHours = "";
    let satHours = "";
    if (p.workingHours) {
      try {
        const parsed = JSON.parse(p.workingHours);
        weekdayHours = parsed.weekday || "";
        satHours = parsed.saturday || "";
      } catch {
        weekdayHours = p.workingHours || "";
      }
    }

    setForm({
      name: p.name,
      serviceId: p.serviceId || "",
      serviceName: p.serviceName || "",
      subcategoryId: p.subcategoryId || "",
      subcategoryName: p.subcategoryName || "",
      serviceIds: sIds,
      serviceNames: sNames,
      whatsapp: p.whatsapp || p.phone || "",
      description: p.description || "",
      address: p.address || "",
      avatarUri: p.avatarUri || "",
      gallery: p.gallery || [],
      rating: p.rating,
      ratingCount: p.ratingCount,
      isActive: p.isActive,
      coverUri: p.coverUri || "",
      isVerified: p.isVerified || false,
      onlineStatus: p.onlineStatus || false,
      responseTime: p.responseTime || "",
      clientsServed: p.clientsServed,
      foundedYear: p.foundedYear,
      topBadge: p.topBadge || "",
      popularServices: parseJsonArrayToCommaString(p.popularServices),
      tags: parseJsonArrayToCommaString(p.tags),
      workingHours: p.workingHours || "",
      workingHoursWeekday: weekdayHours,
      workingHoursSaturday: satHours,
    });
    setShowServicePicker(false);
    setServiceSearchQuery("");
    setModalVisible(true);
  };

  const parseCommaStringToJsonArray = (val: string | null | undefined) => {
    if (!val) return JSON.stringify([]);
    const arr = val.split(",").map(s => s.trim()).filter(Boolean);
    return JSON.stringify(arr);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert("Campo obrigatório", "Digite o nome do prestador.");
      return;
    }
    const currentSelectedIds = Object.keys(selectedServicesMap).filter(id => selectedServicesMap[id]);
    const currentSelectedNames = services.filter(s => currentSelectedIds.includes(s.id)).map(s => s.name);

    if (currentSelectedIds.length === 0) {
      Alert.alert("Campo obrigatório", "Selecione pelo menos um serviço.");
      return;
    }
    setSaving(true);
    try {
      // Geocodificação no Cliente
      let latitude: number | null = null;
      let longitude: number | null = null;
      
      if (form.address && form.address.trim() !== "") {
        const coords = await geocodeAddressClient(form.address);
        if (coords) {
          latitude = coords.latitude;
          longitude = coords.longitude;
        } else {
          // Fallback para o centro de Bragança Paulista se o geocoding falhar
          console.warn("[Geocoding] Falha, usando coordenadas do centro da cidade.");
          latitude = -22.9519;
          longitude = -46.5419;
        }
      } else {
        // Se não tiver endereço, define o centro da cidade por padrão para evitar nulos
        latitude = -22.9519;
        longitude = -46.5419;
      }

      // 1. Upload Avatar
      let finalAvatar = form.avatarUri;
      if (finalAvatar && !finalAvatar.startsWith("http")) {
        const uploadedUrl = await storage.uploadImage(finalAvatar);
        if (uploadedUrl) {
          finalAvatar = uploadedUrl;
        } else {
          throw new Error("Erro no upload do avatar");
        }
      }

      // 2. Upload Capa
      let finalCover = form.coverUri;
      if (finalCover && !finalCover.startsWith("http")) {
        const uploadedUrl = await storage.uploadImage(finalCover);
        if (uploadedUrl) {
          finalCover = uploadedUrl;
        } else {
          throw new Error("Erro no upload da imagem de capa");
        }
      }

      // 3. Upload Galeria
      const finalGallery = [];
      for (const img of form.gallery || []) {
        if (img.startsWith("http")) {
          finalGallery.push(img);
        } else {
          const uploadedUrl = await storage.uploadImage(img);
          if (uploadedUrl) {
            finalGallery.push(uploadedUrl);
          }
        }
      }

      // 4. Preparar dados para o banco
      const providerData = {
        name: form.name,
        serviceId: currentSelectedIds.join(", "),
        serviceName: currentSelectedNames.join(", "),
        subcategoryId: currentSelectedIds[0] || null,
        subcategoryName: currentSelectedNames[0] || null,
        whatsapp: form.whatsapp,
        phone: form.whatsapp,
        description: form.description,
        address: form.address,
        avatarUri: finalAvatar,
        gallery: finalGallery,
        isActive: form.isActive,
        rating: form.rating ? String(form.rating) : "0",
        ratingCount: form.ratingCount || 0,
        plan: "premium",
        services: JSON.stringify(currentSelectedNames),
        latitude: latitude,
        longitude: longitude,
        coverUri: finalCover || null,
        isVerified: form.isVerified,
        onlineStatus: form.onlineStatus,
        responseTime: form.responseTime || null,
        clientsServed: form.clientsServed ? Number(form.clientsServed) : 0,
        foundedYear: form.foundedYear ? Number(form.foundedYear) : null,
        topBadge: form.topBadge || null,
        popularServices: parseCommaStringToJsonArray(form.popularServices),
        tags: parseCommaStringToJsonArray(form.tags),
        workingHours: JSON.stringify({
          weekday: form.workingHoursWeekday || "",
          saturday: form.workingHoursSaturday || "",
        }),
      };

      if (editingProvider) {
        await updateMutation.mutateAsync({
          id: editingProvider.id,
          updates: providerData as any
        });
      } else {
        await createMutation.mutateAsync(providerData as any);
      }

      await loadData();
      setModalVisible(false);
      Alert.alert("Sucesso", "Prestador salvo com sucesso!");
    } catch (err: any) {
      console.error(err);
      Alert.alert("Erro", "Não foi possível salvar os dados.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (p: any) => {
    Alert.alert(
      "Excluir prestador",
      `Deseja excluir "${p.name}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            await deleteMutation.mutateAsync({ id: p.id });
            await loadData();
          },
        },
      ]
    );
  };

  const handleToggle = async (p: any) => {
    await updateMutation.mutateAsync({
      id: p.id,
      updates: { isActive: !p.isActive } as any
    });
    await loadData();
  };

  const toggleServiceSelection = (svc: any) => {
    setSelectedServicesMap(prev => ({
      ...prev,
      [svc.id]: !prev[svc.id]
    }));
    
    // Atualizar também nomes para exibição imediata no botão
    setForm((prev: any) => {
      const isSelected = !!selectedServicesMap[svc.id];
      let newNames = [];
      if (isSelected) {
        newNames = prev.serviceNames.filter((n: any) => n !== svc.name);
      } else {
        newNames = [...prev.serviceNames, svc.name];
      }
      return { ...prev, serviceNames: newNames };
    });
  };

  const handlePickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
      base64: true,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      const uri = (Platform.OS === "web" && asset.base64) ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
      setForm((f) => ({ ...f, avatarUri: uri }));
    }
  };

  const handlePickCover = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.85,
      base64: true,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      const uri = (Platform.OS === "web" && asset.base64) ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
      setForm((f) => ({ ...f, coverUri: uri }));
    }
  };

  const handlePickGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled) {
      const uri = (Platform.OS === "web" && result.assets[0].base64) 
        ? `data:image/jpeg;base64,${result.assets[0].base64}` 
        : result.assets[0].uri;
      setForm((f) => ({
        ...f,
        gallery: [...(f.gallery ?? []), uri].slice(0, 8),
      }));
    }
  };

  const removeGalleryImage = (idx: number) => {
    setForm((f) => ({
      ...f,
      gallery: (f.gallery ?? []).filter((_, i) => i !== idx),
    }));
  };

  const activeCount = providers.filter((p) => p.isActive).length;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
          onPress={() => router.back()}
          hitSlop={8}
        >
          <MaterialIcons name="arrow-back" size={22} color="#374151" />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Prestadores</Text>
          <Text style={styles.headerSub}>{providers.length} total · {activeCount} ativos</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.8, transform: [{ scale: 0.96 }] }]}
          onPress={openCreate}
        >
          <MaterialIcons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Novo</Text>
        </Pressable>
      </View>

      {/* ── Barra de busca ── */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={18} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar prestador ou serviço..."
            placeholderTextColor="#94A3B8"
            value={searchText}
            onChangeText={setSearchText}
            returnKeyType="search"
          />
          {searchText.length > 0 && (
            <Pressable onPress={() => setSearchText("")} hitSlop={8}>
              <MaterialIcons name="close" size={16} color="#94A3B8" />
            </Pressable>
          )}
        </View>
      </View>

      {/* ── Lista ── */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#25D366" />
          <Text style={styles.loadingText}>Carregando prestadores...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ProviderCard
              item={item}
              onEdit={() => openEdit(item)}
              onDelete={() => handleDelete(item)}
              onToggle={() => handleToggle(item)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            filtered.length > 0 ? (
              <Text style={styles.listCount}>
                {filtered.length} prestador{filtered.length !== 1 ? "es" : ""}
                {searchText ? ` para "${searchText}"` : ""}
              </Text>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconBox}>
                <MaterialIcons name="person-add" size={40} color="#CBD5E1" />
              </View>
              <Text style={styles.emptyTitle}>
                {searchText ? "Nenhum resultado" : "Nenhum prestador cadastrado"}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchText
                  ? `Sem resultados para "${searchText}"`
                  : 'Toque em "+ Novo" para adicionar o primeiro prestador.'}
              </Text>
            </View>
          }
        />
      )}

      {/* ── Modal criar/editar ── */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {editingProvider ? "Editar Prestador" : "Novo Prestador"}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {editingProvider ? "Atualize as informações abaixo" : "Preencha os dados do prestador"}
                </Text>
              </View>
              <Pressable
                style={({ pressed }) => [styles.modalCloseBtn, pressed && { opacity: 0.6 }]}
                onPress={() => setModalVisible(false)}
                hitSlop={8}
              >
                <MaterialIcons name="close" size={20} color="#6B7280" />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.modalScrollContent}
            >
              {/* Foto */}
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Foto do Prestador</Text>
                <Pressable
                  style={({ pressed }) => [styles.avatarPickerBtn, pressed && { opacity: 0.8 }]}
                  onPress={handlePickAvatar}
                >
                  {form.avatarUri ? (
                    <View style={styles.avatarPreviewWrap}>
                      <Image source={{ uri: form.avatarUri }} style={styles.avatarPreview} />
                      <View style={styles.avatarOverlay}>
                        <MaterialIcons name="photo-camera" size={16} color="#FFFFFF" />
                        <Text style={styles.avatarOverlayText}>Trocar</Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <MaterialIcons name="add-a-photo" size={30} color="#94A3B8" />
                      <Text style={styles.avatarPlaceholderText}>Adicionar foto</Text>
                    </View>
                  )}
                </Pressable>
              </View>

              {/* Dados */}
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Dados do Prestador</Text>
                <Text style={styles.fieldLabel}>Nome *</Text>
                <View style={styles.inputWrap}>
                  <MaterialIcons name="person" size={17} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: Pedro Silva"
                    value={form.name}
                    onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
                  />
                </View>

                <Text style={styles.fieldLabel}>WhatsApp</Text>
                <View style={styles.inputWrap}>
                  <MaterialIcons name="phone" size={17} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: 11999998888"
                    value={form.whatsapp}
                    onChangeText={(v) => setForm((f) => ({ ...f, whatsapp: v.replace(/\D/g, "") }))}
                    keyboardType="phone-pad"
                  />
                </View>

                <Text style={styles.fieldLabel}>Endereço (bairro/cidade)</Text>
                <View style={styles.inputWrap}>
                  <MaterialIcons name="place" size={17} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: Centro, São Paulo - SP"
                    value={form.address}
                    onChangeText={(v) => setForm((f) => ({ ...f, address: v }))}
                  />
                </View>

                <Text style={styles.fieldLabel}>Descrição / Especialidades</Text>
                <View style={[styles.inputWrap, styles.textareaWrap]}>
                  <TextInput
                    style={[styles.input, styles.textarea]}
                    placeholder="Descrição detalhada..."
                    value={form.description}
                    onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
                    multiline
                    numberOfLines={4}
                  />
                </View>
              </View>

              {/* Informações Premium */}
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Informações Premium</Text>
                
                {/* Imagem de Capa (Banner) */}
                <Text style={styles.fieldLabel}>Imagem de Capa (Banner)</Text>
                <Pressable
                  style={({ pressed }) => [styles.coverPickerBtn, pressed && { opacity: 0.8 }]}
                  onPress={handlePickCover}
                >
                  {form.coverUri ? (
                    <View style={styles.coverPreviewWrap}>
                      <Image source={{ uri: form.coverUri }} style={styles.coverPreview} />
                      <View style={styles.coverOverlay}>
                        <MaterialIcons name="photo-camera" size={16} color="#FFFFFF" />
                        <Text style={styles.coverOverlayText}>Trocar Capa</Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.coverPlaceholder}>
                      <MaterialIcons name="add-photo-alternate" size={30} color="#94A3B8" />
                      <Text style={styles.coverPlaceholderText}>Adicionar imagem de capa</Text>
                    </View>
                  )}
                </Pressable>

                {/* Switches/Toggles */}
                <View style={styles.premiumTogglesRow}>
                  <View style={styles.premiumToggleItem}>
                    <Text style={styles.premiumToggleLabel}>Prestador Verificado</Text>
                    <Switch
                      value={form.isVerified}
                      onValueChange={(v) => setForm((f) => ({ ...f, isVerified: v }))}
                      trackColor={{ false: "#E2E8F0", true: "#BBF7D0" }}
                      thumbColor={form.isVerified ? "#15803D" : "#CBD5E1"}
                    />
                  </View>

                  <View style={styles.premiumToggleItem}>
                    <Text style={styles.premiumToggleLabel}>Online Agora</Text>
                    <Switch
                      value={form.onlineStatus}
                      onValueChange={(v) => setForm((f) => ({ ...f, onlineStatus: v }))}
                      trackColor={{ false: "#E2E8F0", true: "#BBF7D0" }}
                      thumbColor={form.onlineStatus ? "#25D366" : "#CBD5E1"}
                    />
                  </View>
                </View>

                {/* Métricas e Selos */}
                <Text style={styles.fieldLabel}>Tempo de Resposta</Text>
                <View style={styles.inputWrap}>
                  <MaterialIcons name="speed" size={17} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: em até 15 min"
                    value={form.responseTime}
                    onChangeText={(v) => setForm((f) => ({ ...f, responseTime: v }))}
                  />
                </View>

                <Text style={styles.fieldLabel}>Clientes Atendidos</Text>
                <View style={styles.inputWrap}>
                  <MaterialIcons name="people" size={17} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: 120"
                    keyboardType="numeric"
                    value={form.clientsServed !== undefined ? String(form.clientsServed) : ""}
                    onChangeText={(v) => setForm((f) => ({ ...f, clientsServed: v ? Number(v.replace(/\D/g, "")) : undefined }))}
                  />
                </View>

                <Text style={styles.fieldLabel}>Ano de Fundação</Text>
                <View style={styles.inputWrap}>
                  <MaterialIcons name="event" size={17} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: 2020"
                    keyboardType="numeric"
                    value={form.foundedYear !== undefined ? String(form.foundedYear) : ""}
                    onChangeText={(v) => setForm((f) => ({ ...f, foundedYear: v ? Number(v.replace(/\D/g, "")) : undefined }))}
                  />
                </View>

                <Text style={styles.fieldLabel}>Selo de Destaque / Ranking</Text>
                <View style={styles.inputWrap}>
                  <MaterialIcons name="emoji-events" size={17} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: Top 3 em Streaming"
                    value={form.topBadge}
                    onChangeText={(v) => setForm((f) => ({ ...f, topBadge: v }))}
                  />
                </View>

                <Text style={styles.fieldLabel}>Serviços Populares (separados por vírgula)</Text>
                <View style={styles.inputWrap}>
                  <MaterialIcons name="star-outline" size={17} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: Vazamentos, Desentupimento"
                    value={form.popularServices}
                    onChangeText={(v) => setForm((f) => ({ ...f, popularServices: v }))}
                  />
                </View>

                <Text style={styles.fieldLabel}>Tags Personalizadas (separados por vírgula)</Text>
                <View style={styles.inputWrap}>
                  <MaterialIcons name="label-outline" size={17} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: Atendimento domicílio, Preço justo $$"
                    value={form.tags}
                    onChangeText={(v) => setForm((f) => ({ ...f, tags: v }))}
                  />
                </View>

                {/* Horários de Funcionamento */}
                <Text style={styles.fieldLabel}>Horário Seg a Sex</Text>
                <View style={styles.inputWrap}>
                  <MaterialIcons name="schedule" size={17} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: 08:00 - 18:00"
                    value={form.workingHoursWeekday}
                    onChangeText={(v) => setForm((f) => ({ ...f, workingHoursWeekday: v }))}
                  />
                </View>

                <Text style={styles.fieldLabel}>Horário Sábado</Text>
                <View style={styles.inputWrap}>
                  <MaterialIcons name="schedule" size={17} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: 08:00 - 12:00"
                    value={form.workingHoursSaturday}
                    onChangeText={(v) => setForm((f) => ({ ...f, workingHoursSaturday: v }))}
                  />
                </View>
              </View>

              {/* Especialidades */}
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Serviços / Especialidades</Text>
                <Pressable
                  style={({ pressed }) => [
                    styles.servicePickerBtn,
                    showServicePicker && styles.servicePickerBtnOpen,
                    pressed && { opacity: 0.85 },
                  ]}
                  onPress={() => setShowServicePicker((v) => !v)}
                >
                  <MaterialIcons name="category" size={17} color="#94A3B8" />
                  <Text style={styles.servicePickerBtnText} numberOfLines={1}>
                    {Object.values(selectedServicesMap).filter(Boolean).length > 0 
                      ? `${Object.values(selectedServicesMap).filter(Boolean).length} selecionados`
                      : "Selecionar especialidades..."}
                  </Text>
                  <MaterialIcons
                    name={showServicePicker ? "expand-less" : "expand-more"}
                    size={20}
                    color="#94A3B8"
                  />
                </Pressable>

                {showServicePicker && (
                  <View style={styles.serviceList}>
                    <View style={styles.serviceSearchBox}>
                      <MaterialIcons name="search" size={16} color="#94A3B8" />
                      <TextInput
                        style={styles.serviceSearchInput}
                        placeholder="Buscar especialidade..."
                        value={serviceSearchQuery}
                        onChangeText={setServiceSearchQuery}
                      />
                    </View>

                    {filteredServices.map((svc) => {
                      const isSelected = !!selectedServicesMap[svc.id];
                      return (
                        <Pressable
                          key={svc.id}
                          style={({ pressed }) => [
                            styles.serviceItem, 
                            pressed && { backgroundColor: "#F0FDF4" },
                            isSelected && { 
                              backgroundColor: "#DCFCE7",
                              borderLeftWidth: 4,
                              borderLeftColor: "#25D366"
                            }
                          ]}
                          onPress={() => toggleServiceSelection(svc)}
                          hitSlop={8}
                        >
                          <View style={styles.serviceItemInfo}>
                            <Text style={[
                              styles.serviceItemName, 
                              isSelected && { color: "#15803D", fontWeight: "700" }
                            ]}>
                              {svc.name}
                            </Text>
                            <Text style={styles.serviceItemCat}>{svc.subcategoryName || svc.category}</Text>
                          </View>
                          <MaterialIcons 
                            name={isSelected ? "check-circle" : "add-circle-outline"} 
                            size={20} 
                            color={isSelected ? "#25D366" : "#CBD5E1"} 
                          />
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* Galeria */}
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Galeria ({(form.gallery ?? []).length}/8)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryRow}>
                  {(form.gallery ?? []).map((uri, idx) => (
                    <View key={idx} style={styles.galleryThumb}>
                      <Image source={{ uri }} style={styles.galleryThumbImg} />
                      <Pressable style={styles.galleryRemoveBtn} onPress={() => removeGalleryImage(idx)}>
                        <MaterialIcons name="close" size={12} color="#FFFFFF" />
                      </Pressable>
                    </View>
                  ))}
                  {(form.gallery ?? []).length < 8 && (
                    <Pressable style={styles.galleryAddBtn} onPress={handlePickGallery}>
                      <MaterialIcons name="add-photo-alternate" size={26} color="#94A3B8" />
                    </Pressable>
                  )}
                </ScrollView>
              </View>

              {/* Configurações */}
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Configurações</Text>
                <View style={styles.toggleCard}>
                  <View style={styles.toggleCardText}>
                    <Text style={styles.toggleCardTitle}>Prestador ativo</Text>
                  </View>
                  <Switch
                    value={form.isActive}
                    onValueChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
                    trackColor={{ false: "#E2E8F0", true: "#BBF7D0" }}
                    thumbColor={form.isActive ? "#25D366" : "#CBD5E1"}
                  />
                </View>
              </View>

              {/* Botões */}
              <View style={styles.modalActions}>
                <Pressable style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </Pressable>
                <Pressable 
                  style={[styles.saveBtn, saving && { opacity: 0.6 }]} 
                  onPress={handleSave} 
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.saveBtnText}>
                      {editingProvider ? "Salvar" : "Cadastrar"}
                    </Text>
                  )}
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    gap: 12,
  },
  iconBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center" },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  headerSub: { fontSize: 12, color: "#64748B" },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#25D366", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9 },
  addBtnText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
  searchContainer: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#FFFFFF" },
  searchBar: { flexDirection: "row", alignItems: "center", backgroundColor: "#F8FAFC", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1.5, borderColor: "#E2E8F0", gap: 8 },
  searchInput: { flex: 1, fontSize: 14, color: "#0F172A" },
  loadingBox: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { fontSize: 14, color: "#64748B", marginTop: 8 },
  listContent: { padding: 16, gap: 12 },
  listCount: { fontSize: 13, color: "#64748B", marginVertical: 8 },
  emptyState: { alignItems: "center", justifyContent: "center", padding: 32 },
  emptyIconBox: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A", marginBottom: 4 },
  emptySubtitle: { fontSize: 14, color: "#64748B", textAlign: "center" },
  inputIcon: { marginRight: 8 },
  card: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "#F1F5F9", gap: 12 },
  cardInactive: { opacity: 0.55 },
  cardMain: { flexDirection: "row", gap: 12 },
  cardAvatar: { width: 54, height: 54, borderRadius: 27 },
  cardAvatarFallback: { backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center" },
  cardInfo: { flex: 1, gap: 5 },
  cardNameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardName: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
  inactivePill: { backgroundColor: "#FEF2F2", borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  inactivePillText: { fontSize: 10, fontWeight: "700", color: "#DC2626" },
  servicePill: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#EFF6FF", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start" },
  servicePillText: { fontSize: 11, fontWeight: "600", color: "#2563EB" },
  cardMetaRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  cardMetaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  cardMetaText: { fontSize: 12, color: "#64748B" },
  cardActions: { flexDirection: "row", gap: 8 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  actionToggle: { borderColor: "#E2E8F0" },
  actionEdit: { borderColor: "#BFDBFE" },
  actionDelete: { borderColor: "#FECACA" },
  actionBtnText: { fontSize: 12, color: "#64748B", fontWeight: "600" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: "93%" },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#E2E8F0", alignSelf: "center", marginTop: 14, marginBottom: 4 },
  modalHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  modalSubtitle: { fontSize: 13, color: "#64748B" },
  modalCloseBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center" },
  modalScrollContent: { paddingHorizontal: 20, paddingVertical: 16 },
  formSection: { marginTop: 20, backgroundColor: "#F8FAFC", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#E2E8F0" },
  sectionTitle: { fontSize: 12, fontWeight: "700", color: "#64748B", textTransform: "uppercase", marginBottom: 12 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6, marginTop: 12 },
  inputWrap: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", borderWidth: 1.5, borderColor: "#E2E8F0", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  input: { flex: 1, fontSize: 14, color: "#0F172A" },
  textareaWrap: { alignItems: "flex-start" },
  textarea: { minHeight: 80 },
  avatarPickerBtn: { alignSelf: "center", width: 90, height: 90, borderRadius: 45, overflow: "hidden", backgroundColor: "#F1F5F9", borderWidth: 2, borderColor: "#E2E8F0", borderStyle: "dashed", alignItems: "center", justifyContent: "center" },
  avatarPreviewWrap: { width: 90, height: 90 },
  avatarPreview: { width: 90, height: 90 },
  avatarOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center", paddingVertical: 5 },
  avatarOverlayText: { fontSize: 10, color: "#FFFFFF" },
  avatarPlaceholder: { alignItems: "center" },
  avatarPlaceholderText: { fontSize: 11, color: "#94A3B8" },
  coverPickerBtn: { alignSelf: "stretch", height: 120, borderRadius: 12, overflow: "hidden", backgroundColor: "#F1F5F9", borderWidth: 2, borderColor: "#E2E8F0", borderStyle: "dashed", alignItems: "center", justifyContent: "center", marginTop: 6, marginBottom: 12 },
  coverPreviewWrap: { width: "100%", height: "100%", position: "relative" },
  coverPreview: { width: "100%", height: "100%", resizeMode: "cover" },
  coverOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center", paddingVertical: 6 },
  coverOverlayText: { fontSize: 11, color: "#FFFFFF", fontWeight: "600" },
  coverPlaceholder: { alignItems: "center" },
  coverPlaceholderText: { fontSize: 12, color: "#94A3B8", marginTop: 4 },
  premiumTogglesRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 12, marginBottom: 6, gap: 12 },
  premiumToggleItem: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  premiumToggleLabel: { fontSize: 12, fontWeight: "600", color: "#374151" },
  servicePickerBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FFFFFF", borderWidth: 1.5, borderColor: "#E2E8F0", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  servicePickerBtnOpen: { borderColor: "#25D366" },
  servicePickerBtnText: { flex: 1, fontSize: 14, color: "#94A3B8" },
  serviceList: { backgroundColor: "#FFFFFF", borderWidth: 1.5, borderColor: "#25D366", borderTopWidth: 0, borderRadius: 12, marginTop: -5, overflow: "hidden" },
  serviceSearchBox: { flexDirection: "row", alignItems: "center", gap: 8, margin: 10, backgroundColor: "#F8FAFC", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderColor: "#E2E8F0" },
  serviceSearchInput: { flex: 1, fontSize: 13, color: "#0F172A" },
  serviceItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: "#F1F5F9" },
  serviceItemInfo: { flex: 1 },
  serviceItemName: { fontSize: 14, fontWeight: "600", color: "#0F172A" },
  serviceItemCat: { fontSize: 12, color: "#64748B" },
  galleryRow: { flexDirection: "row", gap: 10 },
  galleryThumb: { width: 60, height: 60, borderRadius: 8, overflow: "hidden", position: "relative" },
  galleryThumbImg: { width: 60, height: 60 },
  galleryRemoveBtn: { position: "absolute", top: 2, right: 2, backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 10, width: 18, height: 18, alignItems: "center", justifyContent: "center" },
  galleryAddBtn: { width: 60, height: 60, borderRadius: 8, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#E2E8F0", borderStyle: "dashed" },
  toggleCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  toggleCardText: { flex: 1 },
  toggleCardTitle: { fontSize: 14, fontWeight: "600", color: "#374151" },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 24 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: "#F1F5F9", alignItems: "center" },
  cancelBtnText: { fontSize: 14, fontWeight: "600", color: "#64748B" },
  saveBtn: { flex: 2, paddingVertical: 12, borderRadius: 12, backgroundColor: "#25D366", alignItems: "center" },
  saveBtnText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
});
