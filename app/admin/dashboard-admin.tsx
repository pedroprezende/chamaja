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
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { adminDB, type Service } from "@/lib/admin-database";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/lib/auth-context";
import { categories } from "@/data/mock";
import { useEffect, useState, useCallback, useRef } from "react";

const ADMIN_EMAIL = "pedroprezende33@gmail.com";

// Mapeamento de icones por categoria
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
      {item.imageUri ? (
        <Image source={{ uri: item.imageUri }} style={styles.cardThumbnail} resizeMode="cover" />
      ) : (
        <View style={styles.iconContainer}>
          <MaterialIcons name={iconName} size={28} color="#25D366" />
        </View>
      )}
      <View style={styles.cardInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{item.category}</Text>
          </View>
        </View>
        <Text style={styles.cardDescription} numberOfLines={2}>{item.description}</Text>
        <Pressable style={styles.homeToggleRow} onPress={onToggleHome}>
          <MaterialIcons name="home" size={14} color={item.showOnHome ? "#25D366" : "#9CA3AF"} />
          <Text style={[styles.homeToggleText, item.showOnHome && styles.homeToggleTextActive]}>
            {item.showOnHome ? "Visivel na Home" : "Oculto na Home"}
          </Text>
          <Switch
            value={item.showOnHome}
            onValueChange={onToggleHome}
            trackColor={{ false: "#E5E7EB", true: "#BBF7D0" }}
            thumbColor={item.showOnHome ? "#25D366" : "#9CA3AF"}
            style={{ transform: [{ scaleX: 0.75 }, { scaleY: 0.75 }] }}
          />
        </Pressable>
      </View>
      <View style={styles.cardActions}>
        <Pressable
          style={({ pressed }) => [styles.actionBtn, styles.editBtn, pressed && { opacity: 0.7 }]}
          onPress={onEdit}
        >
          <MaterialIcons name="edit" size={16} color="#3B82F6" />
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.actionBtn, styles.deleteBtn, pressed && { opacity: 0.7 }]}
          onPress={onDelete}
        >
          <MaterialIcons name="delete-outline" size={16} color="#EF4444" />
        </Pressable>
      </View>
    </View>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [searchText, setSearchText] = useState("");
  // Controla se o dropdown de categorias esta aberto DENTRO do modal
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
    (async () => {
      try {
        const raw = await AsyncStorage.getItem("@chamaja_user");
        if (!raw) { router.replace("/auth/login"); return; }
        const u = JSON.parse(raw);
        if (u.email !== ADMIN_EMAIL) { router.replace("/(tabs)"); return; }
        setAuthorized(true);
        const all = await adminDB.getAllServices();
        setServices(all);
      } catch {
        router.replace("/auth/login");
      }
    })();
  }, []);

  // LOGOUT: usa signOut do AuthContext que limpa o estado React + AsyncStorage corretamente
  const handleLogout = useCallback(() => {
    Alert.alert("Sair do Painel", "Tem certeza que deseja sair?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
          } catch {}
          // Navega independente do resultado do signOut
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
    Alert.alert("Deletar Servico", `Deletar "${serviceName}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Deletar",
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
      Alert.alert("Campos obrigatorios", "Preencha nome, categoria e descricao.");
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
        const raw = await AsyncStorage.getItem("@chamaja_user");
        const u = raw ? JSON.parse(raw) : { id: "admin" };
        const newService = await adminDB.createService(
          u.id,
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
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F5F5F5" }}>
        <Text style={{ color: "#6B7280" }}>Verificando acesso...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
          onPress={() => router.replace("/(tabs)")}
        >
          <MaterialIcons name="arrow-back" size={24} color="#111827" />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Painel Admin</Text>
          <Text style={styles.headerSubtitle}>
            {services.length} {services.length === 1 ? "servico" : "servicos"} • {homeCount} na Home
          </Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.7 }]}
          onPress={handleLogout}
        >
          <MaterialIcons name="logout" size={20} color="#EF4444" />
        </Pressable>
      </View>

      {/* Search + Add */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <MaterialIcons name="search" size={18} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar servico ou categoria..."
            placeholderTextColor="#9CA3AF"
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <Pressable onPress={() => setSearchText("")}>
              <MaterialIcons name="close" size={18} color="#9CA3AF" />
            </Pressable>
          )}
        </View>
        <Pressable
          style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.8 }]}
          onPress={openCreateModal}
        >
          <MaterialIcons name="add" size={22} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Stats bar */}
      <View style={styles.statsBar}>
        <MaterialIcons name="admin-panel-settings" size={15} color="#25D366" />
        <Text style={[styles.statsText, { flex: 1 }]}>
          Logado como <Text style={{ fontWeight: "700" }}>{user?.name || user?.email || "Admin"}</Text>
        </Text>
        <Pressable
          style={({ pressed }) => [styles.adsNavBtn, pressed && { opacity: 0.75 }]}
          onPress={() => router.push("/admin/services" as any)}
        >
          <MaterialIcons name="category" size={15} color="#25D366" />
          <Text style={[styles.adsNavText, { color: "#25D366" }]}>Serviços</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.adsNavBtn, pressed && { opacity: 0.75 }]}
          onPress={() => router.push("/admin/ads" as any)}
        >
          <MaterialIcons name="campaign" size={15} color="#1A73E8" />
          <Text style={styles.adsNavText}>Anúncios</Text>
        </Pressable>
      </View>

      {/* List */}
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
          <View style={styles.empty}>
            <MaterialIcons name="inbox" size={52} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>
              {searchText ? "Nenhum resultado" : "Nenhum servico ainda"}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchText ? "Tente outro termo" : 'Toque em "+" para criar'}
            </Text>
          </View>
        }
      />

      {/* Modal de criacao/edicao — SEM modal aninhado para categoria */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingService ? "Editar Servico" : "Novo Servico"}</Text>
              <Pressable
                style={({ pressed }) => [styles.modalCloseBtn, pressed && { opacity: 0.6 }]}
                onPress={() => setShowModal(false)}
              >
                <MaterialIcons name="close" size={22} color="#6B7280" />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
            >
              {/* Imagem */}
              <Text style={styles.fieldLabel}>Imagem de Capa</Text>
              <Pressable
                style={({ pressed }) => [styles.imagePickerBtn, pressed && { opacity: 0.8 }]}
                onPress={handlePickImage}
              >
                {formData.imageUri ? (
                  <View style={styles.imagePreviewWrapper}>
                    <Image source={{ uri: formData.imageUri }} style={styles.imagePreview} resizeMode="cover" />
                    <View style={styles.imageEditOverlay}>
                      <MaterialIcons name="edit" size={20} color="#FFFFFF" />
                      <Text style={styles.imageEditText}>Trocar foto</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <MaterialIcons name="add-photo-alternate" size={32} color="#9CA3AF" />
                    <Text style={styles.imagePlaceholderText}>Adicionar imagem de capa</Text>
                    <Text style={styles.imagePlaceholderSub}>Toque para selecionar da galeria</Text>
                  </View>
                )}
              </Pressable>

              {/* Nome */}
              <Text style={styles.fieldLabel}>Nome do Servico</Text>
              <View style={styles.fieldBox}>
                <MaterialIcons name="build" size={18} color="#9CA3AF" />
                <TextInput
                  style={styles.fieldInput}
                  placeholder="Ex: Eletricista Residencial"
                  placeholderTextColor="#9CA3AF"
                  value={formData.name}
                  onChangeText={(t) => setFormData({ ...formData, name: t })}
                  returnKeyType="next"
                />
              </View>

              {/* Categoria — dropdown INLINE (sem Modal aninhado) */}
              <Text style={styles.fieldLabel}>Categoria</Text>
              <Pressable
                style={({ pressed }) => [
                  styles.fieldBox,
                  styles.categorySelector,
                  showCategoryDropdown && styles.categorySelectorOpen,
                  pressed && { opacity: 0.85 },
                ]}
                onPress={() => setShowCategoryDropdown((v) => !v)}
              >
                {formData.categoryId ? (
                  <View style={styles.selectedCategoryRow}>
                    <View style={styles.selectedCategoryIcon}>
                      <MaterialIcons
                        name={getCategoryIcon(formData.categoryId) as any}
                        size={18}
                        color="#25D366"
                      />
                    </View>
                    <Text style={styles.selectedCategoryText}>{formData.category}</Text>
                  </View>
                ) : (
                  <>
                    <MaterialIcons name="category" size={18} color="#9CA3AF" />
                    <Text style={styles.categoryPlaceholder}>Selecionar categoria...</Text>
                  </>
                )}
                <MaterialIcons
                  name={showCategoryDropdown ? "expand-less" : "expand-more"}
                  size={20}
                  color="#9CA3AF"
                />
              </Pressable>

              {/* Lista de categorias inline — aparece abaixo do botao quando aberta */}
              {showCategoryDropdown && (
                <View style={styles.categoryDropdown}>
                  {categories.map((cat) => {
                    const isSelected = formData.categoryId === cat.id;
                    return (
                      <Pressable
                        key={cat.id}
                        style={({ pressed }) => [
                          styles.dropdownItem,
                          isSelected && styles.dropdownItemSelected,
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
                        <View style={[styles.dropdownItemIcon, isSelected && styles.dropdownItemIconSelected]}>
                          <MaterialIcons
                            name={getCategoryIcon(cat.id) as any}
                            size={18}
                            color={isSelected ? "#FFFFFF" : "#25D366"}
                          />
                        </View>
                        <Text style={[styles.dropdownItemText, isSelected && styles.dropdownItemTextSelected]}>
                          {cat.name.replace(/\n/g, " ")}
                        </Text>
                        {isSelected && <MaterialIcons name="check" size={16} color="#25D366" />}
                      </Pressable>
                    );
                  })}
                </View>
              )}

              {/* Descricao */}
              <Text style={styles.fieldLabel}>Descricao</Text>
              <View style={[styles.fieldBox, styles.fieldBoxMultiline]}>
                <TextInput
                  style={[styles.fieldInput, styles.fieldInputMultiline]}
                  placeholder="Descreva o servico..."
                  placeholderTextColor="#9CA3AF"
                  value={formData.description}
                  onChangeText={(t) => setFormData({ ...formData, description: t })}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              {/* Toggle Exibir na Home */}
              <View style={styles.homeToggleCard}>
                <View style={styles.homeToggleInfo}>
                  <MaterialIcons name="home" size={20} color={formData.showOnHome ? "#25D366" : "#6B7280"} />
                  <View>
                    <Text style={styles.homeToggleCardTitle}>Exibir na tela inicial</Text>
                    <Text style={styles.homeToggleCardSub}>
                      {formData.showOnHome ? "Visivel para todos os usuarios" : "Oculto da tela inicial"}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={formData.showOnHome}
                  onValueChange={(v) => setFormData({ ...formData, showOnHome: v })}
                  trackColor={{ false: "#E5E7EB", true: "#BBF7D0" }}
                  thumbColor={formData.showOnHome ? "#25D366" : "#9CA3AF"}
                />
              </View>

              <View style={styles.modalActions}>
                <Pressable
                  style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.7 }]}
                  onPress={() => setShowModal(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.8 }]}
                  onPress={handleSaveService}
                >
                  <MaterialIcons name={editingService ? "check" : "add"} size={18} color="#fff" />
                  <Text style={styles.saveBtnText}>{editingService ? "Salvar" : "Criar Servico"}</Text>
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
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  header: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF",
    paddingHorizontal: 12, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: "#F3F4F6", gap: 8,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: "center", justifyContent: "center", backgroundColor: "#F3F4F6",
  },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#111827" },
  headerSubtitle: { fontSize: 12, color: "#6B7280" },
  logoutBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: "center", justifyContent: "center", backgroundColor: "#FEF2F2",
  },
  searchRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 12, gap: 10,
    backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#F3F4F6",
  },
  searchBox: {
    flex: 1, flexDirection: "row", alignItems: "center",
    backgroundColor: "#F3F4F6", borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 9, gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: "#111827", padding: 0 },
  addBtn: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: "#25D366", alignItems: "center", justifyContent: "center",
  },
  statsBar: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 16, paddingVertical: 8, backgroundColor: "#F0FDF4",
  },
  statsText: { fontSize: 12, color: "#374151" },
  listContent: { padding: 16, paddingBottom: 32 },
  card: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF",
    borderRadius: 14, marginBottom: 10, overflow: "hidden",
    borderWidth: 1, borderColor: "#F3F4F6",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  cardThumbnail: { width: 72, height: 72, backgroundColor: "#F3F4F6" },
  iconContainer: {
    width: 72, height: 72, backgroundColor: "#F0FDF4",
    alignItems: "center", justifyContent: "center",
    borderRightWidth: 1, borderRightColor: "#E5E7EB",
  },
  cardInfo: { flex: 1, paddingHorizontal: 12, paddingVertical: 10, gap: 3 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  cardName: { fontSize: 14, fontWeight: "700", color: "#111827", flexShrink: 1 },
  categoryBadge: {
    backgroundColor: "#DBEAFE", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
  },
  categoryBadgeText: { fontSize: 10, fontWeight: "600", color: "#1D4ED8" },
  cardDescription: { fontSize: 12, color: "#6B7280", lineHeight: 16 },
  homeToggleRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  homeToggleText: { fontSize: 11, color: "#9CA3AF", flex: 1 },
  homeToggleTextActive: { color: "#25D366", fontWeight: "600" },
  cardActions: { flexDirection: "column", gap: 6, paddingRight: 10 },
  actionBtn: { width: 34, height: 34, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  editBtn: { backgroundColor: "#EFF6FF", borderWidth: 1, borderColor: "#BFDBFE" },
  deleteBtn: { backgroundColor: "#FEF2F2", borderWidth: 1, borderColor: "#FECACA" },
  empty: { alignItems: "center", paddingVertical: 60, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: "#374151" },
  emptySubtitle: { fontSize: 13, color: "#9CA3AF" },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: "#FFFFFF", borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingBottom: 40, maxHeight: "92%",
  },
  modalHandle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: "#E5E7EB",
    alignSelf: "center", marginTop: 12, marginBottom: 8,
  },
  modalHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 12, marginBottom: 4,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  modalCloseBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: "#F3F4F6",
    alignItems: "center", justifyContent: "center",
  },
  imagePickerBtn: { borderRadius: 12, overflow: "hidden", marginBottom: 4 },
  imagePreviewWrapper: { position: "relative", width: "100%", height: 140 },
  imagePreview: { width: "100%", height: 140, borderRadius: 12 },
  imageEditOverlay: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: "rgba(0,0,0,0.4)", flexDirection: "row",
    alignItems: "center", justifyContent: "center", paddingVertical: 7, gap: 5,
    borderBottomLeftRadius: 12, borderBottomRightRadius: 12,
  },
  imageEditText: { color: "#FFFFFF", fontSize: 13, fontWeight: "600" },
  imagePlaceholder: {
    width: "100%", height: 110, backgroundColor: "#F9FAFB",
    borderWidth: 1.5, borderColor: "#E5E7EB", borderStyle: "dashed",
    borderRadius: 12, alignItems: "center", justifyContent: "center", gap: 4,
  },
  imagePlaceholderText: { fontSize: 14, color: "#6B7280", fontWeight: "500" },
  imagePlaceholderSub: { fontSize: 12, color: "#9CA3AF" },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6, marginTop: 12 },
  fieldBox: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#F9FAFB",
    borderWidth: 1.5, borderColor: "#E5E7EB", borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 12, gap: 8,
  },
  fieldBoxMultiline: { alignItems: "flex-start", paddingTop: 12 },
  fieldInput: { flex: 1, fontSize: 14, color: "#111827", padding: 0 },
  fieldInputMultiline: { minHeight: 80, textAlignVertical: "top" },
  // Category selector inline
  categorySelector: { justifyContent: "space-between" },
  categorySelectorOpen: { borderColor: "#25D366", borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  selectedCategoryRow: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  selectedCategoryIcon: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: "#F0FDF4",
    alignItems: "center", justifyContent: "center",
  },
  selectedCategoryText: { fontSize: 14, color: "#111827", fontWeight: "500" },
  categoryPlaceholder: { flex: 1, fontSize: 14, color: "#9CA3AF" },
  // Dropdown inline de categorias
  categoryDropdown: {
    backgroundColor: "#FFFFFF", borderWidth: 1.5, borderColor: "#25D366",
    borderTopWidth: 0, borderBottomLeftRadius: 10, borderBottomRightRadius: 10,
    marginBottom: 4, maxHeight: 300, overflow: "hidden",
  },
  dropdownItem: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingVertical: 11, paddingHorizontal: 12,
    borderBottomWidth: 1, borderBottomColor: "#F3F4F6",
  },
  dropdownItemSelected: { backgroundColor: "#F0FDF4" },
  dropdownItemIcon: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: "#F0FDF4",
    alignItems: "center", justifyContent: "center",
  },
  dropdownItemIconSelected: { backgroundColor: "#25D366" },
  dropdownItemText: { flex: 1, fontSize: 14, color: "#374151", fontWeight: "500" },
  dropdownItemTextSelected: { color: "#111827", fontWeight: "700" },
  // Home toggle card
  homeToggleCard: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "#F9FAFB", borderWidth: 1.5, borderColor: "#E5E7EB",
    borderRadius: 12, padding: 14, marginTop: 12, gap: 12,
  },
  homeToggleInfo: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  homeToggleCardTitle: { fontSize: 14, fontWeight: "600", color: "#111827" },
  homeToggleCardSub: { fontSize: 12, color: "#6B7280" },
  // Modal actions
  modalActions: { flexDirection: "row", gap: 10, marginTop: 20, marginBottom: 8 },
  cancelBtn: {
    flex: 1, backgroundColor: "#F3F4F6", borderRadius: 12,
    paddingVertical: 14, alignItems: "center",
  },
  cancelBtnText: { fontSize: 15, fontWeight: "600", color: "#374151" },
  saveBtn: {
    flex: 2, backgroundColor: "#25D366", borderRadius: 12,
    paddingVertical: 14, flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 6,
  },
  saveBtnText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
  // Stats nav
  adsNavBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#EFF6FF", borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: "#BFDBFE",
  },
  adsNavText: { fontSize: 12, fontWeight: "700", color: "#1A73E8" },
});
