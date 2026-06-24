import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Modal,
  ActivityIndicator,
  Platform,
  Alert,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "expo-router";
import { AdminTabBar } from "@/components/admin/AdminTabBar";
import { trpc } from "@/lib/trpc";

// ── Ícones disponíveis para categorias ───────────────────────────────────────
const ICONS = [
  "build",
  "settings",
  "home",
  "content-cut",
  "directions-car",
  "school",
  "celebration",
  "business-center",
  "local-hospital",
  "local-shipping",
  "storefront",
  "commute",
  "yard",
  "plumbing",
  "cleaning-services",
  "electrical-services",
  "restaurant",
  "fitness-center",
  "pets",
  "security",
  "eco",
  "computer",
];

type Tab = "categorias" | "ordem";

export default function ServicosAdmin() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("categorias");

  // ── tRPC Queries e Mutations ──────────────────────────────────────────────
  const utils = trpc.useUtils();
  const {
    data: categories = [],
    isLoading: loading,
    error,
  } = trpc.categories.all.useQuery();
  const { data: allSubServices = [] } =
    trpc.categories.subServices.listAll.useQuery();

  useEffect(() => {
    console.log("[Admin Debug] Categorias carregadas:", categories.length);
    if (error)
      console.error("[Admin Debug] Erro ao carregar categorias:", error);
  }, [categories, error]);
  const createCategory = trpc.categories.create.useMutation({
    onSuccess: () => {
      utils.categories.all.invalidate();
      setShowAddCat(false);
      setNewCatName("");
    },
  });

  const deleteCategory = trpc.categories.delete.useMutation({
    onSuccess: () => utils.categories.all.invalidate(),
  });

  const reorderCategories = trpc.categories.reorder.useMutation({
    onSuccess: () => utils.categories.all.invalidate(),
  });

  // ── Modal: nova categoria ─────────────────────────────────────────────────
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("build");
  const [saving, setSaving] = useState(false);

  // ── Modal: sub-serviços da categoria ─────────────────────────────────────
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const selectedCat = categories.find((c) => c.id === selectedCatId);

  const { data: subServices = [], isLoading: loadingSubs } =
    trpc.categories.subServices.list.useQuery(
      { categoryId: selectedCatId! },
      { enabled: !!selectedCatId },
    );

  const createSubService = trpc.categories.subServices.create.useMutation({
    onSuccess: () => {
      utils.categories.subServices.list.invalidate({
        categoryId: selectedCatId!,
      });
      setShowAddSub(false);
      setNewSubName("");
    },
  });

  const deleteSubService = trpc.categories.subServices.delete.useMutation({
    onSuccess: () =>
      utils.categories.subServices.list.invalidate({
        categoryId: selectedCatId!,
      }),
  });

  const [showAddSub, setShowAddSub] = useState(false);
  const [newSubName, setNewSubName] = useState("");
  const [newSubIcon, setNewSubIcon] = useState("build");

  // ── Adicionar categoria ───────────────────────────────────────────────────
  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    setSaving(true);
    try {
      await createCategory.mutateAsync({ name: newCatName, icon: newCatIcon });
    } catch (err) {
      alert("Erro ao adicionar categoria");
    } finally {
      setSaving(false);
    }
  };

  // ── Excluir categoria ─────────────────────────────────────────────────────
  const handleDeleteCategory = (id: string, name: string) => {
    const doDelete = async () => {
      try {
        await deleteCategory.mutateAsync({ id });
      } catch (err) {
        alert("Erro ao excluir categoria");
      }
    };
    if (Platform.OS === "web") {
      if (window.confirm(`Remover "${name}" e todos os seus serviços?`))
        doDelete();
    } else {
      Alert.alert(
        "Remover categoria",
        `Remover "${name}" e todos os seus serviços?`,
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Remover", style: "destructive", onPress: doDelete },
        ],
      );
    }
  };

  // ── Reordenar (mover para cima/baixo) ────────────────────────────────────
  const moveCategory = async (id: string, dir: "up" | "down") => {
    const idx = categories.findIndex((c) => c.id === id);
    if (dir === "up" && idx <= 0) return;
    if (dir === "down" && idx >= categories.length - 1) return;
    const next = [...categories];
    const swap = dir === "up" ? idx - 1 : idx + 1;
    [next[idx], next[swap]] = [next[swap], next[idx]];

    try {
      await reorderCategories.mutateAsync({ ids: next.map((c) => c.id) });
    } catch (err) {
      alert("Erro ao reordenar");
    }
  };

  // ── Adicionar sub-serviço ─────────────────────────────────────────────────
  const handleAddSub = async () => {
    if (!newSubName.trim() || !selectedCatId) return;
    setSaving(true);
    try {
      await createSubService.mutateAsync({
        categoryId: selectedCatId,
        name: newSubName,
        icon: newSubIcon,
      });
    } catch (err) {
      alert("Erro ao adicionar serviço");
    } finally {
      setSaving(false);
    }
  };

  // ── Excluir sub-serviço ───────────────────────────────────────────────────
  const handleDeleteSub = (id: string, name: string) => {
    const doDelete = async () => {
      try {
        await deleteSubService.mutateAsync({ id });
      } catch (err) {
        alert("Erro ao excluir serviço");
      }
    };
    if (Platform.OS === "web") {
      if (window.confirm(`Remover "${name}"?`)) doDelete();
    } else {
      Alert.alert("Remover serviço", `Remover "${name}"?`, [
        { text: "Cancelar", style: "cancel" },
        { text: "Remover", style: "destructive", onPress: doDelete },
      ]);
    }
  };

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable
          style={styles.backBtn}
          onPress={() => router.push("/admin/dashboard-admin" as any)}
        >
          <MaterialIcons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text style={styles.headerTitle}>Serviços</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Pressable
            style={[styles.addBtn, { backgroundColor: "#EFF6FF" }]}
            onPress={() => router.push("/admin/subcategory-images" as any)}
          >
            <MaterialIcons name="image" size={20} color="#2563EB" />
          </Pressable>
          <Pressable style={styles.addBtn} onPress={() => setShowAddCat(true)}>
            <MaterialIcons name="add" size={22} color="#FFF" />
          </Pressable>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(["categorias", "ordem"] as Tab[]).map((tab) => (
          <Pressable
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.tabTextActive,
              ]}
            >
              {tab === "categorias" ? "Categorias" : "Ordem da Home"}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#25D366" size="large" />
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      ) : activeTab === "categorias" ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
        >
          <Text style={styles.listHint}>
            {categories.length} categorias • Toque para ver e editar os serviços
            dentro de cada uma.
          </Text>
          <View style={styles.catList}>
            {categories.map((cat, i) => {
              const catSubs = allSubServices.filter(
                (s) => s.categoryId === cat.id,
              );
              return (
                <View
                  key={cat.id}
                  style={[
                    styles.catCard,
                    i < categories.length - 1 && styles.catBorder,
                  ]}
                >
                  <Pressable
                    style={styles.catMain}
                    onPress={() => setSelectedCatId(cat.id)}
                  >
                    <View
                      style={[
                        styles.catIconBox,
                        !cat.isActive && { backgroundColor: "#F3F4F6" },
                      ]}
                    >
                      <MaterialIcons
                        name={cat.icon as any}
                        size={22}
                        color={cat.isActive ? "#25D366" : "#9CA3AF"}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.catName,
                          !cat.isActive && { color: "#9CA3AF" },
                        ]}
                      >
                        {cat.name}
                      </Text>
                      {catSubs.length > 0 ? (
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          style={styles.subPreviewScroll}
                        >
                          {catSubs.map((sub) => (
                            <View key={sub.id} style={styles.subPreviewIcon}>
                              <MaterialIcons
                                name={(sub.icon || "build") as any}
                                size={14}
                                color="#94A3B8"
                              />
                            </View>
                          ))}
                        </ScrollView>
                      ) : (
                        <Text style={styles.catCount}>Nenhum serviço</Text>
                      )}
                    </View>
                    <View style={styles.catActions}>
                      <Pressable
                        style={({ pressed }) => [
                          styles.editBtn,
                          pressed && { opacity: 0.7 },
                        ]}
                        onPress={() => setSelectedCatId(cat.id)}
                      >
                        <Text style={styles.editBtnText}>Editar</Text>
                      </Pressable>
                      <Pressable
                        style={({ pressed }) => [
                          styles.deleteBtn,
                          pressed && { opacity: 0.7 },
                        ]}
                        onPress={() => handleDeleteCategory(cat.id, cat.name)}
                      >
                        <MaterialIcons
                          name="delete-outline"
                          size={18}
                          color="#EF4444"
                        />
                      </Pressable>
                    </View>
                  </Pressable>
                </View>
              );
            })}
          </View>
          {categories.length === 0 && (
            <View style={styles.emptyState}>
              <MaterialIcons name="category" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>Nenhuma categoria ainda</Text>
              <Text style={styles.emptyHint}>Toque em "+" para adicionar</Text>
            </View>
          )}
          <View style={{ height: 20 }} />
        </ScrollView>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
        >
          <Text style={styles.listHint}>
            Defina a ordem das categorias na tela inicial do app.
          </Text>
          <View style={styles.catList}>
            {categories.map((cat, idx) => (
              <View
                key={cat.id}
                style={[
                  styles.catCard,
                  idx < categories.length - 1 && styles.catBorder,
                ]}
              >
                <View style={styles.catMain}>
                  <Text style={styles.orderNum}>{idx + 1}</Text>
                  <View style={styles.catIconBox}>
                    <MaterialIcons
                      name={cat.icon as any}
                      size={22}
                      color="#25D366"
                    />
                  </View>
                  <Text style={[styles.catName, { flex: 1 }]}>{cat.name}</Text>
                  <View style={styles.orderBtns}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.orderBtn,
                        pressed && { opacity: 0.6 },
                      ]}
                      onPress={() => moveCategory(cat.id, "up")}
                    >
                      <MaterialIcons
                        name="keyboard-arrow-up"
                        size={22}
                        color={idx === 0 ? "#D1D5DB" : "#374151"}
                      />
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [
                        styles.orderBtn,
                        pressed && { opacity: 0.6 },
                      ]}
                      onPress={() => moveCategory(cat.id, "down")}
                    >
                      <MaterialIcons
                        name="keyboard-arrow-down"
                        size={22}
                        color={
                          idx === categories.length - 1 ? "#D1D5DB" : "#374151"
                        }
                      />
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}
          </View>
          <View style={{ height: 20 }} />
        </ScrollView>
      )}

      <AdminTabBar />

      {/* ── Modal: Nova Categoria ─────────────────────────────────────────── */}
      <Modal visible={showAddCat} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nova Categoria</Text>
              <Pressable
                onPress={() => {
                  setShowAddCat(false);
                  setNewCatName("");
                }}
              >
                <MaterialIcons name="close" size={22} color="#6B7280" />
              </Pressable>
            </View>

            <Text style={styles.fieldLabel}>Nome</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="Ex: Jardinagem"
              placeholderTextColor="#9CA3AF"
              value={newCatName}
              onChangeText={setNewCatName}
              autoFocus
            />

            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Ícone</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.iconScroll}
            >
              {ICONS.map((ico) => (
                <Pressable
                  key={ico}
                  style={[
                    styles.iconOption,
                    newCatIcon === ico && styles.iconOptionActive,
                  ]}
                  onPress={() => setNewCatIcon(ico)}
                >
                  <MaterialIcons
                    name={ico as any}
                    size={24}
                    color={newCatIcon === ico ? "#25D366" : "#6B7280"}
                  />
                </Pressable>
              ))}
            </ScrollView>

            <View style={styles.modalBtns}>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => {
                  setShowAddCat(false);
                  setNewCatName("");
                  setNewCatIcon("build");
                }}
              >
                <Text style={styles.modalBtnCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.modalBtn,
                  styles.modalBtnConfirm,
                  (!newCatName.trim() || saving) && { opacity: 0.5 },
                ]}
                onPress={handleAddCategory}
                disabled={!newCatName.trim() || saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.modalBtnConfirmText}>Adicionar</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Modal: Sub-serviços da Categoria ─────────────────────────────── */}
      <Modal visible={!!selectedCatId} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: "85%" }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <MaterialIcons
                  name={(selectedCat?.icon ?? "build") as any}
                  size={20}
                  color="#25D366"
                />
                <Text style={styles.modalTitle}>{selectedCat?.name}</Text>
              </View>
              <Pressable
                onPress={() => {
                  setSelectedCatId(null);
                  setShowAddSub(false);
                }}
              >
                <MaterialIcons name="close" size={22} color="#6B7280" />
              </Pressable>
            </View>

            {loadingSubs ? (
              <ActivityIndicator
                color="#25D366"
                style={{ marginVertical: 24 }}
              />
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={false}
                style={{ maxHeight: 320 }}
              >
                {subServices.length === 0 && (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>Nenhum serviço ainda</Text>
                  </View>
                )}
                {subServices.map((sub, i) => (
                  <View
                    key={sub.id}
                    style={[
                      styles.subRow,
                      i < subServices.length - 1 && {
                        borderBottomWidth: 1,
                        borderBottomColor: "#F3F4F6",
                      },
                    ]}
                  >
                    <View style={styles.subIconBox}>
                      <MaterialIcons
                        name={(sub.icon ?? "build") as any}
                        size={18}
                        color="#25D366"
                      />
                    </View>
                    <Text style={styles.subName}>{sub.name}</Text>
                    <Pressable
                      style={({ pressed }) => [
                        styles.subDeleteBtn,
                        pressed && { opacity: 0.7 },
                      ]}
                      onPress={() => handleDeleteSub(sub.id, sub.name)}
                    >
                      <MaterialIcons
                        name="delete-outline"
                        size={18}
                        color="#EF4444"
                      />
                    </Pressable>
                  </View>
                ))}
              </ScrollView>
            )}

            {/* Adicionar sub-serviço inline */}
            {showAddSub ? (
              <View style={styles.addSubBox}>
                <TextInput
                  style={styles.addSubInput}
                  placeholder="Nome do serviço"
                  placeholderTextColor="#9CA3AF"
                  value={newSubName}
                  onChangeText={setNewSubName}
                  autoFocus
                />
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={[styles.iconScroll, { marginTop: 10 }]}
                >
                  {ICONS.map((ico) => (
                    <Pressable
                      key={ico}
                      style={[
                        styles.iconOption,
                        newSubIcon === ico && styles.iconOptionActive,
                      ]}
                      onPress={() => setNewSubIcon(ico)}
                    >
                      <MaterialIcons
                        name={ico as any}
                        size={20}
                        color={newSubIcon === ico ? "#25D366" : "#6B7280"}
                      />
                    </Pressable>
                  ))}
                </ScrollView>
                <View style={styles.addSubBtns}>
                  <Pressable
                    style={[
                      styles.modalBtn,
                      styles.modalBtnCancel,
                      { flex: 1 },
                    ]}
                    onPress={() => {
                      setShowAddSub(false);
                      setNewSubName("");
                    }}
                  >
                    <Text style={styles.modalBtnCancelText}>Cancelar</Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.modalBtn,
                      styles.modalBtnConfirm,
                      { flex: 1 },
                      (!newSubName.trim() || saving) && { opacity: 0.5 },
                    ]}
                    onPress={handleAddSub}
                    disabled={!newSubName.trim() || saving}
                  >
                    {saving ? (
                      <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                      <Text style={styles.modalBtnConfirmText}>Salvar</Text>
                    )}
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable
                style={styles.addSubBtn}
                onPress={() => setShowAddSub(true)}
              >
                <MaterialIcons name="add" size={18} color="#25D366" />
                <Text style={styles.addSubBtnText}>Adicionar serviço</Text>
              </Pressable>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F5F5F5" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backBtn: { padding: 4, marginRight: 8 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "800", color: "#111827" },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#25D366",
    alignItems: "center",
    justifyContent: "center",
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: { borderBottomColor: "#25D366" },
  tabText: { fontSize: 14, fontWeight: "600", color: "#9CA3AF" },
  tabTextActive: { color: "#25D366" },
  loadingBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: { color: "#6B7280", fontSize: 14 },
  list: { padding: 16 },
  listHint: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 12,
    lineHeight: 18,
  },
  catList: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    overflow: "hidden",
  },
  catCard: {},
  catBorder: { borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  catMain: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 12,
  },
  catIconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
  },
  catName: { fontSize: 14, fontWeight: "700", color: "#111827" },
  catCount: { fontSize: 12, color: "#6B7280", marginTop: 1 },
  subPreviewScroll: { marginTop: 4, flexDirection: "row" },
  subPreviewIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 4,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  catActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  editBtn: {
    backgroundColor: "#F0FDF4",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  editBtnText: { fontSize: 13, fontWeight: "700", color: "#15803D" },
  deleteBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
  },
  orderNum: {
    fontSize: 16,
    fontWeight: "800",
    color: "#25D366",
    width: 24,
    textAlign: "center",
  },
  orderBtns: { flexDirection: "row" },
  orderBtn: { padding: 4 },
  emptyState: { alignItems: "center", paddingVertical: 32, gap: 6 },
  emptyText: { fontSize: 15, fontWeight: "700", color: "#9CA3AF" },
  emptyHint: { fontSize: 13, color: "#D1D5DB" },
  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    gap: 10,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  modalHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  modalTitle: { fontSize: 17, fontWeight: "800", color: "#111827" },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: "#374151" },
  fieldInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#F9FAFB",
    outlineStyle: "none",
  } as any,
  iconScroll: { marginTop: 2 },
  iconOption: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
    marginRight: 8,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  iconOptionActive: { borderColor: "#25D366", backgroundColor: "#F0FDF4" },
  modalBtns: { flexDirection: "row", gap: 10, marginTop: 10 },
  modalBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBtnCancel: { backgroundColor: "#F3F4F6" },
  modalBtnCancelText: { fontSize: 14, fontWeight: "700", color: "#374151" },
  modalBtnConfirm: { backgroundColor: "#25D366" },
  modalBtnConfirmText: { fontSize: 14, fontWeight: "700", color: "#FFF" },
  // Sub-services
  subRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 11,
    paddingHorizontal: 4,
    gap: 10,
  },
  subIconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
  },
  subName: { flex: 1, fontSize: 14, color: "#111827", fontWeight: "600" },
  subDeleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
  },
  addSubBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 13,
    borderWidth: 1.5,
    borderColor: "#BBF7D0",
    borderRadius: 12,
    marginTop: 8,
    backgroundColor: "#F0FDF4",
  },
  addSubBtnText: { fontSize: 14, fontWeight: "700", color: "#25D366" },
  addSubBox: { marginTop: 10, gap: 0 },
  addSubInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#F9FAFB",
    outlineStyle: "none",
  } as any,
  addSubBtns: { flexDirection: "row", gap: 10, marginTop: 10 },
});
