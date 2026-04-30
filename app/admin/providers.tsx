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

import {
  adminProvidersDB,
  type AdminProvider,
  type CreateAdminProviderInput,
} from "@/lib/admin-providers-db";
import { adminDB, type Service as AdminService } from "@/lib/admin-database";

// ─── Formulário vazio ─────────────────────────────────────────────────────────
const EMPTY_FORM: CreateAdminProviderInput = {
  name: "",
  serviceId: "",
  serviceName: "",
  subcategoryId: "",
  subcategoryName: "",
  whatsapp: "",
  description: "",
  address: "",
  avatarUri: "",
  gallery: [],
  rating: undefined,
  ratingCount: undefined,
  isActive: true,
};

// ─── Card de Prestador ────────────────────────────────────────────────────────
function ProviderCard({
  item,
  onEdit,
  onDelete,
  onToggle,
}: {
  item: AdminProvider;
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

// ─── Tela Principal ───────────────────────────────────────────────────────────
export default function AdminProvidersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [providers, setProviders] = useState<AdminProvider[]>([]);
  const [services, setServices] = useState<AdminService[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingProvider, setEditingProvider] = useState<AdminProvider | null>(null);
  const [form, setForm] = useState<CreateAdminProviderInput>({ ...EMPTY_FORM });

  const [searchText, setSearchText] = useState("");
  const [showServicePicker, setShowServicePicker] = useState(false);
  const [serviceSearchQuery, setServiceSearchQuery] = useState("");

  const filteredServices = useMemo(() => {
    if (!serviceSearchQuery.trim()) return services;
    const q = serviceSearchQuery.toLowerCase();
    return services.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        (s.subcategoryName ?? "").toLowerCase().includes(q)
    );
  }, [services, serviceSearchQuery]);

  const loadData = useCallback(async () => {
    setLoading(true);
    adminProvidersDB.resetCache();
    const [allProviders, allServices] = await Promise.all([
      adminProvidersDB.getAll(),
      adminDB.getAllServices(),
    ]);
    setProviders(allProviders);
    setServices(allServices.filter((s) => s.isActive));
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = useMemo(() => {
    if (!searchText.trim()) return providers;
    const q = searchText.toLowerCase();
    return providers.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.serviceName.toLowerCase().includes(q) ||
        (p.address ?? "").toLowerCase().includes(q)
    );
  }, [providers, searchText]);

  const openCreate = () => {
    setEditingProvider(null);
    setForm({ ...EMPTY_FORM });
    setShowServicePicker(false);
    setServiceSearchQuery("");
    setModalVisible(true);
  };

  const openEdit = (p: AdminProvider) => {
    setEditingProvider(p);
    setForm({
      name: p.name,
      serviceId: p.serviceId,
      serviceName: p.serviceName,
      subcategoryId: p.subcategoryId ?? "",
      subcategoryName: p.subcategoryName ?? "",
      whatsapp: p.whatsapp ?? "",
      description: p.description ?? "",
      address: p.address ?? "",
      avatarUri: p.avatarUri ?? "",
      gallery: p.gallery ?? [],
      rating: p.rating,
      ratingCount: p.ratingCount,
      isActive: p.isActive,
    });
    setShowServicePicker(false);
    setServiceSearchQuery("");
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert("Campo obrigatório", "Digite o nome do prestador.");
      return;
    }
    if (!form.serviceId) {
      Alert.alert("Campo obrigatório", "Selecione o serviço vinculado.");
      return;
    }
    setSaving(true);
    try {
      if (editingProvider) {
        await adminProvidersDB.update(editingProvider.id, form);
      } else {
        await adminProvidersDB.create(form);
      }
      await loadData();
      setModalVisible(false);
    } catch {
      Alert.alert("Erro", "Não foi possível salvar o prestador.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (p: AdminProvider) => {
    Alert.alert(
      "Excluir prestador",
      `Deseja excluir "${p.name}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            await adminProvidersDB.delete(p.id);
            await loadData();
          },
        },
      ]
    );
  };

  const handleToggle = async (p: AdminProvider) => {
    await adminProvidersDB.toggleActive(p.id);
    await loadData();
  };

  const handlePickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled) {
      setForm((f) => ({ ...f, avatarUri: result.assets[0].uri }));
    }
  };

  const handlePickGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });
    if (!result.canceled) {
      setForm((f) => ({
        ...f,
        gallery: [...(f.gallery ?? []), result.assets[0].uri].slice(0, 8),
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
            {/* Handle */}
            <View style={styles.modalHandle} />

            {/* Cabeçalho */}
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
              {/* ── Seção: Foto ── */}
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

              {/* ── Seção: Dados do Prestador ── */}
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Dados do Prestador</Text>

                <Text style={styles.fieldLabel}>Nome *</Text>
                <View style={styles.inputWrap}>
                  <MaterialIcons name="person" size={17} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: Studio Ink Tattoo"
                    placeholderTextColor="#94A3B8"
                    value={form.name}
                    onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
                    maxLength={80}
                    returnKeyType="next"
                  />
                </View>

                <Text style={styles.fieldLabel}>WhatsApp</Text>
                <View style={styles.inputWrap}>
                  <MaterialIcons name="phone" size={17} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: 11999998888"
                    placeholderTextColor="#94A3B8"
                    value={form.whatsapp}
                    onChangeText={(v) => setForm((f) => ({ ...f, whatsapp: v.replace(/\D/g, "") }))}
                    keyboardType="phone-pad"
                    maxLength={15}
                    returnKeyType="next"
                  />
                </View>

                <Text style={styles.fieldLabel}>Endereço (bairro/cidade)</Text>
                <View style={styles.inputWrap}>
                  <MaterialIcons name="place" size={17} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: Centro, São Paulo - SP"
                    placeholderTextColor="#94A3B8"
                    value={form.address}
                    onChangeText={(v) => setForm((f) => ({ ...f, address: v }))}
                    maxLength={120}
                    returnKeyType="next"
                  />
                </View>

                <Text style={styles.fieldLabel}>Descrição / Especialidades</Text>
                <View style={[styles.inputWrap, styles.textareaWrap]}>
                  <TextInput
                    style={[styles.input, styles.textarea]}
                    placeholder="Ex: Especialista em tatuagens realistas. 10 anos de experiência."
                    placeholderTextColor="#94A3B8"
                    value={form.description}
                    onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
                    multiline
                    numberOfLines={4}
                    maxLength={500}
                    textAlignVertical="top"
                  />
                </View>
              </View>

              {/* ── Seção: Serviço Vinculado ── */}
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Serviço Vinculado</Text>

                {form.serviceId ? (
                  <View style={styles.serviceSelected}>
                    <View style={styles.serviceSelectedIcon}>
                      <MaterialIcons name="check-circle" size={22} color="#16A34A" />
                    </View>
                    <Text style={styles.serviceSelectedName} numberOfLines={1} ellipsizeMode="tail">
                      {form.serviceName}
                    </Text>
                    <Pressable
                      style={({ pressed }) => [styles.changeServiceBtn, pressed && { opacity: 0.7 }]}
                      onPress={() => {
                        setForm((f) => ({ ...f, serviceId: "", serviceName: "", subcategoryId: "", subcategoryName: "" }));
                        setServiceSearchQuery("");
                        setShowServicePicker(true);
                      }}
                    >
                      <MaterialIcons name="swap-horiz" size={15} color="#2563EB" />
                      <Text style={styles.changeServiceText}>Trocar</Text>
                    </Pressable>
                  </View>
                ) : (
                  <Pressable
                    style={({ pressed }) => [
                      styles.servicePickerBtn,
                      showServicePicker && styles.servicePickerBtnOpen,
                      pressed && { opacity: 0.85 },
                    ]}
                    onPress={() => setShowServicePicker((v) => !v)}
                  >
                    <MaterialIcons name="category" size={17} color="#94A3B8" />
                    <Text style={styles.servicePickerBtnText}>Selecionar serviço...</Text>
                    <MaterialIcons
                      name={showServicePicker ? "expand-less" : "expand-more"}
                      size={20}
                      color="#94A3B8"
                    />
                  </Pressable>
                )}

                {/* Lista inline de serviços */}
                {showServicePicker && !form.serviceId && (
                  <View style={styles.serviceList}>
                    <View style={styles.serviceSearchBox}>
                      <MaterialIcons name="search" size={16} color="#94A3B8" />
                      <TextInput
                        style={styles.serviceSearchInput}
                        placeholder="Buscar serviço..."
                        placeholderTextColor="#94A3B8"
                        value={serviceSearchQuery}
                        onChangeText={setServiceSearchQuery}
                        autoCorrect={false}
                      />
                      {serviceSearchQuery.length > 0 && (
                        <Pressable onPress={() => setServiceSearchQuery("")} hitSlop={8}>
                          <MaterialIcons name="close" size={14} color="#94A3B8" />
                        </Pressable>
                      )}
                    </View>

                    {filteredServices.length === 0 ? (
                      <View style={styles.serviceEmptyRow}>
                        <MaterialIcons name="info-outline" size={18} color="#94A3B8" />
                        <Text style={styles.serviceEmptyText}>
                          {services.length === 0
                            ? "Nenhum serviço cadastrado. Crie um serviço primeiro."
                            : "Nenhum serviço encontrado."}
                        </Text>
                      </View>
                    ) : (
                      filteredServices.map((svc) => (
                        <Pressable
                          key={svc.id}
                          style={({ pressed }) => [styles.serviceItem, pressed && { backgroundColor: "#F0FDF4" }]}
                          onPress={() => {
                            setForm((f) => ({
                              ...f,
                              serviceId: svc.id,
                              serviceName: svc.name,
                              subcategoryId: svc.subcategoryId ?? "",
                              subcategoryName: svc.subcategoryName ?? svc.name,
                            }));
                            setShowServicePicker(false);
                            setServiceSearchQuery("");
                          }}
                        >
                          {svc.imageUri ? (
                            <Image source={{ uri: svc.imageUri }} style={styles.serviceItemImg} />
                          ) : (
                            <View style={[styles.serviceItemImg, styles.serviceItemImgFallback]}>
                              <MaterialIcons name="build" size={16} color="#94A3B8" />
                            </View>
                          )}
                          <View style={styles.serviceItemInfo}>
                            <Text style={styles.serviceItemName} numberOfLines={1} ellipsizeMode="tail">
                              {svc.name}
                            </Text>
                            <Text style={styles.serviceItemCat} numberOfLines={1}>
                              {svc.subcategoryName || svc.category}
                            </Text>
                          </View>
                          <MaterialIcons name="chevron-right" size={18} color="#CBD5E1" />
                        </Pressable>
                      ))
                    )}
                  </View>
                )}
              </View>

              {/* ── Seção: Galeria de Fotos ── */}
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>
                  Galeria de Fotos ({(form.gallery ?? []).length}/8)
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.galleryRow}
                >
                  {(form.gallery ?? []).map((uri, idx) => (
                    <View key={idx} style={styles.galleryThumb}>
                      <Image source={{ uri }} style={styles.galleryThumbImg} />
                      <Pressable
                        style={styles.galleryRemoveBtn}
                        onPress={() => removeGalleryImage(idx)}
                        hitSlop={4}
                      >
                        <MaterialIcons name="close" size={12} color="#FFFFFF" />
                      </Pressable>
                    </View>
                  ))}
                  {(form.gallery ?? []).length < 8 && (
                    <Pressable
                      style={({ pressed }) => [styles.galleryAddBtn, pressed && { opacity: 0.7 }]}
                      onPress={handlePickGallery}
                    >
                      <MaterialIcons name="add-photo-alternate" size={26} color="#94A3B8" />
                      <Text style={styles.galleryAddText}>Adicionar</Text>
                    </Pressable>
                  )}
                </ScrollView>
              </View>

              {/* ── Seção: Configurações ── */}
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Configurações</Text>
                <View style={styles.toggleCard}>
                  <View style={styles.toggleCardLeft}>
                    <View style={[styles.toggleCardIcon, form.isActive && styles.toggleCardIconOn]}>
                      <MaterialIcons name="person" size={18} color={form.isActive ? "#15803D" : "#94A3B8"} />
                    </View>
                    <View style={styles.toggleCardText}>
                      <Text style={styles.toggleCardTitle}>Prestador ativo</Text>
                      <Text style={styles.toggleCardSub}>
                        {form.isActive ? "Visível na listagem" : "Oculto da listagem"}
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={form.isActive}
                    onValueChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
                    trackColor={{ false: "#E2E8F0", true: "#BBF7D0" }}
                    thumbColor={form.isActive ? "#25D366" : "#CBD5E1"}
                  />
                </View>
              </View>

              {/* ── Botões de ação ── */}
              <View style={styles.modalActions}>
                <Pressable
                  style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.7 }]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.saveBtn,
                    pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                    saving && { opacity: 0.6 },
                  ]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <MaterialIcons name={editingProvider ? "check" : "add"} size={18} color="#FFFFFF" />
                      <Text style={styles.saveBtnText}>
                        {editingProvider ? "Salvar Alterações" : "Cadastrar Prestador"}
                      </Text>
                    </>
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

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8FAFC" },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    gap: 12,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
      android: { elevation: 2 },
    }),
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A", letterSpacing: -0.3 },
  headerSub: { fontSize: 12, color: "#64748B", marginTop: 1 },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#25D366",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  addBtnText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },

  // Search
  searchContainer: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 10 : 8,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: "#0F172A", padding: 0 },

  // Loading / Empty
  loadingBox: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 14, color: "#64748B" },
  listContent: { padding: 16, gap: 12, paddingBottom: 40 },
  listCount: { fontSize: 12, color: "#64748B", marginBottom: 4 },
  emptyState: { alignItems: "center", paddingVertical: 64, paddingHorizontal: 32, gap: 10 },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: "#374151" },
  emptySubtitle: { fontSize: 13, color: "#94A3B8", textAlign: "center", lineHeight: 20 },

  // Card
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    gap: 12,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },
  cardInactive: { opacity: 0.55 },
  cardMain: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  cardAvatar: { width: 54, height: 54, borderRadius: 27 },
  cardAvatarFallback: {
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  cardInfo: { flex: 1, gap: 5 },
  cardNameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardName: { fontSize: 15, fontWeight: "700", color: "#0F172A", flex: 1 },
  inactivePill: {
    backgroundColor: "#FEF2F2",
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  inactivePillText: { fontSize: 10, fontWeight: "700", color: "#DC2626" },
  servicePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EFF6FF",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: "flex-start",
  },
  servicePillText: { fontSize: 11, fontWeight: "600", color: "#2563EB", maxWidth: 200 },
  cardMetaRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  cardMetaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  cardMetaText: { fontSize: 12, color: "#64748B", maxWidth: 140 },
  cardActions: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionToggle: { borderColor: "#E2E8F0", backgroundColor: "#F8FAFC" },
  actionEdit: { borderColor: "#BFDBFE", backgroundColor: "#EFF6FF" },
  actionDelete: { borderColor: "#FECACA", backgroundColor: "#FEF2F2" },
  actionBtnText: { fontSize: 12, color: "#64748B", fontWeight: "600" },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "93%",
    paddingBottom: 24,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E2E8F0",
    alignSelf: "center",
    marginTop: 14,
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  modalSubtitle: { fontSize: 13, color: "#64748B", marginTop: 2 },
  modalCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  modalScrollContent: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 16 },

  // Form sections
  formSection: {
    marginTop: 20,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
    marginTop: 12,
  },

  // Inputs
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    gap: 8,
  },
  inputIcon: {},
  input: { flex: 1, fontSize: 14, color: "#0F172A", padding: 0 },
  textareaWrap: { alignItems: "flex-start", paddingTop: 12 },
  textarea: { minHeight: 90, textAlignVertical: "top" },

  // Avatar picker
  avatarPickerBtn: {
    alignSelf: "center",
    width: 90,
    height: 90,
    borderRadius: 45,
    overflow: "hidden",
    backgroundColor: "#F1F5F9",
    borderWidth: 2,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarPreviewWrap: { width: 90, height: 90, position: "relative" },
  avatarPreview: { width: 90, height: 90 },
  avatarOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 4,
    paddingVertical: 5,
  },
  avatarOverlayText: { fontSize: 10, color: "#FFFFFF", fontWeight: "600" },
  avatarPlaceholder: { alignItems: "center", gap: 4 },
  avatarPlaceholderText: { fontSize: 11, color: "#94A3B8" },

  // Service picker
  serviceSelected: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#F0FDF4",
    borderWidth: 1.5,
    borderColor: "#86EFAC",
    borderRadius: 12,
    padding: 12,
  },
  serviceSelectedIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
  },
  serviceSelectedName: { flex: 1, fontSize: 14, fontWeight: "600", color: "#0F172A" },
  changeServiceBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EFF6FF",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  changeServiceText: { fontSize: 12, fontWeight: "600", color: "#2563EB" },
  servicePickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
  },
  servicePickerBtnOpen: { borderColor: "#25D366", borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  servicePickerBtnText: { flex: 1, fontSize: 14, color: "#94A3B8" },
  serviceList: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#25D366",
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    overflow: "hidden",
  },
  serviceSearchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    margin: 10,
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  serviceSearchInput: { flex: 1, fontSize: 13, color: "#0F172A", padding: 0 },
  serviceEmptyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 16,
  },
  serviceEmptyText: { fontSize: 13, color: "#94A3B8", flex: 1 },
  serviceItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  serviceItemImg: { width: 38, height: 38, borderRadius: 8 },
  serviceItemImgFallback: {
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  serviceItemInfo: { flex: 1 },
  serviceItemName: { fontSize: 14, fontWeight: "600", color: "#0F172A" },
  serviceItemCat: { fontSize: 12, color: "#64748B", marginTop: 1 },

  // Gallery
  galleryRow: { flexDirection: "row", gap: 8 },
  galleryThumb: { width: 76, height: 76, borderRadius: 10, overflow: "hidden", position: "relative" },
  galleryThumbImg: { width: 76, height: 76 },
  galleryRemoveBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 8,
    padding: 3,
  },
  galleryAddBtn: {
    width: 76,
    height: 76,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: "#FFFFFF",
  },
  galleryAddText: { fontSize: 10, color: "#94A3B8" },

  // Toggle card
  toggleCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 12,
  },
  toggleCardLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  toggleCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  toggleCardIconOn: { backgroundColor: "#DCFCE7" },
  toggleCardText: { flex: 1 },
  toggleCardTitle: { fontSize: 14, fontWeight: "600", color: "#0F172A" },
  toggleCardSub: { fontSize: 12, color: "#64748B", marginTop: 2 },

  // Modal actions
  modalActions: { flexDirection: "row", gap: 10, marginTop: 24 },
  cancelBtn: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cancelBtnText: { fontSize: 15, fontWeight: "600", color: "#374151" },
  saveBtn: {
    flex: 2,
    backgroundColor: "#25D366",
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    ...Platform.select({
      ios: { shadowColor: "#25D366", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
      android: { elevation: 4 },
    }),
  },
  saveBtnText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
});
