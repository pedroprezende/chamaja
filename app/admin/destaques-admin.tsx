import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Image,
  Switch,
  ActivityIndicator,
  Modal,
  Alert,
  TextInput,
  Platform,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { AdminTabBar } from "@/components/admin/AdminTabBar";
import { trpc } from "@/lib/trpc";
import { storage } from "@/lib/storage";

type TabType = "em-destaque" | "todos";

export default function DestaquesAdmin() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("em-destaque");

  const utils = trpc.useUtils();

  // ── tRPC Queries ──
  const { data: ads = [], isLoading: loadingAds } =
    trpc.featuredAds.list.useQuery();
  const { data: providers = [], isLoading: loadingProvs } =
    trpc.providers.all.useQuery();

  const [toggling, setToggling] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);

  // Step 2 State
  const [selectedProvider, setSelectedProvider] = useState<any | null>(null);
  const [customAdDescription, setCustomAdDescription] = useState("");
  const [customAdImage, setCustomAdImage] = useState<string | null>(null);

  const pickAdImage = async () => {
    try {
      if (Platform.OS !== "web") {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permissão necessária",
            "Permita o acesso à galeria para adicionar imagens.",
          );
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
        base64: true,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const uri =
          Platform.OS === "web" && asset.base64
            ? `data:image/jpeg;base64,${asset.base64}`
            : asset.uri;
        setCustomAdImage(uri);
      }
    } catch (err: any) {
      console.error("[Admin] Erro ao selecionar foto de capa do anúncio:", err);
    }
  };

  // ── Mutations ──
  const toggleMutation = trpc.featuredAds.toggle.useMutation({
    onSuccess: () => utils.featuredAds.list.invalidate(),
    onError: (err) =>
      Alert.alert(
        "Erro",
        "Não foi possível alterar o destaque: " + err.message,
      ),
    onSettled: () => setToggling(null),
  });

  const deleteMutation = trpc.featuredAds.delete.useMutation({
    onSuccess: () => {
      utils.featuredAds.list.invalidate();
      setConfirmDeleteId(null);
    },
    onError: (err) =>
      Alert.alert("Erro", "Não foi possível excluir: " + err.message),
  });

  const createMutation = trpc.featuredAds.create.useMutation({
    onSuccess: () => {
      console.log("[Admin] Destaque criado com sucesso");
      utils.featuredAds.list.invalidate();
      setModalVisible(false);
      setSelectedProvider(null);
      setCustomAdDescription("");
      setCustomAdImage(null);
      setActiveTab("em-destaque");
    },
    onError: (err) => {
      console.error("[Admin] Erro ao criar destaque:", err);
      Alert.alert(
        "Erro ao salvar anúncio",
        "Não foi possível adicionar aos destaques: " +
          (err.message || "Permissão ou servidor indisponível"),
      );
    },
    onSettled: () => setSaving(false),
  });

  const handleToggle = (adId: string) => {
    console.log("[Admin] Toggling ad:", adId);
    setToggling(adId);
    toggleMutation.mutate({ id: adId });
  };

  const handleDelete = (adId: string) => {
    deleteMutation.mutate({ id: adId });
  };

  const handleSelectProvider = (p: any) => {
    setSelectedProvider(p);
    setCustomAdDescription("");
  };

  const handleConfirmAdd = async () => {
    if (!selectedProvider) return;

    setSaving(true);
    try {
      let adImageUrl: string | null = null;
      if (customAdImage) {
        try {
          adImageUrl = await storage.uploadImage(customAdImage, "providers");
        } catch (imgErr: any) {
          console.error("[Admin] Upload do storage falhou:", imgErr);
          Alert.alert(
            "Erro no upload",
            "Não foi possível fazer o upload da imagem. " + (imgErr.message || "Tente novamente.")
          );
          setSaving(false);
          return;
        }
      }

      await createMutation.mutateAsync({
        providerId: String(selectedProvider.id || `prov-${Date.now()}`),
        providerName: String(selectedProvider.name || "Prestador"),
        providerAvatar: selectedProvider.avatarUri || null,
        categoryName: selectedProvider.category || "Geral",
        customDescription: customAdDescription || "",
        adImageUrl: adImageUrl || null,
        isFeatured: true,
      });
    } catch (e: any) {
      console.error("[Admin] Erro no fluxo de criação de anúncio:", e);
      Alert.alert(
        "Erro ao salvar",
        "Não foi possível salvar o anúncio: " +
          (e.message || "Verifique as permissões de administrador."),
      );
      setSaving(false);
    }
  };

  const displayAds =
    activeTab === "em-destaque" ? ads.filter((a) => a.isFeatured) : ads;

  const featuredCount = ads.filter((a) => a.isFeatured).length;

  const filteredProviders = useMemo(() => {
    if (!searchQuery.trim()) return providers;
    const q = searchQuery.toLowerCase();
    return providers.filter(
      (p) =>
        (typeof p.name === "string" && p.name.toLowerCase().includes(q)) ||
        (typeof p.category === "string" &&
          p.category.toLowerCase().includes(q)),
    );
  }, [providers, searchQuery]);

  const loading = loadingAds || loadingProvs;

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable
          style={styles.backBtn}
          onPress={() => router.push("/admin/dashboard-admin" as any)}
        >
          <MaterialIcons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text style={styles.headerTitle}>Destaques</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{featuredCount}</Text>
        </View>
        <Pressable
          style={styles.newBtn}
          onPress={() => {
            setSearchQuery("");
            setModalVisible(true);
          }}
        >
          <MaterialIcons name="add" size={18} color="#FFF" />
          <Text style={styles.newBtnText}>Novo</Text>
        </Pressable>
      </View>

      <View style={styles.tabs}>
        {(
          [
            ["em-destaque", "Em destaque"],
            ["todos", "Todos os anúncios"],
          ] as [TabType, string][]
        ).map(([key, label]) => (
          <Pressable
            key={key}
            style={[styles.tab, activeTab === key && styles.tabActive]}
            onPress={() => setActiveTab(key)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === key && styles.tabTextActive,
              ]}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#25D366" size="large" />
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
        >
          <Text style={styles.listHint}>
            {activeTab === "em-destaque"
              ? `${featuredCount} anúncio${featuredCount !== 1 ? "s" : ""} em destaque no topo do app.`
              : "Ative o destaque para exibir no topo do aplicativo."}
          </Text>

          <View style={styles.adList}>
            {displayAds.map((ad, idx) => (
              <View
                key={ad.id}
                style={[
                  styles.adCard,
                  idx < displayAds.length - 1 && styles.adBorder,
                ]}
              >
                {activeTab === "em-destaque" && (
                  <View style={styles.posNum}>
                    <Text style={styles.posNumText}>{idx + 1}</Text>
                  </View>
                )}
                {ad.imageUrl ? (
                  <Image source={{ uri: ad.imageUrl }} style={styles.adImage} />
                ) : (
                  <View style={[styles.adImage, styles.adImagePlaceholder]}>
                    <MaterialIcons name="person" size={22} color="#D1D5DB" />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.adName} numberOfLines={1}>
                    {ad.providerName}
                  </Text>
                  <Text style={styles.adCategory}>{ad.title}</Text>
                  <View style={styles.viewsRow}>
                    <MaterialIcons
                      name="visibility"
                      size={12}
                      color="#9CA3AF"
                    />
                    <Text style={styles.viewsText}>
                      {(ad.viewCount || 0).toLocaleString("pt-BR")}{" "}
                      visualizações
                    </Text>
                  </View>
                </View>
                <View style={styles.adRight}>
                  {toggling === ad.id ? (
                    <ActivityIndicator size="small" color="#25D366" />
                  ) : (
                    <Switch
                      value={ad.isFeatured}
                      onValueChange={() => handleToggle(ad.id)}
                      trackColor={{ false: "#E5E7EB", true: "#BBF7D0" }}
                      thumbColor={ad.isFeatured ? "#25D366" : "#D1D5DB"}
                      style={{
                        transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }],
                      }}
                    />
                  )}
                  {confirmDeleteId === ad.id ? (
                    <Pressable
                      style={styles.deleteConfirmBtn}
                      onPress={() => handleDelete(ad.id)}
                    >
                      {deleteMutation.isPending && confirmDeleteId === ad.id ? (
                        <ActivityIndicator size="small" color="#FFF" />
                      ) : (
                        <Text style={styles.deleteConfirmText}>Excluir</Text>
                      )}
                    </Pressable>
                  ) : (
                    <Pressable
                      style={styles.deleteBtn}
                      onPress={() => setConfirmDeleteId(ad.id)}
                    >
                      <MaterialIcons
                        name="delete-outline"
                        size={20}
                        color="#EF4444"
                      />
                    </Pressable>
                  )}
                </View>
              </View>
            ))}
          </View>

          {displayAds.length === 0 && (
            <View style={styles.emptyState}>
              <MaterialIcons name="star-border" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>
                {activeTab === "em-destaque"
                  ? "Nenhum destaque ativo"
                  : "Nenhum anúncio"}
              </Text>
              {activeTab === "em-destaque" && (
                <Pressable onPress={() => setActiveTab("todos")}>
                  <Text style={styles.emptyAction}>
                    Ver todos os anúncios →
                  </Text>
                </Pressable>
              )}
            </View>
          )}
          <View style={{ height: 20 }} />
        </ScrollView>
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setModalVisible(false);
          setSelectedProvider(null);
          setCustomAdImage(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
              >
                {selectedProvider && (
                  <Pressable
                    onPress={() => {
                      setSelectedProvider(null);
                      setCustomAdImage(null);
                    }}
                  >
                    <MaterialIcons
                      name="arrow-back"
                      size={24}
                      color="#111827"
                    />
                  </Pressable>
                )}
                <Text style={styles.modalTitle}>
                  {selectedProvider
                    ? "Personalizar Anúncio"
                    : "Vincular Prestador"}
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  setModalVisible(false);
                  setSelectedProvider(null);
                  setCustomAdImage(null);
                }}
              >
                <MaterialIcons name="close" size={24} color="#6B7280" />
              </Pressable>
            </View>

            {!selectedProvider ? (
              <>
                <View style={styles.searchBox}>
                  <MaterialIcons name="search" size={20} color="#9CA3AF" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar prestador..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>
                <ScrollView style={{ flex: 1 }}>
                  {filteredProviders.map((p) => (
                    <Pressable
                      key={p.id}
                      style={styles.providerItem}
                      onPress={() => handleSelectProvider(p)}
                    >
                      {p.avatarUri ? (
                        <Image
                          source={{ uri: p.avatarUri }}
                          style={styles.providerAvatar}
                        />
                      ) : (
                        <View style={styles.providerAvatarPlaceholder}>
                          <MaterialIcons
                            name="person"
                            size={20}
                            color="#D1D5DB"
                          />
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={styles.providerName}>{p.name}</Text>
                        <Text style={styles.providerService}>
                          {p.category || "Especialista"}
                        </Text>
                      </View>
                      <MaterialIcons
                        name="add-circle-outline"
                        size={24}
                        color="#25D366"
                      />
                    </Pressable>
                  ))}
                  {filteredProviders.length === 0 && (
                    <Text
                      style={{
                        textAlign: "center",
                        color: "#9CA3AF",
                        marginTop: 20,
                      }}
                    >
                      Nenhum prestador encontrado.
                    </Text>
                  )}
                </ScrollView>
              </>
            ) : (
              <ScrollView
                style={styles.step2Container}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.selectedPreview}>
                  <Image
                    source={{
                      uri:
                        selectedProvider.avatarUri ||
                        "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=800&q=80",
                    }}
                    style={styles.previewAvatar}
                  />
                  <View>
                    <Text style={styles.previewName}>
                      {selectedProvider.name}
                    </Text>
                    <Text style={styles.previewCategory}>
                      {selectedProvider.category || "Profissional"}
                    </Text>
                  </View>
                </View>

                <Text style={styles.inputLabel}>
                  Imagem do Banner (Opcional - Proporção 16:9)
                </Text>
                <Pressable
                  style={({ pressed }) => [
                    styles.imagePicker,
                    pressed && { opacity: 0.85 },
                  ]}
                  onPress={pickAdImage}
                >
                  {customAdImage ? (
                    <View
                      style={{
                        position: "relative",
                        width: "100%",
                        height: "100%",
                      }}
                    >
                      <Image
                        source={{ uri: customAdImage }}
                        style={styles.imagePreview}
                        resizeMode="cover"
                      />
                      <View style={styles.imageOverlay}>
                        <MaterialIcons
                          name="photo-camera"
                          size={20}
                          color="#FFFFFF"
                        />
                        <Text style={styles.imageOverlayText}>
                          Trocar imagem do anúncio
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <MaterialIcons
                        name="add-photo-alternate"
                        size={32}
                        color="#9CA3AF"
                      />
                      <Text style={styles.imagePlaceholderText}>
                        Selecionar foto para o anúncio
                      </Text>
                      <Text style={styles.imagePlaceholderSub}>
                        Se não escolher, usará a foto de perfil do prestador
                      </Text>
                    </View>
                  )}
                </Pressable>

                <Text style={styles.inputLabel}>
                  Descrição do Anúncio (Opcional)
                </Text>
                <TextInput
                  style={styles.textArea}
                  placeholder="Ex: Melhores serviços automotivos da região com 20% de desconto!"
                  value={customAdDescription}
                  onChangeText={setCustomAdDescription}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />

                <Pressable
                  style={[
                    styles.confirmBtn,
                    saving && styles.confirmBtnDisabled,
                  ]}
                  onPress={handleConfirmAdd}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.confirmBtnText}>
                      Confirmar e Publicar
                    </Text>
                  )}
                </Pressable>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <AdminTabBar />
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
    gap: 10,
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "800", color: "#111827" },
  countBadge: {
    backgroundColor: "#DCFCE7",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  countBadgeText: { fontSize: 13, fontWeight: "800", color: "#15803D" },
  newBtn: {
    flexDirection: "row",
    backgroundColor: "#25D366",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: "center",
    gap: 4,
  },
  newBtnText: { color: "#FFF", fontWeight: "700", fontSize: 13 },
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
  tabText: { fontSize: 13, fontWeight: "600", color: "#9CA3AF" },
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
  adList: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    overflow: "hidden",
  },
  adCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 10,
  },
  adBorder: { borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  posNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#25D366",
    alignItems: "center",
    justifyContent: "center",
  },
  posNumText: { fontSize: 12, fontWeight: "800", color: "#FFF" },
  adImage: { width: 46, height: 46, borderRadius: 10 },
  adImagePlaceholder: {
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  adName: { fontSize: 14, fontWeight: "700", color: "#111827" },
  adCategory: { fontSize: 12, color: "#6B7280", marginTop: 1 },
  viewsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 3,
  },
  viewsText: { fontSize: 11, color: "#9CA3AF" },
  adRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  deleteBtn: {
    padding: 8,
    backgroundColor: "#FEF2F2",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  deleteConfirmBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#EF4444",
    borderRadius: 8,
  },
  deleteConfirmText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "700",
  },
  emptyState: { alignItems: "center", paddingVertical: 48, gap: 10 },
  emptyText: { fontSize: 16, fontWeight: "700", color: "#9CA3AF" },
  emptyAction: { fontSize: 14, fontWeight: "600", color: "#25D366" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    height: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#111827" },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15 },
  providerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    gap: 12,
    ...Platform.select({
      web: { cursor: "pointer" } as any,
    }),
  },
  providerAvatar: { width: 40, height: 40, borderRadius: 20 },
  providerAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  providerName: { fontSize: 15, fontWeight: "600", color: "#111827" },
  providerService: { fontSize: 13, color: "#6B7280" },

  // Step 2 Styles
  step2Container: { marginTop: 8 },
  selectedPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  previewAvatar: { width: 48, height: 48, borderRadius: 24 },
  previewName: { fontSize: 16, fontWeight: "700", color: "#111827" },
  previewCategory: { fontSize: 14, color: "#6B7280" },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  textArea: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: "#111827",
    minHeight: 100,
  },
  imagePicker: {
    height: 140,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    overflow: "hidden",
    backgroundColor: "#F9FAFB",
    marginBottom: 16,
  },
  imagePreview: { width: "100%", height: "100%" },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  imageOverlayText: { color: "#FFFFFF", fontSize: 13, fontWeight: "600" },
  imagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    padding: 20,
  },
  imagePlaceholderText: { fontSize: 14, fontWeight: "600", color: "#374151" },
  imagePlaceholderSub: {
    fontSize: 11,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 2,
  },
  confirmBtn: {
    backgroundColor: "#25D366",
    borderRadius: 12,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
  },
  confirmBtnDisabled: { opacity: 0.6 },
  confirmBtnText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
});
