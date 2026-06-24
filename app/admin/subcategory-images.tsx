import React, { useState, useMemo } from "react";
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
import { trpc } from "@/lib/trpc";
import { storage } from "@/lib/storage";
import { logger } from "@/lib/logger";
import { supabaseUrl, supabaseAnonKey } from "@/lib/supabase";

export default function SubcategoryImagesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [editModal, setEditModal] = useState(false);
  const [editingSubcat, setEditingSubcat] = useState<any>(null);
  const [urlInput, setUrlInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");

  // Real data from DB
  const { data: dbCategories = [], isLoading: loadingCats } =
    trpc.categories.list.useQuery();
  const {
    data: dbSubcats = [],
    isLoading: loadingSubs,
    refetch,
  } = trpc.categories.subServices.list.useQuery(
    { categoryId: selectedCategoryId },
    { enabled: !!selectedCategoryId },
  );

  const updateMutation = trpc.categories.subServices.update.useMutation({
    onSuccess: () => {
      refetch();
      setEditModal(false);
    },
  });

  // Set initial category
  React.useEffect(() => {
    if (dbCategories.length > 0 && !selectedCategoryId) {
      setSelectedCategoryId(dbCategories[0].id);
    }
  }, [dbCategories]);

  const openEdit = (subcat: any) => {
    setEditingSubcat(subcat);
    setUrlInput(subcat.imageUrl || "");
    setEditModal(true);
  };

  const handlePickFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permissão necessária",
        "Permita o acesso à galeria nas configurações do dispositivo.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.5,
    });
    if (!result.canceled) {
      setUrlInput(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!editingSubcat) return;
    const url = urlInput.trim();
    if (!url) {
      Alert.alert("Erro", "Selecione uma imagem.");
      return;
    }

    logger.info("ADMIN", "Salvando imagem da subcategoria...");
    setSaving(true);
    let isStillSaving = true;

    // Timer para avisar o usuário se demorar demais
    const saveTimeout = setTimeout(() => {
      if (isStillSaving) {
        Alert.alert(
          "Ainda trabalhando...",
          "O processo está demorando mais que o esperado. Verifique sua conexão.",
        );
      }
    }, 20000); // 20s para dar margem à qualidade 0.5

    try {
      let finalUrl = url;

      // 1. Upload da imagem (se for local)
      if (!url.startsWith("http")) {
        const uploaded = await storage.uploadImage(url, "providers");
        if (uploaded) {
          finalUrl = uploaded;
        } else {
          throw new Error("Falha ao gerar link da imagem.");
        }
      }

      // 2. Atualização no Banco de Dados
      await updateMutation.mutateAsync({
        id: editingSubcat.id,
        imageUrl: finalUrl,
      });

      clearTimeout(saveTimeout);
      logger.info("ADMIN", "Tudo pronto!");
      setEditModal(false);
      Alert.alert("Sucesso", "Imagem atualizada com sucesso!");
    } catch (err: any) {
      clearTimeout(saveTimeout);
      logger.error("ADMIN", "Erro no salvamento", err);
      Alert.alert(
        "Erro ao Salvar",
        err.message || "Ocorreu um erro inesperado.",
      );
    } finally {
      isStillSaving = false;
      setSaving(false);
    }
  };

  const renderSubcat = ({ item }: { item: any }) => {
    const hasImage = !!item.imageUrl;

    return (
      <View style={styles.subcatCard}>
        <View style={styles.thumbWrap}>
          {hasImage ? (
            <Image source={{ uri: item.imageUrl }} style={styles.thumbImg} />
          ) : (
            <View style={styles.thumbFallback}>
              <MaterialIcons
                name={(item.icon || "build") as any}
                size={30}
                color="#CBD5E1"
              />
            </View>
          )}
        </View>

        <View style={styles.subcatInfo}>
          <Text style={styles.subcatName} numberOfLines={1}>
            {item.name}
          </Text>
          <View
            style={[
              styles.statusPill,
              hasImage ? styles.statusPillCustom : styles.statusPillDefault,
            ]}
          >
            <Text
              style={[
                styles.statusPillText,
                hasImage
                  ? styles.statusPillTextCustom
                  : styles.statusPillTextDefault,
              ]}
            >
              {hasImage ? "Imagem Ativa" : "Sem Imagem"}
            </Text>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.editBtn,
            { width: "100%", marginTop: 8 },
            pressed && { opacity: 0.7 },
          ]}
          onPress={() => openEdit(item)}
        >
          <MaterialIcons name="edit" size={18} color="#25D366" />
          <Text style={{ color: "#15803D", fontWeight: "700", fontSize: 13 }}>
            Editar Foto
          </Text>
        </Pressable>
      </View>
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#0F172A" />
        </Pressable>
        <Text style={styles.headerTitle}>Imagens dos Serviços</Text>
      </View>

      <View style={styles.catSelectorWrap}>
        <FlatList
          data={dbCategories}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingVertical: 12,
            gap: 8,
          }}
          renderItem={({ item }) => (
            <Pressable
              style={[
                styles.catChip,
                selectedCategoryId === item.id && styles.catChipActive,
              ]}
              onPress={() => setSelectedCategoryId(item.id)}
            >
              <Text
                style={[
                  styles.catChipText,
                  selectedCategoryId === item.id && styles.catChipTextActive,
                ]}
              >
                {item.name}
              </Text>
            </Pressable>
          )}
        />
      </View>

      {loadingSubs ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#25D366" />
        </View>
      ) : (
        <View style={{ flex: 1, justifyContent: "center" }}>
          <FlatList
            data={dbSubcats}
            keyExtractor={(item) => item.id}
            renderItem={renderSubcat}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[
              styles.listContent,
              { paddingVertical: 20 },
            ]}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  Nenhum serviço nesta categoria.
                </Text>
              </View>
            }
          />
        </View>
      )}

      <Modal visible={editModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>{editingSubcat?.name}</Text>

            {urlInput ? (
              <Image source={{ uri: urlInput }} style={styles.previewImg} />
            ) : (
              <View style={styles.previewFallback}>
                <MaterialIcons name="image" size={48} color="#CBD5E1" />
              </View>
            )}

            <Pressable
              style={styles.galleryBtn}
              onPress={handlePickFromGallery}
            >
              <Text style={styles.galleryBtnText}>Escolher Nova Foto</Text>
            </Pressable>

            <View style={styles.modalActions}>
              <Pressable
                style={styles.cancelBtn}
                onPress={() => setEditModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={styles.saveBtn}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Salvar</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFF",
    gap: 16,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#0F172A" },
  catSelectorWrap: {
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  catChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
  },
  catChipActive: { backgroundColor: "#25D366" },
  catChipText: { fontSize: 14, fontWeight: "600", color: "#64748B" },
  catChipTextActive: { color: "#FFF" },
  listContent: { padding: 16, gap: 16 },
  subcatCard: {
    width: 180,
    backgroundColor: "#FFF",
    padding: 12,
    borderRadius: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  thumbWrap: {
    width: "100%",
    height: 120,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#F8FAFC",
  },
  thumbImg: { width: "100%", height: "100%" },
  thumbFallback: { flex: 1, alignItems: "center", justifyContent: "center" },
  subcatInfo: { gap: 4, marginTop: 4 },
  subcatName: { fontSize: 15, fontWeight: "700", color: "#1E293B" },
  statusPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusPillDefault: { backgroundColor: "#F1F5F9" },
  statusPillCustom: { backgroundColor: "#F0FDF4" },
  statusPillText: { fontSize: 10, fontWeight: "600" },
  statusPillTextDefault: { color: "#94A3B8" },
  statusPillTextCustom: { color: "#25D366" },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    backgroundColor: "#F0FDF4",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  loadingBox: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyState: { padding: 40, alignItems: "center" },
  emptyText: { color: "#94A3B8" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#FFF",
    padding: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    gap: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: "700", textAlign: "center" },
  previewImg: { width: "100%", height: 200, borderRadius: 16 },
  previewFallback: {
    width: "100%",
    height: 200,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  galleryBtn: {
    backgroundColor: "#F8FAFC",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  galleryBtnText: { fontWeight: "700", color: "#0F172A" },
  modalActions: { flexDirection: "row", gap: 12 },
  cancelBtn: { flex: 1, padding: 16, alignItems: "center" },
  cancelBtnText: { fontWeight: "600", color: "#64748B" },
  saveBtn: {
    flex: 1,
    backgroundColor: "#25D366",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  saveBtnText: { fontWeight: "700", color: "#FFF" },
});
