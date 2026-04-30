/**
 * Painel Admin — Gerenciar Imagens das Subcategorias
 * Permite ao admin sobrescrever a imagem padrão de qualquer subcategoria
 * inserindo uma URL personalizada ou restaurando o padrão do mock.
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
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { categories, getSubcategories, type Subcategory } from "@/data/mock";
import { subcategoryImagesDB } from "@/lib/subcategory-images-db";
import { useAuth } from "@/hooks/use-auth";

type SubcatWithOverride = Subcategory & {
  overrideUrl?: string;
};

export default function SubcategoryImagesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(categories[0]?.id || "");
  const [subcats, setSubcats] = useState<SubcatWithOverride[]>([]);
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // Modal de edição
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

  const handleSave = async () => {
    if (!editingSubcat) return;
    const url = urlInput.trim();
    if (!url) {
      Alert.alert("Erro", "Insira uma URL de imagem válida.");
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

  const renderSubcat = ({ item }: { item: SubcatWithOverride }) => {
    const displayUrl = item.overrideUrl || item.imageUrl;
    const hasOverride = !!item.overrideUrl;

    return (
      <View style={styles.subcatCard}>
        <View style={styles.subcatImageWrapper}>
          {displayUrl ? (
            <Image source={{ uri: displayUrl }} style={styles.subcatImage} resizeMode="cover" />
          ) : (
            <View style={styles.subcatImageFallback}>
              <MaterialIcons name={(item.icon || "label") as any} size={24} color="#25D366" />
            </View>
          )}
          {hasOverride && (
            <View style={styles.overrideBadge}>
              <MaterialIcons name="edit" size={10} color="#fff" />
            </View>
          )}
        </View>

        <View style={styles.subcatInfo}>
          <Text style={styles.subcatName}>{item.name}</Text>
          {hasOverride ? (
            <Text style={styles.subcatUrlText} numberOfLines={1}>
              Personalizada
            </Text>
          ) : (
            <Text style={styles.subcatUrlDefault} numberOfLines={1}>
              Padrão
            </Text>
          )}
        </View>

        <View style={styles.subcatActions}>
          <Pressable
            style={({ pressed }) => [styles.actionBtn, styles.editBtn, pressed && { opacity: 0.7 }]}
            onPress={() => openEdit(item)}
          >
            <MaterialIcons name="edit" size={16} color="#3B82F6" />
          </Pressable>
          {hasOverride && (
            <Pressable
              style={({ pressed }) => [styles.actionBtn, styles.restoreBtn, pressed && { opacity: 0.7 }]}
              onPress={() => handleRestore(item.id, item.name)}
            >
              <MaterialIcons name="restore" size={16} color="#F59E0B" />
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
        <Text style={styles.headerTitle}>Imagens das Subcategorias</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Seletor de categoria */}
      <View style={styles.catSelectorWrapper}>
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

      {/* Lista de subcategorias */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#25D366" />
        </View>
      ) : (
        <FlatList
          data={subcats}
          keyExtractor={(s) => s.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={renderSubcat}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialIcons name="image-not-supported" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>Nenhuma subcategoria nesta categoria</Text>
            </View>
          }
        />
      )}

      {/* Modal de edição de URL */}
      <Modal visible={editModal} transparent animationType="slide" onRequestClose={() => setEditModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Editar imagem: {editingSubcat?.name}
              </Text>
              <Pressable
                style={({ pressed }) => [styles.modalCloseBtn, pressed && { opacity: 0.6 }]}
                onPress={() => setEditModal(false)}
              >
                <MaterialIcons name="close" size={22} color="#6B7280" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Pré-visualização */}
              {urlInput ? (
                <Image
                  source={{ uri: urlInput }}
                  style={styles.previewImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.previewImage, styles.previewFallback]}>
                  <MaterialIcons name="image" size={40} color="#D1D5DB" />
                  <Text style={styles.previewFallbackText}>Pré-visualização</Text>
                </View>
              )}

              <Text style={styles.fieldLabel}>URL da imagem</Text>
              <View style={styles.fieldBox}>
                <MaterialIcons name="link" size={18} color="#9CA3AF" />
                <TextInput
                  style={styles.fieldInput}
                  placeholder="https://images.unsplash.com/..."
                  placeholderTextColor="#9CA3AF"
                  value={urlInput}
                  onChangeText={setUrlInput}
                  autoCapitalize="none"
                  keyboardType="url"
                />
              </View>

              <Text style={styles.tipText}>
                Dica: Use URLs do Unsplash com ?w=400&q=80 para melhor performance.
              </Text>

              <View style={styles.modalActions}>
                <Pressable
                  style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.7 }]}
                  onPress={() => setEditModal(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85 }]}
                  onPress={handleSave}
                >
                  <MaterialIcons name="check" size={18} color="#fff" />
                  <Text style={styles.saveBtnText}>Salvar</Text>
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
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: "700", color: "#111827", textAlign: "center" },
  catSelectorWrapper: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  catSelectorContent: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  catChipActive: { backgroundColor: "#25D366", borderColor: "#25D366" },
  catChipText: { fontSize: 13, fontWeight: "600", color: "#374151" },
  catChipTextActive: { color: "#FFFFFF" },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  listContent: { padding: 16, paddingBottom: 32, gap: 10 },
  subcatCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  subcatImageWrapper: {
    width: 60,
    height: 60,
    borderRadius: 10,
    overflow: "hidden",
    position: "relative",
  },
  subcatImage: { width: "100%", height: "100%" },
  subcatImageFallback: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
  },
  overrideBadge: {
    position: "absolute",
    bottom: 3,
    right: 3,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#3B82F6",
    alignItems: "center",
    justifyContent: "center",
  },
  subcatInfo: { flex: 1 },
  subcatName: { fontSize: 14, fontWeight: "600", color: "#111827", marginBottom: 3 },
  subcatUrlText: { fontSize: 11, color: "#3B82F6", fontWeight: "500" },
  subcatUrlDefault: { fontSize: 11, color: "#9CA3AF" },
  subcatActions: { flexDirection: "row", gap: 6 },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  editBtn: { backgroundColor: "#EFF6FF" },
  restoreBtn: { backgroundColor: "#FFFBEB" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingTop: 60 },
  emptyText: { fontSize: 14, color: "#9CA3AF", textAlign: "center" },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
    maxHeight: "85%",
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E5E7EB",
    alignSelf: "center",
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  modalTitle: { fontSize: 16, fontWeight: "700", color: "#111827", flex: 1, marginRight: 8 },
  modalCloseBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  previewImage: {
    width: "100%",
    height: 160,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: "#F3F4F6",
  },
  previewFallback: { alignItems: "center", justifyContent: "center", gap: 8 },
  previewFallbackText: { fontSize: 13, color: "#9CA3AF" },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 8 },
  fieldBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 12,
  },
  fieldInput: { flex: 1, fontSize: 14, color: "#111827" },
  tipText: { fontSize: 11, color: "#9CA3AF", marginBottom: 20, lineHeight: 16 },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 4 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },
  cancelBtnText: { fontSize: 14, fontWeight: "600", color: "#6B7280" },
  saveBtn: {
    flex: 2,
    flexDirection: "row",
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: "#25D366",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  saveBtnText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
});
