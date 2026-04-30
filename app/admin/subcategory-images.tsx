/**
 * Painel Admin — Gerenciar Imagens das Subcategorias
 * Permite ao admin sobrescrever a imagem padrão de qualquer subcategoria.
 */
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  Image,
  ActivityIndicator,
  Modal,
  ScrollView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";

import { categories, getSubcategories, type Subcategory } from "@/data/mock";
import { subcategoryImagesDB } from "@/lib/subcategory-images-db";

type SubcatWithOverride = Subcategory & {
  overrideUrl?: string;
};

export default function SubcategoryImagesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(categories[0]?.id || "");
  const [subcats, setSubcats] = useState<SubcatWithOverride[]>([]);
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const [editModal, setEditModal] = useState(false);
  const [editingSubcat, setEditingSubcat] = useState<SubcatWithOverride | null>(null);
  const [urlInput, setUrlInput] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    subcategoryImagesDB.resetCache();
    const all = await subcategoryImagesDB.getAll();
    const map: Record<string, string> = {};
    for (const o of all) map[o.subcategoryId] = o.imageUrl;
    setOverrides(map);

    const subs = getSubcategories(selectedCategoryId).map((s) => ({
      ...s,
      overrideUrl: map[s.id],
    }));
    setSubcats(subs);
    setLoading(false);
  }, [selectedCategoryId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openEdit = (subcat: SubcatWithOverride) => {
    setEditingSubcat(subcat);
    setUrlInput(subcat.overrideUrl || subcat.imageUrl || "");
    setEditModal(true);
  };

  const handlePickFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permissão necessária", "Permita o acesso à galeria nas configurações do dispositivo.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.85,
    });
    if (!result.canceled) {
      setUrlInput(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!editingSubcat) return;
    const url = urlInput.trim();
    if (!url) {
      Alert.alert("Campo obrigatório", "Selecione uma imagem ou insira uma URL válida.");
      return;
    }
    await subcategoryImagesDB.setImage(editingSubcat.id, url);
    setEditModal(false);
    loadData();
  };

  const handleRestore = async (subcatId: string, subcatName: string) => {
    Alert.alert(
      "Restaurar imagem padrão",
      `Remover a imagem personalizada de "${subcatName}" e voltar para o padrão?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Restaurar",
          style: "destructive",
          onPress: async () => {
            await subcategoryImagesDB.removeOverride(subcatId);
            loadData();
          },
        },
      ]
    );
  };

  const overrideCount = Object.keys(overrides).length;

  const renderSubcat = ({ item }: { item: SubcatWithOverride }) => {
    const displayUrl = item.overrideUrl || item.imageUrl;
    const hasOverride = !!item.overrideUrl;

    return (
      <View style={styles.subcatCard}>
        {/* Thumbnail */}
        <View style={styles.thumbWrap}>
          {displayUrl ? (
            <Image source={{ uri: displayUrl }} style={styles.thumbImg} resizeMode="cover" />
          ) : (
            <View style={styles.thumbFallback}>
              <MaterialIcons name={(item.icon || "label") as any} size={22} color="#25D366" />
            </View>
          )}
          {hasOverride && (
            <View style={styles.overrideDot}>
              <MaterialIcons name="edit" size={9} color="#FFFFFF" />
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.subcatInfo}>
          <Text style={styles.subcatName} numberOfLines={1} ellipsizeMode="tail">
            {item.name}
          </Text>
          <View style={[styles.statusPill, hasOverride ? styles.statusPillCustom : styles.statusPillDefault]}>
            <MaterialIcons
              name={hasOverride ? "check-circle" : "image"}
              size={10}
              color={hasOverride ? "#2563EB" : "#94A3B8"}
            />
            <Text style={[styles.statusPillText, hasOverride ? styles.statusPillTextCustom : styles.statusPillTextDefault]}>
              {hasOverride ? "Personalizada" : "Padrão"}
            </Text>
          </View>
        </View>

        {/* Ações */}
        <View style={styles.subcatActions}>
          <Pressable
            style={({ pressed }) => [styles.actionIconBtn, styles.editIconBtn, pressed && { opacity: 0.7 }]}
            onPress={() => openEdit(item)}
            hitSlop={4}
          >
            <MaterialIcons name="edit" size={15} color="#2563EB" />
          </Pressable>
          {hasOverride && (
            <Pressable
              style={({ pressed }) => [styles.actionIconBtn, styles.restoreIconBtn, pressed && { opacity: 0.7 }]}
              onPress={() => handleRestore(item.id, item.name)}
              hitSlop={4}
            >
              <MaterialIcons name="restore" size={15} color="#D97706" />
            </Pressable>
          )}
        </View>
      </View>
    );
  };

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
          <Text style={styles.headerTitle}>Imagens das Subcategorias</Text>
          <Text style={styles.headerSub}>
            {overrideCount > 0
              ? `${overrideCount} personalizada${overrideCount !== 1 ? "s" : ""}`
              : "Nenhuma personalizada ainda"}
          </Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      {/* ── Seletor de categoria ── */}
      <View style={styles.catSelectorWrap}>
        <FlatList
          data={categories}
          keyExtractor={(c) => c.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catSelectorContent}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [
                styles.catChip,
                selectedCategoryId === item.id && styles.catChipActive,
                pressed && { opacity: 0.8 },
              ]}
              onPress={() => setSelectedCategoryId(item.id)}
            >
              <Text
                style={[
                  styles.catChipText,
                  selectedCategoryId === item.id && styles.catChipTextActive,
                ]}
                numberOfLines={1}
              >
                {item.name.replace("\n", " ")}
              </Text>
            </Pressable>
          )}
        />
      </View>

      {/* ── Lista de subcategorias ── */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#25D366" />
          <Text style={styles.loadingText}>Carregando subcategorias...</Text>
        </View>
      ) : (
        <FlatList
          data={subcats}
          keyExtractor={(s) => s.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={renderSubcat}
          ListHeaderComponent={
            subcats.length > 0 ? (
              <Text style={styles.listCount}>
                {subcats.length} subcategoria{subcats.length !== 1 ? "s" : ""}
              </Text>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconBox}>
                <MaterialIcons name="image-not-supported" size={40} color="#CBD5E1" />
              </View>
              <Text style={styles.emptyTitle}>Nenhuma subcategoria</Text>
              <Text style={styles.emptySubtitle}>Esta categoria não possui subcategorias cadastradas.</Text>
            </View>
          }
        />
      )}

      {/* ── Modal de edição ── */}
      <Modal
        visible={editModal}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            {/* Cabeçalho */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <Text style={styles.modalTitle} numberOfLines={1} ellipsizeMode="tail">
                  {editingSubcat?.name}
                </Text>
                <Text style={styles.modalSubtitle}>Editar imagem da subcategoria</Text>
              </View>
              <Pressable
                style={({ pressed }) => [styles.modalCloseBtn, pressed && { opacity: 0.6 }]}
                onPress={() => setEditModal(false)}
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
              {/* Pré-visualização */}
              <View style={styles.previewSection}>
                <Text style={styles.sectionLabel}>Pré-visualização</Text>
                {urlInput ? (
                  <Image source={{ uri: urlInput }} style={styles.previewImg} resizeMode="cover" />
                ) : (
                  <View style={styles.previewFallback}>
                    <MaterialIcons name="image" size={40} color="#CBD5E1" />
                    <Text style={styles.previewFallbackText}>Nenhuma imagem selecionada</Text>
                  </View>
                )}
              </View>

              {/* Botão galeria */}
              <Pressable
                style={({ pressed }) => [styles.galleryBtn, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}
                onPress={handlePickFromGallery}
              >
                <MaterialIcons name="photo-library" size={18} color="#FFFFFF" />
                <Text style={styles.galleryBtnText}>Escolher da galeria</Text>
              </Pressable>

              {/* Divisor */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerLabel}>ou insira uma URL</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Campo URL */}
              <View style={styles.formSection}>
                <Text style={styles.fieldLabel}>URL da imagem</Text>
                <View style={styles.urlInputWrap}>
                  <MaterialIcons name="link" size={17} color="#94A3B8" />
                  <TextInput
                    style={styles.urlInput}
                    placeholder="https://images.unsplash.com/..."
                    placeholderTextColor="#94A3B8"
                    value={urlInput}
                    onChangeText={setUrlInput}
                    autoCapitalize="none"
                    keyboardType="url"
                    returnKeyType="done"
                  />
                  {urlInput.length > 0 && (
                    <Pressable onPress={() => setUrlInput("")} hitSlop={8}>
                      <MaterialIcons name="close" size={16} color="#94A3B8" />
                    </Pressable>
                  )}
                </View>
                <Text style={styles.tipText}>
                  Dica: Use URLs do Unsplash com ?w=400&q=80 para melhor performance.
                </Text>
              </View>

              {/* Ações */}
              <View style={styles.modalActions}>
                <Pressable
                  style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.7 }]}
                  onPress={() => setEditModal(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}
                  onPress={handleSave}
                >
                  <MaterialIcons name="check" size={18} color="#FFFFFF" />
                  <Text style={styles.saveBtnText}>Salvar Imagem</Text>
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

  // Category selector
  catSelectorWrap: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  catSelectorContent: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  catChipActive: { backgroundColor: "#25D366", borderColor: "#25D366" },
  catChipText: { fontSize: 13, fontWeight: "600", color: "#374151" },
  catChipTextActive: { color: "#FFFFFF" },

  // Loading / Empty
  loadingBox: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 14, color: "#64748B" },
  listContent: { padding: 16, gap: 10, paddingBottom: 40 },
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

  // Subcat card
  subcatCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    gap: 12,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  thumbWrap: {
    width: 58,
    height: 58,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  thumbImg: { width: "100%", height: "100%" },
  thumbFallback: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
  },
  overrideDot: {
    position: "absolute",
    bottom: 3,
    right: 3,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },
  subcatInfo: { flex: 1, gap: 5 },
  subcatName: { fontSize: 14, fontWeight: "600", color: "#0F172A" },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    alignSelf: "flex-start",
  },
  statusPillCustom: { backgroundColor: "#EFF6FF" },
  statusPillDefault: { backgroundColor: "#F1F5F9" },
  statusPillText: { fontSize: 11, fontWeight: "600" },
  statusPillTextCustom: { color: "#2563EB" },
  statusPillTextDefault: { color: "#94A3B8" },
  subcatActions: { flexDirection: "row", gap: 6 },
  actionIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  editIconBtn: { backgroundColor: "#EFF6FF", borderColor: "#BFDBFE" },
  restoreIconBtn: { backgroundColor: "#FFFBEB", borderColor: "#FDE68A" },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "88%",
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
  modalHeaderLeft: { flex: 1, marginRight: 12 },
  modalTitle: { fontSize: 17, fontWeight: "700", color: "#0F172A" },
  modalSubtitle: { fontSize: 13, color: "#64748B", marginTop: 2 },
  modalCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  modalScrollContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },

  // Preview
  previewSection: { marginBottom: 16 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  previewImg: {
    width: "100%",
    height: 170,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
  },
  previewFallback: {
    width: "100%",
    height: 140,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
  },
  previewFallbackText: { fontSize: 13, color: "#94A3B8" },

  // Gallery button
  galleryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#25D366",
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 20,
    ...Platform.select({
      ios: { shadowColor: "#25D366", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
      android: { elevation: 4 },
    }),
  },
  galleryBtnText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },

  // Divider
  divider: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#E2E8F0" },
  dividerLabel: { fontSize: 12, color: "#94A3B8", fontWeight: "500" },

  // Form section
  formSection: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  urlInputWrap: {
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
  urlInput: { flex: 1, fontSize: 14, color: "#0F172A", padding: 0 },
  tipText: { fontSize: 11, color: "#94A3B8", marginTop: 8, lineHeight: 16 },

  // Modal actions
  modalActions: { flexDirection: "row", gap: 10 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F1F5F9",
    alignItems: "center",
  },
  cancelBtnText: { fontSize: 15, fontWeight: "600", color: "#374151" },
  saveBtn: {
    flex: 2,
    flexDirection: "row",
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#25D366",
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
