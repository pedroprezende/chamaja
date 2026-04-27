import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Image,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";

import { useAuth } from "@/lib/auth-context";
import { adminDB, type Service as AdminService } from "@/lib/admin-database";
import { useAdminServices } from "@/hooks/use-admin-services";
import { categories, services as mockServices, type Service as MockService } from "@/data/mock";

const CATEGORY_ICONS: Record<string, string> = {
  "reformas-reparos":       "build",
  "assistencia-tecnica":    "settings",
  "servicos-domesticos":    "home",
  "servicos-externos":      "yard",
  "automotivo":             "directions-car",
  "beleza-estetica":        "content-cut",
  "servicos-profissionais": "business-center",
  "saude":                  "local-hospital",
  "eventos":                "celebration",
  "logistica":              "local-shipping",
  "educacao":               "school",
  "comercios":              "storefront",
  "mobilidade":             "commute",
};

// Um item pode ser mock ou admin
type ServiceItem =
  | { source: "mock"; data: MockService }
  | { source: "admin"; data: AdminService };

export default function AdminServicesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { services: adminServices, reload } = useAdminServices(false);

  // Estado do modal
  const [modalVisible, setModalVisible] = useState(false);
  const [editingService, setEditingService] = useState<AdminService | null>(null);
  const [editingMockId, setEditingMockId] = useState<string | null>(null); // ID do mock sendo editado
  const [formName, setFormName] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formImageUri, setFormImageUri] = useState("");
  const [formShowOnHome, setFormShowOnHome] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // ── Abrir modal para criar novo ──
  const openCreate = useCallback(() => {
    setEditingService(null);
    setEditingMockId(null);
    setFormName("");
    setFormCategoryId("");
    setFormImageUri("");
    setFormShowOnHome(false);
    setCategoryDropdownOpen(false);
    setModalVisible(true);
  }, []);

  // ── Abrir modal para editar serviço admin existente ──
  const openEditAdmin = useCallback((svc: AdminService) => {
    setEditingService(svc);
    setEditingMockId(null);
    setFormName(svc.name);
    setFormCategoryId(svc.categoryId || "");
    setFormImageUri(svc.imageUri || "");
    setFormShowOnHome(svc.showOnHome);
    setCategoryDropdownOpen(false);
    setModalVisible(true);
  }, []);

  // ── Abrir modal para editar serviço mock ──
  // Cria uma cópia editável no adminDB (override)
  const openEditMock = useCallback((svc: MockService) => {
    // Verificar se já existe um override admin para este mock
    const existingOverride = adminServices.find(
      (s) => s.id === `override-${svc.id}` || s.name === svc.name && s.categoryId === svc.categoryId
    );
    if (existingOverride) {
      openEditAdmin(existingOverride);
      return;
    }
    setEditingService(null);
    setEditingMockId(svc.id);
    setFormName(svc.name);
    setFormCategoryId(svc.categoryId);
    setFormImageUri(svc.image || "");
    setFormShowOnHome(false);
    setCategoryDropdownOpen(false);
    setModalVisible(true);
  }, [adminServices, openEditAdmin]);

  // ── Selecionar imagem da galeria ──
  const pickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permissão necessária", "Permita o acesso à galeria para adicionar imagens.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setFormImageUri(result.assets[0].uri);
    }
  }, []);

  // ── Salvar (criar, editar admin ou editar mock) ──
  const handleSave = useCallback(async () => {
    if (!formName.trim()) {
      Alert.alert("Atenção", "Informe o nome do serviço.");
      return;
    }
    if (!formCategoryId) {
      Alert.alert("Atenção", "Selecione uma categoria.");
      return;
    }
    setSaving(true);
    try {
      const categoryName = categories.find((c) => c.id === formCategoryId)?.name.replace("\n", " ") || formCategoryId;
      const adminId = user?.id || "admin-pedro";

      if (editingService) {
        // Editar serviço admin existente
        await adminDB.updateService(editingService.id, {
          name: formName.trim(),
          category: categoryName,
          categoryId: formCategoryId,
          imageUri: formImageUri || undefined,
          showOnHome: formShowOnHome,
        });
      } else if (editingMockId) {
        // Criar override do serviço mock
        await adminDB.createService(
          adminId,
          formName.trim(),
          categoryName,
          "",
          undefined,
          formImageUri || undefined,
          formCategoryId,
          formShowOnHome
        );
      } else {
        // Criar novo serviço
        await adminDB.createService(
          adminId,
          formName.trim(),
          categoryName,
          "",
          undefined,
          formImageUri || undefined,
          formCategoryId,
          formShowOnHome
        );
      }
      reload();
      setModalVisible(false);
    } catch (e: any) {
      Alert.alert("Erro", e.message || "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }, [formName, formCategoryId, formImageUri, formShowOnHome, editingService, editingMockId, user, reload]);

  // ── Excluir serviço admin ──
  const handleDeleteAdmin = useCallback((svc: AdminService) => {
    Alert.alert(
      "Excluir serviço",
      `Tem certeza que deseja excluir "${svc.name}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            await adminDB.deleteService(svc.id);
            reload();
          },
        },
      ]
    );
  }, [reload]);

  // ── Montar lista de itens por categoria ──
  const buildSectionData = useCallback((categoryId: string): ServiceItem[] => {
    const mock = mockServices
      .filter((s) => s.categoryId === categoryId)
      .map((s): ServiceItem => ({ source: "mock", data: s }));
    const admin = adminServices
      .filter((s) => s.categoryId === categoryId && s.isActive)
      .map((s): ServiceItem => ({ source: "admin", data: s }));
    return [...mock, ...admin];
  }, [adminServices]);

  // ── Renderizar card ──
  const renderCard = (item: ServiceItem, index: number) => {
    const isAdmin = item.source === "admin";
    const name = item.data.name;
    const imageUri = isAdmin
      ? (item.data as AdminService).imageUri
      : (item.data as MockService).image;

    return (
      <View key={`${item.source}-${item.data.id}-${index}`} style={styles.serviceCard}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.serviceImage} resizeMode="cover" />
        ) : (
          <View style={styles.serviceImagePlaceholder}>
            <MaterialIcons name="image" size={28} color="#D1D5DB" />
          </View>
        )}
        <Text style={styles.serviceName} numberOfLines={2}>{name}</Text>
        {/* Botões de ação — disponíveis para TODOS os serviços */}
        <View style={styles.cardActions}>
          <Pressable
            style={({ pressed }) => [styles.editBtn, pressed && { opacity: 0.7 }]}
            onPress={() => {
              if (isAdmin) {
                openEditAdmin(item.data as AdminService);
              } else {
                openEditMock(item.data as MockService);
              }
            }}
          >
            <MaterialIcons name="edit" size={14} color="#3B82F6" />
            <Text style={styles.editBtnText}>Editar</Text>
          </Pressable>
          {isAdmin && (
            <Pressable
              style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.7 }]}
              onPress={() => handleDeleteAdmin(item.data as AdminService)}
            >
              <MaterialIcons name="delete" size={14} color="#EF4444" />
              <Text style={styles.deleteBtnText}>Excluir</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  };

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
        <Text style={styles.headerTitle}>Gerenciar Serviços</Text>
        <Pressable
          style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.8 }]}
          onPress={openCreate}
        >
          <MaterialIcons name="add" size={22} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Banner adicionar */}
      <Pressable
        style={({ pressed }) => [styles.addServiceBanner, pressed && { opacity: 0.85 }]}
        onPress={openCreate}
      >
        <MaterialIcons name="add-circle-outline" size={20} color="#25D366" />
        <Text style={styles.addServiceBannerText}>Adicionar novo serviço</Text>
      </Pressable>

      {/* Conteúdo */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {categories.map((cat) => {
          const items = buildSectionData(cat.id);
          const catName = cat.name.replace("\n", " ");
          return (
            <View key={cat.id} style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <MaterialIcons
                    name={(CATEGORY_ICONS[cat.id] as any) || "category"}
                    size={18}
                    color="#25D366"
                  />
                  <Text style={styles.sectionTitle}>{catName}</Text>
                </View>
                <Text style={styles.sectionCount}>
                  {items.length} serviço{items.length !== 1 ? "s" : ""}
                </Text>
              </View>

              {items.length === 0 ? (
                <View style={styles.comingSoonCard}>
                  <MaterialIcons name="schedule" size={24} color="#25D366" />
                  <Text style={styles.comingSoonText}>Em breve</Text>
                </View>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.cardsRow}
                >
                  {items.map((item, idx) => renderCard(item, idx))}
                </ScrollView>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Modal de criação/edição */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setModalVisible(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={styles.modalTitle}>
                {editingService
                  ? "Editar Serviço"
                  : editingMockId
                  ? "Editar Serviço Existente"
                  : "Novo Serviço"}
              </Text>

              {editingMockId && (
                <View style={styles.infoBox}>
                  <MaterialIcons name="info-outline" size={16} color="#3B82F6" />
                  <Text style={styles.infoBoxText}>
                    Você está editando um serviço padrão. As alterações serão salvas como uma versão personalizada.
                  </Text>
                </View>
              )}

              {/* Nome */}
              <Text style={styles.fieldLabel}>Nome do serviço *</Text>
              <TextInput
                style={styles.textInput}
                value={formName}
                onChangeText={setFormName}
                placeholder="Ex: Eletricista residencial"
                placeholderTextColor="#9CA3AF"
                returnKeyType="done"
              />

              {/* Categoria */}
              <Text style={styles.fieldLabel}>Categoria *</Text>
              <Pressable
                style={styles.dropdownTrigger}
                onPress={() => setCategoryDropdownOpen((v) => !v)}
              >
                <Text style={[styles.dropdownTriggerText, !formCategoryId && { color: "#9CA3AF" }]}>
                  {formCategoryId
                    ? categories.find((c) => c.id === formCategoryId)?.name.replace("\n", " ") || formCategoryId
                    : "Selecionar categoria"}
                </Text>
                <MaterialIcons
                  name={categoryDropdownOpen ? "keyboard-arrow-up" : "keyboard-arrow-down"}
                  size={20}
                  color="#6B7280"
                />
              </Pressable>
              {categoryDropdownOpen && (
                <View style={styles.dropdownList}>
                  <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false} style={{ maxHeight: 260 }}>
                    {categories.map((cat) => (
                      <Pressable
                        key={cat.id}
                        style={({ pressed }) => [
                          styles.dropdownItem,
                          formCategoryId === cat.id && styles.dropdownItemSelected,
                          pressed && { backgroundColor: "#F0FDF4" },
                        ]}
                        onPress={() => {
                          setFormCategoryId(cat.id);
                          setCategoryDropdownOpen(false);
                        }}
                      >
                        <MaterialIcons
                          name={(CATEGORY_ICONS[cat.id] as any) || "category"}
                          size={16}
                          color={formCategoryId === cat.id ? "#25D366" : "#6B7280"}
                        />
                        <Text style={[
                          styles.dropdownItemText,
                          formCategoryId === cat.id && styles.dropdownItemTextSelected,
                        ]}>
                          {cat.name.replace("\n", " ")}
                        </Text>
                        {formCategoryId === cat.id && (
                          <MaterialIcons name="check" size={16} color="#25D366" />
                        )}
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Imagem */}
              <Text style={styles.fieldLabel}>Imagem de capa</Text>
              <Pressable
                style={({ pressed }) => [styles.imagePicker, pressed && { opacity: 0.8 }]}
                onPress={pickImage}
              >
                {formImageUri ? (
                  <>
                    <Image source={{ uri: formImageUri }} style={styles.imagePreview} resizeMode="cover" />
                    <View style={styles.imageOverlay}>
                      <MaterialIcons name="photo-camera" size={20} color="#FFFFFF" />
                      <Text style={styles.imageOverlayText}>Trocar foto</Text>
                    </View>
                  </>
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <MaterialIcons name="add-photo-alternate" size={32} color="#9CA3AF" />
                    <Text style={styles.imagePlaceholderText}>Toque para adicionar imagem</Text>
                  </View>
                )}
              </Pressable>

              {/* Toggle Exibir na Home */}
              <Pressable
                style={styles.toggleRow}
                onPress={() => setFormShowOnHome((v) => !v)}
              >
                <View>
                  <Text style={styles.toggleLabel}>Exibir na Home</Text>
                  <Text style={styles.toggleSub}>Aparece na seção "Serviços Disponíveis"</Text>
                </View>
                <View style={[styles.toggleSwitch, formShowOnHome && styles.toggleSwitchOn]}>
                  <View style={[styles.toggleThumb, formShowOnHome && styles.toggleThumbOn]} />
                </View>
              </Pressable>

              {/* Botões */}
              <View style={styles.modalActions}>
                <Pressable
                  style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.7 }]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85 }]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.saveBtnText}>
                      {editingService || editingMockId ? "Salvar alterações" : "Criar serviço"}
                    </Text>
                  )}
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E7EB",
    gap: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "#F3F4F6",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: "700", color: "#111827" },
  addBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "#25D366",
    alignItems: "center", justifyContent: "center",
  },
  addServiceBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: "#25D366",
    borderStyle: "dashed",
  },
  addServiceBannerText: { fontSize: 14, fontWeight: "600", color: "#25D366" },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 40, paddingTop: 8 },
  section: { marginTop: 20 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#111827" },
  sectionCount: { fontSize: 12, color: "#9CA3AF" },
  cardsRow: { gap: 10, paddingBottom: 4 },
  serviceCard: {
    width: 130,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  serviceImage: { width: "100%", height: 80, backgroundColor: "#F3F4F6" },
  serviceImagePlaceholder: {
    width: "100%", height: 80,
    backgroundColor: "#F9FAFB",
    alignItems: "center", justifyContent: "center",
  },
  serviceName: {
    fontSize: 11, fontWeight: "500", color: "#111827",
    padding: 6, paddingTop: 4, lineHeight: 15, minHeight: 36,
  },
  cardActions: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  editBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 3, paddingVertical: 7,
    borderRightWidth: 0.5, borderRightColor: "#F3F4F6",
  },
  editBtnText: { fontSize: 11, fontWeight: "600", color: "#3B82F6" },
  deleteBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 3, paddingVertical: 7,
  },
  deleteBtnText: { fontSize: 11, fontWeight: "600", color: "#EF4444" },
  comingSoonCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#F0FDF4",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  comingSoonText: { fontSize: 14, fontWeight: "600", color: "#25D366" },
  // Modal
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  modalSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
    maxHeight: "92%",
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: "#E5E7EB",
    alignSelf: "center",
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#111827", marginBottom: 12 },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#EFF6FF",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  infoBoxText: { flex: 1, fontSize: 12, color: "#1D4ED8", lineHeight: 18 },
  fieldLabel: {
    fontSize: 13, fontWeight: "600", color: "#374151",
    marginBottom: 6, marginTop: 14,
  },
  textInput: {
    borderWidth: 1.5, borderColor: "#E5E7EB",
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: "#111827", backgroundColor: "#FAFAFA",
  },
  dropdownTrigger: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    borderWidth: 1.5, borderColor: "#E5E7EB",
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: "#FAFAFA",
  },
  dropdownTriggerText: { fontSize: 14, color: "#111827", flex: 1 },
  dropdownList: {
    borderWidth: 1.5, borderColor: "#E5E7EB",
    borderRadius: 10, marginTop: 4,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  dropdownItem: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 0.5, borderBottomColor: "#F3F4F6",
  },
  dropdownItemSelected: { backgroundColor: "#F0FDF4" },
  dropdownItemText: { flex: 1, fontSize: 14, color: "#374151" },
  dropdownItemTextSelected: { color: "#25D366", fontWeight: "600" },
  imagePicker: {
    height: 140, borderRadius: 12,
    borderWidth: 1.5, borderColor: "#E5E7EB",
    overflow: "hidden", backgroundColor: "#F9FAFB",
  },
  imagePreview: { width: "100%", height: "100%" },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center", justifyContent: "center",
    gap: 4,
  },
  imageOverlayText: { color: "#FFFFFF", fontSize: 13, fontWeight: "600" },
  imagePlaceholder: {
    flex: 1, alignItems: "center", justifyContent: "center", gap: 8,
  },
  imagePlaceholderText: { fontSize: 13, color: "#9CA3AF" },
  toggleRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginTop: 16, paddingVertical: 4,
  },
  toggleLabel: { fontSize: 14, fontWeight: "600", color: "#111827" },
  toggleSub: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  toggleSwitch: {
    width: 46, height: 26, borderRadius: 13,
    backgroundColor: "#D1D5DB", padding: 2,
    justifyContent: "center",
  },
  toggleSwitchOn: { backgroundColor: "#25D366" },
  toggleThumb: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbOn: { alignSelf: "flex-end" },
  modalActions: {
    flexDirection: "row", gap: 12, marginTop: 24,
  },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    borderWidth: 1.5, borderColor: "#E5E7EB",
    alignItems: "center",
  },
  cancelBtnText: { fontSize: 15, fontWeight: "600", color: "#6B7280" },
  saveBtn: {
    flex: 2, paddingVertical: 14, borderRadius: 12,
    backgroundColor: "#25D366",
    alignItems: "center",
  },
  saveBtnText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
});
