import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  FlatList,
  Image,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";

import { categories, services as mockServices, getServicesByCategory } from "@/data/mock";
import type { Service as MockService } from "@/data/mock";
import { useAdminServices } from "@/hooks/use-admin-services";
import { adminDB } from "@/lib/admin-database";
import type { Service as AdminService } from "@/lib/admin-database";
import { useAuth } from "@/lib/auth-context";

// ─── Tipos ────────────────────────────────────────────────────────────────────
type ServiceItem =
  | { source: "mock"; data: MockService }
  | { source: "admin"; data: AdminService };

// ─── Ícones por categoria ─────────────────────────────────────────────────────
const CATEGORY_ICONS: Record<string, string> = {
  "reformas-reparos":        "build",
  "assistencia-tecnica":     "settings",
  "servicos-domesticos":     "home",
  "servicos-externos":       "yard",
  "automotivo":              "directions-car",
  "beleza-estetica":         "content-cut",
  "servicos-profissionais":  "business-center",
  "saude":                   "local-hospital",
  "eventos":                 "celebration",
  "logistica":               "local-shipping",
  "educacao":                "school",
  "comercios":               "storefront",
  "mobilidade":              "commute",
};

// ─── Componente principal ─────────────────────────────────────────────────────
export default function AdminServicesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { services: adminServices, reload } = useAdminServices(false);

  // Estado do modal de criação/edição
  const [modalVisible, setModalVisible] = useState(false);
  const [editingService, setEditingService] = useState<AdminService | null>(null);
  const [formName, setFormName] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formImageUri, setFormImageUri] = useState("");
  const [formShowOnHome, setFormShowOnHome] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // ── Abrir modal para criar ──
  const openCreate = useCallback(() => {
    setEditingService(null);
    setFormName("");
    setFormCategoryId("");
    setFormImageUri("");
    setFormShowOnHome(false);
    setCategoryDropdownOpen(false);
    setModalVisible(true);
  }, []);

  // ── Abrir modal para editar ──
  const openEdit = useCallback((svc: AdminService) => {
    setEditingService(svc);
    setFormName(svc.name);
    setFormCategoryId(svc.categoryId || "");
    setFormImageUri(svc.imageUri || "");
    setFormShowOnHome(svc.showOnHome);
    setCategoryDropdownOpen(false);
    setModalVisible(true);
  }, []);

  // ── Selecionar imagem ──
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

  // ── Salvar (criar ou editar) ──
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
      if (editingService) {
        await adminDB.updateService(editingService.id, {
          name: formName.trim(),
          category: categoryName,
          categoryId: formCategoryId,
          imageUri: formImageUri || undefined,
          showOnHome: formShowOnHome,
        });
      } else {
        const adminId = user?.id || "admin-pedro";
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
  }, [formName, formCategoryId, formImageUri, formShowOnHome, editingService, user, reload]);

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

  // ── Montar lista de serviços por categoria ──
  // Para cada categoria: mock services + admin services dessa categoria
  const buildSectionData = useCallback((categoryId: string): ServiceItem[] => {
    const mock = getServicesByCategory(categoryId).map((s): ServiceItem => ({ source: "mock", data: s }));
    const admin = adminServices
      .filter((s) => s.categoryId === categoryId && s.isActive)
      .map((s): ServiceItem => ({ source: "admin", data: s }));
    return [...mock, ...admin];
  }, [adminServices]);

  // ── Renderizar card de serviço ──
  const renderServiceCard = useCallback(({ item }: { item: ServiceItem }) => {
    const isAdmin = item.source === "admin";
    const name = item.data.name;
    const imageUri = isAdmin
      ? (item.data as AdminService).imageUri
      : (item.data as MockService).image;

    return (
      <View style={styles.serviceCard}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.serviceImage} resizeMode="cover" />
        ) : (
          <View style={styles.serviceImagePlaceholder}>
            <MaterialIcons name="image" size={28} color="#D1D5DB" />
          </View>
        )}
        <Text style={styles.serviceName} numberOfLines={2}>{name}</Text>

        {/* Botões de ação — apenas para serviços admin */}
        {isAdmin && (
          <View style={styles.cardActions}>
            <Pressable
              style={({ pressed }) => [styles.editBtn, pressed && { opacity: 0.7 }]}
              onPress={() => openEdit(item.data as AdminService)}
            >
              <MaterialIcons name="edit" size={14} color="#3B82F6" />
              <Text style={styles.editBtnText}>Editar</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.7 }]}
              onPress={() => handleDeleteAdmin(item.data as AdminService)}
            >
              <MaterialIcons name="delete" size={14} color="#EF4444" />
              <Text style={styles.deleteBtnText}>Excluir</Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  }, [openEdit, handleDeleteAdmin]);

  // ── Renderizar seção "Em breve" ──
  const renderComingSoon = () => (
    <View style={styles.comingSoonCard}>
      <MaterialIcons name="schedule" size={28} color="#25D366" />
      <Text style={styles.comingSoonText}>Em breve</Text>
    </View>
  );

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

      {/* Botão "Adicionar novo serviço" */}
      <Pressable
        style={({ pressed }) => [styles.addServiceBanner, pressed && { opacity: 0.85 }]}
        onPress={openCreate}
      >
        <MaterialIcons name="add-circle-outline" size={20} color="#25D366" />
        <Text style={styles.addServiceBannerText}>Adicionar novo serviço</Text>
      </Pressable>

      {/* Conteúdo: seções por categoria */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {categories.map((cat) => {
          const items = buildSectionData(cat.id);
          const catName = cat.name.replace("\n", " ");
          return (
            <View key={cat.id} style={styles.section}>
              {/* Título da seção */}
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <MaterialIcons
                    name={CATEGORY_ICONS[cat.id] as any || "category"}
                    size={18}
                    color="#25D366"
                  />
                  <Text style={styles.sectionTitle}>{catName}</Text>
                </View>
                <Text style={styles.sectionCount}>{items.length} serviço{items.length !== 1 ? "s" : ""}</Text>
              </View>

              {/* Cards horizontais ou "Em breve" */}
              {items.length === 0 ? (
                renderComingSoon()
              ) : (
                <FlatList
                  data={items}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item) => `${item.source}-${item.data.id}`}
                  contentContainerStyle={styles.cardsRow}
                  renderItem={renderServiceCard}
                />
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Modal de criação/edição */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setModalVisible(false)} />
          <View style={styles.modalSheet}>
            {/* Handle */}
            <View style={styles.modalHandle} />

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>
                {editingService ? "Editar Serviço" : "Novo Serviço"}
              </Text>

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
                        name={CATEGORY_ICONS[cat.id] as any || "category"}
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

              {/* Exibir na Home */}
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
                  style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85 }, saving && { opacity: 0.6 }]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.saveBtnText}>
                      {editingService ? "Salvar alterações" : "Criar serviço"}
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

  // Header
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
    width: 40, height: 40,
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 17, fontWeight: "700", color: "#111827",
    textAlign: "center",
  },
  addBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "#25D366",
    alignItems: "center", justifyContent: "center",
  },

  // Banner de adicionar
  addServiceBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F0FDF4",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    borderStyle: "dashed",
  },
  addServiceBannerText: {
    fontSize: 14, fontWeight: "600", color: "#25D366",
  },

  // Scroll
  scrollContent: { paddingBottom: 32 },

  // Seção
  section: { marginTop: 16, paddingHorizontal: 16 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#111827" },
  sectionCount: { fontSize: 12, color: "#9CA3AF" },
  cardsRow: { gap: 10, paddingBottom: 4 },

  // Card de serviço
  serviceCard: {
    width: 120,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
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
    padding: 6, paddingTop: 4, lineHeight: 15,
  },
  cardActions: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  editBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 3, paddingVertical: 6,
    borderRightWidth: 0.5, borderRightColor: "#F3F4F6",
  },
  editBtnText: { fontSize: 11, fontWeight: "600", color: "#3B82F6" },
  deleteBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 3, paddingVertical: 6,
  },
  deleteBtnText: { fontSize: 11, fontWeight: "600", color: "#EF4444" },

  // "Em breve"
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
    maxHeight: "90%",
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: "#E5E7EB",
    alignSelf: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18, fontWeight: "700", color: "#111827",
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 13, fontWeight: "600", color: "#374151",
    marginBottom: 6, marginTop: 14,
  },
  textInput: {
    borderWidth: 1.5, borderColor: "#E5E7EB",
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: "#111827", backgroundColor: "#FAFAFA",
  },

  // Dropdown
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
    maxHeight: 260,
  },
  dropdownItem: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 0.5, borderBottomColor: "#F3F4F6",
  },
  dropdownItemSelected: { backgroundColor: "#F0FDF4" },
  dropdownItemText: { flex: 1, fontSize: 14, color: "#374151" },
  dropdownItemTextSelected: { color: "#25D366", fontWeight: "600" },

  // Image picker
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

  // Toggle
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

  // Botões do modal
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
