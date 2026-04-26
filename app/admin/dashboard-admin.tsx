import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  FlatList,
  StyleSheet,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/lib/auth-context";
import { adminDB, type Service } from "@/lib/admin-database";

const ADMIN_EMAIL = "pedroprezende33@gmail.com";

const CATEGORY_ICONS: Record<string, string> = {
  eletricista: "electrical-services",
  encanador: "plumbing",
  diarista: "cleaning-services",
  pintor: "format-paint",
  pedreiro: "construction",
  marceneiro: "carpenter",
  jardineiro: "yard",
  default: "build",
};

function getCategoryIcon(category: string): string {
  const key = category
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  for (const k of Object.keys(CATEGORY_ICONS)) {
    if (key.includes(k)) return CATEGORY_ICONS[k];
  }
  return CATEGORY_ICONS.default;
}

function ServiceCard({
  item,
  onEdit,
  onDelete,
}: {
  item: Service;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const iconName = getCategoryIcon(item.category) as any;
  return (
    <View style={styles.card}>
      <View style={styles.iconContainer}>
        <MaterialIcons name={iconName} size={28} color="#25D366" />
      </View>
      <View style={styles.cardInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.cardName} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{item.category}</Text>
          </View>
        </View>
        <Text style={styles.cardDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <Text style={styles.cardDate}>
          Criado em {new Date(item.createdAt).toLocaleDateString("pt-BR")}
        </Text>
      </View>
      <View style={styles.cardActions}>
        <Pressable
          style={({ pressed }) => [
            styles.actionBtn,
            styles.editBtn,
            pressed && { opacity: 0.7 },
          ]}
          onPress={onEdit}
        >
          <MaterialIcons name="edit" size={16} color="#3B82F6" />
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.actionBtn,
            styles.deleteBtn,
            pressed && { opacity: 0.7 },
          ]}
          onPress={onDelete}
        >
          <MaterialIcons name="delete-outline" size={16} color="#EF4444" />
        </Pressable>
      </View>
    </View>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [searchText, setSearchText] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
  });

  useEffect(() => {
    if (!user) {
      router.replace("/auth/login");
      return;
    }
    if (user.email !== ADMIN_EMAIL) {
      Alert.alert(
        "Acesso Negado",
        "Você não tem permissão para acessar este painel.",
        [{ text: "OK", onPress: () => router.replace("/(tabs)") }]
      );
      return;
    }
    loadServices();
  }, [user]);

  const loadServices = async () => {
    try {
      const allServices = await adminDB.getAllServices();
      setServices(allServices);
    } catch (err) {
      console.error("Erro ao carregar serviços:", err);
    }
  };

  const handleLogout = useCallback(() => {
    Alert.alert("Sair do Painel", "Tem certeza que deseja sair?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: () => {
          signOut()
            .then(() => {
              router.replace("/auth/login");
            })
            .catch(() => {
              router.replace("/auth/login");
            });
        },
      },
    ]);
  }, [signOut, router]);

  const openCreateModal = () => {
    setEditingService(null);
    setFormData({ name: "", category: "", description: "" });
    setShowModal(true);
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      category: service.category,
      description: service.description,
    });
    setShowModal(true);
  };

  const handleDeleteService = (serviceId: string, serviceName: string) => {
    Alert.alert(
      "Deletar Servico",
      `Tem certeza que deseja deletar "${serviceName}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Deletar",
          style: "destructive",
          onPress: async () => {
            try {
              await adminDB.deleteService(serviceId);
              setServices((prev) => prev.filter((s) => s.id !== serviceId));
            } catch (err: any) {
              Alert.alert("Erro", err.message);
            }
          },
        },
      ]
    );
  };

  const handleSaveService = async () => {
    if (
      !formData.name.trim() ||
      !formData.category.trim() ||
      !formData.description.trim()
    ) {
      Alert.alert("Campos obrigatorios", "Preencha nome, categoria e descricao.");
      return;
    }
    try {
      if (editingService) {
        const updated = await adminDB.updateService(editingService.id, {
          name: formData.name.trim(),
          category: formData.category.trim(),
          description: formData.description.trim(),
        });
        setServices((prev) =>
          prev.map((s) => (s.id === updated.id ? updated : s))
        );
      } else {
        if (!user) return;
        const newService = await adminDB.createService(
          user.id,
          formData.name.trim(),
          formData.category.trim(),
          formData.description.trim()
        );
        setServices((prev) => [...prev, newService]);
      }
      setShowModal(false);
    } catch (err: any) {
      Alert.alert("Erro", err.message);
    }
  };

  const filteredServices = services.filter(
    (s) =>
      s.name.toLowerCase().includes(searchText.toLowerCase()) ||
      s.category.toLowerCase().includes(searchText.toLowerCase())
  );

  if (!user || user.email !== ADMIN_EMAIL) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#F5F5F5",
        }}
      >
        <Text style={{ color: "#6B7280" }}>Verificando acesso...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Painel Admin</Text>
          <Text style={styles.headerSubtitle}>
            {services.length}{" "}
            {services.length === 1 ? "servico" : "servicos"}
          </Text>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.logoutBtn,
            pressed && { opacity: 0.7 },
          ]}
          onPress={handleLogout}
        >
          <MaterialIcons name="logout" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Sair</Text>
        </Pressable>
      </View>

      {/* Search + Add */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <MaterialIcons name="search" size={18} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar servico ou categoria..."
            placeholderTextColor="#9CA3AF"
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <Pressable onPress={() => setSearchText("")}>
              <MaterialIcons name="close" size={18} color="#9CA3AF" />
            </Pressable>
          )}
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.addBtn,
            pressed && { opacity: 0.8 },
          ]}
          onPress={openCreateModal}
        >
          <MaterialIcons name="add" size={22} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Stats bar */}
      <View style={styles.statsBar}>
        <MaterialIcons name="admin-panel-settings" size={15} color="#25D366" />
        <Text style={styles.statsText}>
          Logado como{" "}
          <Text style={{ fontWeight: "700" }}>{user.name || user.email}</Text>
        </Text>
      </View>

      {/* List */}
      <FlatList
        data={filteredServices}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <ServiceCard
            item={item}
            onEdit={() => handleEditService(item)}
            onDelete={() => handleDeleteService(item.id, item.name)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialIcons name="inbox" size={52} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>
              {searchText ? "Nenhum resultado" : "Nenhum servico ainda"}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchText
                ? "Tente outro termo de busca"
                : 'Toque em "+" para criar o primeiro servico'}
            </Text>
          </View>
        }
      />

      {/* Modal Criar / Editar */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingService ? "Editar Servico" : "Novo Servico"}
              </Text>
              <Pressable
                style={({ pressed }) => [
                  styles.modalCloseBtn,
                  pressed && { opacity: 0.6 },
                ]}
                onPress={() => setShowModal(false)}
              >
                <MaterialIcons name="close" size={22} color="#6B7280" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.fieldLabel}>Nome do Servico</Text>
              <View style={styles.fieldBox}>
                <MaterialIcons name="build" size={18} color="#9CA3AF" />
                <TextInput
                  style={styles.fieldInput}
                  placeholder="Ex: Eletricista Residencial"
                  placeholderTextColor="#9CA3AF"
                  value={formData.name}
                  onChangeText={(t) => setFormData({ ...formData, name: t })}
                  returnKeyType="next"
                />
              </View>

              <Text style={styles.fieldLabel}>Categoria</Text>
              <View style={styles.fieldBox}>
                <MaterialIcons name="category" size={18} color="#9CA3AF" />
                <TextInput
                  style={styles.fieldInput}
                  placeholder="Ex: Eletricista, Diarista, Pintor"
                  placeholderTextColor="#9CA3AF"
                  value={formData.category}
                  onChangeText={(t) =>
                    setFormData({ ...formData, category: t })
                  }
                  returnKeyType="next"
                />
              </View>

              <Text style={styles.fieldLabel}>Descricao</Text>
              <View style={[styles.fieldBox, styles.fieldBoxMultiline]}>
                <TextInput
                  style={[styles.fieldInput, styles.fieldInputMultiline]}
                  placeholder="Descreva o servico oferecido..."
                  placeholderTextColor="#9CA3AF"
                  value={formData.description}
                  onChangeText={(t) =>
                    setFormData({ ...formData, description: t })
                  }
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.modalActions}>
                <Pressable
                  style={({ pressed }) => [
                    styles.cancelBtn,
                    pressed && { opacity: 0.7 },
                  ]}
                  onPress={() => setShowModal(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.saveBtn,
                    pressed && { opacity: 0.8 },
                  ]}
                  onPress={handleSaveService}
                >
                  <MaterialIcons
                    name={editingService ? "check" : "add"}
                    size={18}
                    color="#fff"
                  />
                  <Text style={styles.saveBtnText}>
                    {editingService ? "Salvar" : "Criar Servico"}
                  </Text>
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
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerLeft: { gap: 2 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  headerSubtitle: { fontSize: 12, color: "#6B7280" },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#FEF2F2",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  logoutText: { fontSize: 13, fontWeight: "600", color: "#EF4444" },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    backgroundColor: "#FFFFFF",
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: "#111827", padding: 0 },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#25D366",
    alignItems: "center",
    justifyContent: "center",
  },
  statsBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  statsText: { fontSize: 13, color: "#374151" },
  listContent: { padding: 16, paddingBottom: 32 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  cardInfo: { flex: 1, gap: 3 },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  cardName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    flexShrink: 1,
  },
  categoryBadge: {
    backgroundColor: "#EFF6FF",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  categoryBadgeText: { fontSize: 10, fontWeight: "700", color: "#2563EB" },
  cardDescription: { fontSize: 12, color: "#6B7280", lineHeight: 17 },
  cardDate: { fontSize: 11, color: "#9CA3AF", marginTop: 2 },
  cardActions: { flexDirection: "column", gap: 6, marginLeft: 8 },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  editBtn: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  deleteBtn: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  empty: { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: "#374151" },
  emptySubtitle: {
    fontSize: 13,
    color: "#9CA3AF",
    textAlign: "center",
    paddingHorizontal: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: "90%",
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E5E7EB",
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    marginBottom: 4,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
    marginTop: 12,
  },
  fieldBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  fieldBoxMultiline: { alignItems: "flex-start", paddingTop: 12 },
  fieldInput: { flex: 1, fontSize: 14, color: "#111827", padding: 0 },
  fieldInputMultiline: { minHeight: 80, textAlignVertical: "top" },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 24 },
  cancelBtn: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  cancelBtnText: { fontSize: 15, fontWeight: "600", color: "#374151" },
  saveBtn: {
    flex: 2,
    backgroundColor: "#25D366",
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  saveBtnText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
});
