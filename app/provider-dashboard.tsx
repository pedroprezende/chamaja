import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  FlatList,
  Modal,
  TextInput,
  Alert,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { useProvider, PLANS, type ProviderService } from "@/lib/provider-context";

export default function ProviderDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { provider, isProvider, addService, updateService, deleteService, renewPlan } = useProvider();
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<ProviderService | null>(null);
  const [form, setForm] = useState({ name: "", description: "", imageUri: "", gallery: [] as string[] });

  if (!isProvider || !provider) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, alignItems: "center", justifyContent: "center" }]}>
        <MaterialIcons name="lock" size={56} color="#D1D5DB" />
        <Text style={styles.emptyTitle}>Área exclusiva para prestadores</Text>
        <Pressable
          style={({ pressed }) => [styles.ctaBtn, pressed && { opacity: 0.85 }]}
          onPress={() => router.replace("/become-provider" as any)}
        >
          <Text style={styles.ctaBtnText}>Tornar-me prestador</Text>
        </Pressable>
      </View>
    );
  }

  const plan = provider.plan ? PLANS[provider.plan] : null;
  const expiresAt = provider.planExpiresAt
    ? new Date(provider.planExpiresAt).toLocaleDateString("pt-BR")
    : null;

  const openCreateModal = () => {
    setEditingService(null);
    setForm({ name: "", description: "", imageUri: "", gallery: [] });
    setShowModal(true);
  };

  const openEditModal = (service: ProviderService) => {
    setEditingService(service);
    setForm({
      name: service.name,
      description: service.description,
      imageUri: service.imageUri || "",
      gallery: service.gallery || [],
    });
    setShowModal(true);
  };

  const handlePickGalleryPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.85,
      allowsMultipleSelection: true,
    });
    if (!result.canceled) {
      const newUris = result.assets.map((a) => a.uri);
      setForm((prev) => ({ ...prev, gallery: [...prev.gallery, ...newUris].slice(0, 8) }));
    }
  };

  const removeGalleryPhoto = (index: number) => {
    setForm((prev) => ({ ...prev, gallery: prev.gallery.filter((_, i) => i !== index) }));
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.85,
    });
    if (!result.canceled) {
      setForm((prev) => ({ ...prev, imageUri: result.assets[0].uri }));
    }
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.description.trim()) {
      Alert.alert("Erro", "Preencha nome e descrição do serviço.");
      return;
    }
    if (editingService) {
      await updateService(editingService.id, {
        name: form.name.trim(),
        description: form.description.trim(),
        imageUri: form.imageUri || undefined,
        gallery: form.gallery.length > 0 ? form.gallery : undefined,
      });
    } else {
      await addService({
        name: form.name.trim(),
        description: form.description.trim(),
        imageUri: form.imageUri || undefined,
        gallery: form.gallery.length > 0 ? form.gallery : undefined,
      });
    }
    setShowModal(false);
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert("Remover serviço", `Remover "${name}"?`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Remover", style: "destructive", onPress: () => deleteService(id) },
    ]);
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
        <Text style={styles.headerTitle}>Minha Área</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Profile card */}
        <View style={styles.profileCard}>
          <Image source={{ uri: provider.avatar }} style={styles.avatar} />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{provider.name}</Text>
            <Text style={styles.profileCategory}>{provider.category}</Text>
            <Text style={styles.profileCity}>{provider.city} — {provider.neighborhood}</Text>
          </View>
        </View>

        {/* Plan card */}
        <View style={styles.planCard}>
          <View style={styles.planLeft}>
            <MaterialIcons name="workspace-premium" size={22} color="#25D366" />
            <View>
              <Text style={styles.planLabel}>Plano {plan?.label || "Inativo"}</Text>
              {expiresAt && <Text style={styles.planExpiry}>Válido até {expiresAt}</Text>}
            </View>
          </View>
          <Pressable
            style={({ pressed }) => [styles.renewBtn, pressed && { opacity: 0.7 }]}
            onPress={() => {
              Alert.alert("Renovar plano", "Escolha o plano:", [
                { text: "Mensal — R$10,00", onPress: () => renewPlan("monthly") },
                { text: "Anual — R$99,90", onPress: () => renewPlan("annual") },
                { text: "Cancelar", style: "cancel" },
              ]);
            }}
          >
            <Text style={styles.renewBtnText}>Renovar</Text>
          </Pressable>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{provider.services.length}</Text>
            <Text style={styles.statLabel}>Serviços</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Contatos</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>5.0</Text>
            <Text style={styles.statLabel}>Avaliação</Text>
          </View>
        </View>

        {/* Services section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Meus Serviços</Text>
          <Pressable
            style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.8 }]}
            onPress={openCreateModal}
          >
            <MaterialIcons name="add" size={18} color="#fff" />
            <Text style={styles.addBtnText}>Adicionar</Text>
          </Pressable>
        </View>

        {provider.services.length === 0 ? (
          <View style={styles.emptyServices}>
            <MaterialIcons name="add-circle-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>Nenhum serviço cadastrado</Text>
            <Text style={styles.emptySubtitle}>Adicione os serviços que você oferece</Text>
          </View>
        ) : (
          provider.services.map((svc) => (
            <View key={svc.id} style={styles.serviceCard}>
              {svc.imageUri ? (
                <Image source={{ uri: svc.imageUri }} style={styles.serviceThumbnail} resizeMode="cover" />
              ) : (
                <View style={styles.serviceIconPlaceholder}>
                  <MaterialIcons name="build" size={24} color="#25D366" />
                </View>
              )}
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{svc.name}</Text>
                <Text style={styles.serviceDesc} numberOfLines={2}>{svc.description}</Text>
              </View>
              <View style={styles.serviceActions}>
                <Pressable
                  style={({ pressed }) => [styles.actionBtn, styles.editBtn, pressed && { opacity: 0.7 }]}
                  onPress={() => openEditModal(svc)}
                >
                  <MaterialIcons name="edit" size={16} color="#3B82F6" />
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.actionBtn, styles.deleteBtn, pressed && { opacity: 0.7 }]}
                  onPress={() => handleDelete(svc.id, svc.name)}
                >
                  <MaterialIcons name="delete-outline" size={16} color="#EF4444" />
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Modal */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingService ? "Editar Serviço" : "Novo Serviço"}</Text>
              <Pressable
                style={({ pressed }) => [styles.modalCloseBtn, pressed && { opacity: 0.6 }]}
                onPress={() => setShowModal(false)}
              >
                <MaterialIcons name="close" size={22} color="#6B7280" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.fieldLabel}>Imagem (opcional)</Text>
              <Pressable
                style={({ pressed }) => [styles.imagePickerBtn, pressed && { opacity: 0.8 }]}
                onPress={handlePickImage}
              >
                {form.imageUri ? (
                  <View style={styles.imagePreviewWrapper}>
                    <Image source={{ uri: form.imageUri }} style={styles.imagePreview} resizeMode="cover" />
                    <View style={styles.imageEditOverlay}>
                      <MaterialIcons name="edit" size={18} color="#fff" />
                      <Text style={styles.imageEditText}>Trocar foto</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <MaterialIcons name="add-photo-alternate" size={28} color="#9CA3AF" />
                    <Text style={styles.imagePlaceholderText}>Adicionar foto</Text>
                  </View>
                )}
              </Pressable>

              <Text style={styles.fieldLabel}>Nome do serviço</Text>
              <View style={styles.fieldBox}>
                <MaterialIcons name="build" size={18} color="#9CA3AF" />
                <TextInput
                  style={styles.fieldInput}
                  placeholder="Ex: Instalação elétrica"
                  placeholderTextColor="#9CA3AF"
                  value={form.name}
                  onChangeText={(t) => setForm({ ...form, name: t })}
                />
              </View>

              <Text style={styles.fieldLabel}>Descrição</Text>
              <View style={[styles.fieldBox, { alignItems: "flex-start", paddingTop: 12 }]}>
                <TextInput
                  style={[styles.fieldInput, { minHeight: 80, textAlignVertical: "top" }]}
                  placeholder="Descreva o serviço..."
                  placeholderTextColor="#9CA3AF"
                  value={form.description}
                  onChangeText={(t) => setForm({ ...form, description: t })}
                  multiline
                  numberOfLines={4}
                />
              </View>

              {/* Galeria de fotos do local */}
              <Text style={styles.fieldLabel}>Galeria de fotos do local (máx. 8)</Text>
              <Text style={[styles.fieldLabel, { fontSize: 11, color: "#9CA3AF", marginTop: -8, marginBottom: 8 }]}>
                Adicione fotos da fachada, interior e ambiente
              </Text>
              <View style={styles.galleryRow}>
                {form.gallery.map((uri, idx) => (
                  <View key={idx} style={styles.galleryThumbWrapper}>
                    <Image source={{ uri }} style={styles.galleryThumb} resizeMode="cover" />
                    <Pressable
                      style={styles.galleryRemoveBtn}
                      onPress={() => removeGalleryPhoto(idx)}
                    >
                      <MaterialIcons name="close" size={12} color="#fff" />
                    </Pressable>
                  </View>
                ))}
                {form.gallery.length < 8 && (
                  <Pressable
                    style={({ pressed }) => [styles.galleryAddBtn, pressed && { opacity: 0.7 }]}
                    onPress={handlePickGalleryPhoto}
                  >
                    <MaterialIcons name="add-photo-alternate" size={22} color="#25D366" />
                    <Text style={styles.galleryAddText}>Foto</Text>
                  </Pressable>
                )}
              </View>

              <View style={styles.modalActions}>
                <Pressable
                  style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.7 }]}
                  onPress={() => setShowModal(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85 }]}
                  onPress={handleSave}
                >
                  <MaterialIcons name={editingService ? "check" : "add"} size={18} color="#fff" />
                  <Text style={styles.saveBtnText}>{editingService ? "Salvar" : "Adicionar"}</Text>
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
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: "#F3F4F6",
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: "700", color: "#111827", textAlign: "center" },
  profileCard: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF",
    margin: 16, borderRadius: 16, padding: 16, gap: 14,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#E5E7EB" },
  profileInfo: { flex: 1, gap: 3 },
  profileName: { fontSize: 17, fontWeight: "700", color: "#111827" },
  profileCategory: { fontSize: 14, color: "#25D366", fontWeight: "600" },
  profileCity: { fontSize: 13, color: "#6B7280" },
  planCard: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "#F0FDF4", marginHorizontal: 16, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: "#BBF7D0", marginBottom: 12,
  },
  planLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  planLabel: { fontSize: 15, fontWeight: "700", color: "#111827" },
  planExpiry: { fontSize: 12, color: "#6B7280" },
  renewBtn: {
    backgroundColor: "#25D366", borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7,
  },
  renewBtnText: { fontSize: 13, fontWeight: "700", color: "#FFFFFF" },
  statsRow: {
    flexDirection: "row", backgroundColor: "#FFFFFF",
    marginHorizontal: 16, borderRadius: 14, padding: 16, marginBottom: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  statItem: { flex: 1, alignItems: "center", gap: 4 },
  statValue: { fontSize: 20, fontWeight: "700", color: "#111827" },
  statLabel: { fontSize: 12, color: "#6B7280" },
  statDivider: { width: 1, backgroundColor: "#E5E7EB", marginVertical: 4 },
  sectionHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, marginBottom: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  addBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#25D366", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7,
  },
  addBtnText: { fontSize: 13, fontWeight: "700", color: "#FFFFFF" },
  emptyServices: { alignItems: "center", paddingVertical: 40, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: "#374151" },
  emptySubtitle: { fontSize: 13, color: "#9CA3AF" },
  galleryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  galleryThumbWrapper: {
    width: 72,
    height: 72,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  },
  galleryThumb: {
    width: "100%",
    height: "100%",
  },
  galleryRemoveBtn: {
    position: "absolute",
    top: 3,
    right: 3,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  galleryAddBtn: {
    width: 72,
    height: 72,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#25D366",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: "#F0FDF4",
  },
  galleryAddText: {
    fontSize: 10,
    color: "#25D366",
    fontWeight: "600",
  },
  serviceCard: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF",
    marginHorizontal: 16, marginBottom: 10, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: "#F3F4F6",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  serviceThumbnail: { width: 56, height: 56, borderRadius: 10, backgroundColor: "#F3F4F6", marginRight: 12 },
  serviceIconPlaceholder: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: "#F0FDF4",
    alignItems: "center", justifyContent: "center", marginRight: 12,
    borderWidth: 1, borderColor: "#BBF7D0",
  },
  serviceInfo: { flex: 1, gap: 3 },
  serviceName: { fontSize: 15, fontWeight: "700", color: "#111827" },
  serviceDesc: { fontSize: 12, color: "#6B7280", lineHeight: 17 },
  serviceActions: { flexDirection: "column", gap: 6, marginLeft: 8 },
  actionBtn: { width: 34, height: 34, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  editBtn: { backgroundColor: "#EFF6FF", borderWidth: 1, borderColor: "#BFDBFE" },
  deleteBtn: { backgroundColor: "#FEF2F2", borderWidth: 1, borderColor: "#FECACA" },
  ctaBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: "#25D366", borderRadius: 14, paddingVertical: 16,
    marginHorizontal: 16, marginTop: 16, gap: 8,
  },
  ctaBtnText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: "#FFFFFF", borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingBottom: 40, maxHeight: "90%",
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
    borderRadius: 12, alignItems: "center", justifyContent: "center", gap: 6,
  },
  imagePlaceholderText: { fontSize: 13, color: "#9CA3AF" },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6, marginTop: 12 },
  fieldBox: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#F9FAFB",
    borderWidth: 1.5, borderColor: "#E5E7EB", borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 12, gap: 8,
  },
  fieldInput: { flex: 1, fontSize: 14, color: "#111827", padding: 0 },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 24 },
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
});
