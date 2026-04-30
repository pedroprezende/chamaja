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
import { subcategoriesByCategory } from "@/data/mock";

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

  // ── Carregar dados ──────────────────────────────────────────────────────────
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

  // ── Filtro de busca ─────────────────────────────────────────────────────────
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

  // ── Ações ───────────────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditingProvider(null);
    setForm({ ...EMPTY_FORM });
    setShowServicePicker(false);
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
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert("Erro", "Digite o nome do prestador.");
      return;
    }
    if (!form.serviceId) {
      Alert.alert("Erro", "Selecione o serviço vinculado.");
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
      `Tem certeza que deseja excluir "${p.name}"?`,
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

  // ── Render item ─────────────────────────────────────────────────────────────
  const renderItem = ({ item }: { item: AdminProvider }) => (
    <View style={[styles.card, !item.isActive && styles.cardInactive]}>
      <View style={styles.cardTop}>
        {item.avatarUri ? (
          <Image source={{ uri: item.avatarUri }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <MaterialIcons name="person" size={28} color="#9CA3AF" />
          </View>
        )}
        <View style={styles.cardInfo}>
          <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.badgeRow}>
            <View style={styles.serviceBadge}>
              <Text style={styles.serviceBadgeText}>{item.serviceName}</Text>
            </View>
            {!item.isActive && (
              <View style={styles.inactiveBadge}>
                <Text style={styles.inactiveBadgeText}>Inativo</Text>
              </View>
            )}
          </View>
          {item.address ? (
            <Text style={styles.cardAddress} numberOfLines={1}>
              <MaterialIcons name="place" size={11} color="#9CA3AF" /> {item.address}
            </Text>
          ) : null}
          {item.whatsapp ? (
            <Text style={styles.cardWhatsapp} numberOfLines={1}>
              <MaterialIcons name="phone" size={11} color="#25D366" /> {item.whatsapp}
            </Text>
          ) : null}
        </View>
      </View>
      <View style={styles.cardActions}>
        <Pressable
          style={({ pressed }) => [styles.actionBtn, styles.actionToggle, pressed && { opacity: 0.7 }]}
          onPress={() => handleToggle(item)}
        >
          <MaterialIcons
            name={item.isActive ? "visibility-off" : "visibility"}
            size={14}
            color="#6B7280"
          />
          <Text style={styles.actionBtnText}>{item.isActive ? "Desativar" : "Ativar"}</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.actionBtn, styles.actionEdit, pressed && { opacity: 0.7 }]}
          onPress={() => openEdit(item)}
        >
          <MaterialIcons name="edit" size={14} color="#3B82F6" />
          <Text style={[styles.actionBtnText, { color: "#3B82F6" }]}>Editar</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.actionBtn, styles.actionDelete, pressed && { opacity: 0.7 }]}
          onPress={() => handleDelete(item)}
        >
          <MaterialIcons name="delete" size={14} color="#EF4444" />
          <Text style={[styles.actionBtnText, { color: "#EF4444" }]}>Excluir</Text>
        </Pressable>
      </View>
    </View>
  );

  // ── JSX ─────────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#111827" />
        </Pressable>
        <Text style={styles.headerTitle}>Prestadores</Text>
        <Pressable
          style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.8 }]}
          onPress={openCreate}
        >
          <MaterialIcons name="add" size={24} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Busca */}
      <View style={styles.searchBar}>
        <MaterialIcons name="search" size={18} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar prestador ou serviço..."
          placeholderTextColor="#9CA3AF"
          value={searchText}
          onChangeText={setSearchText}
          returnKeyType="search"
        />
        {searchText.length > 0 && (
          <Pressable onPress={() => setSearchText("")}>
            <MaterialIcons name="close" size={16} color="#9CA3AF" />
          </Pressable>
        )}
      </View>

      {/* Contador */}
      <View style={styles.countRow}>
        <Text style={styles.countText}>
          {filtered.length} prestador{filtered.length !== 1 ? "es" : ""}
          {providers.filter((p) => p.isActive).length !== providers.length &&
            ` · ${providers.filter((p) => p.isActive).length} ativo${providers.filter((p) => p.isActive).length !== 1 ? "s" : ""}`}
        </Text>
      </View>

      {/* Lista */}
      {loading ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color="#25D366" />
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialIcons name="person-add" size={48} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>
                {searchText ? "Nenhum resultado" : "Nenhum prestador cadastrado"}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchText
                  ? `Sem resultados para "${searchText}"`
                  : "Toque em + para adicionar o primeiro prestador"}
              </Text>
            </View>
          }
        />
      )}

      {/* ── Modal de criação/edição ── */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingProvider ? "Editar prestador" : "Novo prestador"}
              </Text>
              <Pressable
                style={({ pressed }) => [styles.modalClose, pressed && { opacity: 0.6 }]}
                onPress={() => setModalVisible(false)}
              >
                <MaterialIcons name="close" size={24} color="#6B7280" />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>

              {/* Avatar */}
              <Text style={styles.fieldLabel}>Foto do prestador</Text>
              <Pressable
                style={({ pressed }) => [styles.avatarPicker, pressed && { opacity: 0.8 }]}
                onPress={handlePickAvatar}
              >
                {form.avatarUri ? (
                  <>
                    <Image source={{ uri: form.avatarUri }} style={styles.avatarPreview} />
                    <View style={styles.avatarOverlay}>
                      <MaterialIcons name="photo-camera" size={20} color="#FFFFFF" />
                      <Text style={styles.avatarOverlayText}>Trocar foto</Text>
                    </View>
                  </>
                ) : (
                  <View style={styles.avatarPlaceholderPicker}>
                    <MaterialIcons name="add-a-photo" size={32} color="#9CA3AF" />
                    <Text style={styles.avatarPlaceholderText}>Adicionar foto</Text>
                  </View>
                )}
              </Pressable>

              {/* Nome */}
              <Text style={styles.fieldLabel}>Nome *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Studio Ink Tattoo"
                placeholderTextColor="#9CA3AF"
                value={form.name}
                onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
                maxLength={80}
                returnKeyType="next"
              />

              {/* Serviço vinculado */}
              <Text style={styles.fieldLabel}>Serviço vinculado *</Text>
              {form.serviceId ? (
                <View style={styles.selectedServiceCard}>
                  <MaterialIcons name="check-circle" size={16} color="#25D366" />
                  <Text style={styles.selectedServiceText}>{form.serviceName}</Text>
                  <Pressable
                    style={({ pressed }) => [styles.changeServiceBtn, pressed && { opacity: 0.7 }]}
                    onPress={() => {
                      setForm((f) => ({ ...f, serviceId: "", serviceName: "", subcategoryId: "", subcategoryName: "" }));
                      setShowServicePicker(true);
                    }}
                  >
                    <MaterialIcons name="swap-horiz" size={14} color="#6B7280" />
                    <Text style={styles.changeServiceText}>Trocar</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  style={({ pressed }) => [styles.servicePickerBtn, pressed && { opacity: 0.8 }]}
                  onPress={() => setShowServicePicker((v) => !v)}
                >
                  <View style={styles.servicePickerPlaceholder}>
                    <MaterialIcons name="category" size={16} color="#9CA3AF" />
                    <Text style={styles.servicePickerPlaceholderText}>Selecionar serviço</Text>
                  </View>
                  <MaterialIcons
                    name={showServicePicker ? "expand-less" : "expand-more"}
                    size={20}
                    color="#9CA3AF"
                  />
                </Pressable>
              )}

              {/* Lista inline de serviços */}
              {showServicePicker && !form.serviceId && (
                <View style={styles.inlineServiceList}>
                  {services.length === 0 ? (
                    <View style={styles.noServicesMsg}>
                      <MaterialIcons name="info-outline" size={20} color="#9CA3AF" />
                      <Text style={styles.noServicesMsgText}>
                        Nenhum serviço cadastrado. Crie um serviço primeiro.
                      </Text>
                    </View>
                  ) : (
                    services.map((svc) => (
                      <Pressable
                        key={svc.id}
                        style={({ pressed }) => [styles.serviceRow, pressed && { opacity: 0.7 }]}
                        onPress={() => {
                          setForm((f) => ({
                            ...f,
                            serviceId: svc.id,
                            serviceName: svc.name,
                            subcategoryId: svc.subcategoryId ?? "",
                            subcategoryName: svc.subcategoryName ?? svc.name,
                          }));
                          setShowServicePicker(false);
                        }}
                      >
                        {svc.imageUri ? (
                          <Image source={{ uri: svc.imageUri }} style={styles.serviceRowImg} />
                        ) : (
                          <View style={[styles.serviceRowImg, styles.serviceRowImgPlaceholder]}>
                            <MaterialIcons name="build" size={16} color="#9CA3AF" />
                          </View>
                        )}
                        <View style={{ flex: 1 }}>
                          <Text style={styles.serviceRowName}>{svc.name}</Text>
                          <Text style={styles.serviceRowCat}>{svc.subcategoryName || svc.category}</Text>
                        </View>
                      </Pressable>
                    ))
                  )}
                </View>
              )}

              {/* WhatsApp */}
              <Text style={styles.fieldLabel}>WhatsApp</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 11999998888"
                placeholderTextColor="#9CA3AF"
                value={form.whatsapp}
                onChangeText={(v) => setForm((f) => ({ ...f, whatsapp: v.replace(/\D/g, "") }))}
                keyboardType="phone-pad"
                maxLength={15}
                returnKeyType="next"
              />

              {/* Descrição */}
              <Text style={styles.fieldLabel}>Descrição / Especialidades</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                placeholder="Ex: Especialista em tatuagens realistas e blackwork. 10 anos de experiência."
                placeholderTextColor="#9CA3AF"
                value={form.description}
                onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
                multiline
                numberOfLines={4}
                maxLength={500}
              />

              {/* Endereço */}
              <Text style={styles.fieldLabel}>Endereço (bairro/cidade)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Centro, São Paulo - SP"
                placeholderTextColor="#9CA3AF"
                value={form.address}
                onChangeText={(v) => setForm((f) => ({ ...f, address: v }))}
                maxLength={120}
                returnKeyType="next"
              />

              {/* Galeria */}
              <Text style={styles.fieldLabel}>
                Fotos do local ({(form.gallery ?? []).length}/8)
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.galleryScroll}>
                {(form.gallery ?? []).map((uri, idx) => (
                  <View key={idx} style={styles.galleryThumb}>
                    <Image source={{ uri }} style={styles.galleryThumbImg} />
                    <Pressable
                      style={styles.galleryRemoveBtn}
                      onPress={() => removeGalleryImage(idx)}
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
                    <MaterialIcons name="add-photo-alternate" size={28} color="#9CA3AF" />
                    <Text style={styles.galleryAddText}>Adicionar</Text>
                  </Pressable>
                )}
              </ScrollView>

              {/* Ativo */}
              <View style={styles.toggleRow}>
                <View>
                  <Text style={styles.fieldLabel}>Prestador ativo</Text>
                  <Text style={styles.toggleSubtitle}>Exibir na listagem</Text>
                </View>
                <Switch
                  value={form.isActive}
                  onValueChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
                  trackColor={{ false: "#E5E7EB", true: "#86EFAC" }}
                  thumbColor={form.isActive ? "#25D366" : "#9CA3AF"}
                />
              </View>

              {/* Salvar */}
              <Pressable
                style={({ pressed }) => [
                  styles.saveBtn,
                  pressed && { opacity: 0.85 },
                  saving && { opacity: 0.6 },
                ]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>
                    {editingProvider ? "Salvar alterações" : "Cadastrar prestador"}
                  </Text>
                )}
              </Pressable>

              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backBtn: { padding: 4, marginRight: 8 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "700", color: "#111827" },
  addBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "#25D366",
    alignItems: "center", justifyContent: "center",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: "#111827" },
  countRow: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 4 },
  countText: { fontSize: 12, color: "#6B7280" },
  loadingCenter: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 14, color: "#6B7280" },
  emptyState: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: "#374151" },
  emptySubtitle: { fontSize: 13, color: "#9CA3AF", textAlign: "center", paddingHorizontal: 32 },
  // Card
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 12,
  },
  cardInactive: { opacity: 0.6 },
  cardTop: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  avatarPlaceholder: { backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" },
  cardInfo: { flex: 1, gap: 4 },
  cardName: { fontSize: 15, fontWeight: "700", color: "#111827" },
  badgeRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  serviceBadge: {
    backgroundColor: "#EFF6FF",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  serviceBadgeText: { fontSize: 11, color: "#3B82F6", fontWeight: "600" },
  inactiveBadge: {
    backgroundColor: "#FEF2F2",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  inactiveBadgeText: { fontSize: 11, color: "#EF4444", fontWeight: "600" },
  cardAddress: { fontSize: 12, color: "#9CA3AF" },
  cardWhatsapp: { fontSize: 12, color: "#25D366" },
  cardActions: { flexDirection: "row", gap: 8 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionToggle: { borderColor: "#E5E7EB", backgroundColor: "#F9FAFB" },
  actionEdit: { borderColor: "#BFDBFE", backgroundColor: "#EFF6FF" },
  actionDelete: { borderColor: "#FECACA", backgroundColor: "#FEF2F2" },
  actionBtnText: { fontSize: 12, color: "#6B7280", fontWeight: "500" },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "92%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  modalTitle: { flex: 1, fontSize: 17, fontWeight: "700", color: "#111827" },
  modalClose: { padding: 4 },
  modalBody: { paddingHorizontal: 20, paddingTop: 16 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6, marginTop: 14 },
  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#111827",
  },
  inputMultiline: { minHeight: 90, textAlignVertical: "top" },
  // Avatar picker
  avatarPicker: {
    width: 90,
    height: 90,
    borderRadius: 45,
    overflow: "hidden",
    backgroundColor: "#F3F4F6",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  avatarPreview: { width: 90, height: 90 },
  avatarOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    paddingVertical: 6,
    gap: 2,
  },
  avatarOverlayText: { fontSize: 10, color: "#FFFFFF", fontWeight: "600" },
  avatarPlaceholderPicker: { alignItems: "center", gap: 6 },
  avatarPlaceholderText: { fontSize: 11, color: "#9CA3AF" },
  // Service picker
  selectedServiceCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#86EFAC",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  selectedServiceText: { flex: 1, fontSize: 14, color: "#111827", fontWeight: "500" },
  changeServiceBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  changeServiceText: { fontSize: 12, color: "#6B7280" },
  servicePickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  servicePickerPlaceholder: { flexDirection: "row", alignItems: "center", gap: 8 },
  servicePickerPlaceholderText: { fontSize: 14, color: "#9CA3AF" },
  inlineServiceList: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    marginTop: 4,
    overflow: "hidden",
  },
  serviceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  serviceRowImg: { width: 36, height: 36, borderRadius: 8 },
  serviceRowImgPlaceholder: { backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" },
  serviceRowName: { fontSize: 14, fontWeight: "600", color: "#111827" },
  serviceRowCat: { fontSize: 12, color: "#6B7280" },
  noServicesMsg: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 16,
  },
  noServicesMsgText: { fontSize: 13, color: "#9CA3AF", flex: 1 },
  // Gallery
  galleryScroll: { marginBottom: 4 },
  galleryThumb: { width: 72, height: 72, borderRadius: 10, marginRight: 8, overflow: "hidden" },
  galleryThumbImg: { width: 72, height: 72 },
  galleryRemoveBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 8,
    padding: 2,
  },
  galleryAddBtn: {
    width: 72,
    height: 72,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: "#F9FAFB",
  },
  galleryAddText: { fontSize: 10, color: "#9CA3AF" },
  // Toggle
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    paddingVertical: 8,
  },
  toggleSubtitle: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },
  // Save
  saveBtn: {
    backgroundColor: "#25D366",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 20,
  },
  saveBtnText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
});
