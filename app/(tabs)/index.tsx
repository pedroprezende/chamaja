import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import {
  ScrollView,
  Text,
  View,
  TextInput,
  FlatList,
  Image,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { ScreenContainer } from "@/components/screen-container";
import { AdsCarousel } from "@/components/ads-carousel";
import { sections, getSectionServices, subcategoriesByCategory, getSubcategoryById } from "@/data/mock";
import { adminDB, type Service } from "@/lib/admin-database";
import { trpc } from "@/lib/trpc";
import { useAds } from "@/hooks/use-ads";
import { useAuth } from "@/lib/auth-context";
import { useNotifications } from "@/lib/notifications-context";
import { StatusBar } from "expo-status-bar";

// ─── Constantes ──────────────────────────────────────────────────────────────

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

const ADMIN_CATEGORY_ICONS: Record<string, string> = {
  eletricista: "electrical-services",
  encanador: "plumbing",
  diarista: "cleaning-services",
  pintor: "format-paint",
  pedreiro: "construction",
  marceneiro: "carpenter",
  jardineiro: "yard",
  default: "build",
};

function getAdminIcon(category: string): string {
  const key = category
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  for (const k of Object.keys(ADMIN_CATEGORY_ICONS)) {
    if (key.includes(k)) return ADMIN_CATEGORY_ICONS[k];
  }
  return ADMIN_CATEGORY_ICONS.default;
}

function openWhatsApp(phone: string, serviceName: string) {
  let number = phone.replace(/\D/g, "");
  if (!number.startsWith("55")) number = "55" + number;
  const msg = encodeURIComponent(
    `Olá! Vi o serviço "${serviceName}" no ChamaJá e gostaria de mais informações. 😊`
  );
  Linking.openURL(`https://wa.me/${number}?text=${msg}`).catch(() =>
    Alert.alert("WhatsApp não encontrado", "Verifique se o WhatsApp está instalado.")
  );
}

// ─── Formulário vazio ─────────────────────────────────────────────────────
const EMPTY_FORM = {
  name: "",
  categoryId: "",
  subcategoryId: "",
  imageUri: "",
  whatsapp: "",
  description: "",
  address: "",
  gallery: [] as string[],
  showOnHome: true,
};

// ─── Componente principal ─────────────────────────────────────────────────────
export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const { ads, isLoading: adsLoading } = useAds(true);

  const isAdmin = user?.role === "admin";
  const firstName = user?.name?.split(" ")[0] || "você";

  // ── Serviços via tRPC (banco real) ──
  const { data: dbServices = [], isLoading: loadingServices, refetch: refetchServices } = trpc.services.list.useQuery(undefined, { refetchOnMount: true });

  const services = React.useMemo<Service[]>(() =>
    dbServices.map((s: any) => ({
      id: s.id,
      adminId: s.adminId,
      name: s.name,
      category: s.category,
      categoryId: s.categoryId ?? undefined,
      subcategoryId: s.subcategoryId ?? undefined,
      subcategoryName: s.subcategoryName ?? undefined,
      description: s.description ?? "",
      icon: s.icon ?? undefined,
      imageUri: s.imageUri ?? undefined,
      whatsapp: s.whatsapp ?? undefined,
      address: s.address ?? undefined,
      gallery: s.gallery ?? undefined,
      showOnHome: s.showOnHome,
      displayOrder: s.displayOrder,
      createdAt: s.createdAt instanceof Date ? s.createdAt.toISOString() : String(s.createdAt),
      updatedAt: s.updatedAt instanceof Date ? s.updatedAt.toISOString() : String(s.updatedAt),
      isActive: s.isActive,
    }))
  , [dbServices]);

  const loadServices = useCallback(() => { refetchServices(); }, [refetchServices]);

  const createServiceMutation = trpc.services.create.useMutation({ onSuccess: () => refetchServices() });
  const updateServiceMutation = trpc.services.update.useMutation({ onSuccess: () => refetchServices() });
  const deleteServiceMutation = trpc.services.delete.useMutation({ onSuccess: () => refetchServices() });
  const reorderServicesMutation = trpc.services.reorder.useMutation();

  // ── Categorias via tRPC ──
  const { data: dbCategories = [] } = trpc.categories.list.useQuery();
  const categories = dbCategories.length > 0 ? dbCategories : [];

  // ── Modo Edição ──
  const [editMode, setEditMode] = useState(false);

  const toggleEditMode = useCallback(() => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setEditMode((v) => !v);
  }, []);

  // ── Modal de criação/edição ──
  const [modalVisible, setModalVisible] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [catDropOpen, setCatDropOpen] = useState(false);
  const [subCatDropOpen, setSubCatDropOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const openCreate = useCallback(() => {
    setEditingService(null);
    setForm(EMPTY_FORM);
    setCatDropOpen(false);
    setModalVisible(true);
  }, []);

  const openEdit = useCallback((svc: Service) => {
    setEditingService(svc);
    setForm({
      name: svc.name,
      categoryId: svc.categoryId,
      subcategoryId: svc.subcategoryId || "",
      imageUri: svc.imageUri || "",
      whatsapp: svc.whatsapp || "",
      description: svc.description || "",
      address: svc.address || "",
      gallery: svc.gallery || [],
      showOnHome: svc.showOnHome,
    });
    setCatDropOpen(false);
    setModalVisible(true);
  }, []);

  const pickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permissão necessária", "Permita o acesso à galeria nas configurações.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setForm((f) => ({ ...f, imageUri: result.assets[0].uri }));
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!form.name.trim()) { Alert.alert("Atenção", "Informe o nome do serviço."); return; }
    if (!form.categoryId) { Alert.alert("Atenção", "Selecione uma categoria."); return; }
    setSaving(true);
    try {
      const catName = categories.find((c: any) => c.id === form.categoryId)?.name?.replace("\n", " ") || form.categoryId;
      const whatsapp = form.whatsapp.trim() || undefined;
      const description = form.description.trim() || undefined;
      const address = form.address.trim() || undefined;
      const gallery = form.gallery.length > 0 ? form.gallery : undefined;
      const subcatName = form.subcategoryId ? getSubcategoryById(form.subcategoryId)?.name : undefined;

      if (editingService) {
        await updateServiceMutation.mutateAsync({
          id: editingService.id,
          name: form.name.trim(),
          category: catName,
          categoryId: form.categoryId || undefined,
          subcategoryId: form.subcategoryId || undefined,
          subcategoryName: subcatName,
          imageUri: form.imageUri || undefined,
          whatsapp,
          description,
          address,
          gallery,
          showOnHome: form.showOnHome,
        });
      } else {
        await createServiceMutation.mutateAsync({
          name: form.name.trim(),
          category: catName,
          categoryId: form.categoryId || undefined,
          subcategoryId: form.subcategoryId || undefined,
          subcategoryName: subcatName,
          description,
          imageUri: form.imageUri || undefined,
          whatsapp,
          address,
          gallery,
          showOnHome: form.showOnHome,
        });
      }
      setModalVisible(false);
    } catch (e: any) {
      Alert.alert("Erro", e.message || "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }, [form, editingService, categories, createServiceMutation, updateServiceMutation]);

  const handleDelete = useCallback((svc: Service) => {
    Alert.alert(
      "Excluir serviço",
      `Tem certeza que deseja excluir "${svc.name}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            await deleteServiceMutation.mutateAsync({ id: svc.id });
          },
        },
      ]
    );
  }, [deleteServiceMutation]);

  // ── Drag-and-drop ──
  const handleDragEnd = useCallback(async ({ data }: { data: Service[] }) => {
    setServices(data);
    reorderServicesMutation.mutate({ ids: data.map((s) => s.id) });
  }, [reorderServicesMutation]);

  // ── Render card (modo edição: draggable) ──
  const renderDraggableCard = useCallback(
    ({ item, drag, isActive }: RenderItemParams<Service>) => (
      <ScaleDecorator>
        <View
          style={[
            styles.adminServiceCard,
            editMode && styles.adminServiceCardEdit,
            isActive && styles.adminServiceCardDragging,
          ]}
        >
          {/* Imagem / ícone */}
          <Pressable
            style={{ flex: 1 }}
            onPress={() =>
              !editMode &&
              router.push({
                pathname: "/admin-services/[serviceId]",
                params: { serviceId: item.id, title: item.name },
              } as any)
            }
            onLongPress={editMode ? drag : undefined}
          >
            {item.imageUri ? (
              <Image
                source={{ uri: item.imageUri }}
                style={styles.adminServiceImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.adminServiceIconBg}>
                <MaterialIcons
                  name={getAdminIcon(item.category) as any}
                  size={30}
                  color="#25D366"
                />
              </View>
            )}
            <View style={styles.adminServiceInfo}>
              <Text style={styles.adminServiceName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.adminServiceCategory} numberOfLines={1}>
                {item.category}
              </Text>
            </View>
          </Pressable>

          {/* Botão WhatsApp (sempre visível quando tem número) */}
          {!!item.whatsapp && !editMode && (
            <Pressable
              style={({ pressed }) => [styles.whatsappMiniBtn, pressed && { opacity: 0.7 }]}
              onPress={() => openWhatsApp(item.whatsapp!, item.name)}
            >
              <MaterialIcons name="chat" size={14} color="#FFFFFF" />
            </Pressable>
          )}

          {/* Botões de edição */}
          {editMode && (
            <View style={styles.editOverlay}>
              {/* Drag handle */}
              <Pressable style={styles.dragHandle} onLongPress={drag}>
                <MaterialIcons name="drag-indicator" size={18} color="#6B7280" />
              </Pressable>
              <View style={styles.editActions}>
                <Pressable
                  style={({ pressed }) => [styles.editBtn, pressed && { opacity: 0.7 }]}
                  onPress={() => openEdit(item)}
                >
                  <MaterialIcons name="edit" size={14} color="#FFFFFF" />
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.7 }]}
                  onPress={() => handleDelete(item)}
                >
                  <MaterialIcons name="delete" size={14} color="#FFFFFF" />
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </ScaleDecorator>
    ),
    [editMode, openEdit, handleDelete, router]
  );

  // ── Render card (modo normal: FlatList simples) ──
  const renderNormalCard = useCallback(
    (item: Service) => (
      <Pressable
        key={item.id}
        style={({ pressed }) => [styles.adminServiceCard, pressed && { opacity: 0.85 }]}
        onPress={() =>
          router.push({
            pathname: "/admin-services/[serviceId]",
            params: { serviceId: item.id, title: item.name },
          } as any)
        }
      >
        {item.imageUri ? (
          <Image
            source={{ uri: item.imageUri }}
            style={styles.adminServiceImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.adminServiceIconBg}>
            <MaterialIcons
              name={getAdminIcon(item.category) as any}
              size={30}
              color="#25D366"
            />
          </View>
        )}
        <View style={styles.adminServiceInfo}>
          <Text style={styles.adminServiceName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.adminServiceCategory} numberOfLines={1}>
            {item.category}
          </Text>
        </View>
        {!!item.whatsapp && (
          <Pressable
            style={({ pressed }) => [styles.whatsappMiniBtn, pressed && { opacity: 0.7 }]}
            onPress={() => openWhatsApp(item.whatsapp!, item.name)}
          >
            <MaterialIcons name="chat" size={14} color="#FFFFFF" />
          </Pressable>
        )}
      </Pressable>
    ),
    [router]
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ScreenContainer containerClassName="bg-[#F5F5F5]" className="">
        <StatusBar style="dark" backgroundColor="#FFFFFF" />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
          scrollEnabled={!editMode}
        >
          {/* ── Header ── */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Olá, {firstName}</Text>
            </View>
            <View style={styles.headerRight}>
              {/* Botão Modo Edição (apenas admin) */}
              {isAdmin && (
                <Pressable
                  style={({ pressed }) => [
                    styles.editModeBtn,
                    editMode && styles.editModeBtnActive,
                    pressed && { opacity: 0.7 },
                  ]}
                  onPress={toggleEditMode}
                >
                  <MaterialIcons
                    name={editMode ? "edit-off" : "edit"}
                    size={18}
                    color={editMode ? "#FFFFFF" : "#6B7280"}
                  />
                  {editMode && (
                    <Text style={styles.editModeBtnLabel}>Edição</Text>
                  )}
                </Pressable>
              )}
              {/* Notificações */}
              <Pressable
                style={({ pressed }) => [styles.bellBtn, pressed && { opacity: 0.7 }]}
                onPress={() => router.push("/notifications" as any)}
              >
                <View style={styles.bellWrapper}>
                  <MaterialIcons name="notifications-none" size={26} color="#111827" />
                  {unreadCount > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
                    </View>
                  )}
                </View>
              </Pressable>
            </View>
          </View>

          {/* ── Banner Modo Edição ── */}
          {editMode && (
            <View style={styles.editBanner}>
              <MaterialIcons name="admin-panel-settings" size={16} color="#FFFFFF" />
              <Text style={styles.editBannerText}>
                Modo Edição ativo — arraste para reordenar, toque nos ícones para editar/excluir
              </Text>
            </View>
          )}

          {/* ── Search Bar ── */}
          <Pressable
            style={styles.searchContainer}
            onPress={() => router.push("/search" as any)}
          >
            <MaterialIcons name="search" size={20} color="#9CA3AF" />
            <Text style={styles.searchPlaceholder}>O que você precisa?</Text>
          </Pressable>

          {/* ── Categorias ── */}
          <FlatList
            data={categories}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.categoriesContainer}
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [styles.categoryItem, pressed && { opacity: 0.7 }]}
                onPress={() => router.push(`/categories/${item.id}` as any)}
              >
                <View style={styles.categoryIconBox}>
                  <MaterialIcons
                    name={CATEGORY_ICONS[item.id] as any}
                    size={26}
                    color="#374151"
                  />
                </View>
                <Text style={styles.categoryLabel}>{item.name}</Text>
              </Pressable>
            )}
          />

          {/* ── Serviços do Admin ── */}
          {(loadingServices || services.length > 0 || editMode) && (
            <View style={styles.sectionWrapper}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <MaterialIcons name="admin-panel-settings" size={18} color="#25D366" />
                  <Text style={styles.sectionTitle}>Serviços Disponíveis</Text>
                </View>
                {/* Botão "+ Adicionar" no modo edição */}
                {editMode && (
                  <Pressable
                    style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.8 }]}
                    onPress={openCreate}
                  >
                    <MaterialIcons name="add" size={16} color="#FFFFFF" />
                    <Text style={styles.addBtnText}>Adicionar</Text>
                  </Pressable>
                )}
              </View>

              {loadingServices ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color="#25D366" />
                </View>
              ) : editMode ? (
                /* Drag-and-drop no modo edição */
                <DraggableFlatList
                  data={services}
                  horizontal
                  keyExtractor={(item) => item.id}
                  onDragEnd={handleDragEnd}
                  renderItem={renderDraggableCard}
                  contentContainerStyle={styles.adminServicesRow}
                  activationDistance={10}
                />
              ) : (
                /* FlatList normal */
                <FlatList
                  data={services}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.adminServicesRow}
                  renderItem={({ item }) => renderNormalCard(item)}
                />
              )}

              {/* Mensagem quando não há serviços no modo edição */}
              {editMode && services.length === 0 && !loadingServices && (
                <Pressable
                  style={({ pressed }) => [styles.emptyAddCard, pressed && { opacity: 0.8 }]}
                  onPress={openCreate}
                >
                  <MaterialIcons name="add-circle-outline" size={32} color="#25D366" />
                  <Text style={styles.emptyAddText}>Toque para adicionar o primeiro serviço</Text>
                </Pressable>
              )}
            </View>
          )}

          {/* ── Anúncios Patrocinados ── */}
          {!adsLoading && ads.length > 0 && (
            <View style={styles.sectionWrapper}>
              <View style={styles.sectionHeader}>
                <View style={styles.premiumHeaderRow}>
                  <MaterialIcons name="campaign" size={20} color="#25D366" />
                  <Text style={styles.sectionTitle}>Destaques</Text>
                </View>
              </View>
              <AdsCarousel ads={ads} />
            </View>
          )}

          {/* ── Sections (mock) ── */}
          {sections.map((section) => {
            const sectionServices = getSectionServices(section.id);
            return (
              <View key={section.id} style={styles.sectionWrapper}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                  <Pressable onPress={() => router.push(`/categories/${section.id}` as any)}>
                    <Text style={styles.seeAll}>Ver tudo</Text>
                  </Pressable>
                </View>
                <View style={styles.cardsRow}>
                  {sectionServices.map((service) => (
                    <Pressable
                      key={service.id}
                      style={({ pressed }) => [styles.serviceCard, pressed && { opacity: 0.85 }]}
                      onPress={() => router.push(`/professionals/${service.id}` as any)}
                    >
                      <Image
                        source={{ uri: service.image }}
                        style={styles.serviceImage}
                        resizeMode="cover"
                      />
                      <Text style={styles.serviceName} numberOfLines={2}>
                        {service.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* ── Modal de Criação/Edição ── */}
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
                  {editingService ? "Editar Serviço" : "Novo Serviço"}
                </Text>

                {/* Nome */}
                <Text style={styles.fieldLabel}>Nome do serviço *</Text>
                <TextInput
                  style={styles.textInput}
                  value={form.name}
                  onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
                  placeholder="Ex: Eletricista residencial"
                  placeholderTextColor="#9CA3AF"
                  returnKeyType="done"
                />

                {/* Categoria */}
                <Text style={styles.fieldLabel}>Categoria *</Text>
                <Pressable
                  style={styles.dropdownTrigger}
                  onPress={() => setCatDropOpen((v) => !v)}
                >
                  <Text style={[styles.dropdownTriggerText, !form.categoryId && { color: "#9CA3AF" }]}>
                    {form.categoryId
                      ? categories.find((c) => c.id === form.categoryId)?.name.replace("\n", " ") || form.categoryId
                      : "Selecionar categoria"}
                  </Text>
                  <MaterialIcons
                    name={catDropOpen ? "keyboard-arrow-up" : "keyboard-arrow-down"}
                    size={20}
                    color="#6B7280"
                  />
                </Pressable>
                {catDropOpen && (
                  <View style={styles.dropdownList}>
                    <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false} style={{ maxHeight: 220 }}>
                      {categories.map((cat) => (
                        <Pressable
                          key={cat.id}
                          style={({ pressed }) => [
                            styles.dropdownItem,
                            form.categoryId === cat.id && styles.dropdownItemSelected,
                            pressed && { backgroundColor: "#F0FDF4" },
                          ]}
                          onPress={() => {
                            setForm((f) => ({ ...f, categoryId: cat.id, subcategoryId: "" }));
                            setCatDropOpen(false);
                          }}
                        >
                          <MaterialIcons
                            name={CATEGORY_ICONS[cat.id] as any}
                            size={16}
                            color={form.categoryId === cat.id ? "#25D366" : "#6B7280"}
                          />
                          <Text style={[
                            styles.dropdownItemText,
                            form.categoryId === cat.id && styles.dropdownItemTextSelected,
                          ]}>
                            {cat.name.replace("\n", " ")}
                          </Text>
                          {form.categoryId === cat.id && (
                            <MaterialIcons name="check" size={16} color="#25D366" />
                          )}
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* Subcategoria (depende da categoria selecionada) */}
                {form.categoryId && (subcategoriesByCategory[form.categoryId]?.length ?? 0) > 0 && (
                  <>
                    <Text style={styles.fieldLabel}>Subcategoria</Text>
                    <Pressable
                      style={styles.dropdownTrigger}
                      onPress={() => setSubCatDropOpen((v) => !v)}
                    >
                      <Text style={[styles.dropdownTriggerText, !form.subcategoryId && { color: "#9CA3AF" }]}>
                        {form.subcategoryId
                          ? getSubcategoryById(form.subcategoryId)?.name || form.subcategoryId
                          : "Selecionar subcategoria (opcional)"}
                      </Text>
                      <MaterialIcons
                        name={subCatDropOpen ? "keyboard-arrow-up" : "keyboard-arrow-down"}
                        size={20}
                        color="#6B7280"
                      />
                    </Pressable>
                    {subCatDropOpen && (
                      <View style={styles.dropdownList}>
                        <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false} style={{ maxHeight: 220 }}>
                          {/* Opção para limpar */}
                          <Pressable
                            style={({ pressed }) => [
                              styles.dropdownItem,
                              !form.subcategoryId && styles.dropdownItemSelected,
                              pressed && { backgroundColor: "#F0FDF4" },
                            ]}
                            onPress={() => { setForm((f) => ({ ...f, subcategoryId: "" })); setSubCatDropOpen(false); }}
                          >
                            <MaterialIcons name="clear" size={16} color={!form.subcategoryId ? "#25D366" : "#9CA3AF"} />
                            <Text style={[styles.dropdownItemText, !form.subcategoryId && styles.dropdownItemTextSelected]}>
                              Nenhuma subcategoria
                            </Text>
                          </Pressable>
                          {(subcategoriesByCategory[form.categoryId] || []).map((sub) => (
                            <Pressable
                              key={sub.id}
                              style={({ pressed }) => [
                                styles.dropdownItem,
                                form.subcategoryId === sub.id && styles.dropdownItemSelected,
                                pressed && { backgroundColor: "#F0FDF4" },
                              ]}
                              onPress={() => { setForm((f) => ({ ...f, subcategoryId: sub.id })); setSubCatDropOpen(false); }}
                            >
                              <MaterialIcons
                                name={(sub.icon || "label") as any}
                                size={16}
                                color={form.subcategoryId === sub.id ? "#25D366" : "#6B7280"}
                              />
                              <Text style={[
                                styles.dropdownItemText,
                                form.subcategoryId === sub.id && styles.dropdownItemTextSelected,
                              ]}>
                                {sub.name}
                              </Text>
                              {form.subcategoryId === sub.id && (
                                <MaterialIcons name="check" size={16} color="#25D366" />
                              )}
                            </Pressable>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </>
                )}

                {/* Imagem */}
                <Text style={styles.fieldLabel}>Imagem de capa</Text>
                <Pressable
                  style={({ pressed }) => [styles.imagePicker, pressed && { opacity: 0.8 }]}
                  onPress={pickImage}
                >
                  {form.imageUri ? (
                    <>
                      <Image source={{ uri: form.imageUri }} style={styles.imagePreview} resizeMode="cover" />
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

                {/* WhatsApp */}
                <Text style={styles.fieldLabel}>WhatsApp do prestador</Text>
                <TextInput
                  style={styles.textInput}
                  value={form.whatsapp}
                  onChangeText={(v) => setForm((f) => ({ ...f, whatsapp: v }))}
                  placeholder="Ex: (11) 99999-9999"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  returnKeyType="done"
                />
                <Text style={styles.fieldHint}>
                  Ao tocar no serviço, o usuário será direcionado para este WhatsApp.
                </Text>

                {/* Descrição */}
                <Text style={styles.fieldLabel}>Descrição</Text>
                <TextInput
                  style={[styles.textInput, { height: 90, textAlignVertical: "top" }]}
                  value={form.description}
                  onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
                  placeholder="Ex: Especialidades, experiência, diferenciais..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={4}
                  returnKeyType="default"
                />

                {/* Endereço */}
                <Text style={styles.fieldLabel}>Endereço (bairro/cidade)</Text>
                <TextInput
                  style={styles.textInput}
                  value={form.address}
                  onChangeText={(v) => setForm((f) => ({ ...f, address: v }))}
                  placeholder="Ex: Centro, São Paulo - SP"
                  placeholderTextColor="#9CA3AF"
                  returnKeyType="done"
                />

                {/* Toggle Exibir na Home */}
                <Pressable
                  style={styles.toggleRow}
                  onPress={() => setForm((f) => ({ ...f, showOnHome: !f.showOnHome }))}
                >
                  <View>
                    <Text style={styles.toggleLabel}>Exibir na Home</Text>
                    <Text style={styles.toggleSub}>Aparece na seção "Serviços Disponíveis"</Text>
                  </View>
                  <View style={[styles.toggleSwitch, form.showOnHome && styles.toggleSwitchOn]}>
                    <View style={[styles.toggleThumb, form.showOnHome && styles.toggleThumbOn]} />
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
                        {editingService ? "Salvar alterações" : "Criar serviço"}
                      </Text>
                    )}
                  </Pressable>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </ScreenContainer>
    </GestureHandlerRootView>
  );
}

// ─── Estilos ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
  },
  greeting: { fontSize: 22, fontWeight: "700", color: "#111827" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  editModeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  editModeBtnActive: {
    backgroundColor: "#25D366",
    borderColor: "#25D366",
  },
  editModeBtnLabel: { fontSize: 12, fontWeight: "700", color: "#FFFFFF" },
  bellBtn: { padding: 4 },
  bellWrapper: { position: "relative" },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#EF4444",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: { color: "#FFFFFF", fontSize: 9, fontWeight: "700" },
  editBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#25D366",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  editBannerText: { flex: 1, fontSize: 12, color: "#FFFFFF", fontWeight: "500" },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  searchPlaceholder: { fontSize: 14, color: "#9CA3AF", flex: 1 },
  categoriesContainer: { paddingHorizontal: 16, paddingVertical: 16, gap: 12 },
  categoryItem: { alignItems: "center", width: 76, gap: 6 },
  categoryIconBox: {
    width: 60,
    height: 60,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryLabel: {
    fontSize: 11,
    color: "#374151",
    textAlign: "center",
    fontWeight: "500",
    lineHeight: 14,
  },
  sectionWrapper: { marginTop: 8, paddingHorizontal: 16 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: "#111827" },
  seeAll: { fontSize: 13, color: "#1A73E8", fontWeight: "500" },
  loadingRow: { height: 120, alignItems: "center", justifyContent: "center" },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#25D366",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addBtnText: { fontSize: 12, fontWeight: "700", color: "#FFFFFF" },
  adminServicesRow: { gap: 12, paddingBottom: 8 },
  adminServiceCard: {
    width: 130,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  adminServiceCardEdit: {
    borderColor: "#25D366",
    borderWidth: 2,
    shadowColor: "#25D366",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  adminServiceCardDragging: {
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    transform: [{ scale: 1.05 }],
  },
  adminServiceImage: { width: "100%", height: 90, backgroundColor: "#F3F4F6" },
  adminServiceIconBg: {
    width: "100%",
    height: 90,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#BBF7D0",
  },
  adminServiceInfo: { padding: 8, gap: 2 },
  adminServiceName: { fontSize: 12, fontWeight: "700", color: "#111827" },
  adminServiceCategory: { fontSize: 11, color: "#6B7280" },
  whatsappMiniBtn: {
    position: "absolute",
    bottom: 36,
    right: 6,
    backgroundColor: "#25D366",
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  editOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  dragHandle: { padding: 4 },
  editActions: { flexDirection: "row", gap: 4 },
  editBtn: {
    backgroundColor: "#3B82F6",
    borderRadius: 8,
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtn: {
    backgroundColor: "#EF4444",
    borderRadius: 8,
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyAddCard: {
    height: 100,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#25D366",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#F0FDF4",
    marginBottom: 8,
  },
  emptyAddText: { fontSize: 13, color: "#15803D", fontWeight: "500" },
  cardsRow: { flexDirection: "row", gap: 10, marginBottom: 8 },
  serviceCard: {
    flex: 1,
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
  serviceImage: { width: "100%", height: 90, backgroundColor: "#F3F4F6" },
  serviceName: {
    fontSize: 12,
    fontWeight: "500",
    color: "#111827",
    padding: 8,
    paddingTop: 6,
    lineHeight: 16,
  },
  premiumHeaderRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  // Modal
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)" },
  modalSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    maxHeight: "90%",
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#111827", marginBottom: 4 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6, marginTop: 14 },
  fieldHint: { fontSize: 11, color: "#9CA3AF", marginTop: 4, lineHeight: 16 },
  textInput: {
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#FAFAFA",
  },
  dropdownTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#FAFAFA",
  },
  dropdownTriggerText: { fontSize: 14, color: "#111827", flex: 1 },
  dropdownList: {
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    marginTop: 4,
    overflow: "hidden",
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  dropdownItemSelected: { backgroundColor: "#F0FDF4" },
  dropdownItemText: { flex: 1, fontSize: 14, color: "#374151" },
  dropdownItemTextSelected: { color: "#15803D", fontWeight: "600" },
  imagePicker: {
    height: 120,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    overflow: "hidden",
    backgroundColor: "#FAFAFA",
  },
  imagePreview: { width: "100%", height: "100%" },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  imageOverlayText: { color: "#FFFFFF", fontSize: 13, fontWeight: "600" },
  imagePlaceholder: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  imagePlaceholderText: { fontSize: 13, color: "#9CA3AF" },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    paddingVertical: 4,
  },
  toggleLabel: { fontSize: 14, fontWeight: "600", color: "#111827" },
  toggleSub: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },
  toggleSwitch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  toggleSwitchOn: { backgroundColor: "#25D366" },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbOn: { alignSelf: "flex-end" },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 24 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },
  cancelBtnText: { fontSize: 15, fontWeight: "600", color: "#374151" },
  saveBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#25D366",
    alignItems: "center",
  },
  saveBtnText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
});
