import {
  View,
  Text,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  FlatList,
  StyleSheet,
  Pressable,
  Image,
  Switch,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { adminDB, type Service } from "@/lib/admin-database";
import { useAuth } from "@/lib/auth-context";
import { categories } from "@/data/mock";
import { useEffect, useState, useCallback } from "react";

// Mapeamento de ícones por categoria
const CATEGORY_ICON_MAP: Record<string, string> = {
  "assistencia-tecnica": "settings",
  "reformas-reparos": "build",
  "eventos": "celebration",
  "servicos-domesticos": "home",
  "servicos-externos": "yard",
  "automotivo": "directions-car",
  "beleza-estetica": "content-cut",
  "servicos-profissionais": "business-center",
  "saude": "local-hospital",
  "logistica": "local-shipping",
  "educacao": "school",
  "comercios": "storefront",
  "mobilidade": "commute",
  "aulas": "school",
};

function getCategoryIcon(categoryId: string): string {
  return CATEGORY_ICON_MAP[categoryId] || "build";
}

// ─── Componente de Card de Serviço ─────────────────────────────────────────
function ServiceCard({
  item,
  onEdit,
  onDelete,
  onToggleHome,
}: {
  item: Service;
  onEdit: () => void;
  onDelete: () => void;
  onToggleHome: () => void;
}) {
  const iconName = getCategoryIcon(item.categoryId) as any;
  return (
    <View style={styles.card}>
      {/* Thumbnail / Ícone */}
      {item.imageUri ? (
        <Image source={{ uri: item.imageUri }} style={styles.cardThumb} resizeMode="cover" />
      ) : (
        <View style={styles.cardIconBox}>
          <MaterialIcons name={iconName} size={26} color="#25D366" />
        </View>
      )}

      {/* Informações */}
      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={1} ellipsizeMode="tail">
          {item.name}
        </Text>
        <View style={styles.cardMeta}>
          <View style={styles.categoryPill}>
            <Text style={styles.categoryPillText} numberOfLines={1} ellipsizeMode="tail">
              {item.category}
            </Text>
          </View>
          {item.showOnHome && (
            <View style={styles.homePill}>
              <MaterialIcons name="home" size={10} color="#15803D" />
              <Text style={styles.homePillText}>Home</Text>
            </View>
          )}
        </View>
        {!!item.description && (
          <Text style={styles.cardDesc} numberOfLines={2} ellipsizeMode="tail">
            {item.description}
          </Text>
        )}
        {/* Toggle visibilidade */}
        <Pressable style={styles.toggleRow} onPress={onToggleHome}>
          <Switch
            value={item.showOnHome}
            onValueChange={onToggleHome}
            trackColor={{ false: "#E5E7EB", true: "#BBF7D0" }}
            thumbColor={item.showOnHome ? "#25D366" : "#D1D5DB"}
            style={{ transform: [{ scaleX: 0.7 }, { scaleY: 0.7 }], marginLeft: -4 }}
          />
          <Text style={[styles.toggleLabel, item.showOnHome && styles.toggleLabelOn]}>
            {item.showOnHome ? "Visível na Home" : "Oculto"}
          </Text>
        </Pressable>
      </View>

      {/* Ações */}
      <View style={styles.cardActions}>
        <Pressable
          style={({ pressed }) => [styles.actionBtn, styles.editBtn, pressed && { opacity: 0.65 }]}
          onPress={onEdit}
          hitSlop={6}
        >
          <MaterialIcons name="edit" size={15} color="#2563EB" />
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.actionBtn, styles.deleteBtn, pressed && { opacity: 0.65 }]}
          onPress={onDelete}
          hitSlop={6}
        >
          <MaterialIcons name="delete-outline" size={15} color="#DC2626" />
        </Pressable>
      </View>
    </View>
  );
}

// ─── Botão de navegação da barra de seções ──────────────────────────────────
function NavChip({
  icon,
  label,
  color,
  onPress,
}: {
  icon: string;
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.navChip, pressed && { opacity: 0.7 }]}
      onPress={onPress}
    >
      <MaterialIcons name={icon as any} size={16} color={color} />
      <Text style={[styles.navChipText, { color }]}>{label}</Text>
    </Pressable>
  );
}

// ─── Tela Principal ──────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, signOut, isAdmin, isLoading: authLoading } = useAuth();

  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [searchText, setSearchText] = useState("");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    categoryId: "",
    description: "",
    imageUri: "",
    showOnHome: false,
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace("/auth/login"); return; }
    if (!isAdmin) { router.replace("/(tabs)"); return; }
    setAuthorized(true);
    adminDB.getAllServices().then(setServices).catch(() => {});
  }, [user, isAdmin, authLoading, router]);

  const handleLogout = useCallback(() => {
    Alert.alert("Sair do Painel", "Tem certeza que deseja sair?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          try { await signOut(); } catch {}
          router.replace("/auth/login");
        },
      },
    ]);
  }, [signOut, router]);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.85,
    });
    if (!result.canceled) {
      setFormData((prev) => ({ ...prev, imageUri: result.assets[0].uri }));
    }
  };

  const openCreateModal = () => {
    setEditingService(null);
    setFormData({ name: "", category: "", categoryId: "", description: "", imageUri: "", showOnHome: false });
    setShowCategoryDropdown(false);
    setShowModal(true);
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      category: service.category,
      categoryId: service.categoryId || "",
      description: service.description,
      imageUri: service.imageUri || "",
      showOnHome: service.showOnHome ?? false,
    });
    setShowCategoryDropdown(false);
    setShowModal(true);
  };

  const handleDeleteService = (serviceId: string, serviceName: string) => {
    Alert.alert("Excluir Serviço", `Deseja excluir "${serviceName}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          await adminDB.deleteService(serviceId);
          setServices((prev) => prev.filter((s) => s.id !== serviceId));
        },
      },
    ]);
  };

  const handleToggleHome = async (service: Service) => {
    const updated = await adminDB.updateService(service.id, { showOnHome: !service.showOnHome });
    setServices((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  const handleSaveService = async () => {
    if (!formData.name.trim() || !formData.categoryId || !formData.description.trim()) {
      Alert.alert("Campos obrigatórios", "Preencha nome, categoria e descrição.");
      return;
    }
    try {
      if (editingService) {
        const updated = await adminDB.updateService(editingService.id, {
          name: formData.name.trim(),
          category: formData.category,
          categoryId: formData.categoryId,
          description: formData.description.trim(),
          imageUri: formData.imageUri || undefined,
          showOnHome: formData.showOnHome,
        });
        setServices((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      } else {
        const newService = await adminDB.createService(
          user?.id || "admin",
          formData.name.trim(),
          formData.category,
          formData.description.trim(),
          undefined,
          formData.imageUri || undefined,
          formData.categoryId,
          formData.showOnHome
        );
        setServices((prev) => [...prev, newService]);
      }
      setShowModal(false);
    } catch (err: any) {
      Alert.alert("Erro", err.message);
    }
  };

  const filteredServices = services.filter(
    (s) =>
      s.name.toLowerCase().includes(searchText.toLowerCase()) ||
      s.category.toLowerCase().includes(searchText.toLowerCase())
  );

  const homeCount = services.filter((s) => s.showOnHome).length;

  if (authorized === null) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Verificando acesso...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
          onPress={() => router.replace("/(tabs)")}
          hitSlop={8}
        >
          <MaterialIcons name="arrow-back" size={22} color="#374151" />
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Painel Admin</Text>
          <Text style={styles.headerSub} numberOfLines={1}>
            {user?.name?.split(" ")[0] || "Admin"} · {services.length} serviços
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.iconBtn, styles.logoutIconBtn, pressed && { opacity: 0.7 }]}
          onPress={handleLogout}
          hitSlop={8}
        >
          <MaterialIcons name="logout" size={20} color="#DC2626" />
        </Pressable>
      </View>

      {/* ── Stats Cards ── */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{services.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={[styles.statCard, styles.statCardGreen]}>
          <Text style={[styles.statValue, { color: "#15803D" }]}>{homeCount}</Text>
          <Text style={[styles.statLabel, { color: "#166534" }]}>Na Home</Text>
        </View>
        <View style={[styles.statCard, styles.statCardBlue]}>
          <Text style={[styles.statValue, { color: "#1D4ED8" }]}>
            {services.filter((s) => !!s.imageUri).length}
          </Text>
          <Text style={[styles.statLabel, { color: "#1E40AF" }]}>Com Foto</Text>
        </View>
      </View>

      {/* ── Navegação entre seções ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.navBar}
        contentContainerStyle={styles.navBarContent}
      >
        <NavChip icon="category" label="Serviços" color="#25D366" onPress={() => router.push("/admin/services" as any)} />
        <NavChip icon="campaign" label="Anúncios" color="#2563EB" onPress={() => router.push("/admin/ads" as any)} />
        <NavChip icon="image" label="Imagens" color="#7C3AED" onPress={() => router.push("/admin/subcategory-images" as any)} />
        <NavChip icon="people" label="Prestadores" color="#D97706" onPress={() => router.push("/admin/providers" as any)} />
      </ScrollView>

      {/* ── Barra de busca + botão adicionar ── */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <MaterialIcons name="search" size={18} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar serviço ou categoria..."
            placeholderTextColor="#9CA3AF"
            value={searchText}
            onChangeText={setSearchText}
            returnKeyType="search"
          />
          {searchText.length > 0 && (
            <Pressable onPress={() => setSearchText("")} hitSlop={8}>
              <MaterialIcons name="close" size={16} color="#9CA3AF" />
            </Pressable>
          )}
        </View>
        <Pressable
          style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.8, transform: [{ scale: 0.96 }] }]}
          onPress={openCreateModal}
        >
          <MaterialIcons name="add" size={22} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Novo</Text>
        </Pressable>
      </View>

      {/* ── Lista de Serviços ── */}
      <FlatList
        data={filteredServices}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <ServiceCard
            item={item}
            onEdit={() => handleEditService(item)}
            onDelete={() => handleDeleteService(item.id, item.name)}
            onToggleHome={() => handleToggleHome(item)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconBox}>
              <MaterialIcons name="inbox" size={40} color="#D1D5DB" />
            </View>
            <Text style={styles.emptyTitle}>
              {searchText ? "Nenhum resultado encontrado" : "Nenhum serviço cadastrado"}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchText ? `Sem resultados para "${searchText}"` : 'Toque em "+ Novo" para adicionar'}
            </Text>
          </View>
        }
      />

      {/* ── Modal de Criação / Edição ── */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {/* Handle */}
            <View style={styles.modalHandle} />

            {/* Cabeçalho do modal */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {editingService ? "Editar Serviço" : "Novo Serviço"}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {editingService ? "Atualize as informações abaixo" : "Preencha os dados do serviço"}
                </Text>
              </View>
              <Pressable
                style={({ pressed }) => [styles.modalCloseBtn, pressed && { opacity: 0.6 }]}
                onPress={() => setShowModal(false)}
                hitSlop={8}
              >
                <MaterialIcons name="close" size={20} color="#6B7280" />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
              contentContainerStyle={styles.modalScrollContent}
            >
              {/* ── Seção: Imagem ── */}
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>
                  <MaterialIcons name="image" size={14} color="#6B7280" /> Imagem de Capa
                </Text>
                <Pressable
                  style={({ pressed }) => [styles.imagePicker, pressed && { opacity: 0.8 }]}
                  onPress={handlePickImage}
                >
                  {formData.imageUri ? (
                    <View style={styles.imagePreviewWrap}>
                      <Image source={{ uri: formData.imageUri }} style={styles.imagePreview} resizeMode="cover" />
                      <View style={styles.imageOverlay}>
                        <MaterialIcons name="edit" size={18} color="#FFFFFF" />
                        <Text style={styles.imageOverlayText}>Trocar foto</Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <MaterialIcons name="add-photo-alternate" size={32} color="#9CA3AF" />
                      <Text style={styles.imagePlaceholderTitle}>Adicionar imagem</Text>
                      <Text style={styles.imagePlaceholderSub}>Toque para selecionar da galeria</Text>
                    </View>
                  )}
                </Pressable>
              </View>

              {/* ── Seção: Dados do Serviço ── */}
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>
                  <MaterialIcons name="info-outline" size={14} color="#6B7280" /> Dados do Serviço
                </Text>

                <Text style={styles.fieldLabel}>Nome do Serviço *</Text>
                <View style={styles.inputWrap}>
                  <MaterialIcons name="build" size={17} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: Eletricista Residencial"
                    placeholderTextColor="#9CA3AF"
                    value={formData.name}
                    onChangeText={(t) => setFormData({ ...formData, name: t })}
                    returnKeyType="next"
                  />
                </View>

                <Text style={styles.fieldLabel}>Categoria *</Text>
                <Pressable
                  style={({ pressed }) => [
                    styles.inputWrap,
                    styles.selectWrap,
                    showCategoryDropdown && styles.selectWrapOpen,
                    pressed && { opacity: 0.85 },
                  ]}
                  onPress={() => setShowCategoryDropdown((v) => !v)}
                >
                  {formData.categoryId ? (
                    <View style={styles.selectedCatRow}>
                      <View style={styles.selectedCatIcon}>
                        <MaterialIcons name={getCategoryIcon(formData.categoryId) as any} size={16} color="#25D366" />
                      </View>
                      <Text style={styles.selectedCatText} numberOfLines={1}>
                        {formData.category}
                      </Text>
                    </View>
                  ) : (
                    <>
                      <MaterialIcons name="category" size={17} color="#9CA3AF" style={styles.inputIcon} />
                      <Text style={styles.selectPlaceholder}>Selecionar categoria...</Text>
                    </>
                  )}
                  <MaterialIcons
                    name={showCategoryDropdown ? "expand-less" : "expand-more"}
                    size={20}
                    color="#9CA3AF"
                  />
                </Pressable>

                {/* Dropdown de categorias */}
                {showCategoryDropdown && (
                  <View style={styles.dropdown}>
                    {categories.map((cat) => {
                      const isSelected = formData.categoryId === cat.id;
                      return (
                        <Pressable
                          key={cat.id}
                          style={({ pressed }) => [
                            styles.dropdownItem,
                            isSelected && styles.dropdownItemActive,
                            pressed && { backgroundColor: "#F0FDF4" },
                          ]}
                          onPress={() => {
                            setFormData((prev) => ({
                              ...prev,
                              categoryId: cat.id,
                              category: cat.name.replace(/\n/g, " "),
                            }));
                            setShowCategoryDropdown(false);
                          }}
                        >
                          <View style={[styles.dropdownItemIcon, isSelected && styles.dropdownItemIconActive]}>
                            <MaterialIcons
                              name={getCategoryIcon(cat.id) as any}
                              size={16}
                              color={isSelected ? "#FFFFFF" : "#25D366"}
                            />
                          </View>
                          <Text
                            style={[styles.dropdownItemText, isSelected && styles.dropdownItemTextActive]}
                            numberOfLines={1}
                          >
                            {cat.name.replace(/\n/g, " ")}
                          </Text>
                          {isSelected && <MaterialIcons name="check" size={16} color="#25D366" />}
                        </Pressable>
                      );
                    })}
                  </View>
                )}

                <Text style={styles.fieldLabel}>Descrição *</Text>
                <View style={[styles.inputWrap, styles.textareaWrap]}>
                  <TextInput
                    style={[styles.input, styles.textarea]}
                    placeholder="Descreva o serviço oferecido..."
                    placeholderTextColor="#9CA3AF"
                    value={formData.description}
                    onChangeText={(t) => setFormData({ ...formData, description: t })}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>
              </View>

              {/* ── Seção: Visibilidade ── */}
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>
                  <MaterialIcons name="visibility" size={14} color="#6B7280" /> Visibilidade
                </Text>
                <View style={styles.toggleCard}>
                  <View style={styles.toggleCardLeft}>
                    <View style={[styles.toggleCardIcon, formData.showOnHome && styles.toggleCardIconOn]}>
                      <MaterialIcons name="home" size={18} color={formData.showOnHome ? "#15803D" : "#9CA3AF"} />
                    </View>
                    <View style={styles.toggleCardText}>
                      <Text style={styles.toggleCardTitle}>Exibir na tela inicial</Text>
                      <Text style={styles.toggleCardSub}>
                        {formData.showOnHome ? "Visível para todos os usuários" : "Oculto da tela inicial"}
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={formData.showOnHome}
                    onValueChange={(v) => setFormData({ ...formData, showOnHome: v })}
                    trackColor={{ false: "#E5E7EB", true: "#BBF7D0" }}
                    thumbColor={formData.showOnHome ? "#25D366" : "#D1D5DB"}
                  />
                </View>
              </View>

              {/* ── Botões de ação ── */}
              <View style={styles.modalActions}>
                <Pressable
                  style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.7 }]}
                  onPress={() => setShowModal(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}
                  onPress={handleSaveService}
                >
                  <MaterialIcons name={editingService ? "check" : "add"} size={18} color="#FFFFFF" />
                  <Text style={styles.saveBtnText}>
                    {editingService ? "Salvar Alterações" : "Criar Serviço"}
                  </Text>
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
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F8FAFC" },
  loadingText: { fontSize: 14, color: "#6B7280" },

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
  logoutIconBtn: { backgroundColor: "#FEF2F2" },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A", letterSpacing: -0.3 },
  headerSub: { fontSize: 12, color: "#64748B", marginTop: 1 },

  // Stats
  statsRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  statCard: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  statCardGreen: { backgroundColor: "#F0FDF4", borderColor: "#BBF7D0" },
  statCardBlue: { backgroundColor: "#EFF6FF", borderColor: "#BFDBFE" },
  statValue: { fontSize: 22, fontWeight: "800", color: "#0F172A", lineHeight: 28 },
  statLabel: { fontSize: 11, color: "#64748B", fontWeight: "500", marginTop: 2 },

  // Nav bar
  navBar: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    maxHeight: 52,
  },
  navBarContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  navChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#F8FAFC",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  navChipText: { fontSize: 13, fontWeight: "600" },

  // Search row
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 10 : 8,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: "#0F172A", padding: 0 },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#25D366",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  addBtnText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },

  // List
  listContent: { padding: 16, paddingBottom: 40 },

  // Card
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    overflow: "hidden",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },
  cardThumb: { width: 76, height: 76, backgroundColor: "#F1F5F9" },
  cardIconBox: {
    width: 76,
    height: 76,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: "#E2E8F0",
  },
  cardBody: { flex: 1, paddingHorizontal: 12, paddingVertical: 10, gap: 4 },
  cardName: { fontSize: 14, fontWeight: "700", color: "#0F172A", lineHeight: 20 },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  categoryPill: {
    backgroundColor: "#EFF6FF",
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    maxWidth: 120,
  },
  categoryPillText: { fontSize: 10, fontWeight: "600", color: "#1D4ED8" },
  homePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#F0FDF4",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  homePillText: { fontSize: 10, fontWeight: "600", color: "#15803D" },
  cardDesc: { fontSize: 12, color: "#64748B", lineHeight: 17 },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: 2, marginTop: 2 },
  toggleLabel: { fontSize: 11, color: "#94A3B8" },
  toggleLabelOn: { color: "#16A34A", fontWeight: "600" },
  cardActions: { flexDirection: "column", gap: 6, paddingRight: 12 },
  actionBtn: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  editBtn: { backgroundColor: "#EFF6FF", borderWidth: 1, borderColor: "#BFDBFE" },
  deleteBtn: { backgroundColor: "#FEF2F2", borderWidth: 1, borderColor: "#FECACA" },

  // Empty state
  emptyState: { alignItems: "center", paddingVertical: 64, gap: 10 },
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
  emptySubtitle: { fontSize: 13, color: "#9CA3AF", textAlign: "center" },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "92%",
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
    gap: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
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
  inputIcon: { marginRight: 2 },
  input: { flex: 1, fontSize: 14, color: "#0F172A", padding: 0 },
  textareaWrap: { alignItems: "flex-start", paddingTop: 12 },
  textarea: { minHeight: 90, textAlignVertical: "top" },

  // Select / Dropdown
  selectWrap: { justifyContent: "space-between" },
  selectWrapOpen: {
    borderColor: "#25D366",
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  selectedCatRow: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  selectedCatIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
  },
  selectedCatText: { flex: 1, fontSize: 14, color: "#0F172A", fontWeight: "500" },
  selectPlaceholder: { flex: 1, fontSize: 14, color: "#9CA3AF" },
  dropdown: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#25D366",
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    overflow: "hidden",
    marginBottom: 4,
    maxHeight: 280,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  dropdownItemActive: { backgroundColor: "#F0FDF4" },
  dropdownItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
  },
  dropdownItemIconActive: { backgroundColor: "#25D366" },
  dropdownItemText: { flex: 1, fontSize: 14, color: "#374151", fontWeight: "500" },
  dropdownItemTextActive: { color: "#0F172A", fontWeight: "700" },

  // Image picker styles
  imagePicker: { borderRadius: 12, overflow: "hidden", marginTop: 4 },
  imagePreviewWrap: { position: "relative", width: "100%", height: 140 },
  imagePreview: { width: "100%", height: 140, borderRadius: 12 },
  imageOverlay: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: "rgba(0,0,0,0.45)", flexDirection: "row",
    alignItems: "center", justifyContent: "center",
    paddingVertical: 8, gap: 6,
    borderBottomLeftRadius: 12, borderBottomRightRadius: 12,
  },
  imageOverlayText: { color: "#FFFFFF", fontSize: 13, fontWeight: "600" },
  imagePlaceholder: {
    width: "100%", height: 110, backgroundColor: "#FFFFFF",
    borderWidth: 1.5, borderColor: "#E2E8F0", borderStyle: "dashed",
    borderRadius: 12, alignItems: "center", justifyContent: "center", gap: 4,
  },
  imagePlaceholderTitle: { fontSize: 14, color: "#374151", fontWeight: "500" },
  imagePlaceholderSub: { fontSize: 12, color: "#9CA3AF" },

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
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 24,
  },
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
