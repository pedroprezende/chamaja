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
import { useState, useEffect, useCallback, useMemo } from "react";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { adsDB, type Ad, type CreateAdInput } from "@/lib/ads-database";
import { professionals } from "@/data/mock";
import { providersDB, type StoredProvider } from "@/lib/providers-database";
import { adminDB, type Service as AdminService } from "@/lib/admin-database";

// ─── Tipo unificado para o picker ─────────────────────────────────────────────
type PickerProvider = {
  id: string;
  name: string;
  category: string;
  avatar?: string;
  isReal: boolean;
};

const EMPTY_FORM: CreateAdInput = {
  title: "",
  description: "",
  imageUrl: "",
  providerId: "",
  providerName: "",
  isActive: true,
  displayOrder: 1,
};

// ─── Card de Anúncio ──────────────────────────────────────────────────────────
function AdCard({
  item,
  onEdit,
  onDelete,
  onToggle,
}: {
  item: Ad;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  return (
    <View style={styles.adCard}>
      {/* Banner */}
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.adBanner} resizeMode="cover" />
      ) : (
        <View style={styles.adBannerPlaceholder}>
          <MaterialIcons name="image" size={32} color="#CBD5E1" />
          <Text style={styles.adBannerPlaceholderText}>Sem imagem</Text>
        </View>
      )}

      {/* Badge de status */}
      <View style={[styles.statusBadge, item.isActive ? styles.statusBadgeActive : styles.statusBadgeInactive]}>
        <View style={[styles.statusDot, item.isActive ? styles.statusDotActive : styles.statusDotInactive]} />
        <Text style={[styles.statusText, item.isActive ? styles.statusTextActive : styles.statusTextInactive]}>
          {item.isActive ? "Ativo" : "Inativo"}
        </Text>
      </View>

      {/* Conteúdo */}
      <View style={styles.adContent}>
        <Text style={styles.adTitle} numberOfLines={2} ellipsizeMode="tail">
          {item.title}
        </Text>
        {!!item.description && (
          <Text style={styles.adDesc} numberOfLines={2} ellipsizeMode="tail">
            {item.description}
          </Text>
        )}

        <View style={styles.adMeta}>
          <View style={styles.adMetaItem}>
            <MaterialIcons name="person" size={13} color="#64748B" />
            <Text style={styles.adMetaText} numberOfLines={1} ellipsizeMode="tail">
              {item.providerName}
            </Text>
          </View>
          <View style={styles.adMetaItem}>
            <MaterialIcons name="sort" size={13} color="#64748B" />
            <Text style={styles.adMetaText}>Ordem {item.displayOrder}</Text>
          </View>
        </View>

        {/* Ações */}
        <View style={styles.adActions}>
          <Pressable
            style={({ pressed }) => [styles.adActionBtn, styles.adToggleBtn, pressed && { opacity: 0.7 }]}
            onPress={onToggle}
          >
            <MaterialIcons
              name={item.isActive ? "visibility-off" : "visibility"}
              size={14}
              color="#64748B"
            />
            <Text style={styles.adActionText}>{item.isActive ? "Desativar" : "Ativar"}</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.adActionBtn, styles.adEditBtn, pressed && { opacity: 0.7 }]}
            onPress={onEdit}
          >
            <MaterialIcons name="edit" size={14} color="#2563EB" />
            <Text style={[styles.adActionText, { color: "#2563EB" }]}>Editar</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.adActionBtn, styles.adDeleteBtn, pressed && { opacity: 0.7 }]}
            onPress={onDelete}
          >
            <MaterialIcons name="delete-outline" size={14} color="#DC2626" />
            <Text style={[styles.adActionText, { color: "#DC2626" }]}>Excluir</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ─── Tela Principal ──────────────────────────────────────────────────────────
export default function AdminAdsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [form, setForm] = useState<CreateAdInput>(EMPTY_FORM);

  // Provider picker
  const [showProviderPicker, setShowProviderPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [realProviders, setRealProviders] = useState<StoredProvider[]>([]);
  const [adminServices, setAdminServices] = useState<AdminService[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);

  const loadRealProviders = useCallback(async () => {
    try {
      setLoadingProviders(true);
      providersDB.resetCache();
      const [allProvs, allSvcs] = await Promise.all([
        providersDB.getAllActive(),
        adminDB.getAllServices(),
      ]);
      setRealProviders(allProvs);
      setAdminServices(allSvcs.filter((s) => s.isActive));
    } catch (e) {
      console.error("Erro ao carregar prestadores:", e);
    } finally {
      setLoadingProviders(false);
    }
  }, []);

  const allProviders = useMemo<PickerProvider[]>(() => {
    const realNames = new Set(realProviders.map((p) => p.name.toLowerCase()));
    const adminNames = new Set(adminServices.map((s) => s.name.toLowerCase()));
    const fromAdmin: PickerProvider[] = adminServices.map((s) => ({
      id: `admin-svc-${s.id}`,
      name: s.name,
      category: s.subcategoryName || s.category,
      avatar: s.imageUri,
      isReal: true,
    }));
    const fromReal: PickerProvider[] = realProviders.map((p) => ({
      id: p.userId,
      name: p.name,
      category: p.category,
      avatar: p.avatar,
      isReal: true,
    }));
    const fromMock: PickerProvider[] = professionals
      .filter(
        (p) =>
          !realNames.has(p.name.toLowerCase()) &&
          !adminNames.has(p.name.toLowerCase())
      )
      .map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        avatar: p.avatar,
        isReal: false,
      }));
    return [...fromAdmin, ...fromReal, ...fromMock];
  }, [realProviders, adminServices]);

  const filteredProviders = useMemo<PickerProvider[]>(() => {
    if (!pickerSearch.trim()) return allProviders;
    const q = pickerSearch.toLowerCase();
    return allProviders.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [allProviders, pickerSearch]);

  const loadAds = useCallback(async () => {
    setLoading(true);
    const all = await adsDB.getAll();
    setAds(all);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAds();
  }, [loadAds]);

  const openCreate = () => {
    setEditingAd(null);
    setForm({ ...EMPTY_FORM, displayOrder: ads.length + 1 });
    setShowProviderPicker(false);
    setPickerSearch("");
    setModalVisible(true);
  };

  const openEdit = (ad: Ad) => {
    setEditingAd(ad);
    setForm({
      title: ad.title,
      description: ad.description,
      imageUrl: ad.imageUrl,
      providerId: ad.providerId,
      providerName: ad.providerName,
      isActive: ad.isActive,
      displayOrder: ad.displayOrder,
    });
    setShowProviderPicker(false);
    setPickerSearch("");
    setModalVisible(true);
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.85,
    });
    if (!result.canceled) {
      setForm((f) => ({ ...f, imageUrl: result.assets[0].uri }));
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      Alert.alert("Campo obrigatório", "Digite o título do anúncio.");
      return;
    }
    if (!form.providerId) {
      Alert.alert("Campo obrigatório", "Selecione um prestador para o anúncio.");
      return;
    }
    if (!form.imageUrl) {
      Alert.alert("Campo obrigatório", "Adicione uma imagem ao anúncio.");
      return;
    }
    setSaving(true);
    try {
      if (editingAd) {
        await adsDB.update(editingAd.id, form);
      } else {
        await adsDB.create(form);
      }
      await loadAds();
      setModalVisible(false);
    } catch {
      Alert.alert("Erro", "Não foi possível salvar o anúncio.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (ad: Ad) => {
    Alert.alert(
      "Excluir anúncio",
      `Deseja excluir "${ad.title}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            await adsDB.delete(ad.id);
            await loadAds();
          },
        },
      ]
    );
  };

  const handleToggle = async (ad: Ad) => {
    await adsDB.toggleActive(ad.id);
    await loadAds();
  };

  const activeCount = ads.filter((a) => a.isActive).length;

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
          <Text style={styles.headerTitle}>Anúncios</Text>
          <Text style={styles.headerSub}>{ads.length} total · {activeCount} ativos</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.8, transform: [{ scale: 0.96 }] }]}
          onPress={openCreate}
        >
          <MaterialIcons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Novo</Text>
        </Pressable>
      </View>

      {/* ── Lista ── */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#25D366" />
          <Text style={styles.loadingText}>Carregando anúncios...</Text>
        </View>
      ) : (
        <FlatList
          data={ads}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconBox}>
                <MaterialIcons name="campaign" size={40} color="#CBD5E1" />
              </View>
              <Text style={styles.emptyTitle}>Nenhum anúncio</Text>
              <Text style={styles.emptySubtitle}>
                Toque em "+ Novo" para criar o primeiro anúncio patrocinado.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <AdCard
              item={item}
              onEdit={() => openEdit(item)}
              onDelete={() => handleDelete(item)}
              onToggle={() => handleToggle(item)}
            />
          )}
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
                  {editingAd ? "Editar Anúncio" : "Novo Anúncio"}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {editingAd ? "Atualize as informações abaixo" : "Preencha os dados do anúncio"}
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
              {/* ── Seção: Imagem ── */}
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Imagem do Banner</Text>
                <Pressable
                  style={({ pressed }) => [styles.bannerPicker, pressed && { opacity: 0.85 }]}
                  onPress={handlePickImage}
                >
                  {form.imageUrl ? (
                    <View style={{ position: "relative" }}>
                      <Image source={{ uri: form.imageUrl }} style={styles.bannerPreview} resizeMode="cover" />
                      <View style={styles.bannerOverlay}>
                        <MaterialIcons name="photo-camera" size={18} color="#FFFFFF" />
                        <Text style={styles.bannerOverlayText}>Trocar imagem</Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.bannerPlaceholder}>
                      <MaterialIcons name="add-photo-alternate" size={36} color="#94A3B8" />
                      <Text style={styles.bannerPlaceholderTitle}>Adicionar banner</Text>
                      <Text style={styles.bannerPlaceholderSub}>Recomendado: proporção 16:9</Text>
                    </View>
                  )}
                </Pressable>
              </View>

              {/* ── Seção: Dados do Anúncio ── */}
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Dados do Anúncio</Text>

                <Text style={styles.fieldLabel}>Título *</Text>
                <View style={styles.inputWrap}>
                  <MaterialIcons name="title" size={17} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: Elétrica do Zé — 20 anos de experiência"
                    placeholderTextColor="#94A3B8"
                    value={form.title}
                    onChangeText={(v) => setForm((f) => ({ ...f, title: v }))}
                    maxLength={80}
                    returnKeyType="next"
                  />
                </View>

                <Text style={styles.fieldLabel}>Descrição (opcional)</Text>
                <View style={[styles.inputWrap, styles.textareaWrap]}>
                  <TextInput
                    style={[styles.input, styles.textarea]}
                    placeholder="Breve descrição do anúncio..."
                    placeholderTextColor="#94A3B8"
                    value={form.description}
                    onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
                    multiline
                    numberOfLines={3}
                    maxLength={160}
                    textAlignVertical="top"
                  />
                </View>

                <Text style={styles.fieldLabel}>Ordem de exibição</Text>
                <View style={styles.inputWrap}>
                  <MaterialIcons name="sort" size={17} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="1"
                    placeholderTextColor="#94A3B8"
                    value={String(form.displayOrder)}
                    onChangeText={(v) => setForm((f) => ({ ...f, displayOrder: parseInt(v) || 1 }))}
                    keyboardType="number-pad"
                    returnKeyType="done"
                  />
                </View>
              </View>

              {/* ── Seção: Prestador Vinculado ── */}
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Prestador Vinculado</Text>

                {form.providerId ? (
                  /* Prestador selecionado */
                  <View style={styles.providerSelected}>
                    <View style={styles.providerSelectedIcon}>
                      <MaterialIcons name="check-circle" size={22} color="#16A34A" />
                    </View>
                    <Text style={styles.providerSelectedName} numberOfLines={1} ellipsizeMode="tail">
                      {form.providerName}
                    </Text>
                    <Pressable
                      style={({ pressed }) => [styles.changeProviderBtn, pressed && { opacity: 0.7 }]}
                      onPress={() => {
                        setForm((f) => ({ ...f, providerId: "", providerName: "" }));
                        setPickerSearch("");
                        loadRealProviders();
                        setShowProviderPicker(true);
                      }}
                    >
                      <MaterialIcons name="swap-horiz" size={15} color="#2563EB" />
                      <Text style={styles.changeProviderText}>Trocar</Text>
                    </Pressable>
                  </View>
                ) : (
                  /* Botão para abrir picker */
                  <Pressable
                    style={({ pressed }) => [
                      styles.providerPickerBtn,
                      showProviderPicker && styles.providerPickerBtnOpen,
                      pressed && { opacity: 0.85 },
                    ]}
                    onPress={() => {
                      setPickerSearch("");
                      loadRealProviders();
                      setShowProviderPicker((v) => !v);
                    }}
                  >
                    <MaterialIcons name="person-add" size={17} color="#94A3B8" />
                    <Text style={styles.providerPickerBtnText}>Selecionar prestador...</Text>
                    <MaterialIcons
                      name={showProviderPicker ? "expand-less" : "expand-more"}
                      size={20}
                      color="#94A3B8"
                    />
                  </Pressable>
                )}

                {/* Lista inline de prestadores */}
                {showProviderPicker && !form.providerId && (
                  <View style={styles.providerList}>
                    {/* Busca */}
                    <View style={styles.providerSearchBox}>
                      <MaterialIcons name="search" size={16} color="#94A3B8" />
                      <TextInput
                        style={styles.providerSearchInput}
                        placeholder="Buscar prestador..."
                        placeholderTextColor="#94A3B8"
                        value={pickerSearch}
                        onChangeText={setPickerSearch}
                        returnKeyType="search"
                      />
                      {pickerSearch.length > 0 && (
                        <Pressable onPress={() => setPickerSearch("")} hitSlop={8}>
                          <MaterialIcons name="close" size={14} color="#94A3B8" />
                        </Pressable>
                      )}
                    </View>

                    {loadingProviders ? (
                      <View style={styles.providerLoadingRow}>
                        <ActivityIndicator size="small" color="#25D366" />
                        <Text style={styles.providerLoadingText}>Carregando...</Text>
                      </View>
                    ) : filteredProviders.length === 0 ? (
                      <View style={styles.providerEmptyRow}>
                        <Text style={styles.providerEmptyText}>
                          {pickerSearch ? `Sem resultados para "${pickerSearch}"` : "Nenhum prestador encontrado"}
                        </Text>
                      </View>
                    ) : (
                      filteredProviders.slice(0, 8).map((item) => (
                        <Pressable
                          key={item.id}
                          style={({ pressed }) => [styles.providerItem, pressed && { backgroundColor: "#F0FDF4" }]}
                          onPress={() => {
                            setForm((f) => ({ ...f, providerId: item.id, providerName: item.name }));
                            setShowProviderPicker(false);
                          }}
                        >
                          {item.avatar ? (
                            <Image source={{ uri: item.avatar }} style={styles.providerAvatar} />
                          ) : (
                            <View style={[styles.providerAvatar, styles.providerAvatarFallback]}>
                              <MaterialIcons name="person" size={18} color="#94A3B8" />
                            </View>
                          )}
                          <View style={styles.providerItemInfo}>
                            <View style={styles.providerItemNameRow}>
                              <Text style={styles.providerItemName} numberOfLines={1} ellipsizeMode="tail">
                                {item.name}
                              </Text>
                              {item.isReal && (
                                <View style={styles.verifiedBadge}>
                                  <MaterialIcons name="verified" size={9} color="#FFFFFF" />
                                  <Text style={styles.verifiedBadgeText}>App</Text>
                                </View>
                              )}
                            </View>
                            <Text style={styles.providerItemCategory} numberOfLines={1}>
                              {item.category}
                            </Text>
                          </View>
                          <MaterialIcons name="chevron-right" size={18} color="#CBD5E1" />
                        </Pressable>
                      ))
                    )}
                  </View>
                )}
              </View>

              {/* ── Seção: Configurações ── */}
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Configurações</Text>
                <View style={styles.toggleCard}>
                  <View style={styles.toggleCardLeft}>
                    <View style={[styles.toggleCardIcon, form.isActive && styles.toggleCardIconOn]}>
                      <MaterialIcons name="campaign" size={18} color={form.isActive ? "#15803D" : "#94A3B8"} />
                    </View>
                    <View style={styles.toggleCardText}>
                      <Text style={styles.toggleCardTitle}>Anúncio ativo</Text>
                      <Text style={styles.toggleCardSub}>
                        {form.isActive ? "Visível na tela inicial" : "Oculto da tela inicial"}
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
                      <MaterialIcons name={editingAd ? "check" : "add"} size={18} color="#FFFFFF" />
                      <Text style={styles.saveBtnText}>
                        {editingAd ? "Salvar Alterações" : "Criar Anúncio"}
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

// ─── Estilos ─────────────────────────────────────────────────────────────────
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

  // Loading / Empty
  loadingBox: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 14, color: "#64748B" },
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

  // List
  listContent: { padding: 16, gap: 12, paddingBottom: 40 },

  // Ad Card
  adCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  adBanner: { width: "100%", height: 140 },
  adBannerPlaceholder: {
    width: "100%",
    height: 100,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  adBannerPlaceholderText: { fontSize: 12, color: "#94A3B8" },
  statusBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusBadgeActive: { backgroundColor: "rgba(220,252,231,0.95)" },
  statusBadgeInactive: { backgroundColor: "rgba(241,245,249,0.95)" },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusDotActive: { backgroundColor: "#16A34A" },
  statusDotInactive: { backgroundColor: "#94A3B8" },
  statusText: { fontSize: 11, fontWeight: "700" },
  statusTextActive: { color: "#15803D" },
  statusTextInactive: { color: "#64748B" },
  adContent: { padding: 14, gap: 6 },
  adTitle: { fontSize: 15, fontWeight: "700", color: "#0F172A", lineHeight: 22 },
  adDesc: { fontSize: 13, color: "#64748B", lineHeight: 18 },
  adMeta: { flexDirection: "row", alignItems: "center", gap: 14, flexWrap: "wrap" },
  adMetaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  adMetaText: { fontSize: 12, color: "#64748B", maxWidth: 150 },
  adActions: { flexDirection: "row", gap: 8, marginTop: 6, flexWrap: "wrap" },
  adActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  adToggleBtn: { backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0" },
  adEditBtn: { backgroundColor: "#EFF6FF", borderWidth: 1, borderColor: "#BFDBFE" },
  adDeleteBtn: { backgroundColor: "#FEF2F2", borderWidth: 1, borderColor: "#FECACA" },
  adActionText: { fontSize: 12, fontWeight: "600", color: "#64748B" },

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
  textarea: { minHeight: 80, textAlignVertical: "top" },

  // Banner picker
  bannerPicker: {
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#F1F5F9",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
  },
  bannerPreview: { width: "100%", height: 160 },
  bannerOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    gap: 6,
  },
  bannerOverlayText: { color: "#FFFFFF", fontSize: 13, fontWeight: "600" },
  bannerPlaceholder: {
    height: 130,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  bannerPlaceholderTitle: { fontSize: 14, color: "#374151", fontWeight: "500" },
  bannerPlaceholderSub: { fontSize: 12, color: "#94A3B8" },

  // Provider picker
  providerSelected: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#F0FDF4",
    borderWidth: 1.5,
    borderColor: "#86EFAC",
    borderRadius: 12,
    padding: 12,
  },
  providerSelectedIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
  },
  providerSelectedName: { flex: 1, fontSize: 14, fontWeight: "600", color: "#0F172A" },
  changeProviderBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EFF6FF",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  changeProviderText: { fontSize: 12, fontWeight: "600", color: "#2563EB" },
  providerPickerBtn: {
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
  providerPickerBtnOpen: { borderColor: "#25D366", borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  providerPickerBtnText: { flex: 1, fontSize: 14, color: "#94A3B8" },
  providerList: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#25D366",
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    overflow: "hidden",
  },
  providerSearchBox: {
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
  providerSearchInput: { flex: 1, fontSize: 13, color: "#0F172A", padding: 0 },
  providerLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 16,
    justifyContent: "center",
  },
  providerLoadingText: { fontSize: 13, color: "#64748B" },
  providerEmptyRow: { padding: 16, alignItems: "center" },
  providerEmptyText: { fontSize: 13, color: "#94A3B8", textAlign: "center" },
  providerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  providerAvatar: { width: 40, height: 40, borderRadius: 20 },
  providerAvatarFallback: {
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  providerItemInfo: { flex: 1 },
  providerItemNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  providerItemName: { fontSize: 14, fontWeight: "600", color: "#0F172A", flexShrink: 1 },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "#25D366",
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  verifiedBadgeText: { fontSize: 9, color: "#FFFFFF", fontWeight: "700" },
  providerItemCategory: { fontSize: 12, color: "#64748B", marginTop: 1 },

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
