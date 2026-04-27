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
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useState, useEffect, useCallback } from "react";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { adsDB, type Ad, type CreateAdInput } from "@/lib/ads-database";
import { professionals } from "@/data/mock";

const EMPTY_FORM: CreateAdInput = {
  title: "",
  description: "",
  imageUrl: "",
  providerId: "",
  providerName: "",
  isActive: true,
  displayOrder: 1,
};

export default function AdminAdsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [form, setForm] = useState<CreateAdInput>(EMPTY_FORM);
  const [showProviderPicker, setShowProviderPicker] = useState(false);

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

  const handleSelectProvider = (id: string, name: string) => {
    setForm((f) => ({ ...f, providerId: id, providerName: name }));
    setShowProviderPicker(false);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      Alert.alert("Erro", "Digite o título do anúncio.");
      return;
    }
    if (!form.providerId) {
      Alert.alert("Erro", "Selecione um prestador para o anúncio.");
      return;
    }
    if (!form.imageUrl) {
      Alert.alert("Erro", "Adicione uma imagem ao anúncio.");
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
      `Tem certeza que deseja excluir "${ad.title}"?`,
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
        <Text style={styles.headerTitle}>Anúncios</Text>
        <Pressable
          style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.8 }]}
          onPress={openCreate}
        >
          <MaterialIcons name="add" size={22} color="#FFFFFF" />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color="#25D366" />
        </View>
      ) : (
        <FlatList
          data={ads}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialIcons name="campaign" size={52} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>Nenhum anúncio</Text>
              <Text style={styles.emptySubtitle}>
                Toque em + para criar o primeiro anúncio patrocinado.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.adCard}>
              {item.imageUrl ? (
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.adImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.adImagePlaceholder}>
                  <MaterialIcons name="image" size={32} color="#9CA3AF" />
                </View>
              )}
              <View style={styles.adBody}>
                <View style={styles.adTopRow}>
                  <Text style={styles.adTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      item.isActive ? styles.statusActive : styles.statusInactive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        item.isActive ? styles.statusTextActive : styles.statusTextInactive,
                      ]}
                    >
                      {item.isActive ? "Ativo" : "Inativo"}
                    </Text>
                  </View>
                </View>
                <Text style={styles.adProvider} numberOfLines={1}>
                  <MaterialIcons name="person" size={12} color="#6B7280" /> {item.providerName}
                </Text>
                {item.description ? (
                  <Text style={styles.adDesc} numberOfLines={2}>
                    {item.description}
                  </Text>
                ) : null}
                <Text style={styles.adOrder}>Ordem: {item.displayOrder}</Text>
                <View style={styles.adActions}>
                  <Pressable
                    style={({ pressed }) => [styles.actionBtn, styles.toggleBtn, pressed && { opacity: 0.7 }]}
                    onPress={() => handleToggle(item)}
                  >
                    <MaterialIcons
                      name={item.isActive ? "visibility-off" : "visibility"}
                      size={15}
                      color="#6B7280"
                    />
                    <Text style={styles.actionBtnText}>
                      {item.isActive ? "Desativar" : "Ativar"}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [styles.actionBtn, styles.editBtn, pressed && { opacity: 0.7 }]}
                    onPress={() => openEdit(item)}
                  >
                    <MaterialIcons name="edit" size={15} color="#1A73E8" />
                    <Text style={[styles.actionBtnText, { color: "#1A73E8" }]}>Editar</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [styles.actionBtn, styles.deleteBtn, pressed && { opacity: 0.7 }]}
                    onPress={() => handleDelete(item)}
                  >
                    <MaterialIcons name="delete-outline" size={15} color="#EF4444" />
                    <Text style={[styles.actionBtnText, { color: "#EF4444" }]}>Excluir</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          )}
        />
      )}

      {/* Create / Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingAd ? "Editar anúncio" : "Novo anúncio"}
            </Text>
            <Pressable
              style={({ pressed }) => [styles.modalClose, pressed && { opacity: 0.6 }]}
              onPress={() => setModalVisible(false)}
            >
              <MaterialIcons name="close" size={24} color="#6B7280" />
            </Pressable>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Image picker */}
            <Text style={styles.fieldLabel}>Imagem do banner *</Text>
            <Pressable
              style={({ pressed }) => [styles.imagePicker, pressed && { opacity: 0.8 }]}
              onPress={handlePickImage}
            >
              {form.imageUrl ? (
                <>
                  <Image
                    source={{ uri: form.imageUrl }}
                    style={styles.imagePreview}
                    resizeMode="cover"
                  />
                  <View style={styles.imageOverlay}>
                    <MaterialIcons name="photo-camera" size={22} color="#FFFFFF" />
                    <Text style={styles.imageOverlayText}>Trocar imagem</Text>
                  </View>
                </>
              ) : (
                <View style={styles.imagePlaceholder}>
                  <MaterialIcons name="add-photo-alternate" size={36} color="#9CA3AF" />
                  <Text style={styles.imagePlaceholderText}>Toque para adicionar imagem</Text>
                  <Text style={styles.imagePlaceholderSub}>Recomendado: 16:9 (ex: 800×450px)</Text>
                </View>
              )}
            </Pressable>

            {/* Title */}
            <Text style={styles.fieldLabel}>Título *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Elétrica do Zé — 20 anos de experiência"
              placeholderTextColor="#9CA3AF"
              value={form.title}
              onChangeText={(v) => setForm((f) => ({ ...f, title: v }))}
              maxLength={80}
              returnKeyType="next"
            />

            {/* Description */}
            <Text style={styles.fieldLabel}>Descrição (opcional)</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder="Breve descrição do anúncio..."
              placeholderTextColor="#9CA3AF"
              value={form.description}
              onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
              multiline
              numberOfLines={3}
              maxLength={160}
            />

            {/* Provider picker */}
            <Text style={styles.fieldLabel}>Prestador vinculado *</Text>
            <Pressable
              style={({ pressed }) => [styles.providerPicker, pressed && { opacity: 0.8 }]}
              onPress={() => setShowProviderPicker(true)}
            >
              {form.providerId ? (
                <View style={styles.providerSelected}>
                  <MaterialIcons name="person" size={18} color="#25D366" />
                  <Text style={styles.providerSelectedText}>{form.providerName}</Text>
                </View>
              ) : (
                <View style={styles.providerPlaceholder}>
                  <MaterialIcons name="person-add" size={18} color="#9CA3AF" />
                  <Text style={styles.providerPlaceholderText}>Selecionar prestador</Text>
                </View>
              )}
              <MaterialIcons name="chevron-right" size={20} color="#9CA3AF" />
            </Pressable>

            {/* Display order */}
            <Text style={styles.fieldLabel}>Ordem de exibição</Text>
            <TextInput
              style={styles.input}
              placeholder="1"
              placeholderTextColor="#9CA3AF"
              value={String(form.displayOrder)}
              onChangeText={(v) => setForm((f) => ({ ...f, displayOrder: parseInt(v) || 1 }))}
              keyboardType="number-pad"
              returnKeyType="done"
            />

            {/* Active toggle */}
            <View style={styles.toggleRow}>
              <View>
                <Text style={styles.fieldLabel}>Anúncio ativo</Text>
                <Text style={styles.toggleSubtitle}>Exibir na tela inicial</Text>
              </View>
              <Switch
                value={form.isActive}
                onValueChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
                trackColor={{ false: "#E5E7EB", true: "#86EFAC" }}
                thumbColor={form.isActive ? "#25D366" : "#9CA3AF"}
              />
            </View>

            {/* Save button */}
            <Pressable
              style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85 }, saving && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.saveBtnText}>
                  {editingAd ? "Salvar alterações" : "Criar anúncio"}
                </Text>
              )}
            </Pressable>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>

      {/* Provider picker modal */}
      <Modal
        visible={showProviderPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowProviderPicker(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Selecionar prestador</Text>
            <Pressable
              style={({ pressed }) => [styles.modalClose, pressed && { opacity: 0.6 }]}
              onPress={() => setShowProviderPicker(false)}
            >
              <MaterialIcons name="close" size={24} color="#6B7280" />
            </Pressable>
          </View>
          <FlatList
            data={professionals}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16, gap: 10 }}
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [styles.providerRow, pressed && { opacity: 0.7 }]}
                onPress={() => handleSelectProvider(item.id, item.name)}
              >
                <Image
                  source={{ uri: item.avatar }}
                  style={styles.providerAvatar}
                />
                <View style={styles.providerInfo}>
                  <Text style={styles.providerName}>{item.name}</Text>
                  <Text style={styles.providerCategory}>{item.category}</Text>
                </View>
                {form.providerId === item.id && (
                  <MaterialIcons name="check-circle" size={22} color="#25D366" />
                )}
              </Pressable>
            )}
          />
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
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "#25D366",
    alignItems: "center", justifyContent: "center",
  },
  loadingCenter: { flex: 1, alignItems: "center", justifyContent: "center" },
  listContent: { padding: 16, gap: 12, paddingBottom: 32 },
  empty: { alignItems: "center", paddingTop: 80, gap: 12, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: "#374151" },
  emptySubtitle: { fontSize: 14, color: "#9CA3AF", textAlign: "center", lineHeight: 20 },

  adCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  adImage: { width: "100%", height: 130 },
  adImagePlaceholder: {
    width: "100%", height: 130,
    backgroundColor: "#F3F4F6",
    alignItems: "center", justifyContent: "center",
  },
  adBody: { padding: 12, gap: 4 },
  adTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  adTitle: { fontSize: 15, fontWeight: "700", color: "#111827", flex: 1, marginRight: 8 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusActive: { backgroundColor: "#DCFCE7" },
  statusInactive: { backgroundColor: "#F3F4F6" },
  statusText: { fontSize: 11, fontWeight: "600" },
  statusTextActive: { color: "#16A34A" },
  statusTextInactive: { color: "#9CA3AF" },
  adProvider: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  adDesc: { fontSize: 12, color: "#6B7280", lineHeight: 17 },
  adOrder: { fontSize: 11, color: "#9CA3AF" },
  adActions: { flexDirection: "row", gap: 8, marginTop: 8 },
  actionBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
  },
  toggleBtn: { backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: "#E5E7EB" },
  editBtn: { backgroundColor: "#EFF6FF", borderWidth: 1, borderColor: "#BFDBFE" },
  deleteBtn: { backgroundColor: "#FEF2F2", borderWidth: 1, borderColor: "#FECACA" },
  actionBtnText: { fontSize: 12, fontWeight: "600", color: "#6B7280" },

  // Modal
  modal: { flex: 1, backgroundColor: "#FFFFFF" },
  modalHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: "#F3F4F6",
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  modalClose: { padding: 4 },
  modalBody: { flex: 1, padding: 20 },

  fieldLabel: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6, marginTop: 16 },

  imagePicker: {
    width: "100%", height: 160, borderRadius: 12,
    overflow: "hidden", backgroundColor: "#F3F4F6",
    borderWidth: 2, borderColor: "#E5E7EB", borderStyle: "dashed",
  },
  imagePreview: { width: "100%", height: "100%" },
  imageOverlay: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 8, gap: 6,
  },
  imageOverlayText: { color: "#FFFFFF", fontSize: 13, fontWeight: "600" },
  imagePlaceholder: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  imagePlaceholderText: { fontSize: 14, color: "#6B7280", fontWeight: "500" },
  imagePlaceholderSub: { fontSize: 11, color: "#9CA3AF" },

  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1, borderColor: "#E5E7EB",
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: "#111827",
  },
  inputMultiline: { minHeight: 80, textAlignVertical: "top" },

  providerPicker: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
    borderWidth: 1, borderColor: "#E5E7EB",
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
  },
  providerSelected: { flexDirection: "row", alignItems: "center", gap: 8 },
  providerSelectedText: { fontSize: 14, color: "#111827", fontWeight: "500" },
  providerPlaceholder: { flexDirection: "row", alignItems: "center", gap: 8 },
  providerPlaceholderText: { fontSize: 14, color: "#9CA3AF" },

  toggleRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginTop: 16, paddingVertical: 8,
  },
  toggleSubtitle: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },

  saveBtn: {
    backgroundColor: "#25D366", borderRadius: 12,
    paddingVertical: 15, alignItems: "center",
    marginTop: 24,
  },
  saveBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },

  // Provider list
  providerRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#FFFFFF", borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: "#E5E7EB",
  },
  providerAvatar: { width: 44, height: 44, borderRadius: 22 },
  providerInfo: { flex: 1 },
  providerName: { fontSize: 14, fontWeight: "600", color: "#111827" },
  providerCategory: { fontSize: 12, color: "#6B7280", marginTop: 2 },
});
